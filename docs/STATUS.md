# Project Status

Where the project stands right now. Updated at the end of every milestone or step.
(The README describes what the project is. This file says where we stopped.)

**Last updated:** 17 Oct 2026
**Current milestone:** 1, Scientific Core Stabilisation (in progress, steps 1 to 4 of 6 done)
**Last completed milestone:** 0, Repository Audit

## Done

### Milestone 0: Repository Audit
- Bug register (B1 to B10) and scientific-risk register (S1 to S5): `docs/audit-m0.md`; `README.md` rewritten; `run_tests.js` added.

### Milestone 1, step 1 and hotfix: one source of truth, single-file app (fixes B1)
- Modules exist once each. `index.src.html` is the page source; `node build.js` inlines the modules into the single-file `index.html`, which opens from any place. A test fails if `index.html` is out of date.

### Milestone 1, step 2: missing data is never zero (fixes B2, B3, B4, B6, B7)
- Years need at least 95% valid days; excluded years are listed. Onset has three statuses and never treats missing days as dry.

### Milestone 1, step 3: onset criterion verified (fixes B5, S3)
- Sivakumar (1988): from 1 May, at least 20 mm in 3 days, no dry sequence longer than 7 days in the next 30. Onset date is the first wet day. Method: `docs/onset-method.md`.

### Milestone 1, step 4: honest trends (fixes S1, S4, most of S2)
- New module `trend_stats.js`: Mann-Kendall test and Sen's slope with a 95% range. Checked against Python (`pymannkendall`, `scipy`) on seven reference series.
- The page no longer calls a trend from the sign of a slope. A trend is reported only with at least 10 years and p below 0.05; otherwise it says "No statistically detectable trend" and shows the estimate with its range. The wording is tested so it cannot overclaim.
- Onset variability is now a mean date and a standard deviation in days (the percentage is gone).
- "Wettest year on record" is now "in this dataset"; a note on the page says the historical data are gridded estimates, not station readings; the live view says values are model-derived.
- Method documented in `docs/trend-method.md`, including what it does not establish (cause, autocorrelation).
- Tests: 274 of 274 pass across 5 files.

## Known state of the app
- Checked in a simulated browser (clean, gappy and too-short data). Please check on the phone: Load Data, then read the summary.
- Still open: B8 (2-point R²), B9 (hardcoded max year 2025), autocorrelation not corrected.

## Next up: Milestone 1, remaining steps
5. Remaining edge cases (B8, B9)
6. Final cross-check of the full pipeline against an independent Python calculation, then close Milestone 1

## Changing code
Edit `index.src.html` or a module, run `node build.js`, then `node run_tests.js`.

## How to update this file
At the end of each milestone or step: move it to "Done", update "Next up", and
update the date. Then commit and push.
