# PLAN

Ishita: CFA Level I on **13 Nov 2026** (20 days from 24 Oct). About 15 min a day on an iPhone, one-handed. About half the curriculum covered so far, still reading the rest.

Started 15:23. No new work after 19:38. Everything committed and HANDOFF.md written by 20:08.

Scores: effort in hours / reward for her (H/M/L) / confidence we ship it working (H/M/L). Cut from the bottom up.

## P0: must ship
| Item | Effort | Reward | Conf |
|---|---|---|---|
| Coverage checklist as the first-run screen: 10 topics, expandable readings, a "whole topic covered" toggle, editable from Home | 0.5 | H | H |
| Today's 15: the daily 15-question, about 15-minute session from covered readings only | 0.5 | H | H |
| Leitner 3-box scheduler (`scheduler.js`, done, 7 tests pass) | done | H | H |
| Explanation and the "Tests:" learning-objective line after every answer; the wrong-answer screen gets the most polish | 0.5 | H | H |
| Modes: Quick-calc drill, Must-remember, Weak spots. Each has a one-line note on what it's for | 0.5 | H | H |
| Result screen: score, what to look at next | 0.25 | M | H |
| Weak-topics view | 0.25 | M | H |
| localStorage plus export/import of progress as a file | 0.5 | M | H |
| Streak and days-to-exam on Home | 0.1 | M | H |
| About 300 questions: Ethics 50, FSA 40, Equity 35, FI 35, PM 30, Alts 25, Quant 25, Econ 25, Corp 20, Deriv 15. Tagged concept / calc / memorise / exam | 3 (agents) | H | M |
| Fable review of all 10 topics (correctness; delete if unsure) | 1.5 (agents) | H | M |

## P1: if under 3:30 elapsed and at most 10 agent runs used
| Item | Effort | Reward | Conf |
|---|---|---|---|
| Exam practice mode: 10 exam-style questions at 90 s each, explanations at the end | 0.5 | H | M |
| Offline service worker with a versioned cache | 0.5 | M | M |
| Add-to-Home-Screen hint (iOS) | 0.1 | M | H |
| GitHub Pages deploy | 0.25 | H | M |

## P2: only if budget clearly allows
| Item | Effort | Reward | Conf |
|---|---|---|---|
| Per-topic score breakdown after exam practice | 0.25 | M | H |
| Extra Ethics vignette questions (exam kind) | 1 (agent) | M | M |

## Changed from KICKOFF (see DECISIONS.md)
- The 80 formula/concept flip-cards are replaced by **Must-remember** questions: memorise-kind MCQs with a "Remember:" line. That's one format and one scheduler, with no second content pipeline.
- The P2 mini-exam is folded into **Exam practice** mode (P1).
- Session size is 15, not 20, so a session fits 15 minutes with time to read explanations.

## Agent runs (cap 14)
1 curriculum (Fable) → 2 builder: shell plus dummy data → 3–7 content-writer ×5 (Sonnet, two topics each) → 8–10 content-reviewer ×3 (Fable) → 11 builder: integrate, polish, P1 → 12 qa → 13–14 spare.
