#!/usr/bin/env node
// Validador estrutural da governança do saldo-futuro.
// Somente leitura: não executa Git, não acessa a rede e não escreve no workspace auditado.
// As regras estruturais vêm de scripts/governance-manifest.json (G6); a política vive nas autoridades canônicas.

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function validate(root) {
  const errors = [];
  const warnings = [];
  const manual = [];
  const rel = (file) => path.relative(root, file).replaceAll('\\', '/');

  const manifestPath = path.join(root, 'scripts', 'governance-manifest.json');
  if (!(await exists(manifestPath))) {
    errors.push('Manifesto ausente: scripts/governance-manifest.json.');
    return { errors, warnings, manual };
  }
  let manifest;
  try {
    manifest = JSON.parse(await text(manifestPath));
  } catch (error) {
    errors.push(`Manifesto inválido: ${error.message}`);
    return { errors, warnings, manual };
  }

  // Cenários 2 e 19: arquivos obrigatórios e trechos exigidos.
  for (const file of manifest.requiredFiles) {
    if (!(await exists(path.join(root, file)))) errors.push(`Arquivo obrigatório ausente: ${file}.`);
  }
  for (const [file, snippets] of Object.entries(manifest.requiredText)) {
    const full = path.join(root, file);
    if (!(await exists(full))) continue;
    const content = await text(full);
    for (const snippet of snippets) {
      if (!content.includes(snippet)) errors.push(`${file} sem o trecho obrigatório "${snippet}".`);
    }
  }

  // Cenário 3: adapters.
  for (const adapter of manifest.adapters.files) {
    const full = path.join(root, adapter);
    if (!(await exists(full))) continue;
    if (!(await text(full)).includes(manifest.adapters.reference)) {
      errors.push(`Adapter ${adapter} não referencia ${manifest.adapters.reference}.`);
    }
  }

  // Cenário 4: frontmatter de workflows e skills; handoff dos workflows.
  const { workflows, skills } = manifest;
  for (const file of await listFiles(path.join(root, workflows.dir))) {
    if (path.extname(file) !== '.md') continue;
    const content = await text(file);
    const fields = frontmatter(content);
    if (!fields) {
      errors.push(`Workflow sem frontmatter: ${rel(file)}.`);
      continue;
    }
    for (const key of workflows.frontmatter) {
      if (!fields[key]) errors.push(`Workflow ${rel(file)} sem o campo de frontmatter "${key}".`);
    }
    const name = path.basename(file, '.md');
    const expected = workflows.mutating.includes(name)
      ? workflows.mutatingText
      : workflows.readOnly.includes(name)
        ? workflows.readOnlyText
        : null;
    if (!expected) {
      errors.push(`Workflow ${rel(file)} não está classificado como mutante ou somente leitura no manifesto.`);
      continue;
    }
    for (const snippet of expected) {
      if (!content.includes(snippet)) errors.push(`Workflow ${rel(file)} sem "${snippet}" no handoff.`);
    }
  }
  for (const dir of await listDirs(path.join(root, skills.dir))) {
    const name = path.basename(dir);
    const file = path.join(dir, `${name}.md`);
    if (!(await exists(file))) {
      errors.push(`Skill ${name} sem o arquivo ${name}.md.`);
      continue;
    }
    const fields = frontmatter(await text(file));
    if (!fields) {
      errors.push(`Skill sem frontmatter: ${rel(file)}.`);
      continue;
    }
    for (const key of skills.frontmatter) {
      if (!fields[key]) errors.push(`Skill ${rel(file)} sem o campo de frontmatter "${key}".`);
    }
    if (fields.name && fields.name !== name) errors.push(`Skill ${rel(file)} com name "${fields.name}" diferente do diretório.`);
  }

  // Cenários 5 a 11: ciclos, planos e tasks.
  await validateCycles(root, manifest, errors);

  // Cenário 12: dependência operacional de checkout irmão.
  const sibling = siblingPattern(manifest.siblingCheck.repositories);
  for (const entry of manifest.siblingCheck.roots) {
    const target = path.join(root, entry);
    if (!(await exists(target))) continue;
    const files = (await stat(target)).isFile() ? [target] : await listFiles(target, true);
    for (const file of files) {
      if (!manifest.siblingCheck.extensions.includes(path.extname(file))) continue;
      if (sibling.test(await text(file))) errors.push(`Dependência operacional de checkout irmão em ${rel(file)}.`);
    }
  }

  // Cenário 13: exclusões mínimas do .gitignore.
  const gitignore = path.join(root, '.gitignore');
  if (await exists(gitignore)) {
    const rules = new Set((await text(gitignore)).split(/\r?\n/).map((line) => line.trim()));
    for (const rule of manifest.gitignoreRequired) {
      if (!rules.has(rule)) errors.push(`.gitignore sem a exclusão mínima "${rule}".`);
    }
  }

  // Cenário 14: arquivos de dados fora dos locais permitidos (G3).
  const { dataFiles } = manifest;
  for (const file of await walk(root, manifest.scanExclusions)) {
    const relative = rel(file);
    const ext = path.extname(file).toLowerCase();
    const inside = (dirs) => dirs.some((dir) => relative.startsWith(dir));
    if (dataFiles.extensions.includes(ext) && !inside(dataFiles.allowedDirs)) {
      errors.push(`Arquivo de dados fora de ${dataFiles.allowedDirs.join(', ')}: ${relative} (G3).`);
    }
    if (ext === '.sql' && !inside(dataFiles.sqlAllowedDirs) && !dataFiles.sqlAllowedFiles.includes(relative)) {
      errors.push(`Arquivo SQL fora dos locais permitidos: ${relative} (G3).`);
    }
  }

  // Cenários 15 e 16: migrações (G2 e G4).
  await validateMigrations(root, manifest.migrations, errors);

  // Cenário 17: tasks da trilha curta (G5).
  await validateShortTrack(root, manifest, errors);

  // Cenário 18: DESIGN.md, quando existir.
  const design = path.join(root, manifest.designSystem.file);
  if (await exists(design)) {
    const headings = (await text(design))
      .split(/\r?\n/)
      .filter((line) => /^##\s/.test(line))
      .map(normalize);
    for (const keyword of manifest.designSystem.sectionKeywords) {
      if (!headings.some((heading) => heading.includes(keyword))) {
        errors.push(`${manifest.designSystem.file} sem a seção normativa "${keyword}".`);
      }
    }
  } else {
    manual.push(`${manifest.designSystem.file} ainda não existe; contrato visual não auditado.`);
  }

  if (!(await exists(path.join(root, 'package.json')))) {
    warnings.push('Nenhum package.json: esperado enquanto só existir tooling nativo de governança.');
  }
  manual.push(...manifest.manualChecks);
  return { errors, warnings, manual };
}

async function validateCycles(root, manifest, errors) {
  const cyclesFile = path.join(root, manifest.cycles.file);
  const states = manifest.cycles.states;
  const project = path.join(root, '_project');
  const naming = Object.fromEntries(Object.entries(manifest.naming).map(([key, value]) => [key, new RegExp(value)]));
  const rows = [];

  if (await exists(cyclesFile)) {
    const content = await text(cyclesFile);
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\|\s*`(\d{3})`\s*\|[^|]*\|\s*`([^`]+)`\s*\|/);
      if (match) rows.push({ cycle: match[1], state: match[2] });
    }
    const seen = new Set();
    for (const { cycle, state } of rows) {
      if (seen.has(cycle)) errors.push(`Ciclo duplicado em cycles.md: ${cycle}.`);
      seen.add(cycle);
      if (!(state in states)) errors.push(`Estado de ciclo inválido em cycles.md: ${cycle} "${state}".`);
    }
    const next = content.match(/\*\*Próximo ciclo:\*\*\s*`(\d{3})`/);
    if (!next) {
      errors.push('cycles.md sem a declaração "Próximo ciclo".');
    } else if (rows.length) {
      const expected = String(Math.max(...rows.map((row) => Number(row.cycle))) + 1).padStart(3, '0');
      if (next[1] !== expected) errors.push(`Próximo ciclo incorreto em cycles.md: ${next[1]}; esperado ${expected}.`);
    }
  }

  // Locais dos ciclos: nomes, arquivos soltos, planos e tasks.
  const located = {};
  for (const location of ['drafts', 'executed', 'archived']) {
    const base = path.join(project, location);
    if (!(await exists(base))) continue;
    for (const entry of await readdir(base, { withFileTypes: true })) {
      const full = path.join(base, entry.name);
      if (!entry.isDirectory()) {
        errors.push(`Arquivo solto em _project/${location}/: ${entry.name}.`);
        continue;
      }
      if (!naming.cycleDir.test(entry.name)) {
        errors.push(`Diretório de ciclo fora da convenção: _project/${location}/${entry.name}.`);
        continue;
      }
      const cycle = entry.name.slice(0, 3);
      (located[cycle] ??= []).push(location);
      const row = rows.find((item) => item.cycle === cycle);
      const concluded = location === 'executed' || row?.state === 'Concluído';
      let hasPlan = false;
      for (const file of await readdir(full, { withFileTypes: true })) {
        const name = file.name;
        const match = file.isFile() ? name.match(naming.cycleFile) : null;
        if (!match) {
          errors.push(`Artefato fora da convenção: _project/${location}/${entry.name}/${name}.`);
          continue;
        }
        if (match.groups.cycle !== cycle) {
          errors.push(`Artefato com ciclo divergente da pasta: _project/${location}/${entry.name}/${name}.`);
        }
        const content = await text(path.join(full, name));
        if (name.endsWith('_plan.md')) {
          hasPlan = true;
          const status = header(content, 'Status');
          const allowed = manifest.plans.statesByLocation[location];
          if (!status) errors.push(`Plano sem Status: _project/${location}/${entry.name}/${name}.`);
          else if (!allowed.includes(status)) {
            errors.push(`Plano com estado "${status}" incompatível com _project/${location}/ (${entry.name}).`);
          }
        }
        if (name.includes('_task_')) {
          const taskCycle = header(content, 'Ciclo');
          if (taskCycle && taskCycle !== cycle) {
            errors.push(`Task com ciclo ${taskCycle} divergente da pasta: _project/${location}/${entry.name}/${name}.`);
          }
          const state = header(content, 'Estado');
          if (!state || !manifest.tasks.states.includes(state)) {
            errors.push(`Task com estado inválido "${state ?? ''}": _project/${location}/${entry.name}/${name}.`);
          } else if (concluded && state !== manifest.tasks.doneState) {
            errors.push(`Ciclo ${cycle} concluído com task ainda ativa: ${name} (${state}).`);
          }
        }
      }
      if (!hasPlan) errors.push(`Ciclo sem plano: _project/${location}/${entry.name}.`);
    }
  }

  // Coerência entre cycles.md e o local do ciclo.
  for (const { cycle, state } of rows) {
    const expected = states[state];
    const where = located[cycle] ?? [];
    if (where.length > 1) errors.push(`Ciclo ${cycle} presente em mais de um local: ${where.join(', ')}.`);
    if (expected === 'ideations') {
      const ideations = await listFiles(path.join(project, 'ideations'));
      if (!ideations.some((file) => path.basename(file).startsWith(`${cycle}_`))) {
        errors.push(`Ciclo ${cycle} em Ideação sem arquivo em _project/ideations/.`);
      }
    } else if (expected && !where.includes(expected)) {
      errors.push(`Ciclo ${cycle} "${state}" deveria estar em _project/${expected}/.`);
    }
  }

  // Nomes de ideações, ADRs e KBs.
  const named = [
    ['ideations', naming.ideation],
    ['decisions', naming.adr],
    ['knowledge', naming.kb],
  ];
  for (const [dir, pattern] of named) {
    for (const file of await listFiles(path.join(project, dir))) {
      if (!pattern.test(path.basename(file))) errors.push(`Artefato fora da convenção: _project/${dir}/${path.basename(file)}.`);
    }
  }
}

async function validateMigrations(root, migrations, errors) {
  const dir = path.join(root, migrations.dir);
  if (!(await exists(dir))) return;
  const pattern = new RegExp(migrations.namePattern);
  const files = (await listFiles(dir)).sort();
  const created = new Map();
  const enabled = new Set();
  const ident = '((?:"[^"]+"|[\\w$]+)(?:\\s*\\.\\s*(?:"[^"]+"|[\\w$]+))?)';
  const createRe = new RegExp(`create\\s+(?:(?:global\\s+|local\\s+)?(?:temporary|temp)\\s+|unlogged\\s+)?table\\s+(?:if\\s+not\\s+exists\\s+)?${ident}`, 'gi');
  const enableRe = new RegExp(`alter\\s+table\\s+(?:if\\s+exists\\s+)?(?:only\\s+)?${ident}\\s+enable\\s+row\\s+level\\s+security`, 'gi');

  for (const file of files) {
    const name = path.basename(file);
    if (!pattern.test(name)) errors.push(`Migração fora do padrão AAAAMMDDHHMMSS_assunto.sql: ${name} (G4).`);
    if (path.extname(name) !== '.sql') continue;
    const sql = stripComments(await text(file));
    for (const match of sql.matchAll(createRe)) {
      const table = qualify(match[1]);
      if (table.startsWith('public.') && !created.has(table)) created.set(table, name);
    }
    for (const match of sql.matchAll(enableRe)) enabled.add(qualify(match[1]));
  }
  for (const [table, name] of created) {
    if (!enabled.has(table)) errors.push(`Tabela ${table} criada em ${name} sem "enable row level security" (G2).`);
  }
}

async function validateShortTrack(root, manifest, errors) {
  const config = manifest.shortTrack;
  const pattern = new RegExp(manifest.naming.fix);
  for (const file of await listFiles(path.join(root, config.dir))) {
    const name = path.basename(file);
    const match = name.match(pattern);
    if (!match) {
      errors.push(`Artefato fora da convenção em ${config.dir}/: ${name}.`);
      continue;
    }
    const content = await text(file);
    const where = `${config.dir}/${name}`;
    if (header(content, 'Trilha') !== 'curta') errors.push(`Task da trilha curta sem "Trilha: curta": ${where} (G5).`);
    if (header(content, 'Issue') !== `#${match.groups.issue}`) errors.push(`Task da trilha curta sem a issue #${match.groups.issue}: ${where} (G5).`);
    const state = header(content, 'Estado');
    if (!state || !manifest.tasks.states.includes(state)) errors.push(`Task com estado inválido "${state ?? ''}": ${where}.`);

    const eligibility = section(content, config.eligibilityHeading);
    if (!eligibility) {
      errors.push(`Task da trilha curta sem justificativa de elegibilidade: ${where} (G5).`);
    } else {
      for (const criterion of config.eligibilityCriteria) {
        const line = eligibility.split(/\r?\n/).find((item) => item.includes(`${criterion}:`));
        const answer = line?.split(`${criterion}:`)[1]?.trim();
        if (!answer) errors.push(`Task da trilha curta sem justificativa para "${criterion}": ${where} (G5).`);
      }
    }
    const barriers = section(content, '## Barreiras de domínio') ?? '';
    for (const barrier of config.barriers) {
      const row = barriers.split(/\r?\n/).find((line) => line.startsWith(`| ${barrier}`));
      const cells = row?.split('|').slice(1, -1).map((cell) => cell.trim()) ?? [];
      if (cells.length < 3 || !cells[1] || !cells[2]) {
        errors.push(`Task da trilha curta sem a barreira ${barrier} declarada e justificada: ${where} (G5).`);
      }
    }
  }
}

