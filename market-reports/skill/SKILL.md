---
name: market-report-page
description: >
  Builds the unified monthly Market Report page for Integrity Homes — ONE permanent URL per city
  that overwrites every month. This skill REPLACES the old nerd-page and market-overview-hub skills,
  combining the deep-dive data of the Nerd Page (SVG charts, full stat grid, price-range supply table,
  zip velocity table, FAQ) with the evergreen, authority-building structure of the Market Overview Hub
  (permanent URL, archive accordion, schools section, city personality intros). Outputs a complete,
  Lofty CMS-ready HTML file with inline CSS, three SVG charts, JSON-LD @graph schema, speakable
  classes, and a sticky CTA bar. Six Dane County cities: Madison, Sun Prairie, DeForest, Verona,
  Waunakee, Middleton.
  Trigger when John says: market report, monthly report, "do the [city] report," "run the report,"
  "update the [city] market page," or uploads a city PDF and names a city. This is now the ONLY
  monthly market page per city.
---

# Market Report Page Builder — Integrity Homes (Unified)

Produces the single permanent market page that lives at a city's market-report URL and is **updated
(overwritten), not replaced** every month. This page absorbs both former page types: it is the
deep-dive data report AND the section landing page in one. There is no longer a separate Nerd Page.

## Why this skill replaces two skills

The old model published two pages per city per month — a dated Nerd Page (new URL monthly) and an
overwriting Overview Hub. Neither ranked: the data signal was split across two competing URLs and the
dated pages never accumulated authority before being abandoned. This skill consolidates everything
into one permanent URL so every month's refresh strengthens the same page.

**The old dated Nerd Pages are NOT deleted.** They stay live and become the historical archive —
listed in the archive accordion exactly like past reports. No future dated pages are created.

---

## Step 1: Identify the Request

Determine from John's message:
- Which city or cities? (See 6-city workflow note below.)
- Which **report month**?
- Is a PDF attached, or is John providing data verbally?

If city or report month is unclear, ask before proceeding.

### ⚠️ Report Month Convention

The SCWMLS PDF snapshot is taken on the 1st of a month and reflects the **prior month's closings**.
**Confirm the label with John** — he may label by snapshot month or by closing month.

**Current confirmed convention (John, June 2026):** Label the report by the **snapshot month**.
- A June 1, 2026 snapshot (May closings) = **"June 2026 Report."**
- Always name the prior month explicitly when describing closings ("based on May closings").

If John has not confirmed for the current cycle, ask: *"Label this the [snapshot month] report?"*

### 6-City Workflow (All Cities at Once)

If multiple PDFs are present:
- Run Step 2 (extraction) for ALL cities before showing any verification tables.
- Present ALL verification tables together in one message for John to confirm at once.
- After confirmation, build city by city: Madison → Sun Prairie → DeForest → Verona → Waunakee → Middleton.
- All cities use the same report month — confirm once, apply to all.

---

## Step 2: Ingest the Data (from PDF or verbal input)

Extract ONLY what exists in the source. Never invent stats. If a field is missing, flag it in the
verification table — do not fill it in.

### A-Series — Facts (read directly from source)

| Field | Notes |
|-------|-------|
| Median Sale Price (month) | Dollar amount + YoY % from PDF |
| Average Sale Price (month) | Dollar amount + YoY % |
| Median Days on Market | Integer + YoY ± days |
| Average Days on Market | Integer + YoY ± days |
| Months of Supply | Decimal (e.g., 1.38) |
| Active Listings | Integer |
| Pending Listings | Integer |
| Sales Count (month) | Integer + YoY % |
| Avg $/SqFt | Dollar amount + YoY % |
| Avg % Over/Under Asking | Percentage + YoY ± |
| Total Volume (month) | Dollar amount + YoY % |
| New Listings (month) | Integer + YoY % |
| New Pendings (month) | Integer + YoY % |
| YTD Sales Count | Integer + YoY % |
| YTD Median Price | Dollar amount + YoY % |
| YTD Average Price | Dollar amount + YoY % |
| YTD Total Volume | Dollar amount + YoY % |
| Months of Supply by Price Range | Table: range, active, mo supply, avg sales/mo |
| Zip Code Comparison | Table: zip, median, sales, DOM, $/sqft, YoY median |

