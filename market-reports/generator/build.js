// Market report generator. Reads data.js + narrative.js, emits Lofty-ready HTML.
// Every internal link below was verified HTTP 200 on 2026-09-01.
const fs = require("fs");
const D = require("./data.js");
const N = require("./narrative.js");

const OUT = "C:/Users/admin/Downloads/market-reports-october-2026";
const SITE = "https://integrityhomeswi.com";
const HUB = "/wisco-hub";                 // Dane County lives here, NOT /market-reports/dane-county-wisconsin/
const EVAL = "/evaluation";               // no trailing slash
const ABOUT = "/about";                   // no trailing slash
const CONTACT = "/contact";               // no trailing slash
const ROH = "https://www.rewardourheroes.com/calculator-page";
const IMG = "https://cdn.lofty.com/image/fs/341054835208155/website/20980/cmsbuild/20251230_7e589d03d7c94fd3.jpeg";  // Dane County hub

const TITLES = {
 Madison:["Is Madison a Buyer's or Seller's Market Right Now?","See where Madison home prices, days on market, and inventory supply stand right now, plus how each zip code and price range differs. Updated monthly."],
 Waunakee:["Is Waunakee Worth the Price Premium Right Now?","Waunakee runs on tight inventory and a school district buyers chase. See where prices, days on market, and supply by price range stand right now."],
 "Sun Prairie":["Is Sun Prairie Still the Value Play in Dane County?","Sun Prairie still delivers more house per dollar than the Madison west side. See current prices, days on market, and supply by price range."],
 Verona:["Is Verona the Hardest Dane County Market to Buy In?","Epic Systems keeps Verona demand steady year round. See where prices, days on market, and inventory stand, and which price ranges are tightest."],
 Middleton:["Is Middleton Worth Its Dane County Premium?","Middleton holds a premium across every price range. See where prices, days on market, and supply stand now, and where buyers have real leverage."],
 DeForest:["Is DeForest the Best Value North of Madison?","DeForest offers some of the most attainable home values north of the city. See current prices, days on market, and supply by price range."],
 "Dane County":["Which Dane County Suburb Has the Tightest Housing Market?","Compare median price, days on market, and months of supply across Madison, Waunakee, Sun Prairie, Verona, Middleton, and DeForest. Updated monthly."]
};

// ---------- helpers ----------
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const money = n => "$" + Number(n).toLocaleString("en-US");
// Keep two decimals under 1%, or a sale-to-list figure like 0.07% rounds to 0.1%
// and the page then disagrees with itself between sections.
const pct = v => {
  const n = v * 100;
  const s = Math.abs(n) < 1 ? n.toFixed(2) : n.toFixed(1);
  return s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "") + "%";
};
const signed = v => (v>0?"+":"") + pct(v);
const days = v => (v>0?"+":"") + v + (Math.abs(v)===1?" day":" days");
const cls = v => v>0?"chg-up":v<0?"chg-down":"chg-flat";
const arrow = v => v>0?"\u2191":v<0?"\u2193":"\u2192";
const monthName = s => s.replace(/-/," ").replace(/\b\w/g,c=>c.toUpperCase()).replace(/\/$/,"");

