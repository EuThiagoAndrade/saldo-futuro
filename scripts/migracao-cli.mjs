import { mkdir, readFile, realpath, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { simularBanco } from "../src/lib/migracao/simular.ts";
import { serializarEstavel, sha256 } from "../src/lib/migracao/quantias.ts";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argumentos = process.argv.slice(2);

function foraDoDiretorio(base, destino) {
  const relativo = path.relative(base, destino);
  return relativo === ".." || relativo.startsWith(`..${path.sep}`) || path.isAbsolute(relativo);
}

async function obterLocal() {
  const raizReal = await realpath(raiz);
  const local = await realpath(path.resolve(raiz, "local"));
  if (local === raizReal || foraDoDiretorio(raizReal, local) || !(await stat(local)).isDirectory()) {
    throw new Error("local/ precisa ser um diretório dentro do repositório.");
  }
  return local;
}

function argumento(nome, padrao) {
  const indice = argumentos.indexOf(nome);
  return indice < 0 ? padrao : argumentos[indice + 1];
}

async function caminhoLocal(valor) {
  const local = await obterLocal();
  const resolvido = await realpath(path.resolve(raiz, valor));
  const relativo = path.relative(local, resolvido);
  if (!relativo || relativo === "." || foraDoDiretorio(local, resolvido)) {
    throw new Error("O arquivo de origem precisa estar dentro de local/.");
  }
  if (!(await stat(resolvido)).isFile()) throw new Error("A origem precisa ser um arquivo SQLite.");
  return resolvido;
}

async function diretorioLocal(valor) {
  const localLexico = path.resolve(raiz, "local");
  const local = await obterLocal();
  const destino = path.resolve(raiz, valor);
  const relativo = path.relative(localLexico, destino);
  if (foraDoDiretorio(localLexico, destino)) {
    throw new Error("O diretório de saída precisa estar dentro de local/.");
  }
  if (!relativo) return local;

  let atual = local;
  for (const parte of relativo.split(path.sep).filter(Boolean)) {
    const proximo = path.join(atual, parte);
    try {
      await mkdir(proximo);
    } catch (erro) {
      if (erro?.code !== "EEXIST") throw erro;
    }
    atual = await realpath(proximo);
    if (foraDoDiretorio(local, atual) || !(await stat(atual)).isDirectory()) {
      throw new Error("O diretório de saída precisa estar dentro de local/.");
    }
  }
  return atual;
}

async function calcularHashOrigem(caminhoBanco) {
  const local = await obterLocal();
  const banco = await readFile(caminhoBanco);
  let wal;
  try {
    const caminhoWal = `${caminhoBanco}-wal`;
    const walCanonico = await realpath(caminhoWal);
    if (foraDoDiretorio(local, walCanonico)) throw new Error("O arquivo WAL precisa estar dentro de local/.");
    wal = await readFile(walCanonico);
  } catch (erro) {
    if (erro?.code !== "ENOENT") throw erro;
  }
  try {
    const shmCanonico = await realpath(`${caminhoBanco}-shm`);
    if (foraDoDiretorio(local, shmCanonico)) throw new Error("O arquivo SHM precisa estar dentro de local/.");
  } catch (erro) {
    if (erro?.code !== "ENOENT") throw erro;
  }
  return sha256(serializarEstavel({ banco: sha256(banco), wal: wal ? sha256(wal) : null }));
}

function imprimirUso() {
  process.stderr.write(
    "Uso: npm run migracao -- simular --db local/arquivo.sqlite --user-id UUID [--out-dir local/migracao-issue-63]\n",
  );
}

if (argumentos[0] !== "simular") {
  imprimirUso();
  process.exitCode = 2;
} else {
  const entrada = argumento("--db", "local/meus-investimentos.sqlite");
  const usuarioDestino = argumento("--user-id", "");
  const diretorioSaidaArgumento = argumento("--out-dir", "local/migracao-issue-63");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usuarioDestino)) {
    process.stderr.write("Informe --user-id com o UUID do usuário de destino.\n");
    process.exitCode = 2;
  } else {
    try {
      const caminhoBanco = await caminhoLocal(entrada);
      const hashAntes = await calcularHashOrigem(caminhoBanco);
      const banco = new DatabaseSync(caminhoBanco, { readOnly: true });
      let resultado;
      try {
        resultado = simularBanco(banco, { usuarioDestino, sha256Origem: hashAntes });
      } finally {
        banco.close();
      }
      const hashDepois = await calcularHashOrigem(caminhoBanco);
      if (hashDepois !== hashAntes) throw new Error("A origem mudou durante a simulação.");
      const shaOrigem = hashAntes;

      const diretorioSaida = await diretorioLocal(diretorioSaidaArgumento);
      const nomeRelatorio = `relatorio-${shaOrigem}.json`;
      const caminhoRelatorio = path.join(diretorioSaida, nomeRelatorio);
      await writeFile(caminhoRelatorio, `${JSON.stringify(resultado.relatorio, null, 2)}\n`, { flag: "wx" }).catch(async (erro) => {
        if (erro?.code !== "EEXIST") throw erro;
        await writeFile(caminhoRelatorio, `${JSON.stringify(resultado.relatorio, null, 2)}\n`);
      });

      let arquivoPlano;
      if (resultado.ok) {
        arquivoPlano = `plano-${shaOrigem}-${resultado.plano.sha256Plano}.json`;
        await writeFile(path.join(diretorioSaida, arquivoPlano), `${JSON.stringify(resultado.plano, null, 2)}\n`, { flag: "wx" }).catch(async (erro) => {
          if (erro?.code !== "EEXIST") throw erro;
          const existente = await readFile(path.join(diretorioSaida, arquivoPlano), "utf8");
          if (existente !== `${JSON.stringify(resultado.plano, null, 2)}\n`) throw new Error("O plano existente diverge do hash calculado.");
        });
      }

      const resumoSaida = {
        estado: resultado.ok ? "simulada" : "recusada",
        resumo: resultado.resumo,
        recusas: resultado.ok ? [] : resultado.recusas.map(({ codigo, quantidade }) => ({ codigo, quantidade })),
        relatorio: path.relative(raiz, caminhoRelatorio).replaceAll("\\", "/"),
        ...(arquivoPlano ? { plano: path.relative(raiz, path.join(diretorioSaida, arquivoPlano)).replaceAll("\\", "/") } : {}),
      };
      process.stdout.write(`${JSON.stringify(resumoSaida)}\n`);
      if (!resultado.ok) process.exitCode = 2;
    } catch (erro) {
      const detalhe = erro instanceof Error ? erro.message : "erro desconhecido";
      process.stderr.write(`A simulação não foi concluída: ${detalhe}\n`);
      process.exitCode = 2;
    }
  }
}
