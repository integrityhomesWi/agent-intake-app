// Transcribed from the six pasted pages.
const hub = { snapshot:"June 2026 (May closings)", rows:{
  Verona:{med:"$472,200", yoy:"+5.2%",  sup:"1.18"},
  Madison:{med:"$447,500", yoy:"+1.7%", sup:"1.38"},
  "Sun Prairie":{med:"$449,000", yoy:"-1.3%", sup:"1.54"},
  DeForest:{med:"$550,000", yoy:"+4.8%", sup:"2.12"},
  Waunakee:{med:"$590,000", yoy:"flat",  sup:"2.21"},
  Middleton:{med:"$735,000", yoy:"+26.3%", sup:"2.67"},
}};
const pages = {
  Verona:{snapshot:"Aug 2026 (June)",  med:"$499,900", yoy:"+1.0%",  sup:"1.65"},
  Madison:{snapshot:"Sept 2026 (Aug)", med:"$440,000", yoy:"+8.6%",  sup:"1.96"},
  "Sun Prairie":{snapshot:"Aug 2026 (July)", med:"$504,900", yoy:"+16.1%", sup:"1.98"},
  DeForest:{snapshot:"Aug 2026 (July)", med:"$455,000", yoy:"-1.1%", sup:"1.90"},
  Waunakee:{snapshot:"Aug 2026 (July)", med:"$629,000", yoy:"-6.5%", sup:"2.29"},
  Middleton:{snapshot:"Aug 2026 (June)", med:"$609,900", yoy:"+2.2%", sup:"2.93"},
};
console.log("HUB says (June/May)          vs   CITY PAGE says");
console.log("=".repeat(84));
let bad=0;
for (const [city,h] of Object.entries(hub.rows)) {
  const p = pages[city];
  const diffs=[];
  if (h.med!==p.med) diffs.push("median");
  if (h.yoy!==p.yoy) diffs.push("YoY");
  if (h.sup!==p.sup) diffs.push("supply");
  if (diffs.length) bad++;
  console.log(city.padEnd(13),
    (h.med+" / "+h.yoy+" / "+h.sup+" mo").padEnd(30), "|",
    (p.med+" / "+p.yoy+" / "+p.sup+" mo").padEnd(30),
    diffs.length? "MISMATCH: "+diffs.join(", ") : "match");
}
console.log("\n"+bad+" of 6 city rows on the hub disagree with that city's own page.");
