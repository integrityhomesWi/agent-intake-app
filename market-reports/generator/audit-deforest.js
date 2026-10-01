// Check each claim in the review against the actual DeForest output.
const fs = require("fs");
const B = require("./build.js");
const D = require("./data.js");
const h = fs.readFileSync(B.OUT + "/deforest-wisconsin.html", "utf8");
const v = D.cities.DeForest;
const g = JSON.parse((h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1]);
const types = g["@graph"].map(n => Array.isArray(n["@type"]) ? n["@type"].join("+") : n["@type"]);
const node = t => g["@graph"].find(n => (Array.isArray(n["@type"]) ? n["@type"] : [n["@type"]]).includes(t));

const R = (claim, verdict, detail) => console.log(
  (verdict ? "TRUE   " : "FALSE  ") + claim.padEnd(46) + (detail || ""));

console.log("=== CLAIMS ===");

// 1 raw research notes in John's Take
const take = h.slice(h.indexOf('class="johns-take"'), h.indexOf('class="johns-take"') + 6000);
R("1  names other brokers' listings", /818 River Road|338 South Street|116 Crooked Tree/.test(take),
  (take.match(/818 River Road|338 South Street|116 Crooked Tree Circle/g) || []).join(", "));
R("1b housekeeping / MLS-search wording", /housekeeping note|MLS search/i.test(take));

// 2 tightest band rendered red
const row = (h.match(/<tr class="hot-row"><td>\$700K[^<]*<\/td><td>([\d.]+)<\/td><td>([^<]*)<\/td>/) || []);
R("2  1.57 band carries hot-row (red)", !!row[1], row[1] ? `supply ${row[1]}, label "${row[2]}"` : "");

// 3 negotiation / FAQ contradict John's Take
R("3  'least forgiving' on the tight band", /least forgiving/i.test(h),
  (h.match(/[^.]*least forgiving[^.]*\./) || [""])[0].trim().slice(0, 150));
R("3b 'at or above list' advice", /at or above list/i.test(h));

// 4 position:fixed
R("4  sticky bar uses position:fixed", /position:\s*fixed/i.test(h),
  (h.match(/[^;{]*position:\s*fixed[^;}]*/i) || [""])[0].trim());

// 5 schema
R("5  ItemList present", types.some(t => /ItemList/.test(t)), "nodes: " + types.join(", "));
const org = node("Organization"), per = node("Person"), wp = node("WebPage"), pl = node("Place");
R("5b Organization has address+areaServed", !!(org && org.address && org.areaServed),
  org ? "keys: " + Object.keys(org).length : "missing");
R("5c Person has hasCredential+award", !!(per && per.hasCredential && per.award),
  per ? "keys: " + Object.keys(per).length : "missing");
R("5d WebPage has significantLink", !!(wp && wp.significantLink));
R("5e Place has PostalAddress 53532", !!(pl && pl.address && JSON.stringify(pl.address).includes("53532")),
  pl ? JSON.stringify(pl.geo || {}) : "no Place");
R("5f coords match skill 43.2486/-89.3437", v.lat === 43.2486 && v.lng === -89.3437,
  `data.js has ${v.lat}, ${v.lng}`);

// 6 smaller
R("6.1 'September 2026 last year'", /September 2026[^.]{0,30}last year|last year[^.]{0,30}September 2026/i.test(h),
  (h.match(/[^.]*September 2026[^.]{0,40}last year[^.]*/i) || [""])[0].trim().slice(0, 140));
const ids = (h.match(/id="y-t"/g) || []).length;
R("6.2 duplicate id=\"y-t\"", ids > 1, ids + " occurrences");
const charts = (h.match(/<svg/g) || []).length;
R("6.3 only one What's Changed chart", false, charts + " svg charts total on the page");
R("6.4 over-asking shown inconsistently", /0\.1%/.test(h) && /0\.07%/.test(h),
  "0.1% x" + (h.match(/0\.1%/g) || []).length + ", 0.07% x" + (h.match(/0\.07%/g) || []).length);
R("6.5 newsletter Kit link", !h.includes(v.kit) ? true : false, "page uses: " +
  ((h.match(/https:\/\/integrity-homes\.kit\.com[^"]*/) || [])[0] || "none") + " | data.js: " + v.kit);
R("6.6 ROH button not calculator page", !/rewardourheroes\.com\/calculator-page/.test(h),
  (h.match(/https:\/\/(www\.)?rewardourheroes\.com[^"]*/g) || []).join(", "));
const schools = h.slice(h.indexOf("School District"), h.indexOf("School District") + 2500);
R("6.7 city hub link missing in schools", !schools.includes(v.hub), "hub is " + v.hub);
R("6.8 '1 homes pending'", /1 homes pending/.test(h),
  (h.match(/[^.]*\b1 homes? pending[^.]*/) || [""])[0].trim().slice(0, 120));
R("6.8b 'between $900,000 and above'", /between \$900,000 and above/i.test(h),
  (h.match(/[^.]*between \$900,000 and above[^.]*/i) || [""])[0].trim().slice(0, 140));
