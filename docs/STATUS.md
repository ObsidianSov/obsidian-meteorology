# Project Status

Where the project stands right now. Updated at the end of every milestone or step.
(The README describes what the project is. This file says where we stopped.)

**Last updated:** 17 Oct 2026
**Current milestone:** 1, Scientific Core Stabilisation (in progress, steps 1 and 2 of 6 done)
**Last completed milestone:** 0, Repository Audit

## Done

### Milestone 0: Repository Audit
- Read every file and ran every test suite: 65 of 65 pass.
- Wrote the bug register (B1 to B10) and scientific-risk register (S1 to S5): `docs/audit-m0.md`
- Rewrote `README.md` to match the real code, with a status label on each feature.
- Added `run_tests.js` (one command runs every test).

### Milestone 1, step 1: one source of truth (fixes B1)
- `index.html` loads `knowledge_layer.js`, `climate_math.js` and `rainfall_onset.js` instead of carrying its own copies.
- Added `test_index_wiring.js`: the page loads each module and redefines none of their functions.

### Milestone 1, step 2: missing data is never zero (fixes B2, B3, B4, B6, B7)
- Each year's valid days are counted. A year needs at least 95% valid days (a project choice, not a WMO standard) to be used in totals, trends and records.
- Years left out are listed on the page with their coverage, including years with no data at all.
- A partial last year can no longer distort the trend (tested: the false negative trend disappears once it is excluded).
- Rainy-season onset no longer treats missing days as dry days. Each year now has a status: detected, none, or insufficient data (shown on the page).
- Onset is no longer accepted when fewer than 30 days remain to check for a dry spell.
- `findExtremeYear` on an empty list returns null instead of crashing.
- The page needs at least 3 usable years to show trends, and the start year must not be after the end year.
- Tests: 144 of 144 pass. Checked the real page in a simulated browser with clean data, data with gaps and a too-short range.

## Known state of the app
- Not yet tested in a real browser on a phone (open index.html, tap the three views, press Load Data).
- Historical results are still experimental: no significance testing yet, and the onset criterion label is unverified.

## Next up: Milestone 1, remaining steps
3. Onset day (can be 1 to 2 days early) and verify the criterion against its source (B5, S3)
4. Mann-Kendall and Sen's slope with p-value; honest wording (S1, S4)
5. Remaining edge cases (B8, B9)
6. Cross-check against an independent Python (SciPy) calculation

## How to update this file
At the end of each milestone or step: move it to "Done", update "Next up", and
update the date. Then commit and push.
