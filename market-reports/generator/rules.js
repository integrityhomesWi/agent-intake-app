// Every rule the skill states in prose, expressed as an assertion.
//
// The rule for this file: if SKILL.md says "must", "always" or "never" about something
// observable in the output, it belongs here. A rule that lives only in prose is a rule
// that breaks silently and gets discovered by John reading a published page. That is the
// loop this file exists to end.
//
// Each rule carries the SKILL.md section it comes from so the two stay traceable.

const D = require("./data.js");

const CITY_SLUGS = Object.fromEntries(Object.entries(D.cities).map(([c, v]) => [v.slug, c]));
const cityOf = name => CITY_SLUGS[name] || (name === "wisco-hub" ? "Dane County" : null);
const dataFor = name => {
  const c = cityOf(name);
  return c === "Dane County" ? D.county : D.cities[c];
};
const isHub = name => name === "wisco-hub";

const LADDER = s => s < 2 ? "Extreme Seller's Market"
  : s < 4 ? "Strong Seller's Market"
  : s < 5 ? "Seller's Market"
  : s < 6 ? "Leaning Toward Buyer's Market" : "Buyer's Market";

const count = (h, re) => (h.match(re) || []).length;
const snapDisplay = () => new Date(D.snapshot + "T12:00:00Z")
  .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

