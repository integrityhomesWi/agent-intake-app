const fs=require("fs");
const F="C:/Users/admin/Downloads/madisonmarketreportseptember2026.html";
let s=fs.readFileSync(F,"utf8");
const edits=[
 // --- 1. the 53714 factual error, both phrasings ---
 ["Zip 53714 traded slightly lower at $395,000 on a smaller sample",
  "Zip 53714 came in just above it at $395,000 on a smaller sample", 2],
 ["zip 53714 traded even lower at a $395,000 median on a smaller sample",
  "zip 53714 came in just above it at a $395,000 median on a smaller sample", 1],
 // --- 2. option 1 title + meta ---
 ["<title>Madison, Wisconsin Housing Market Report: September 2026 | Integrity Homes</title>",
  "<title>Is Madison a Buyer's or Seller's Market Right Now?</title>", 1],
 ["Madison, WI housing market report for September 2026: median sale price $440,000 (+8.6%), 203 sales (-13.6%), 1.96 months of supply. Updated September 1, 2026 from SCWMLS city-area data.",
  "See where Madison home prices, days on market, and inventory supply stand right now, plus how each zip code and price range differs. Updated monthly.", 1],
];
for(const [a,b,n] of edits){
  const hits=s.split(a).length-1;
  if(hits!==n) throw new Error(`expected ${n} hit(s), found ${hits}: "${a.slice(0,60)}..."`);
  s=s.split(a).join(b);
  console.log(`ok  ${hits}x  ${a.slice(0,58)}...`);
}
fs.writeFileSync(F,s,"utf8");
console.log("\nem dashes:",(s.match(/\u2014/g)||[]).length);
console.log("'traded slightly lower'/'traded even lower' left:",(s.match(/traded (slightly|even) lower/g)||[]).length);
