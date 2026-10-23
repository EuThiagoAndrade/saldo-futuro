# Auditoria registrada do histórico público — ciclo 011

> **Ciclo:** `011`
> **Issue:** `#116`
> **Plano:** `_project/executed/011_repositorio_publico_governanca_igpm/011_plan.md`, item 1
> **Método:** D-A1 (aprovado em 2026-10-22)
> **Data:** 2026-10-22 (horário de Cuiabá)
> **Base:** `main` em `07adff78c33d8b5565e5ef77d425ced33a3f6d01`, igual a `origin/main`

## Conclusão

Nenhum segredo e nenhum dado do usuário foi encontrado no histórico Git público nem no texto público do GitHub. As 1.547 ocorrências de padrões foram todas classificadas como falso positivo, por critério declarado; nenhuma ficou pendente e nenhuma é achado. Uma das classificações dependeu de decisão do responsável: um e-mail pessoal dele nos metadados de autoria de commits foi aceito como identidade de autoria (ver "Triagem").

O secret scanning do GitHub está ativo, com proteção de push, e não tem alerta aberto nem resolvido. O `main` é protegido por um ruleset ativo. Há três alertas abertos do Dependabot, todos no `next`, corrigidos pela versão 16.4.1 (ver "Configurações observadas").

Este registro traz só totais, categorias, critérios e conclusões. As referências de cada ocorrência ficam no inventário local, ignorado pelo Git, cuja integridade é dada pelo SHA-256 abaixo.

## Alcance

Refs remotos buscados com as cabeças de PR (`git fetch origin --prune --tags '+refs/pull/*/head:refs/remotes/origin/pr/*'`). Commits locais não publicados ficam fora, por não serem públicos.

| Universo | Quantidade |
| :-- | --: |
| Refs remotos (branches e cabeças de PR) | 130, dos quais 75 cabeças de PR |
| Tags | 7 |
| Commits alcançáveis por refs remotos e tags | 236 |
| Blobs distintos | 913 (906 de texto e 7 binários; 20.081.331 bytes) |
| Blocos gzip+Base64 descompactados e varridos | 3 (séries de medição do ciclo 005) |
| Issues | 43 |
| PRs | 75 |
| Comentários em issues e PRs | 74 |
| Comentários de revisão em linhas de PR | 0 |
| Revisões de PR com texto | 0 |
| Releases | 7 |

## Método

### M1 — secret scanning do GitHub

`gh api repos/EuThiagoAndrade/saldo-futuro/secret-scanning/alerts` com `--jq` restrito a `number`, `state`, `secret_type` e `resolution`; o campo `secret` nunca foi lido. Alertas abertos: 0. Alertas resolvidos: 0. O histórico de varreduras (`secret-scanning/scan-history`) não está disponível sem GitHub Advanced Security; por isso a data da última varredura completa não é comprovada aqui, e o resultado de M1 se apoia na documentação de que a varredura cobre todo o histórico e as issues/PRs ([about secret scanning](https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning), lida em 2026-10-22).

### M2 — varredura de conteúdo

Script Node 24 sem dependências, executado de um diretório temporário fora do repositório e transcrito no anexo. Ele varre:

- o conteúdo de todos os blobs de texto alcançáveis por refs remotos e tags, inclusive o conteúdo descompactado dos blocos gzip+Base64;
- as mensagens de commit e de tag;
- títulos e corpos de issues, PRs e releases e os comentários, obtidos por `gh api --paginate` (`issues?state=all`, `issues/comments` e `releases`).

Padrões de segredo: chave privada, JWT, chave secreta e publicável do Supabase, menção a `service_role`, segredo de cliente e chave de API do Google, tokens do GitHub, chave AWS, URL `postgres://` com senha e atribuição genérica de segredo, senha, token ou chave com valor longo. Padrões de dado do usuário: e-mail, CPF formatado, valor monetário em `R$`, nomes de instituições financeiras, códigos de negociação da B3 e títulos do Tesouro.

**Extensão conservadora, sem ampliar o escopo:** além do previsto no plano, entraram os códigos da B3 e os títulos do Tesouro (para reduzir a limitação sobre ativos detidos), os blocos compactados do ciclo 005 e os e-mails de autor e committer dos metadados dos commits.

### M3 — arquivos e imagens

