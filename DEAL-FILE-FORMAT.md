# Deal File Format — the one shape everything speaks

This is the contract that ties the whole live system together. The intake app, the
Command Center dashboard, and (later) the offer engine all read and write this same
format. If you change this, change all three.

## The rule

**Each deal is ONE markdown file in the Deal-Files folder, and that file is the source
of truth.** It is live, not an import. The intake creates it thin; it fills out as the
deal moves from new lead to closed.

## What a deal file looks like

Every deal file has two parts:

1. A human-readable summary at the top (so anyone can open the file in Drive and read it).
2. A hidden machine-data block at the bottom, inside an HTML comment, that holds the
   full structured record. The apps read and rewrite this block. Humans ignore it.

```
# 6207 Indian Mound Dr, McFarland — IH-2605-0007

Type: Buyer-Offer · Side: Buy · Agent: John Reuter
Status: Waiting on broker checklist
Price: $780,000 · Close: 2026-07-24 · Accepted: 2026-05-31

## Parties
Buyer: Jacob Scott, Abraham Scott
Seller: Lawrence Davies, Susan Davies

## Milestones
Earnest money: Done · Inspection: done · Radon: done · Appraisal: expired · Financing: expired

## Notes
...

---
Last updated: 2026-07-26

<!--DEAL_JSON
{ ...the full structured record, exactly what the dashboard uses... }
DEAL_JSON-->
```

## The record (what lives in the JSON block)

- `id` — deal id, format `IH-YYMM-NNNN` (assigned by the backend at intake). Names the file.
- `createdAt`, `updatedAt` — ISO dates.
- `intakeType` — how it entered: `buyer` | `offer` | `seller` (blank for migrated deals).
- `addr`, `type`, `side` (Buy/Listing/Dual), `owner` (agent), `team`.
- `price`, `list`, `close`, `accept`, `status`, `em`, `title`, `sched`.
- `ms` — milestones `{em, insp, radon, appr, fin}`. Each is a date, or `done`/`waived`/`expired`/`na`/``.
- `parties` — `{Buyer, Seller, Lender, Title, ...}`.
- `dates` — timeline `[[label, date], ...]`.
- `changes` — counters/amendments `[...]`.
- `notes`, `closed`, `cancelled`, `count`, `lead`, `mls`.
- Intake-captured extras kept for reference: `phone`, `email`, `preapproval`, `names`, etc.

## How the pieces use it

- **Intake app** → sends a record (its fields mapped in). Backend assigns the `id`,
  builds the file, writes it to Deal-Files.
- **Backend (Google Apps Script)** → the ONLY thing that writes the file. `save` creates or
  updates a deal by `id`; `list` returns every deal record for the dashboard.
- **Command Center dashboard** → on load, pulls the live list of records. Every click
  (milestone, title, closing scheduled, status) updates the record and saves it back to
  that deal's file. Same file shows the same thing on phone and desktop.

## Why a hidden JSON block instead of parsing prose

Prose is easy for humans but unreliable for a computer to read and rewrite without
mangling. The JSON block round-trips perfectly, and the human summary on top is
regenerated from it on every save, so the two never drift.
