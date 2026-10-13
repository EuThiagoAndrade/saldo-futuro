// Testes do validador de governança (node:test, sem dependências).
// A fixture válida é gerada a partir do manifesto real; cada cenário aplica uma mutação.
// Caminhos de checkout irmão são montados por composição, para este arquivo não casar com o cenário 12.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from './validate-governance.mjs';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const manifestSource = path.join(scriptsDir, 'governance-manifest.json');
const manifest = JSON.parse(await readFile(manifestSource, 'utf8'));
const CYCLE_DIR = '_project/drafts/000_exemplo';

async function put(root, file, content) {
  const full = path.join(root, file);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, content);
}

async function read(root, file) {
  return readFile(path.join(root, file), 'utf8');
}

function cycles(rows, next) {
  const lines = rows.map(([cycle, state]) => `| \`${cycle}\` | Assunto | \`${state}\` | — | plano | — | — |`);
  return [
    '# Registro de ciclos',
    '',
    `> **Próximo ciclo:** \`${next}\``,
    '',
    '| Ciclo | Assunto | Estado | Ideação | Plano | Issues | Encerramento |',
    '| :-- | :-- | :-- | :-- | :-- | :-- | :-- |',
    ...lines,
    '',
  ].join('\n');
}

function plan(status) {
  return `# Plano\n\n> **Ciclo:** \`000\`\n> **Status:** \`${status}\`\n`;
}

function task(cycle, state) {
  return `# Task\n\n> **Ciclo:** \`${cycle}\`\n> **Trilha:** \`normal\`\n> **Estado:** \`${state}\`\n`;
}

function shortTask(issue, { eligibility = true, barriers = true } = {}) {
  const criteria = manifest.shortTrack.eligibilityCriteria.map((item) => `- ${item}:${eligibility ? ' justificado com evidência' : ''}`);
  const rows = manifest.shortTrack.barriers.map((barrier) => `| ${barrier} — barreira | Não | ${barriers ? 'Sem tabela, regra ou migração' : ''} |`);
  return [
    `# Task — Issue #${issue}`,
    '',
    '> **Ciclo:** `—`',
    '> **Trilha:** `curta`',
    '> **Estado:** `Em andamento`',
    `> **Issue:** \`#${issue}\``,
    '',
    manifest.shortTrack.eligibilityHeading,
    '',
    ...criteria,
    '',
    '## Barreiras de domínio',
    '',
    '| Barreira | Aplica-se? | Evidência ou justificativa |',
    '| :-- | :-- | :-- |',
    ...rows,
    '',
    '## Execução',
    '',
  ].join('\n');
}

function designDoc(keywords) {
  return `# Design\n\n${keywords.map((keyword, index) => `## ${index + 1}. Seção de ${keyword}`).join('\n\n')}\n`;
}

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'saldo-futuro-governance-'));
  for (const file of manifest.requiredFiles) {
    let content = `# ${file}\n\n${(manifest.requiredText[file] ?? []).join('\n')}\n`;
    if (manifest.adapters.files.includes(file)) content += `${manifest.adapters.reference}\n`;
    if (file.startsWith(`${manifest.workflows.dir}/`)) {
      const name = path.basename(file, '.md');
      const handoff = manifest.workflows.mutating.includes(name) ? manifest.workflows.mutatingText : manifest.workflows.readOnlyText;
      content = `---\ndescription: "Workflow de teste."\n---\n\n${content}${handoff.join('\n')}\n`;
    }
    if (file.startsWith(`${manifest.skills.dir}/`)) {
      content = `---\nname: ${path.basename(path.dirname(file))}\ndescription: "Skill de teste."\n---\n\n${content}`;
    }
    if (file === '.gitignore') content = `${manifest.gitignoreRequired.join('\n')}\n`;
    if (file === manifest.designSystem.file) content = designDoc(manifest.designSystem.sectionKeywords);
    await put(root, file, content);
  }
  await put(root, 'scripts/governance-manifest.json', await readFile(manifestSource, 'utf8'));
  await put(root, '_project/cycles.md', cycles([['000', 'Em execução']], '001'));
  await put(root, `${CYCLE_DIR}/000_plan.md`, plan('Em Execução'));
  await put(root, `${CYCLE_DIR}/000_task_issue-1.md`, task('000', 'Em andamento'));
  return root;
}

async function errorsOf(root) {
  return (await validate(root)).errors;
}

async function expectError(root, pattern) {
  const errors = await errorsOf(root);
  assert.ok(errors.some((message) => pattern.test(message)), `esperado erro ${pattern}; obtido:\n${errors.join('\n')}`);
}