**Note on this PDF format:** The SCWMLS report has a dedicated "Months of Supply By Price Range"
table (the Inventory page) AND a "Buyer Demand By Price Range" table (sales by range). Use the
**Months of Supply By Price Range** table for the supply chart and hot-zone analysis — it is the
active-inventory view. The Buyer Demand table is sales volume, not supply; do not confuse them.

### B-Series — Derived (deterministic math only)

**Market type** (based on months of supply) — **must match across all market content exactly:**
- 0–2 months → Extreme Seller's Market
- 2–4 months → Strong Seller's Market
- 4–5 months → Seller's Market
- 5–6 months → Leaning Toward Buyer's Market
- 6+ months → Buyer's Market

**Boundary rule:** Supply exactly on a boundary (2.0, 4.0, etc.) classifies into the higher
(more buyer-favorable) tier. 2.0 = Strong Seller's, 4.0 = Seller's, 5.0 = Leaning Toward Buyer's,
6.0 = Buyer's.

**Grammar rule:** Always "an Extreme Seller's Market." Always "leaning toward a Buyer's Market."

**Hot zones:** Price brackets with **strictly < 1.0 month** supply (🔴 red dot + red bar fill).
Do NOT flag brackets at exactly 1.0 or above, even if competitive. A bracket just over 1.0
(e.g., 1.39) may be described in prose as "the tightest band after the hot zone" but gets no red flag.
This strict threshold keeps the page honest and non-salesy.

**Buyer zones:** Brackets with > 4 months supply (🟢 green dot). Note: the $0–$99,999 bracket often
shows an inflated supply figure (e.g., 6.00) off a single listing and near-zero sales — footnote it
as a small-sample artifact rather than presenting it as a genuine buyer's segment.

**Trend arrows:** ↑ (up > 1%), ↓ (down > 1%), → (flat within 1%).
**Fastest zip:** Lowest median DOM (⚡). Mark all zips tied at the minimum.

**Empty/small-sample rule:** Zips or brackets with < 10 sales are small-sample. Footnote them; do not
feature them as headline trends (a +84% YoY median off 5 sales is noise, not a signal).

### C-Series — Voice (editorial from John)

If John provides editorial commentary, preserve it exactly in the Big Picture callout (Section 14).

---

## Step 3: Verification Gate ⛔ HARD STOP

Before writing any HTML, present ALL extracted data to John (core metrics, YTD, supply-by-range,
zip table, derived classifications, anomaly flags). Use the same verification format as the legacy
Nerd Page skill. **Do not proceed until John confirms.**

Anomaly flags to check:
- [ ] Median DOM > 30 days — do NOT use "fast market" language
- [ ] Average price > 30% above median — note high-end skew
- [ ] Price YoY < -5% (city level) — add context; avoid "elevated" language
- [ ] Median/average DOM gap > 30 days — call out market bifurcation
- [ ] Sales/volume down sharply while prices steady — note "fewer transactions, not falling prices"
- [ ] Any featured zip/bracket with < 10 sales — footnote as small sample

**Reply with "confirmed" or corrections. Build begins after confirmation.**

---

## Step 4: URL, File Naming, Dates

### Canonical URL (PERMANENT — overwrites monthly, never dated)

```
https://integrityhomeswi.com/market-reports/{city-slug}-wisconsin/
```

This URL never changes. Every monthly build overwrites the content at this same address.

### File Naming (working file only — the live URL is permanent)

```
{city-slug}-market-report-{month}-{year}.html
```
e.g., `madison-market-report-june-2026.html`

### Dates — Non-Negotiable Rules

- **`datePublished` / Created date:** Always `2025-12-01` for all cities. Never changes.
  Display: "December 1, 2025."
- **`dateModified` / Last Updated date:** The snapshot date — the 1st of the report month
  (e.g., `2026-06-01` for the June 2026 report). Use ISO in schema, "Month Day, Year" in display.
- **Hero badge (exact wording):** `Created: December 1, 2025 | Last Updated: [Month Day, Year]` —
  both dates always shown.
- **Three values must always sync:** hero "Last Updated" badge, WebPage `dateModified`,
  Dataset `dateModified`.

---

## Step 5: City Configuration

