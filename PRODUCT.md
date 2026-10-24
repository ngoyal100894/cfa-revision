# PRODUCT

Decision record for the feature set. Written 24 Oct 2026, 20 days before Ishita's exam. Scope is sized for **one more builder run (about 3 h of P0 work, 0.7 h of P1), one QA run, 5 content-writer runs and 3 review runs.** Everything else is cut and named below.

Owner's brief, kept front and centre: *solidify learnings and, while she completes the rest of her reading through books, give her a good in-hand revision tool.* The app is a revision companion to the books, not a replacement for them and not a mock-exam engine.

## 1. Goals → sub-goals → features

```
G1 REVISION  "solidify what I've read, keep it from fading, see the whole map"
├─ 1a Quick flash recall ........ retrieval practice beats rereading; one tap, one answer, immediate feedback
│     Today's 15 · Must-remember · Quick-calc · Weak spots
├─ 1b Don't let it fade .......... spacing: a miss returns next session, a hit returns in 2 then 4 days
│     Leitner 3-box scheduler (done) · Lucky guess (schedules a fluke as a miss)
├─ 1c Breadth across 93 readings . interleaving + metacognitive monitoring: mixed topics, and seeing what is untested
│     Daily mix shuffle (done) · Curriculum map (replaces the weak list) · Recap mode sweeps 10 readings in 10 min
├─ 1d Learn from the mistake ..... error review + elaboration: the trap is named, the objective is named, the reading is recapped
│     Wrong-answer screen with Why / Tests / Remember (done) · "Recap this reading" card after a wrong answer
├─ 1e Know what I don't know ..... confidence calibration: separating "knew it" from "got lucky", and "solid" from "shaky"
│     Lucky guess tap · Solid / Shaky taps in Recap mode
└─ 1f Fold in new readings fast .. consolidation right after study: tick → recap → questions lead the next session
      Coverage checklist (done) · newly ticked readings lead the session (done) · Recap deck puts newly ticked first

G2 EXAM PREP  "the real format, the real pace, an honest readiness signal"
├─ 2a Real format ................ transfer: practise in the format you will be tested in
│     3-option MCQs (done) · exam-kind scenario questions (content)
├─ 2b Real pace .................. time pressure changes how you read; rehearse it before the day
│     Exam practice: 10 questions, 90 s pace bar, feedback held to the end
├─ 2c Readiness signal ........... calibrated self-assessment, by topic, without false precision
│     Exam practice per-topic breakdown (P1) · Map colours · honest "official mocks are the real check" note (done)
└─ 2d The right thing for today .. desirable difficulty early, consolidation late: what to do changes with days-to-exam
      Countdown phasing on Home
```

## 2. Feature table

Effort is builder hours in the single remaining run. Content cost is in writer output. Reward is for her learning; confidence is that it ships working.