async function expectValid(root) {
  assert.deepEqual(await errorsOf(root), []);
}

async function withFixture(run) {
  const root = await fixture();
  try {
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function snapshot(root, dir = root) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...(await snapshot(root, full)));
    else result.push(`${path.relative(root, full)}:${(await stat(full)).mtimeMs}`);
  }
  return result.sort();
}

test('1. fixture válida passa sem erros', () => withFixture(expectValid));

test('2. arquivo obrigatório ausente', () =>
  withFixture(async (root) => {
    await rm(path.join(root, '_project/README.md'));
    await expectError(root, /Arquivo obrigatório ausente: _project\/README\.md/);
  }));

test('2. novo arquivo obrigatório exige editar só o manifesto (G6)', () =>
  withFixture(async (root) => {
    const local = JSON.parse(await read(root, 'scripts/governance-manifest.json'));
    local.requiredFiles.push('docs/novo-obrigatorio.md');
    await put(root, 'scripts/governance-manifest.json', JSON.stringify(local));
    await expectError(root, /Arquivo obrigatório ausente: docs\/novo-obrigatorio\.md/);
  }));

test('3. adapter sem referência ao núcleo', () =>
  withFixture(async (root) => {
    await put(root, 'CLAUDE.md', '# Sem referência\n');
    await expectError(root, /Adapter CLAUDE\.md não referencia \.agent\/ai_behavior\.md/);
  }));

test('4. frontmatter inválido em workflow e skill, e handoff incompleto', () =>
  withFixture(async (root) => {
    const workflow = '.agent/workflows/idear.md';
    await put(root, workflow, (await read(root, workflow)).replace(/^---[\s\S]*?---\n/, ''));
    const skill = '.agent/skills/doc-updater/doc-updater.md';
    await put(root, skill, (await read(root, skill)).replace('name: doc-updater', 'name: outro-nome'));
    const mutating = '.agent/workflows/criar_issues.md';
    await put(root, mutating, (await read(root, mutating)).replace('logical_key', 'chave'));
    await expectError(root, /Workflow sem frontmatter: \.agent\/workflows\/idear\.md/);
    await expectError(root, /Skill .*doc-updater\.md com name "outro-nome"/);
    await expectError(root, /criar_issues\.md sem "logical_key"/);
  }));

test('5. ciclo duplicado em cycles.md', () =>
  withFixture(async (root) => {
    await put(root, '_project/cycles.md', cycles([['000', 'Em execução'], ['000', 'Em execução']], '001'));
    await expectError(root, /Ciclo duplicado em cycles\.md: 000/);
  }));

test('6. próximo ciclo incorreto', () =>
  withFixture(async (root) => {
    await put(root, '_project/cycles.md', cycles([['000', 'Em execução']], '002'));
    await expectError(root, /Próximo ciclo incorreto em cycles\.md: 002; esperado 001/);
  }));

