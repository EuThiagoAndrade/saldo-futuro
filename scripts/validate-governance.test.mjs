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

// Situações usadas nas fixtures: [nome, alvo, conferir, diga].
const DONE = ['Concluído', 'ciclo 000 (completo)', '—', '—'];
const MERGE = ['Aguardando merge', 'ciclo 000 (completo)', 'Checks e diff da PR (#1)', '"aprovo o merge da PR #1"'];

function situation(name) {
  return manifest.nextStep.situations.find((item) => item.name === name.replace(/rodada \d+/, 'rodada N'));
}

function block([name, target, check, say], who = situation(name)?.who) {
  return ['## Próximo passo', '', '```text', 'PRÓXIMO PASSO', `Situação: ${name} — ${target}`, `Quem: ${who}`, `Conferir: ${check}`, `Diga: ${say}`, '```', ''].join('\n');
}

function heading(fields) {
  return Object.entries(fields)
    .filter(([key]) => key !== 'barriers')
    .map(([key, value]) => (key === 'Autorização inicial' ? `> **${key}:** ${value}` : `> **${key}:** \`${value}\``))
    .join('\n');
}

function barriers(applies = {}) {
  const rows = ['G1', 'G2', 'G3', 'G4'].map((barrier) => `| ${barrier} — barreira | ${applies[barrier] ? 'Sim' : 'Não'} | Justificativa |`);
  return ['## Barreiras de domínio', '', '| Barreira | Aplica-se? | Evidência ou justificativa |', '| :-- | :-- | :-- |', ...rows, ''].join('\n');
}

function plan(status, fields = {}, next = status === 'Concluído' ? DONE : MERGE) {
  const base = {
    Ciclo: '000',
    Status: status,
    Nível: 'completo',
    'Veredito da revisão': 'APTO PARA APROVAÇÃO',
    'Aprovação humana pós-revisão': 'Aprovada em 2026-10-13',
    handoff_schema_version: '2',
    ...fields,
  };
  return `# Plano\n\n${heading(base)}\n\n${barriers(fields.barriers)}\n${block(next)}\n## Revisão crítica\n`;
}

function task(cycle, state, fields = {}, next = state === 'Concluída' ? DONE : MERGE) {
  const base = { Ciclo: cycle, Trilha: 'normal', Estado: state, handoff_schema_version: '2', ...fields };
  return `# Task\n\n${heading(base)}\n\n${barriers(fields.barriers)}\n${block(next)}`;
}

function situationsTable() {
  const { situations, continuousSuffixes } = manifest.nextStep;
  const rows = situations.map((item) => `| ${item.name} | ${item.who} | ${item.check} | ${item.say.map((say) => say.text).join('; ')} |`);
  const suffixes = continuousSuffixes.map((item) => item.trim()).join('; ');
  return ['| Situação | Quem age | Conferir | Frases |', '| :-- | :-- | :-- | :-- |', ...rows, '', `Sufixos: ${suffixes}.`, ''].join('\n');
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
    '> **handoff_schema_version:** `2`',
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
    block(['Aguardando merge', `correção da issue #${issue}`, 'Checks e diff da PR', '"aprovo o merge da PR #1"']),
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
      content = `---\ndescription: "Workflow de teste."\n---\n\n${content}${handoff.join('\n')}\n\n- Parado\n`;
    }
    if (file.startsWith(`${manifest.skills.dir}/`)) {
      content = `---\nname: ${path.basename(path.dirname(file))}\ndescription: "Skill de teste."\n---\n\n${content}`;
    }
    if (file === '_project/README.md') {
      const { readmeSection } = manifest.nextStep;
      content = content.replace(`${readmeSection}\n`, `${readmeSection}\n\n${situationsTable()}\n`);
    }
    if (file === '.gitignore') content = `${manifest.gitignoreRequired.join('\n')}\n`;
    if (file === manifest.backlog.file) content = '# Backlog de possibilidades\n\nNenhum item registrado.\n';
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

