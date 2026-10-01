// Sanity pass over data.js before any HTML is written.
const D = require("./data.js");
const LADDER = s => s < 2 ? "Extreme Seller's Market"
  : s < 4 ? "Strong Seller's Market"
  : s < 5 ? "Seller's Market"
  : s < 6 ? "Leaning Toward Buyer's Market" : "Buyer's Market";

let bad = 0;
const fail = (m) => { console.log("  FAIL " + m); bad++; };

console.log("month: " + D.month + " | closings: " + D.closings + " | snapshot: " + D.snapshot);
console.log("label: " + D.label);
console.log("");

const rows = Object.entries(D.cities).concat([["Dane County", D.county]]);
for (const [c, v] of rows) {
  const domOk = (v.dom - v.priorDom) === v.domYoY;
  const tierOk = LADDER(v.sup) === v.typePlain;
  const hot = v.brackets.filter(b => b[1] > 0 && b[1] < 1).map(b => b[0]);
  const emptyB = v.brackets.filter(b => b[1] === 0).map(b => b[0]);
  const tightRow = v.brackets.find(b => b[0] === v.tight);
  const tightOk = tightRow && Math.abs(tightRow[1] - v.tightSup) < 0.005;
  // lowest non-zero bracket should be the declared tightest
  const lowest = v.brackets.filter(b => b[1] > 0).sort((a, b) => a[1] - b[1])[0];
  const lowestOk = lowest && lowest[0] === v.tight;
  const medYoYCalc = (v.med - v.priorMed) / v.priorMed;
  const medOk = Math.abs(medYoYCalc - v.medYoY) < 0.004;
  const salesYoYCalc = (v.sales - v.priorSales) / v.priorSales;
  const salesOk = Math.abs(salesYoYCalc - v.salesYoY) < 0.004;
  const apprOk = v.base == null || Math.abs((v.ytdMed - v.base) / v.base - v.appr) < 0.01;

  if (!domOk) fail(c + ": dom " + v.dom + " - prior " + v.priorDom + " != domYoY " + v.domYoY);
  if (!tierOk) fail(c + ": supply " + v.sup + " should be " + LADDER(v.sup) + ", data says " + v.typePlain);
  if (!tightOk) fail(c + ": tight " + v.tight + "/" + v.tightSup + " not found in brackets");
  if (!lowestOk) fail(c + ": lowest non-zero bracket is " + (lowest && lowest[0]) + " at " + (lowest && lowest[1]) + ", but tight says " + v.tight);
  if (!medOk) fail(c + ": medYoY " + v.medYoY + " vs computed " + medYoYCalc.toFixed(4));
  if (!salesOk) fail(c + ": salesYoY " + v.salesYoY + " vs computed " + salesYoYCalc.toFixed(4));
  if (!apprOk) fail(c + ": appr " + v.appr + " vs computed " + ((v.ytdMed - v.base) / v.base).toFixed(4));

  console.log(
    c.padEnd(13) +
    "sup " + String(v.sup).padEnd(5) +
    v.typePlain.padEnd(24) +
    "zips " + String((v.zips || []).length).padEnd(3) +
    "| hot: " + (hot.join(", ") || "none").padEnd(26) +
    "| empty: " + (emptyB.join(", ") || "none")
  );
}
console.log("");
console.log(bad ? bad + " PROBLEM(S)" : "DATA CONSISTENT");
process.exit(bad ? 1 : 0);
