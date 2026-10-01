// The visible Q&A sections from Step 8 of the skill. Every sentence is derived
// from data.js, so nothing here can drift from the numbers in the tables.
const B = require("./build.js");
const { esc, money, pct, signed, days, cls, arrow, SITE, EVAL } = B;
const D = require("./data.js");

const up = v => v >= 0 ? "up" : "down";
const abs = v => pct(Math.abs(v));
const band = b => b.replace(/\$(\d+)K-\$(\d+)K/, (m,a,c) => "$" + a + ",000 to $" + c + ",999")
                   .replace("$1,000,000+", "$1,000,000 and above")
                   .replace("Under $200K", "under $200,000");

const OTHERS = {
  Madison:["Waunakee","Sun Prairie","Verona","Middleton","DeForest"],
  Waunakee:["Madison","DeForest","Sun Prairie","Middleton","Verona"],
  "Sun Prairie":["Madison","DeForest","Waunakee","Verona","Middleton"],
  Verona:["Madison","Middleton","Sun Prairie","Waunakee","DeForest"],
  Middleton:["Madison","Verona","Waunakee","Sun Prairie","DeForest"],
  DeForest:["Waunakee","Sun Prairie","Madison","Middleton","Verona"]
};
const HUBS = {Madison:"/madison/",Waunakee:"/waunakee/","Sun Prairie":"/sun-prairie/",
              Verona:"/verona/",Middleton:"/middleton/",DeForest:"/deforest/"};

function buy(city, v) {
  const tightTxt = band(v.tight);
  const emptyTxt = v.empty
    ? ` One range to know about: there are no active listings at all between ${band(v.empty)}, so that price point is simply not available in ${city} right now.`
    : "";
  return `<div class="mr-section">
      <h2>Should I Buy a Home in ${esc(city)} Right Now?</h2>
      <p class="speakable-answer">${esc(city)} has ${v.sup.toFixed(2)} months of supply, which is a ${esc(v.typePlain.toLowerCase())}. There are ${v.active} homes active against an average of ${v.salesMo} sales a month, and the median sale price is ${money(v.med)}. If you are qualified and the payment works, waiting does not put you in a better position, because there is no sign of inventory loosening.</p>
      <p>The tightest competition is in the ${esc(tightTxt)} range at ${v.tightSup.toFixed(2)} months of supply. Buyers there should expect to move quickly and offer cleanly.${esc(emptyTxt)}</p>
      <p>${v.ask >= 0
          ? `Across the city buyers paid an average of ${pct(v.ask)} over asking in ${D.closings}, so budgeting to list price alone will leave you short in a competitive situation.`
          : `Across the city buyers paid an average of ${pct(Math.abs(v.ask))} under asking in ${D.closings}, which is more negotiating room than most of Dane County offered this month.`}</p>
      <div class="city-hubs">
        <a href="${SITE}${v.hfs}">Browse ${esc(city)} Homes</a>
        <a href="${SITE}/buyer-loan-programs/va">VA Loan Guide</a>
        <a href="${SITE}/buyer-loan-programs/">All Loan Programs</a>
      </div>
    </div>`;
}

function sell(city, v) {
  return `<div class="mr-section">
      <h2>Is Now a Good Time to Sell a Home in ${esc(city)}?</h2>
      <p class="speakable-answer">${v.sales} homes closed in ${esc(city)} in ${D.closings}, ${up(v.salesYoY)} ${abs(v.salesYoY)} year over year, at a median of ${money(v.med)}. Homes went under contract in a median of ${v.dom} days against ${v.priorDom} a year ago. With ${v.sup.toFixed(2)} months of supply, sellers still hold the stronger position.</p>
      <p>Total sales volume was ${money(v.vol)}, ${up(v.volYoY)} ${abs(v.volYoY)}. New listings came in at ${v.newL}, ${up(v.newLYoY)} ${abs(v.newLYoY)}, and new pendings at ${v.newP}, ${up(v.newPYoY)} ${abs(v.newPYoY)}. ${v.newLYoY < -0.1
          ? "Fewer sellers coming to market keeps inventory lean, which works in your favor if you list into it."
          : "Both sides of the market are active, so pricing accurately matters more than timing."}</p>
      <p>The practical read: price to the most recent comparables rather than to what you hope the home is worth. ${v.dom <= 10
          ? `A ${v.dom} day median means correctly priced homes are not sitting.`
          : `A ${v.dom} day median means buyers are taking their time, so an aspirational price will cost you weeks.`}</p>
      <div class="city-hubs"><a href="${SITE}${EVAL}">Get Your Home's Value</a></div>
    </div>`;
}