// rule(id, where-in-skill, what-it-checks)
const rules = [

// ---------- Step 2/3: data integrity ----------
{ id: "ladder", skill: "Step 2 B-Series", test: (h, n, v) =>
    LADDER(v.sup) !== v.typePlain &&
    `supply ${v.sup} is ${LADDER(v.sup)} but the page says ${v.typePlain}` },

{ id: "ladder-stated", skill: "Standing Rule 9", test: (h, n, v) =>
    !h.includes(v.typePlain) && `market type "${v.typePlain}" never appears on the page` },

{ id: "no-balanced", skill: "Step 9 / QA", test: h =>
    /Balanced Market/i.test(h) && `"Balanced Market" is not on the 5-tier ladder` },

{ id: "hot-threshold", skill: "Step 2, hot zones", test: (h, n, v) => {
    const hot = v.brackets.filter(b => b[1] > 0 && b[1] < 1).length;
    const marked = count(h, /← hot zone/g);
    return marked !== hot && `${marked} hot-zone chart markers vs ${hot} bands strictly under 1.00`;
  } },

{ id: "no-false-urgency", skill: "Step 2, hot zones", test: (h, n, v) => {
    if (v.brackets.some(b => b[1] > 0 && b[1] < 1)) return false;
    for (const re of [/move quickly and offer cleanly/, /at or above list/, /leave you short/])
      if (re.test(h)) return `urgency language ${re} but no band is under 1.00 month`;
    return false;
  } },

{ id: "dom-math", skill: "Step 2 A-Series", test: (h, n, v) =>
    (v.dom - v.priorDom) !== v.domYoY &&
    `dom ${v.dom} minus prior ${v.priorDom} is not domYoY ${v.domYoY}` },

{ id: "no-fast-market-when-slow", skill: "Step 3 anomaly flags", test: (h, n, v) =>
    v.dom > 30 && /fast market|moving fast|flying off/i.test(h) &&
    `median DOM is ${v.dom} but the page uses fast-market language` },

{ id: "small-sample-footnoted", skill: "Step 2 empty/small-sample", test: (h, n, v) => {
    const small = (v.zips || []).filter(z => z[1] < 10).length;
    return small > 0 && !/fewer than 10 homes|asterisk/i.test(h) &&
      `${small} zips under 10 sales but no small-sample footnote` } },

// ---------- Step 4: URLs and dates ----------
{ id: "canonical-permanent", skill: "Step 4", test: (h, n) => {
    const c = (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || "";
    if (/\/(january|february|march|april|may|june|july|august|september|october|november|december)-\d{4}/i.test(c))
      return `canonical is a dated URL: ${c}`;
    return false;
  } },

{ id: "datepublished-static", skill: "Step 4", test: h =>
    !/"datePublished":\s*"2025-12-01"/.test(h) && `datePublished is not the static 2025-12-01` },

{ id: "dates-in-sync", skill: "Step 4, three values must sync", test: h => {
    const badge = h.includes("Last updated: " + snapDisplay());
    const wp = new RegExp(`"dateModified":\\s*"${D.snapshot}"`).test(h);
    const ds = count(h, new RegExp(`"dateModified":\\s*"${D.snapshot}"`, "g")) >= 2;
    if (!badge) return `hero badge does not read "Last updated: ${snapDisplay()}"`;
    if (!wp) return `schema dateModified is not ${D.snapshot}`;
    if (!ds) return `Dataset dateModified does not match WebPage dateModified`;
    return false;
  } },

{ id: "hero-badge-wording", skill: "Step 4, exact wording", test: h =>
    !/Created: December 1, 2025 \| Last updated: /.test(h) && `hero freshness badge wording is wrong` },

{ id: "no-stale-month", skill: "Step 4", test: h => {
    const prior = D.closings.replace(/(\d{4})\s*$/, (m, y) => String(Number(y) - 1));
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const allowed = [D.month, D.closings, prior, "December 1, 2025"];
    for (const m of months) {
      const re = new RegExp(m + " 20\\d\\d", "g");
      for (const hit of h.match(re) || [])
        if (!allowed.some(a => a.includes(hit))) return `stale month reference: ${hit}`;
    }
    return false;
  } },

// ---------- Step 5: config comes from one place ----------
{ id: "hero-image", skill: "Step 5 config", test: (h, n, v) =>
    !isHub(n) && !h.includes(v.heroImg) && `hero image does not match data.js` },

{ id: "kit-link", skill: "Step 5 config", test: (h, n, v) =>
    !isHub(n) && !h.includes(v.kit) && `newsletter link does not match data.js` },

{ id: "school-url", skill: "Step 5 config", test: (h, n, v) =>
    !isHub(n) && !h.includes(v.schoolUrl) && `school district URL does not match data.js` },

{ id: "geo-coords", skill: "Step 5 config", test: (h, n, v) =>
    !h.includes(`"latitude": ${v.lat}`) && !h.includes(`"latitude":${v.lat}`) &&
    `latitude ${v.lat} from data.js is not in the schema` },

{ id: "city-hub-six-places", skill: "Standing Rule 10", test: (h, n, v) => {
    if (isHub(n)) return false;
    const hits = count(h, new RegExp(`https://integrityhomeswi\\.com${v.hub.replace(/\//g, "\\/")}"`, "g"));
    return hits < 5 && `city hub URL appears ${hits} times, the skill requires it in 6 places`;
  } },

// ---------- Titles and metas ----------
{ id: "title-length", skill: "QA", test: h => {
    const t = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
    return t.length > 60 && `title is ${t.length} chars`;
  } },

{ id: "meta-length", skill: "QA", test: h => {
    const d = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
    return d.length > 155 && `meta is ${d.length} chars`;
  } },

{ id: "title-evergreen", skill: "Titles and metas must be EVERGREEN", test: h => {
    const t = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
    return /\d/.test(t) && `title carries a figure: "${t}"`;
  } },

{ id: "meta-evergreen", skill: "Titles and metas must be EVERGREEN", test: h => {
    const d = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
    return /\d/.test(d) && `meta carries a figure: "${d}"`;
  } },

{ id: "title-undated", skill: "QA", test: h => {
    const t = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
    return /\b(19|20)\d\d\b|january|february|march|april|may|june|july|august|september|october|november|december/i.test(t)
      && `title is dated: "${t}"`;
  } },

// ---------- Grammar and brand ----------
{ id: "article-extreme", skill: "Step 2 grammar rule", test: h => {
    const n = count(h, /\ba [Ee]xtreme/g);
    return n && `"a Extreme" x${n}, the rule is "an Extreme Seller's Market"`;
  } },

{ id: "article-numbers", skill: "Step 2 grammar rule", test: h => {
    const n = count(h, /\ba (8|11|18|8\d) day/g);
    return n && `"a 8/11/18 day" x${n}, should be "an"`;
  } },

{ id: "leaning-grammar", skill: "Step 2 grammar rule", test: h =>
    /leaning toward Buyer's Market/.test(h) && `should read "leaning toward a Buyer's Market"` },

{ id: "brand-name", skill: "Standing Rule 4", test: h =>
    /Integrity Homes Wisconsin/.test(h) && `"Integrity Homes Wisconsin" is never the brand name` },

{ id: "ranking-claim", skill: "Brand", test: h =>
    /top 5%|top 1%|nationally ranked|#1 (agent|realtor)/i.test(h) &&
    `inflated ranking claim; the only claim is top 3% of SCWMLS` },

{ id: "no-em-dash", skill: "CLAUDE.md", test: h => {
    const n = count(h, /—/g);
    return n && `${n} em dash(es)`;
  } },

// ---------- Step 7: Lofty constraints ----------
{ id: "no-position-fixed", skill: "Lofty Hard Rule 2", test: h =>
    /position:\s*fixed/i.test(h) && `position:fixed is not allowed in Lofty` },

{ id: "no-form", skill: "Lofty Hard Rule 3", test: h =>
    /<form[\s>]/i.test(h) && `<form> is not allowed in Lofty` },

{ id: "no-wrapper-tags", skill: "Lofty Hard Rule 10", test: h =>
    /<(html|head|body)[\s>]/i.test(h) && `wrapper tags must not be included; Lofty adds them` },

{ id: "hero-fallback-colour", skill: "Lofty Hard Rule 8", test: h =>
    !/background-color:#1e3a5f/.test(h) && `hero is missing its #1e3a5f fallback colour` },

{ id: "mobile-bg-scroll", skill: "Lofty Hard Rule 7", test: h =>
    /background-attachment:\s*fixed/i.test(h) && !/background-attachment:\s*scroll/i.test(h) &&
    `background-attachment:fixed with no mobile scroll override` },

{ id: "gold-button-contrast", skill: "Lofty Hard Rule 11", test: h =>
    !/\.market-report \.btn-gold\{[^}]*color:#152a45 !important/.test(h) &&
    `gold buttons must force color:#152a45 !important scoped under .market-report` },

{ id: "tables-scrollable", skill: "Lofty Hard Rule 12", test: h => {
    const tables = count(h, /<table class="mr-table/g);
    const wrapped = count(h, /<div class="table-scroll"><table class="mr-table/g);
    if (tables !== wrapped) return `${tables} tables, ${wrapped} wrapped in .table-scroll`;
    if (!/\.table-scroll\{overflow-x:auto/.test(h)) return `.table-scroll is missing overflow-x:auto`;
    if (!/\.mr-table\{[^}]*min-width:520px/.test(h)) return `.mr-table is missing min-width:520px`;
    return false;
  } },

{ id: "fonts-display-swap", skill: "Step 8", test: h =>
    /fonts\.googleapis\.com/.test(h) && !/display=swap/.test(h) &&
    `Google Fonts URL is missing &display=swap` },

{ id: "one-script", skill: "QA, sticky CTA is the only JS", test: h => {
    const scripts = count(h, /<script(?! type="application\/ld\+json")/g);
    return scripts > 1 && `${scripts} script tags; only the sticky-CTA script is allowed`;
  } },

{ id: "single-accordion", skill: "Step 8, Option A", test: (h, n) =>
    !isHub(n) && count(h, /<details/g) !== 1 &&
    `${count(h, /<details/g)} accordions; the pattern is exactly one` },

{ id: "dot-aria-hidden", skill: "Step 7", test: h =>
    /<span>●<\/span>/.test(h) && `market-type dot must carry aria-hidden="true"` },

// ---------- Step 8: sections and content ----------
{ id: "speakable-classes", skill: "QA", test: h => {
    for (const c of ["market-hero-intro", "tldr-box", "speakable-answer", "faq-a"])
      if (!h.includes(c)) return `missing speakable class .${c}`;
    return false;
  } },

{ id: "banned-headers", skill: "Step 8 banned header language", test: h => {
    for (const re of [/<h[23]>\s*Hyper-Local Market Overview/i, /<h[23]>\s*Market Pulse/i,
                      /<h[23]>\s*Supply Detail by Price Range/i, /<h[23]>\s*Current Market Conditions/i,
                      /<h[23]>\s*The Big Picture\s*<\/h[23]>/i, /Advanced Market Statistics/i])
      if (re.test(h)) return `banned header language ${re}`;
    return false;
  } },

{ id: "required-sections", skill: "Step 8", test: (h, n) => {
    const need = isHub(n)
      ? [["FAQ", /faq-list/], ["city cards", /cta-card|compare-table/], ["footer", /mr-footer/],
         ["sticky", /sticky-cta/], ["author", /author-card/], ["hero", /mr-hero/]]
      : [["hero", /mr-hero/], ["nav", /mr-nav/], ["snapshot", /mr-snapshot-card/],
         ["valuation CTA", /mr-cta-banner/], ["buy", /Should I Buy a Home/], ["sell", /Good Time to Sell/],
         ["John's Take", /johns-take/], ["prices", /Prices Going Up or Down/],
         ["time to sell", /How Long Does It Take to Sell/], ["negotiate", /Can Buyers Negotiate/],
         ["rates", /Wait for Interest Rates/], ["what changed", /What's Changed Over the Last Year/],
         ["neighborhood", /Happening in My/], ["FAQ", /faq-list/], ["schools", /schools-section/],
         ["accordion", /advanced-data/], ["ROH", /roh-widget/], ["author", /author-card/],
         ["newsletter", /newsletter-cta/], ["footer", /mr-footer/], ["sticky", /sticky-cta/],
         ["gauge", /Inventory Supply Gauge/], ["supply chart", /Months of Supply by Price Range/]];
    const miss = need.filter(([, re]) => !re.test(h)).map(([x]) => x);
    return miss.length && `missing sections: ${miss.join(", ")}`;
  } },

{ id: "faq-count", skill: "Step 8 target length", test: h => {
    const n = count(h, /class="faq-a"/g);
    return (n < 10 || n > 15) && `${n} FAQs; the target is 10 to 15`;
  } },

{ id: "charts-present", skill: "Step 9", test: (h, n) => {
    const svg = count(h, /<svg/g);
    const min = isHub(n) ? 1 : 3;
    return svg < min && `${svg} charts; at least ${min} required`;
  } },

{ id: "chart-titles", skill: "Step 9", test: h => {
    const svg = count(h, /<svg/g), titles = count(h, /<title id=/g);
    return svg !== titles && `${svg} charts but ${titles} have <title>`;
  } },

{ id: "unique-svg-ids", skill: "Accessibility", test: h => {
    const ids = [...h.matchAll(/<title id="([^"]+)"/g)].map(m => m[1]);
    const dupes = ids.filter((x, i) => ids.indexOf(x) !== i);
    return dupes.length && `duplicate SVG title ids: ${[...new Set(dupes)].join(", ")}`;
  } },

{ id: "data-source-footer", skill: "Standing Rule 7", test: h =>
    !/Data deemed reliable but not guaranteed/.test(h) && `data-source footer line missing` },

{ id: "no-placeholders", skill: "NO PLACEHOLDERS", test: h => {
    const re = /could not be verified|left out rather than|not shown for|unconfirmed|placeholder|\bTBD\b|coming soon|to be determined|pending verification|we do not have|figure is not available|awaiting data|check back|data (is )?(un)?available/i;
    const m = h.match(re);
    return m && `placeholder language: "${m[0]}"`;
  } },

// ---------- Step 10: schema ----------
{ id: "schema-parses", skill: "Step 10", test: h => {
    const m = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!m) return `no JSON-LD block`;
    try { JSON.parse(m[1]); } catch (e) { return `JSON-LD does not parse: ${e.message}`; }
    return false;
  } },

{ id: "schema-nodes", skill: "Step 10", test: h => {
    const g = JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const types = g["@graph"].flatMap(n => Array.isArray(n["@type"]) ? n["@type"] : [n["@type"]]);
    const need = ["Organization", "Person", "Article", "WebPage", "BreadcrumbList", "Place", "Dataset", "FAQPage"];
    const miss = need.filter(t => !types.includes(t));
    return miss.length && `schema missing node types: ${miss.join(", ")}`;
  } },

{ id: "schema-self-sufficient", skill: "Step 10 schema architecture", test: h => {
    const g = JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
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
    return dangling.length && `dangling @id references: ${dangling.join(", ")}`;
  } },

{ id: "identity-full", skill: "Step 10, embed in full", test: h => {
    const g = JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const org = g["@graph"].find(n => String(n["@type"]).includes("Organization"));
    const per = g["@graph"].find(n => n["@type"] === "Person");
    if (!org || !org.address || !org.areaServed) return `Organization is a stub, must be the full node`;
    if (!per || !per.hasCredential || !per.award) return `Person is a stub, must be the full node`;
    return false;
  } },

{ id: "canonical-fragments", skill: "Standing Rule 11", test: h => {
    for (const f of ["#organization", "#johnreuter", "#realestateagent", "#site"])
      if (h.includes(`"${f}"`) || h.includes(`/${f}"`)) return `stale fragment ${f}; use #org, #john, #website`;
    return false;
  } },

{ id: "breadcrumb-depth", skill: "Step 10", test: h => {
    const g = JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const bc = g["@graph"].find(n => n["@type"] === "BreadcrumbList");
    return bc && bc.itemListElement.length !== 3 &&
      `breadcrumb has ${bc.itemListElement.length} levels, the skill says 3`;
  } },

{ id: "significantlink-hub-first", skill: "Step 10", test: (h, n, v) => {
    const g = JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const wp = g["@graph"].find(x => x["@type"] === "WebPage");
    if (!wp || !wp.significantLink) return `WebPage has no significantLink array`;
    if (!isHub(n) && !wp.significantLink[0].endsWith(v.hub)) return `city hub must be first in significantLink`;
    return false;
  } },

{ id: "faq-matches-visible", skill: "Step 10", test: h => {
    const g = JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const f = g["@graph"].find(n => n["@type"] === "FAQPage");
    const visible = count(h, /class="faq-a"/g);
    return f && f.mainEntity.length !== visible &&
      `schema has ${f.mainEntity.length} FAQs, the page shows ${visible}`;
  } },

// ---------- length and data fidelity ----------
{ id: "word-count", skill: "Step 8 target length", test: (h, n) => {
    const w = h.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    const floor = isHub(n) ? 1700 : 2000;
    return w < floor && `${w} words, below the ${floor} floor`;
  } },

{ id: "zip-table-matches-data", skill: "Step 2 A-Series", test: (h, n, v) => {
    const zips = v.zips || [];
    const rendered = count(h, /<td><strong>5\d{4}<\/strong>/g);
    if (zips.length && rendered !== zips.length) return `${rendered} zip rows vs ${zips.length} in data.js`;
    if (!zips.length && /Zip Code Detail/.test(h)) return `a zip table rendered with no zip data`;
    return false;
  } },

{ id: "stats-verbatim", skill: "Step 8 snapshot", test: (h, n, v) => {
    const m = x => "$" + x.toLocaleString("en-US");
    if (!h.includes(m(v.med))) return `median ${m(v.med)} is not in the page body`;
    if (!h.includes(v.sup.toFixed(2))) return `supply ${v.sup.toFixed(2)} is not in the page body`;
    return false;
  } },
];

module.exports = { rules, dataFor, cityOf, isHub, LADDER };
