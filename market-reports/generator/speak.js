const d = require("./data.js");
const rows = Object.entries(d.cities).concat([["Dane County", d.county]]);
for (const [city, v] of rows) {
  const s = `${d.month} snapshot: ${city}'s median sale price is $${v.med.toLocaleString()}, homes sell in about ${v.dom} days, and inventory is ${v.sup.toFixed(2)} months (${v.typePlain}).`;
  console.log(JSON.stringify(s));
}
