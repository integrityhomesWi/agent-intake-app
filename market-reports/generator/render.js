const fs = require("fs");
const B = require("./build.js");
const S = require("./sections.js");
const { esc, money, pct, signed, days, cls, arrow, monthName, graph, gauge, bars, yoyChart, faqs,
        TITLES, SITE, HUB, EVAL, ABOUT, CONTACT, ROH, IMG, OUT, D, N } = B;

// Visible snapshot date, derived so the hero badge can never drift from the schema.
const SNAP = new Date(D.snapshot + "T12:00:00Z").toLocaleDateString("en-US",
  { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

const CSS = `
:root{--color-primary:#1e3a5f;--color-primary-dark:#152a45;--color-accent:#c9a227;--color-accent-hover:#b89220;--color-text:#2d3748;--color-text-light:#4a5568;--color-text-muted:#718096;--color-bg-soft:#f7fafc;--color-border:#e2e8f0;--color-hot:#dc2626;--color-success:#16a34a;--font-heading:'Playfair Display',Georgia,serif;--font-body:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;--shadow-md:0 10px 30px rgba(0,0,0,.12);--radius-lg:16px;--radius-md:14px;--max-width:1100px;--section-spacing:3.1rem}
.market-report *,.market-report *::before,.market-report *::after{box-sizing:border-box}
.market-report{font-family:var(--font-body);color:var(--color-text);line-height:1.7}
.market-report h1,.market-report h2,.market-report h3{font-family:var(--font-heading);color:var(--color-primary);line-height:1.2}
.market-report .btn,.market-report a.btn{display:inline-block;padding:.65rem 1.4rem;border-radius:8px;font-weight:600;font-size:.93rem;text-decoration:none;transition:background .2s,transform .15s}
.market-report .btn-gold{background:var(--color-accent);color:#152a45 !important;border:none}
.market-report .btn-gold:hover{background:var(--color-accent-hover);transform:translateY(-1px)}
.market-report .btn-outline{background:transparent;color:var(--color-accent) !important;border:2px solid var(--color-accent)}
.market-report .btn-navy{background:var(--color-primary);color:#fff !important;border:none}
.mr-hero{position:relative;width:100vw;margin-left:calc(50% - 50vw);min-height:400px;display:flex;align-items:center;background-size:cover;background-position:center;background-color:#1e3a5f;padding:3rem 1.5rem}
.mr-hero::before{content:'';position:absolute;inset:0;background:rgba(0,0,0,0.46)}
.mr-hero-inner{position:relative;z-index:1;max-width:var(--max-width);margin:0 auto;width:100%;color:#fff}
.mr-hero h1{color:#fff;font-size:clamp(2rem,5vw,3.1rem);font-weight:700;margin-bottom:.9rem}
.mr-kicker{font-size:.8rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--color-accent);margin-bottom:.5rem}
.market-hero-intro{font-size:1.08rem;opacity:.93;max-width:660px;margin-bottom:1.2rem}
.mr-hero-pills{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.2rem}
.mr-pill{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:20px;padding:.3rem .85rem;font-size:.82rem;font-weight:600;color:#fff;text-decoration:none}
.mr-pill-gold{background:var(--color-accent);border-color:var(--color-accent);color:#152a45 !important}
.mr-freshness{font-size:.78rem;opacity:.78;margin-top:.5rem}
.mr-stats-strip{display:flex;flex-wrap:wrap;gap:1.2rem;margin-top:1.5rem;padding-top:1.3rem;border-top:1px solid rgba(255,255,255,.2)}
.mr-stat-item{text-align:center}
.mr-stat-num{font-family:var(--font-heading);font-size:1.55rem;font-weight:700;color:var(--color-accent);display:block}
.mr-stat-label{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;opacity:.82}
.mr-nav{background:var(--color-primary-dark);width:100vw;margin-left:calc(50% - 50vw);padding:.7rem 1.5rem}
.mr-nav-inner{max-width:var(--max-width);margin:0 auto;display:flex;flex-wrap:wrap;gap:.5rem 1.4rem;align-items:center}
.mr-nav a{color:#fff;text-decoration:none;font-size:.85rem;font-weight:600;opacity:.88}
.mr-nav a:hover{opacity:1;color:var(--color-accent)}
.mr-nav-sep{color:rgba(255,255,255,.3)}
.mr-content{max-width:var(--max-width);margin:0 auto;padding:0 1.25rem}
.mr-section{margin:var(--section-spacing) 0}
.mr-section h2{font-size:1.5rem;margin-bottom:.9rem}
.mr-section h3{font-size:1.2rem;margin:1.2rem 0 .6rem}
.mr-section p{margin-bottom:.9rem;color:var(--color-text-light)}
.mr-snapshot-card{background:#fff;border-radius:var(--radius-lg);box-shadow:var(--shadow-md);border:1px solid var(--color-border);padding:2rem;margin:2.4rem 0}
.mr-snapshot-card h2{font-size:1.5rem;margin-bottom:1.2rem}
.mr-stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:1.3rem}
.mr-stat-box{background:var(--color-bg-soft);border-radius:10px;padding:1rem 1.1rem;border-left:3px solid var(--color-accent)}
.mr-stat-box .val{font-family:var(--font-heading);font-size:1.42rem;font-weight:700;color:var(--color-primary);display:block}
.mr-stat-box .lbl{font-size:.75rem;text-transform:uppercase;letter-spacing:.07em;color:var(--color-text-muted);margin-top:.15rem}
.mr-stat-box .chg{font-size:.8rem;font-weight:600;margin-top:.2rem}
.chg-up{color:var(--color-success)}.chg-down{color:var(--color-hot)}.chg-flat{color:var(--color-text-muted)}
.tldr-box{background:var(--color-primary);color:#fff;border-radius:10px;padding:1rem 1.3rem;font-size:1rem;margin-top:1rem}
.tldr-box strong{color:var(--color-accent)}
.source-line{font-size:.72rem;color:var(--color-text-muted);margin-top:.7rem}
.mr-cta-banner{background:linear-gradient(135deg,var(--color-primary) 0%,var(--color-primary-dark) 100%);border-radius:var(--radius-md);padding:1.6rem 2rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin:2rem 0}
.mr-cta-banner p{color:#fff;font-size:1.05rem;font-weight:600;max-width:520px;margin:0}
.mr-cta-banner span{color:var(--color-accent)}
.johns-take{background:var(--color-primary);border-radius:var(--radius-lg);padding:2rem;margin:var(--section-spacing) 0}
.johns-take-header{display:flex;align-items:center;gap:.8rem;margin-bottom:1.2rem}
.johns-take-avatar{width:52px;height:52px;border-radius:50%;background:var(--color-accent);display:flex;align-items:center;justify-content:center;font-size:1.35rem;color:var(--color-primary-dark);font-weight:700;font-family:var(--font-heading);flex-shrink:0}
.johns-take-header-text h3{font-size:1.15rem;color:var(--color-accent);margin:0 0 .15rem}
.johns-take-header-text p{font-size:.8rem;color:rgba(255,255,255,.68);margin:0}
.johns-take p{color:rgba(255,255,255,.92);margin-bottom:.85rem;font-size:.97rem}
.table-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:1rem 0}
.mr-table{width:100%;min-width:520px;border-collapse:collapse;font-size:.88rem}
.mr-table th{background:var(--color-primary);color:#fff;padding:.6rem .85rem;text-align:left;font-weight:600;font-size:.8rem}
.mr-table td{padding:.55rem .85rem;border-bottom:1px solid var(--color-border)}
.mr-table tr:nth-child(even) td{background:var(--color-bg-soft)}
.mr-table tr:last-child td{border-bottom:none;font-weight:700}
.hot-row td:first-child{color:var(--color-hot);font-weight:700}
.tight-row td:first-child{color:var(--color-primary);font-weight:700}
.none-row td{color:var(--color-text-muted);font-style:italic}
.footnote{font-size:.75rem;color:var(--color-text-muted);margin-top:.4rem}
.mr-chart-wrap{margin:1.5rem 0}
.mr-chart-title{font-size:.88rem;font-weight:600;color:var(--color-primary);margin-bottom:.5rem;text-align:center}
.faq-list{list-style:none;padding:0;margin:0}
.faq-item{border-bottom:1px solid var(--color-border);padding:1rem 0}
.faq-item:last-child{border-bottom:none}
.faq-q{font-weight:700;color:var(--color-primary);margin:0 0 .4rem;font-size:.97rem}
.faq-a{color:var(--color-text-light);font-size:.93rem;margin:0}
.schools-section{background:var(--color-bg-soft);border-radius:var(--radius-lg);padding:2rem;margin:var(--section-spacing) 0}
.advanced-data{border:2px solid var(--color-border);border-radius:var(--radius-lg);margin:var(--section-spacing) 0;overflow:hidden}
.advanced-data summary{background:var(--color-bg-soft);padding:1.1rem 1.5rem;cursor:pointer;font-weight:700;color:var(--color-primary);font-size:1rem;list-style:none;display:flex;align-items:center;gap:.5rem}
.advanced-data summary::-webkit-details-marker{display:none}
.advanced-data summary::after{content:'\\25bc';margin-left:auto;font-size:.75rem}
.advanced-data-inner{padding:1.5rem}
.roh-widget{background:linear-gradient(135deg,#1b4332 0%,#2d6a4f 100%);border-radius:var(--radius-lg);padding:2rem;margin:var(--section-spacing) 0;text-align:center;color:#fff}
.roh-widget h3{color:#fff;font-size:1.3rem;margin-bottom:.5rem}
.roh-widget p{color:rgba(255,255,255,.88);margin-bottom:1.2rem;font-size:.95rem}
.archive-section{margin:var(--section-spacing) 0}
.archive-links{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.8rem}
.archive-links a{color:var(--color-primary);text-decoration:none;font-size:.85rem;font-weight:600;padding:.35rem .75rem;border:1px solid var(--color-border);border-radius:6px}
.archive-links a:hover{background:var(--color-bg-soft);color:var(--color-accent)}
.author-card{background:#fff;border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:1.8rem;display:flex;gap:1.4rem;align-items:flex-start;margin:var(--section-spacing) 0;box-shadow:var(--shadow-md)}
.author-avatar{width:70px;height:70px;border-radius:50%;background:var(--color-primary);display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-size:1.55rem;font-weight:700;color:var(--color-accent);flex-shrink:0}
.author-card p{font-size:.9rem;color:var(--color-text-light);margin-bottom:.5rem}
.newsletter-cta{background:var(--color-accent);border-radius:var(--radius-lg);padding:2rem;text-align:center;margin:var(--section-spacing) 0}
.newsletter-cta h3{font-size:1.3rem;color:var(--color-primary-dark);margin-bottom:.5rem}
.newsletter-cta p{color:var(--color-primary-dark);margin-bottom:1.1rem;font-size:.95rem}
.mr-footer{background:var(--color-primary);width:100vw;margin-left:calc(50% - 50vw);padding:2.4rem 1.5rem;margin-top:3rem}
.mr-footer-inner{max-width:var(--max-width);margin:0 auto;text-align:center;color:rgba(255,255,255,.82)}
.mr-footer h4{color:#fff;font-size:1.1rem;margin-bottom:.4rem}
.mr-footer a{color:var(--color-accent)}
.mr-footer p{font-size:.85rem;margin-bottom:.4rem}
.mr-footer-btns{display:flex;flex-wrap:wrap;gap:.7rem;justify-content:center;margin:1.2rem 0}
.mr-footer-source{font-size:.72rem;opacity:.6;margin-top:1rem}
.city-hubs{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.8rem}
.city-hubs a{color:var(--color-primary);text-decoration:none;font-weight:600;font-size:.88rem;padding:.3rem .75rem;border:1px solid var(--color-border);border-radius:6px}
.yoy-charts{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.1rem;margin:1.4rem 0}
.yoy-card{background:#fff;border:1px solid var(--color-border);border-radius:10px;padding:1.1rem;text-align:center;box-shadow:var(--shadow-md)}
.yoy-card .metric{font-size:.76rem;text-transform:uppercase;letter-spacing:.07em;color:var(--color-text-muted);margin-bottom:.4rem}
.yoy-card .current{font-family:var(--font-heading);font-size:1.5rem;font-weight:700;color:var(--color-primary)}
.yoy-card .prior{font-size:.82rem;color:var(--color-text-muted);margin-top:.2rem}
.yoy-card .delta{font-size:.88rem;font-weight:700;margin-top:.3rem}
.sticky-cta{position:sticky;bottom:-90px;left:0;right:0;z-index:999;background:var(--color-primary-dark);padding:.75rem 1.5rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem;box-shadow:0 -4px 20px rgba(0,0,0,.25);transition:bottom .3s ease}
.sticky-cta.visible{bottom:0}
.cta-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;margin-top:1rem}
.cta-card{background:var(--color-bg-soft);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:1.2rem;text-align:left}
.cta-card .ct{font-weight:700;color:var(--color-primary);margin-bottom:.35rem;font-family:var(--font-heading);font-size:1.08rem}
.card-stats{font-size:.86rem;color:var(--color-text-muted);margin:0 0 .5rem;font-weight:600}
.card-blurb{font-size:.9rem;color:var(--color-text-light);margin:0 0 .6rem}
.card-links{margin:0;display:flex;flex-wrap:wrap;gap:.9rem}
.card-links a{font-weight:700;text-decoration:none;color:var(--color-primary);font-size:.88rem}
.roh-list{margin:.6rem 0 1.1rem;padding-left:1.2rem;color:rgba(255,255,255,.9);text-align:left;display:inline-block}
.roh-list li{margin:.25rem 0}
.roh-tag{font-style:italic;color:#f0d98a;font-weight:600;margin-bottom:.8rem}
.author-title{font-weight:700;color:var(--color-primary);margin-bottom:.4rem}
.sticky-cta p{color:#fff;font-size:.88rem;font-weight:600;margin:0}
.sticky-right{display:flex;gap:.6rem;flex-wrap:wrap}
.market-report .sticky-right a{font-size:.82rem;padding:.45rem 1rem}
@media(max-width:768px){.sticky-cta{flex-direction:column;text-align:center}}
.compare-table td a{color:var(--color-primary);font-weight:600;text-decoration:none}
@media(max-width:768px){.mr-hero{min-height:340px}.mr-cta-banner{flex-direction:column;text-align:center}.author-card{flex-direction:column}.mr-table td,.mr-table th{padding:.45rem .6rem;font-size:.82rem}}
`;

const CITY_CHIPS = [["Madison","/madison/"],["Waunakee","/waunakee/"],["Sun Prairie","/sun-prairie/"],["Verona","/verona/"],["Middleton","/middleton/"],["DeForest","/deforest/"],["Dane County",HUB]];

function head(title, desc, url, jsonld, city, v) {
  const img = v.ogImg || IMG;
  return `<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${SITE}${url}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${SITE}${url}" />
<meta property="og:image" content="${img}" />
<meta property="og:site_name" content="Integrity Homes" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${img}" />
<meta name="geo.region" content="US-WI" />
<meta name="geo.placename" content="${esc(city)}, Wisconsin" />
<meta name="geo.position" content="${v.lat};${v.lng}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&amp;family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet" />
<script type="application/ld+json">
${JSON.stringify(jsonld, null, 1)}
</script>
<style>${CSS}</style>`;
}

function statBox(val, lbl, chgTxt, chgCls) {
  return `<div class="mr-stat-box"><span class="val">${val}</span><span class="lbl">${lbl}</span>
          <div class="chg ${chgCls}">${chgTxt}</div></div>`;
}

function renderCity(city, v) {
  const [title, desc] = TITLES[city];
  const url = "/market-reports/" + v.slug + "/";
  const n = N[city];
  const f = faqs(city, v);
  const g = graph(city, v, url, title, desc, f);

  const stats = [
    statBox(money(v.med), D.closings + " Median Sale", arrow(v.medYoY) + " " + signed(v.medYoY) + " YoY", cls(v.medYoY)),
    statBox(money(v.avg), "Average Sale", arrow(v.avgYoY) + " " + signed(v.avgYoY) + " YoY", cls(v.avgYoY)),
    statBox(v.dom + " days", "Median Days on Market", v.domYoY === 0 ? "→ unchanged YoY" : days(v.domYoY) + " YoY", cls(-v.domYoY)),
    statBox(String(v.sales), "Homes Sold", arrow(v.salesYoY) + " " + signed(v.salesYoY) + " YoY", cls(v.salesYoY)),
    statBox(v.sup.toFixed(2) + " mo.", "Months of Supply", v.active + " active listings", "chg-flat"),
    statBox(String(v.pending), "Pending Listings", "as of " + D.snapshot, "chg-flat"),
    statBox("$" + v.sqft, "Avg Price Per SqFt", arrow(v.sqftYoY) + " " + signed(v.sqftYoY) + " YoY", cls(v.sqftYoY)),
    statBox(signed(v.ask), "Avg vs. Asking", (v.ask >= 0 ? "over" : "under") + " list price", cls(v.ask))
  ].join("\n        ");

  const bracketRows = v.brackets.map(([lbl, sup]) => {
    if (sup === 0) return `<tr class="none-row"><td>${esc(lbl)}</td><td colspan="2">nothing available, no active listings</td></tr>`;
    // Hot zone is strictly under 1.0 month. A band at exactly 1.00 is not hot.
    // Tightest is whichever non-empty band is lowest, which may or may not be hot.
    const hot = sup < 1;
    const tightest = lbl === v.tight;
    const note = hot ? "Hot zone" : tightest ? "Tightest" : "";
    return `<tr${hot ? ' class="hot-row"' : tightest ? ' class="tight-row"' : ""}><td>${esc(lbl)}</td><td>${sup.toFixed(2)}</td><td>${note}</td></tr>`;
  }).join("\n              ");

  // Fewer than ten sales in a zip is a small sample: shown for completeness, never featured.
  const SMALL = 10;
  const zipRows = v.zips.map(([z, s, m, d, psf]) =>
    `<tr${s < SMALL ? ' class="none-row"' : ""}><td><strong>${z}</strong>${s < SMALL ? " *" : ""}</td><td>${s}</td><td>${money(m)}</td><td>${d}</td><td>${psf ? "$" + psf : "n/a"}</td></tr>`).join("\n              ");
  const smallZips = v.zips.filter(z => z[1] < SMALL).length;
  const zipBlock = v.zips.length ? `
        <h3>Zip Code Detail: ${esc(D.closings)}</h3>
        <div class="table-scroll"><table class="mr-table">
          <thead><tr><th>Zip</th><th>Sales</th><th>Median Sale</th><th>Median DOM</th><th>$/SqFt</th></tr></thead>
          <tbody>
              ${zipRows}
          </tbody>
        </table></div>
        <p class="footnote">Zip totals cover the reported zip areas and may not sum to the city figure, which includes fringe transactions.${smallZips ? ` Rows marked with an asterisk closed fewer than ${SMALL} homes in ${esc(D.closings)}. At that volume the median moves on which few houses happened to sell, so they are listed for completeness rather than read as a trend.` : ""}</p>` : "";

  const archive = ""; // 26 of 28 dated URLs are JS redirect stubs back to this page. Linking them is circular.

  const emptyNote = v.empty
    ? `<p class="footnote">Note: the ${esc(v.empty)} range currently has no active listings at all. That is an absence of inventory, not a competitive hot zone, and it is shown as "nothing available" rather than as a months-of-supply figure.</p>` : "";

  // No baseline means the section does not exist. Never explain an absence to the reader.
  const longTerm = v.base
    ? `<p>Over the longer run, ${esc(city)} has gone from a ${money(v.base)} median in ${v.baseYr} to ${money(v.ytdMed)} year to date, an increase of ${pct(v.appr)}.</p>`
    : "";

  return `${head(title, desc, url, g, city, v)}
<div class="market-report" id="top">
  <div class="mr-hero" style="background-image:url('${v.heroImg || IMG}')">
    <div class="mr-hero-inner">
      <p class="mr-kicker">Integrity Homes · Dane County Real Estate</p>
      <h1>${esc(city)}, Wisconsin Housing Market</h1>
      <p class="market-hero-intro">${esc(n.intro)}</p>
      <div class="mr-hero-pills">
        <a href="${SITE}${v.hub}" class="mr-pill mr-pill-gold">${esc(city)} City Hub</a>
        <a href="${SITE}${v.hfs}" class="mr-pill">Browse Homes</a>
      </div>
      <p class="mr-kicker" style="color:#fff;opacity:.72;font-size:.78rem;letter-spacing:.05em;">${esc(D.label)}</p>
      <p class="mr-freshness">Created: December 1, 2025 | Last updated: ${SNAP}</p>
      <div class="mr-stats-strip">
        <div class="mr-stat-item"><span class="mr-stat-num">${money(v.med)}</span><span class="mr-stat-label">Median Sale</span></div>
        <div class="mr-stat-item"><span class="mr-stat-num">${v.dom}</span><span class="mr-stat-label">Median DOM</span></div>
        <div class="mr-stat-item"><span class="mr-stat-num">${v.sup.toFixed(2)}</span><span class="mr-stat-label">Mo. Supply</span></div>
        <div class="mr-stat-item"><span class="mr-stat-num">${v.sales}</span><span class="mr-stat-label">Homes Sold</span></div>
      </div>
    </div>
  </div>
  <div class="mr-nav"><div class="mr-nav-inner">
    <a href="${SITE}${v.hub}">${esc(city)} Hub</a><span class="mr-nav-sep">|</span>
    <a href="${SITE}${v.hfs}">Browse Homes</a><span class="mr-nav-sep">|</span>
    <a href="${SITE}${HUB}">Dane County Report</a><span class="mr-nav-sep">|</span>
    <a href="${SITE}${EVAL}">Home Value</a>
  </div></div>
  <div class="mr-content">

    <div class="mr-snapshot-card">
      <h2>${esc(D.month)} Snapshot: ${esc(D.closings)} Closings</h2>
      <div class="mr-stat-grid">
        ${stats}
      </div>
      <div class="tldr-box"><span aria-hidden="true">●</span> ${esc(n.summary)}</div>
      <p class="source-line">Data source: SCWMLS city-area data for ${esc(city)}, WI. ${esc(D.closings)} closings, snapshot ${SNAP}. Data deemed reliable but not guaranteed.</p>
    </div>

    <div class="mr-cta-banner">
      <p>Curious what your ${esc(city)} home is worth right now? <span>Get a free, data-backed estimate.</span></p>
      <a href="${SITE}${EVAL}" class="btn btn-gold">Get My Home Value</a>
    </div>

    ${S.buy(city, v)}

    ${S.sell(city, v)}

    <div class="johns-take">
      <div class="johns-take-header">
        <div class="johns-take-avatar">JR</div>
        <div class="johns-take-header-text">
          <h3>John's Take: What I'm Seeing on the Ground</h3>
          <p>John Reuter · Integrity Homes · ${esc(city)}, WI</p>
        </div>
      </div>
      ${n.take.map(p => `<p>${esc(p)}</p>`).join("\n      ")}
    </div>

    <div class="mr-section">
      <h2>Are Home Prices Going Up or Down in ${esc(city)}?</h2>
      <p class="speakable-answer">The ${esc(D.closings)} median of ${money(v.med)} is ${v.medYoY >= 0 ? "up" : "down"} ${pct(Math.abs(v.medYoY))} year over year, and the year to date median is ${money(v.ytdMed)}, ${v.ytdMedYoY >= 0 ? "up" : "down"} ${pct(Math.abs(v.ytdMedYoY))}. Average price per square foot is $${v.sqft}, ${v.sqftYoY >= 0 ? "up" : "down"} ${pct(Math.abs(v.sqftYoY))}.</p>
      ${longTerm}
    </div>

    ${S.domSection(city, v)}

    ${S.negotiate(city, v)}

    ${S.rates(city, v)}

    ${S.yoy(city, v, yoyChart(v, city))}

    ${S.neighborhood(city, v)}

    <div class="mr-section">
      <h2>${esc(city)} Housing Market: Frequently Asked Questions</h2>
      <ul class="faq-list">
        ${f.map(([q, a]) => `<li class="faq-item"><p class="faq-q">${esc(q)}</p><p class="faq-a">${esc(a)}</p></li>`).join("\n        ")}
      </ul>
    </div>

    <div class="schools-section">
      <h2>${esc(city)} Schools</h2>
      <p>${esc(city)} is served by the <strong>${esc(v.school)}</strong>, a consistent factor in buyer demand and home values across the community. For neighborhoods, schools, and what living here is actually like, see the <a href="${SITE}${v.hub}">${esc(city)} City Hub</a>.</p>
      <a href="${SITE}${v.schoolUrl}" class="btn btn-navy">${esc(v.school)} Guide</a>
    </div>

    <details class="advanced-data">
      <summary>See the Full ${esc(city)} Market Data</summary>
      <div class="advanced-data-inner">
        <div class="mr-chart-wrap">
          <p class="mr-chart-title">Inventory Supply Gauge: ${esc(city)}</p>
          ${gauge(v, city)}
        </div>
        <div class="mr-chart-wrap">
          <p class="mr-chart-title">Months of Supply by Price Range: ${esc(city)}</p>
          ${bars(v, city)}
        </div>
        <h3>Months of Supply by Price Range: Detail</h3>
        <div class="table-scroll"><table class="mr-table">
          <thead><tr><th>Price Range</th><th>Mo. Supply</th><th>Signal</th></tr></thead>
          <tbody>
              ${bracketRows}
              <tr><td><strong>All ranges</strong></td><td><strong>${v.sup.toFixed(2)}</strong></td><td><strong>${v.active} active</strong></td></tr>
          </tbody>
        </table></div>
        ${emptyNote}
        ${zipBlock}
        <div class="mr-chart-wrap"><p class="mr-chart-title">Year Over Year Comparison: ${esc(city)}</p>${yoyChart(v, city)}</div>
        <h3>Methodology</h3>
        <p style="font-size:.88rem;color:#4a5568;">All market data sourced from the South Central Wisconsin MLS (SCWMLS), filtered to the ${esc(city)} city area. Monthly figures reflect closed transactions recorded in ${esc(D.closings)}. Months of supply is active listings divided by the twelve month average sales per month. Year over year compares ${esc(D.closings)} with the same month a year earlier. Data deemed reliable but not guaranteed.</p>
      </div>
    </details>

    ${S.rohWidget()}

    ${archive}

    ${S.authorCard(city, v.hub)}

    <div class="newsletter-cta">
      <h3>Get the ${esc(city)} Market Report Every Month</h3>
      <p>Free monthly update on ${esc(city)} home prices, inventory, and what John is seeing on the ground, straight to your inbox.</p>
      <a href="${v.kit}" class="btn btn-navy">Subscribe to ${esc(city)} Updates</a>
    </div>
  </div>

  <div class="mr-footer"><div class="mr-footer-inner">
    <h4>Integrity Homes</h4>
    <p>John Reuter · ${esc(city)}, Wisconsin · 608-669-4226 · john@integrityhomeswi.com</p>
    <div class="mr-footer-btns">
      <a href="${SITE}${v.hub}" class="btn btn-outline">${esc(city)} Hub</a>
      <a href="${SITE}${v.hfs}" class="btn btn-outline">Browse Homes</a>
      <a href="${SITE}${EVAL}" class="btn btn-outline">Home Value</a>
      <a href="${SITE}${HUB}" class="btn btn-outline">Dane County Report</a>
      <a href="${SITE}${CONTACT}" class="btn btn-outline">Contact</a>
    </div>
    <p class="mr-footer-source">Data source: South Central Wisconsin MLS (SCWMLS), filtered to the ${esc(city)} city area. ${esc(D.closings)} closings. Snapshot date: ${SNAP}. Data deemed reliable but not guaranteed. Integrity Homes of Wisconsin is Powered by Real Broker, LLC.</p>
  </div></div>
</div>
${S.stickyBar(city, v)}`;
}

// ---------- Dane County hub ----------
function renderHub() {
  const city = "Dane County", v = D.county, [title, desc] = TITLES[city], url = HUB, n = N[city];
  const hubV = Object.assign({}, v, { lat: 43.0731, lng: -89.4012, archive: [], slug: "dane-county", heroImg: IMG, ogImg: IMG });
  const f = faqs(city, hubV);
  const g = graph(city, hubV, url, title, desc, f);
  const sorted = Object.entries(D.cities).sort((a, b) => a[1].sup - b[1].sup);

  const rows = sorted.map(([c, x]) => `<tr>
              <td><a href="${SITE}/market-reports/${x.slug}/"><strong>${esc(c)}</strong></a></td>
              <td>${money(x.med)}</td>
              <td class="${cls(x.medYoY)}">${signed(x.medYoY)}</td>
              <td>${x.dom} days</td>
              <td>${x.sup.toFixed(2)} mo</td>
              <td>${esc(x.typePlain)}</td>
              <td><a href="${SITE}/market-reports/${x.slug}/">View</a></td></tr>`).join("\n              ");

  return `${head(title, desc, url, g, city, hubV)}
<div class="market-report" id="top">
  <div class="mr-hero" style="background-image:url('${IMG}')"><div class="mr-hero-inner">
    <p class="mr-kicker">Integrity Homes · Market Reports</p>
    <h1>Dane County, Wisconsin Housing Market</h1>
    <p class="market-hero-intro">${esc(n.intro)}</p>
    <p class="mr-kicker" style="color:#fff;opacity:.72;font-size:.78rem;letter-spacing:.05em;">${esc(D.label)}</p>
    <p class="mr-freshness">Created: December 1, 2025 | Last updated: ${SNAP}</p>
    <div class="mr-stats-strip">
      <div class="mr-stat-item"><span class="mr-stat-num">${money(v.med)}</span><span class="mr-stat-label">County Median</span></div>
      <div class="mr-stat-item"><span class="mr-stat-num">${v.dom}</span><span class="mr-stat-label">Median DOM</span></div>
      <div class="mr-stat-item"><span class="mr-stat-num">${v.sup.toFixed(2)}</span><span class="mr-stat-label">Mo. Supply</span></div>
      <div class="mr-stat-item"><span class="mr-stat-num">6</span><span class="mr-stat-label">Communities</span></div>
    </div>
  </div></div>
  <div class="mr-nav"><div class="mr-nav-inner">
    <a href="#compare">Compare Communities</a><span class="mr-nav-sep">|</span>
    <a href="#cities">City Reports</a><span class="mr-nav-sep">|</span>
    <a href="${SITE}${EVAL}">Home Value</a>
  </div></div>
  <div class="mr-content">
    <div class="mr-snapshot-card" id="compare">
      <h2>The Dane County Market at a Glance</h2>
      <p class="speakable-answer">${esc(n.speak)}</p>
      <div class="table-scroll"><table class="mr-table compare-table">
        <thead><tr><th>Community</th><th>Median</th><th>YoY</th><th>Median DOM</th><th>Supply</th><th>Market</th><th>Report</th></tr></thead>
        <tbody>
              ${rows}
        </tbody>
      </table></div>
      <div class="tldr-box"><span aria-hidden="true">●</span> ${esc(n.summary)}</div>
      <p class="source-line">Data source: SCWMLS, ${esc(D.closings)} closings, snapshot ${SNAP}. Each community is reported by its city area, the standard SCWMLS unit. Data deemed reliable but not guaranteed.</p>
    </div>

    <div class="mr-cta-banner">
      <p>What is your Dane County home worth right now? <span>Get a free, data-backed estimate.</span></p>
      <a href="${SITE}${EVAL}" class="btn btn-gold">Get My Home Value</a>
    </div>

    ${S.hubBigPicture(v, D.cities)}

    <div class="johns-take">
      <div class="johns-take-header">
        <div class="johns-take-avatar">JR</div>
        <div class="johns-take-header-text">
          <h3>John's Take: Across Dane County</h3>
          <p>John Reuter · Integrity Homes</p>
        </div>
      </div>
      ${n.take.map(p => `<p>${esc(p)}</p>`).join("\n      ")}
    </div>

    ${S.hubCityCards(D.cities)}

    <div class="mr-section">
      <h2>Dane County Housing Market: Frequently Asked Questions</h2>
      <ul class="faq-list">
        ${f.map(([q, a]) => `<li class="faq-item"><p class="faq-q">${esc(q)}</p><p class="faq-a">${esc(a)}</p></li>`).join("\n        ")}
      </ul>
    </div>

    ${S.hubSchools(D.cities)}

    <details class="advanced-data">
      <summary>See the Full Dane County Market Data</summary>
      <div class="advanced-data-inner">
        <div class="mr-chart-wrap"><p class="mr-chart-title">Inventory Supply Gauge: Dane County</p>${gauge(v, city)}</div>
        <div class="mr-chart-wrap"><p class="mr-chart-title">Months of Supply by Price Range: Dane County</p>${bars(hubV, city)}</div>
        <h3>Methodology</h3>
        <p style="font-size:.88rem;color:#4a5568;">All market data sourced from the South Central Wisconsin MLS (SCWMLS) for Dane County. Monthly figures reflect closed transactions recorded in ${esc(D.closings)}. Months of supply is active listings divided by the twelve month average sales per month. Data deemed reliable but not guaranteed.</p>
      </div>
    </details>

    ${S.rohWidget()}

    ${S.authorCard(null, null)}

    <div class="newsletter-cta">
      <h3>Stay Ahead of the Dane County Market</h3>
      <p>Get the monthly market breakdown delivered to your inbox, free.</p>
      <a href="https://integrity-homes.kit.com/madison-wi-housing-market-update" class="btn btn-navy">Subscribe Free</a>
    </div>
  </div>

  <div class="mr-footer"><div class="mr-footer-inner">
    <h4>Integrity Homes</h4>
    <p>John Reuter · Dane County, Wisconsin · 608-669-4226 · john@integrityhomeswi.com</p>
    <div class="mr-footer-btns">
      <a href="${SITE}/homes-for-sale" class="btn btn-outline">Browse Homes</a>
      <a href="${SITE}${EVAL}" class="btn btn-outline">Home Value</a>
      <a href="${SITE}${CONTACT}" class="btn btn-outline">Contact</a>
    </div>
    <p class="mr-footer-source">Data source: South Central Wisconsin MLS (SCWMLS). ${esc(D.closings)} closings. Snapshot date: ${SNAP}. Data deemed reliable but not guaranteed. Integrity Homes of Wisconsin is Powered by Real Broker, LLC.</p>
  </div></div>
</div>
${S.hubSticky(v)}`;
}

// ---------- run ----------
fs.mkdirSync(OUT, { recursive: true });
const written = [];
for (const [city, v] of Object.entries(D.cities)) {
  N[city].speak = `${D.month} snapshot: ${city}'s median sale price is ${money(v.med)}, homes sell in about ${v.dom} days, and inventory is ${v.sup.toFixed(2)} months (${v.typePlain}).`;
  const html = renderCity(city, v);
  const file = OUT + "/" + v.slug + ".html";
  fs.writeFileSync(file, html, "utf8");
  written.push([city, file, html.length]);
}
N["Dane County"].speak = `${D.month} snapshot: Dane County's median sale price is ${money(D.county.med)}, homes sell in about ${D.county.dom} days, and inventory is ${D.county.sup.toFixed(2)} months (${D.county.typePlain}).`;
const hub = renderHub();
fs.writeFileSync(OUT + "/wisco-hub.html", hub, "utf8");
written.push(["Dane County", OUT + "/wisco-hub.html", hub.length]);

for (const [c, f, len] of written) console.log(c.padEnd(13), (len / 1024).toFixed(1).padStart(6) + " KB", f.split("/").pop());
console.log("\n" + written.length + " files written to " + OUT);
