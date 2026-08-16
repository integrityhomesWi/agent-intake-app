# CLAUDE.md — Integrity Homes Agent Intake App

This file is the project constitution. Read it before every task. Keep it followed, not skimmed. Do not expand it into a novel; if something here is wrong or outdated, ask before changing it.

## What we're building

A voice-first intake web app for Integrity Homes real estate agents. An agent picks one of three intake types, taps a mic, and just talks. The app transcribes speech, parses it into structured fields, flags any missing required info, and saves a clean markdown intake file into a specific Google Drive folder. It must work on iPhone and Android as a hosted web page (no app store, no install) — the same model as a published HTML link.

The front end is three static HTML files: `index.html` (the launcher/front door, so GitHub Pages serves it at the site root), `intake.html` (the voice/type/fill-in-blanks intake app), and `command-center.html` (the live dashboard). The backend is built: `airtable-backend/worker.js` runs as a Cloudflare Worker and files each intake straight into the IH Transaction Tracker Airtable base, which is the source of truth (see the data model note below). `google-sheets-backend.gs` is the retired predecessor (Google Sheets era) - kept in the repo as historical reference, no longer deployed or written to.

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
- Storage is the **"IH Transaction Tracker" Airtable base**, decided 2026-08-16, superseding the 2026-07-29 Sheet decision below (John's call: better long-term fit than Sheets, e.g. real relational tables and formula fields instead of one giant flat tab). The old Google Sheet ("IH Live Transaction Tracker") is retired as a source of truth but is being left in place to sunset on its own rather than deleted - do not write to it, do not treat it as authoritative, and do not resurrect it as a second source.
- The app connects to Google Drive through its OWN Google credentials (not the Claude/Cowork connector, which had write problems). Set up a clean, correctly-scoped Google connection for the app. (Largely moot now that storage has moved to Airtable, kept for historical context.)
- Required-field behavior is prompt-if-missing, never block.
- Retired systems — do NOT reference or wire to: Bolt (Real Brokerage transaction platform), ClickUp, the old Firebase transaction app. The new system is the replacement for this tracking; it does not integrate with any of them.
- Data model (source of truth): the **"IH Transaction Tracker" Airtable base IS the source of truth**, decided 2026-08-16. Base ID `appVvzwT3K2OTwRgR`. Tables: Active Transactions, Listings, Buyer Leads, Closed Deals, plus Monthly Goals / Quarterly Goals / Annual Settings / Pipeline Notes / Referrals / VIP Clients (the Goals & Pipeline area, split into real tables since it was previously browser-localStorage-only - see command-center.html's Goals & Pipeline section for the historical default values seeded into these). It is a LIVE system, not an import. One Cloudflare Worker (`airtable-backend/worker.js`, deployed as `ih-airtable-backend`, live at `https://ih-airtable-backend.john-4b1.workers.dev`) is the only thing that reads and writes it, holding the Airtable token and the Anthropic API key as Worker secrets so neither ever lives in either app. The intake app appends a row (Buyer-Offer to Active Transactions, Seller to Listings, Buyer to Buyer Leads); the Command Center reads the base live and writes edits back into the same row. No import step, no separate database.
  Why Airtable and not the Sheet: John's call on 2026-08-16, made with the tradeoffs on the table (the Sheet held John and Lindsay's daily habit, live formulas, and everything the deal files never had) - judged a better long-term fit regardless. Some field names changed in the move (e.g. Sheet's `Closing` -> Airtable's `Closing Date`, `Earnest Money` -> `Earnest Money Amount`, `Accepted` -> `Accepted Date`, `Preapproval Deadline` -> `Financing/Preapproval Deadline`); `airtable-backend/worker.js`'s category arrays are the current source of truth for exact field names, not the old `.gs` file.
  Deal IDs (IH-YYMM-NNNN, see WB-11-Build-Spec.md) are not currently assigned by the backend. Rows are identified by the value in the primary field (Address, or Buyer 1 Name on Buyer Leads). Revisit if IDs are needed.
- Claude surface split (ruling 2026-08-16): all code changes for this app happen in Claude Code against this repo, period. Day-to-day operational work (running transactions, accepted offers, anything that isn't a code change) happens in the "IH_Transaction-Tracker" claude.ai Project instead, never in a Claude Code session.
- Parallel Claude Code sessions (ruling 2026-07-30) - **RETIRED as of 2026-08-16, resolved**: this ruling described a second Claude Code session doing data entry directly into the Google Sheet. It has no replacement and needs none: its whole job was Sheet cell access, which no longer means anything now that storage has moved to Airtable, and the Claude-surface split above already covers where that kind of work happens now (the Project, not a second Claude Code session). If that old session still exists somewhere, it's inert - it has no access to Airtable, this repo, or the Worker, so it can be ignored or left to sit unused.

## How to work with John

John is the owner, not a developer. Explain steps in plain language, one at a time. When something needs his hands (accounts, credentials, approvals), say so clearly and tell him exactly what to click. Keep the project folder clean and small. Ask before doing anything irreversible.
