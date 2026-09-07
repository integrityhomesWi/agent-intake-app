const fs = require("fs");
const F = "C:/Users/admin/Downloads/madisonmarketreportseptember2026.html";
let s = fs.readFileSync(F, "utf8");
const EM = "\u2014";
const before = { em: (s.match(/\u2014/g)||[]).length, len: s.length };

/* ---------- 1. SCHEMA: align @id convention with the home page ---------- */
s = s.split("integrityhomeswi.com/#organization").join("integrityhomeswi.com/#org");
s = s.split("integrityhomeswi.com/#johnreuter").join("integrityhomeswi.com/#john");

/* ---------- 2. SCHEMA: insert the three missing identity nodes ---------- */
const IDENTITY = `
    {
      "@type": ["Organization", "RealEstateAgent"],
      "@id": "https://integrityhomeswi.com/#org",
      "name": "John Reuter - Integrity Homes",
      "url": "https://integrityhomeswi.com/",
      "logo": "https://cdn.lofty.com/image/fs/341054835208155/website/20980/cmsbuild/h200_20251213_d2364072487347e4-png.webp",
      "telephone": "+1-608-669-4226"
    },
    {
      "@type": "Person",
      "@id": "https://integrityhomeswi.com/#john",
      "name": "John Reuter",
      "jobTitle": "Broker/Owner",
      "url": "https://integrityhomeswi.com/about",
      "worksFor": { "@id": "https://integrityhomeswi.com/#org" }
    },
    {
      "@type": "WebSite",
      "@id": "https://integrityhomeswi.com/#website",
      "url": "https://integrityhomeswi.com/",
      "name": "Integrity Homes",
      "publisher": { "@id": "https://integrityhomeswi.com/#org" },
      "inLanguage": "en-US"
    },`;
const anchor = `"@graph": [`;
if (s.split(anchor).length !== 2) throw new Error("expected exactly one @graph anchor");
s = s.replace(anchor, anchor + IDENTITY);

/* ---------- 3. EM DASHES: curated exceptions (colon / period / parens) ---------- */
const X = [
  // table "no data" placeholder
  [`<td>${EM}</td>`, `<td>n/a</td>`],
  // headings & titles -> colon
  [`Housing Market Report ${EM} September 2026`, `Housing Market Report: September 2026`],
  [`Housing Market ${EM} September 2026`, `Housing Market: September 2026`],
  [`Market Snapshot ${EM} September 2026`, `Market Snapshot: September 2026`],
  [`Snapshot ${EM} August Closings`, `Snapshot: August Closings`],
  [`Madison Market Update ${EM} September 2026`, `Madison Market Update: September 2026`],
  [`Comparison ${EM} September 2026`, `Comparison: September 2026`],
  [`Housing Market ${EM} Frequently Asked Questions`, `Housing Market: Frequently Asked Questions`],
  [`Supply Gauge ${EM} Madison, September 2026`, `Supply Gauge: Madison, September 2026`],
  [`Supply Gauge ${EM} September 2026`, `Supply Gauge: September 2026`],
  [`Price Range ${EM} Madison, WI, September 2026`, `Price Range: Madison, WI, September 2026`],
  [`Price Range ${EM} Madison, September 2026`, `Price Range: Madison, September 2026`],
  [`Price Range ${EM} Detail`, `Price Range: Detail`],
  [`Zip Code Trends ${EM} August 2026 vs. August 2025`, `Zip Code Trends: August 2026 vs. August 2025`],
  [`Market ${EM} 1.96 months of supply`, `Market: 1.96 months of supply`],
  [`Market</strong> ${EM} 1.96 months of supply`, `Market</strong>: 1.96 months of supply`],
  [`Fastest zip ${EM} lowest median DOM`, `Fastest zip, lowest median DOM`],
  [`sales) ${EM} YoY changes`, `sales): YoY changes`],
  // prose where a comma would splice or muddle -> period / colon / parens
  [`for Madison, WI ${EM} August 2026 closings`, `for Madison, WI. August 2026 closings`],
  [`in this market ${EM} zero down, no PMI`, `in this market: zero down, no PMI`],
  [`Yes ${EM} the fundamentals`, `Yes. The fundamentals`],
  [`on the surface ${EM} 203 sales, down 13.6% from last August ${EM} but`, `on the surface (203 sales, down 13.6% from last August), but`],
  [`still moving fast ${EM} half go under contract inside a week and a half ${EM} but`, `still moving fast (half go under contract inside a week and a half), but`],
  [`a huge August ${EM} sales up 32.3%`, `a huge August: sales up 32.3%`],
  [`$565,000 median ${EM} that corridor is clearly heating up`, `$565,000 median. That corridor is clearly heating up`],
  [`Video update coming soon ${EM} check back`, `Video update coming soon. Check back`],
  [`Several other zips ${EM} 53719, 53711, 53717, 53713, and 53715 ${EM} tied`, `Several other zips (53719, 53711, 53717, 53713, and 53715) tied`],
  [`by bracket ${EM} recent data shows`, `by bracket: recent data shows`],
  [`You can always refinance ${EM} you can't go back`, `You can always refinance. You can't go back`],
  [`You can always refinance ${EM} you can&#x27;t go back`, `You can always refinance. You can&#x27;t go back`],
  [`The far east side ${EM} zip 53719 ${EM} had a breakout month`, `The far east side (zip 53719) had a breakout month`],
];
for (const [a, b] of X) s = s.split(a).join(b);

/* ---------- 4. EM DASHES: everything left becomes a comma ---------- */
s = s.split(` ${EM} `).join(", ");

/* ---------- report ---------- */
const after = { em: (s.match(/\u2014/g)||[]).length, len: s.length };
fs.writeFileSync(F, s, "utf8");
console.log("em dashes:", before.em, "->", after.em);
console.log("bytes:", before.len, "->", after.len);
if (after.em) console.log("REMAINING:\n" + s.split("\n").map((l,i)=>[i+1,l]).filter(([,l])=>l.includes(EM)).map(([n,l])=>n+": "+l.trim().slice(0,160)).join("\n"));
