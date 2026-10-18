# Project Status

Where the project stands right now. Updated at the end of every milestone or step.
(The README describes what the project is. This file says where we stopped.)

**Last updated:** 18 Oct 2026
**Current milestone:** none started. Milestone 1 is complete; next is Milestone 2 (or Milestone 3 first, see below).
**Last completed milestone:** 1, Scientific Core Stabilisation

## Done

### Milestone 0: Repository Audit
- Bug register (B1 to B10) and scientific-risk register (S1 to S5): `docs/audit-m0.md`; `README.md` rewritten; `run_tests.js` added.

### Milestone 1: Scientific Core Stabilisation (complete)
- Step 1 and hotfix: modules exist once each; `index.src.html` plus `node build.js` produce the single-file `index.html` (B1).
- Step 2: missing data is never zero; years need 95% valid days; onset statuses (B2, B3, B4, B6, B7).
- Step 3: onset criterion verified, Sivakumar (1988); first wet day (B5, S3). `docs/onset-method.md`.
- Step 4: Mann-Kendall and Sen's slope, honest wording, onset spread in days (S1, S4, most of S2). `docs/trend-method.md`.
- Step 5: unusual-year flags and trend sensitivity; R² n/a below 3 points; latest year from the clock (B8, B9).
- Step 6: whole pipeline cross-checked against independent Python (pandas, numpy, pymannkendall, scipy). Found and fixed one bug: a year with data ending early was called "no onset" instead of "insufficient data". Record: `docs/validation.md`.
- Tests: 368 of 368 pass across 6 files.
- Bugs B1 to B9 fixed. B10 (Chart.js needs internet) moves to Milestone 2. S5 (short single-point record) is a limit to state, not fix.

## Known issues
- NASA POWER rainfall for Katsina 2020 to 2024 looks anomalous (1,000 to 1,780 mm vs 475 to 891 mm in 1990 to 2019). Do not quote the 1990 to 2024 rainfall trend. A second data source (ERA5 or CHIRPS) is needed.
- Mann-Kendall assumes independent years; autocorrelation is not corrected.
- Onset has not been validated against real station data; the 1988 source paper has not been read directly.
- Charts need an internet connection (Chart.js from a CDN).

## Next up
Decision for Obsidian: the data problem above suggests doing Milestone 3 (data reliability: a second source, provenance, caching) before Milestone 2 (interface structure). Milestone 2 would also take on the seasons and months view and the offline chart library.

## Changing code
Edit `index.src.html` or a module, run `node build.js`, then `node run_tests.js`.

## How to update this file
At the end of each milestone or step: move it to "Done", update "Next up", and
update the date. Then commit and push.
