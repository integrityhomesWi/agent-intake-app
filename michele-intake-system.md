# Michele Intake + Contract Drafting System

Built from our call. This is the phase-one build (the cheap, buildable piece) plus the phase-two roadmap for contract auto-drafting.

> **RESOLVED (2026-07-29):** John confirmed the Airtable base described below was abandoned — Google Drive/markdown files (index.html + command-center.html) is the one real system going forward. Everything below is historical context on how this design evolved, not a live system. Do not build against the Airtable/Google Forms plan described here.

The core principle from our conversation: make Michele's job **90 seconds**, test that she'll actually do it on one real deal, and only *then* build the expensive automation on top. Prove the intake before you build the mansion.

---

## PART 1 — THE TWO INTAKE POINTS (build these first)

Two simple Google Forms. Both required-field, both ~90 seconds. Neither lets her dump chaos into the transaction system, because the form is the only door and it only accepts clean input. Karl takes the clean output and runs everything downstream.

**The rule: No slip, no Karl.** He doesn't lift a finger until the form is filled. That kills the "Karl doesn't have the info" problem at the source.

### Form A — New Buyer (Pre-Agency)

| Field | Type | Required |
|---|---|---|
| Client name(s) | Short text | Yes |
| Best phone number | Short text | Yes |
| Email | Short text (email validation) | Yes |
| Basic intent (what are they looking for / price range / timeline) | Paragraph | Yes |
| Anything Karl should know | Paragraph | No |

That's it. When this lands, Karl replies: "Here's what needs to happen from here."

### Form B — New Listing Coming Up

| Field | Type | Required |
|---|---|---|
| Property address | Short text | Yes |
| Seller name(s) | Short text | Yes |
| Best phone number | Short text | Yes |
| Email | Short text (email validation) | Yes |
| Target list date / timeline | Short text | No |
| Anything Karl should know | Paragraph | No |

### Setup notes
- Build both in Google Forms, ~5 minutes each. McKenzie can do it.
- Responses feed a Google Sheet Karl watches. Sheet only for now — keep it dead simple.
- Do **not** give Michele access to dump into the transaction management system directly. The form is her sandbox.

### The accepted-offer piece is NOT a form
Her only job at accepted-offer is handing over accurate documents. That's her professional duty as the agent of record — she carries the liability regardless. That's a coaching point, not a system to build.

---

## PART 2 — CONTRACT AUTO-DRAFTING (phase two roadmap)

### What we ruled out and why
- **zipForm API / MCP:** No practical public API. The broker developer kit sits at the Real Broker LLC org level, not available to you as an individual agent. Dead end for practical purposes.
- **zipForm via Zapier:** The integration is thin — basically "create a contact." Transactions and documents were only ever *planned*, never delivered. Can't draft a WB-11 through it. Dead end for the real prize.

### The path that works: fillable PDF templates
State-approved forms come as flat PDFs (not fillable). So the build is:

1. **One-time setup:** Convert each flat state form (WB-11, WB-1, disclosures, etc.) into a fillable PDF with named fields and conditional strike-throughs. Done once per form, then rock solid forever.
2. **Live deals:** A Cowork Claude session takes Michele's clean intake data and populates the named fields.
3. **Proof step (non-negotiable):** Karl verifies every drafted doc before it goes anywhere near a client — especially the strike-throughs, given the liability.

**Cowork fills, Karl verifies. Always.**

### How the either-or / strike-through logic works
Every either-or spot in the contract becomes its own toggle. Each option is a separate field with a strike overlay. Pick one, the other auto-strikes.

- **Smart defaults:** Pre-fill the common case (agency = buyer, ~95% of the time). Michele only touches the exceptions.
- **Example:** "Inspection contingency satisfied 14 days [strike one] after acceptance / prior to closing" → "after acceptance" and "prior to closing" are two fields, each with a strike overlay. Pick one, the other gets the line.
- Blank fields get typed content (e.g., the "14 days"). Either-or spots get pick-one-auto-strike.

