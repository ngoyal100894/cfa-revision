# BUDGET

Cap: 14 subagent runs. Usage ceilings from Nikhil: weekly all-models 75% (46% at start) and Fable 60% (20% at start).

| # | Task | Agent | Model | Size | Result |
|---|---|---|---|---|---|
| 1 | curriculum.json: 93 readings and paraphrased objectives | general-purpose | fable | M (74k tokens, 5 min) | done: 93 readings, 399 objectives |
| 2 | PRODUCT.md: feature design for revision + exam prep | general-purpose | fable | M (75k tokens, 4 min) | done |
| 3 | App core on dummy data | builder | sonnet | L | done; verified in browser (coverage, session, wrong-answer, result, reload) |
| 4 | Ethics 50 + FSA 40: questions + recap cards | content-writer | sonnet | L | done; 90 Qs, 17 recaps, 0 errors |
| 5 | Equity 35 + FI 35: questions + recap cards | content-writer | sonnet | L | done; 70 Qs, 27 recaps, 0 errors |
| 6 | PM 30 + Alts 25: questions + recap cards | content-writer | sonnet | L | done; 55 Qs, 13 recaps, 0 errors |
| 7 | Quant 25 + Econ 25: questions + recap cards | content-writer | sonnet | L | done; 50 Qs, 19 recaps, 0 errors |
| 8 | Corp 20 + Deriv 15: questions + recap cards | content-writer | sonnet | L | done; 35 Qs, 17 recaps, 0 errors |
| 9 | Review R3: Alts, Quant, Econ, Corp, Deriv (fix or delete, incl. recaps) | content-reviewer | fable (override) | L (88k tokens, 2 min) | done; 4 Qs fixed (3 econ answer keys off by one), 2 recaps fixed, 0 deleted |
| 10 | Builder 2: integrate content + PRODUCT P0 (exam, recap, lucky guess, map, home phasing) | builder | sonnet | L | running |
| 11 | Review R1: Ethics, FSA (fix or delete, incl. recaps) | content-reviewer | fable (override) | M (52k tokens, 2 min) | done; 2 ethics Qs + 1 recap fixed (sanctions list, I(D) scope), FSA clean, 0 deleted |
| 12 | Review R2: Equity, FI, PM (fix or delete, incl. recaps) | content-reviewer | fable (override) | L | running |