Pull ALL URLs, hero images, coordinates, school info, and Kit links from this table. Never fabricate.

| City | City Slug | City Hub URL | Hero Image | Kit Newsletter | Lat | Lng | Primary Zip | School District | School Guide URL |
|------|-----------|--------------|------------|----------------|-----|-----|-------------|-----------------|------------------|
| Madison | madison | https://integrityhomeswi.com/madison/ | https://cdn.lofty.com/image/fs/341054835208155/website/20980/cmsbuild/20251218_bbbbc427676a4977.jpeg | https://integrity-homes.kit.com/madison-wi-housing-market-update | 43.0731 | -89.4012 | 53703 | Madison Metropolitan School District | https://integrityhomeswi.com/schools/madison-metropolitan-school-district/ |
| Sun Prairie | sun-prairie | https://integrityhomeswi.com/sun-prairie/ | https://cdn.lofty.com/image/fs/341054835208155/website/20980/cmsbuild/20251219_1d0d8c9d61104549.png | https://integrity-homes.kit.com/sun-prairie-market-report | 43.1836 | -89.2137 | 53590 | Sun Prairie Area School District | https://integrityhomeswi.com/schools/sun-prairie-area-school-district/ |
| DeForest | deforest | https://integrityhomeswi.com/deforest/ | https://cdn.lofty.com/image/fs/341054835208155/website/20980/cmsbuild/20251219_c1bd607250f345ce.png | https://integrity-homes.kit.com/deforest-market-report | 43.2486 | -89.3437 | 53532 | DeForest Area School District | https://integrityhomeswi.com/schools/deforest-area-school-district/ |
| Verona | verona | https://integrityhomeswi.com/verona/ | https://cdn.lofty.com/image/fs/341054835208155/website/20980/cmsbuild/20251219_c0620c22fff84264.jpeg | https://integrity-homes.kit.com/verona-market-report | 42.9919 | -89.5331 | 53593 | Verona Area School District | https://integrityhomeswi.com/schools/verona-area-school-district/ |
| Waunakee | waunakee | https://integrityhomeswi.com/waunakee/ | https://cdn.lofty.com/image/fs/341054835208155/website/20980/cmsbuild/20251219_46dfdf3e440e4fcf.png | https://integrity-homes.kit.com/waunakee-wi-housing-market-update | 43.1919 | -89.4556 | 53597 | Waunakee Community School District | https://integrityhomeswi.com/schools/waunakee-community-school-district/ |
| Middleton | middleton | https://integrityhomeswi.com/middleton/ | https://cdn.lofty.com/image/fs/341054835208155/website/20980/cmsbuild/20251219_f7e810a2af214ab5.jpeg | https://integrity-homes.kit.com/middleton-market-report | 43.0972 | -89.5043 | 53562 | Middleton-Cross Plains Area School District | https://integrityhomeswi.com/schools/middleton-cross-plains-area-school-district/ |

### Config table corrections (verified 2026-10-01)

Three errors lived in the table above and shipped more than once:
- **Waunakee's Kit URL** `waunakee-market-report` returns **404**. The live one is
  `waunakee-wi-housing-market-update`. All six `*-wi-housing-market-update` URLs return 200.
- **Hero images were crossed.** Waunakee listed Sun Prairie's photo. John supplied the
  authoritative list in September 2026; `generator/data.js` holds it and is the source of truth.
- Verify a config value before trusting it. This table is a convenience copy, not the system of record.

### Titles and metas must be EVERGREEN

No figures in either field. A number baked into a title or meta is true for one month and
quietly false afterwards, and the six-week no-touch rule means nobody goes back to check.
In October 2026 five of seven pages still carried September figures, and Middleton's meta
said buyers paid "over asking" when they paid 2.03% under. `generator/validate.js` now fails
the build if a digit appears in either field.

### John's Take comes from the Airtable field, never the Notes field

The Notes field holds raw MLS research. It names other brokers' listings as stale, carries
internal asides, and is working material. Publishing it is a professional problem. Use the
**John's Take** field, verbatim, split on its paragraph breaks. Same for **Speakable Answer
Line** and **Market Summary Line**.