- Caminhos com extensão de dados ou segredo (`.sqlite`, `.db`, `.csv`, `.xlsx`, `.env*`, `.pem`, `.key`) em qualquer ref: **0**.
- Imagens versionadas: 4 PNG (ícones do app em três tamanhos e o ícone Apple) e 2 SVG (logos, também varridos como texto em M2). As 4 PNG foram revistas visualmente: só o símbolo do produto, sem texto nem dado.
- Outros binários: 3 fontes IBM Plex Sans (`.woff2`), de distribuição pública.
- Anexos `user-attachments` em issues e PRs: **0**; não houve download. As 66 imagens embutidas nos textos do GitHub são selos de estado da Vercel (65) e de compatibilidade do Dependabot (1).

### Triagem

Inventário local `local/011_auditoria/inventario.jsonl`, ignorado pelo Git, com uma linha por ocorrência: identificador `OC-…`, método, tipo, categoria, local, referência (SHA do blob ou do commit, número da issue ou PR, identificador do comentário), caminho, linha, grupo (mesmo valor e categoria), classe e critério. Nenhuma linha contém o valor ou o trecho encontrado.

As ocorrências foram agrupadas por categoria e valor, e cada grupo foi conferido manualmente pelo contexto da referência. Para os valores monetários em documentos e issues, as linhas sem marcador explícito de exemplo foram revistas uma a uma.

| Critério | Significado | Ocorrências |
| :-- | :-- | --: |
| C1 | E-mail de domínio reservado de teste (`example.com`) em testes, seed e planos; ou endereço `noreply`/de bot em mensagens de commit | 340 |
| C2 | Contato publicado com autorização no ciclo 010 (páginas legais), inclusive como e-mail de autoria, por igualdade | 247 |
| C3 | E-mail do modelo padrão comentado em `supabase/config.toml` | 2 |
| C4 | Senha ou segredo fictício de teste local (e2e e teste unitário) | 4 |
| C5 | Menção ao papel `service_role` sem chave; JWT e `sb_secret_` têm 0 ocorrência | 64 |
| C6 | Sequência com forma de código da B3 dentro de Base64 | 2 |
| C7 | Valor monetário fictício: cenário ou exemplo documentado (615), exemplo de formatação em `src/` e `design-system/` (89) ou valor de teste (52) | 756 |
| C8 | E-mail pessoal do responsável nos metadados de autoria, aceito como identidade de autoria por decisão dele em 2026-10-22 | 132 |

Fechamento por categoria:

| Tipo | Categoria | Ocorrências | Falso positivo | Achado | Pendente |
| :-- | :-- | --: | --: | --: | --: |
| Segredo | `service_role` | 64 | 64 | 0 | 0 |
| Segredo | atribuição genérica | 4 | 4 | 0 | 0 |
| Segredo | demais padrões | 0 | 0 | 0 | 0 |
| Dado | e-mail em conteúdo | 346 | 346 | 0 | 0 |
| Dado | e-mail em metadados de commit | 375 | 375 | 0 | 0 |
| Dado | valor monetário | 756 | 756 | 0 | 0 |
| Dado | código da B3 | 2 | 2 | 0 | 0 |
| Dado | CPF, instituição, título do Tesouro | 0 | 0 | 0 | 0 |
| **Total** | | **1.547** | **1.547** | **0** | **0** |

Por local: 955 em blobs, 204 em mensagens de commit, 1 em mensagem de tag, 12 em issues e PRs e 375 em metadados de commit. Nenhuma ocorrência em comentários, releases ou conteúdo descompactado.

**Integridade:** SHA-256 do inventário final `69da3a369ce572373d2f0523b9e70bc99e6c12898fab3453144a17111a8f37d6` (1.547 linhas, UTF-8, LF).

## Configurações observadas (M4, somente leitura)

Lidas por `gh api` em 2026-10-22; nada foi alterado.