This matches exactly how the paper form thinks.

---

## PART 3 — FREELANCER BRIEF (paste into Upwork/Fiverr)

> **Job: Convert flat real estate PDF contracts into fillable forms with named fields + conditional strike-throughs**
>
> I need several flat (non-fillable) PDF contract forms converted into fillable PDFs in Adobe Acrobat. Deliverables:
> - Text fields where content is typed, each with a specific field name I will provide.
> - Checkbox/toggle fields for either-or provisions, where selecting one option applies a visible strike-through line over the non-selected option.
> - Clean, exactly-named fields per my naming spec (attached).
>
> These are **blank template forms only — no client data.** I'll provide detailed provision-by-provision notes (recorded) describing which lines need strike toggles and how they behave.
>
> Screen for: strong Adobe Acrobat Pro form-building experience, conditional field logic, precise field naming, real estate or legal document experience a plus.

### Two things to protect yourself on
1. **Blank forms only** to the freelancer — zero client confidentiality exposure.
2. **You spec/approve the field names.** Those names are what the automation grabs later — don't let them freelance the naming.

---

## PART 4 — FIELD-NAMING SPEC + NARRATION TEMPLATE

### Naming convention
Lowercase, hyphenated, descriptive. Format: `[section]-[what-it-is]` and for strikes `[section]-[option]-strike`.

Examples:
- `inspection-days` (text field)
- `agency-buyer-strike` / `agency-seller-strike` (toggles)
- `earnest-money-held-listingfirm` / `earnest-money-held-other`
- `earnest-money-other-blank` (text field, shows only if "other")

### Narration template — do a voice session per form using this

For each provision, dictate:

```
FORM: [e.g. WB-11 Residential Offer to Purchase]

PROVISION: [line number / clause name]
TYPE: [text field  |  either-or toggle  |  checkbox]
FIELD NAME(S): [your name(s)]
DEFAULT: [what it pre-fills to, if anything]
BEHAVIOR: [e.g. "if 'other' selected, reveal blank text field earnest-money-other-blank"]
NOTES: [anything the freelancer needs to know]
```

**Worked example (from our call):**
```
PROVISION: Agency disclosure block (top of form)
TYPE: either-or toggle
FIELD NAMES: agency-buyer-strike, agency-seller-strike, agency-both-strike, agency-neither-strike
DEFAULT: buyer (strike the others automatically)
BEHAVIOR: pick one role; strike lines apply to all non-selected roles
NOTES: ~95% of deals = buyer. Only changes on dual-agency/seller deals.

PROVISION: Inspection contingency timing (line X)
TYPE: either-or toggle
FIELD NAMES: inspection-timing-afteraccept, inspection-timing-priorclosing
DEFAULT: after acceptance
BEHAVIOR: pick one, strike the other
NOTES: paired with text field inspection-days for the number of days

PROVISION: Earnest money held by (line X)
TYPE: either-or toggle + conditional text
FIELD NAMES: earnest-held-listingfirm, earnest-held-other, earnest-other-blank
DEFAULT: listing firm
BEHAVIOR: if 'other' selected, reveal earnest-other-blank text field
```

---

## PART 5 — PHASE 3+: VOICE-TO-CONTRACT (the big vision)

Once the fillable templates exist (Part 2), the voice layer becomes buildable. The hard part was never the voice — it's the field mapping, and turning messy natural speech into clean structured slots is exactly what a Claude session is best at. Two front doors, one engine.

### Front Door A — John (power-user, fire-hose)
You know the contract cold, so you dump everything at once, hands-free, driving home:

> "We just saw 123 Main Street, Sun Prairie, Wisconsin, for Joe and Beth Smith. Include the fridge, dishwasher, stove, microwave. Earnest money held by Alice Title. Waiving inspection — mark it N/A. VA financing, 30-year fixed, 6.5%, $400K, 100% LTV. Additional provision: seller is related to buyer."