### Shared URLs
- Home valuation: `https://integrityhomeswi.com/evaluation`
- ROH calculator: `https://www.rewardourheroes.com/calculator-page`
- VA loan guide: `https://integrityhomeswi.com/buyer-loan-programs/va`
- Loan programs: `https://integrityhomeswi.com/buyer-loan-programs/`
- MLS disclaimer: `https://integrityhomeswi.com/mls-disclaimer/`
- Homes for sale: `https://integrityhomeswi.com/homes-for-sale/{city-slug}-wisconsin/`
- John's email: john@integrityhomeswi.com | Phone: 608-669-4226

### City Personality — Hero Intro Guidance (one city-specific sentence each)
- **Madison:** State capital, Big Ten university town, diverse neighborhoods, strong job market, varied price points.
- **Sun Prairie:** Fast-growing family suburb east of Madison, newer construction, more affordable west-side alternative.
- **DeForest:** Small-town feel north of Madison, tight-knit, newer developments, good value.
- **Verona:** Home of Epic Systems, strong employer base, excellent schools, increasingly competitive.
- **Waunakee:** Top-ranked schools, affluent small-town feel, high demand, consistently low inventory.
- **Middleton:** Consistently ranked best places to live in Wisconsin, upscale stock, premium across all ranges.

---

## Step 6: Archive — How It Works

The archive accordion lists every prior published report for the city. **The old dated Nerd Page URLs
populate it** — they are the historical record now.

1. Read `references/archive-index.md` for the city's full URL list (includes legacy nerd page URLs).
2. Build the 2026 `<details>` accordion (`open` by default) and 2025 accordion (collapsed).
3. Set `numberOfItems` in the JSON-LD ItemList to the actual total count — never hardcode.
4. Going forward: because the live page overwrites monthly, John saves a static snapshot copy of the
   outgoing month (PDF or archived HTML) before each refresh and adds one line to the archive index so
   history is preserved. Newest entry = the prior month's snapshot.

Archive link text: always `{Month} {Year} Report →`.

---

## Step 7: HTML Architecture (Lofty CMS)

### Lofty Hard Rules
1. All CSS in a `<style>` block in `<head>`. Lofty strips external CSS.
2. No `position: fixed`. Use `position: sticky` / JS scroll-class toggle for the sticky CTA.
3. No `<form>` elements. Lofty handles forms.
4. No external JS frameworks. The sticky-CTA scroll listener is the only JS allowed.
5. Full-bleed hero/background: `width: 100vw; margin-left: calc(50% - 50vw);`
6. Dark overlay via `::before` with `rgba(0,0,0,0.42)`.
7. `background-attachment: fixed` desktop; **mobile media query must set `scroll`** (iOS Safari bug).
8. Hero background must include `background-color: #1e3a5f` fallback (never render muddy brown).
9. JSON-LD single `@graph` block in `<head>`, not body.
10. Do NOT include `<html>`, `<head>`, `<body>` wrapper tags — Lofty adds these. Start output with
    `<meta charset="UTF-8" />` and end at the closing `</script>`.
11. **Gold-button text must be forced dark navy with override specificity.** Lofty's global site CSS
    recolors `<a>` links (often to the accent gold), which makes gold-background buttons render
    gold-on-gold and effectively invisible. So every solid gold `.btn` (and the gold sticky-bar links)
    must set `color:#152a45 !important` AND be scoped under `.market-report` for specificity, e.g.
    `.market-report .btn,.market-report a.btn{...color:#152a45 !important;}` and
    `.market-report .sticky-right a{...color:#152a45 !important;}`. The gold *outline* buttons on the
    dark footer keep gold text (legible on navy) and are exempt.
12. **Data tables must be horizontally scrollable on mobile.** The supply and zip tables have 4 to 5
    columns and clip their last column on ~390px screens. Wrap every `<table class="mr-table">` in
    `<div class="table-scroll">` with `overflow-x:auto; -webkit-overflow-scrolling:touch;` and give the
    table `min-width:520px` inside it. Also tighten cell padding/font under 600px. This keeps all columns
    reachable by swipe without affecting desktop or AI readability (full table stays in the HTML).

