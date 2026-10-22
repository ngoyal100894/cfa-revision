# Mission
Build a mobile-web revision app for my friend's CFA Level I exam (~2 weeks away). She has ~15 min/day, has covered ~50% of the curriculum and is still reading the rest. The app lets her tick which readings she has covered, then gives her a daily 15-minute session of one-tap MCQs from covered material, prioritizing high exam-weight and weak areas, with a 2-3 line explanation after each answer. Usable one-handed while walking or lying in bed, on iPhone Safari. No typing, no calculator, no login.

# Operating mode
- You run unattended for ~5 hours. I am asleep the whole time. Never wait for input. If blocked, pick the simplest option, log it in DECISIONS.md, continue.
- You are on Opus for the whole run. Subagents are pre-registered in .claude/agents/: content-writer, builder, qa (Sonnet) and content-reviewer (Opus). Use them by name. Do not create new agent files mid-session (they may not register until restart); put task-specific detail in the brief you send each one.
- Fixed assumptions, ask no questions: exam date = 14 days from today; no deployment, leave the repo root deployable by drag-and-drop; 20 questions per session; quick-calc allowed, at most 20%; all topics generated, weighted; no personal greeting.

# Decisions already made (do not relitigate)
- Stack: vanilla HTML/CSS/JS, single index.html + app.js/app.css + data/*.json. No framework, no build step, no npm deps for the app. Node allowed for validation/test scripts only.
- No runtime LLM. Intelligence = pre-generated content (written tonight) + a deterministic scheduler.
- Persistence: localStorage, plus export/import of progress as JSON.
- Content: original MCQs grounded in the official CFA Level I 2026 topic/LOS outline, used for structure only. Never copy curriculum text or any prep provider's questions.
- Question format: 3 options (A/B/C), one correct, plausible distractors, explanation of 3 lines or fewer naming the trap. Mostly conceptual; at most 20% quick-calc with small numbers solvable mentally.
- Scheduler: Leitner 3-box. Session = N questions from covered readings, ranked by priority = exam_weight x (1 - reading_accuracy) x dueness; unseen questions get a baseline. Wrong -> box 1 (next session). Right -> up a box; box 3 = roughly 4-day interval. About 20% of each session from the weakest reading.
- Gamification: minimal. Streak, session score, weak-topics list. Nothing else.

# Budget
- At most 14 subagent runs total. Fewer, larger, self-contained runs. Max 2 retries per task; on a 3rd failure cut scope.
- Every brief is self-contained (paste only the schema + LOS list it needs, not whole files). Subagents return counts/summaries, not file contents.
- Log every run in BUDGET.md (task, model, rough size). If in doubt, ship P0 and stop.
- Hard time stops: T+4:15 no new work starts. T+4:45 everything committed, HANDOFF.md complete.

# Phase 1: planning (15 min max, planning files only, then continue straight into Phase 2 without stopping)
1. Fetch the official CFA Level I 2026 topic weights and learning-module/LOS outline from cfainstitute.org and save as data/curriculum.json (topics -> readings -> LOS). Structure only, no curriculum text. If the official page cannot be fetched, use a reputable secondary listing of the 2026 Level I modules; if that also fails, use the 10 topic areas with standard weight ranges and reconstruct readings from your knowledge, and flag this in DECISIONS.md.
2. PLAN.md: P0/P1/P2 scored on effort (hours) / reward / confidence (H/M/L).
   - P0: coverage checklist, daily session, Leitner scheduler, explanation after each answer, weak-topics view, localStorage + export/import, ~300 questions (Ethics 50, FSA 40, Equity 35, FI 35, PM 30, Alts 25, Quant 25, Econ 25, Corp Issuers 20, Derivatives 15).
   - P1: ~80 formula/concept flip-cards in the same scheduler; streak; service worker for offline with versioned cache; Add-to-Home-Screen hint.
   - P2: 30-question mixed timed mini-exam with per-topic score; Ethics scenario cards. Only if budget clearly allows.
   Cut from the bottom if anything slips.
3. SPEC.md: screens (Home, Coverage, Session, Result, Weak topics, Settings), question JSON schema, scheduler pseudocode with 5 test cases, iOS Safari constraints (100dvh, 44px tap targets, localStorage limits, SW cache versioning), copy guidelines (plain language; she is not an engineer), quality rubric for questions.
4. scripts/validate.js (schema check for data/questions/*.json) and scripts/scheduler.test.js.
5. DECISIONS.md, BUDGET.md, HANDOFF.md skeleton. git commit.

# Phase 2: build. Commit after every completed task so the repo always works.
1. builder: app shell with coverage checklist and session loop working on a 10-question dummy file. Smoke-test in a mobile viewport if a browser tool is available; otherwise run the scheduler tests.
2. content-writer runs in parallel, 2 topics per run (5 runs). Each writes data/questions/<topic>.json, runs scripts/validate.js, returns counts only.
3. content-reviewer on Ethics + FSA (1-2 runs). Other topics only if budget remains.
4. Integrate real content. qa run: all JSON validates, no console errors, a session completes end-to-end, progress persists across reload, export/import round-trips.
5. P1 items only if elapsed time < 3:30 and at most 10 subagent runs used so far.
6. Confirm the folder deploys by drag-and-drop: plain static files, relative paths, works from a subpath.
7. HANDOFF.md, written for me to read in the morning: what was built; what each feature does and why it helps her specifically; how to open and install on iPhone; how she ticks new readings as she covers them; known gaps; what was cut and why; an honest note that questions are AI-written and reviewed, not official, and official mocks remain the readiness check; a one-line pitch for v2.
Final line of the session: "DONE - see HANDOFF.md". Then stop. Do not keep iterating.
