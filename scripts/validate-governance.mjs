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
    // Cenário 26: situações de saída pertencentes à lista fechada.
    if (manifest.nextStep && workflows.exitHeading) {
      const exits = headedSection(content, workflows.exitHeading);
      const items = (exits ?? '').split(/\r?\n/).filter((line) => /^- /.test(line)).map((line) => line.slice(2).trim());
      if (exits !== null && !items.length) errors.push(`Workflow ${rel(file)} sem situações em "${workflows.exitHeading}".`);
      for (const item of items) {
        if (!situationOf(manifest.nextStep, item)) errors.push(`Workflow ${rel(file)} com situação de saída fora da lista: "${item}".`);
      }
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
  const rows = await validateCycles(root, manifest, errors);
  if (manifest.backlog) await validateBacklog(root, manifest, rows, errors);

  // Cenários 20 a 25 e 27 a 30: artefatos, próximo passo e modo contínuo.
  if (manifest.artifacts && manifest.nextStep) {
    await validateArtifacts(root, manifest, rows, errors);
    // Cenário 21: tabela de situações sincronizada com o manifesto.
    await validateSituationsSync(root, manifest, errors);
  }

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

// Backlog é dado, não artefato de ciclo: vazio é válido e não exige handoff.
async function validateBacklog(root, manifest, rows, errors) {
  const config = manifest.backlog;
  const file = path.join(root, config.file);
  if (!(await exists(file))) return; // Presença é conferida em requiredFiles.
  const content = withoutFencedCode(await text(file)).replace(/<!--[\s\S]*?-->/g, '');
  const headings = [...content.matchAll(/^##[ \t]+(BL[^ \t\n]*)([^\n]*)$/gm)];
  const items = headings.map((match, index) => ({
    id: match[1],
    title: match[2].match(/^[ \t]+—[ \t]*(.*)$/)?.[1].trim(),
    body: content.slice(match.index + match[0].length, headings[index + 1]?.index ?? content.length),
  }));
  const ids = new Set();
  const idPattern = new RegExp(config.idPattern);
  for (const item of items) {
    if (!idPattern.test(item.id)) errors.push(`Backlog: ID inválido "${item.id}".`);
    if (ids.has(item.id)) errors.push(`Backlog: ID duplicado ${item.id}.`);
    ids.add(item.id);
  }
  for (const { id, title, body } of items) {
    const fail = (reason) => errors.push(`Backlog ${id}: ${reason}.`);
    if (!title) fail('título obrigatório vazio');
    for (const field of config.headers) {
      const value = header(body, escape(field));
      if (!value || value === '—') fail(`campo obrigatório "${field}" vazio ou ausente`);
    }
    for (const name of config.sections) {
      const value = headedSection(body, `### ${name}`)?.trim();
      if (!value || (config.nonEmptySections.includes(name) && value === '—')) fail(`seção obrigatória "${name}" vazia ou ausente`);
    }
    const state = header(body, 'Estado');
    if (!config.states.includes(state)) fail(`estado inválido "${state}"`);
    const reason = headedSection(body, `### ${config.archiveReason}`)?.trim();
    if (state === config.archivedState && (!reason || reason === '—')) fail('Arquivado exige motivo do arquivamento');

    const destinations = headedSection(body, `### ${config.destinationsSection}`) ?? '';
    const refs = [...destinations.matchAll(/^-\s+(?:ciclo (\d{3})|issue #(\d+))\s+—\s+\S.*$/gm)];
    if (state === config.forwardedState && !refs.length) fail('Encaminhado exige destino existente');
    for (const ref of refs) {
      if (ref[1]) {
        // O registro resolve o ciclo, e um artefato confirma sua existência local.
        const cycle = ref[1];
        let found = false;
        if (rows.some((row) => row.cycle === cycle)) {
          found = (await listFiles(path.join(root, '_project/ideations'))).some((entry) => path.basename(entry).startsWith(`${cycle}_`));
          for (const location of ['drafts', 'executed', 'archived']) {
            for (const dir of await listDirs(path.join(root, '_project', location))) {
              if (path.basename(dir).startsWith(`${cycle}_`) && await exists(path.join(dir, `${cycle}_plan.md`))) found = true;
            }
          }
        }
        if (!found) fail(`destino ciclo ${cycle} inexistente`);
      } else if (!(await exists(path.join(root, manifest.shortTrack.dir, `fix_task_issue-${ref[2]}.md`)))) {
        fail(`destino issue #${ref[2]} inexistente`);
      }
    }
    for (const ref of body.matchAll(/\bBL-[\p{L}\p{N}_]+\b/gu)) {
      if (!ids.has(ref[0])) fail(`referência interna inexistente ${ref[0]}`);
    }
  }
}

// Exemplos cercados por crases ou tils não são itens, campos ou referências.
function withoutFencedCode(content) {
  let fence = null;
  return content.split(/\r?\n/).map((line) => {
    const match = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (match && match[1][0] === fence[0] && match[1].length >= fence.length && !match[2].trim()) fence = null;
      return '';
    }
    if (match) { fence = match[1]; return ''; }
    return line;
  }).join('\n');
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
  return rows;
}

async function validateArtifacts(root, manifest, rows, errors) {
  const config = manifest.artifacts;
  const project = path.join(root, '_project');
  const legacy = new Set(config.legacyV1);
  const doneTask = manifest.tasks.doneState;
  const artifacts = [];

  // Ideações, planos e tasks de ciclo, e tasks da trilha curta.
  for (const file of await listFiles(path.join(project, 'ideations'))) {
    if (path.extname(file) !== '.md') continue;
    const cycle = path.basename(file).slice(0, 3);
    const state = rows.find((row) => row.cycle === cycle)?.state;
    artifacts.push({ file, kind: 'ideation', location: 'ideations', active: state === 'Ideação' });
  }
  for (const location of ['drafts', 'executed', 'archived']) {
    for (const dir of await listDirs(path.join(project, location))) {
      for (const file of await listFiles(dir)) {
        const name = path.basename(file);
        const kind = name.endsWith('_plan.md') ? 'plan' : name.includes('_task_') ? 'task' : null;
        if (kind) artifacts.push({ file, kind, location, dir });
      }
    }
  }
  for (const file of await listFiles(path.join(root, manifest.shortTrack.dir))) {
    artifacts.push({ file, kind: 'task', location: 'fixes' });
  }

  const plans = new Map();
  for (const item of artifacts) {
    item.rel = path.relative(root, item.file).replaceAll('\\', '/');
    item.content = await text(item.file);
    item.legacy = legacy.has(item.rel);
    if (item.kind === 'plan') plans.set(item.dir, item);
  }

  for (const item of artifacts) {
    const { rel, content, kind, location } = item;
    if (item.active === undefined) {
      item.active =
        (kind === 'plan' && location === 'drafts') ||
        (kind === 'task' && (location === 'drafts' || location === 'fixes') && header(content, 'Estado') !== doneTask);
    }

    // Cenário 30: versão do contrato fora da lista de legados.
    if (!item.legacy && header(content, config.versionField) !== config.version) {
      errors.push(`Artefato sem ${config.versionField} \`${config.version}\` no cabeçalho e fora da lista de legados: ${rel}.`);
    }

    // Cenários 20 e 28: bloco "Próximo passo".
    const block = nextStepLines(content, manifest.nextStep.heading);
    if (item.active) {
      if (block) checkBlock(block, manifest.nextStep, rel, errors);
      else if (!item.legacy) errors.push(`Artefato ativo sem a seção "${manifest.nextStep.heading}": ${rel}.`);
    } else if (location === 'executed' && !item.legacy) {
      if (!block) errors.push(`Artefato executado sem a seção "${manifest.nextStep.heading}": ${rel}.`);
      else if (checkBlock(block, manifest.nextStep, rel, errors) && !block[1].startsWith(`Situação: ${manifest.nextStep.doneSituation} — `)) {
        errors.push(`Artefato executado com bloco diferente de "${manifest.nextStep.doneSituation}": ${rel}.`);
      }
    }

    // Cenários 22 a 25: planos ativos.
    if (kind === 'plan' && location === 'drafts') {
      const level = header(content, 'Nível');
      if (!config.levels.includes(level)) errors.push(`Plano sem Nível válido (${config.levels.join(' ou ')}): ${rel}.`);
      const status = header(content, 'Status');
      if (status === 'Aprovado' || status === 'Em Execução') {
        const approval = header(content, 'Aprovação humana pós-revisão') ?? '';
        const verdict = header(content, 'Veredito da revisão');
        const continuous = header(content, 'Modo contínuo');
        if (approval.startsWith(config.approvalPrefixes.human)) {
          if (!config.approvalVerdicts.includes(verdict)) errors.push(`Plano ${status} sem veredito apto: ${rel}.`);
        } else if (approval.startsWith(config.approvalPrefixes.continuous)) {
          if (continuous !== 'ativo' && continuous !== 'suspenso') errors.push(`Plano coberto pelo modo contínuo sem modo contínuo declarado: ${rel}.`);
          if (verdict !== config.continuousVerdict) errors.push(`Plano promovido pelo modo contínuo sem veredito "${config.continuousVerdict}": ${rel}.`);
        } else {
          errors.push(`Plano ${status} sem aprovação humana pós-revisão válida: ${rel}.`);
        }
      }
      if (new RegExp(config.gateCodePattern).test(content)) errors.push(`Plano ativo com código de gate com letras: ${rel}.`);
    }

    // Cenário 24: teto de rodadas de revisão.
    const review = kind === 'plan' ? headedSection(content, '## Revisão crítica') : headedSection(content, '## Revisão da correção');
    const rounds = (review ?? '').split(/\r?\n/).filter((line) => /^### Rodada \d+/.test(line)).length;
    if (rounds > config.maxReviewRounds) errors.push(`Mais de ${config.maxReviewRounds} rodadas de revisão: ${rel}.`);

    // Cenários 27 e 29: modo contínuo.
    const continuous = header(content, 'Modo contínuo');
    if (continuous && !config.continuousStates.includes(continuous)) errors.push(`Modo contínuo inválido "${continuous}": ${rel}.`);
    if ((continuous === 'ativo' || continuous === 'suspenso') && !/^>\s*\*\*Autorização inicial:\*\*\s*\S/m.test(content)) {
      errors.push(`Modo contínuo sem Autorização inicial: ${rel}.`);
    }
    if (continuous === 'ativo') {
      const level = kind === 'plan' ? header(content, 'Nível') : header(plans.get(item.dir)?.content ?? '', 'Nível');
      if (level === 'completo') errors.push(`Modo contínuo ativo em ciclo completo: ${rel}.`);
      for (const barrier of ['G1', 'G2']) {
        if (barrierApplies(content, barrier)) errors.push(`Modo contínuo ativo com ${barrier} aplicável: ${rel}.`);
      }
    }
  }
}

async function validateSituationsSync(root, manifest, errors) {
  const readme = path.join(root, '_project', 'README.md');
  if (!(await exists(readme))) return;
  const content = await text(readme);
  const table = headedSection(content, manifest.nextStep.readmeSection);
  if (table === null) return;
  const cells = (line) => line.split('|').slice(1, -1).map((cell) => cell.trim());
  const tableRows = table.split(/\r?\n/).filter((line) => line.startsWith('|')).map(cells);
  for (const situation of manifest.nextStep.situations) {
    const row = tableRows.find((item) => item[0] === situation.name);
    if (!row) {
      errors.push(`Situação "${situation.name}" do manifesto ausente da tabela de _project/README.md.`);
      continue;
    }
    if (row[1] !== situation.who || row[2] !== situation.check) {
      errors.push(`Situação "${situation.name}" com "Quem age" ou "Conferir" divergente entre o manifesto e _project/README.md.`);
    }
    for (const say of situation.say) {
      if (!content.includes(say.text)) errors.push(`Frase "${say.text}" do manifesto ausente de _project/README.md.`);
    }
  }
  const names = new Set(manifest.nextStep.situations.map((item) => item.name));
  for (const row of tableRows.slice(2)) {
    if (row.length >= 4 && !names.has(row[0])) errors.push(`Situação "${row[0]}" de _project/README.md ausente do manifesto.`);
  }
  for (const suffix of manifest.nextStep.continuousSuffixes) {
    if (!content.includes(suffix.trim())) errors.push(`Sufixo "${suffix.trim()}" do manifesto ausente de _project/README.md.`);
  }
}

// Confere as cinco linhas do bloco; retorna true se o formato for válido.
function checkBlock(lines, config, where, errors) {
  const before = errors.length;
  const fail = (reason) => errors.push(`Bloco "Próximo passo" inválido em ${where}: ${reason}.`);
  if (lines.length !== 5 || lines[0] !== config.title) {
    fail(`esperadas 5 linhas iniciadas por "${config.title}"`);
    return false;
  }
  const match = lines[1].match(/^Situação: (.+?) — (.+)$/);
  const situation = match && situationOf(config, match[1]);
  if (!situation) {
    fail(`situação fora da lista em "${lines[1]}"`);
    return false;
  }
  const targets = config.targets.map(template);
  if (situation.name === config.situations[0].name) targets.push(template(config.triageTarget));
  if (!targets.some((pattern) => new RegExp(`^${pattern}$`).test(match[2]))) fail(`alvo "${match[2]}" fora do padrão`);
  if (situation.targets && !situation.targets.includes(match[2])) fail(`situação "${situation.name}" não permitida para "${match[2]}"`);
  if (match[2] === config.backlogTarget && !config.backlogSituations.includes(situation.name)) fail(`situação "${situation.name}" não permitida para backlog`);
  if (lines[2] !== `Quem: ${situation.who}`) fail(`"Quem" diferente da tabela para "${situation.name}"`);
  const check = lines[3].startsWith('Conferir: ') ? lines[3].slice(10).trim() : null;
  if (check === null || !check) fail('"Conferir" ausente');
  else if (situation.check === '—' ? check !== '—' : check === '—') fail(`"Conferir" incompatível com "${situation.name}"`);
  const say = lines[4].startsWith('Diga: ') ? lines[4].slice(6).trim() : '';
  const suffixes = `(?:${config.continuousSuffixes.map(escape).join('|')})?`;
  const accepted = situation.say.some((item) => {
    const body = template(item.text) + (item.continuous ? suffixes : '');
    return new RegExp(item.quoted === false ? `^${body}$` : `^"${body}"$`).test(say);
  });
  if (!accepted) fail(`frase "${say}" fora dos modelos de "${situation.name}"`);
  return errors.length === before;
}

function situationOf(config, name) {
  return config.situations.find((item) => new RegExp(`^${template(item.name)}$`).test(name.trim()) || item.name === name.trim());
}

// Converte um modelo com NNN, #N, <título> e "rodada N" em expressão regular.
function template(value) {
  return escape(value)
    .replaceAll('NNN', '\\d{3}')
    .replaceAll('#N', '#\\d+')
    .replaceAll('rodada N', 'rodada \\d+')
    .replaceAll('<título>', '.+');
}

function escape(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function nextStepLines(content, heading) {
  const body = headedSection(content, heading);
  if (body === null) return null;
  const fence = body.match(/```text\r?\n([\s\S]*?)\r?\n```/);
  return fence ? fence[1].split(/\r?\n/).map((line) => line.trim()).filter(Boolean) : [];
}

function barrierApplies(content, barrier) {
  const table = headedSection(content, '## Barreiras de domínio') ?? '';
  const row = table.split(/\r?\n/).find((line) => line.startsWith(`| ${barrier}`));
  const cells = row?.split('|').slice(1, -1).map((cell) => cell.trim()) ?? [];
  return /^sim\b/i.test(cells[1] ?? '');
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

// Seção iniciada por um título no início de linha, até o próximo título de nível igual ou superior.
function headedSection(content, heading) {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trimEnd() === heading);
  if (start < 0) return null;
  const level = heading.match(/^#+/)[0].length;
  const end = lines.findIndex((line, index) => index > start && /^#+\s/.test(line) && line.match(/^#+/)[0].length <= level);
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n');
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
