# WB-11 Offer to Purchase — Build Spec

Master build spec for the offer-drafting engine. This is what Claude Code builds from.
Form: WB-11 Residential Offer to Purchase, approved 7-1-24, mandatory 8-15-24, 11 pages.

Read this alongside CLAUDE.md. This file is the source of truth for every field, default,
and mark convention on the offer. Where the two ever disagree, this file wins on offer fields.

---

## THE THREE STAGES

The finished system has three stages. Build them in this order. Do not skip ahead.

1. **INTAKE** — agent speaks or types the deal. (Front end already built: index.html.)
2. **MLS** — Karl drops the MLS sheet in; the engine fills the MLS-sourced fields.
   Version one pulls from the MLS PDF itself. BUILD ORDER: get the engine assembling a
   draft from TYPED facts first, prove it end to end, THEN bolt on PDF reading last.
3. **SIGNING** — the signature platform handles signatures and all dates.

---

## DEAL IDENTIFIER

Every deal gets ONE identifier that ties intake, MLS sheet, and the draft together.
Without it, Stage 2 has no way to know which intake an MLS sheet belongs to.

- **App generates its own deal ID at intake, always.** Format: `IH-YYMM-NNNN`
  (e.g. `IH-2607-0143`) — year+month plus a running sequence. Never collides.
- **Store MLS# as a matching field** when the deal has a property (offers, listings).
  The MLS number is already unique and already on the MLS sheet, so it's the natural
  cross-reference for Stage 2. Buyer-only intakes have no MLS# yet — that's why the
  generated ID is the true key and MLS# is just a stored field.
- **Filename** keeps the ID plus human-readable bits so people can find it:
  `IH-2607-0143_Scott_6207-Old-Indian-Mound.md`
- **How Karl matches an MLS sheet to a deal:** by deal ID (or picks from a list). The
  MLS# on the sheet can auto-match if it was stored at intake.

---

## MARK CONVENTIONS (form-wide)

- App side = checkbox for the agent.
- Actual form = **X for yes, N/A for no.**
- Some lines take a **single X only** (never N/A) — flagged below where they apply.
- Strikes must stay VISIBLE on the form (strike-through or small x, never deletion).
- No em dashes anywhere.

---

## OVERRIDE RULE

The AGENT flips any default, in the app — check/uncheck, retype. If a deal needs something
the app does not handle, the agent reverts to old-school and writes it in zipForms.
The app nails the STANDARD offer; weird deals fall back to manual. Do not bloat the build
chasing edge cases.

Compliance: the engine ASSEMBLES A DRAFT. John's human review is always the gate before
anything goes out. Never auto-send a contract.

---

## TIER 1 — AGENT PROVIDES (feeds intake) + TIER 2 DEFAULTS, BY LINE

### Page 1
- **Line 1-2 — Agent role.** App checkbox: "Agent of Buyer" (default) OR "Agent of Buyer and Seller." If both, strike "Agent of Buyer" alone.
- **Line 3 — Buyer names.** Full names, comma-separated. Spell both out fully (e.g. "Jacob Scott, Abraham Scott"). No shared-last-name shorthand.
- **Line 4 — Street address.**
- **Line 6 — Municipality.** Typed as text WITH its type: "Town of Dunn" / "City of ___" / "Village of ___".
- **Line 7 — County.** (Dane, Columbia, etc.)
- **Lines 9-10 — Purchase price.** Agent enters ONCE. App fills both the written-words line (9) and the numeric line (10) automatically.
- **Lines 12-16 — Included items.** Agent enters. Verified against MLS sheet; agent can override.
- **Lines 20-23 — Not-included items.** DEFAULT: "No additional items." Optional agent add. Verified against MLS.
- **Line 40 — Binding acceptance date.** Agent, required, no default.
- **Line 47 — Closing date.** Agent, required. Date only.
- **Lines 48-49 — Closing place.** DEFAULT: "place selected by seller." No agent input.

### Page 2
- **Line 56 — Earnest money (prefilled dash).** Always dashed. Ignore.
- **Line 58 — Earnest amount.** Rule of thumb ~1% of purchase price. Agent sets it (their call with buyer).
- **Line 59 — Earnest delivery.** DEFAULT: 5 days.
- **Lines 60-61 — Who holds earnest.** Real Broker (drafting firm) NEVER holds — no trust account. Agent tells you the holder:
  - Title/other (most common) → strike "listing firm" and "drafting firm," fill title co. (e.g. Atlas Title, 5201 E Terrace Dr Ste 180, Madison WI).
  - Listing firm holds → strike "drafting firm" and "other."
  - Strikes stay visible.
- **Line 107 — Condition report date.** From MLS sheet.

### Page 3
- **Top — Property address.** Verified against MLS.
- **Line 193 — Home inspection contingency.** Agent yes/no → X / N/A. If yes, DEFAULT 14 days, written "(14) days." Agent can change days.
- **Line 216 — Right to cure (inspection).** DEFAULT: shall.
- **Line 218 — Cure period.** DEFAULT: 10 days.
- **Line 227 — Radon.** Agent yes/no → X / N/A. If yes, DEFAULT 14 days.

