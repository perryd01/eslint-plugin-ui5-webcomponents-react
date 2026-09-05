import { Glob } from "bun";
import { rm } from "node:fs/promises";

const entry = "src/index.ts";
const external = ["@oxlint/plugins"];

async function stripSourcesContent() {
  const glob = new Glob("dist/*.map");
  for (const file of glob.scanSync(".")) {
    const sourceMap = JSON.parse(await Bun.file(file).text());
    delete sourceMap.sourcesContent;
    await Bun.write(file, `${JSON.stringify(sourceMap)}\n`);
  }
}

await rm("dist", { recursive: true, force: true });

await Bun.build({
  entrypoints: [entry],
  outdir: "dist",
  naming: "index.js",
  format: "esm",
  target: "node",
  external,
  sourcemap: "external",
});

await Bun.build({
  entrypoints: [entry],
  outdir: "dist",
  naming: "index.cjs",
  format: "cjs",
  target: "node",
  external,
  sourcemap: "external",
});

const tsc = Bun.spawnSync(["bunx", "tsc", "-p", "tsconfig.build.json"]);
if (!tsc.success) {
  process.stderr.write(tsc.stderr.toString());
  process.exit(tsc.exitCode ?? 1);
}

console.log("Build complete → dist/");

await stripSourcesContent();
console.log("Stripped sourcesContent from sourcemaps");
