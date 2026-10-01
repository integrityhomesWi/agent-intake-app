const fs = require("fs");
const D = require("./data.js");
// Take the output directory from build.js, never a literal. This was hardcoded to the
// September folder through the whole October run, so the validator kept reporting
// "ALL PAGES VALID" while reading last month's files.
const OUT = require("./build.js").OUT;

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
              "/homes-for-sale/", "-wi/", "december-2025"];

let fail = 0;
const bad = m => { console.log("  FAIL " + m); fail++; };

for (const file of fs.readdirSync(OUT).filter(f => f.endsWith(".html"))) {
  const html = fs.readFileSync(OUT + "/" + file, "utf8");
  const name = file.replace(".html", "");
  const issues = [];

  // 1. schema parses + all @id refs resolve
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!m) { bad(`${name}: no JSON-LD`); continue; }
  let g;
  try { g = JSON.parse(m[1]); } catch (e) { bad(`${name}: JSON-LD parse error ${e.message}`); continue; }
  const defined = new Set(g["@graph"].map(n => n["@id"]).filter(Boolean));
  const refs = [];
  (function walk(n) {
    if (Array.isArray(n)) return n.forEach(walk);
    if (n && typeof n === "object") {
      const k = Object.keys(n);
      if (n["@id"] && k.length === 1) refs.push(n["@id"]);
      for (const x of k) if (x !== "@id") walk(n[x]);
    }
  })(g["@graph"]);
  const dangling = refs.filter(r => !defined.has(r));
  if (dangling.length) bad(`${name}: ${dangling.length} dangling ref(s): ${[...new Set(dangling)].join(", ")}`);

  // 2. em dashes
  const em = (html.match(/—/g) || []).length;
  if (em) bad(`${name}: ${em} em dash(es)`);

  // 3. title/meta limits
  const t = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
  const d = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  if (t.length > 60) bad(`${name}: title ${t.length} chars`);
  if (d.length > 155) bad(`${name}: meta ${d.length} chars`);
  if (/\b(19|20)\d\d\b/.test(t) || /january|february|march|april|may|june|july|august|september|october|november|december/i.test(t))
    bad(`${name}: dated title "${t}"`);

  // Titles and metas must be EVERGREEN. A figure baked into them is true for one month
  // and quietly false for every month after, and the six-week no-touch rule means nobody
  // goes back to check. October 2026: five of seven pages were still carrying September
  // figures here, and Middleton's said buyers paid "over asking" when they paid under.
  // A digit in either field is the signal, so a digit in either field fails the build.
  // Urgency language is only honest when a band is genuinely under 1.0 month. DeForest
  // shipped "move quickly and offer cleanly" about a 1.57-month band while John's Take on
  // the same page said those homes took 50 days to sell. Tightest is a RANK, hot is a
  // THRESHOLD. Conflating the two is the most repeated defect in this generator.
  const cityKey = Object.keys(D.cities).find(c => D.cities[c].slug === name)
    || (name === "wisco-hub" ? "Dane County" : null);
  const dv = cityKey === "Dane County" ? D.county : D.cities[cityKey];
  if (dv) {
    const hotBands = dv.brackets.filter(b => b[1] > 0 && b[1] < 1).length;
    if (!hotBands) {
      for (const re of [/move quickly and offer cleanly/, /at or above list/, /leave you short/])
        if (re.test(html)) bad(`${name}: urgency language ${re} but no band is under 1.00 month`);
    }
    const marked = (html.match(/← hot zone/g) || []).length;
    if (marked !== hotBands) bad(`${name}: ${marked} hot-zone chart markers vs ${hotBands} bands under 1.00`);
  }

  // Article agreement. The skill states the rule outright: always "an Extreme Seller's
  // Market". It shipped as "a Extreme" on the live September pages, in prose and in the
  // FAQ schema, because the article was hardcoded next to an interpolated value.
  const aExtreme = (html.match(/a [Ee]xtreme/g) || []).length;
  if (aExtreme) bad(`${name}: "a Extreme" x${aExtreme}, should be "an Extreme"`);
  const aNum = (html.match(/a (8|11|18|8\d) day/g) || []).length;
  if (aNum) bad(`${name}: "a 8/11/18 day" x${aNum}, should be "an"`);

  if (/\d/.test(t)) bad(`${name}: title carries a figure, must be evergreen: "${t}"`);
  if (/\d/.test(d)) bad(`${name}: meta carries a figure, must be evergreen: "${d}"`);

  // 4. every internal link is verified-live
  const links = [...html.matchAll(/href="https:\/\/integrityhomeswi\.com([^"]*)"/g)].map(x => x[1] || "/");
  const unknown = [...new Set(links)].filter(l => !LIVE.has(l));
  if (unknown.length) bad(`${name}: unverified link(s): ${unknown.join(", ")}`);
  // exact-match dead check (substring would false-positive on legitimate city paths)
  const deadHit = [...new Set(links)].filter(l => DEAD.includes(l) || /-wi\/$/.test(l) || /december-2025/.test(l));
  if (deadHit.length) bad(`${name}: links to known-dead URL(s): ${deadHit.join(", ")}`);

  // 5. NO placeholders. A page either states a fact or says nothing.
  //    Never explain a missing figure to the reader, never ship "coming soon".
  const PLACEHOLDER = /could not be verified|left out rather than|not shown for|unconfirmed|placeholder|\bTBD\b|coming soon|to be determined|pending verification|we do not have|figure is not available|awaiting data|check back/i;
  const body = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
  const hit = body.match(PLACEHOLDER);
  if (hit) bad(`${name}: PLACEHOLDER language on the page: "${hit[0]}"`);

  // 6. required schema node types
  const types = g["@graph"].map(n => Array.isArray(n["@type"]) ? n["@type"][0] : n["@type"]);
  for (const need of ["Organization", "Person", "WebSite", "Article", "WebPage", "BreadcrumbList", "Place", "Dataset", "FAQPage"])
    if (!types.includes(need)) bad(`${name}: missing ${need} node`);

  if (!issues.length && !dangling.length)
    console.log(`  ok  ${name.padEnd(24)} ${g["@graph"].length} nodes | title ${String(t.length).padStart(2)} | meta ${d.length} | ${links.length} links`);
}

console.log(fail ? `\n${fail} PROBLEM(S)` : "\nALL PAGES VALID");
process.exit(fail ? 1 : 0);