### CSS Variables (:root)
```css
:root{
  --color-primary:#1e3a5f; --color-primary-dark:#152a45;
  --color-accent:#c9a227; --color-accent-hover:#b89220;
  --color-text:#2d3748; --color-text-light:#4a5568; --color-text-muted:#718096;
  --color-bg-soft:#f7fafc; --color-border:#e2e8f0;
  --color-hot:#dc2626; --color-cool:#2563eb; --color-success:#16a34a;
  --font-heading:'Playfair Display',Georgia,serif;
  --font-body:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
  --shadow-md:0 10px 30px rgba(0,0,0,.12);
  --radius-lg:16px; --radius-md:14px; --max-width:1100px; --section-spacing:3.1rem;
}
```

### Market-Type Dot Indicator
Prefix every market-type label with a colored dot: red (`--hot`) for Extreme/Strong Seller's, none for
Seller's, blue (`--cool`) for Leaning Toward Buyer's / Buyer's. Always `aria-hidden="true"`.

---

## Step 0: Do not start until you hold all of these

The 2026-09-01 build took roughly four hours instead of one because inputs
arrived piecemeal and pages were rebuilt six times. Gather everything FIRST.

  [ ] integrity-homes-master-brand-profile.md, read in full.
      Ranking is top 3% SCWMLS. Never national. Never top 5%.
      No ROH savings or rebate language on Integrity Homes pages.
      Real Broker disclosure belongs in the footer.
  [ ] The Airtable rows for the month, with the narrative fields FILLED.
      City Positioning Intro, John's Take, Speakable Answer, Market Summary.
      If they are empty, write them and push them BEFORE generating any HTML.
  [ ] An explicit hero image URL per city, from John. Do not infer them from
      the live pages; they have been wrong before.
  [ ] A live link check. Every internal URL verified 200 in a real browser,
      not read from the sitemap or the Web Pages table, both of which are stale.
  [ ] references/lofty-platform.md, so you know what the Script area and the
      SEO panel will do to your output.

BUILD ONCE. Deliver once. Every extra delivery is a chance for John to paste a
stale file, and he cannot tell versions apart from a download. If something
must change after delivery, say plainly which files are superseded and tell him
to delete the old ones.

Hand over the SEO panel values (title, meta description, og:image per page) at
the SAME time as the HTML. They are a separate job in a separate screen and he
needs to know that up front, not after publishing.

---
## Step 8: Section-by-Section Build (in order)

**Core principle: answer the question first (what does the market mean?), then let the data prove it
(how do you know?) inside one accordion. Never lead with the data. John's interpretation is the
differentiator; the data is a commodity, so John's Take sits high on the page, not buried.**
The visible page is interpretation. The MLS depth lives behind ONE accordion (still rendered in the
HTML so AI and search engines read it, just out of the way for humans). Section headers are the literal
questions people type into Google, ChatGPT, Gemini, and Perplexity. Never Realtor or analyst jargon.

**Banned header language (sounds like a Realtor/analyst, nobody searches it):**
"Hyper-Local Market Overview," "Market Pulse," "Supply Detail by Price Range," "Forecast &
Recommendations," "Current Market Conditions," "The Big Picture." Use plain-question headers instead.

**Target length:** Overview 2,000 to 3,000 words, 4 charts visible, 1 stat grid, 10 to 15 FAQs,
strong first-person commentary, archive links. The full nerd data still renders, just inside the accordion.

### Visible page (in order)

1. **`<head>`** meta tags, canonical (permanent URL), OG/Twitter, Google Fonts (`&display=swap`),
   JSON-LD `@graph`, `<style>`.
2. **Hero** (`.market-report` full-bleed; `id="top"`) kicker, H1 "{City}, Wisconsin Housing Market",
   city hub pill, month label, freshness badge, speakable hero intro (`.market-hero-intro`), stats strip.
3. **Nav links** `{City} Hub | Browse Homes | Past Reports`.
4. **Snapshot card** H2 "{Month Year} Snapshot", stat grid 8 to 10 stats max, one-line takeaway
   (id="snapshot-summary", SPEAKABLE) with market-type dot, source line.
5. **Home Valuation CTA banner** to `/evaluation`.
6. **"Should I Buy a Home in {City} Right Now?"** direct answer first. Links: {city} home search,
   first-time homebuyer guide, VA loan guide. Speakable.