// ---------- JSON-LD ----------
// The canonical identity nodes, embedded IN FULL on every page. A bare {"@id": ...}
// does not resolve across documents, so a trimmed node leaves the entity effectively
// undefined for Google on that URL. Mirrors the live homepage graph.
const CDN = "https://cdn.lofty.com/image/fs/341054835208155/website/20980/cmsbuild";
const ORG_NODE = () => ({
  "@type":["Organization","RealEstateAgent"],"@id":SITE+"/#org",
  "name":"John Reuter - Integrity Homes","legalName":"Integrity Homes of Wisconsin",
  "alternateName":["Integrity Homes","IntegrityHomesWI"],"url":SITE+"/",
  "logo":CDN+"/h200_20251213_d2364072487347e4-png.webp",
  "image":CDN+"/20251213_d55b4c32cc4447e3.jpeg",
  "telephone":"+1-608-669-4226","email":"john@integrityhomeswi.com",
  "address":{"@type":"PostalAddress","streetAddress":"1025 Quinn Drive Ste 100",
    "addressLocality":"Waunakee","addressRegion":"WI","postalCode":"53597","addressCountry":"US"},
  "geo":{"@type":"GeoCoordinates","latitude":43.19163,"longitude":-89.41845},
  "areaServed":[
    {"@type":"GeoCircle","geoMidpoint":{"@type":"GeoCoordinates","latitude":43.0731,"longitude":-89.4012},"geoRadius":40000},
    {"@type":"AdministrativeArea","name":"Dane County, Wisconsin"},
    {"@type":"City","name":"Madison, Wisconsin"},{"@type":"City","name":"Waunakee, Wisconsin"},
    {"@type":"City","name":"Sun Prairie, Wisconsin"},{"@type":"City","name":"Verona, Wisconsin"},
    {"@type":"City","name":"Middleton, Wisconsin"},{"@type":"City","name":"DeForest, Wisconsin"},
    {"@type":"City","name":"Windsor, Wisconsin"}],
  "knowsAbout":["VA Home Loans","Military Relocation","Madison WI Real Estate","Dane County Housing Market","First-Time Home Buyers","Home Seller Representation","Hero Savings Programs"],
  "memberOf":[
    {"@type":"Organization","name":"National Association of REALTORS®","url":"https://www.nar.realtor/"},
    {"@type":"Organization","name":"Wisconsin REALTORS® Association","url":"https://www.wra.org/"},
    {"@type":"Organization","name":"South Central Wisconsin MLS","alternateName":"SCWMLS","url":"https://www.scwmls.com/"}],
  "founder":{"@id":SITE+"/#john"},
  "award":["2024 RASCW Good Neighbor Award"],
  "sameAs":["https://rewardourheroes.com","https://theveteranrealtor.com",
    "https://www.facebook.com/johnreuter.integrityhomes",
    "https://www.linkedin.com/company/john-reuter-integrity-homes/",
    "https://www.youtube.com/@johnreuter-integrityhomes",
    "https://www.instagram.com/johnreuterintegrityhomes",
    "https://www.tiktok.com/@integrityhomeswi"]
});
const PERSON_NODE = () => ({
  "@type":"Person","@id":SITE+"/#john","name":"John Reuter","jobTitle":"Broker/Owner",
  "description":"Broker/Owner of Integrity Homes in Dane County, Wisconsin, a retired United States Air Force veteran, and founder of the Reward Our Heroes Foundation. Ranked in the top 3% of SCWMLS agents and teams by closed sales volume.",
  "url":SITE+ABOUT,"image":CDN+"/20251223_1fc6d6e4c5a3484f.jpeg",
  "telephone":"+1-608-669-4226","email":"john@integrityhomeswi.com",
  "worksFor":{"@id":SITE+"/#org"},
  "alumniOf":{"@type":"Organization","name":"United States Air Force"},
  "knowsAbout":["VA Home Loans","Military Relocation","Madison WI Real Estate","Dane County Housing Market"],
  "hasCredential":{"@type":"EducationalOccupationalCredential",
    "credentialCategory":"Real Estate Broker License","identifier":"58480-90",
    "recognizedBy":{"@type":"GovernmentOrganization","name":"Wisconsin Department of Safety and Professional Services"}},
  "award":["2024 RASCW Good Neighbor Award",
    "FastExpert 2026 Top 15 Real Estate Agent, Windsor, WI",
    "FastExpert 2026 Top 15 Real Estate Agent, Waterloo, WI"],
  "sameAs":["https://theveteranrealtor.com"]
});

