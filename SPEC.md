# SPEC

Vanilla HTML/CSS/JS: `index.html`, `app.css`, `app.js`, `scheduler.js` (done; don't change its API without updating the tests), and `data/`. There is no build step, no dependencies and no network calls beyond relative `data/` fetches. All paths are relative, so the app works from a subpath (GitHub Pages `/repo/`) and from any static host.

The user is Ishita, a CFA Level I candidate. Exam date: `curriculum.examDate` (2026-11-13). Greeting: "Hi Ishita".

## Data
- `data/curriculum.json`: `{ examDate, topics:[{ id, name, short, weightMin, weightMax, session, readings:[{ id, n, title, short, los:[{ id, text, calc }] }] }] }`. There are 10 topics and 93 readings. Ids look like `fsa-3` and `fsa-3-b`.
- `data/questions/index.json`: `{ "files": ["ethics.json", ...] }`. The app loads every listed file.
- `data/questions/<topic>.json`: `{ "topic": "fsa", "questions": [Question] }`

```json
{
  "id": "fsa-017",
  "topic": "fsa",
  "reading": "fsa-6",
  "los": "fsa-6-b",
  "kind": "concept | calc | memorise | exam",
  "stem": "string, <=420 chars (exam kind <=750)",
  "options": ["no A/B/C prefix", "...", "..."],
  "answer": 1,
  "explanation": "<=360 chars, at most 3 short sentences: why the right answer is right AND what the trap was",
  "remember": "optional, <=130 chars, required for memorise: the one line worth memorising"
}
```
Kinds:
- `concept`: understanding.
- `calc`: mental-math numbers only. She has no calculator here; the point is knowing which formula and which number goes where.
- `memorise`: facts the exam tests directly (lists, thresholds, rules, IFRS vs US GAAP differences).
- `exam`: exam-style, often a short scenario, as close to the real format as possible.

`node scripts/validate.js` checks all of this against the curriculum.

## State (localStorage key `cfa-rev-v1`)
`{ v, coverage: {readingId: "YYYY-MM-DD ticked"}, q: {qid: {box, due, seen, right, last}}, sessions: [{date, mode, n, right}], lastSessionDate, onboarded: bool }`. Save after every answer, so closing the tab mid-session loses nothing graded. Wrap every write in try/catch. If storage fails, show a calm banner saying "Progress can't be saved in this browser mode. Export from Settings."

## Screens
1. **Coverage** is the first-run screen and is reachable from Home. Title: "What have you covered so far?" Each of the 10 topics is a row showing the topic name, its exam weight ("15–20% of exam") and a "Whole topic" toggle; tapping the row expands its readings as checkboxes. A sticky bottom button says "Start today's 15". It's disabled until at least one reading is ticked, with the hint "Tick at least one reading". Ticking a reading stores today's date, so the scheduler gives it first-session priority.
2. **Home** has:
   - "Hi Ishita", "N days to the exam" and the streak ("3-day streak", hidden at 0).
   - A big primary button, **Today's 15**, with a one-line note: "Your daily mix. Mistakes come back tomorrow; what you know well fades out."
   - Secondary mode cards, each with a one-line note on what it's for:
     - **Quick-calc**: "Formula drills with easy numbers. On exam day you'll have your calculator. This trains knowing which formula and which number goes where."
     - **Must-remember**: "Facts the exam asks directly: rules, lists, thresholds. You can't reason your way to these; learn them cold."
     - **Weak spots**: "Only your 3 weakest readings." Disabled with "Answer a few more first" until weak readings exist.
     - **Exam practice** (P1): "10 exam-style questions at real pace, 90 seconds each. Explanations at the end, like the real thing."
   - A coverage summary ("48 of 93 readings covered · Update") and a link to Weak topics. Settings sits in a corner icon.
   - In the last 3 days before the exam: "Exam week: mix Today's 15 with Exam practice."
3. **Session** shows a thin progress bar ("4 / 15"), the topic short name and reading short name in small caps, the stem, and three option buttons labelled A/B/C. Buttons are full width, at least 56 px tall and sit in the lower half for thumb reach. Tapping an option answers immediately; there is no confirm step. Then the **feedback** state appears:
   - **Right:** a subtle green tick, "Correct", the explanation, the "Tests:" line, and a "Next" button in the thumb zone.
   - **Wrong (the most polished screen in the app):** her pick is struck through in soft red with a label "Your answer". The right option is highlighted green with "Correct answer". Below is a card headed "Why" with the explanation, then a "Tests:" line with the paraphrased learning objective in muted text, then a "Remember:" line when present, styled as a highlighted note. The tone is calm, never alarming: no shake and no buzzer red, just "This one will come back tomorrow." Then a big "Next" button.
   - A back-out "✕" asks "Stop here? Answers so far are saved."
   - Exam practice hides feedback until the end and shows a 90 s per-question pace bar that doesn't force-advance.
4. **Result** shows the score as "11 / 15", one line ("Wrong ones come back next session"), the list of missed questions (tap to reread the explanation), the streak, and buttons for "Done" and "Another 15". In exam practice it also shows a per-topic breakdown.
5. **Weak topics** lists readings sorted by accuracy, worst first, for readings with 3+ attempts: a reading short name, a bar showing % right, and the attempt count. Each row has a "Practice this" button that starts a 10-question session on that reading only. If nothing qualifies yet: "Nothing weak yet. Keep going."
6. **Settings** has:
   - Export progress, which downloads `cfa-progress-YYYY-MM-DD.json`. Copy to clipboard is the fallback.
   - Import progress, a file picker that confirms before overwriting.
   - Edit coverage.
   - Reset all progress, with a double confirm.
   - About, which says plainly: questions are AI-written and reviewed, not official CFA material. Official mocks remain the real readiness check.

## Scheduler (implemented in scheduler.js)
```
grade(q, correct): wrong -> box1, due today (next session). right -> box+1 (max 3). Due = today + {1:0, 2:2, 3:4} days.
acc(reading) = (right+1)/(attempts+2)
dueness = unseen: 1.0 (3.0 if reading ticked since the last session)
        | due: 1 + 0.15*min(days overdue, 7) (+0.5 if box1)
        | not due: 0.05
priority = topicWeightMid x (1 - acc(reading)) x dueness
buildSession(daily, N=15), pool = covered readings only:
  1. box-1 due items by priority, up to 40% of N
  2. weakest covered reading (>=3 attempts, acc < 70%): up to 20% of N
  3. fill by priority, quick-calc capped at 20%, newly covered capped at 60% (cap lifted if nothing else is left)
  4. seeded shuffle (seed = date + mode + session count -> reproducible)
modes: calc (kind=calc, 10), remember (kind=memorise, 15), weak (3 weakest readings, 10), exam (prefer kind=exam, 10)
```
Tests in `scripts/scheduler.test.js`:
1. Uncovered readings are excluded.
2. A wrong answer returns next session, even from a low-weight topic.
3. Box progression and the 4-day box-3 gap.
4. About 20% of the session comes from the weakest reading.
5. A newly ticked reading leads the next session, capped at 60%.
6. The quick-calc cap holds.
7. Sessions are deterministic, and the streak is computed correctly.

## iOS Safari constraints
- Use `height: 100dvh`, with a `100vh` fallback. Use `env(safe-area-inset-*)` padding and `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- Tap targets are at least 44 px; answer buttons are at least 56 px. Primary actions sit in the bottom third. There's no hover-only UI.
- Base font is 17 px or larger and stems are 18–19 px with a line-height of about 1.45. Use the system font stack. Support dark mode via `prefers-color-scheme`.
- Use `-webkit-tap-highlight-color: transparent` and `touch-action: manipulation` (no double-tap zoom delay). There are no text inputs anywhere.
- localStorage holds about 5 MB and may be cleared after 7 days of non-use in Safari, so add a gentle export reminder in Settings. Wrap every access in try/catch; private mode can throw.
- Service worker (P1): cache name `cfa-rev-v<N>`, bump N on every deploy, delete old caches on activate, network-first for `data/`, and relative scope.
- Add `apple-mobile-web-app-capable` and a `manifest.webmanifest` with relative `start_url`, plus an inline SVG or PNG icon.

## Copy guidelines
Use plain, warm, short language, written for a finance candidate rather than an engineer. Never use "LOS", "Leitner", "box", "localStorage" or "JSON" in the UI. "Tests:" is the label for the objective, and "progress file" replaces "JSON". Use second person and sentence case, with no exclamation marks except "Nice streak!".

## Question quality rubric (writer and reviewer)
1. Exactly one defensibly correct answer under the 2026 Level I curriculum. If it depends on IFRS vs US GAAP, the stem says which.
2. Distractors are plausible: each is a real misconception or a common slip, not filler.
3. The explanation says why the right answer is right and names the trap, in 3 sentences or fewer.
4. The question tests the tagged objective, not trivia outside it.
5. Calc questions use numbers that work out mentally.
6. The question is original. Never copy curriculum text, official LOS wording, or prep-provider or CFA sample questions.
7. Each option is no longer than about 160 characters, so it fits on a phone without scrolling the options.