The engine maps each spoken item to its named field:
- "fridge, dishwasher, stove, microwave" → included-personal-property
- "waiving inspection" → inspection contingency struck / N/A
- "VA, 30-year fixed, 6.5, 400K, 100%" → each number to its financing field
- "seller related to buyer" → additional provisions

Output: drafted WB-11 → Karl proofs → you sign.

### Front Door B — Michele (guided conversation)
This version is **better for her than for you**, because it carries her brain for her. It asks the questions she'd otherwise forget and won't let her finish without the answers Karl needs. She just answers, driving, hands-free.

Flow looks like:
> **Claude:** How can I help today?
> **Michele:** I need to write an offer for the house I'm driving to — 1100 Harris Street.
> **Claude:** Which clients is this for?
> **Michele:** Bobby and Joe Smith.
> **Claude:** Let me verify we have their buyer agency agreement signed... Confirmed — I've got their agency agreement, contact info, phones, and emails. Are you drafting and sending today, or a different day? What items should be included? Anything excluded? Is 1100 Harris a city, village, or town?
> **Michele:** [answers each]

### Why Front Door B is the sleeper win
- **Flips her weakness into the system's job.** No flow guide to read, no doc to remember. The conversation asks; she answers.
- **Compliance guardrail she can't skip.** The mid-conversation lookup verifies the buyer agency is actually signed *before* it will draft. That guardrail alone may justify the whole build.
- **Captures her judgment at the right moment** (contingency dates, inclusions/exclusions) instead of leaving it in her head where Karl can't see it.

### Karl's refinement — address does the heavy lifting
Karl's insight: don't make Michele supply info the listing already publishes. She just gives the **property address** (spoken, not typed), and the listing PDF supplies the rest. Her spoken input shrinks to four things:
1. Property address (pulls all published listing data)
2. Purchase price
3. Contingencies she wants
4. Earnest money amount

This is a cleaner design — it removes every field where she could fumble a detail that already exists somewhere authoritative.

### The Paragon reality (SCWMLS front end)
- **No MCP or API access to Paragon.** Only path to listing data is manual/browser.
- Navigation to get a listing PDF: home screen -> search address -> find active listing -> Print-Plus button -> download PDF. Teachable for a Cowork Chrome session, but it's the **brittle part** (same caveat as zipForm - a moved button trips it).
- **Once the PDF is downloaded, everything is rock-solid** - reading a listing PDF and pulling details into fields has no brittleness.

**Near-term decision: don't automate the cheap part.** Whoever's doing the offer (John or Karl) downloads the listing PDF manually - it's a 10-second click for a human who knows the button. The engine then reads that PDF and drafts. Human does the 10-second grab; machine does the tedious drafting. Revisit auto-navigation later if it's ever worth it.

### John's rambling door stays
John's fire-hose voice draft is fully preserved. He keeps the mumble-jumbo, fire-everything-at-once offer - and simply drops in the Paragon PDF alongside the voice dump so the engine has authoritative listing data to work with. Best of both: the ramble plus the listing data.

### THE LIVING-DRAFT MODEL (where we landed — solves the sequencing problem)
The problem: for the engine to read items back to her, it needs the listing PDF first — but she's often driving/rambling with no PDF loaded, and last-minute PDF grabs put Karl on the spot.

The solution: **the address is the only thing she truly must give.** Everything hangs off it.

1. Michele does her voice offer whenever/wherever — answers whatever she's got in her head. Even if it's not much.
2. **Non-negotiable: the property address.** That's the anchor/thread to pull the listing.
3. System generates a **living draft + notification** that she's started one.
4. Once the MLS listing PDF is downloaded/pulled, it gets read in and populates everything it can.
5. Draft **flags/highlights back to Michele** what's still needed or unverified: "Still need earnest money amount, closing date; confirm included items."
6. She fills the blanks when ready. The draft itself is the checklist. No scramble, no perfect-input-up-front, no Karl on the spot.

