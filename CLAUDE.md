# CLAUDE.md — Integrity Homes Agent Intake App

This file is the project constitution. Read it before every task. Keep it followed, not skimmed. Do not expand it into a novel; if something here is wrong or outdated, ask before changing it.

## What we're building

A voice-first intake web app for Integrity Homes real estate agents. An agent picks one of three intake types, taps a mic, and just talks. The app transcribes speech, parses it into structured fields, flags any missing required info, and saves a clean markdown intake file into a specific Google Drive folder. It must work on iPhone and Android as a hosted web page (no app store, no install) — the same model as a published HTML link.

The front end already exists as a single self-contained HTML file (`index.html`). The CURRENT build goal is the backend: let the app save intake files directly into the Deal-Files Google Drive folder.

## Who uses it and why

- Michele (new agent) and eventually all agents. High volume, hates forms, lives on her phone. The whole design bet is: she talks, the system does the rest.
- The app is the front door of the transaction pipeline. An intake file is the trigger that lets the back office start work. No intake file, no back-office work.

## The three intake types and their REQUIRED fields

Every required field uses the same rule: **prompt if missing, allow submit anyway, flag clearly on the file.** Never hard-block the agent. A missing field becomes a visible flag, never a hidden gap.

1. **Buyer** (new buyer lead)
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
- Naming:
  - Buyer: `INTAKE-Buyer-[LastName].md`
  - Buyer-Offer: `INTAKE-Offer-[LastName]-[address-slug].md`
  - Seller: `INTAKE-Listing-[address-slug].md`
- Missing required fields render as `*** MISSING — required ***` in the file so the backend sees the gap immediately.
- Destination: Deal-Files folder in Google Drive.
  Folder ID: `1ybN83Xpqq_0bWyEhASKzangkp45xF2XS`
  Path: `8 - Transaction Coordination/Deal-Files/`
  Owner account: john@integrityhomeswi.com

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
- Storage is markdown files in Google Drive. Airtable was considered and rejected. Do not reintroduce it.
- The app connects to Google Drive through its OWN Google credentials (not the Claude/Cowork connector, which had write problems). Set up a clean, correctly-scoped Google connection for the app.
- Required-field behavior is prompt-if-missing, never block.
- Retired systems — do NOT reference or wire to: ClickUp, the old Firebase transaction app.

## How to work with John

John is the owner, not a developer. Explain steps in plain language, one at a time. When something needs his hands (accounts, credentials, approvals), say so clearly and tell him exactly what to click. Keep the project folder clean and small. Ask before doing anything irreversible.