// Utilitários.

function siblingPattern(repositories) {
  const names = repositories.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const boundary = '(?![\\w-])';
  const relative = `\\.\\.[\\\\/](?:[^\\s'"\`|<>]*[\\\\/])?(?:${names})${boundary}`;
  const windows = `(?:^|[^\\w])[A-Za-z]:[\\\\/](?:[^\\s'"\`|<>]*[\\\\/])?(?:${names})${boundary}`;
  const posix = `(?:^|[\\s'"\`(=])\\/(?:[^\\s'"\`|<>]*\\/)?(?:${names})${boundary}`;
  return new RegExp(`${relative}|${windows}|${posix}`, 'im');
}

function frontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (pair) fields[pair[1]] = pair[2].replace(/^["']|["']$/g, '').trim();
  }
  return fields;
}

function header(content, field) {
  const match = content.match(new RegExp(`^>\\s*\\*\\*${field}:\\*\\*\\s*\`([^\`]+)\``, 'm'));
  return match ? match[1].trim() : null;
}

function section(content, heading) {
  const start = content.indexOf(`${heading}\n`) >= 0 ? content.indexOf(`${heading}\n`) : content.indexOf(`${heading}\r\n`);
  if (start < 0) return null;
  const rest = content.slice(start + heading.length);
  const end = rest.search(/\r?\n## /);
  return end < 0 ? rest : rest.slice(0, end);
}

function qualify(identifier) {
  const parts = identifier.split('.').map((part) => part.trim().replace(/^"|"$/g, '').toLowerCase());
  return parts.length === 1 ? `public.${parts[0]}` : `${parts[0]}.${parts[1]}`;
}

function stripComments(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\r\n]*/g, ' ');
}

