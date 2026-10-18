import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

/** Permite ao Node 24 resolver os imports relativos sem extensão dos módulos TypeScript do app. */
export async function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith(".") || path.extname(specifier) || !context.parentURL?.startsWith("file:")) {
    return nextResolve(specifier, context);
  }

  const candidato = new URL(`${specifier}.ts`, context.parentURL);
  try {
    await stat(fileURLToPath(candidato));
    return nextResolve(candidato.href, context);
  } catch {
    return nextResolve(specifier, context);
  }
}

/** Transpila a sintaxe TypeScript usada pelo app, incluindo recursos além do strip-only do Node. */
export async function load(url, context, nextLoad) {
  if (!url.startsWith("file:") || !url.endsWith(".ts")) return nextLoad(url, context);
  const fonte = await readFile(fileURLToPath(url), "utf8");
  const resultado = ts.transpileModule(fonte, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      verbatimModuleSyntax: true,
    },
  });
  return { format: "module", source: resultado.outputText, shortCircuit: true };
}
