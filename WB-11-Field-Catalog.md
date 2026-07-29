# WB-11 Residential Offer to Purchase — Field Catalog

Master reference for the offer-drafting automation. Form version: approved 7-1-24, mandatory 8-15-24, 11 pages.

The whole point of this catalog: separate what the AGENT must provide (the intake) from what the FIRM sets once (defaults) from what never changes (boilerplate). Only Tier 1 feeds the voice intake app. Tier 2 is your firm template. Tier 3 is always-on legal text.

Field types: TEXT, MONEY, DATE, NUMBER (day/count), PERCENT, CHECKBOX, STRIKE (choose one of options), CONDITIONAL (only if a box marked).

---

## TIER 1 — AGENT SPEAKS IT (feeds the intake app)

These are the deal-specific facts only the agent knows. This is exactly what the Buyer-Offer intake should collect.

| # | Line(s) | Field | Type | Notes / maps to intake |
|---|---------|-------|------|------------------------|
| 1 | 1 | Offer drafting date | DATE | Usually today |
| 2 | 1-2 | Agent role (buyer/seller/dual) | STRIKE | Almost always "agent of buyer" for you |
| 3 | 3 | Buyer name(s) | TEXT | intake: Buyer name(s) |
| 4 | 4-8 | Property street address | TEXT | intake: Property address |
| 5 | 6 | Municipality (city/town/village) | TEXT | part of address |
| 6 | 6 | County | TEXT | usually Dane |
| 7 | 9-10 | Purchase price (words + numeric) | MONEY | intake: Offer price |
| 8 | 12-16 | Included items | TEXT | intake: optional; appliances etc. |
| 9 | 20-23 | Excluded items | TEXT | intake: optional |
| 10 | 40 | Binding acceptance deadline (date/time) | DATE | key deadline for the offer |
| 11 | 47-48 | Closing date | DATE | intake: Close date |
| 12 | 56 | Earnest money WITH offer | MONEY | intake: Earnest money |
| 13 | 58 | Earnest money to follow | MONEY | often blank / optional |
| 14 | 107 | Condition report date | DATE | if received; else strike |
| 15 | 227-234 | Radon contingency on? + days | CHECKBOX + NUMBER | intake: contingency choice; "20 if blank" |
| 16 | 193-208 | Inspection contingency on? + days | CHECKBOX + NUMBER | intake: contingency choice; "15 if blank" |
| 17 | 197-199 | Additional components inspected | TEXT | e.g. pool, roof — optional |
| 18 | 248-250 | Financing contingency on? + loan type + days | CHECKBOX + TEXT + NUMBER | intake: financing (e.g. Conventional) |
| 19 | 250-252 | Loan amount / term / amortization | MONEY + NUMBER | intake: loan amount |
| 20 | 252 | Max monthly P&I payment | MONEY | Karl often computes |
| 21 | 264 | Fixed rate cap | PERCENT | intake: max interest rate |
| 22 | 265-269 | Adjustable rate terms | PERCENT | only if ARM |
| 23 | 296 | If NOT financing-contingent: verification days | NUMBER | "7 if blank" |
| 24 | 308-312 | Appraisal contingency on? + days | CHECKBOX + NUMBER | intake: contingency choice |
| 25 | 328-330 | Closing-of-buyer's-property contingency | CHECKBOX + TEXT + DATE | only if buyer must sell first |
| 26 | 335-347 | Bump clause terms | CONDITIONAL | rare |
| 27 | 543-544 | Seller pays buyer's firm compensation | TEXT | e.g. "3% of purchase price" |
| 28 | 548-570 | Additional provisions / custom clauses | TEXT | firm's standard clauses live in Tier 2; deal-specific ones here |
| 29 | 585-589 | Party addresses / emails for delivery | TEXT | buyer + seller contact |
| 30 | 593 | Drafting licensee + firm | TEXT | you / Integrity Homes - Real Broker |

