import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

// Small test-only CommonJS loader to exercise the actual engine in Chromium.
// No production test routes, dependencies, fixture stories or asset files.
export function audioBundle() {
  const modules = new Map<string, string>();
  function visit(file: string): string {
    const id = path.resolve(file).replaceAll("\\", "/");
    if (modules.has(id)) return id;
    modules.set(id, "");
    const code = ts
      .transpileModule(fs.readFileSync(id, "utf8"), {
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.CommonJS,
        },
      })
      .outputText.replace(/require\("([^"]+)"\)/g, (_, specifier: string) => {
        const dependency = specifier.startsWith("@/")
          ? path.resolve("src", specifier.slice(2))
          : path.resolve(path.dirname(id), specifier);
        return `require(${JSON.stringify(visit(`${dependency}.ts`))})`;
      });
    modules.set(id, code);
    return id;
  }
  const entry = visit("src/lib/audio/audio-engine.ts");
  return `(() => {
    const modules = {${[...modules].map(([id, code]) => `${JSON.stringify(id)}: (module, exports, require) => {${code}\n}`).join(",")}};
    const cache = {};
    function require(id) { if (!cache[id]) { const module = { exports: {} }; cache[id] = module; modules[id](module, module.exports, require); } return cache[id].exports; }
    window.TestAudioEngine = require(${JSON.stringify(entry)}).AudioEngine;
  })();`;
}
