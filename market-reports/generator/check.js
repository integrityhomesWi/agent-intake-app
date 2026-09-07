const d = require("./data.js");
let ok = true;
const bad = m => { console.log("  " + m); ok = false; };

console.log("cities:", Object.keys(d.cities).length, "+ county\n");

for (const [k, v] of Object.entries(d.cities)) {
  // tightest bracket must be the smallest NON-ZERO supply
  const gt = v.brackets.filter(b => b[1] > 0).sort((a, b) => a[1] - b[1])[0];
  if (gt[0] !== v.tight || Math.abs(gt[1] - v.tightSup) > 0.001)
    bad(`${k}: tight=${v.tight}@${v.tightSup} but computed ${gt[0]}@${gt[1]}`);

  // empty flag must match the zero-supply bracket
  const zeros = v.brackets.filter(b => b[1] === 0).map(b => b[0]);
  if ((zeros[0] || null) !== v.empty) bad(`${k}: empty=${v.empty} but zeros=${JSON.stringify(zeros)}`);
  if (zeros.length > 1) bad(`${k}: more than one zero bracket ${JSON.stringify(zeros)}`);

  // YoY arithmetic
  const derived = v.med / v.priorMed - 1;
  if (Math.abs(derived - v.medYoY) > 0.006) bad(`${k}: medYoY ${v.medYoY} vs derived ${derived.toFixed(4)}`);
  const ds = v.sales / v.priorSales - 1;
  if (Math.abs(ds - v.salesYoY) > 0.006) bad(`${k}: salesYoY ${v.salesYoY} vs derived ${ds.toFixed(4)}`);
  if (v.dom - v.priorDom !== v.domYoY) bad(`${k}: domYoY ${v.domYoY} vs ${v.dom}-${v.priorDom}`);

  // supply sanity
  const sup = v.active / v.salesMo;
  if (Math.abs(sup - v.sup) > 0.06) bad(`${k}: supply ${v.sup} vs active/salesMo ${sup.toFixed(2)}`);

  // baseline present iff appreciation present
  if ((v.base === null) !== (v.appr === null)) bad(`${k}: baseline/appreciation mismatch`);
  if (v.base !== null && Math.abs(v.ytdMed / v.base - 1 - v.appr) > 0.002)
    bad(`${k}: appreciation ${v.appr} vs derived ${(v.ytdMed / v.base - 1).toFixed(4)}`);

  // market tier vs supply, threshold 2.0
  const expect = v.sup < 2.0 ? "Extreme" : "Strong";
  if (!v.typePlain.startsWith(expect)) bad(`${k}: sup ${v.sup} should be ${expect}, is ${v.typePlain}`);

  const zs = v.zips.reduce((s, z) => s + z[1], 0);
  if (v.sales !== zs) console.log(`  note ${k}: city sales ${v.sales} vs zip sum ${zs}`);
}

// no em dashes anywhere in the data
const raw = require("fs").readFileSync("./data.js", "utf8");
const em = (raw.match(/—/g) || []).length;
if (em) bad(`data.js contains ${em} em dash(es)`);

console.log(ok ? "\nDATA OK: all consistency checks passed" : "\nERRORS ABOVE");
process.exit(ok ? 0 : 1);