function backlogItem(id = 'BL-001', state = 'Disponível', destinations = '—', reason = '') {
  return [
    `## ${id} — Necessidade fictícia`, '',
    heading({ 'Criado em': '2026-10-19', 'Atualizado em': '2026-10-19', Estado: state }), '',
    '### Problema e benefício esperado', '', 'Guardar uma possibilidade fictícia para decisão futura.', '',
    '### Contexto', '', '—', '',
    '### Encaminhamentos', '', destinations, '',
    '### Restante', '', '—', '',
    '### Registro', '', '- 2026-10-19 — Pedido fictício de captura.', '',
    ...(reason ? ['### Motivo do arquivamento', '', reason, ''] : []),
  ].join('\n');
}

test('backlog: vazio sem handoff e item mínimo são válidos; arquivo é obrigatório', () =>
  withFixture(async (root) => {
    await expectValid(root);
    await put(root, manifest.backlog.file, backlogItem());
    await expectValid(root);
    await rm(path.join(root, manifest.backlog.file));
    await expectError(root, /Arquivo obrigatório ausente: _project\/backlog.md/);
  }));

test('backlog: IDs duplicados, malformados e título ausente falham', () =>
  withFixture(async (root) => {
    await put(root, manifest.backlog.file, backlogItem() + backlogItem());
    await expectError(root, /ID duplicado BL-001/);
    for (const id of ['BL-1', 'BL-xyz', 'BL_002']) {
      await put(root, manifest.backlog.file, backlogItem(id));
      await expectError(root, /ID inválido/);
    }
    await put(root, manifest.backlog.file, backlogItem().replace(' — Necessidade fictícia', ' título sem separador'));
    await expectError(root, /título obrigatório vazio/);
  }));

test('backlog: campos e seções obrigatórios não podem desaparecer ou ficar vazios', () =>
  withFixture(async (root) => {
    for (const field of manifest.backlog.headers) {
      await put(root, manifest.backlog.file, backlogItem().replace(new RegExp(`^> \\*\\*${field}:\\*\\*.*$`, 'm'), ''));
      await expectError(root, new RegExp(`campo obrigatório "${field}"`));
    }
    for (const name of manifest.backlog.sections) {
      await put(root, manifest.backlog.file, backlogItem().replace(`### ${name}`, '### Outra seção'));
      await expectError(root, new RegExp(`seção obrigatória "${name}"`));
    }
    await put(root, manifest.backlog.file, backlogItem().replace('Guardar uma possibilidade fictícia para decisão futura.', '—'));
    await expectError(root, /seção obrigatória "Problema e benefício esperado"/);
  }));

test('backlog: estados fechados e motivo de arquivamento', () =>
  withFixture(async (root) => {
    await put(root, manifest.backlog.file, backlogItem('BL-001', 'Concluído'));
    await expectError(root, /estado inválido "Concluído"/);
    await put(root, manifest.backlog.file, backlogItem('BL-001', 'Arquivado'));
    await expectError(root, /Arquivado exige motivo/);
    await put(root, manifest.backlog.file, backlogItem('BL-001', 'Arquivado', '—', 'Descarte solicitado no cenário fictício.'));
    await expectValid(root);
  }));

