# Integrity Homes — Listing Intake & Launch System

Built from our call, July 26 2026. This is the full listing-side spine: the dead-simple front door for Michele, the two-gear "probably then signed" model, and the backwards-scheduled launch engine that fires off the live date.

**Core principle:** Michele's job is 90 seconds. The system absorbs all the complexity so she experiences it as "I said a few words and my listing got handled." The sophistication stays invisible.

---

## THE THREE-GEAR SHAPE

1. **Phase One — Barebones intake (the "probably" stage).** Michele dumps almost nothing. Effortless on purpose. Creates a placeholder record and fires the two things that only need an address.
2. **Phase Two — Signed listing agreement (graduation).** The placeholder becomes the full address MD file. Back-office lane and go-to-market lane both kick off.
3. **Phase Three — Backwards schedule off the live date.** Everything back-schedules from go-live so nothing runs late.

---

## PHASE ONE — THE FRONT DOOR (Listing Intake)

The whole thing Michele fills. One breath, walking to her car.

**Required fields:**
- Property Address (the anchor)
- Seller Name(s)
- Email
- Phone
- Anticipated List Date

**Optional:**
- Anything we should know (catch-all dump)

> Note: wording is "anything **we** should know," not Karl specifically. Future-proof, and neutral so it doesn't rub the Karl question in Michele's face. Make the same swap on the BUYER form.

**What fires immediately off Phase One (only need the address):**
- **Title** — notify the title company: "possible new listing, here's the address, please run a title search." Automatic notification.
- **Assessor / property tax pull** — manual search (no county/state API). Creates a to-do assigned to Karl the moment the address lands. System's job is to *remember and assign*, not to do it.

Everything else waits for the signed contract.

---

## PHASE TWO — SIGNED LISTING AGREEMENT (the MD file is born)

The signed agreement is the trigger, NOT MLS go-live. Signing is when it's legally real and yours, and it's when prep actually needs a home. The address MD file is created here — one per address, same pattern as the transaction side. It's the single source of truth: intake info, seller Google Form answers, and all notes resolve into it, no matter which system they started in.

**Date anchor logic:** Anticipated List Date drives the triggers early (it's all we've got). The moment the contract is signed we know the real live date, and the ACTUAL live date supersedes the estimate. Everything re-anchors from guess to confirmed.

### Back-office lane (runs parallel, right after compliance)
1. **Contract + compliance review — YOUR approval.** The gate. Nothing downstream unlocks until this clears. This is where sloppy paperwork gets caught *before* the 9pm scramble.
2. **Rezen input** (Real broker platform) as a new listing — only AFTER your approval.
3. **Home warranty** — order if applicable (simple yes/no branch).
4. **Property info hookup** — feeds the MLS profile sheet.
   (Title + assessor already started back in Phase One.)

---

## PHASE THREE — BACKWARDS SCHEDULE (off the live date)

Set the live date, count backwards, every task gets its slot. Construction-schedule logic applied to a listing launch.

### Data track (early, independent of photos)
- **MLS profile sheet** done within a few days of signing.
- Everything entered into **MLS in partial / incomplete status** — all info staged, disclosures loaded (docs already approved).
- **Seller verification loop:** MLS sheet sent to seller to confirm everything's right — no questions, no changes — before it ever goes live. Quality gate most agents skip.

### Photo track (joins late — the critical path)
- Target photos **3–7 days before live** (ideal).
- **Flagged as CRITICAL PATH** — the highest-risk item, the long pole. If photos slip, the system flags loud, because MLS/video/marketing all depend on them. Photos late = launch late.
- System must handle the compressed real-world case (photos Tuesday, live Wednesday) without breaking — just runs downstream on a tighter clock.
- Because everything else is pre-staged, photos are the LAST puzzle piece: snap them in, minutes from live, not days. Photos become the *trigger* for launch, not the thing that delays it.

### Sign install (the "no sooner than" constraint)
- Unique rule: the sign legally can't go up before the listed date. Earliness is a *problem* here, unlike photos.
- **Book** the install 3–7 days ahead (ordering lead time), but pin the actual **drop date** to on-or-after the live date. Two dates for one task: when you book vs. when it lands.
- **ACTION ITEM:** confirm with Action Signs whether they support a "no sooner than" date. If yes → automate. If no → manual trigger tied to go-live.

### Go-live
- MLS flips from partial to active on the live date. Everything was already loaded and waiting.

---

## WHAT MICHELE ACTUALLY SEES

Design principle: Michele sees almost NONE of the engine room. She's a driver, not a mechanic. Showing her the full flow recreates the exact overwhelm that made her avoid the old flow guide.

She sees exactly two things:
1. **The front door** — the 90-second intake. Dump it and walk away.
2. **A dead-simple status view** — where the listing IS, not the 40 tasks underneath. E.g. "Maple Street — prepping, photos Thursday, live Monday." One glance: green (on track) or red (needs you). She never sees who's pulling assessor data or whether title's back.

The system absorbs the complexity so she experiences effortless magic — exactly what she got excited about with the voice idea.

---

## OPEN ITEMS / NEXT AT THE DESK
- Finish the two Airtable intake forms; grab the buyer share link (buyer form already built + published).
- Swap "anything Karl should know" → "anything we should know" on the buyer form.
- Confirm with Action Signs re: "no sooner than" install date.
- Wire MD-file creation to the signed-contract trigger.
- Build the marketing/launch sequence off the (anticipated → actual) live date.
- Consolidate scattered pieces (existing seller Google Form questionnaire) so they resolve into the address MD.