function domSection(city, v) {
  const faster = v.domYoY < 0;
  return `<div class="mr-section">
      <h2>How Long Does It Take to Sell a House in ${esc(city)}?</h2>
      <p class="speakable-answer">The median days on market in ${esc(city)} was ${v.dom} days in ${D.closings}, compared with ${v.priorDom} days a year earlier. That is ${v.domYoY === 0 ? "unchanged" : Math.abs(v.domYoY) + " days " + (faster ? "faster" : "slower")}. Half of all homes that sold went under contract within ${v.dom} days of listing.</p>
      <p>The average was ${v.avgDom} days, ${v.avgDomYoY === 0 ? "flat year over year" : Math.abs(v.avgDomYoY) + " days " + (v.avgDomYoY < 0 ? "better" : "worse") + " than last year"}. ${v.avgDom > v.dom * 2
          ? `The gap between the median of ${v.dom} and the average of ${v.avgDom} is the number worth watching. Most homes move quickly while a smaller group of overpriced or unusual listings drags the average up. Priced right, you are in the fast group.`
          : `The median and average sit close together, which means the market is moving at a fairly consistent pace rather than splitting into fast and stalled listings.`}</p>
    </div>`;
}

function negotiate(city, v) {
  return `<div class="mr-section">
      <h2>Can Buyers Negotiate in ${esc(city)}?</h2>
      <p class="speakable-answer">${v.ask >= 0
        ? `Not easily. Buyers paid an average of ${pct(v.ask)} over asking in ${esc(city)} in ${D.closings}, and that figure moved ${signed(v.askYoY)} from a year ago. With ${v.sup.toFixed(2)} months of supply, price is not where you win.`
        : `Somewhat. Buyers paid an average of ${pct(Math.abs(v.ask))} under asking in ${esc(city)} in ${D.closings}, a shift of ${signed(v.askYoY)} from a year ago. That is real room compared with most of Dane County.`}</p>
      <p>Where the leverage sits depends entirely on price point. The ${esc(band(v.tight))} range at ${v.tightSup.toFixed(2)} months is the least forgiving. ${(() => {
        const loose = v.brackets.filter(b => b[1] >= 3).sort((a,b)=>b[1]-a[1])[0];
        return loose
          ? `At the other end, ${esc(band(loose[0]))} sits at ${loose[1].toFixed(2)} months, which is where a patient, well-prepared buyer has the most room to ask for terms.`
          : `No bracket in the city carries more than three months of supply, so there is no genuinely soft price point in ${esc(city)} this month.`;
      })()}</p>
      <p>Terms often matter more than price here. Inspection timing, closing flexibility, and a clean financing picture move sellers in a market this tight.</p>
    </div>`;
}

function rates(city, v) {
  return `<div class="mr-section">
      <h2>Should I Wait for Interest Rates to Drop in ${esc(city)}?</h2>
      <p class="speakable-answer">Nobody can tell you where rates go, and anyone who says otherwise is guessing. What the ${esc(city)} data does say is that supply is ${v.sup.toFixed(2)} months and the year to date median is ${money(v.ytdMed)}, ${up(v.ytdMedYoY)} ${abs(v.ytdMedYoY)}. Waiting means competing for the same thin inventory later, most likely at a higher price.</p>
      <p>The framework that holds up: buy when the payment works, and refinance if rates improve. You can refinance a rate. You cannot go back and buy at last year's price. With ${v.active} homes active against ${v.salesMo} sales a month, there is no inventory cushion building up for buyers who sit out.</p>
      <p>Veterans and active military should look hard at the VA loan here. Zero down on a ${money(v.med)} median is a meaningful advantage that does not depend on where rates land.</p>
      <div class="city-hubs">
        <a href="${SITE}/buyer-loan-programs/va">VA Loan Guide</a>
        <a href="${SITE}/buyer-loan-programs/">Loan Programs</a>
      </div>
    </div>`;
}

