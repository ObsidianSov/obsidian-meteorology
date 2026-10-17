# Project Status

Where the project stands right now. Updated at the end of every milestone or step.
(The README describes what the project is. This file says where we stopped.)

**Last updated:** 17 Oct 2026
**Current milestone:** 1, Scientific Core Stabilisation (in progress, step 1 of 6 done)
**Last completed milestone:** 0, Repository Audit

## Done

### Milestone 0: Repository Audit
- Read every file and ran every test suite: 65 of 65 pass.
- Wrote the bug register (B1 to B10) and scientific-risk register (S1 to S5): `docs/audit-m0.md`
- Rewrote `README.md` to match the real code, with a status label on each feature.
- Added `run_tests.js` (one command runs every test).

### Milestone 1, step 1: one source of truth (fixes B1)
- `index.html` no longer carries its own copies of the scientific code. It loads `knowledge_layer.js`, `climate_math.js` and `rainfall_onset.js`.
- The two modules that crashed in a browser (`module.exports` without a guard) now load safely in both Node and the browser.
- Added `test_index_wiring.js` (42 checks): the page loads each module, redefines none of their functions, and the modules load without Node.
- Checked the real page in a simulated browser with mocked data: live view, all three tiers and the historical analysis render exactly the same text as before the change.
- Total tests: 107 of 107 pass.

## Known state of the app
- Behaviour is unchanged by step 1; only the code layout changed.
- Not yet tested in a real browser on a phone (do this after step 1 is pushed: open index.html and click through the tiers and Load Data).
- Historical results are experimental until Milestone 1 is finished.

## Next up: Milestone 1, remaining steps
2. Data completeness per year; missing is never zero (B2, B3, B6)
3. Onset fixes and documented method (B4, B5, S3)
4. Mann-Kendall and Sen's slope with p-value; honest wording (S1, S4)
5. Edge-case fixes (B7, B8, B9)
6. Cross-check against an independent Python (SciPy) calculation

## How to update this file
At the end of each milestone or step: move it to "Done", update "Next up", and
update the date. Then commit and push.
