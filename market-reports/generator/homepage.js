// Home page schema, regenerated. Every URL verified 200 on 2026-09-01.
const fs = require("fs");
const S = "https://integrityhomeswi.com";
const CDN = "https://cdn.lofty.com/image/fs/341054835208155/website/20980/cmsbuild/";

// ---------- Script area (identity core). Must stay under 5,000 characters. ----------
const script = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "RealEstateAgent"],
      "@id": S + "/#org",
      "name": "John Reuter - Integrity Homes",
      "legalName": "Integrity Homes of Wisconsin",
      "alternateName": ["Integrity Homes", "IntegrityHomesWI"],
      "url": S + "/",
      "logo": CDN + "h200_20251213_d2364072487347e4-png.webp",
      "image": CDN + "20251213_d55b4c32cc4447e3.jpeg",
      "telephone": "+1-608-669-4226",
      "email": "john@integrityhomeswi.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "1025 Quinn Drive Ste 100",
        "addressLocality": "Waunakee",
        "addressRegion": "WI",
        "postalCode": "53597",
        "addressCountry": "US"
      },
      "geo": { "@type": "GeoCoordinates", "latitude": 43.19163, "longitude": -89.41845 },
      "areaServed": [
        { "@type": "GeoCircle",
          "geoMidpoint": { "@type": "GeoCoordinates", "latitude": 43.0731, "longitude": -89.4012 },
          "geoRadius": 40000 },
        { "@type": "AdministrativeArea", "name": "Dane County, Wisconsin" },
        { "@type": "City", "name": "Madison, Wisconsin" },
        { "@type": "City", "name": "Waunakee, Wisconsin" },
        { "@type": "City", "name": "Sun Prairie, Wisconsin" },
        { "@type": "City", "name": "Verona, Wisconsin" },
        { "@type": "City", "name": "Middleton, Wisconsin" },
        { "@type": "City", "name": "DeForest, Wisconsin" },
        { "@type": "City", "name": "Windsor, Wisconsin" }
      ],
      "knowsAbout": ["VA Home Loans", "Military Relocation", "Madison WI Real Estate",
                     "Dane County Housing Market", "First-Time Home Buyers",
                     "Home Seller Representation", "Hero Savings Programs"],
      "memberOf": [
        { "@type": "Organization", "name": "National Association of REALTORS®", "url": "https://www.nar.realtor/" },
        { "@type": "Organization", "name": "Wisconsin REALTORS® Association", "url": "https://www.wra.org/" },
        { "@type": "Organization", "name": "South Central Wisconsin MLS", "alternateName": "SCWMLS", "url": "https://www.scwmls.com/" }
      ],
      "founder": { "@id": S + "/#john" },
      "award": ["2024 RASCW Good Neighbor Award"],
      "sameAs": [
        "https://rewardourheroes.com",
        "https://theveteranrealtor.com",
        "https://www.facebook.com/johnreuter.integrityhomes",
        "https://www.linkedin.com/company/john-reuter-integrity-homes/",
        "https://www.youtube.com/@johnreuter-integrityhomes",
        "https://www.instagram.com/johnreuterintegrityhomes",
        "https://www.tiktok.com/@integrityhomeswi"
      ]
    },
    {
      "@type": "Person",
      "@id": S + "/#john",
      "name": "John Reuter",
      "jobTitle": "Broker/Owner",
      "description": "Broker/Owner of Integrity Homes in Dane County, Wisconsin, a retired United States Air Force veteran, and founder of the Reward Our Heroes Foundation. Ranked in the top 3% of SCWMLS agents and teams by closed sales volume.",
      "url": S + "/about",
      "image": CDN + "20251223_1fc6d6e4c5a3484f.jpeg",
      "telephone": "+1-608-669-4226",
      "email": "john@integrityhomeswi.com",
      "worksFor": { "@id": S + "/#org" },
      "alumniOf": { "@type": "Organization", "name": "United States Air Force" },
      "knowsAbout": ["VA Home Loans", "Military Relocation", "Madison WI Real Estate", "Dane County Housing Market"],
      "hasCredential": {
        "@type": "EducationalOccupationalCredential",
        "credentialCategory": "Real Estate Broker License",
        "identifier": "58480-90",
        "recognizedBy": { "@type": "GovernmentOrganization", "name": "Wisconsin Department of Safety and Professional Services" }
      },
      "award": ["2024 RASCW Good Neighbor Award",
                "FastExpert 2026 Top 15 Real Estate Agent, Windsor, WI",
                "FastExpert 2026 Top 15 Real Estate Agent, Waterloo, WI"],
      "subjectOf": [
        { "@type": "WebPage", "@id": S + "/media", "url": S + "/media", "name": "In the Media" },
        { "@type": "NewsArticle", "@id": "https://www.cnn.com/2025/02/17/economy/new-nar-rules-home-buying-update", "url": "https://www.cnn.com/2025/02/17/economy/new-nar-rules-home-buying-update", "name": "CNN Business, quoted on the NAR rule change and veteran buyers", "publisher": { "@type": "Organization", "name": "CNN Business" } }
      ],
      "sameAs": ["https://theveteranrealtor.com"]
    },
    {
      "@type": "WebSite",
      "@id": S + "/#website",
      "url": S + "/",
      "name": "Integrity Homes",
      "publisher": { "@id": S + "/#org" },
      "inLanguage": "en-US"
    },
    {
      "@type": "WebPage",
      "@id": S + "/#webpage",
      "url": S + "/",
      "name": "Local Real Estate. Real People. Real Results.",
      "description": "Serving Madison and Dane County with trusted guidance, strong negotiation, and a community-first approach to real estate.",
      "isPartOf": { "@id": S + "/#website" },
      "about": { "@id": S + "/#org" },
      "primaryImageOfPage": CDN + "h200_20251213_d2364072487347e4-png.webp",
      "inLanguage": "en-US"
    }
  ]
};

