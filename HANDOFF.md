# HANDOFF

Live link (deployed 24 Oct 2026, verified: 300 questions, 93 recaps load): **https://ngoyal100894.github.io/cfa-revision/**

## What was built
This is a phone-first revision app for Ishita's CFA Level I exam on 13 Nov 2026. It is designed for about 15 minutes a day while she finishes reading the books.
- It is plain HTML, CSS and JS, with no build step and no accounts. It is hosted on GitHub Pages.
- Her progress lives on her phone, in the browser's storage. She can back it up from Settings.
- It has 300 original questions across all 10 topics, and a recap card for each of the 93 readings.
- The questions break down as 114 concept, 54 quick-calc, 67 must-remember and 65 exam-style.
- Every question and card was reviewed for correctness in a second pass. Three mis-keyed answers and a handful of wording slips were fixed.

## What each feature does and why it helps Ishita
- **Coverage checklist** (first screen, editable from Home). She ticks the readings she has finished, and only those readings ever appear. Readings she ticks fresh get priority in her next session, so what she just read gets tested while it's new.
- **Today's 15** (main button). This is a spaced-repetition mix (Leitner boxes at 0, 2 and 4 days):
  - Wrong answers come back next session.
  - About 20% of the mix comes from her weakest reading.
  - Heavier-weighted topics count for more.
  - Quick-calc is capped at 20% of the mix.
  - This is the "solidify what I've read" engine.
- **After every answer** she gets the explanation plus a one-line LOS. A wrong answer gets the fullest screen: her pick and the right answer marked, a "Why" explanation, the must-remember line where there is one, a "Recap this reading" button, and a calm note that it comes back next session.
- **Lucky guess**: she taps this when she got it right but wasn't sure. It counts as right in the score but comes back as if it were a miss. Guessing doesn't build memory.
- **Recap** (about 1 minute per reading). Each card shows 3 key ideas, the formula and the classic trap. She marks each card Solid or Shaky. Shaky pulls that reading's questions forward for 3 days.
- **Must-remember**: facts the exam asks directly (rules, lists, thresholds). These have to be learned cold.
- **Quick-calc**: formula drills with easy numbers. They train knowing *which* formula to use, and fast.
- **Weak spots**: questions from her 3 weakest readings, worst first.
- **Exam practice**: 10 exam-style questions with a 90-second-per-question pace bar. She sees no feedback until the end, as in the real exam.
- **Map**: every reading coloured by state.
  - Grey: not covered.
  - Outlined: barely tested.
  - Amber: shaky.
  - Green: solid.
  
  She taps a reading to see it, then "Practice this".
- **Home**: a countdown and a suggestion that changes as the exam gets closer (more exam practice in the last stretch). It also shows her streak and a "Tick new readings" link.

## Opening it on her iPhone and adding it to the Home Screen
Send her this by WhatsApp:

> Hi Ishita! Here's your CFA revision app: https://ngoyal100894.github.io/cfa-revision/
> 1. Long-press the link and choose **Open in Safari** (not inside WhatsApp).
> 2. In Safari, tap **Share**, then **Add to Home Screen**, then **Add**.
> 3. From now on, always open it from the **CFA** icon on your Home Screen.
> 4. On first open, tick the readings you've already finished. As you finish more in the books, tap **Tick new readings** on Home.
> 5. About once a week, go to Settings and tap **Save a progress file** (or **Copy progress instead** and paste it into Notes). It's your backup.

Why step 3 matters: on iPhone, the Home Screen icon keeps its own storage, separate from the Safari tab. She should do all her ticking and practice from the icon, or her progress will look split in two.

**Restoring after a lost or new phone:** Settings → **Restore from a progress file**, or copy the text from Notes and use **Restore from copied progress**.

**Updates:** any later version is pushed to the same link. Her progress stays because it lives on her phone, not in the app files.

## Ticking new readings as she covers them
Home → **Tick new readings**, or Settings → Edit what you've covered. Each topic has a whole-topic toggle. Newly ticked readings take up to 60% of the next Today's 15 and go near the front of the Recap deck.

## Known gaps
- **Needs internet to open.** There is no offline mode.
- **Small question pools for some readings.** 300 questions spread over 93 readings means 41 of the 93 readings have only 1 or 2 questions. "Practice this" on such a reading gives a very short session. The Recap cards cover every reading.
- **Swiping back mid-session.** If she swipes back out of a session, the answers she gave are still saved and counted.
- **No sync between devices.** It is one phone. Backup and restore is manual (see above).
- **AI-written content.** See below.

## What was cut, and why
- **The P1 list was cut by the kickoff rule** ("P1 only if ≤10 subagent runs used"; 12 were used by then). That covers the mistake notebook, swipe gestures, a timed mini-mock and a separate flashcard deck.
- **What covers them:**
  - The retry box plus Weak spots cover the mistake notebook.
  - Exam practice covers the mini-mock.
  - Recap cards plus Must-remember cover flashcards.
- **No accounts or server sync.** These weren't needed for one user, and would have added risk.

## About the questions
The questions are AI-written and AI-reviewed. They are not official CFA Institute material. Official CFA mock exams remain the real readiness check. If something looks wrong, she should trust the curriculum book and tell you which question. Every question has an id, so it can be fixed quickly.

## v2 in one line
If v1 sticks, v2 could add the following, all on the same link with her progress kept:
- More questions for the thin readings.
- A full-length timed mock.
- Offline support.
- A "report this question" button.
