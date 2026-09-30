import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { runInThisContext } from "node:vm";
import ts from "typescript";

const cache = new Map<string, { exports: unknown }>();

// Playwright's JSX transform targets its component-test runtime. Compile server
// components with React's real JSX runtime for these in-process SSR assertions.
export function serverModule<T>(filename: string): T {
  const file = path.resolve(filename);
  const cached = cache.get(file);
  if (cached) return cached.exports as T;
  const loaded = { exports: {} as unknown };
  cache.set(file, loaded);
  const nativeRequire = createRequire(file);
  const requireModule = (specifier: string): unknown => {
    if (!specifier.startsWith(".") && !specifier.startsWith("@/"))
      return nativeRequire(specifier);
    const base = specifier.startsWith("@/")
      ? path.resolve("src", specifier.slice(2))
      : path.resolve(path.dirname(file), specifier);
    const resolved = [base, `${base}.ts`, `${base}.tsx`].find((candidate) =>
      fs.existsSync(candidate),
    );
    if (!resolved) throw new Error(`Missing test dependency: ${specifier}`);
    return serverModule(resolved);
  };
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const execute = runInThisContext(
    `(function(module, exports, require) { ${code}\n })`,
    { filename: file },
  ) as (
    module: { exports: unknown },
    exports: unknown,
    require: (specifier: string) => unknown,
  ) => void;
  execute(loaded, loaded.exports, requireModule);
  return loaded.exports as T;
}
