# The System Brain - Consolidated Notes

Notes for the Claude Code build side. This is the "why" behind the transaction tracker + intake system. It captures three voices (John, Michele, Karl) and the core insight that emerged from all of them.

Companion files: `CLAUDE.md` (project constitution), `WB-11-Build-Spec.md` (offer-drafting engine spec), `michele-intake-system.md` (full phase 1-3 design), `intake.html` / `index.html` (the built intake app).

---

## THE SPINE: Nothing Falls In A Hole

Everything in this system hangs off one backbone: **nothing requested can silently disappear.** Every open item stays visible until it's done, and stale items wave their hand.

This is the real product. Not the 90-second intake. Not the translator. Not the magic button. Those are all features hanging off this one spine.

**Why this is the spine (the proof):** Michele asked for an amendment on a listing contract and didn't realize it wasn't done for **two weeks**. Nobody noticed. That's the whole problem in one story. It wasn't a speed failure (a real deadline would've been caught in hours). It was a **visibility failure** - the request fell into a void with no confirmation of receipt, no visible "in progress," no flag when it went stale. She felt the relief of handing it off, and then it died quietly.

The number one job of the system: **make work impossible to lose.** Everything requested is visible until it's done. Stale things age and flag themselves. Anyone - John, Michele, Karl, or the system itself - can see the state of every open item at a glance.

---

## THE THREE VOICES (same missing machine, three seats)

Nobody is the villain. Three people are describing the same missing machine from three different chairs.

### John (owner / decoder / referee-by-default)
- Built a division-of-labor doc, put Karl on it at 10% off the top, still couldn't get the handoff clean.
- Is currently the human decoder in the middle of every deal - can translate Michele's rapid-fire buckshot because he's experienced. That doesn't scale.
- Is the referee-by-default every time the Michele/Karl expectation gap flares. Wants OUT of the middle.

### Michele (high-producer, rapid-fire, phone-native)
- High volume, sloppy paperwork, lives on her phone, hates forms, talks in rapid-fire buckshot all day.
- Her stated pain is communication/follow-through, not forms. She wants to just tell someone "send this amendment / reduce this price" and have it happen.
- Names Karl as the bottleneck repeatedly - things get dropped, she thinks he sent stuff he didn't.
- **The rollout spark (critical):** When she saw the app, what lit her up was NOT the intake (the give side). It was the **get side** - "wait, I can push a button on my phone and ask when the inspection deadline is? When's closing?" That's the payoff that answers her actual daily pain. She talks to every client all day repeating the same info. A button that instantly gives her any deal detail is a weapon, not a chore.
- Started the rollout frustrated (John sprang it on her cold, "what's my name?" with no warning). Got past it fast. Useful stress test - proved it works even when someone's caught off guard.

### Karl (backend, contract, newer, no system)
- Contractor (NOT an employee), 10% off Michele's commissions. Drives Hartford to Marshall, computer at home, works off memory with no system telling him what's due.
- **His big contribution: the address does the heavy lifting.** Don't make Michele supply what the listing already publishes. She gives the property address, the engine pulls the rest off the MLS. Her spoken input shrinks to four things: address, purchase price, contingencies, earnest money.
- **His refinement on what still must come from her:** included/excluded items have to come from Michele (buyer conversation, system can't guess). Earnest money holder he can pull from the MLS listing.
- He is NOT the problem Michele thinks. He made the design *better* in the room. His "drops things" is a no-system failure, not a laziness failure. Give him a system that says do-this-this-this and most of what Michele's mad about likely disappears.

**The reframe:** Michele fumbles the handoff. Karl's had no system to make her handoff clean. Both true. Neither is the villain. The missing machine is.

---

## THE KEY INSIGHTS (in the order they clicked)

### 1. Lead with the GET, not the GIVE
The way to get Michele to adopt intake is to sell her the button (ask-it-anything about any deal), not the slip (the 90-second intake). She'll put the deal in *because* putting it in is what unlocks pulling it back out on demand. Intake stops being homework and becomes the price of admission to her superpower. **Don't sell the slip. Sell the button. The slip rides along.**

The two halves lock together: the magic button only works for deals that were actually put in. The carrot does the enforcement - no nagging required.

### 2. The system is a TRANSLATOR, not a filing cabinet
Michele talks in rapid-fire buckshot. John can decode it (experienced). Karl can't yet (newer). Right now John is the human decoder in the middle of every deal, and that doesn't scale - every mistranslation to Karl is a dropped ball, which is exactly what Michele blames him for.

Put the voice layer in the middle to do the decoding a human is currently expected to do. She fires "need a price job on Buffalo Trail, drop it five." System turns it into a clean structured order: price reduction, 6517 Buffalo Trail, new price $X, drafted and ready. Karl stops getting buckshot and starts getting clean orders. The thing she blames him for mostly evaporates.

**Reframe: it's not "make Michele do intake." It's "put a translator between Michele's mouth and Karl's task list."** She stays exactly who she is. Karl stops needing to be a mind reader. John stops being the decoder.

### 3. Confirmation on BOTH ends
Not the same check twice - two different checks:
- **Michele confirms** = "did the system hear me right" (catches the misheard number).
- **Karl confirms** = "do I understand this before I touch a live contract" (catches the "she can't reduce a price on a listing that isn't signed yet" logic errors).

Drop either and you lose a whole class of safety. Flow: Michele fires buckshot -> system decodes, reads it back to her, she says yep -> clean order lands in Karl's queue -> Karl sees a structured task not a riddle, confirms, executes -> the deal's MD file updates as a byproduct.

**Latency caution:** Both-ends confirmation is right, but the confirms must be near-instant (a glance and a tap). Michele's whole complaint is "I need it now." If the round trip is slow, she routes around it and just calls Karl like always. The system has to be faster than picking up the phone, or it loses to the phone.

### 4. Updates are the hard physics problem
Each transaction gets its own MD file, read and written to. The limitation isn't intake - it's **updates**. "Talked to Joe Smith, pushing closing two days." "Waiting on this, waiting on that." For it to be a true all-in-one brain that remembers everything, it has to get used close to 100% of the time or it breaks.

**A brain fed only sometimes is a liar.** If she updates 80% of the time, the missing 20% is worse than no system, because now everyone trusts a file that's quietly wrong. She asks "what's the closing date," it confidently gives the old one, nobody double-checks because "the system knows." It doesn't break loud. It breaks silent.

**The fix: capture has to be a byproduct, not a decision.** Stop thinking "her remembering to update the file" (that always leaks). The winner is the **same magic button, both directions** - she already wants to pull info by voice, so the same voice line becomes the update. "Talked to Joe Smith, pushing closing two days." One sentence, hands-free, in the car, the moment it happens, file writes itself. It rides on the pull habit she's already excited about, and it removes the human relay entirely (routing updates through Karl reintroduces the exact handoff gap that started this mess).

### 5. Expectations are the part no software fixes
Nothing in real estate dies in five minutes. A live counteroffer with a clock is the rare exception; almost everything has a same-day or multi-hour window. Michele operating like every request is a five-alarm fire is a story in her head, not a fact of the business (proven by the two-week amendment - real urgency would've been caught at hour three).

Karl is a contractor, not a 24/7 employee she owns. Those two beliefs collide with no referee, and John is the referee by default every time.

**Ground rules are the actual fix, not admin housekeeping.** Standard turnaround = same business day / within X hours during work hours. True emergencies (live counteroffer with a clock) = a separate urgent lane, and "urgent" means something because it's rare. Karl's hours are Karl's hours.

**The system can carry the expectation so the humans don't fight about it.** When Michele fires a request, it timestamps it and sets the agreed clock. Karl sees "due by end of day," not a panicked voicemail implying now-or-death. If genuinely urgent, she marks it urgent (rare, so it means something). The software becomes the neutral third party holding the turnaround standard - it's not Michele vs Karl anymore, it's both of them against the same clock. **This takes John out of the middle, which may be the biggest personal win in the whole thing.**

Open question flagged honestly: will Michele respect a written turnaround rule, or treat everything as urgent anyway? The two-week amendment says the "I need it now" energy is emotional, not operational - which actually means the fix is visibility, not speed.

---

## HOW IT ALL BREATHES (one picture)

```
Michele fires buckshot by voice (pull OR update, same button)
        |
System DECODES it into a clean structured instruction
        |
Reads it back to Michele -> she confirms ("yep")   [check 1: heard right]
        |
Clean, timestamped order lands in Karl's queue with agreed turnaround clock
        |
Karl sees a structured task (not a riddle), confirms  [check 2: makes sense]
        |
Karl executes
        |
Deal's MD file updates as a BYPRODUCT (nothing re-keyed, no form filled)
        |
Every open item stays VISIBLE until done; stale items flag themselves
        |
Michele's magic button can now answer anything about the deal from her phone
```

Capture -> decode -> confirm (both ends) -> execute -> log -> visible until done. Nobody sat down and filled out a form. Nothing fell in a hole.

---

## WHAT THE SYSTEM'S NUMBER ONE JOB ACTUALLY IS (ranked)

1. **Nothing falls in a hole** (visibility - the spine). Every open item visible until done, stale items flag. This is what rebuilds trust between Michele and Karl.
2. **Translator** - turn Michele's buckshot into clean orders so Karl can execute and John stops decoding.
3. **The magic button** (get side) - ask anything about any deal from her phone. This is the adoption hook.
4. **90-second intake** (give side) - the trigger that feeds everything. Rides in on the magic button.

Note the intake is LAST, not first, in importance. It's necessary but it's not the product. The product is that work becomes impossible to lose.

---

## THE ONE THING THAT NEVER CHANGES

Karl proofs before anything touches a client. A translator that mishears is more dangerous than no translator, because the clean-looking output invites trust. Voice/buckshot decoding is a **first-draft generator**, never the final word. That's what the two-end confirmation and Karl's proof gate are for.

---

## STILL OPEN (decide as we build)

- Where the source of truth lives so the phone can query it reliably (leaning: the Claude Code transaction tracker - per-transaction MD files, read/written by the system). The moment the button says "I don't have that," the magic dies - so the source must be dead current, which loops back to the update-capture problem (#4 above).
- Exact turnaround numbers for the ground rules (X hours), and the urgent-lane definition.
- Whether Michele will actually use it 100% of the time. Everything rides on this. Build it, hand it over, watch. She'll show the answer fast (the rollout spark is the encouraging early signal).
- New build items surfaced from Michele's in-car transcript, to fold in later: (a) seller-intake sign-ordering trigger (active date -> backward task chain, order sign ~7 days prior + reminder); (b) the Monday "Don't Fire Me" listing-activity report (own product - she lit up at it); (c) amendment / price-reduction request flow (speak it -> drafts email/order to the right person). The price-reduction one is literally insight #2 (the translator) in action.


---

## HARD RULE: No step depends on a human remembering to come back later

The single most dangerous moment in the whole flow is any step that says "and then someone goes back and hits send / finishes it later." That is the two-week amendment failure in a new spot. Michele (or anyone) fires the request, feels the relief of handing it off, and the draft sits there unsent. Same hole.

**The rule: everything happens in the moment, or the system does it automatically.** Never leave a human holding a "come back later and send it" step.

### Why this forces the Code side's own send capability
This chat's Gmail connector can only DRAFT, not send. So if the flow ends at "Michele goes to her drafts and sends," it's broken by design - she's the one who forgets. The Claude Code build uses its own Google credentials, so it can actually SEND the email itself the moment she confirms. No drafts folder, no remembering. This is the concrete argument for wiring the Code side's own send capability - it closes the exact gap.

- Confirm = one tap in the moment (this works, people do it).
- "Remember to go back to your drafts folder later" = the thing that never happens (this is what kills deals).

### Notifications (settled direction)
- Shared transactions channel = single source of truth (serves "nothing falls in a hole" - if it's scattered across three personal inboxes, things hide).
- Layer notifications on top to tap the right person on the shoulder. The channel holds the work; the notification says "your turn."
- **Start simple:** plain email to their phone (free, instant, zero setup). If email nudges get ignored, step up to Twilio real texts (pennies each). Save push-notification web app for when it's proven and you want polish. Same discipline as not automating the Paragon grab - don't build the fancy part before you need it.

### Action SOPs (the next build, when John's at a screen with the forms open)
Every action type gets its own short SOP that the system uses to INTERVIEW Michele - she never reads it, it just knows what questions to ask when she leaves something out.

Price reduction is the first/cleanest one. Required fields: property address, seller names, current price, new price, date out for signature, date to go active. Michele says "reduce Buffalo Trail 25 grand," system checks the SOP, sees it's missing the effective date, asks only that, reads it back, she confirms.

**Two faces from the same data:**
- **Michele's face** = plain-language interview ("reduce Buffalo Trail 25 grand, effective when").
- **Karl's face** = line-referenced work order, Barney-style ("line 1 gets the address, line 3 gets current price, line 5 gets new price"). No decoding, no deciding - he transcribes from numbered list into numbered slots. Near error-proof, and it teaches him the form fast.

**Build the SOPs with the actual form open** (not from memory while driving) - John reads the line numbers once, calmly, and it's locked forever. Every future one runs off the locked SOP instead of John's memory. Once price reduction works, every other action (amendment, extension, counteroffer) is the same machine with a different checklist.

---

# SESSION 2 ADDITIONS (ground rules, email-reading, permissions)

Everything below was decided in the drive-time conversation after the hard-rule section above. These are settled directions unless noted.

## GROUND RULES: turnaround clock (settled)

Tie the clock to WHEN the request comes in, not one flat number. Simple enough to hold in your head, which is what makes it stick.

- **Morning request -> done by end of business day.**
- **Afternoon / evening request -> done by noon the next business day.**

This deliberately gives Karl his evening back (he's a contractor, computer at home, drives all over). A 4pm request rolls to noon tomorrow, stated up front so nobody's guessing or resenting.

- Cutoff between morning/afternoon: TBD (probably straight noon - John to confirm).
- The system holds the clock so it's Michele + Karl vs the same agreed time, not Michele vs Karl. Takes John out of the referee seat.

### Urgent is its own lane (and stays RARE)
Urgent is a **definition, not a mood.** There's a real external clock ticking - a counteroffer that expires, a deadline that hits today, something where waiting actually costs the deal. "I want it now because I want it now" is NOT urgent. Keep urgent rare or it stops meaning anything and you're back to five-alarm-fire energy on a price change that could've waited.

Key insight: most of Michele's urgency isn't about the task, it's about not knowing if it was received. Give her the receipt + the visible clock and the fake urgency mostly evaporates on its own. Real urgent stays rare, which keeps it powerful.

## STEP ONE (before Michele touches anything): STOCK THE SHELF

The magic button dies the first time it says "I don't have that." She won't ask a third time. So before she ever touches it:

**Every live listing and every live transaction of Michele's needs an MD file, loaded and current.** The button only feels like magic if the shelf behind it is fully stocked. Empty shelf = dead product. This is grunt work (screen work, a sit-down job for John/Karl/Lindsay - NOT a highway task), and it's the unglamorous thing that makes or breaks her trust. Do it before handing her anything.

## THE EMAIL-READING PIECE (turns filing cabinet into something that knows the deal)

The system knows what got ENTERED. It doesn't know what got DISCUSSED. In real estate ~90% of a deal lives in the email back-and-forth (e.g. a price cut floated on 727, kicked around, killed). If the button doesn't know that conversation happened, it gives a confident wrong half-answer - the liar problem again. So reading the email thread isn't a nice-to-have; it's what makes the button smart instead of just a voiced filing cabinet. Bonus: the emails ARE the updates, happening whether Michele remembers to log them or not - so email-reading quietly solves the update-capture problem too.

### How the system knows which email belongs to which deal
- **John already sorts everything into Gmail folders/labels** (one per transaction, mostly named by address + last name, or last name only). The sorting is already DONE - the system doesn't need to guess, it just reads the right folder. This is the key that unlocks the whole email-reading piece.
- These are **Gmail labels/folders inside Gmail**, NOT Google Drive folders. (Important for the Code side.)
- **As of today, John told everyone: property address goes in the subject line going forward.** So every email from here out is self-sorting. Old threads need a messier one-time backfill, then it's clean forever.
- Matching keys, in order: address in subject (primary) -> chunk of address / buyer last name / buyer full name / client or lender email (backup net) -> no match = flag for a human glance, never guess wrong.
- **Folder naming convention:** rename the Gmail folder to match the deal ID (`IH-YYMM-NNNN`) or the address when the deal is created. Five-second one-time move per deal, clean forever. This is the bridge: folder name matches deal key -> system opens the right folder -> reads the thread -> knows the story.

### Don't count on humans being consistent (the salad problem)
Telling the team "put the address in the subject" is like telling people to eat a salad every day - Michele especially is a firehose and will splatter. So the backup net has to actually work, not just exist. But the folder system + authorize-their-email approach (below) mostly routes around needing Michele to change her habits.

## MULTI-INBOX PROBLEM + SOLUTION (settled)

The deal conversation isn't only in John's inbox - it's in Michele's, Karl's, the lender's, title's. John's folder is only John's side of the thread.

Options considered and **rejected:**
- Shared transactions CC/BCC inbox -> REJECTED. One more inbox for John to manage. Hard no.
- Everyone CC's John on everything -> HARD NO. John is trying to get OUT of the middle, not become the email funnel.

**DECISION: Michele and Karl each authorize the system to read their Gmail, once.** Same authorization pattern as connecting Google Drive - one setup step per person, never think about it again. System then reads all three inboxes' deal folders and assembles the full picture. No new inbox, no CC habits to enforce, no extra box for John.

## PERMISSIONS MODEL (settled - capture before Code builds the access layer)

Once the system can read Gmail, an app user could in theory ask a question that pulls from an email OUTSIDE their deals (client financials, another agent's transaction, personal mail). So: **access needs guardrails, not just a login.**

### The fence (deal-level AND person-level)
- The system does **NOT** get a roaming pass over anyone's whole inbox. It can only read folders explicitly tagged as **deal folders**, and only answer about deals that exist in the tracker.
- It only opens the folder that maps to the **specific deal** being asked about. Deal ID / address is the key. **No key, no access.**
- **Person-level tiers (three roles):**
  - **Michele / agent** - sees only her own deals. Asks about a deal that isn't hers -> "I don't have that one for you." Clean wall, no drama, no explanation.
  - **Karl / backend** - sees what he needs for the deals he's working.
  - **John / owner** - sees everything.
- Every deal in the tracker has an assigned agent; the system checks WHO is asking before it answers.

### Bonus the permission layer buys you
Karl can't accidentally pull Michele's buyer-side conversation before he should have that context; Michele can't see Karl's backend notes or John's compliance review before it's ready. Everyone sees their lane, nobody sees outside it.

## WHERE THE BUILD ACTUALLY STANDS (John's own read)
The DESIGN (the thinking - the hard 80% nobody sees) is basically done. The visible CONSTRUCTION (intake app, offer engine, tracker, sending, notifications) is maybe a third in - but it's now the KNOWN kind of work ("go build the thing we figured out"), not the scary "what do we even build" kind. Past the scary part.

**Smart-move reminder: don't build the whole monster at once.** Ship one carrot first - the magic button on ONE live deal (fully stocked) - put it in Michele's hands, watch if she bites. If it works, finish the rest. If it flops, you saved yourself building nine parts nobody touches.

## ARCHITECTURE IN ONE LINE
MD file = the structured brain (entered facts). Gmail folder = the conversation history (what was discussed). Deal ID / address = the key that connects them and gates access. Three pieces, one deal, system can answer anything - within the fence.
