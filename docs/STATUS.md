# Project Status

Where the project stands right now. Updated at the end of every milestone or step.
(The README describes what the project is. This file says where we stopped.)

**Last updated:** 18 Oct 2026
**Current milestone:** 3, Weather and Climate Data Reliability (in progress, step 1 done)
**Last completed milestone:** 1, Scientific Core Stabilisation (tag `m1-complete`)

## Done

### Milestone 0 and Milestone 1 (complete)
- Audit, single-file build, missing-data handling, verified onset criterion, honest trend tests (Mann-Kendall, Sen's slope), unusual-year flags, and a whole-pipeline cross-check against independent Python. See `docs/audit-m0.md`, `docs/onset-method.md`, `docs/trend-method.md`, `docs/validation.md`.

### Milestone 3, step 1: second source and data provenance
- Audited all three providers: `docs/data-sources.md`, and a registry in `data_sources.js`. Every source is labelled as a gridded estimate, reanalysis or model value, never as a station observation.
- New "Second source check": one button compares NASA POWER with ERA5 (Open-Meteo archive) year by year, flags years where the two differ far more than usual (3 x IQR fence, about 1% false alarms), reports correlation, and overlays ERA5 on both charts. It never says which source is right.
- The ERA5 response is validated (errors, units, missing values, alignment); failures show a clear message and leave the NASA results untouched.
- Retrieval times are shown. Loaded data is kept in memory: switching Student, Advanced or NiMET no longer downloads again.
- Tests: 468 of 468 pass across 8 files. Simulated-browser checks for success and for rate limit, service error, wrong units and network failure.

## Known issues
- **Not yet confirmed on the real ERA5 service**: the request and response format were checked only against fixtures and documentation. First real test is on the phone.
- NASA POWER rainfall for Katsina 2020 to 2024 looks anomalous. The second-source check should now tell us whether ERA5 shows it too. Do not quote the 1990 to 2024 rainfall trend yet.
- NASA POWER resolution and licence are not yet verified.
- Mann-Kendall assumes independent years; autocorrelation is not corrected.
- Charts need an internet connection (Chart.js from a CDN).

## Next up: Milestone 3
2. Request reliability: timeout, retry and a clear "service busy" message; cache downloads on the device with a visible age, so a repeat visit does not hit the services again.
3. Missing-data and incomplete-response tests for the live view; label forecast values as model output.
4. Verify NASA POWER's resolution and licence; close the milestone.

## Changing code
Edit `index.src.html` or a module, run `node build.js`, then `node run_tests.js`.

## How to update this file
At the end of each milestone or step: move it to "Done", update "Next up", and
update the date. Then commit and push.