| # | Feature | Goal / sub-goal | What she does (taps) | Build (h) | Content cost | Reward | Conf | Priority |
|---|---|---|---|---|---|---|---|---|
| 1 | Coverage checklist, first screen | 1f | Tick readings or a whole topic; Start | done | none | H | H | P0 |
| 2 | Today's 15 (daily mix) | 1a 1b 1c | One tap per answer, Next | done | 300 MCQs | H | H | P0 |
| 3 | Wrong-answer screen: Why, Tests, Remember | 1d | Read, Next | done | in MCQs | H | H | P0 |
| 4 | Quick-calc · Must-remember · Weak spots modes | 1a | Pick a mode | done | kinds in MCQs | H | H | P0 |
| 5 | Streak, session score, export/import | 1b | Settings → Export | done | none | M | H | P0 |
| 6 | **Exam practice** (10 q, 90 s pace bar, feedback at the end) | 2a 2b | Pick mode; answer; review at the end | 0.6 | ~60 exam-kind MCQs (in the 300) | H | M | **P0** (was P1) |
| 7 | **Recap card after a wrong answer** ("Recap this reading" sheet) | 1d | One tap to open, one to close | 0.25 | 93 recap cards | H | H | **P0** |
| 8 | **Recap mode** (deck of 10 cards, Solid / Shaky taps) | 1c 1e 1f | Read card; tap Solid or Shaky; next card appears | 0.5 | same 93 cards | H | H | **P0** |
| 9 | **Lucky guess** tap after a right answer | 1b 1e | Small "Lucky guess" button beside Next | 0.15 | none | M | H | **P0** |
| 10 | **Curriculum map** (93 cells, 4 colours; tap → Recap / Practice this) | 1c 2c | Tap a cell; tap Recap or Practice this | 0.5 | none | H | H | **P0** (replaces Weak topics screen) |
| 11 | **Countdown phasing** on Home (a "Suggested" tag and one line) | 2d | Nothing; reads it | 0.2 | none | M | H | **P0** |
| 12 | Scheduler deltas + 2 tests (guess, shaky) | 1b 1e | – | 0.2 | none | – | H | **P0** |
| 13 | Integrate real content, polish, fix builder-1 bugs | all | – | 0.6 | – | – | H | **P0** |
| 14 | GitHub Pages deploy (owner can do by hand) | all | Opens a link | 0.25 | none | H | M | **P0** |
| 15 | Per-topic breakdown on the Exam practice result | 2c | Reads it | 0.2 | none | M | H | P1 |
| 16 | Service worker, versioned cache (offline while walking) | all | Nothing | 0.4 | none | M | M | P1 |
| 17 | Add-to-Home-Screen hint | all | Share → Add to Home Screen | 0.1 | none | M | H | P1 |
| 18 | Mistakes notebook | 1d | – | 0.4 | none | L | H | **cut** |
| 19 | "Why did I miss it?" error tags (misread / didn't know / mixed up) | 1d 2b | – | 0.35 | none | M | M | **cut** |
| 20 | Swipe gestures in Recap mode | 1c | – | 0.3 | none | L | M | **cut** (buttons do the job) |
| 21 | 30-question timed mini-exam, Session 1 / Session 2 split | 2a 2b | – | 0.6 | needs 100+ more exam MCQs | M | L | **cut** |
| 22 | Extra Ethics vignettes | 2a | – | – | 1 writer run | M | M | **cut** |
| 23 | "Recap first" before a newly ticked reading's questions | 1f | – | 0.2 | none | L | M | **cut** (she just read the chapter) |
| 24 | Separate formula sheet / flash cards | 1a | – | 0.5 | 80+ cards | M | M | **cut** (recap card has a formula line) |

**P0 build total: about 3.05 h.** P1 adds 0.7 h. Build order for the run: 13 → 6 → 7 → 9 → 12 → 10 → 8 → 11 → 14, then P1 only if under 3 h elapsed. If the run slips, cut from the top of P1, then #11, then #8 (keep #7: the card content is still used after wrong answers).

### Verdict on each proposed candidate

1. **Recap card: accept, trimmed.** Exactly 3 key ideas, not 3–5; one optional formula line; one trap. Shown after a wrong answer and as a Recap mode. Reasons: it is the only feature that serves *"while she completes the rest of her reading through books"*: tick a chapter, read its card, and its questions lead tomorrow. It is also the fastest breadth sweep we can afford (93 cards ≈ 9 ten-minute sessions) and the one thing usable lying in bed with zero effort. Swiping is replaced by the Solid/Shaky buttons advancing the deck: same result, no gesture code to debug on iOS. **Solid deliberately does not change the scheduler.** Self-rated "I know this" is the least reliable signal in learning research; the questions decide. Shaky does pull the reading forward, because self-rated doubt is reliable.
2. **Lucky guess: accept.** Fifteen minutes of build, one-line scheduler change, and it fixes the one real hole in Leitner: a fluke moves a question to a 2-day gap she hasn't earned. Session score still counts it as right (she was right); reading accuracy counts it as wrong (she didn't know it).
3. **Curriculum map replacing the weak list: accept.** The weak list shows the bottom 3; the map shows all 93 and makes "untested" visible, which is the breadth problem the owner named. Same data (`readingStats`), one screen. The *Weak spots mode* stays. "Practice this" moves into the cell sheet, so nothing is lost.
4. **Mistakes notebook: cut.** Every miss already returns next session (retrieval, the better treatment), the Result screen lists today's misses with tap-to-reread, and the map colours shaky readings. A notebook would be a fourth surface for the same data and invites passive rereading.
5. **Countdown phasing: accept, minimal.** One "Suggested" tag on a mode card plus one sentence, driven by days-to-exam. No new modes, no reordering of content.

