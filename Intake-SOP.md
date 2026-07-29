# Intake System — SOP

**Folder:** `8 - Transaction Coordination/Deal-Files/` (john@integrityhomeswi.com Drive)
**Purpose:** Catch a new buyer or new listing the moment Michele (or any agent) hands it off, as a single markdown file per client/property, so the back office can act without anyone touching a database. This is the front door that feeds the Deal-Files system once a deal goes under contract.

> **RESOLVED (2026-07-29):** John confirmed three intake types are correct going forward: **Buyer** (new buyer — Agency or Pre-Agency Showing Agreement), **Buyer-Offer** (writing on a specific house), and **Seller/Listing**. This SOP predates Buyer-Offer as its own type — see CLAUDE.md and the built app (index.html) for the current three-type spec. The Buyer and Listing sections below are otherwise still accurate.

## Core rule

**No intake file, no back-office work.** Karl and Lindsay do nothing until an intake file exists. The file is the trigger. It means sloppy verbal handoffs don't turn into 9pm scrambles, and it means the agent owns the one thing only she can do — telling us a new deal exists.

## The two intake types

### 1. Buyer intake
Fires when Michele picks up a new buyer. Minimal by design — just enough to open a file and start pre-approval follow-up.

Required: Client Name(s), Best Phone, Email.

### 2. Listing intake
Fires when Michele lands a new listing. The **Anticipated List Date** is the critical field — it drives the entire marketing and launch timeline.

Required: Property Address, Seller Name(s), Best Phone, Email, Anticipated List Date.

## File naming

```
Buyer:   INTAKE-Buyer-[Client-Last-Name].md
Listing: INTAKE-Listing-[Property-Address-Slug].md
```

Examples:
- `INTAKE-Buyer-Thompson.md`
- `INTAKE-Listing-742-Maple-St-Sun-Prairie.md`

## What happens when an intake file lands

### Buyer intake lands →
1. Open the buyer file.
2. Confirm pre-approval status; if none on file, that's the first follow-up.
3. Sits as an active buyer until it converts to an accepted offer, at which point it graduates into a Deal-File.

### Listing intake lands →
1. **Fires immediately off the ADDRESS only:**
   - Notify title company to run a title search.
   - Create Karl to-do: pull assessor / property-tax record (manual — no county API).
2. **Everything else waits for the signed listing agreement.** Do not build MLS, order photos, or install signage off a raw intake. The raw intake only starts title + assessor.
3. When the listing agreement is signed, the file graduates into the full listing-launch sequence and eventually a Deal-File.

## Who does what (lane map)

- **Michele** — owns the trigger only. Hands off the new buyer/listing. Never touches the back office.
- **John** — compliance gate. Reviews and approves contracts before anything goes live.
- **Karl** — contracts + assessor pull + getting docs out for signature.
- **Lindsay** — MLS build, disclosures, orders photos, takes the listing live.

## Notify (interim, manual)

Until an automated ping exists, whoever creates the intake file also drops a one-line heads-up to the right person:
- Buyer → no immediate action beyond the file.
- Listing → ping Karl (assessor) and confirm title order.

Longer-term this becomes an automatic notification on file creation. For now, the file + a manual heads-up is the system.

## Notes

- Same "current state, one file per thing" philosophy as Deal-Files. Not an append-only log.
- Intake files are the FRONT of the pipeline. Deal-Files are the BACK (under contract onward). A deal flows: Intake file → (under contract) → Deal-File.
- The catch-all note field on every intake says "anything we should know" — neutral and future-proof.