---

## TIER 2 — FIRM STANDING DEFAULTS (set once, auto-fill every offer)

These are the same on nearly every offer you write. Decide them ONCE as the Integrity Homes template; the automation fills them automatically. Karl/John own these, not the agent.

| # | Line(s) | Field | Your default | Type |
|---|---------|-------|--------------|------|
| D1 | 59 | Earnest money delivery days | 5 (blank default) | NUMBER |
| D2 | 60-62 | Earnest money held by | Listing firm / per form default | STRIKE |
| D3 | 88-91 | Time is of the Essence exceptions | usually none | TEXT |
| D4 | 216 | Inspection right to cure | shall (default) | STRIKE |
| D5 | 218 | Seller election-to-cure days | 10 (blank default) | NUMBER |
| D6 | 230-231 | Radon test expense | Buyer's (default) | STRIKE |
| D7 | 235 | Radon right to cure | shall (default) | STRIKE |
| D8 | 255 | Discount points cap | 0 (blank default) | PERCENT |
| D9 | 315-318 | Appraisal right to cure + days | shall / 5 | STRIKE + NUMBER |
| D10 | 352 | Secondary offer withdrawal days | 7 (blank default) | NUMBER |
| D11 | 336 | Bump clause hours | 72 (blank default) | NUMBER |
| D12 | 357 | HOA transfer fee paid by | Buyer (default) | STRIKE |
| D13 | 359-372 | Tax proration method | net taxes preceding year (default box) | CHECKBOX |
| D14 | 400 | Gap endorsement cost | Seller's (default) | STRIKE |
| D15 | 548-570 | Standard addendum clauses | firm's boilerplate (e.g. inspection buffer, pool-condition language when applicable) | TEXT |

NOTE: Some Tier 2 defaults become Tier 1 when a specific deal overrides them (e.g. buyer agrees to pay radon, or a non-standard cure period). The automation should let Karl/John override a default per-offer without re-typing the whole thing.

---

## TIER 3 — BOILERPLATE (never touched, always present)

Pure legal body text. Not collected, not decided — always on the form. Listed so the automation knows to leave it alone.

- Fixture definition (26-36)
- Earnest money disbursement / legal rights (67-87)
- Real Estate Condition Report law (94-104)
- Conditions Affecting Property list a-aa (112-177)
- Inspections and testing definitions (178-192)
- Right-to-cure mechanics (all contingencies)
- Financing satisfaction / seller termination / seller financing (270-295)
- Homeowners association notice (355-358)
- Closing prorations mechanics (359-381)
- Title evidence / conveyance / merchantable title (382-415)
- Special assessments (416-425)
- Leased property (426-430)
- Definitions: Actual Receipt, Business Day, Deadlines, Defect, Firm, Party, Property (431-450)
- Optional provisions / dimensions / distribution of info (451-464)
- Maintenance / damage before closing / walk-through / occupancy (465-486)
- Default remedies (487-501)
- Entire contract / sex offender registry / FIRPTA (507-542)
- Delivery methods (571-589)
- Wire fraud warning (594-605)
- Signature blocks (606-621)

---

## HOW THIS FEEDS THE BUILD

1. The voice intake app collects TIER 1 only. That keeps the agent's job small — she speaks the deal terms, nothing else.
2. The firm template holds TIER 2 — decided once, auto-filled every time.
3. TIER 3 is the static form body.
4. The drafting automation = Tier 1 (from intake) + Tier 2 (from template) mapped onto the WB-11, with John's compliance review before anything goes out.

## OPEN QUESTIONS FOR JOHN (to finalize Tier 2 defaults)
- Confirm each Tier 2 default above matches how Integrity Homes actually writes offers.
- Which addendum clauses are TRULY standard (every offer) vs. situational (pool, etc.)?
- Who owns overriding a default on a specific deal — Karl, or John at compliance review?