function graph(city, v, url, title, desc, faqs) {
  const id = SITE + url;
  const nodes = [
    ORG_NODE(),
    PERSON_NODE(),
    {"@type":"WebSite","@id":SITE+"/#website","url":SITE+"/","name":"Integrity Homes","publisher":{"@id":SITE+"/#org"},"inLanguage":"en-US"},
    {"@type":"Article","@id":id+"#article","headline":title,"description":desc,
     "image":v.ogImg||IMG,
     "datePublished":D.created,"dateModified":D.snapshot,
     "author":{"@id":SITE+"/#john"},"publisher":{"@id":SITE+"/#org"},
     "mainEntityOfPage":{"@id":id+"#webpage"},
     "speakable":{"@type":"SpeakableSpecification","cssSelector":[".market-hero-intro",".tldr-box",".speakable-answer",".faq-a"]}},
    {"@type":"WebPage","@id":id+"#webpage","url":id,"name":title,
     "datePublished":D.created,"dateModified":D.snapshot,
     "isPartOf":{"@id":SITE+"/#website"},"about":{"@id":id+"#place"},
     "significantLink":[SITE+(v.hub||HUB),SITE+(v.hfs||"/homes-for-sale/"),SITE+EVAL,
       ...(v.schoolUrl?[SITE+v.schoolUrl]:[]),ROH,SITE+ABOUT],
     "primaryImageOfPage":{"@type":"ImageObject","url":v.ogImg||IMG},
     "breadcrumb":{"@id":id+"#breadcrumb"},"inLanguage":"en-US"},
    {"@type":"BreadcrumbList","@id":id+"#breadcrumb","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Home","item":SITE+"/"},
      {"@type":"ListItem","position":2,"name":"Market Reports","item":SITE+HUB},
      {"@type":"ListItem","position":3,"name":city}]},
    {"@type":"Place","@id":id+"#place","name":city+", Wisconsin",
     "address":{"@type":"PostalAddress","addressLocality":city,"addressRegion":"WI",
       ...(v.zip?{"postalCode":v.zip}:{}),"addressCountry":"US"},
     "geo":{"@type":"GeoCoordinates","latitude":v.lat,"longitude":v.lng},
     "containedInPlace":{"@type":"AdministrativeArea","name":"Dane County, Wisconsin",
       "containedInPlace":{"@type":"State","name":"Wisconsin"}}},
    {"@type":"Dataset","@id":id+"#marketsnapshot","name":city+" housing market snapshot, "+D.month,
     "description":"SCWMLS city-area data for "+city+", Wisconsin based on "+D.closings+" closings, snapshot "+D.snapshot+".",
     "datePublished":D.snapshot,"dateModified":D.snapshot,"creator":{"@id":SITE+"/#org"},
     "variableMeasured":[
       {"@type":"PropertyValue","name":"Median Sale Price","value":money(v.med)},
       {"@type":"PropertyValue","name":"Median Days on Market","value":String(v.dom)},
       {"@type":"PropertyValue","name":"Months of Supply","value":v.sup.toFixed(2)},
       {"@type":"PropertyValue","name":"Sales Count","value":String(v.sales)},
       {"@type":"PropertyValue","name":"Active Listings","value":String(v.active)},
       {"@type":"PropertyValue","name":"Total Volume","value":money(v.vol)}]}
  ];
  // No ItemList. The dated URLs are JS redirect stubs, not readable reports,
  // so presenting them to Google as a list of past reports would misrepresent them.
  nodes.push({"@type":"FAQPage","@id":id+"#faq","mainEntity":faqs.map(f=>({"@type":"Question","name":f[0],
    "acceptedAnswer":{"@type":"Answer","text":f[1]}}))});
  return {"@context":"https://schema.org","@graph":nodes};
}

// ---------- SVG ----------
function gauge(v, city) {
  const x = 40 + Math.min(v.sup,8)/8*620;
  return `<svg viewBox="0 0 700 120" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="g-t">
<title id="g-t">${esc(city)} housing supply gauge, ${D.month}</title>
<rect width="700" height="120" fill="transparent"></rect>
<rect x="40" y="45" width="620" height="22" rx="11" fill="#e2e8f0"></rect>
<rect x="40" y="45" width="310" height="22" rx="11" fill="#fecaca"></rect>
<rect x="350" y="45" width="155" height="22" fill="#fef9c3"></rect>
<rect x="505" y="45" width="155" height="22" fill="#bbf7d0"></rect>
<rect x="${(x-3).toFixed(0)}" y="38" width="6" height="36" rx="3" fill="#1e3a5f"></rect>
<text x="${x.toFixed(0)}" y="30" font-family="Inter,sans-serif" font-size="13" font-weight="700" fill="#1e3a5f" text-anchor="middle">${v.sup.toFixed(2)} mo.</text>
<text x="350" y="82" font-family="Inter,sans-serif" font-size="10" fill="#718096" text-anchor="middle">4 mo.</text>
<text x="505" y="82" font-family="Inter,sans-serif" font-size="10" fill="#718096" text-anchor="middle">6 mo.</text>
<text x="40" y="82" font-family="Inter,sans-serif" font-size="10" fill="#718096" text-anchor="middle">0</text>
<text x="660" y="82" font-family="Inter,sans-serif" font-size="10" fill="#718096" text-anchor="middle">8+</text>
<text x="350" y="108" font-family="Inter,sans-serif" font-size="13" font-weight="700" fill="#dc2626" text-anchor="middle">\u25cf ${esc(v.typePlain)}: ${v.sup.toFixed(2)} months of supply</text></svg>`;
}

