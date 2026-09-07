// Long-Term Baseline Median is EMPTY in Airtable for all 7. These are the values
// currently published on the live pages, transcribed for comparison.
const live = {
  Madison:      {baseline: 260000, year: 2018},
  Waunakee:     {baseline: 265005, year: 2018},
  "Sun Prairie":{baseline: 265005, year: 2018},
  Verona:       {baseline: 340000, year: 2018},
  Middleton:    {baseline: 400000, year: 2018},
  DeForest:     {baseline: 276619, year: 2018},
};
const seen = {};
for (const [city, v] of Object.entries(live)) {
  (seen[v.baseline] ||= []).push(city);
}
console.log("Live-page 2018 baseline medians:\n");
for (const [city, v] of Object.entries(live)) console.log("  " + city.padEnd(13), "$" + v.baseline.toLocaleString());
console.log("\nCollisions:");
let found = false;
for (const [val, cities] of Object.entries(seen)) {
  if (cities.length > 1) { found = true; console.log("  $" + Number(val).toLocaleString(), "claimed by:", cities.join(" AND ")); }
}
if (!found) console.log("  none");