// ---------- Block B (mission section). No character limit, lives inline. ----------
const blockB = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["NGO", "Organization"],
      "@id": "https://rewardourheroes.com/#org",
      "name": "Reward Our Heroes",
      "alternateName": "Reward Our Heroes™",
      "url": "https://rewardourheroes.com",
      "description": "A 501(c)(3) nonprofit founded by John Reuter, supporting veterans, first responders, teachers, and healthcare workers in Wisconsin through real estate savings and community initiatives.",
      "nonprofitStatus": "Nonprofit501c3",
      "taxID": "39-3358820",
      "areaServed": { "@type": "State", "name": "Wisconsin" },
      "founder": { "@id": S + "/#john" },
      "sponsor": { "@id": S + "/#org" }
    },
    {
      "@type": ["PodcastSeries", "CreativeWork"],
      "@id": "https://theveteranrealtor.com/#org",
      "name": "The Veteran Realtor Podcast",
      "url": "https://theveteranrealtor.com",
      "author": { "@id": S + "/#john" },
      "producer": { "@id": S + "/#org" }
    }
  ]
};

// ---------- checks ----------
const min = JSON.stringify(script);
const wrapped = '<script type="application/ld+json">' + min + "</script>";
const bMin = JSON.stringify(blockB, null, 2);

let fail = 0;
const chk = (ok, msg) => { if (!ok) { console.log("  FAIL " + msg); fail++; } };

chk(wrapped.length <= 5000, `Script block is ${wrapped.length} chars, over the 5,000 limit`);
chk(!/—/.test(min + bMin), "em dash present");
chk(!/–/.test(min + bMin), "en dash present");
chk(!/in-the-media/.test(min), "still references the dead /in-the-media/");
chk(!/subOrganization/.test(min), "still claims the charity as a subOrganization");
chk(!/honorificPrefix/.test(min), "honorificPrefix still present");
chk(!/linkedin\.com\/company/.test(JSON.stringify(script["@graph"][1])), "company LinkedIn still on the Person");
chk(/Integrity Homes of Wisconsin/.test(min), "legalName missing");
chk(!/Integrity Homes Wisconsin/.test(min), "wrong brand name form present");
chk(!/top 1%|top 5%|#1 (agent|realtor|team)|U.S. Realtor|nationally ranked|top d+% (in the )?(U.S.|nation|country)/i.test(min), "inflated or national ranking claim");
chk(/top 3% of SCWMLS/.test(min), "confirmed top 3% SCWMLS ranking missing");
chk(/Windsor/.test(min), "Windsor missing from areaServed");

// every @id reference resolves inside its own block
for (const [label, g] of [["Script", script], ["Block B", blockB]]) {
  const defined = new Set(g["@graph"].map(n => n["@id"]));
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
  if (label === "Script") chk(dangling.length === 0, `${label} has dangling refs: ${dangling.join(", ")}`);
  else console.log(`  note: ${label} references ${[...new Set(dangling)].join(", ")} from the Script block, which is correct (same page, merged by @id)`);
}

console.log(`\nScript block: ${wrapped.length} chars with tags (${5000 - wrapped.length} to spare)`);
console.log(`Block B:      ${('<script type="application/ld+json">' + bMin + "</script>").length} chars`);
console.log(fail ? `\n${fail} PROBLEM(S)` : "\nBOTH BLOCKS OK");

fs.writeFileSync("out-script.txt", wrapped, "utf8");
fs.writeFileSync("out-blockb.txt", '<script type="application/ld+json">\n' + bMin + "\n</script>", "utf8");
process.exit(fail ? 1 : 0);