function bars(v, city) {
  const rows = v.brackets, h = 28, top = 22, W = 80;
  const height = top + rows.length*h + 60;
  let s = `<svg viewBox="0 0 700 ${height}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="b-t">
<title id="b-t">Months of supply by price range, ${esc(city)}, ${D.month}</title>
<rect width="700" height="${height}" fill="transparent"></rect>`;
  rows.forEach(([label, sup], i) => {
    const y = top + i*h, hot = sup>0 && sup===v.tightSup && label===v.tight, none = sup===0;
    const w = Math.min(sup,6)*W;
    const color = none ? "#e5e7eb" : hot ? "#dc2626" : "#1e3a5f";
    const lc = none ? "#718096" : hot ? "#dc2626" : "#718096";
    s += `<text x="160" y="${y+14}" font-family="Inter,sans-serif" font-size="11" fill="${lc}" text-anchor="end"${hot?' font-weight="700"':""}>${esc(label)}${hot?" \ud83d\udd34":""}</text>`;
    s += `<rect x="165" y="${y}" width="${none?4:w.toFixed(0)}" height="20" rx="4" fill="${color}"></rect>`;
    s += `<text x="${165+(none?4:w)+6}" y="${y+14}" font-family="Inter,sans-serif" font-size="11" fill="${lc}"${hot?' font-weight="700"':""}>${none?"nothing available":sup.toFixed(2)+(hot?" \u2190 tightest":"")}</text>`;
  });
  const ay = top + rows.length*h + 8;
  s += `<line x1="165" y1="${ay}" x2="645" y2="${ay}" stroke="#e2e8f0" stroke-width="1"></line>`;
  for (let m=0;m<=6;m++) s += `<text x="${165+m*W}" y="${ay+12}" font-family="Inter,sans-serif" font-size="9" fill="#718096" text-anchor="middle">${m}</text>`;
  return s + "</svg>";
}

// The chart renders twice per page, so the title id has to be unique or the two
// aria-labelledby references collide and the second chart is unlabelled.
let yoySeq = 0;
// "vs. September 2026 last year" is nonsense. Name the actual prior period.
const priorPeriod = () => D.closings.replace(/(\d{4})\s*$/, (m, y) => String(Number(y) - 1));

function yoyChart(v, city) {
  const items = [["Median Price",v.medYoY],["Sales Count",v.salesYoY],["$/SqFt",v.sqftYoY]];
  const max = Math.max(0.2, ...items.map(i=>Math.abs(i[1])));
  const tid = "y-t-" + (++yoySeq);
  let s = `<svg viewBox="0 0 700 260" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="${tid}">
<title id="${tid}">${esc(city)} year over year comparison, ${D.month}</title>
<rect width="700" height="260" fill="transparent"></rect>
<line x1="60" y1="140" x2="680" y2="140" stroke="#1e3a5f" stroke-width="1.5" stroke-dasharray="4 3"></line>
<text x="16" y="20" font-family="Inter,sans-serif" font-size="11" fill="#718096">Change vs. ${esc(priorPeriod())}</text>`;
  items.forEach(([label,val],i)=>{
    const x = 140 + i*180, hgt = Math.abs(val)/max*95, up = val>=0;
    s += `<rect x="${x}" y="${up?140-hgt:140}" width="56" height="${Math.max(2,hgt).toFixed(0)}" rx="3" fill="${up?"#c9a227":"#dc2626"}"></rect>`;
    s += `<text x="${x+28}" y="${up?140-hgt-8:140+hgt+16}" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="${up?"#1e3a5f":"#dc2626"}" text-anchor="middle">${signed(val)}</text>`;
    s += `<text x="${x+28}" y="248" font-family="Inter,sans-serif" font-size="11" fill="#2d3748" text-anchor="middle">${label}</text>`;
  });
  return s + "</svg>";
}

