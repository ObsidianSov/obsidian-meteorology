# Project Status

Where the project stands right now. Updated at the end of every milestone or step.
(The README describes what the project is. This file says where we stopped.)

**Last updated:** 18 Oct 2026
**Current milestone:** 1, Scientific Core Stabilisation (in progress, steps 1 to 5 of 6 done)
**Last completed milestone:** 0, Repository Audit

## Done

### Milestone 0: Repository Audit
- Bug register (B1 to B10) and scientific-risk register (S1 to S5): `docs/audit-m0.md`; `README.md` rewritten; `run_tests.js` added.

### Milestone 1, step 1 and hotfix: one source of truth, single-file app (fixes B1)
- Modules exist once each. `index.src.html` is the page source; `node build.js` inlines the modules into the single-file `index.html`.

### Milestone 1, step 2: missing data is never zero (fixes B2, B3, B4, B6, B7)
- Years need at least 95% valid days; onset has three statuses and never treats missing days as dry.

### Milestone 1, step 3: onset criterion verified (fixes B5, S3)
- Sivakumar (1988). Method: `docs/onset-method.md`.

### Milestone 1, step 4: honest trends (fixes S1, S4, most of S2)
- Mann-Kendall and Sen's slope, checked against Python; a trend is only reported with 10+ years and p below 0.05. Method: `docs/trend-method.md`.

### Milestone 1, step 5: unusual years, edge cases (fixes B8, B9)
- Found on real data: NASA POWER rainfall for Katsina is 475 to 891 mm in 1990 to 2019 (no trend, p = 0.187), but 1,000 to 1,780 mm in 2020 to 2024, which made 1990 to 2024 a "significant increase" (p = 0.002). Cause unknown; possibly a data problem.
- New safeguard: years far outside the range of the others are flagged (never removed), the trend test is re-run without them, and the page warns when the verdict depends on them.
- B8: R² is n/a for fewer than 3 points. B9: the latest selectable year is set from the clock.
- Tests: 309 of 309 pass across 5 files.

## Known issues
- NASA POWER rainfall for Katsina 2020 to 2024 looks anomalous. Do not quote the 1990 to 2024 rainfall trend. A second data source (for example ERA5 or CHIRPS) is needed (Milestones 3 and 4).
- Mann-Kendall assumes independent years; autocorrelation is not corrected.
- Onset day-of-year can differ by one day in leap years (documented).

## Next up: Milestone 1, last step
6. Cross-check the whole pipeline (annual totals, completeness, onset, trend) against an independent Python calculation, then close Milestone 1.

## Changing code
Edit `index.src.html` or a module, run `node build.js`, then `node run_tests.js`.

## How to update this file
At the end of each milestone or step: move it to "Done", update "Next up", and
update the date. Then commit and push.