| Item | Estado |
| :-- | :-- |
| Visibilidade | Público |
| Secret scanning | Ativo |
| Proteção de push do secret scanning | Ativa |
| Padrões não-provedor e checagem de validade | Desativados |
| Alertas e atualizações de segurança do Dependabot | Ativos |
| Relato privado de vulnerabilidade | Ativo |
| Proteção clássica de branch em `main` | Ausente |
| Ruleset `proteger-main` (branch padrão) | Ativo, sem atores de bypass: impede exclusão e force push; exige PR (0 aprovações) e os checks "Validate governance", "Lint, types, tests, build and preview e2e" e "Supabase local, database tests and auth e2e" |
| Métodos de merge do repositório | Só squash |
| Forks | Permitidos |
| Aprovação de workflows de PR de fork | Exigida para todos os colaboradores externos |
| Ações permitidas | Todas, sem fixação por SHA |
| Permissão padrão do `GITHUB_TOKEN` | Leitura; o token pode aprovar revisões de PR |
| Workflows | `ci.yml` e `governance.yml` em `pull_request`, `push` em `main` e `workflow_dispatch`, com `contents: read`; `release-please.yml` só em `push` em `main`, com escrita. Nenhum `pull_request_target`, `workflow_run` ou uso de `secrets.` |
| Alertas abertos do Dependabot | 3 (2 críticos e 1 alto), todos no pacote `next` de execução, corrigidos na 16.4.1 |

### Vercel — conferência do responsável

O agente não tem acesso à Vercel. Itens para o responsável conferir e relatar:

1. Proteção de forks da integração Git ativa, para que PRs de forks não façam deploy de preview sem autorização.
2. Nenhuma variável de ambiente em Preview e Development (KB-002, V2), para que um preview de fork não alcance o banco.
3. Proteção de deploy de preview conforme a preferência do responsável.

### Recomendações ao responsável, fora do ciclo