7. **"Is Now a Good Time to Sell a Home in {City}?"** Links: home valuation, seller guide. Speakable.
8. **"John's Take: What I'm Seeing on the Ground"** ELEVATED here, right after Buy/Sell. The page's moat:
   the thing Zillow/Realtor.com/Redfin/Homes.com cannot replicate. First-person, specific, strategy-driven;
   John's verbatim observations shaped into his voice, specifics intact. Distinct dark/accent block.
9. **"Are Home Prices Going Up or Down in {City}?"** direction in sentence one. Speakable.
10. **"How Long Does It Take to Sell a House in {City}?"** Speakable.
11. **"Can Buyers Negotiate in {City}?"** Speakable.
12. **"Should I Wait for Interest Rates to Drop in {City}?"** Top buyer question, strong AI-search magnet.
    Honest, non-salesy, never predict rates; frame the low-supply tradeoff and buy-now-refinance-later.
    Link VA guide. Speakable.
13. **"What's Changed Over the Last Year?"** exactly 4 charts visible, one sentence each:
    Median Price, Inventory, Days on Market, Sales Volume. Only data visible outside the accordion.
14. **"What's Happening in My {City} Neighborhood?"** 2 to 3 paragraphs before the FAQ. Frame the city as
    a set of micro-markets, cite the fastest/highest zips from the data, name specific neighborhoods as
    plain text (link them when confirmed neighborhood-page URLs exist), then bridge to the OTHER five city
    hubs (each linked). This is an AI-search bridge into the neighborhood/subdivision/city-hub cluster.
    Speakable lead.
15. **FAQ** (`.faq-a`, SPEAKABLE) 10 to 15 plain-language questions with real data. Above ROH and Schools
    (FAQ is core market content; ROH and Schools are supporting).
16. **Schools section** primary district CTA + district cards (per-city list). Confirmed URLs only.
17. **Detailed-data accordion** ONE `<details>` (Option A), collapsed. Preferred label:
    "See the Full {City} Market Data (Nerd Version 🤓)". Alternates: "See the Full {City} Market Data",
    "See the Detailed {City} MLS Statistics". Never "Advanced Market Statistics & Data". Inside, rendered
    in HTML so AI reads it: Supply Gauge (chart); Months of Supply by Price Range (chart + table, hot <1.0
    red); Neighborhood & Zip Code Trends (table); Year-Over-Year Comparison (chart); Methodology (text).
18. **Reward Our Heroes widget** to ROH calculator URL. Placed LOW, after the data, because it is
    conversion-focused; the educational flow (answers, data, FAQ, schools) should come first. A market-report
    visitor researches the city, schools, and data, THEN decides whether to reach out.
19. **Archive card** "Past {City} Market Reports", 2026 (open) + 2025 (closed) from index.
20. **About the Author** John Reuter card; closing paragraph linking to the city hub.
21. **Newsletter CTA** to Kit newsletter URL.
22. **Footer** phone/email, 4 buttons, data-source line.
23. **Sticky CTA bar** JS scroll-triggered.

**Internal-linking rule (topic clusters):** Buy to home search + first-time buyer guide + VA loan;
Sell to valuation + seller guide; Rates to VA loan; Neighborhood to the other five city hubs (and
neighborhood pages when they exist). Real config URLs only.

**Schema architecture note:** Every page must be self-sufficient. Google merges JSON-LD by `@id`
WITHIN a single page, but it does NOT resolve an `@id` across pages. It re-reads each URL from scratch,
so `{"@id":"https://integrityhomeswi.com/#org"}` on a market page, pointing at a node defined only on
the homepage, is a dangling reference to nothing. Article `publisher` is required, so a dangling
publisher means the page has no publisher at all.

Market pages therefore emit MINIMAL stubs of the three identity entities alongside their own nodes,
using the EXACT homepage `@id` values:

- `#org` - `["Organization","RealEstateAgent"]`, name "John Reuter - Integrity Homes", url, logo, telephone
- `#john` - `Person`, name, jobTitle, url, worksFor `#org`
- `#website` - `WebSite`, url, name, publisher `#org`

The shared `@id` is what consolidates the entity across pages over time, so it must match the homepage
byte for byte: `#org` and `#john`, NEVER `#organization` or `#johnreuter`. Do not repeat the full
homepage detail (address, sameAs, award, memberOf) on market pages. The stub is only there to make the
references resolve. After generating, confirm every `@id` reference in the graph points at a node
defined in that same graph.