### Her spoken/confirmed inputs (the negotiated items the listing can't supply)
- Property address (**required anchor** — drives the listing pull)
- Purchase price
- Earnest money amount
- Included items — **read-back-and-confirm** against the listing (she's forgotten items before, e.g. two washers/two dryers, only accounting for one). System proposes from listing; she confirms or corrects.
- Excluded items — same read-back-and-confirm
- Contingencies she wants (inspection, financing, etc.)
- Closing date

### Earnest money holder logic (smart default + override)
The engine reads the listing PDF's **broker-to-broker notes** for any special instruction on who holds earnest money. If nothing is specified there, it **defaults to Atlas Title** (our preference). Only deviates when the listing notes actually say otherwise. Same smart-default-with-override pattern as the agency block.

### COMPLIANCE FLAGS — the real value (system carries her brain on the landmines)
Reading the listing PDF isn't just to save typing — it's a **compliance checker** that flags anything triggering a required contingency or disclosure Michele might miss:

- **Well / Septic:** If listing shows non-municipal water or private sewer → flag that a well-and-septic contingency may be required.
- **Lead-based paint (LBPA):** If year built is **1978 or older** → flag that the lead-based paint disclosure must be in the offer to purchase.
- **Pre-approval:** On the buyer-agency side, check whether the buyers actually have a pre-approval on file (drives the financing piece).

*(Keep this list open — add more flags as they surface. This is the highest-value part of the whole build.)*

**Note:** Buyer-agency intake and offer intake are **separate**. Pre-approval status is captured at buyer-agency intake and referenced at offer time.

### The one thing that never changes
Karl proofs every voice-drafted doc before it touches a client. A mis-heard number in a spoken offer is a live liability. Voice is a **first-draft generator**, never the final word.

---

## PART 6 — WHERE IT LIVES (system architecture)

The tool matters less than the habit. Three layers, each doing one job.

### Layer 1 — Michele's dump (simplest thing she'll actually use)
One dead-simple place to drop offer info, **address first**. A text message, voice note, or shared note — something with zero learning curve. That's her whole world. She never touches a "system."

### Layer 2 — Karl's drafting workspace = Airtable (row per deal)
Karl thinks in **rows/spreadsheet**, so Airtable (a spreadsheet with superpowers) is the fit. One row per live deal; columns for address, price, earnest money, included/excluded items, contingencies, closing date; **status flags** that light up for what's missing or when a compliance flag fires. Karl works from the spreadsheet view, sees all live deals at a glance, pulls the PDF, and the draft fills in. John already runs Airtable — new use, not a new system.

### Layer 3 — The transaction project = system of record (unchanged)
**Airtable is NOT the transaction system.** It's only the pre-offer **drafting/staging area**. The moment the offer is finalized, proofed, and signed, it flows into the **transaction project** exactly like every other deal. Drafting lives in Airtable; the real transaction lives where it always has. Do not duplicate or replace the transaction project.

**The line:** Airtable = messy drafting stage -> Transaction project = official record.

---

## THE FULL CHAIN (one picture)

```
PHASE 1 (build now):
Michele fills intake form (90 sec)
        ↓
Clean data lands in Google Sheet (Karl watches)
        ↓
Karl runs downstream

PHASE 2 (after she proves she'll use the form):
Fillable PDF templates built (freelancer, one-time)
        ↓
Cowork fills template from intake data
        ↓
Karl PROOFS every doc — especially strike-throughs
        ↓
Signed via zipForm / Real's platform / DocuSign (platform-agnostic)

PHASE 3+ (the vision - living-draft model):
Michele dumps offer info (ADDRESS = required anchor) via text/voice note
        v
Lands as a row in Karl's Airtable (drafting workspace) - living draft starts
        v
Human (John/Karl) grabs listing PDF from Paragon (10-sec manual, not brittle auto-nav)
        v
Engine reads PDF: populates fields, reads back included/excluded items to confirm,
   pulls earnest holder from broker notes (else defaults ATLAS TITLE),
   fires COMPLIANCE FLAGS (well/septic, pre-1978 lead paint, pre-approval)
        v
Draft flags back to Michele what's still missing - she fills blanks when ready
        v
Karl PROOFS  ->  sign  ->  flows into TRANSACTION PROJECT (system of record)
```

---

## THE HARD LINE (your words, and they're fair)
You've built her a division-of-labor doc, put Karl on it at 10% off the top, and now a 90-second intake. At some point "I need more help" has to meet "here's the one thing I need *you* to do." Build only the intake first. Hand it over. Watch whether she uses it on one real deal. If she does — build the rest. If she won't do even the 90-second version, you've got your answer, and you saved yourself the wasted build. Clear expectations are respect, not being a dick.

---

## BUILD STATUS — DONE (as of this session)

**Airtable base "IH Offer Drafting System" is built and live**, moved into the **Integrity Homes Ops** workspace (entity separation clean, no ROH crossover). Three tables:

1. **Offer Drafting** — Karl's living-draft workspace. Property Address = required anchor. All fields built: municipality type, buyer names, purchase price, earnest money amount + holder (defaults Atlas Title), included/excluded items (read-back-and-confirm), contingencies, closing date, financing type, pre-approval status, year built, additional provisions, listing PDF attachment, draft status tracker, "Still Needed From Michele" flag-back field, Karl notes. Three red compliance flags: Well/Septic, Pre-1978 Lead Paint (LBPA), Pre-Approval Missing.
2. **Buyer Intake (Pre-Agency)** — Form A source table.
3. **Listing Intake (New Listing)** — Form B source table.

### LAST STEPS TO GO LIVE (do these in Airtable — ~5 min)

**Make the two forms:**
1. Open the **Buyer Intake (Pre-Agency)** table.
2. Left panel → click **+ Create** near the views list → choose **Form**.
3. Set required fields: **Client Name(s), Best Phone, Email**.
4. Click **Share form** (top right) → copy the link. That's Michele's buyer link.
5. Repeat for **Listing Intake (New Listing)** table. Required fields: **Property Address, Best Phone**. Copy that link too.

**Hand it to Michele (the line):**
> "This is the one thing I need from you. The second you've got a new buyer or a new listing, fill the form. That's it — Karl takes it from there. No form, no Karl."

**The test:** Watch whether she fills it on ONE real deal. If yes → green light to build Phase 2 (fillable PDFs + voice). If she won't do even this → that's the answer, and you saved the wasted build.

### NOTE ON THE CONNECTOR
The Airtable connector in Claude is scoped to the ROH workspace only. Once the base moved to Integrity Homes Ops, Claude can no longer reach it directly from here (expected). To have Claude work inside this base later (e.g. build the Phase 2 automations), re-authorize the Airtable connection with access to the Integrity Homes Ops workspace.

---

## FINAL 2-MINUTE STEP: MAKE THE FORMS (do on your screen)

The base is built and in Integrity Homes Ops. Only the two form views remain. Claude can't build these via browser automation (Airtable's canvas UI isn't reachable by the click layer), so do this manually — it's fast:

**Buyer form:**
1. Open the **Buyer Intake (Pre-Agency)** table.
2. Left view list → under **Forms** → click **Create new** (makes a Form view).
3. Toggle **Required** ON for: **Client Name(s)**, **Best Phone**, **Email**.
4. **Share form** (top-right) → **Create shareable link** → copy. = Michele's BUYER link.

**Listing form:**
5. Open the **Listing Intake (New Listing)** table.
6. Under **Forms** → **Create new**.
7. Toggle **Required** ON for: **Property Address**, **Best Phone**.
8. **Share form** → **Create shareable link** → copy. = Michele's LISTING link.

**Then hand both links to Michele with the line:**
> "Fill the form the second you've got a new buyer or a new listing. That's the one thing I need. No form, no Karl."

Then watch whether she uses it on one real deal. That's the whole test.