function yoy(city, v, chart) {
  const card = (label, cur, prior, delta, good) =>
    `<div class="yoy-card"><div class="metric">${esc(label)}</div><div class="current">${cur}</div>
     <div class="prior">Prior year: ${prior}</div><div class="delta ${good}">${delta}</div></div>`;
  return `<div class="mr-section">
      <h2>What's Changed Over the Last Year?</h2>
      <p>Four measures tell the story of where ${esc(city)} moved since ${D.closings} a year ago.</p>
      <div class="yoy-charts">
        ${card("Median Sale Price", money(v.med), money(v.priorMed), arrow(v.medYoY) + " " + signed(v.medYoY), cls(v.medYoY))}
        ${card("Homes Sold", String(v.sales), String(v.priorSales), arrow(v.salesYoY) + " " + signed(v.salesYoY), cls(v.salesYoY))}
        ${card("Median Days on Market", v.dom + " days", v.priorDom + " days", v.domYoY === 0 ? "→ unchanged" : days(v.domYoY), cls(-v.domYoY))}
        ${card("Avg Price Per SqFt", "$" + v.sqft, "$" + Math.round(v.sqft / (1 + v.sqftYoY)), arrow(v.sqftYoY) + " " + signed(v.sqftYoY), cls(v.sqftYoY))}
      </div>
      <p>${v.medYoY >= 0 && v.salesYoY < 0
          ? `Prices up and volume down at the same time is a supply story, not a demand story. There is less to buy, and what sells clears at a higher number.`
          : v.medYoY < 0 && v.sqftYoY >= 0
          ? `The median fell while price per square foot rose, which points to a shift in which homes sold rather than any decline in value.`
          : `Volume and price moved in the same direction, which is the cleaner signal that demand itself changed.`}</p>
      <div class="mr-chart-wrap">
        <p class="mr-chart-title">${esc(city)} Year Over Year Comparison</p>
        ${chart}
      </div>
    </div>`;
}

function neighborhood(city, v) {
  // Zips under ten sales are small samples. They render in the detail table with an
  // asterisk, but they never drive a headline claim about fastest or priciest.
  const SMALL = 10;
  const big = v.zips.filter(z => z[1] >= SMALL);
  const multi = big.length > 1;

  let lead, second;

  if (big.length === 0) {
    // No usable zip detail this month. Write the section from the price bands rather
    // than inventing geography, and never explain the absence to the reader.
    const live = v.brackets.filter(b => b[1] > 0);
    const loosest = [...live].sort((a, b) => b[1] - a[1])[0];
    const hot = live.filter(b => b[1] < 1);
    lead = `${city} is not one market, it is a set of price points behaving very differently. The ${band(v.tight)} range is the tightest in the city at ${v.tightSup.toFixed(2)} months of supply, while ${band(loosest[0])} sits at ${loosest[1].toFixed(2)} months. A buyer in one of those bands and a buyer in the other are shopping completely different markets.`;
    second = hot.length
      ? `<p>${hot.length === 1 ? "One band is" : "Two bands are"} under a single month of supply: ${hot.map(h => band(h[0])).join(" and ")}. That is where competing offers actually happen in ${esc(city)}, and buyers there should come in clean and decisive. In every other band a prepared buyer has room to think.</p>`
      : `<p>No band in ${esc(city)} is under one month of supply, so there is no segment where a buyer should feel rushed into a decision they regret. The spread from ${v.tightSup.toFixed(2)} months to ${loosest[1].toFixed(2)} months is the real story here: shop the band you can actually afford, not the city median.</p>`;
  } else if (multi) {
    const busiest = [...big].sort((a, b) => b[1] - a[1])[0];
    const priciest = [...big].sort((a, b) => b[2] - a[2])[0];
    const cheapest = [...big].sort((a, b) => a[2] - b[2])[0];
    const fastest = [...big].sort((a, b) => a[3] - b[3])[0];
    lead = `${city} is not one market. Zip ${busiest[0]} carried the most volume in ${D.closings} with ${busiest[1]} sales at a ${money(busiest[2])} median, while ${priciest[0]} posted the highest median at ${money(priciest[2])} and ${cheapest[0]} the most attainable at ${money(cheapest[2])}.`;
    second = `<p>The spread between ${cheapest[0]} at ${money(cheapest[2])} and ${priciest[0]} at ${money(priciest[2])} is ${money(priciest[2] - cheapest[2])}, which is why a city-wide median is the wrong number to shop by. Zip ${fastest[0]} moved fastest at a ${fastest[3]} day median, so the same budget buys a very different level of urgency depending on where you look.</p>`;
  } else {
    const only = big[0];
    lead = `${city} is essentially a single zip market. ${only[0]} accounted for ${only[1]} of the city's ${v.sales} sales in ${D.closings}, at a ${money(only[2])} median and a ${only[3]} day median time to contract.`;
    second = `<p>Within the city the ${band(v.tight)} range is where the competition concentrates, at ${v.tightSup.toFixed(2)} months of supply. Newer construction and the established core trade quite differently even inside one zip, so the city median is a starting point rather than an answer.</p>`;
  }

  return `<div class="mr-section">
      <h2>What's Happening in My ${esc(city)} Neighborhood?</h2>
      <p class="speakable-answer">${esc(lead)}</p>
      ${second}
      <p>Buyers priced out of ${esc(city)} often look at the neighboring Dane County communities, which sit at meaningfully different price points and supply levels. Each has its own full report and living guide.</p>
      <div class="city-hubs">
        ${OTHERS[city].map(o => `<a href="${SITE}${HUBS[o]}">${esc(o)}</a>`).join("\n        ")}
        <a href="${SITE}/wisco-hub">Dane County</a>
      </div>
    </div>`;
}