// ---------- FAQ ----------
function faqs(city, v) {
  const band = x => x
    .replace(/^\$(\d+)K-\$(\d+)K$/, (m, a, c) => "$" + a + ",000 to $" + c + ",999")
    .replace("$1,000,000+", "$1,000,000 and above")
    .replace("Under $200K", "under $200,000");
  const priorSqft = Math.round(v.sqft/(1+v.sqftYoY));
  const loose = v.brackets.filter(x=>x[1]>=3).sort((a,c)=>c[1]-a[1])[0];
  const f = [
    ['What is the median home price in '+city+', WI?',
     'The median sale price in '+city+' was '+money(v.med)+' in '+D.closings+', '+(v.medYoY>=0?'up':'down')+' '+pct(Math.abs(v.medYoY))+' from the prior year. The year to date median is '+money(v.ytdMed)+', '+(v.ytdMedYoY>=0?'up':'down')+' '+pct(Math.abs(v.ytdMedYoY))+'.'],
    ['How long does it take to sell a house in '+city+'?',
     'The median days on market was '+v.dom+' days in '+D.closings+', compared with '+v.priorDom+' days a year earlier. The average was '+v.avgDom+' days.'],
    ["Is "+city+" a buyer's or seller's market?",
     city+' is a '+v.typePlain+' with '+v.sup.toFixed(2)+' months of supply. The tightest price range is '+band(v.tight)+' at '+v.tightSup.toFixed(2)+' months.'],
    ['How many homes are for sale in '+city+' right now?',
     'As of '+D.snapshot+' there are '+v.active+' active listings and '+v.pending+(v.pending===1?' home pending in ':' homes pending in ')+city+', against an average of '+v.salesMo+' sales per month.'],
    ['How many homes sold in '+city+' in '+D.closings+'?',
     v.sales+' homes sold in '+city+' in '+D.closings+', '+(v.salesYoY>=0?'up':'down')+' '+pct(Math.abs(v.salesYoY))+' from '+v.priorSales+' a year earlier. Total volume was '+money(v.vol)+'.'],
    ['Can buyers negotiate in '+city+'?',
     v.ask>=0
      ? 'Not easily. Buyers paid an average of '+pct(v.ask)+' over asking in '+D.closings+'. '+(v.tightSup<1?'In the tightest range, '+band(v.tight)+', expect to offer at or above list price.':'Even the tightest range, '+band(v.tight)+', sits at '+v.tightSup.toFixed(2)+' months, so there is room to negotiate terms rather than bid up the price.')
      : 'Somewhat. Buyers paid an average of '+pct(Math.abs(v.ask))+' under asking in '+D.closings+', which is more room than most of Dane County offered this month.'],
    ['Are home prices going up or down in '+city+'?',
     'The '+D.closings+' median is '+(v.medYoY>=0?'up':'down')+' '+pct(Math.abs(v.medYoY))+' year over year. Average price per square foot is $'+v.sqft+', '+(v.sqftYoY>=0?'up':'down')+' '+pct(Math.abs(v.sqftYoY))+' from $'+priorSqft+', which is the cleaner read on underlying value.'],
    ['What price range is most competitive in '+city+'?',
     'The '+band(v.tight)+' range at '+v.tightSup.toFixed(2)+' months of supply. Buyers there should be prepared to move quickly and offer cleanly.'],
    ['Where do buyers have the most room in '+city+'?',
     loose
      ? 'The '+band(loose[0])+' range carries '+loose[1].toFixed(2)+' months of supply, the loosest bracket in the city and the best place to ask for terms.'
      : 'No price range in '+city+' carries more than three months of supply this month, so there is no genuinely soft bracket to target.'],
    ['Should I wait for interest rates to drop before buying in '+city+'?',
     'Supply is '+v.sup.toFixed(2)+' months and the year to date median is '+money(v.ytdMed)+', '+(v.ytdMedYoY>=0?'up':'down')+' '+pct(Math.abs(v.ytdMedYoY))+'. Waiting means competing for the same thin inventory later. Buy when the payment works and refinance if rates improve.'],
    ['Is now a good time to sell in '+city+'?',
     'With '+v.sup.toFixed(2)+' months of supply, a '+v.dom+' day median time to contract, and a '+money(v.med)+' median sale price, sellers hold the stronger position. Price to recent comparables rather than aspirationally.'],
    ['What were new listings and pendings in '+city+'?',
     'New listings came in at '+v.newL+', '+(v.newLYoY>=0?'up':'down')+' '+pct(Math.abs(v.newLYoY))+', and new pendings at '+v.newP+', '+(v.newPYoY>=0?'up':'down')+' '+pct(Math.abs(v.newPYoY))+'. Those two together are the best early read on the months ahead.']
  ];
  if (v.empty) f.push(['Which price range has no homes for sale in '+city+'?',
    'There are currently no active listings in the '+band(v.empty)+' range. That is an absence of inventory rather than a competitive hot zone, and buyers at that price point will need to consider neighboring communities.']);
  if (v.base) f.push(['Are home prices going up in '+city+' long term?',
    'Yes. '+city+' has gone from a '+money(v.base)+' median in '+v.baseYr+' to '+money(v.ytdMed)+' year to date, an increase of '+pct(v.appr)+'.']);
  f.push(['How does '+city+' compare with the rest of Dane County?',
    'The Dane County median was '+money(D.county.med)+' in '+D.closings+' at '+D.county.sup.toFixed(2)+' months of supply. '+city+' sits at '+money(v.med)+' and '+v.sup.toFixed(2)+' months, so it is '+(v.med>D.county.med?'above':'below')+' the county median and '+(v.sup<D.county.sup?'tighter':'looser')+' on inventory.']);
  return f;
}

module.exports = { esc, money, pct, signed, days, cls, arrow, monthName, graph, gauge, bars, yoyChart, faqs, TITLES, SITE, HUB, EVAL, ABOUT, CONTACT, ROH, IMG, OUT, D, N };
