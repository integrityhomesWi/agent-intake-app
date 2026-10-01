# Market reports: open items
Last updated 2026-10-01, after the October build.

## Needs John's hands (Lofty admin)
1. **Paste the 7 October pages** from `C:\Users\admin\Downloads\market-reports-october-2026\`. Each overwrites its permanent URL.
2. **Empty the Script area on `/wisco-hub`.** Still holds the old broken schema. Do not edit it, empty it. See `skill/references/lofty-platform.md`.
3. **Set `og:image` per page in the Lofty SEO panel.** The panel overrides pasted HTML. Authoritative list is the `heroImg` field per city in `generator/data.js`.

## Waiting on John
- **Five more SCWMLS Comparison Reports** (Sun Prairie, DeForest, Verona, Waunakee, Middleton) if those pages should carry zip tables. Only Madison had one for October, so the other six render no zip section. The city Snapshot PDFs carry no zip data at all this cycle.

## Closed this cycle
- **Waunakee 2018 baseline, resolved.** It was $265,005 on the live page, which is Sun Prairie's number. The October SCWMLS year table confirms Waunakee's 2018 median is **$425,500**, making the honest appreciation **41.2%**, not the "more than 90%" that was published. Corrected on the page, and John's Take names the error explicitly rather than quietly swapping the figure. Sun Prairie's $265,005 is confirmed genuine.
- **Source conflict settled.** The Comparison Report and the city Snapshot disagree on Madison's sales (199 vs 178) and volume ($97.9M vs $86.3M); median and DOM agree. John's call: Snapshot governs the stat grid, Comparison Report is used only for the zip table. Never mix sources inside one page.
- **Hot-zone rule was wrong in code.** `render.js` only ever marked the single tightest band, so Verona's second hot zone ($700K-$799K at 0.92) would have gone unflagged. Now any band strictly under 1.00 is marked, and a band at exactly 1.00 (Middleton this month) correctly is not.
- **Six hardcoded `September 1, 2026` strings** in `render.js` drove the hero freshness badge and both source lines. They would have shipped stale on all seven October pages. Now derived from `D.snapshot`.
- Airtable token rotation: **dropped.** Claim came from an unreliable session; repo and full git history scanned clean. Revisit only if John recalls a token actually being on screen.

## Known data caveats carried into the October pages
- **Madison prior-year DOM.** Airtable has Median DOM 10, YoY 0, and Prior Year Median DOM 11, which cannot all be true. Six of seven markets are internally consistent; only Madison is not. Built with prior = 10 to match the PDF headline ("0 from previous year"). Worth correcting the Airtable field.
- **Per-zip "% over asking" omitted.** The column came out of the PDF as 25 values for 26 slots and could not be split into current vs year-over-year. Dropped rather than guessed.
- **Verona's +34.7% median** is a soft comparison month (17 sales against a weak Sept 2025). The page leads with the +2.2% year to date figure.
- **Sun Prairie's +40.6% sales / +68.6% volume** are off a 32-sale base. Same treatment.
- **DeForest bifurcation.** Average DOM 70 vs median 26. No fast-market language on that page.
- **Report Month drift.** All seven October rows store 2026-10-01, but the field description says store the closings month (2026-09-01). September's rows drift the same way. Cosmetic; does not affect the build.

## Open, lower priority
- **Middleton April redirect points at DeForest.** Also the Madison `april-2026` stub serves a Middleton page title. The archive stubs were duplicated from each other. Worth one sweep of all 26.
- **Waunakee April 2026 and Sun Prairie January 2026** have no redirect installed.
- **3 dead Madison archive URLs** carrying roughly 1,461 estimated clicks of upside. Restore as redirect stubs.
- **John's personal LinkedIn `/in/...` URL** for the Person node.
- **Brand colors.** Canonical `#002850` / `#B40000` vs the template's `#1e3a5f` / `#c9a227`. John's call: leave for the website revamp.
- **`pct()` precision.** Rounds to one decimal, so over-asking shows `0.4%` not `0.43%`. In `generator/build.js`.

## Monthly run order
```
node verify-data.js     # cross-checks the dataset before anything renders
node render.js          # writes the 7 files to Downloads\market-reports-<month>-<year>
node validate.js        # schema, links, dashes, title and meta limits
node verify-output.js   # dates, zip tables, hot zones, word counts, the corrections
```
Update `OUT` in `build.js` to the new month before running `render.js`, or last month's folder gets overwritten.

## Standing rules learned the hard way
- No placeholders. Ever. Call out that we do not know yet, or render nothing. `validate.js` blocks the build on placeholder language.
- Build once, deliver once. Sending multiple versions of the same 7 files is what cost 4 hours in September.
- Titles stay evergreen, no figures, so the six-week no-touch rule does not conflict with monthly data.
- Cross-page `@id` does not resolve. Every page defines its own identity stubs.
- Use the Write tool, not bash heredocs, for anything containing apostrophes. Shell escaping has broken this build twice.