### The Advanced-Data Accordion (Option A, required pattern)

One single `<details class="advanced-data">` element, NOT multiple accordions (multiple accordions
recreate the old Nerd Page feel). All five advanced blocks live inside it. Because it is real rendered
HTML, search engines and AI assistants read everything inside; humans simply get a clean page that
answers their question first. Do NOT hide data with JavaScript. `<details>`/`<summary>` keeps it in the DOM.


## Step 9: Charts (SVG — three required)

Same spec as the legacy Nerd Page. `viewBox` (no fixed px), `width="100%"`, transparent background,
`<title>` + `<desc>` first children, font `Inter`. Colors: navy `#1e3a5f`, gold `#c9a227`,
hot red `#dc2626`, success green `#16a34a`.

1. **Inventory Supply Gauge** — horizontal 0→8+ mo gauge, tick at the city's supply, market-type
   label. Threshold markers at 4 mo (Seller's) and 6 mo (Buyer's). Never use "Balanced."
2. **Supply by Price Range** — one bar per bracket, width ∝ months of supply (cap 6 mo). Hot (<1.0)
   red, others navy. Title "Months of Supply by Price Range: {City}, {Month Year}".
3. **Year-over-Year Comparison** — 3–4 bar pairs (Median Price, DOM, Sales, or $/SqFt). Current gold,
   prior gray. Title "{City} Year-Over-Year Comparison: {Month Year}".

---

## Step 10: JSON-LD Schema (single `@graph` in `<head>`)

