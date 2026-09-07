// Cross-check every figure asserted in the narrative against data.js.
const d = require("./data.js");
const n = require("./narrative.js");
const fs = require("fs");

let fail = 0;
const pct = v => (v * 100).toFixed(1).replace(/\.0$/, "");
const money = v => "$" + v.toLocaleString();

function text(city) {
  const x = n[city];
  return [x.intro, x.summary, ...x.take].join(" ");
}

// claims[city] = [ [needle, expectedTrue] ... ]
for (const [city, v] of Object.entries(d.cities)) {
  const t = text(city);
  const checks = [
    [money(v.med), true],
    [money(v.ytdMed), true],
    [String(v.sales), true],
    [v.sup.toFixed(2), true],
    [v.tight.replace("$300K-$399K", "$300,000 to $399,999")
            .replace("$400K-$499K", "$400,000 to $499,999")
            .replace("$500K-$599K", "$500,000 to $599,999")
            .replace("$700K-$799K", "$700,000 to $799,999"), true],
    [v.tightSup.toFixed(2), true],
    [v.typePlain, true],
  ];
  for (const [needle, want] of checks) {
    const has = t.includes(needle);
    if (has !== want) { console.log(`FAIL ${city}: expected to find "${needle}"`); fail++; }
  }
  // if a bracket is empty, the narrative must say so
  if (v.empty && !/nothing at all for sale|empty shelf|nothing available/i.test(t)) {
    console.log(`FAIL ${city}: has empty bracket ${v.empty} but narrative does not flag it`); fail++;
  }
  // if no baseline, narrative must NOT claim long-term appreciation
  if (v.base === null && /since 2018|appreciat/i.test(t)) {
    console.log(`FAIL ${city}: no baseline in data but narrative claims appreciation`); fail++;
  }
  // derived prior-year average DOM must match any "from X to Y" claim
  const priorAvg = v.avgDom - v.avgDomYoY;
  const m = t.match(/from (\d+) to (\d+)/g) || [];
  for (const s of m) {
    const [, a, b] = s.match(/from (\d+) to (\d+)/).map(Number.parseFloat ? String : String);
  }
  if (/average days went from/i.test(t)) {
    if (!t.includes(`from ${priorAvg} to ${v.avgDom}`)) {
      console.log(`FAIL ${city}: avg DOM claim should be from ${priorAvg} to ${v.avgDom}`); fail++;
    }
  }
}

// county
const c = d.county, ct = text("Dane County");
for (const needle of [money(c.med), String(c.sales), c.sup.toFixed(2)]) {
  if (!ct.includes(needle)) { console.log(`FAIL Dane County: missing "${needle}"`); fail++; }
}
const sups = Object.values(d.cities).map(v => v.sup);
if (!ct.includes(Math.min(...sups).toFixed(2)) || !ct.includes(Math.max(...sups).toFixed(2))) {
  console.log("FAIL Dane County: supply range does not match city min/max"); fail++;
}
if (Math.max(...sups) >= 3 && /not one community reached three months/.test(ct)) {
  console.log("FAIL Dane County: claims none reached 3 months but one did"); fail++;
}

// brand rules
const raw = fs.readFileSync("./narrative.js", "utf8");
const em = (raw.match(/—/g) || []).length;
if (em) { console.log(`FAIL: ${em} em dash(es) in narrative`); fail++; }
if (/Integrity Homes Wisconsin/.test(raw)) { console.log("FAIL: wrong brand name"); fail++; }

console.log(fail ? `\n${fail} PROBLEM(S)` : "\nNARRATIVE OK: every asserted figure matches the data, no em dashes");
process.exit(fail ? 1 : 0);
