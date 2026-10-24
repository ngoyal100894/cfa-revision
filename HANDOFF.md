# HANDOFF

Live link (deployed 24 Oct 2026; v1.2 with 353 questions and UI polish verified live): **https://ngoyal100894.github.io/cfa-revision/**

## What was built
This is a phone-first revision app for Ishita's CFA Level I exam on 13 Nov 2026. It is designed for about 15 minutes a day while she finishes reading the books.
- It is plain HTML, CSS and JS, with no build step and no accounts. It is hosted on GitHub Pages.
- Her progress lives on her phone, in the browser's storage. She can back it up from Settings.
- It has 353 original questions across all 10 topics, and a recap card for each of the 93 readings. Every reading has at least 3 questions.
- The questions break down as 158 concept, 58 quick-calc, 72 must-remember and 65 exam-style.
- The first 300 questions and all cards were reviewed for correctness in a second pass. Three mis-keyed answers and a handful of wording slips were fixed.
- The 53 added later for thin readings were checked against their LOS and self-reviewed, but have not had a separate review pass.

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
- **Formula sheet** (new in v1.1). Every formula (52) and must-remember fact (72) from her covered readings, grouped by topic. The cue is shown and the answer is blurred: she says it, then taps. It's a 3-minute sweep for a queue, and it's what Home suggests for exam eve. A toggle shows everything, including unread readings.
- **Where you stand** (new in v1.1; Home strip and Map). Shows how much of the exam she has covered by weight, her accuracy per topic (amber below 70%), and **Read next in the books**: the unread readings worth the most exam marks each. Tapping one lets her mark it covered.
- **Why did you miss it?** (new in v1.1; optional chips on the wrong-answer screen). Didn't know it / Mixed two things up / Misread or rushed. The result screen turns her most common reason into one line of advice. If misreads pile up over a week, Home suggests Exam practice.
- **Momentum** (new in v1.3). Small rewards to keep her going once she has started:
  - A **daily goal ring** of 25 questions on Home and the result screen. Today's 15 gets her most of the way; one or two 5-question top-ups finish it.
  - **XP and levels** (Starter to Exam-ready). 10 XP per right answer, 4 per attempt, bonus XP for runs of right answers, an occasional 2× bonus, +20 for finishing a round, +5 per recap card.
  - **Combo runs** ("🔥 4 in a row"), personal-best runs, milestones (50, 100, 200… questions answered) and confetti on real wins.
  - The result screen leads with **Keep going · 5 more** (or **Hit today's goal · N more**) and **Retry N missed**.
  - Tapping ✕ mid-round asks "Only N to go?" with **Keep going** first. Stopping is always one tap, and her answers are saved either way.
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
- **Small question pools for some readings.** Every reading now has at least 3 questions, but many have only 3 or 4, so "Practice this" on one reading gives a short session. The Recap cards cover every reading.
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

## v2 ideas (from the Fable research, not built)
- A 30-question weighted half-mock with a per-topic result.
- A Sure/Unsure tap before answering, feeding the scheduler.
- Offline mode.
- More Ethics vignettes, and more questions per reading.
- A "report this question" button.

## v2 in one line
If v1 sticks, v2 could add the following, all on the same link with her progress kept:
- More questions per reading.
- A full-length timed mock.
- Offline support.
- A "report this question" button.