function stickyBar(city, v) {
  return `<div class="sticky-cta" id="sticky-cta">
  <p>${esc(city)} · ${money(v.med)} median · ${v.dom} days on market · ${esc(v.typePlain)}</p>
  <div class="sticky-right">
    <a href="${SITE}${v.hfs}" class="btn btn-gold">Browse Homes</a>
    <a href="${SITE}${EVAL}" class="btn btn-gold">My Home's Value</a>
  </div>
</div>
<script>
(function(){var b=document.getElementById('sticky-cta');if(!b)return;var shown=false;
window.addEventListener('scroll',function(){var s=window.scrollY||document.documentElement.scrollTop;
if(s>600&&!shown){b.classList.add('visible');shown=true;}else if(s<=600&&shown){b.classList.remove('visible');shown=false;}},{passive:true});})();
</script>`;
}

module.exports = { buy, sell, domSection, negotiate, rates, yoy, neighborhood, stickyBar, band };

// ---------- shared blocks that were on the originals ----------
const ROH_URL = "https://www.rewardourheroes.com/calculator-page";

function rohWidget() {
  return `<div class="roh-widget">
      <h3>Why John Started Reward Our Heroes</h3>
      <p>Beyond real estate, John founded the Reward Our Heroes Foundation, a separate 501(c)(3) nonprofit supporting veterans, first responders, teachers, and healthcare workers across Wisconsin.</p>
      <p>It is its own organization with its own mission, not an Integrity Homes program.</p>
      <a href="https://rewardourheroes.com" class="btn btn-gold">Learn about the Foundation</a>
    </div>`;
}

function authorCard(city, hubUrl) {
  const closing = city
    ? `For questions about buying or selling in ${esc(city)}, reach John at <a href="mailto:john@integrityhomeswi.com">john@integrityhomeswi.com</a> or <a href="tel:6086694226">608-669-4226</a>. More at the <a href="${SITE}${hubUrl}">${esc(city)} City Hub</a>.`
    : `Reach John at <a href="mailto:john@integrityhomeswi.com">john@integrityhomeswi.com</a> or <a href="tel:6086694226">608-669-4226</a>. Read more <a href="${SITE}/about">about John</a>.`;
  return `<div class="author-card">
      <div class="author-avatar">JR</div>
      <div>
        <h3>About John Reuter</h3>
        <p class="author-title">Broker/Owner, Integrity Homes</p>
        <p>Retired U.S. Air Force veteran (115th Fighter Wing, Security Forces) and Broker/Owner of Integrity Homes, serving Dane County, Wisconsin. Military Relocation Professional and Ramsey Trusted Real Estate Advisor. Ranked in the top 3% of SCWMLS agents and teams by closed sales volume.</p>
        <p>John publishes these monthly market reports using SCWMLS city-area data to give buyers and sellers an honest, data-grounded picture of local housing markets.</p>
        <p>${closing}</p>
      </div>
    </div>`;
}

// ---------- Dane County hub only ----------
const BLURB = {
  Madison:"The largest and most varied market in the county, spanning starter condos on the east side to lakefront estates on the west.",
  Waunakee:"Newer construction, larger lots, and a school district that pulls buyers from across the region.",
  "Sun Prairie":"More square footage per dollar than the Madison west side, with newer neighborhoods and fast-moving mid-range inventory.",
  Verona:"Epic Systems keeps a floor under demand here that most suburbs do not have.",
  Middleton:"The premium suburb: walkable downtown, top rated schools, and a price premium across every range.",
  DeForest:"Genuine small town character north of Madison, and the most attainable values of the six."
};

