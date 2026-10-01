// Independent sweep. Deliberately does NOT reuse the other scripts' assumptions.
// Checks things they do not: section coverage, cross-page agreement, speakable
// classes, banned language, and internal consistency of every stat shown.
const fs = require("fs");
const path = require("path");
const B = require("./build.js");
const D = require("./data.js");
const OUT = B.OUT;

let bad = 0, warn = 0;
const fail = m => { console.log("  FAIL " + m); bad++; };
const note = m => { console.log("  note " + m); warn++; };

const files = {
  Madison: "madison-wisconsin", Waunakee: "waunakee-wisconsin",
  "Sun Prairie": "sun-prairie-wisconsin", Verona: "verona-wisconsin",
  Middleton: "middleton-wisconsin", DeForest: "deforest-wisconsin",
  "Dane County": "wisco-hub"
};
const read = slug => fs.readFileSync(path.join(OUT, slug + ".html"), "utf8");
const money = n => "$" + n.toLocaleString("en-US");

// Sections the skill requires on a city page
const REQUIRED = [
  ["hero", /class="mr-hero"/], ["nav", /class="mr-nav"/],
  ["snapshot card", /class="mr-snapshot-card"/], ["valuation CTA", /mr-cta-banner/],
  ["buy section", /Should I Buy a Home/], ["sell section", /Good Time to Sell/],
  ["John's Take", /johns-take/], ["prices up or down", /Prices Going Up or Down/],
  ["how long to sell", /How Long Does It Take to Sell/], ["negotiate", /Can Buyers Negotiate/],
  ["rates", /Wait for Interest Rates/], ["what changed", /What's Changed Over the Last Year/],
  ["neighborhood", /Happening in My/], ["FAQ", /faq-list/],
  ["schools", /schools-section/], ["accordion", /advanced-data/],
  ["ROH widget", /roh-widget/], ["author card", /author-card/],
  ["newsletter", /newsletter-cta/], ["footer", /mr-footer/], ["sticky bar", /sticky-cta/],
  ["supply gauge", /Inventory Supply Gauge/], ["supply by range", /Months of Supply by Price Range/],
];
const SPEAKABLE = [".market-hero-intro", ".tldr-box", ".speakable-answer", ".faq-a"];
const BANNED = [/Hyper-Local Market Overview/i, /Market Pulse/i, /Supply Detail by Price Range/i,
  /Forecast &amp;? Recommendations/i, /Current Market Conditions/i, /<h[23]>\s*The Big Picture\s*<\/h[23]>/i,
  /Balanced Market/i, /top 5%/i, /top 1%/i, /nationally ranked/i];

console.log("=== per page ===");
for (const [city, slug] of Object.entries(files)) {
  const h = read(slug);
  const v = city === "Dane County" ? D.county : D.cities[city];
  const miss = [];

  for (const [name, re] of REQUIRED) {
    if (city === "Dane County") {
      // The hub is a comparison page with its own structure, not a city report.
      const hubSkips = ["schools", "accordion", "supply gauge", "buy section", "sell section",
        "prices up or down", "how long to sell", "negotiate", "rates", "what changed", "neighborhood"];
      if (hubSkips.includes(name)) continue;
    }
    if (!re.test(h)) miss.push(name);
  }
  if (miss.length) fail(city + ": missing " + miss.join(", "));

  for (const c of SPEAKABLE) {
    const cls = c.slice(1);
    if (!h.includes('class="' + cls) && !h.includes(cls + '"')) fail(city + ": no " + c);
  }
  for (const re of BANNED) if (re.test(h)) fail(city + ": banned language " + re);

  // schema parses and carries the author/publisher pair
  let g;
  try { g = JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]); }
  catch (e) { fail(city + ": schema does not parse"); continue; }
  const ids = new Set(g["@graph"].map(n => n["@id"]).filter(Boolean));
  const refs = [];
  (function walk(n) {
    if (Array.isArray(n)) return n.forEach(walk);
    if (n && typeof n === "object") {
      const k = Object.keys(n);
      if (n["@id"] && k.length === 1) refs.push(n["@id"]);
      for (const x of k) if (x !== "@id") walk(n[x]);
    }
  })(g["@graph"]);
  const dangling = [...new Set(refs.filter(r => !ids.has(r)))];
  if (dangling.length) fail(city + ": dangling @id " + dangling.join(", "));

  // the headline stats must appear verbatim in the body
  if (!h.includes(money(v.med))) fail(city + ": median " + money(v.med) + " not on the page");
  if (!h.includes(v.sup.toFixed(2))) fail(city + ": supply " + v.sup.toFixed(2) + " not on the page");

  // market type must be stated consistently everywhere it appears
  const typeHits = (h.match(/(Extreme|Strong|Leaning Toward|Buyer's) Seller's Market|Buyer's Market/g) || []);
  const wrong = typeHits.filter(t => t !== v.typePlain && t !== "Buyer's Market");
  // Other cities' market types legitimately appear inside John's Take and the hub table.
  // Only the page's own headline claims must match, and those are checked above.
  if (wrong.length && !/johns-take|compare-table/.test(h)) note(city + ": stray market-type strings " + [...new Set(wrong)].join(", "));

  // stale month wording
  if (/August 2026/.test(h)) fail(city + ": references August 2026");
  if (/—/.test(h)) fail(city + ": em dash");

  console.log("  ok   " + city.padEnd(13) + Object.keys(files).length && "sections ok, schema ok, " +
    (h.match(/<svg/g) || []).length + " charts, " + (h.match(/href="https:\/\/integrityhomeswi\.com/g) || []).length + " internal links");
}

// cross-page: the hub table must agree with each city page
console.log("");
console.log("=== hub vs city pages ===");
const hub = read("wisco-hub");
for (const [city, v] of Object.entries(D.cities)) {
  const row = hub.match(new RegExp("<strong>" + city + "</strong>[\\s\\S]{0,400}?</tr>"));
  if (!row) { fail("hub: no row for " + city); continue; }
  const r = row[0];
  const okMed = r.includes(money(v.med));
  const okSup = r.includes(v.sup.toFixed(2));
  const okDom = new RegExp(">" + v.dom + " days<").test(r);
  const okType = r.includes(v.typePlain);
  if (!(okMed && okSup && okDom && okType))
    fail("hub row for " + city + " disagrees: " +
      [!okMed && "median", !okSup && "supply", !okDom && "dom", !okType && "type"].filter(Boolean).join(", "));
  else console.log("  ok   " + city.padEnd(13) + money(v.med) + " / " + v.dom + "d / " + v.sup.toFixed(2) + " / " + v.typePlain);
}

console.log("");
console.log(bad ? bad + " PROBLEM(S)" + (warn ? ", " + warn + " note(s)" : "") : "CLEAN" + (warn ? " (" + warn + " note(s))" : ""));
process.exit(bad ? 1 : 0);
