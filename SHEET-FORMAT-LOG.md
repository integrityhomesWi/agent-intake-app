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

### 2026-07-31 · build `sheets-14` · Active Transactions rebuilt into a fresh categorized tab

The flat sheets-13 layout (98 columns, one long row) was hard to read as a
human, so the tab itself got rebuilt rather than just re-columned. The
`rebuildActiveTransactions_()` one-time function (in `google-sheets-backend.gs`,
not called from doGet/doPost - run manually once from the Apps Script editor)
renamed the existing `Active Transactions` tab to `Active Transactions
(Archive)` (data untouched, kept for reference) and created a new, empty
`Active Transactions` tab with:

- A merged, colored category header row above the field names (18 categories:
  Overview, Buyer & Seller, Co-op Agent, Offer & Contract, Earnest Money,
  Inspection, Radon, Termite, Well/Septic/Water, Appraisal, Financing, Title,
  Property Disclosures, Condo/HOA, Sale of Buyer's Property, Special
  Contingencies, Closing, Compensation)
- Collapsible column groups per category (Sheets' native outline feature)
- Frozen header rows and first column

`COLS_ACTIVE` is now derived from a new `ACTIVE_CATEGORIES` array (single
source of truth - the flat list and the visual grouping can't drift apart,
one is generated from the other) instead of being hand-written. Column
**order changed** to group by category instead of chronological-by-when-added,
safe only because the new tab starts empty - no existing row data to
reinterpret at the wrong position. `TAB_ACTIVE` still resolves to whichever
sheet is named "Active Transactions", so nothing else in the backend needed
to change.

The archived tab's ~20 rows of real deal data are not migrated automatically -
re-entering that data into the new tab is separate work (the data-entry
session's job, not this rebuild).

### 2026-07-31 · build `sheets-13` · added 64 columns, full Active Transactions rebuild

**Active Transactions**, appended after `HOA` (voice-dictated by John, cross-checked
against an "Accepted Offer" field-list document, categories and exclusions
confirmed one at a time):

- Offer & Contract Timeline (9): Counter-Offer Date, Amendment 1/2/3 Date +
  Notes, Offer Written in Secondary Position, Time Frame to Rescind
- Closing Details (5): Closing Time, Closing Location, Title Commitment Due
  Date, Final Walkthrough Date + Time
- Earnest Money (2), Inspection (4), Radon (3): each split into a Status +
  Due Date pair (plus Notes/Repairs Deadline for Inspection, Notes for
  Radon). The legacy `Earnest Money` / `Inspection` / `Radon` columns are
  left in place, unused going forward - not deleted, per the append-only
  rule. Command Center's milestone-cycling UI still reads the legacy columns
  today; rewiring it to the new split columns is deliberately deferred to a
  single pass once all tracker column work is finished, not done per-field.
- Termite (2), Well/Septic/Water (7 - split from the legacy `Well/Septic`
  column the same way as above), Financing (4), Appraisal Notes (1),
  Property Disclosures (5), Sale of Buyer's Property (5), Condo (2)
- Special Contingencies (15): 5 flexible slots, each Contingency + Deadline
  + Notes, replacing a rejected 20-named-contingency list from the source
  document

Deliberately excluded after review: HOA/Condo micro-deadlines beyond
Condo (Y/N) + Doc Deadline, the Survey/Zoning/Rental section (commercial
boilerplate, doesn't match this business), the Insurance section (not a
recurring bottleneck), and all "pre-closing operational reminders" /
"after-closing CRM follow-up" fields from the source doc - those are TC
workflow/reminder tasks, not transaction data, and belong in a separate
system, not this sheet.

Active Transactions is now 98 columns (34 existing + 64 new).

### 2026-07-31 · build `sheets-11` · added 27 columns from the transaction-detail brainstorm

**Active Transactions**, appended after `Co-op Comp`:
- `Offer Date`, `Financing Type`, `Home Sale Contingency`, `Possession Date`,
  `Possession Notes`, `Co-op Agent Company`, `Co-op Agent Email`,
  `Co-op Agent Phone`, `Earnest Money Holder`, `Home Inspector`, `HOA`

**Listings**, appended after `Co-op Comp`:
- `List Date`, `Expiration Date`, `Included Items`, `Excluded Items`,
  `Condition Report Date`, `Year Built`, `Lead Paint Disclosure Status`,
  `Photo Link`, `Virtual Tour (Branded)`, `Virtual Tour (Unbranded)`

**Buyer Leads**, appended after `Notes`:
- `Lender Name`, `Lender Company`, `Lender Phone`, `Lender Email`,
  `Preapproval Expiration`, `Buyer Agency Signed Date`,
  `Buyer Agency Start Date`, `Buyer Agency End Date`

Why: John ran a voice brainstorm on the full deal lifecycle (buyer intake,
listing, under-contract/closing) and cross-referenced it against the
Transaction_Master_Checklist and TC SOP already in Drive. `Home Inspector` and
`HOA` were not in the brainstorm doc but are grounded in the same SOP/checklist
(preferred inspector vendors, title-review HOA check) and added on that basis.
The "weekly email tracking" idea from the brainstorm was deliberately left out
- that's an automation feature, not a column, and needs its own design pass.
No front-end (Command Center) changes yet; these are backend-only until John
decides which of them need to be visible/editable in the dashboard.

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