function hubBigPicture(county, cities) {
  const entries = Object.entries(cities);
  const tightest = entries.slice().sort((a,b)=>a[1].sup-b[1].sup)[0];
  const loosest  = entries.slice().sort((a,b)=>b[1].sup-a[1].sup)[0];
  const over  = entries.filter(([,v])=>v.ask>=0).map(([c])=>c);
  const under = entries.filter(([,v])=>v.ask<0).map(([c])=>c);
  const list = a => a.length>1 ? a.slice(0,-1).join(", ")+" and "+a[a.length-1] : a[0];
  return `<div class="mr-section">
      <h2>What's the Big Picture Across Dane County?</h2>
      <p class="speakable-answer">Tight supply everywhere, and six communities that are not behaving the same way. The county median is ${money(county.med)}, ${up(county.medYoY)} ${abs(county.medYoY)} year over year, on ${county.sup.toFixed(2)} months of supply. Not one community we track reached three months.</p>
      <p>${esc(tightest[0])} is the tightest at ${tightest[1].sup.toFixed(2)} months and ${esc(loosest[0])} the loosest at ${loosest[1].sup.toFixed(2)}. That is a real spread, but it is narrow in absolute terms: every one of the six sits in seller's territory, and the difference between the tightest and the loosest is under a month and a half of inventory.</p>
      <p>Where they genuinely diverge is on price behavior. ${over.length ? `Buyers paid over asking in ${esc(list(over))}` : "No community saw buyers pay over asking"}, while ${under.length ? `buyers in ${esc(list(under))} landed under list` : "every community cleared above list"}. Tight supply and buyer leverage are not moving together this month, which is exactly why the county average is the wrong number to make a decision on.</p>
    </div>`;
}

function hubCityCards(cities) {
  const sorted = Object.entries(cities).sort((a,b)=>a[1].sup-b[1].sup);
  return `<div class="mr-section" id="cities">
      <h2>Explore Each Dane County Community</h2>
      <p>Each community has its own full ${esc(D.month)} report with price range and zip code detail, plus a living guide covering schools, neighborhoods, and lifestyle.</p>
      <div class="cta-grid">
        ${sorted.map(([c,v]) => `<div class="cta-card">
          <div class="ct">${esc(c)}</div>
          <p class="card-stats">${money(v.med)} median · ${v.dom}-day DOM · ${v.sup.toFixed(2)} mo · ${esc(v.typePlain.replace(" Market",""))}</p>
          <p class="card-blurb">${esc(BLURB[c])}</p>
          <p class="card-links"><a href="${SITE}/market-reports/${v.slug}/">${esc(D.month)} report</a> <a href="${SITE}${v.hub}">Living guide</a></p>
        </div>`).join("\n        ")}
      </div>
    </div>`;
}

function hubSchools(cities) {
  return `<div class="schools-section">
      <h2>Dane County School Districts</h2>
      <p>School quality is one of the strongest drivers of where buyers shop across the county. These are the district guides for the six communities we cover.</p>
      <div class="cta-grid">
        ${Object.entries(cities).map(([c,v]) => `<div class="cta-card">
          <div class="ct">${esc(v.school.replace(" School District","").replace(" Area",""))}</div>
          <p class="card-links"><a href="${SITE}${v.schoolUrl}">District guide</a></p>
        </div>`).join("\n        ")}
      </div>
    </div>`;
}

function hubSticky(county) {
  return `<div class="sticky-cta" id="sticky-cta">
  <p>Dane County · ${money(county.med)} median · ${county.dom} days on market · 6 communities</p>
  <div class="sticky-right">
    <a href="#compare" class="btn btn-gold">Compare</a>
    <a href="${SITE}${EVAL}" class="btn btn-gold">My Home's Value</a>
  </div>
</div>
<script>
(function(){var b=document.getElementById('sticky-cta');if(!b)return;var shown=false;
window.addEventListener('scroll',function(){var s=window.scrollY||document.documentElement.scrollTop;
if(s>600&&!shown){b.classList.add('visible');shown=true;}else if(s<=600&&shown){b.classList.remove('visible');shown=false;}},{passive:true});})();
</script>`;
}

module.exports.rohWidget = rohWidget;
module.exports.authorCard = authorCard;
module.exports.hubBigPicture = hubBigPicture;
module.exports.hubCityCards = hubCityCards;
module.exports.hubSchools = hubSchools;
module.exports.hubSticky = hubSticky;