test('backlog: Encaminhado exige destino e referências estáveis precisam existir', () =>
  withFixture(async (root) => {
    await put(root, manifest.backlog.file, backlogItem('BL-001', 'Encaminhado'));
    await expectError(root, /Encaminhado exige destino existente/);
    await put(root, manifest.backlog.file, backlogItem('BL-001', 'Encaminhado', '- ciclo 999 — 2026-10-19 — necessidade integral'));
    await expectError(root, /destino ciclo 999 inexistente/);
    await put(root, manifest.backlog.file, backlogItem('BL-001', 'Encaminhado', '- issue #9 — 2026-10-19 — necessidade integral'));
    await expectError(root, /destino issue #9 inexistente/);
    await put(root, '_project/fixes/fix_task_issue-9.md', shortTask(9));
    await put(root, manifest.backlog.file, backlogItem('BL-001', 'Encaminhado', '- ciclo 000 — 2026-10-19 — parte A\n- issue #9 — 2026-10-19 — parte B'));
    await expectValid(root);
    // O mesmo ID de ciclo continua resolvendo depois da movimentação prospectiva.
    await mkdir(path.join(root, '_project/executed'), { recursive: true });
    await rename(path.join(root, CYCLE_DIR), path.join(root, '_project/executed/000_exemplo'));
    await put(root, '_project/executed/000_exemplo/000_plan.md', plan('Concluído'));
    await put(root, '_project/executed/000_exemplo/000_task_issue-1.md', task('000', 'Concluída'));
    await put(root, '_project/cycles.md', cycles([['000', 'Concluído']], '001'));
    await expectValid(root);
  }));

test('backlog: referência interna ausente falha; combinação preserva IDs', () =>
  withFixture(async (root) => {
    const archived = backlogItem('BL-001', 'Arquivado', '—', 'Combinado em BL-002 por pedido fictício.');
    await put(root, manifest.backlog.file, archived);
    await expectError(root, /referência interna inexistente BL-002/);
    await put(root, manifest.backlog.file, archived + backlogItem('BL-002'));
    await expectValid(root);
  }));

test('backlog: exemplos cercados não viram itens, campos nem referências', () =>
  withFixture(async (root) => {
    await put(root, manifest.backlog.file, `# Backlog\n\n\`\`\`markdown\n${backlogItem('BL-exemplo', 'Inválido')}\`\`\`\n~~~md\n${backlogItem()}~~~\n${backlogItem()}\n`);
    await expectValid(root);
  }));

test('backlog: situações permitidas e exclusividade não ampliam alvos de ciclos', () =>
  withFixture(async (root) => {
    const updated = ['Backlog atualizado', 'backlog', 'IDs, síntese e alterações locais do backlog', '"publique as alterações do backlog"'];
    for (const next of [updated, ['Aguardando merge', 'backlog', 'Checks e diff da PR', '"aprovo o merge da PR #1"'], ['Parado', 'backlog', 'Liberação de caminho externo', 'sua resposta à pergunta registrada'], ['Concluído', 'backlog', '—', '—']]) {
      await put(root, `${CYCLE_DIR}/000_plan.md`, plan('Em Execução', {}, next));
      await expectValid(root);
    }
    await put(root, `${CYCLE_DIR}/000_plan.md`, plan('Em Execução', {}, [updated[0], 'ciclo 000 (completo)', ...updated.slice(2)]));
    await expectError(root, /não permitida para "ciclo 000/);
    await put(root, `${CYCLE_DIR}/000_plan.md`, plan('Em Execução', {}, ['Ideação registrada', 'backlog', 'Perguntas', '"autorizo o rascunho do plano do ciclo 000"']));
    await expectError(root, /não permitida para backlog/);
  }));

test('backlog: validação de conteúdo também permanece somente leitura', () =>
  withFixture(async (root) => {
    await put(root, manifest.backlog.file, backlogItem());
    const before = await snapshot(root);
    await expectValid(root);
    assert.deepEqual(await snapshot(root), before);
  }));

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

const TASK = `${CYCLE_DIR}/000_task_issue-1.md`;
const PLAN = `${CYCLE_DIR}/000_plan.md`;

test('20. bloco do artefato ativo: ausente ou fora do formato', () =>
  withFixture(async (root) => {
    await put(root, TASK, (await read(root, TASK)).replace('## Próximo passo', '## Outro título'));
    await expectError(root, /Artefato ativo sem a seção "## Próximo passo": .*000_task_issue-1\.md/);
    const cases = [
      [['Aguardando tudo', 'ciclo 000 (completo)', 'x', '"x"'], /situação fora da lista/],
      [['Aguardando merge', 'ciclo 0 (completo)', 'Checks', '"aprovo o merge da PR #1"'], /alvo "ciclo 0 \(completo\)" fora do padrão/],
      [['Aguardando merge', 'ciclo 000 (completo)', '—', '"aprovo o merge da PR #1"'], /"Conferir" incompatível/],
      [['Aguardando merge', 'ciclo 000 (completo)', 'Checks', '"aprove o merge"'], /frase ""aprove o merge"" fora dos modelos/],
      [['Aguardando merge', 'correção "[FIX] Título" (sem issue)', 'Checks', '"aprovo o merge da PR #1"'], /alvo .* fora do padrão/],
    ];
    for (const [next, pattern] of cases) {
      await put(root, TASK, task('000', 'Em andamento', {}, next));
      await expectError(root, pattern);
    }
    await put(root, TASK, task('000', 'Em andamento', {}, MERGE).replace('Quem: Responsável', 'Quem: Alguém'));
    await expectError(root, /"Quem" diferente da tabela/);
    await put(root, TASK, task('000', 'Em andamento', {}, MERGE).replace('PRÓXIMO PASSO\n', ''));
    await expectError(root, /esperadas 5 linhas/);
  }));

test('20. blocos válidos, inclusive triagem sem issue, sufixo contínuo e Parado', () =>
  withFixture(async (root) => {
    const valid = [
      ['Triagem proposta', 'correção "[FIX] Botão sem a cor do contrato" (sem issue)', 'Nível proposto e motivo', '"confirmo a trilha curta e autorizo abrir e corrigir a issue [FIX] Botão sem a cor do contrato em modo contínuo"'],
      ['Triagem proposta', 'ciclo 004 (leve)', 'Nível e motivo', '"confirmo o nível leve e autorizo o plano do ciclo 004 em modo contínuo com revisão externa"'],
      ['Aguardando revisão (rodada 2)', 'ciclo 000 (completo)', '—', '"revise o plano do ciclo 000"'],
      ['Parado', 'ciclo 000 (completo)', 'A pergunta: seguir?', 'sua resposta à pergunta registrada'],
      ['Pronto para continuar', 'correção da issue #7', '—', '"continue a correção da issue #7"'],
    ];
    for (const next of valid) {
      await put(root, TASK, task('000', 'Em andamento', {}, next));
      await expectValid(root);
    }
    await put(root, TASK, task('000', 'Em andamento', {}, ['Triagem proposta', 'ciclo 004 (completo)', 'Nível', '"confirmo o nível completo e autorizo a ideação do ciclo 004 em modo contínuo"']));
    await expectError(root, /fora dos modelos de "Triagem proposta"/);
  }));

test('21. situações do manifesto e de _project/README.md dessincronizadas', () =>
  withFixture(async (root) => {
    const readme = await read(root, '_project/README.md');
    await put(root, '_project/README.md', readme.replace('| Parado | Responsável |', '| Parado | Outra pessoa |'));
    await expectError(root, /Situação "Parado" com "Quem age" ou "Conferir" divergente/);
    await put(root, '_project/README.md', readme.replace('aprovo o merge da PR #N', 'aceito o merge'));
    await expectError(root, /Frase "aprovo o merge da PR #N" do manifesto ausente/);
    await put(root, '_project/README.md', readme.replace('| Concluído |', '| Encerrado |'));
    await expectError(root, /Situação "Concluído" do manifesto ausente/);
    await expectError(root, /Situação "Encerrado" de _project\/README\.md ausente do manifesto/);
  }));

test('22. plano ativo sem Nível válido', () =>
  withFixture(async (root) => {
    await put(root, PLAN, plan('Em Execução', { Nível: 'médio' }));
    await expectError(root, /Plano sem Nível válido/);
  }));

test('23. promoção do plano: aprovação humana, modo contínuo e veredito', () =>
  withFixture(async (root) => {
    const continuous = { 'Autorização inicial': '"confirmo o nível leve e autorizo o plano do ciclo 000 em modo contínuo" em 2026-10-13', Nível: 'leve' };
    await put(root, PLAN, plan('Aprovado', { 'Veredito da revisão': 'REQUER NOVA RODADA' }));
    await expectError(root, /Plano Aprovado sem veredito apto/);
    await put(root, PLAN, plan('Aprovado', { 'Aprovação humana pós-revisão': 'Pendente' }));
    await expectError(root, /sem aprovação humana pós-revisão válida/);
    await put(root, PLAN, plan('Aprovado', { ...continuous, 'Modo contínuo': 'ativo', 'Veredito da revisão': 'APTO COM RESSALVAS', 'Aprovação humana pós-revisão': 'Coberta pelo modo contínuo (autorização inicial de 2026-10-13)' }));
    await expectError(root, /promovido pelo modo contínuo sem veredito "APTO PARA APROVAÇÃO"/);
    await put(root, PLAN, plan('Aprovado', { Nível: 'leve', 'Aprovação humana pós-revisão': 'Coberta pelo modo contínuo (autorização inicial de 2026-10-13)' }));
    await expectError(root, /coberto pelo modo contínuo sem modo contínuo declarado/);
    await put(root, PLAN, plan('Aprovado', { ...continuous, 'Modo contínuo': 'ativo', 'Aprovação humana pós-revisão': 'Coberta pelo modo contínuo (autorização inicial de 2026-10-13)' }));
    await expectValid(root);
    await put(root, PLAN, plan('Aprovado', { 'Veredito da revisão': 'APTO COM RESSALVAS' }));
    await expectValid(root);
  }));

test('24. mais de 5 rodadas de revisão', () =>
  withFixture(async (root) => {
    const rounds = [1, 2, 3, 4, 5, 6].map((round) => `### Rodada ${round}\n`).join('\n');
    await put(root, PLAN, `${plan('Em Execução')}\n${rounds}`);
    await expectError(root, /Mais de 5 rodadas de revisão: .*000_plan\.md/);
    await put(root, PLAN, `${plan('Em Execução')}\n${rounds.replace('### Rodada 6\n', '')}`);
    await expectValid(root);
  }));

test('25. código de gate com letras em plano ativo', () =>
  withFixture(async (root) => {
    await put(root, PLAN, `${plan('Em Execução')}\nMerge após o Gate M-A.\n`);
    await expectError(root, /Plano ativo com código de gate com letras/);
    await put(root, PLAN, `${plan('Em Execução')}\nM-A equivale a aprovar o merge.\n`);
    await expectValid(root);
  }));

test('26. workflow sem situações de saída ou com situação fora da lista', () =>
  withFixture(async (root) => {
    const workflow = '.agent/workflows/idear.md';
    const content = await read(root, workflow);
    await put(root, workflow, content.replace('## Situações de saída', '## Saídas'));
    await expectError(root, /idear\.md sem "## Situações de saída"/);
    await put(root, workflow, content.replace('- Parado', '- Esperando'));
    await expectError(root, /idear\.md com situação de saída fora da lista: "Esperando"/);
    await put(root, workflow, content.replace('- Parado', '- Aguardando revisão (rodada N)'));
    await expectValid(root);
  }));

test('27. modo contínuo ativo proibido em ciclo completo ou com G1/G2', () =>
  withFixture(async (root) => {
    const authorized = { 'Autorização inicial': '"frase" em 2026-10-13' };
    await put(root, PLAN, plan('Em Execução', { ...authorized, 'Modo contínuo': 'ativo' }));
    await put(root, TASK, task('000', 'Em andamento', { ...authorized, 'Modo contínuo': 'ativo' }));
    await expectError(root, /Modo contínuo ativo em ciclo completo: .*000_plan\.md/);
    await expectError(root, /Modo contínuo ativo em ciclo completo: .*000_task_issue-1\.md/);
    await put(root, PLAN, plan('Em Execução', { ...authorized, Nível: 'leve' }));
    await put(root, TASK, task('000', 'Em andamento', { ...authorized, 'Modo contínuo': 'ativo', barriers: { G2: true } }));
    await expectError(root, /Modo contínuo ativo com G2 aplicável/);
    await put(root, TASK, task('000', 'Em andamento', { ...authorized, 'Modo contínuo': 'suspenso', barriers: { G2: true } }));
    await expectValid(root);
    await put(root, PLAN, plan('Em Execução', { ...authorized, 'Modo contínuo': 'suspenso' }));
    await expectValid(root);
    await put(root, PLAN, plan('Em Execução', { 'Modo contínuo': '—' }));
    await put(root, TASK, task('000', 'Em andamento'));
    await expectValid(root);
  }));

test('28. artefato sujeito à versão 2 em executed/ sem o bloco Concluído', () =>
  withFixture(async (root) => {
    await mkdir(path.join(root, '_project/executed'), { recursive: true });
    await rename(path.join(root, CYCLE_DIR), path.join(root, '_project/executed/000_exemplo'));
    await put(root, '_project/cycles.md', cycles([['000', 'Concluído']], '001'));
    await put(root, '_project/executed/000_exemplo/000_plan.md', plan('Concluído'));
    await put(root, '_project/executed/000_exemplo/000_task_issue-1.md', task('000', 'Concluída', {}, MERGE));
    await expectError(root, /executado com bloco diferente de "Concluído": .*000_task_issue-1\.md/);
    await put(root, '_project/executed/000_exemplo/000_task_issue-1.md', task('000', 'Concluída').replace('## Próximo passo', '## Fim'));
    await expectError(root, /Artefato executado sem a seção "## Próximo passo"/);
    await put(root, '_project/executed/000_exemplo/000_task_issue-1.md', task('000', 'Concluída'));
    await expectValid(root);
  }));

test('29. modo contínuo sem Autorização inicial', () =>
  withFixture(async (root) => {
    await put(root, TASK, task('000', 'Em andamento', { 'Modo contínuo': 'suspenso' }));
    await expectError(root, /Modo contínuo sem Autorização inicial: .*000_task_issue-1\.md/);
  }));

test('30. artefato fora da lista de legados sem a versão 2', () =>
  withFixture(async (root) => {
    await put(root, TASK, task('000', 'Em andamento', { handoff_schema_version: '1' }));
    await expectError(root, /sem handoff_schema_version `2` no cabeçalho e fora da lista de legados: .*000_task_issue-1\.md/);
    // Um arquivo novo em diretório histórico não vira legado por estar ali.
    await put(root, '_project/executed/001_antigo/001_plan.md', '# Plano\n\n> **Status:** `Concluído`\n');
    await put(root, '_project/cycles.md', cycles([['000', 'Em execução'], ['001', 'Concluído']], '002'));
    await expectError(root, /fora da lista de legados: _project\/executed\/001_antigo\/001_plan\.md/);
  }));

test('transição: históricos, ciclo em transição e ciclo novo', () =>
  withFixture(async (root) => {
    const legacy = ['_project/executed/001_antigo/001_plan.md', '_project/executed/001_antigo/001_task_closure.md', '_project/ideations/000_exemplo.md'];
    const local = JSON.parse(await read(root, 'scripts/governance-manifest.json'));
    local.artifacts.legacyV1 = [...legacy, `${CYCLE_DIR}/000_plan.md`];
    await put(root, 'scripts/governance-manifest.json', JSON.stringify(local));
    // Histórico na versão 1, sem bloco.
    await put(root, legacy[0], '# Plano\n\n> **Status:** `Concluído`\n');
    await put(root, legacy[1], '# Task\n\n> **Ciclo:** `001`\n> **Estado:** `Concluída`\n');
    // Ciclo em transição: ideação e plano legados (plano com bloco e Nível), task concluída e task ativa na versão 2.
    await put(root, legacy[2], '# Ideação\n');
    await put(root, `${CYCLE_DIR}/000_plan.md`, plan('Em Execução', { handoff_schema_version: '1' }));
    await put(root, `${CYCLE_DIR}/000_task_issue-2.md`, task('000', 'Concluída'));
    await put(root, '_project/cycles.md', cycles([['000', 'Em execução'], ['001', 'Concluído']], '002'));
    await expectValid(root);
    // O bloco de um legado que o possui continua conferido.
    await put(root, `${CYCLE_DIR}/000_plan.md`, plan('Em Execução', { handoff_schema_version: '1' }, ['Aguardando tudo', 'ciclo 000 (completo)', 'x', '"x"']));
    await expectError(root, /Bloco "Próximo passo" inválido em .*000_plan\.md/);
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
