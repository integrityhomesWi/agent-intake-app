# Sheet format log

Every structural change to the **IH Live Transaction Tracker**
(`1HJZPXHP8y8cUdANbuiw916c8WLj66KYW8Qo_jSJ9oIs`) gets recorded here. Row edits
and cell values do not, only changes to the shape: columns added, renamed,
reordered, or tabs added.

## The one rule

**Columns are only ever appended to the right-hand end of a tab.** Never insert
one in the middle and never reorder them.

Column position is how every value maps to a field. The backend's `COLS_ACTIVE`,
`COLS_LISTINGS`, `COLS_BUYERLEADS` and `COLS_CLOSED` arrays are positional: the
third entry is column C, full stop. Insert a column between B and C and every
value from C rightward is now read as the wrong field, silently. Seller names
land in the lender column, closing dates land in Days Out, and nothing errors.

If a column genuinely has to move, the array in `google-sheets-backend.gs` has to
move with it, in the same commit, and the backend has to be redeployed before
anyone touches the sheet again.

## How a column gets added

Since build `sheets-7` this is automatic. Add the header name to the end of the
right `COLS_*` array in `google-sheets-backend.gs`, deploy, and `ensureHeaders_`
writes the header into the sheet the first time anything reads or writes that
tab. It only ever fills a blank header cell at the end, so it cannot rename or
displace a column already in use.

---

## Changes

### 2026-07-30 · build `sheets-8` · added Commission and GCI to Closed 2026

**Closed 2026**, appended after `Status`:
- `Commission` (column H)
- `GCI` (column I)

Why: the original column spec (2026-07-30) asked for these on all three
money-bearing tabs, but only Listings and Active Transactions got done in
`sheets-7`. This closes that gap. Created automatically by `ensureHeaders_`
the first time anything reads or writes Closed 2026 after this deploy.

### 2026-07-30 · build `sheets-7` · added Commission and Co-op Comp

**Active Transactions**, appended after `Title Company`:
- `Commission` (column V)
- `Co-op Comp` (column W)

**Listings**, appended after `Notes`:
- `Commission` (column P)
- `Co-op Comp` (column Q)

Why: the sheet had nowhere to record compensation. Ten signed listing contracts
carry a rate and the figures were being parked in the Notes column as free text,
where they cannot be sorted, filtered, or totalled. John authorised the columns
on 2026-07-30.

Also added in this build: `ensureHeaders_`, which creates any missing header and
widens the grid if needed, so future column additions need a deploy but no
manual sheet edit.

### 2026-07-29 · build `sheets-5` · Closed 2026 exposed

No columns added. `readTab_` stopped assuming the header sits on row 1, because
the Closed 2026 tab keeps a goal-tracker block above its headers.
`headerRowOf_` now finds the header by looking for the first column's name in
the first 25 rows.

### 2026-07-27 · original shape

Tabs: Active Transactions, Listings, Buyer Leads, Closed 2026, Goals & Pipeline.
Buyer Leads was created by the backend on first intake; the rest were built by
hand when the sheet replaced the old static dashboard.