function normalize(value) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function text(file) {
  return readFile(file, 'utf8');
}

async function listFiles(dir, recursive = false) {
  if (!(await exists(dir))) return [];
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isFile()) result.push(full);
    else if (recursive && entry.isDirectory()) result.push(...(await listFiles(full, true)));
  }
  return result;
}

async function listDirs(dir) {
  if (!(await exists(dir))) return [];
  return (await readdir(dir, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => path.join(dir, entry.name));
}

async function walk(root, exclusions, dir = root) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const relative = path.relative(root, full).replaceAll('\\', '/');
    if (entry.isDirectory()) {
      if (exclusions.some((excluded) => `${relative}/`.startsWith(excluded))) continue;
      result.push(...(await walk(root, exclusions, full)));
    } else if (entry.isFile()) {
      result.push(full);
    }
  }
  return result;
}

async function main() {
  const index = process.argv.indexOf('--root');
  const root = path.resolve(index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : defaultRoot);
  const { errors, warnings, manual } = await validate(root);
  for (const message of errors) console.log(`[ERRO] ${message}`);
  for (const message of warnings) console.log(`[AVISO] ${message}`);
  for (const message of manual) console.log(`[MANUAL] ${message}`);
  console.log(`\nRoot: ${root}`);
  console.log(`Resultado: ${errors.length} erro(s), ${warnings.length} aviso(s), ${manual.length} item(ns) manual(is).`);
  process.exitCode = errors.length ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
