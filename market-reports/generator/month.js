// The whole month, one command:  node month.js
//
//   1. check the dataset before anything renders
//   2. render into a staging folder
//   3. run every rule against what was rendered
//   4. only if everything passes, move it into the delivery folder
//
// A failing build leaves NO publishable files. That is the point. The previous
// arrangement rendered first and checked afterwards, so broken pages sat in the
// delivery folder looking finished.

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const D = require("./data.js");

const node = process.execPath;
const run = (script, env) => {
  try {
    const out = execFileSync(node, [script], { encoding: "utf8", env: { ...process.env, ...env } });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout || "") + (e.stderr || "") };
  }
};

const line = s => console.log(s);
const rule = () => line("-".repeat(72));

line("");
line(`  ${D.label}`);
line(`  snapshot ${D.snapshot}  |  ${Object.keys(D.cities).length} cities + Dane County hub`);
rule();

// 1. dataset
line("  1/3  checking the dataset");
const data = run("verify-data.js");
if (!data.ok) {
  line(data.out.replace(/^/gm, "       "));
  line("");
  line("  STOPPED. The dataset is inconsistent, so nothing was rendered.");
  line("");
  process.exit(1);
}
line("       dataset consistent");

// 2. render to staging
const FINAL = require("./build.js").OUT;
const STAGE = FINAL + "-staging";
line("  2/3  rendering");
fs.rmSync(STAGE, { recursive: true, force: true });
const rendered = run("render.js", { MR_OUT: STAGE });
if (!rendered.ok) {
  line(rendered.out.replace(/^/gm, "       "));
  line("");
  line("  STOPPED. Render failed.");
  line("");
  process.exit(1);
}
const built = fs.existsSync(STAGE) ? fs.readdirSync(STAGE).filter(f => f.endsWith(".html")) : [];
line(`       ${built.length} pages rendered to staging`);

// 3. the gate
line("  3/3  running the rulebook");
const checked = run("validate.js", { MR_OUT: STAGE });
line(checked.out.replace(/^/gm, "  "));

if (!checked.ok) {
  line("  Staging kept for inspection at:");
  line("    " + STAGE);
  line("");
  line("  NOTHING was written to the delivery folder. Fix the violations and run again.");
  line("");
  process.exit(1);
}

// 4. promote
fs.rmSync(FINAL, { recursive: true, force: true });
fs.renameSync(STAGE, FINAL);
rule();
line("  PUBLISHED TO:");
line("    " + FINAL);
for (const f of fs.readdirSync(FINAL).filter(x => x.endsWith(".html")).sort())
  line(`      ${f.padEnd(28)} ${(fs.statSync(path.join(FINAL, f)).size / 1024).toFixed(0)} KB`);
line("");
line("  Every page passed every rule. Safe to paste.");
line("");
