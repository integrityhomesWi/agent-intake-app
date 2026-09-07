const fs=require("fs");
const FILES=[
"C:/Users/admin/AppData/Roaming/Claude/local-agent-mode-sessions/skills-plugin/7e5416d3-5312-4f73-921e-4033aefec49c/92682d12-8402-46b0-b182-f8b8d59edfe5/skills/market-report-page/SKILL.md",
"C:/Users/admin/AppData/Roaming/Claude/local-agent-mode-sessions/92682d12-8402-46b0-b182-f8b8d59edfe5/7e5416d3-5312-4f73-921e-4033aefec49c/local_98dbd4c8-c9da-4e4e-bdb6-d976a3da9e13/outputs/IH_System_Handoff/skills/market-report-page/SKILL.md"];

const OLD_NOTE=`**Schema architecture note:** Do NOT redefine \`Organization\`, \`Person\`, \`RealEstateAgent\`, or \`WebSite\`
on market pages. Those canonical entities live ONCE on the homepage \`@graph\` (\`#organization\`,
\`#johnreuter\`, \`#website\`, and a \`RealEstateAgent\` either as \`#organization\` or \`#realestateagent\` with
John connected via \`worksFor\`). Market pages only carry Article, WebPage, BreadcrumbList, Place, Dataset,
ItemList, FAQPage, and reference the homepage entities by \`@id\`. This requires the homepage graph to
actually define those IDs; verify it does (Rich Results Test) so the \`@id\` references resolve.`;

const NEW_NOTE=`**Schema architecture note:** Every page must be self-sufficient. Google merges JSON-LD by \`@id\`
WITHIN a single page, but it does NOT resolve an \`@id\` across pages. It re-reads each URL from scratch,
so \`{"@id":"https://integrityhomeswi.com/#org"}\` on a market page, pointing at a node defined only on
the homepage, is a dangling reference to nothing. Article \`publisher\` is required, so a dangling
publisher means the page has no publisher at all.

Market pages therefore emit MINIMAL stubs of the three identity entities alongside their own nodes,
using the EXACT homepage \`@id\` values:

- \`#org\` - \`["Organization","RealEstateAgent"]\`, name "John Reuter - Integrity Homes", url, logo, telephone
- \`#john\` - \`Person\`, name, jobTitle, url, worksFor \`#org\`
- \`#website\` - \`WebSite\`, url, name, publisher \`#org\`

The shared \`@id\` is what consolidates the entity across pages over time, so it must match the homepage
byte for byte: \`#org\` and \`#john\`, NEVER \`#organization\` or \`#johnreuter\`. Do not repeat the full
homepage detail (address, sameAs, award, memberOf) on market pages. The stub is only there to make the
references resolve. After generating, confirm every \`@id\` reference in the graph points at a node
defined in that same graph.`;

const edits=[
 [OLD_NOTE, NEW_NOTE],
 [`   author \`{"@id":"https://integrityhomeswi.com/#johnreuter"}\`,\n   publisher \`{"@id":"https://integrityhomeswi.com/#organization"}\`,`,
  `   author \`{"@id":"https://integrityhomeswi.com/#john"}\`,\n   publisher \`{"@id":"https://integrityhomeswi.com/#org"}\`,`],
 [`Entities (use canonical @id references, never inline publisher/author):\n1. **Article**`,
  `Entities (identity stubs first, then the page's own nodes):\n0. **Identity stubs** - \`#org\`, \`#john\`, \`#website\` exactly as specified in the Schema architecture\n   note above. Without these, author/publisher/creator/isPartOf all dangle.\n1. **Article**`],
 [`Title "Months of Supply by Price Range \u2014 {City}, {Month Year}"`,
  `Title "Months of Supply by Price Range: {City}, {Month Year}"`],
 [`Title "{City} Year-Over-Year Comparison \u2014 {Month Year}"`,
  `Title "{City} Year-Over-Year Comparison: {Month Year}"`],
 [`- [ ] Single \`@graph\` in \`<head>\``,
  `- [ ] Single \`@graph\` in \`<head>\`\n- [ ] Every \`@id\` reference resolves to a node defined in the SAME graph (no cross-page refs)\n- [ ] Zero em dashes in the generated HTML. Colons in headings, commas in prose, \`n/a\` in empty\n      table cells. En dashes in numeric ranges ($300,000\u2013$399,999) are the one allowed exception\n- [ ] If \`references/archive-index.md\` is missing, the archive note must NOT claim month-by-month\n      history exists. Describe only what the page actually contains`],
];

for(const F of FILES){
  let s=fs.readFileSync(F,"utf8");
  let n=0;
  for(const [a,b] of edits){
    const hits=s.split(a).length-1;
    if(hits!==1){ console.log(`  SKIP (${hits} hits): ${a.slice(0,50).replace(/\n/g," ")}...`); continue; }
    s=s.split(a).join(b); n++;
  }
  fs.writeFileSync(F,s,"utf8");
  console.log(`${n}/${edits.length} applied -> ${F.includes("skills-plugin")?"ACTIVE plugin copy":"IH_System_Handoff source"}`);
}