Entities (identity stubs first, then the page's own nodes):
0. **Identity stubs** - `#org`, `#john`, `#website` exactly as specified in the Schema architecture
   note above. Without these, author/publisher/creator/isPartOf all dangle.
1. **Article** — headline, dates (datePublished static 2025-12-01, dateModified = snapshot date),
   author `{"@id":"https://integrityhomeswi.com/#john"}`,
   publisher `{"@id":"https://integrityhomeswi.com/#org"}`,
   speakable `[".market-hero-intro",".tldr-box",".speakable-answer",".faq-a"]`, mentions array.
2. **WebPage** — `@id` `{canonical}#webpage`, datePublished/dateModified, isPartOf `#website`,
   significantLink array with **City Hub URL FIRST**, then homes-for-sale, evaluation, school guide(s),
   ROH, about.
3. **BreadcrumbList** — Home → Market Reports → {City, WI} (3 levels; the page is now the section
   landing page, so no 4th dated level).
4. **Place** — precise decimal lat/lng, PostalAddress with primary zip, Dane County → Wisconsin.
5. **Dataset** (`#marketsnapshot`) — variableMeasured from provided metrics only;
   datePublished/dateModified = snapshot date; description names prior-month closings.
6. **ItemList** (`#itemlist`) — archive entries, `numberOfItems` = actual count, descending.
7. **FAQPage** (`#faq`) — Q&A pairs matching the visible FAQ exactly.

---

## NO PLACEHOLDERS. This one is absolute.

A page states a fact or it says nothing. There is no third option.

If a figure cannot be confirmed, the section that would have carried it does not
get rendered. Do NOT write a sentence explaining the gap. The reader does not
care that a baseline could not be verified, that a number is pending, or that
something is coming soon. Every one of those sentences is a seam showing, and it
is how half-finished pages end up published.

Banned on the page, in any wording: could not be verified, not shown,
unconfirmed, TBD, coming soon, to be determined, pending, awaiting data, check
back, figure not available, and any variant that narrates a missing value
instead of simply omitting it.

Missing data is a CALLOUT TO JOHN, delivered in chat alongside the file. It is
never page copy. If you find yourself writing a sentence to the reader about
what you could not confirm, delete the whole section and tell John instead.

The one legitimate exception is a real market fact that happens to be an
absence: nothing available, no active listings in a price bracket with zero
inventory is data about the market, not an apology for missing data.

## Step 11: QA Checklist

### Grammar & Language
- [ ] "an Extreme Seller's Market"; "leaning toward a Buyer's Market"
- [ ] No "fast market" language if median DOM > 30
- [ ] No "prices remain elevated" if city price YoY < -5%
- [ ] Sales/volume decline framed as fewer transactions, not falling prices, when prices are steady
- [ ] No "Balanced Market" anywhere
- [ ] Market type matches 5-tier ladder exactly

### Classification & Indicators
- [ ] Hot zones strictly < 1.0 mo — flagged consistently; nothing ≥ 1.0 flagged red
- [ ] $0–$99,999 inflated-supply bracket footnoted as small sample, not sold as a buyer's segment
- [ ] Zips/brackets < 10 sales footnoted, not featured
- [ ] Supply gauge uses Seller's (4) / Buyer's (6) thresholds, never "Balanced"

### URLs, Dates & Config
- [ ] Canonical = permanent `/market-reports/{city-slug}-wisconsin/` (NOT dated)
- [ ] Hero image, zip(s), school district name/URL, lat/lng all match config exactly
- [ ] `datePublished` 2025-12-01 static; `dateModified` = snapshot date
- [ ] Hero badge, WebPage dateModified, Dataset dateModified all in sync
- [ ] City Hub URL in: hero pill, nav, schools/CTA area, footer button, About closing, JSON-LD significantLink (first)
- [ ] Kit newsletter URL correct for city

### Schema
- [ ] Single `@graph` in `<head>`
- [ ] ZERO placeholder or gap-explaining language on the page (see NO PLACEHOLDERS).
      Omit the section and tell John instead.
- [ ] Every `@id` reference resolves to a node defined in the SAME graph (no cross-page refs)
- [ ] Zero em dashes in the generated HTML. Colons in headings, commas in prose, `n/a` in empty
      table cells. En dashes in numeric ranges ($300,000–$399,999) are the one allowed exception
- [ ] If `references/archive-index.md` is missing, the archive note must NOT claim month-by-month
      history exists. Describe only what the page actually contains
- [ ] All 7 entities present; BreadcrumbList 3 levels; City Hub first in significantLink
- [ ] `numberOfItems` counted from archive-index.md, not hardcoded

### Content & HTML
- [ ] Overview prose city-specific, not boilerplate
- [ ] Every number traces to the PDF or John — no invented stats
- [ ] ROH widget present with correct calculator URL
- [ ] All three SVG charts present with `<title>`/`<desc>`
- [ ] Speakable classes present: `.market-hero-intro`, `.tldr-box`, `.speakable-answer`, `.faq-a`
- [ ] Google Fonts URL includes `&display=swap`
- [ ] No `position:fixed`; no `<form>`; mobile `background-attachment:scroll`; navy hero fallback color
- [ ] Gold solid buttons + sticky-bar links use `color:#152a45 !important` scoped under `.market-report` (not gold-on-gold)
- [ ] Every `.mr-table` wrapped in `.table-scroll` (overflow-x:auto, min-width:520px) so no column clips on mobile
- [ ] Sticky CTA script is the only JS
- [ ] Data-source footer present

---

## Step 12: Deliver

- Save to `/mnt/user-data/outputs/{city-slug}-market-report-{month}-{year}.html`
- Present with `present_files`
- Delivery note must include: ✅ file name, ✅ the PERMANENT canonical URL to paste/overwrite in Lofty,
  ✅ any anomaly flags, ✅ reminder to save the outgoing month's snapshot to the archive index before
  overwriting.

---

## Standing Rules (Non-Negotiable)

1. Only use statistics John provides. Never pull external market data.
2. **One permanent URL per city, overwritten monthly. Never create dated market-report URLs again.**
3. Old dated Nerd Pages stay live and feed the archive — never delete them.
4. Brand is always "Integrity Homes" — never "Integrity Homes Wisconsin" in visible copy/meta/schema.
5. Every city gets city-specific prose — zero copy-paste body paragraphs across cities.
6. Hot zone = strictly < 1.0 month supply. Honest, defensible, non-salesy.
7. Data-source footer required: "Data source: South Central Wisconsin MLS (SCWMLS). Data deemed reliable but not guaranteed."
8. Verification gate (Step 3) is mandatory before any HTML is written.
9. Market-type classification (5-tier ladder) must match all other Integrity Homes market content.
10. City Hub URL required in 6 places (see QA). This builds internal link equity to the master guide.
