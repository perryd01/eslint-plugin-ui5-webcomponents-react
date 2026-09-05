import { $ } from "bun";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";

interface OxlintResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

async function runOxlint(cwd: string, args: string[]): Promise<OxlintResult> {
  const { stdout, stderr, exitCode } = await $`oxlint ${args}`.cwd(cwd).quiet().nothrow();
  return { exitCode: exitCode!, stdout: stdout.toString(), stderr: stderr.toString() };
}

function fixtureClass(count: number): string {
  return Array.from({ length: count }, (_, i) => `class C${i} {}`).join("\n");
}

const distPath = resolve(import.meta.dir, "../dist/index.js");
const dir = await mkdtemp(join(tmpdir(), "oxlint-check-"));
try {
  await writeFile(join(dir, "valid.ts"), fixtureClass(3));
  await writeFile(join(dir, "theming-valid.ts"), "const x = 'var(--foo)';");
  await writeFile(join(dir, "theming-invalid.ts"), "const x = 'var(--sapNegativeColor)';");
  await writeFile(
    join(dir, ".oxlintrc.json"),
    JSON.stringify({
      jsPlugins: [
        {
          name: "ui5-webcomponents-react",
          specifier: distPath,
        },
      ],
      rules: {
        "ui5-webcomponents-react/use-theming-parameters": "warn",
        "no-unused-vars": "off",
      },
    }),
  );

  await $`bun run scripts/build.ts`.quiet();

  const valid = await runOxlint(dir, ["valid.ts", "theming-valid.ts"]);
  const invalid = await runOxlint(dir, ["theming-invalid.ts"]);

  console.log("── valid ──");
  console.log(valid.exitCode, valid.stdout.trim() || "(no diagnostics)");
  console.log("── invalid ──");
  console.log(invalid.exitCode, invalid.stdout.trim() || "(no diagnostics)");

  if (valid.exitCode !== 0 || valid.stdout.trim() !== "") {
    console.error("FAIL: valid fixture produced diagnostics");
    process.exit(1);
  }
  if (!invalid.stdout.includes("use-theming-parameters")) {
    console.error("FAIL: expected 'use-theming-parameters' diagnostic in oxlint output");
    process.exit(1);
  }
  if (invalid.exitCode !== 0 && invalid.exitCode !== 1) {
    console.error("FAIL: unexpected oxlint exit code");
    process.exit(1);
  }

  console.log("✓ oxlint loads and runs the plugin from dist/");
} finally {
  await rm(dir, { recursive: true, force: true });
}
