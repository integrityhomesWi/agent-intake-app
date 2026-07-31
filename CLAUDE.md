# CLAUDE.md — Integrity Homes Agent Intake App

This file is the project constitution. Read it before every task. Keep it followed, not skimmed. Do not expand it into a novel; if something here is wrong or outdated, ask before changing it.

## What we're building

A voice-first intake web app for Integrity Homes real estate agents. An agent picks one of three intake types, taps a mic, and just talks. The app transcribes speech, parses it into structured fields, flags any missing required info, and saves a clean markdown intake file into a specific Google Drive folder. It must work on iPhone and Android as a hosted web page (no app store, no install) — the same model as a published HTML link.

The front end is three static HTML files: `index.html` (the launcher/front door, so GitHub Pages serves it at the site root), `intake.html` (the voice/type/fill-in-blanks intake app), and `command-center.html` (the live dashboard). The backend is built: `google-sheets-backend.gs` runs as an Apps Script web app and files each intake straight into the IH Live Transaction Tracker sheet, which is the source of truth (see the data model note below).

## Who uses it and why

- Michele (new agent) and eventually all agents. High volume, hates forms, lives on her phone. The whole design bet is: she talks, the system does the rest.
- The app is the front door of the transaction pipeline. An intake file is the trigger that lets the back office start work. No intake file, no back-office work.

## The three intake types and their REQUIRED fields

Every required field uses the same rule: **prompt if missing, allow submit anyway, flag clearly on the file.** Never hard-block the agent. A missing field becomes a visible flag, never a hidden gap.

1. **Buyer** (new buyer — Agency or Pre-Agency Showing Agreement)
   Required: Client name(s), Best phone, Email, Pre-approval status.
   Optional: Price range, Areas/must-haves, Notes.

2. **Buyer-Offer** (buyer writing on a specific house — fires Karl to draft)
   Required: Buyer name(s), Best phone, Email, Property address, Offer price, Pre-approval status, Close date, Earnest money.
   Optional: Notes.

3. **Seller** (new listing)
   Required: Property address, Seller name(s), Best phone, Email, Anticipated list date.
   Optional: Notes.
   Listing logic: fires title + assessor pull off the ADDRESS only; everything else (MLS, photos, disclosures, sign install, Rezen, home warranty) waits for the signed listing agreement.

## File output rules

- Markdown files, one per client/property (current-state, not append-only logs).
- Where a finished intake goes: a new ROW in the tracker sheet, not a file.
  - Buyer-Offer to `Active Transactions`
  - Seller to `Listings`
  - Buyer to `Buyer Leads`
- Missing required fields are written into that row's flags/notes column as `MISSING: <field list>`, so the back office sees the gap without opening anything.
- The markdown file the app builds on screen is now only a manual fallback, shown behind "Copy file" for when the connection is down. It is not filed anywhere automatically. Its naming (`INTAKE-Buyer-[LastName].md`, `INTAKE-Offer-[LastName]-[address-slug].md`, `INTAKE-Listing-[address-slug].md`) and its `*** MISSING — required ***` markers still apply to that copy.
- The old Deal-Files folder (`1ybN83Xpqq_0bWyEhASKzangkp45xF2XS`, `8 - Transaction Coordination/Deal-Files/`, owner john@integrityhomeswi.com) is historical reference only. Nothing writes to it.

## Lane map (the system this plugs into)

- Michele / agent — owns the trigger only (the intake). Never touches the back office.
- John — compliance gate. Reviews and approves contracts before anything goes live.
- Karl — contracts, assessor/tax pull, getting docs out for signature.
- Lindsay — MLS build, disclosures, orders photos, takes listing live.

## Standing brand rules (never violate)

- Brand name is always "Integrity Homes." Never "Integrity Homes Wisconsin." Legal name "Integrity Homes of Wisconsin" only in legal/JSON contexts.
- No em dashes anywhere.
- Phone: 608-669-4226.
- Keep it simple and non-technical in anything the agent sees. The agent should never see the app's guts — same treatment we give Michele.

## Decisions already made (do not re-litigate without asking)

- Front end is a single HTML file, already built. Do not redesign it without asking.
- Storage is the "IH Live Transaction Tracker" Google Sheet. Airtable was considered and rejected. Do not reintroduce it. Markdown deal files in Drive were the earlier plan and are retired as a source of truth (see the data model note below).
- The app connects to Google Drive through its OWN Google credentials (not the Claude/Cowork connector, which had write problems). Set up a clean, correctly-scoped Google connection for the app.
- Required-field behavior is prompt-if-missing, never block.
- Retired systems — do NOT reference or wire to: Bolt (Real Brokerage transaction platform), ClickUp, the old Firebase transaction app. The new system is the replacement for this tracking; it does not integrate with any of them.
- Data model (source of truth): the **"IH Live Transaction Tracker" Google Sheet IS the source of truth**, decided 2026-07-29. Sheet ID `1HJZPXHP8y8cUdANbuiw916c8WLj66KYW8Qo_jSJ9oIs`. Tabs: Active Transactions, Listings, Buyer Leads, Closed 2026, Goals & Pipeline. It is a LIVE system, not an import. One Apps Script web app ("IH Sheets Backend") is the only thing that reads and writes it. The intake app appends a row (Buyer-Offer to Active Transactions, Seller to Listings, Buyer to Buyer Leads); the Command Center reads the sheet live and writes edits back into the same row. No Bolt/import step, no separate database.
  Why the sheet and not markdown files: John and Lindsay already work in the sheet every day, it holds things markdown cannot (live formulas for Days Out, auto-counting goals) and things the deal files never had (18 listings, 33 closings, cap and pipeline). The markdown Deal-Files plan is **retired as a source of truth**. Existing deal files are historical reference only. Do not write to them and do not reintroduce them as a second source.
  Deal IDs (IH-YYMM-NNNN, see WB-11-Build-Spec.md) are not currently assigned by the sheet backend. Rows are identified by the value in the first column (address, or client name on Buyer Leads). Revisit if IDs are needed.
- Parallel Claude Code sessions (ruling 2026-07-30, final, overrides anything earlier): John runs more than one Claude Code session against this same project. They are split by a hard line with zero file overlap.
  - Code/specs session (this one): owns every file in the repo — `google-sheets-backend.gs`, `index.html`, `intake.html`, `command-center.html`, `CLAUDE.md`, and every other `.md` spec doc. Deploys the Apps Script backend.
  - Data-entry session: owns only the row/cell data in the IH Live Transaction Tracker Sheet, filling gaps from documents in the "Catch-Up Docs (Michele)" Drive folder (`1i5PsNcgKD-3dvHUy6cAXuo-b69dQmtI2`). Never opens the Apps Script project or any repo file. Before writing a cell it must GET `?action=list` and use the exact key string returned (address/name matching is a literal string compare, not fuzzy) and it never creates new rows through the endpoint (browser-only for that) — the `save` action only updates a row that already exists.
  - Why: on 2026-07-29 two sessions editing `google-sheets-backend.gs` at the same time silently overwrote one session's in-progress paste with no error. The fix is a lane with no shared file, not more caution within a shared one.

## How to work with John

John is the owner, not a developer. Explain steps in plain language, one at a time. When something needs his hands (accounts, credentials, approvals), say so clearly and tell him exactly what to click. Keep the project folder clean and small. Ask before doing anything irreversible.