### What else was cut and why
- **Error tags (#19)** would be genuinely useful for exam pacing ("most misses today were misreads") but costs 0.35 h we don't have and adds a tap to the screen we want calm. v2.
- **Mini-exam / session split (#21)**: 10 exam questions at 90 s is already the real-pace rehearsal; a 30-question set needs content we can't write tonight. Official mocks do this better.
- **Separate flash cards (#24)**: already replaced by Must-remember questions (DECISIONS #7); the recap card's formula line covers the formula-sheet use.

## 3. Content budget

Fits the cap: **300 MCQs + 93 recap cards.** Recap cards live in the same per-topic file as the questions (one file per topic, one writer run writes both, `validate.js` checks both).

| Topic | Readings = recap cards | MCQs | Kind mix target (concept / calc / memorise / exam) | Writer run | Review run |
|---|---|---|---|---|---|
| Ethics | 5 | 50 | 20 / 0 / 15 / 15 | W1 | R1 |
| FSA | 12 | 40 | 14 / 10 / 8 / 8 | W1 | R1 |
| Equity | 8 | 35 | 14 / 7 / 7 / 7 | W2 | R2 |
| Fixed Income | 19 | 35 | 12 / 9 / 7 / 7 | W2 | R2 |
| Portfolio Mgmt | 6 | 30 | 12 / 6 / 6 / 6 | W3 | R2 |
| Alts | 7 | 25 | 10 / 2 / 8 / 5 | W3 | R3 |
| Quant | 11 | 25 | 8 / 8 / 4 / 5 | W4 | R3 |
| Econ | 8 | 25 | 11 / 4 / 5 / 5 | W4 | R3 |
| Corporate | 7 | 20 | 8 / 4 / 4 / 4 | W5 | R3 |
| Derivatives | 10 | 15 | 5 / 4 / 3 / 3 | W5 | R3 |
| **Total** | **93** | **300** | 114 / 54 / 67 / 65 | 5 runs | 3 runs |

Notes: exam-kind is at least 20% everywhere so Exam practice has about 65 questions (6 distinct sessions). Calc stays at or below 25% in any topic and 0 in Ethics. Fixed Income has 19 readings and only 35 questions, so FI recap cards matter most there; the writer should spread FI questions so every covered reading has at least one. Reviewers: delete any question or card they are unsure of; a smaller correct set beats a larger doubtful one.

## 4. New content type: recap card

Added as a `recaps` array in each existing `data/questions/<topic>.json` beside `questions`. Backward compatible with the shell already being built (it reads `questions` and ignores unknown keys).

```json
{
  "topic": "fsa",
  "questions": [ ... ],
  "recaps": [
    {
      "reading": "fsa-6",
      "ideas": [
        "Liquidity ratios ask: can we pay what is due this year? Current, quick and cash ratios each strip out less liquid assets.",
        "Solvency ratios ask: can we survive our debt? Debt-to-equity and interest coverage are the two the exam leans on.",
        "A ratio means nothing alone: compare to the firm's own history and to peers, and check the accounting choices behind it."
      ],
      "formula": "Quick ratio = (Cash + Short-term investments + Receivables) ÷ Current liabilities",
      "trap": "Inventory is excluded from the quick ratio but included in the current ratio; candidates mix the two under time pressure."
    }
  ]
}
```

Schema and limits (enforced by `scripts/validate.js`):

| Field | Type | Rule |
|---|---|---|
| `reading` | string | A reading id from `curriculum.json`; exactly one card per reading, 93 total |
| `ideas` | string[3] | Exactly 3; each 40–140 chars; plain sentences, no bullets or markup; original wording, never curriculum text |
| `formula` | string, optional | ≤ 120 chars; plain text with unicode × ÷ √ ² (no LaTeX, no HTML); omit if the reading has no formula worth memorising |
| `trap` | string | 40–170 chars; one sentence naming the classic mix-up or exam trick |

Title and topic come from the curriculum, so they are not repeated. There is no `id` field: `reading` is the key.

### State additions (localStorage `cfa-rev-v1`, still `v: 1`)

```
state.recap = { [readingId]: { last: "YYYY-MM-DD", mark: "solid" | "shaky" } }
answers[i].guess = true          // passed to finishSession for a "Lucky guess" tap
sessions[].mode may be "recap"   // Recap mode counts towards the streak; right = null
```

Export/import carries these automatically because the whole state object is serialised.

## 5. Scheduler changes (minimal deltas against scheduler.js)

Three small changes, two new tests. The `buildSession` API and the 7 existing tests are untouched.

```
// (a) Lucky guess: the question is graded wrong, the session score stays right.
finishSession(state, today, mode, answers):
-   answers.forEach(a => s.q[a.id] = grade(s.q[a.id], a.correct, today));
+   answers.forEach(a => s.q[a.id] = grade(s.q[a.id], a.correct && !a.guess, today));
    // `right` in the session record still uses a.correct

// (b) Shaky pulls a reading forward for 3 days. Solid does nothing here.
+ function isShaky(reading, state, today) {
+   var r = state.recap && state.recap[reading];
+   return !!r && r.mark === 'shaky' && daysBetween(r.last, today) <= 3;
+ }
scoreAll(...):
    ... compute tag, dueness as today ...
+   if (tag === 'later' && isShaky(q.reading, state, today)) { tag = 'due'; dueness = BASELINE; }
-   var p = (w[q.topic] || 0.1) * (1 - st[q.reading].acc) * dueness;
+   var p = (w[q.topic] || 0.1) * (1 - st[q.reading].acc) * dueness * (isShaky(q.reading, state, today) ? 1.5 : 1);

// (c) Recap deck: deterministic, no RNG, covered readings only. ~15 lines, exported as buildRecapDeck.
+ buildRecapDeck({ recaps, state, curriculum, today, size = 10 }):
+   covered = recaps.filter(c => state.coverage[c.reading])
+   rank(c) = [ isShaky(c.reading) ? 0 : 1,                       // shaky first
+               weakSet.has(c.reading) ? 0 : 1,                   // then weak (>=3 attempts, acc < 0.7)
+               isNewlyCovered(c.reading, state) ? 0 : 1,         // then newly ticked
+               state.recap[c.reading] ? state.recap[c.reading].last : "0000",  // never recapped first, then oldest
+               -topicWeight(c.topic), c.reading ]                 // tie-break: heavier topic, then id
+   return covered.sort(by rank).slice(0, size).map(c => c.reading)
```

New tests in `scripts/scheduler.test.js`:
8. A right answer with `guess: true` lands in box 1 and is due today; the session record still counts it as right.
9. Marking a reading shaky today makes its not-yet-due questions eligible and ranks it above an equal-weight reading that wasn't marked; the effect is gone after 3 days.

Map colours need no scheduler change; `app.js` derives them from `readingStats`: **not covered** (grey), **untested** (covered, fewer than 3 attempts; outlined), **shaky** (3+ attempts and accuracy below 70%, or marked Shaky in the last 7 days; amber), **solid** (3+ attempts and 70%+; green).

## 6. Home screen information hierarchy

Always, top to bottom: greeting and days-to-exam → streak (hidden at 0) → one **Suggested** line → the big **Today's 15** button → mode cards (Recap, Must-remember, Quick-calc, Weak spots, Exam practice; the suggested one carries a small tag and sits first) → map summary strip ("48 of 93 covered · 20 solid · 9 shaky · 19 untested · Your map") → Settings icon in a corner.

**Day 1 (20 days out, first run).** She sees the Coverage checklist first, ticks about 48 readings, taps Start, and does Today's 15. Home afterwards: "Hi Ishita · 20 days to the exam". Suggested: *"Recap the readings you just ticked: one minute each."* Today's 15 big. Recap card first. Map summary reads "48 of 93 covered · 48 untested". Weak spots is disabled with "Answer a few more first".

**Day 10 (10 days out).** "Hi Ishita · 10 days to the exam · 9-day streak". Suggested: *"Try Exam practice once this week to feel the pace."* (or *Weak spots* on a day after a session under 60%). Today's 15 big. Map summary now coloured: "61 of 93 covered · 22 solid · 8 shaky · 31 untested". A gentle one-line nudge appears once after the fifth session: "Save a progress file in Settings, in case Safari clears it."

**Exam week (3 days out and closer).** A calm banner: *"Exam week. Mix Today's 15 with Exam practice; sweep Recap for anything shaky."* Today's 15 stays the big button (due retrievals still matter most); Exam practice is tagged Suggested. At 1 day: *"Tomorrow. Must-remember and a Recap sweep; nothing new tonight."* At 0 days: *"Exam day. A quick Must-remember if you want a warm-up. Good luck, Ishita."* Streak and map stay visible; nothing is hidden or alarming.

## 7. Mode notes (one line each, shown under the mode name)

- **Today's 15:** "Your daily mix. Mistakes come back tomorrow; what you know well fades out."
- **Recap:** "One minute per reading: the key ideas, the formula, the classic trap. Tap Shaky and its questions come back sooner."
- **Must-remember:** "Facts the exam asks directly: rules, lists, thresholds. You can't reason your way to these; learn them cold."
- **Quick-calc:** "Formula drills with easy numbers. On exam day you'll have your calculator; this trains knowing which formula and which number goes where."
- **Weak spots:** "Only your 3 weakest readings, until they aren't."
- **Exam practice:** "10 exam-style questions at real pace, 90 seconds each. Answers at the end, like the real thing."
- **Your map:** "Every reading, coloured by how you're doing. Tap one to recap it or practise it."
- **Lucky guess (button hint, right-answer screen):** "Guessed? Tap and it comes back tomorrow."
- **Recap card buttons:** "Solid" / "Shaky · bring its questions forward".