### Financing (Lines 248-269)
- **Line 248 — Financing contingency.** X if financing.
- **Line 249 — Financing type.** From pre-approval or agent. Must be spelled proper: Conventional, FHA, VA. No shorthand (no "COB" etc.). Reviewed regardless.
- **Line 250 — Loan commitment deadline.** DEFAULT 30 days of acceptance. CHECK: commitment-days window must NOT fall outside the closing window — commitment date has to land before closing. Flag if it does not.
- **Line 251 — Loan amount.** App CALCULATES = purchase price minus down payment. (Agent enters loan amount OR down payment as % or fixed.)
- **Line 252 — Monthly principal + interest.** App CALCULATES: amortize the financed amount over the term at the fixed rate. Agent enters: term (e.g. 30 yrs) and fixed rate; app returns the monthly P&I.
- **Lines 264-265 — Fixed rate.** Single X (never N/A) when fixed. Line 264 interest rate = the rate that drives the P&I calc above.
- **Adjustable rate.** Rare custom case. NOT a standard-offer default. Skip.
- **Line 288 — Always N/A.**

### Appraisal (Lines 308-317)
- **Line 308 — Appraisal contingency.** Agent yes/no → X / N/A.
- **Line 312 — Days.** DEFAULT 30. Must fit within offer period. Anything under 21 days → FLAG "verify with lender."
- **Line 315 — Leave as-is.**
- **Line 317 — Prefill 5.**

### Other contingencies
- **Line 328 — Closing-of-buyer's-property contingency.** DEFAULT N/A. If X: agent gives contingent property address + close-by date. App SHOWS the deal's projected closing date alongside as a reminder ("this offer is projecting to close on [date]").
- **Line 330 — Buyer's property sale close date.** (from above)
- **Line 335 — DEFAULT N/A.** If X: agent fills 336. Lines 339, 340, 342, 343 = agent discretion, NOT in the app.
- **Line 348 — Secondary offer.** DEFAULT N/A. If X: fill Line 352 days (agent's call).
- **Lines 359-361 — Fuel.** Generally blank. Filled only if there's a fuel/LP tank.
- **Lines 366-377 — Tax proration.** App gives the agent the options (net general taxes / prior year / etc.); agent picks one.

### Page with 428+
- **Line 428 — Rented items.** DEFAULT None. Verified against MLS (water softener rented, LP tank, anything rented).
- **Line 543 — DEFAULT X.**
- **Line 544 — DEFAULT 3%, written out "three percent."**
- **Lines 548-570 — Additional provisions.** DEFERRED. Separate focused pass later — this is where the standard addendum clauses live (inspection buffer, etc.). Keep simple for now.

### Signature block
- **Line 576 — Seller's agent name.** From MLS sheet.
- **Line 577 — Drafting licensee.** The agent it's ON BEHALF OF — Michele even if Karl physically drafts.
- **Line 587 — Always check mark.**
- **Line 588 — Seller's address.** From MLS.
- **Line 589 — Drafting agent email.** The on-behalf-of agent's email. All @integrityhomeswi.com. NOTE: Michele = one L ("michele@...").
- **Line 592 — Additional addendum.** DEFAULT N/A.
- **Line 593 — Always: "[Agent Name], Integrity Homes - Real Broker, LLC"**
- **Lines 606 / 609 — Buyer print names.** As written earlier.
- **Dates.** Signature platform handles (they vary too much).

---

## STAGE 2 — MLS EXTRACTION MAP

What the engine reads off the SCWMLS sheet and where it lands on the offer.
Field labels below are the SCWMLS sheet's own labels.

| MLS sheet field | Offer field | Notes |
|---|---|---|
| MLS# | Deal identifier (stored) | Unique key; auto-matches to intake if stored |
| Parcel | (reference) | Backup unique key |
| Address / City / County | Line 4 / Line 6 / Line 7 | Municipality typed WITH type ("City of Elroy"); verify |
| List Price | (context) | Compare against agent's offer price — sanity flag |
| Net Taxes ($ / year) | Tax proration (366-377) | Feeds proration method |
| Include | Included items (12-16) | Verify; agent can override |
| Excluded | Not-included (20-23) | Blank on sheet → default "No additional items" holds |
| Water softener / softener location | Rented items (428) | CAUTION: if listed under *Include* it's OWNED and conveys → 428 stays None. Only flips to 428 if sheet says "rented." |
| Fuel | Fuel lines (359-361) | If propane/LP → FLAG "check for rented vs owned LP tank" |
| Listing Agent (LstAg) | Seller's agent name (576) | |
| Listing firm | (seller agent firm) | |
| LstAg address | Seller's address (588) | |
| (RECR — not on MLS sheet) | Condition report date (107) | Stays FLAGGED for Karl; comes from the actual RECR |
| Remarks / seller notes | (surface for review) | e.g. easements — NOT auto-filled; flag for John's review |

**Test case:** MLS-Sheet.pdf = 410 W Elroy St, Elroy WI 53929, Juneau County, MLS# 2028766,
list $849,900, net taxes $13,978/2025, LP fuel, softener conveys (Include), agent Julie
Alibrando / RE/MAX Preferred / PO Box 56, La Valle WI 53941. Easement note in remarks →
surfaces for review. Use this sheet to validate the parser.

---

## TIER 3 — BOILERPLATE (never touched)

All legal body text, definitions, FIRPTA, wire-fraud warning, standard clause language,
signature-block scaffolding. Engine leaves untouched.

---

## OPEN / DEFERRED
- Additional provisions (548-570): standard addendum clauses — own pass.
- MLS PDF auto-read (Stage 2 upgrade): build after typed-facts engine works end to end.
- Adobe/PDF auto-fill of the physical WB-11: its own future project.
