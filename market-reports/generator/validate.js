// The gate. Runs every rule in rules.js against every built page, plus the link
// allowlist, which needs its own data and so lives here.
//
// Nothing is hardcoded about the month or the output folder. Both come from data.js
// via build.js. validate.js spent the whole October run pointing at September's folder
// because it carried its own copy of the path.

const fs = require("fs");
const path = require("path");
const D = require("./data.js");
const B = require("./build.js");
const { rules, dataFor } = require("./rules.js");
const OUT = B.OUT;

// Every path verified HTTP 200 on 2026-09-01.
const LIVE = new Set([
  "/", "/wisco-hub", "/media", "/about", "/contact", "/evaluation",
  "/homes-for-sale", "/buyer-loan-programs/", "/buyer-loan-programs/va",
  "/madison/", "/waunakee/", "/sun-prairie/", "/verona/", "/middleton/", "/deforest/",
  "/homes-for-sale/madison-wisconsin/", "/homes-for-sale/waunakee-wisconsin/",
  "/homes-for-sale/sun-prairie-wisconsin/", "/homes-for-sale/verona-wisconsin/",
  "/homes-for-sale/middleton-wisconsin/", "/homes-for-sale/deforest-wisconsin/",
  "/schools/madison-metropolitan-school-district/", "/schools/waunakee-community-school-district/",
  "/schools/sun-prairie-area-school-district/", "/schools/verona-area-school-district/",
  "/schools/middleton-cross-plains-area-school-district/", "/schools/deforest-area-school-district/",
  "/market-reports/madison-wisconsin/", "/market-reports/waunakee-wisconsin/",
  "/market-reports/sun-prairie-wisconsin/", "/market-reports/verona-wisconsin/",
  "/market-reports/middleton-wisconsin/", "/market-reports/deforest-wisconsin/"
]);
for (const [, v] of Object.entries(D.cities))
  for (const a of v.archive) LIVE.add("/market-reports/" + v.slug + "/" + a);

const DEAD = ["/market-reports/", "/market-reports/dane-county-wisconsin", "/dane-county/",
              "/mls-disclaimer", "/in-the-media", "/about/", "/contact/", "/evaluation/",
              "/homes-for-sale/"];

let failures = 0;
const results = [];

const files = fs.existsSync(OUT) ? fs.readdirSync(OUT).filter(f => f.endsWith(".html")) : [];
if (!files.length) {
  console.log(`\nNo built pages found in ${OUT}. Run: node render.js\n`);
  process.exit(1);
}

for (const file of files.sort()) {
  const name = file.replace(/\.html$/, "");
  const html = fs.readFileSync(path.join(OUT, file), "utf8");
  const v = dataFor(name);
  const bad = [];

  if (!v) { bad.push("no entry in data.js for " + name); }
  else for (const r of rules) {
    let msg;
    try { msg = r.test(html, name, v); }
    catch (e) { msg = `rule threw: ${e.message}`; }
    if (msg) bad.push(`[${r.id}] ${msg}   (skill: ${r.skill})`);
  }

  // link allowlist
  const links = [...html.matchAll(/href="https:\/\/integrityhomeswi\.com([^"]*)"/g)].map(x => x[1] || "/");
  const unknown = [...new Set(links)].filter(l => !LIVE.has(l));
  if (unknown.length) bad.push(`[links] unverified: ${unknown.join(", ")}`);
  const deadHit = [...new Set(links)].filter(l => DEAD.includes(l) || /-wi\/$/.test(l) || /december-2025/.test(l));
  if (deadHit.length) bad.push(`[links] known-dead: ${deadHit.join(", ")}`);

  failures += bad.length;
  results.push([name, bad, links.length, html.length]);
}

console.log(`\n${D.label}`);
console.log(`${OUT}\n`);
for (const [name, bad, nlinks, size] of results) {
  if (bad.length) {
    console.log(`  FAIL  ${name}`);
    for (const b of bad) console.log(`          ${b}`);
  } else {
    console.log(`  ok    ${name.padEnd(24)} ${rules.length} rules | ${nlinks} links | ${(size / 1024).toFixed(0)} KB`);
  }
}
console.log("");
console.log(failures
  ? `${failures} RULE VIOLATION(S). No page is fit to publish until these are zero.`
  : `ALL ${results.length} PAGES PASS ALL ${rules.length} RULES`);
console.log("");
process.exit(failures ? 1 : 0);
