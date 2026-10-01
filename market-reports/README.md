# Market reports

Seven pages a month: six Dane County cities plus the county hub. Each overwrites a
permanent URL, so every refresh strengthens the same page instead of starting over.

## Running a month

```bash
cd generator
node month.js
```

That is the whole thing. It:

1. checks the dataset for internal contradictions before rendering anything
2. renders to a staging folder
3. runs every rule in `rules.js` against what was rendered
4. moves the pages into `Downloads/market-reports-<month>-<year>` only if everything passes

**A failing build publishes nothing.** Staging is kept so you can see what went wrong, and
the previous month's delivered pages are left untouched.

## Before you run it

Airtable (`Marketing Command Center` → `Market Reports`) needs the month's rows, and
`data.js` needs the figures copied across. The three editorial fields come from Airtable
verbatim and must never be written from the Notes field:

| Airtable field | Goes to |
|---|---|
| John's Take | `narrative.js` → `take[]`, split on paragraph breaks |
| Market Summary Line | `narrative.js` → `summary` |
| City Positioning Intro | `narrative.js` → `intro` |

The **Notes** field is raw MLS research. It names other brokers' listings as stale and
carries internal asides. It is working material and is never published.

## The files

| File | What it is |
|---|---|
| `data.js` | The only source for figures and city config. Hero images, Kit links, coordinates, zips, schools. |
| `narrative.js` | John's words, verbatim from Airtable. |
| `rules.js` | Every rule the skill states, as an assertion. 60 of them. |
| `build.js` | Helpers, schema, charts, FAQ generation. |
| `sections.js` | The question sections. |
| `render.js` | Page assembly. |
| `validate.js` | Runs the rulebook. |
| `verify-data.js` | Dataset cross-checks, runs before anything renders. |
| `month.js` | The one command. |
| `homepage.js` | Separate tool for the homepage schema blocks. |

## Why it is built this way

Every rule that lived only in prose eventually shipped broken. "Always an Extreme
Seller's Market" was in the skill for months while the pages said "a Extreme". Titles
carried figures that went stale and nobody re-read them. The validator had its own copy of
the output path and spent a whole cycle checking the previous month's files.

So: one source per fact, and every rule is an assertion that fails the build. If you add a
rule to `SKILL.md`, add the check to `rules.js` in the same commit. Each rule carries the
skill section it came from.

## Adding a rule

```js
{ id: "short-name", skill: "Step N, what it is called there", test: (html, pageName, cityData) =>
    someCondition && `what went wrong, with the actual values` },
```

Return a string to fail, anything falsy to pass. Then prove it bites: break the thing on
purpose, run `node month.js`, and watch it refuse.
