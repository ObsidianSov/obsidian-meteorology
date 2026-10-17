# Project Status

Where the project stands right now. Updated at the end of every milestone or step.
(The README describes what the project is. This file says where we stopped.)

**Last updated:** 17 Oct 2026
**Current milestone:** 1, Scientific Core Stabilisation (in progress, steps 1 to 3 of 6 done, plus a hotfix)
**Last completed milestone:** 0, Repository Audit

## Done

### Milestone 0: Repository Audit
- Read every file and ran every test suite: 65 of 65 pass.
- Bug register (B1 to B10) and scientific-risk register (S1 to S5): `docs/audit-m0.md`
- Rewrote `README.md`; added `run_tests.js`.

### Milestone 1, step 1: one source of truth (fixes B1)
- `index.html` loads the three module files instead of carrying copies; `test_index_wiring.js` guards this.

### Milestone 1, step 2: missing data is never zero (fixes B2, B3, B4, B6, B7)
- Years need at least 95% valid days; excluded years are listed on the page.
- Onset has three statuses (detected, none, insufficient data); missing days are never assumed dry.

### Milestone 1, step 3: onset criterion verified and corrected (fixes B5, S3)
- Checked against published sources: the criterion is Sivakumar (1988): from 1 May, at least 20 mm in 3 days, no dry sequence longer than 7 days in the next 30. The old code searched from 1 March and allowed 10 dry days, and was labelled "AGRHYMET/WMO", which could not be verified. The label is removed.
- Onset date is now the first wet day of the window (it could be 1 to 2 days early before).
- 1 May is computed per year, so leap years are handled correctly.
- Method documented in `docs/onset-method.md`, including choices the criterion does not fix.
- Onset values will differ from earlier versions (intended).
- Tests: 151 of 151 pass.

### Hotfix after step 3: single-file app restored
- Step 1 made `index.html` load the module files with `<script src>`. On the phone those files did not load and the page showed "getExplanation is not defined". Reproduced and fixed.
- `index.src.html` is now the source; `build.js` inlines the modules into `index.html`, so the app is again one self-contained file that works however it is opened.
- A test fails if `index.html` is out of date or depends on any external file except Chart.js.
- Lesson: the page was only tested in a simulated browser with all files present. From now on it is also tested as the single file alone.
- Tests: 160 of 160 pass.

## Known state of the app
- Needs a real-browser check on the phone after this hotfix (live view, three views, Load Data).
- Historical results are still experimental: no significance testing yet.

## Next up: Milestone 1, remaining steps
4. Mann-Kendall and Sen's slope with p-value; honest wording; replace the onset percentage (S1, S4)
5. Remaining edge cases (B8, B9)
6. Cross-check against an independent Python (SciPy) calculation

## Changing code from now on
Edit `index.src.html` or a module, run `node build.js`, then `node run_tests.js`.

## How to update this file
At the end of each milestone or step: move it to "Done", update "Next up", and
update the date. Then commit and push.
