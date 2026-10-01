// Post-build inspection of the rendered HTML. validate.js checks schema and links;
// this checks the things that changed this month.
const fs = require("fs");
const path = require("path");
const B = require("./build.js");
const D = require("./data.js");
const OUT = B.OUT;

const files = {
  Madison: "madison-wisconsin", Waunakee: "waunakee-wisconsin",
  "Sun Prairie": "sun-prairie-wisconsin", Verona: "verona-wisconsin",
  Middleton: "middleton-wisconsin", DeForest: "deforest-wisconsin",
  "Dane County": "wisco-hub"
};

let bad = 0;
const fail = m => { console.log("  FAIL " + m); bad++; };
const words = h => h.replace(/<script[\s\S]*?<\/script>/g, " ")
  .replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ")
  .split(/\s+/).filter(Boolean).length;

for (const [city, slug] of Object.entries(files)) {
  const p = path.join(OUT, slug + ".html");
  if (!fs.existsSync(p)) { fail(city + ": no output file"); continue; }
  const h = fs.readFileSync(p, "utf8");
  const v = city === "Dane County" ? Object.assign({ zips: [] }, D.county) : D.cities[city];

  // dates
  if (!h.includes("Last updated: October 1, 2026")) fail(city + ": hero badge is not October 1, 2026");
  if (/September 1, 2026/.test(h)) fail(city + ": stale September 1, 2026 snapshot date present");
  if (!/"dateModified":\s*"2026-10-01"/.test(h)) fail(city + ": schema dateModified is not 2026-10-01");
  if (!h.includes("October 2026 Report")) fail(city + ": report label missing");

  // dashes
  const em = (h.match(/—/g) || []).length;
  if (em) fail(city + ": " + em + " em dash(es)");

  // market type
  if (!h.includes(v.typePlain)) fail(city + ": market type " + v.typePlain + " not in page");
  if (/Balanced Market/.test(h)) fail(city + ": contains Balanced Market");

  // zip table presence must match the data
  const hasZipTable = /Zip Code Detail/.test(h);
  const zipRowCount = (h.match(/<td><strong>5\d{4}<\/strong>/g) || []).length;
  if (v.zips.length && !hasZipTable) fail(city + ": has zip data but no zip table rendered");
  if (!v.zips.length && hasZipTable) fail(city + ": no zip data but a zip table rendered");
  if (v.zips.length && zipRowCount !== v.zips.length) fail(city + ": zip rows " + zipRowCount + " != data " + v.zips.length);
  // never explain the absence to the reader
  if (!v.zips.length && /zip (code )?(data|detail)[^<]{0,40}(unavailable|not available|no longer)/i.test(h))
    fail(city + ": explains a missing zip table to the reader");

  // hot zones, strictly under 1.00
  const trueHot = v.brackets.filter(b => b[1] > 0 && b[1] < 1);
  const hotLabels = (h.match(/<td>Hot zone<\/td>/g) || []).length;
  if (hotLabels !== trueHot.length) fail(city + ": " + hotLabels + " hot-zone labels vs " + trueHot.length + " bands under 1.00");
  if (v.brackets.some(b => b[1] === 1) && /1\.00<\/td><td>Hot zone/.test(h))
    fail(city + ": a band at exactly 1.00 is flagged as a hot zone");

  // John's Take
  const takeCount = (h.match(/<div class="johns-take">/g) || []).length;
  if (takeCount !== 1) fail(city + ": " + takeCount + " John's Take blocks");

  const w = words(h);
  const floor = city === "Dane County" ? 1700 : 2000;
  if (w < floor) fail(city + ": only " + w + " words");

  console.log(
    city.padEnd(13) + "words " + String(w).padEnd(6) +
    "| zips " + String(zipRowCount).padEnd(3) +
    "| hot " + String(hotLabels).padEnd(2) +
    "| FAQ " + String((h.match(/class="faq-a"/g) || []).length).padEnd(3) +
    "| " + v.typePlain
  );
}

// the two corrections that matter most this month
// Waunakee's old wrong figures are allowed to appear ONCE, inside John's Take, where he
// names them as the error being corrected. They must not appear anywhere else on the page.
const wau = fs.readFileSync(path.join(OUT, "waunakee-wisconsin.html"), "utf8");
if (!/425,500/.test(wau)) fail("Waunakee: corrected $425,500 baseline missing");
if (/265,005/.test(wau)) fail("Waunakee: Sun Prairie's $265,005 baseline is back on the page");
if (/90%/.test(wau)) fail("Waunakee: the old 90% appreciation claim is back on the page");
const sp = fs.readFileSync(path.join(OUT, "sun-prairie-wisconsin.html"), "utf8");
if (!/265,005/.test(sp)) fail("Sun Prairie: $265,005 baseline missing (it is genuinely Sun Prairie's)");

console.log("");
console.log(bad ? bad + " PROBLEM(S)" : "OUTPUT VERIFIED");
process.exit(bad ? 1 : 0);