- Integrar a correção do `next` (a PR #113 do Dependabot leva a 16.4.1), porque a aplicação pública em produção tem alertas críticos abertos.
- Usar o e-mail `noreply` do GitHub nos próximos commits e, se quiser, ativar o bloqueio de pushes que exponham o e-mail pessoal nas configurações da conta. Os commits já publicados não mudam.
- Avaliar fixar ações por SHA. **Correção de 2026-10-22 (issue #117):** a versão anterior desta lista sugeria também avaliar desativar a permissão de o `GITHUB_TOKEN` aprovar PRs; a sugestão foi retirada, porque a KB-002 (passo G1) exige essa opção habilitada para o release-please abrir a PR de release.
- Avaliar os padrões não-provedor do secret scanning, se disponíveis no plano.

## Limitações

- Padrões heurísticos não reconhecem com segurança nomes de ativos detidos ou valores sem `R$`; a busca por códigos da B3 e títulos do Tesouro reduz, mas não elimina, esse risco.
- Clones, forks e caches de terceiros feitos desde a abertura não são alcançáveis.
- O histórico de varreduras do secret scanning não é legível sem Advanced Security.
- Arquivos binários não são varridos por padrão de texto; os 7 existentes foram identificados e revistos (ícones e fontes).

## Anexo — reprodução

1. Buscar os refs: `git fetch origin --prune --tags '+refs/pull/*/head:refs/remotes/origin/pr/*'`.
2. Exportar o texto do GitHub para um diretório fora do repositório (`items.jsonl`, `comments.jsonl`, `releases.jsonl`), um objeto `{k, ref, text}` por linha:
   - `gh api --paginate "repos/EuThiagoAndrade/saldo-futuro/issues?state=all&per_page=100" --jq '.[] | {k: (if .pull_request then "pr" else "issue" end), ref: ("#"+(.number|tostring)), text: ((.title//"")+"\n"+(.body//""))}'`
   - `gh api --paginate "repos/EuThiagoAndrade/saldo-futuro/issues/comments?per_page=100" --jq '.[] | {k:"comentario", ref: ((.issue_url|split("/")|last)+"#c"+(.id|tostring)), text: (.body//"")}'`
   - `gh api --paginate "repos/EuThiagoAndrade/saldo-futuro/releases?per_page=100" --jq '.[] | {k:"release", ref: .tag_name, text: ((.name//"")+"\n"+(.body//""))}'`
3. Executar `node scan.mjs <repositório> <diretório-gh> local/011_auditoria/inventario.jsonl`. Com `--grupos`, o script imprime um resumo por grupo para a triagem, sem o valor completo.
4. Acrescentar os metadados de autoria: para cada linha de `git log --remotes --tags --format='%H %ae %ce'` e cada papel (autor, committer) cujo e-mail não seja `noreply` nem de bot, uma ocorrência `email_metadado_commit`.
5. Classificar por grupo com os critérios C1 a C8 e conferir `pendente = 0`.

Script `scan.mjs` usado:

```js
// Auditoria do ciclo 011 (issue #116), método D-A1, passo M2. Node 24, sem dependências.
// Uso: node scan.mjs <repo> <dir-gh> <inventario.jsonl>
// Varre blobs alcançáveis por refs remotos e tags, mensagens de commit e de tag, e o texto
// de issues, PRs, comentários e releases. Grava uma linha por ocorrência no inventário, SEM
// o valor ou o trecho encontrado; imprime só contagens.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

const [repo, ghDir, inventario] = process.argv.slice(2);
const git = (...a) => execFileSync("git", ["-C", repo, ...a], { maxBuffer: 1 << 30 });

const PADROES = [
  // Segredos
  ["segredo", "chave_privada", /-----BEGIN [A-Z ]*PRIVATE KEY-----/g],
  ["segredo", "jwt", /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g],
  ["segredo", "supabase_secret", /\bsb_secret_[A-Za-z0-9_-]{10,}/g],
  ["segredo", "supabase_publishable", /\bsb_publishable_[A-Za-z0-9_-]{10,}/g],
  ["segredo", "service_role", /\bservice_role\b/g],
  ["segredo", "google_client_secret", /\bGOCSPX-[A-Za-z0-9_-]{10,}/g],
  ["segredo", "google_api_key", /\bAIza[0-9A-Za-z_-]{35}\b/g],
  ["segredo", "github_token", /\b(?:gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{50,})\b/g],
  ["segredo", "aws_key", /\bAKIA[0-9A-Z]{16}\b/g],
  ["segredo", "url_postgres_com_senha", /postgres(?:ql)?:\/\/[^\s:@/]+:[^\s@/]+@/g],
  ["segredo", "atribuicao_generica", /\b(?:secret|password|passwd|senha|token|api[_-]?key|client[_-]?secret)\b["']?\s*[:=]\s*["']?(?!process\.env|\$\{|<)[A-Za-z0-9_\-+/=.]{16,}/gi],
  // Dados do usuário
  ["dado", "email", /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g],
  ["dado", "cpf", /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g],
  ["dado", "valor_monetario", /R\$\s?-?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g],
  ["dado", "instituicao", /\b(?:Nubank|NuInvest|Nu Invest|Itaú|Itau|Bradesco|Santander|Banco do Brasil|Caixa Econômica|XP Investimentos|BTG|Banco Inter|Rico Investimentos|Clear Corretora|Avenue|Órama|Genial Investimentos|C6 Bank|PagBank|PagSeguro|Mercado Pago|PicPay|Sicredi|Sicoob|Toro Investimentos|Warren|Easynvest|Banco Modal)\b/g],
  ["dado", "ticker_b3", /\b[A-Z]{4}(?:3|4|5|6|11)\b/g],
  ["dado", "titulo_tesouro", /Tesouro (?:Selic|IPCA\+?|Prefixado|RendA\+|Educa\+)(?: com Juros Semestrais)? ?\d{4}/g],
];

const ocorrencias = [];
const grupos = new Map(); // categoria + valor normalizado -> id do grupo; só em memória
function varrer(texto, local, ref, caminho) {
  const linhas = texto.split(/\r?\n/);
  linhas.forEach((linha, i) => {
    for (const [tipo, categoria, re] of PADROES) {
      re.lastIndex = 0;
      for (const m of linha.matchAll(re)) {
        const chave = `${categoria}\u0000${m[0].toLowerCase()}`;
        if (!grupos.has(chave)) grupos.set(chave, `G-${String(grupos.size + 1).padStart(4, "0")}`);
        ocorrencias.push({ metodo: "M2", tipo, categoria, local, ref, caminho, posicao: i + 1, grupo: grupos.get(chave), valor: m[0] });
      }
    }
  });
}

// Blobs: um blob pode ter vários caminhos; registra o primeiro e conta os demais.
const caminhos = new Map();
for (const l of git("rev-list", "--remotes", "--tags", "--objects").toString().split("\n")) {
  const i = l.indexOf(" ");
  if (i > 0 && !caminhos.has(l.slice(0, i))) caminhos.set(l.slice(0, i), l.slice(i + 1));
}
const tipos = git("cat-file", "--batch-check=%(objectname) %(objecttype)", "--batch-all-objects").toString();
const blobs = new Set(tipos.split("\n").filter((l) => l.endsWith(" blob")).map((l) => l.split(" ")[0]));
let binarios = 0, textos = 0, decodificados = 0, falhasDecodificacao = 0;
for (const [sha, caminho] of caminhos) {
  if (!blobs.has(sha)) continue;
  const conteudo = git("cat-file", "blob", sha);
  if (conteudo.includes(0)) { binarios++; continue; }
  textos++;
  const texto = conteudo.toString("utf8");
  varrer(texto, "blob", sha, caminho);
  // Blocos gzip+Base64 (séries do ciclo 005): descompactar e varrer o conteúdo também.
  for (const m of texto.matchAll(/````base64\r?\n([\s\S]*?)\r?\n````/g)) {
    try {
      varrer(gunzipSync(Buffer.from(m[1].replace(/\s/g, ""), "base64")).toString("utf8"), "blob_decodificado", sha, caminho);
      decodificados++;
    } catch { falhasDecodificacao++; }
  }
}

// Mensagens de commit e de tag anotada.
let commits = 0;
for (const reg of git("log", "--remotes", "--tags", "--format=%H%x00%B%x1e").toString().split("\x1e")) {
  const [sha, corpo] = reg.replace(/^\n/, "").split("\x00");
  if (!sha) continue;
  commits++;
  varrer(corpo ?? "", "mensagem_commit", sha, "");
}
for (const reg of git("for-each-ref", "refs/tags", "--format=%(refname:short)%00%(contents)%1e").toString().split("\x1e")) {
  const [tag, corpo] = reg.replace(/^\n/, "").split("\x00");
  if (tag) varrer(corpo ?? "", "mensagem_tag", tag, "");
}

// Texto do GitHub.
let itensGh = 0;
for (const arq of ["items.jsonl", "comments.jsonl", "releases.jsonl"]) {
  for (const l of readFileSync(path.join(ghDir, arq), "utf8").split("\n").filter(Boolean)) {
    const { k, ref, text } = JSON.parse(l);
    itensGh++;
    varrer(text, k, ref, "");
  }
}

// Inventário sem valores. O valor fica só em memória, durante a execução.
mkdirSync(path.dirname(inventario), { recursive: true });
writeFileSync(inventario, ocorrencias.map((o, i) => JSON.stringify({
  id: `OC-${String(i + 1).padStart(5, "0")}`, metodo: o.metodo, tipo: o.tipo, categoria: o.categoria, local: o.local,
  ref: o.ref, caminho: o.caminho, posicao: o.posicao, grupo: o.grupo, classe: "pendente", criterio: "",
})).join("\n") + "\n");

const cont = {};
for (const o of ocorrencias) cont[`${o.tipo}/${o.categoria}`] = (cont[`${o.tipo}/${o.categoria}`] ?? 0) + 1;
const gruposPorCat = {};
for (const k of grupos.keys()) { const c = k.split("\u0000")[0]; gruposPorCat[c] = (gruposPorCat[c] ?? 0) + 1; }
console.log(JSON.stringify({ blobsTexto: textos, decodificados, falhasDecodificacao, blobsBinarios: binarios, commits, itensGh, ocorrencias: ocorrencias.length, porCategoria: cont, gruposPorCategoria: gruposPorCat }, null, 1));

// Resumo por grupo para a triagem (só com --grupos): categoria, quantidade, locais e uma
// forma mínima do valor (domínio do e-mail, nome da chave), sem imprimir o valor completo.
if (process.argv.includes("--grupos")) {
  const por = new Map();
  for (const o of ocorrencias) {
    if (!por.has(o.grupo)) por.set(o.grupo, { categoria: o.categoria, n: 0, locais: {}, forma: "" });
    const g = por.get(o.grupo);
    g.n++;
    const loc = `${o.local}:${o.caminho || "-"}`;
    g.locais[loc] = (g.locais[loc] ?? 0) + 1;
    if (o.categoria === "email") g.forma = "@" + o.valor.split("@")[1].toLowerCase();
    if (o.categoria === "atribuicao_generica") g.forma = `${o.valor.split(/[:=]/)[0].trim()} (${o.valor.length} car.)`;
    if (o.categoria === "ticker_b3") g.forma = o.valor;
  }
  for (const [id, g] of por) {
    const locais = Object.entries(g.locais).sort((a, b) => b[1] - a[1]);
    console.log(`${id} ${g.categoria} n=${g.n} ${g.forma} | ${locais.slice(0, 6).map(([l, c]) => `${l}×${c}`).join("; ")}${locais.length > 6 ? ` (+${locais.length - 6})` : ""}`);
  }
}
```
