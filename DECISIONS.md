# DECISIONS

Interactive run on 2026-10-24 with Nikhil present. His answers override KICKOFF.md's fixed assumptions.

| # | Decision | Why |
|---|---|---|
| 1 | The exam is **13 Nov 2026**, not "today + 14". | Nikhil |
| 2 | The greeting is **"Hi Ishita"**. | Nikhil |
| 3 | Deploy to **GitHub Pages** from a **public repo**. | Nikhil chose this over a private repo: Pages on a private repo needs a paid plan, and the site is public either way. Created at the deploy checkpoint. |
| 4 | Revision **modes** are Today's 15 (daily mix), Quick-calc, Must-remember, Weak spots and Exam practice. Each carries a one-line note on what it's for. | Nikhil: "choose different modes", "special feature for quick-calc", "some questions remembering-worth", "some sections specific exam practice; the instructions should say such". |
| 5 | A session is **15 questions** (about 1 min each including the explanation), not 20. Quick-calc, Weak spots and Exam practice have 10. | 15-minute sessions (Nikhil, "your call"). |
| 6 | Questions carry `kind`: concept / calc / memorise / exam. Quick-calc is a share of at most 20% of the daily mix; Quick-calc mode is calc only. | Supports the modes with one content format. |
| 7 | The flip-cards (KICKOFF P1) are replaced by memorise-kind MCQs with a "Remember:" line. | One format and one scheduler; the "remember" line gives the flip-card value. |
| 8 | The mini-exam (P2) is folded into the Exam practice mode (P1). | Same feature, smaller build. |
| 9 | Uncovered readings get **no** questions. A newly ticked reading leads the next session, capped at 60% so retries still appear. | Product addendum. |
| 10 | The coverage checklist is the first-run screen. | Product addendum. |
| 11 | Every answer, right or wrong, shows the explanation plus a "Tests:" line. That line is a **paraphrase** of the learning objective, not CFA's wording. | Addendum, plus the no-curriculum-text rule. |
| 12 | Topic weights are the official 2026 figures: Equity 11–14% and FI 11–14%. | The cfainstitute.org Level I page. Nikhil's list said 10–12%. |
| 13 | Module titles come from the official topic weights page plus a secondary listing (UWorld). The learning objectives are paraphrased by Fable. | The official module PDF wasn't fetchable as text, and the module structure is unchanged from 2025 (93 modules). |
| 14 | Models: Fable for curriculum grounding and all content review; Sonnet for builder, writer and qa; Opus orchestrates. | Nikhil's usage ceilings: weekly 75%, Fable 60%. |
| 15 | The scheduler is a pure module (`scheduler.js`) written in Phase 1 with tests, so the builder only wires UI. | It's the riskiest logic, so it was tested first. |
| 16 | P1 (service worker, Add-to-Home-Screen hint, exam per-topic breakdown) is **cut**. | KICKOFF rule: P1 only if at most 10 subagent runs are used. 12 were used by the time content review finished. |
| 17 | Content review ran on **all 10 topics** (3 Fable runs), not only Ethics + FSA. | Budget allowed it. The first run found 3 Economics answer keys off by one, so full coverage was worth it. |
| 18 | v1.1 adds **Where you stand** (exam weight covered, per-topic accuracy, unread readings worth the most marks each), **Formula sheet** (52 recap formulas + 67 must-remember lines, cue shown, answer blurred until tapped) and optional **Why did you miss it?** tags (didn't know / mixed up / misread) with result-screen advice. Exam eve and exam day now suggest the Formula sheet. | Fable research: the final-weeks playbook is diagnose, target, simulate, consolidate. Top products sell a topic-weight readiness view and a compact formula list. Retrieval beats rereading, and error attribution improves correction. All three reuse existing data. Run 14 of 14. |
| 19 | **53 questions added** so every reading has at least 3 (was: 41 readings with 1–2). They target the uncovered LOS of each thin reading, lean concept/memorise (4 calc), and keys are rotated to keep A/B/C balanced. Written and self-reviewed by Opus; no Fable review pass. | Nikhil: "add more questions for the thin readings". No subagent runs were left. |