test('7. estado de plano incompatível com o path e ciclo fora do local', () =>
  withFixture(async (root) => {
    await put(root, `${CYCLE_DIR}/000_plan.md`, plan('Concluído'));
    await expectError(root, /Plano com estado "Concluído" incompatível com _project\/drafts\//);
    await put(root, `${CYCLE_DIR}/000_plan.md`, plan('Aprovadíssimo'));
    await expectError(root, /Plano com estado "Aprovadíssimo"/);
    await put(root, '_project/cycles.md', cycles([['000', 'Concluído']], '001'));
    await expectError(root, /Ciclo 000 "Concluído" deveria estar em _project\/executed\//);
  }));

test('8. nomes fora da convenção', () =>
  withFixture(async (root) => {
    await put(root, '_project/drafts/001-Outro/001_plan.md', plan('Rascunho'));
    await put(root, `${CYCLE_DIR}/notas.md`, 'x');
    await put(root, '_project/decisions/adr-4.md', 'x');
    await expectError(root, /Diretório de ciclo fora da convenção: _project\/drafts\/001-Outro/);
    await expectError(root, /Artefato fora da convenção: _project\/drafts\/000_exemplo\/notas\.md/);
    await expectError(root, /Artefato fora da convenção: _project\/decisions\/adr-4\.md/);
  }));

test('9. arquivo solto em drafts/', () =>
  withFixture(async (root) => {
    await put(root, '_project/drafts/000_plan.md', plan('Rascunho'));
    await expectError(root, /Arquivo solto em _project\/drafts\/: 000_plan\.md/);
  }));

test('10. task com ciclo divergente da pasta', () =>
  withFixture(async (root) => {
    await put(root, `${CYCLE_DIR}/001_task_issue-2.md`, task('001', 'Em andamento'));
    await put(root, `${CYCLE_DIR}/000_task_issue-3.md`, task('001', 'Em andamento'));
    await expectError(root, /Artefato com ciclo divergente da pasta: .*001_task_issue-2\.md/);
    await expectError(root, /Task com ciclo 001 divergente da pasta: .*000_task_issue-3\.md/);
  }));

test('11. ciclo concluído com task ainda ativa', () =>
  withFixture(async (root) => {
    await mkdir(path.join(root, '_project/executed'), { recursive: true });
    await rename(path.join(root, CYCLE_DIR), path.join(root, '_project/executed/000_exemplo'));
    await put(root, '_project/executed/000_exemplo/000_plan.md', plan('Concluído'));
    await put(root, '_project/cycles.md', cycles([['000', 'Concluído']], '001'));
    await expectError(root, /Ciclo 000 concluído com task ainda ativa: 000_task_issue-1\.md/);
    await put(root, '_project/executed/000_exemplo/000_task_issue-1.md', task('000', 'Concluída'));
    await expectValid(root);
  }));

test('12. referência operacional a checkout irmão', () =>
  withFixture(async (root) => {
    const relative = ['..', 'Meus-Investimentos', 'backend'].join('/');
    const windows = ['C:', 'Programas', 'mae-no-controle'].join('\\');
    const posix = ['', 'home', 'dev', 'euthiagoandrade-api'].join('/');
    await put(root, '.agent/workflows/idear.md', `${await read(root, '.agent/workflows/idear.md')}\nLeia ${relative}.\n`);
    await put(root, '.github/workflows/governance.yml', `${await read(root, '.github/workflows/governance.yml')}\n# ${windows}\n`);
    await put(root, 'scripts/extra.mjs', `// ver ${posix}\n`);
    await expectError(root, /checkout irmão em \.agent\/workflows\/idear\.md/);
    await expectError(root, /checkout irmão em \.github\/workflows\/governance\.yml/);
    await expectError(root, /checkout irmão em scripts\/extra\.mjs/);
  }));

test('12. URLs e referências documentais em _project/ não são dependência operacional', () =>
  withFixture(async (root) => {
    const url = ['https:', '', 'github.com', 'EuThiagoAndrade', 'euthiagoandrade-api'].join('/');
    const relative = ['..', 'Meus-Investimentos'].join('/');
    await put(root, 'AGENTS.md', `${await read(root, 'AGENTS.md')}\nFonte: ${url}\n`);
    await put(root, '_project/knowledge/KB-001_exemplo.md', `Citação documental de ${relative}.\n`);
    await expectValid(root);
  }));

test('13. .gitignore sem exclusões mínimas', () =>
  withFixture(async (root) => {
    await put(root, '.gitignore', manifest.gitignoreRequired.filter((rule) => rule !== 'local/').join('\n'));
    await expectError(root, /\.gitignore sem a exclusão mínima "local\/"/);
  }));

test('14. arquivos de dados fora dos locais permitidos (G3)', () =>
  withFixture(async (root) => {
    await put(root, 'dados.csv', 'a,b\n');
    await put(root, 'scripts/dump.sql', 'select 1;\n');
    await expectError(root, /Arquivo de dados fora de tests\/fixtures\/: dados\.csv/);
    await expectError(root, /Arquivo SQL fora dos locais permitidos: scripts\/dump\.sql/);
  }));

test('14. dados em locais permitidos ou excluídos da varredura passam', () =>
  withFixture(async (root) => {
    await put(root, 'tests/fixtures/carteira_ficticia.csv', 'a,b\n');
    await put(root, 'local/origem.sqlite', 'x');
    await put(root, 'node_modules/pacote/x.db', 'x');
    await put(root, 'supabase/seed.sql', '-- dados fictícios\n');
    await put(root, 'supabase/tests/isolamento.sql', 'select 1;\n');
    await expectValid(root);
  }));

test('15. tabela de public sem RLS (G2)', () =>
  withFixture(async (root) => {
    await put(root, 'supabase/migrations/20261012120000_inicial.sql', 'create table public.eventos (id bigint);\n');
    await expectError(root, /Tabela public\.eventos criada em 20261012120000_inicial\.sql sem "enable row level security"/);
  }));

test('15. RLS em migração posterior, schema explícito, aspas e if not exists passam', () =>
  withFixture(async (root) => {
    await put(
      root,
      'supabase/migrations/20261012120000_inicial.sql',
      [
        'create table if not exists "public"."Ativos" (id bigint);',
        'CREATE TABLE eventos (id bigint);',
        'create table private.auditoria (id bigint);',
        '-- create table public.comentada (id bigint);',
        '',
      ].join('\n'),
    );
    await put(
      root,
      'supabase/migrations/20261012130000_rls.sql',
      ['alter table public.ativos enable row level security;', 'ALTER TABLE IF EXISTS ONLY "eventos" ENABLE ROW LEVEL SECURITY;', ''].join('\n'),
    );
    await expectValid(root);
  }));

test('16. migração com nome fora do padrão (G4)', () =>
  withFixture(async (root) => {
    await put(root, 'supabase/migrations/202610121200_inicial.sql', 'select 1;\n');
    await expectError(root, /Migração fora do padrão AAAAMMDDHHMMSS_assunto\.sql: 202610121200_inicial\.sql/);
  }));

test('17. task da trilha curta sem elegibilidade ou barreiras (G5)', () =>
  withFixture(async (root) => {
    await put(root, '_project/fixes/fix_task_issue-7.md', shortTask(7, { eligibility: false }));
    await put(root, '_project/fixes/fix_task_issue-8.md', shortTask(8, { barriers: false }));
    await put(root, '_project/fixes/fix_task_issue-9.md', shortTask(10));
    await expectError(root, /sem justificativa para "Sem mudança de escopo": _project\/fixes\/fix_task_issue-7\.md/);
    await expectError(root, /sem a barreira G3 declarada e justificada: _project\/fixes\/fix_task_issue-8\.md/);
    await expectError(root, /sem a issue #9: _project\/fixes\/fix_task_issue-9\.md/);
  }));

test('17. task da trilha curta completa passa', () =>
  withFixture(async (root) => {
    await put(root, '_project/fixes/fix_task_issue-7.md', shortTask(7));
    await expectValid(root);
  }));

test('18. DESIGN.md, quando existir, exige as seções normativas', () =>
  withFixture(async (root) => {
    const { file, sectionKeywords } = manifest.designSystem;
    await put(root, file, '# Design\n\n## 1. Princípios\n');
    await expectError(root, /DESIGN\.md sem a seção normativa "tipografia"/);
    await put(root, file, designDoc(sectionKeywords));
    await expectValid(root);
    // Sem o arquivo no manifesto e no disco, a regra é condicional: só um item manual.
    const local = JSON.parse(await read(root, 'scripts/governance-manifest.json'));
    local.requiredFiles = local.requiredFiles.filter((item) => item !== file);
    await put(root, 'scripts/governance-manifest.json', JSON.stringify(local));
    await rm(path.join(root, file));
    await expectValid(root);
    assert.ok((await validate(root)).manual.some((item) => item.includes(file)));
  }));

test('19. template de PR fora do caminho padrão ou sem as barreiras', () =>
  withFixture(async (root) => {
    const template = '.github/pull_request_template.md';
    await put(root, template, (await read(root, template)).replace('## Barreiras de domínio', '## Outra seção'));
    await expectError(root, /pull_request_template\.md sem o trecho obrigatório "## Barreiras de domínio"/);
    await mkdir(path.join(root, '.github/PULL_REQUEST_TEMPLATE'));
    await rename(path.join(root, template), path.join(root, '.github/PULL_REQUEST_TEMPLATE/pull_request_template.md'));
    await expectError(root, /Arquivo obrigatório ausente: \.github\/pull_request_template\.md/);
  }));

test('o validador não escreve no workspace auditado', () =>
  withFixture(async (root) => {
    const before = await snapshot(root);
    await validate(root);
    assert.deepEqual(await snapshot(root), before);
  }));

test('a CLI retorna 0 sem erros e 1 com erro bloqueante', () =>
  withFixture(async (root) => {
    const cli = path.join(scriptsDir, 'validate-governance.mjs');
    const ok = spawnSync(process.execPath, [cli, '--root', root], { encoding: 'utf8' });
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
    assert.match(ok.stdout, /\[MANUAL\]/);
    await rm(path.join(root, 'LICENSE'));
    const fail = spawnSync(process.execPath, [cli, '--root', root], { encoding: 'utf8' });
    assert.equal(fail.status, 1);
    assert.match(fail.stdout, /\[ERRO\] Arquivo obrigatório ausente: LICENSE/);
  }));
