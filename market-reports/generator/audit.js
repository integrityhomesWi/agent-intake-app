// Transcribed from the pasted pages: which identity @ids each page DEFINES vs REFERENCES.
const pages = {
  "Madison (fixed)":  {defines:["#org","#john","#website"], refs:["#john","#org","#org","#website"], data:"Sept 2026 / Aug closings"},
  "Dane County hub":  {defines:[],                          refs:["#johnreuter*","#organization*","#website"], data:"June 2026 / May closings"},
  "Waunakee":         {defines:[],                          refs:["#johnreuter","#organization","#website","#organization"], data:"Aug 2026 / July closings"},
  "Verona":           {defines:[],                          refs:["#johnreuter","#organization","#website","#organization"], data:"Aug 2026 / June closings"},
  "Sun Prairie":      {defines:[],                          refs:["#johnreuter","#organization","#website","#organization"], data:"Aug 2026 / July closings"},
  "Middleton":        {defines:[],                          refs:["#johnreuter","#organization","#website","#organization"], data:"Aug 2026 / June closings"},
};
console.log("page              data snapshot              defines  dangling refs");
console.log("-".repeat(78));
for (const [name,p] of Object.entries(pages)) {
  const d = new Set(p.defines);
  const dangling = p.refs.filter(r => !d.has(r.replace("*","")));
  console.log(
    name.padEnd(18),
    p.data.padEnd(26),
    String(p.defines.length).padEnd(8),
    dangling.length ? dangling.length + "  (" + [...new Set(dangling)].join(", ") + ")" : "none"
  );
}
console.log("\n* Dane County inlines @type+name on author/publisher, so those two degrade gracefully.");
console.log("  Its @ids still do not match the homepage, so it builds a SEPARATE entity.");
