# Market reports: open items
Last updated 2026-09-07. Carried out of the Sept 2026 rebuild session.

## Needs John's hands (Lofty admin)
1. **Empty the Script area on `/wisco-hub`.** It still holds the old broken schema. It is the source of the last broken JSON-LD, the last em dash, and the dead `dane-county-wisconsin` links. Do not edit it, empty it. Schema belongs in a page content block, see `skill/references/lofty-platform.md`.
2. **Paste the rebuilt `wisco-hub.html`** (uses hero `20251230_7e589d03d7c94fd3.jpeg`).
3. **Set `og:image` per page in the Lofty SEO panel.** The panel overrides pasted HTML. Authoritative list is the `heroImg` field per city in `generator/data.js`.

## Verified and closed
- Sept 2026 pages for all 6 cities plus the hub: built, validated, live.
- 5 archive redirect rows in Airtable Web Pages: independently verified in a browser 2026-09-06, ticks restored with real provenance.
- Airtable token rotation: **dropped.** Claim came from an unreliable session, repo and git history scanned clean, no evidence of exposure. Revisit only if John recalls a token actually being on screen.

## Open, lower priority
- **Middleton April redirect points at DeForest.** Also: the Madison `april-2026` stub serves a Middleton page title. The archive stubs were duplicated from each other rather than built clean. Worth one sweep of all 26 stubs.
- **Waunakee April 2026 and Sun Prairie January 2026** have no redirect installed, the same condition as the 3 Madison URLs that were deleted.
- **3 dead Madison archive URLs** are 404 carrying roughly 1,461 estimated clicks of upside. Restore as redirect stubs.
- **Waunakee and Sun Prairie 2018 baselines.** Both published $265,005, one is wrong. Needs SCWMLS. Until then the section renders nothing. Do not write a placeholder.
- **John's personal LinkedIn `/in/...` URL** for the Person node. The company URL was removed and not replaced.
- **Brand colors.** Canonical `#002850` / `#B40000` vs the template's `#1e3a5f` / `#c9a227`. John's call: leave it for the website revamp.
- **`pct()` precision.** Rounds to one decimal, so over-asking shows `0.4%` not `0.43%`. In `generator/build.js`.

## Standing rules learned the hard way
- No placeholders. Ever. Call out that we do not know yet, or render nothing. `generator/validate.js` blocks the build on placeholder language.
- Build once, deliver once. Sending multiple versions of the same 7 files is what cost 4 hours.
- Titles stay evergreen, no figures, so the six-week no-touch rule does not conflict with monthly data.
- Cross-page `@id` does not resolve. Every page defines its own identity stubs.
