# Project Status

Where the project stands right now. Updated at the end of every milestone or step.
(The README describes what the project is. This file says where we stopped.)

**Last updated:** 18 Oct 2026
**Current milestone:** 3, Weather and Climate Data Reliability (in progress, steps 1 and 2 done)
**Last completed milestone:** 1, Scientific Core Stabilisation (tag `m1-complete`)

## Done

### Milestone 0 and Milestone 1 (complete)
- Audit, single-file build, missing-data handling, verified onset criterion, honest trend tests, unusual-year flags, whole-pipeline cross-check against independent Python. See `docs/audit-m0.md`, `onset-method.md`, `trend-method.md`, `validation.md`.

### Milestone 3, step 1: second source and provenance
- Data-source audit (`docs/data-sources.md`, registry in `data_sources.js`). ERA5 via Open-Meteo as a second source, year-by-year comparison with a 3 x IQR fence and correlation, ERA5 overlaid on the charts. Confirmed working against the live service on the phone.
- **Finding:** NASA POWER rainfall for Katsina jumps in 2020 to 2024 (983 to 1,785 mm) while ERA5 does not (320 to 544 mm), and NASA runs about 220 mm a year above ERA5 even before 2020. Temperature agrees (r = 0.80).

### Milestone 3, step 2: reliable requests and saved copies
- Time limits, retries with growing waits for temporary problems, and clear messages (`request_tools.js`), used for NASA POWER, ERA5 and the live weather.
- Downloads saved on the device for 7 days, checked before saving, with retrieval time, age and a "Download a fresh copy" button (`cache_store.js`). Switching views never downloads again.
- The second-source check now runs automatically after every load; a warning banner appears at the top when the sources disagree strongly; if the check cannot run, the page says the results are not cross-checked.
- Tests: 536 of 536 pass across 10 files. Simulated-browser checks: success, two 503s then success, permanent 503, ERA5 rate limit, saved copies, refresh, view switching.

## Known issues
- NASA POWER rainfall for Katsina cannot be trusted yet (see above). Waiting for station data (about two months, from the SIWES placement). Do not quote the 1990 to 2024 rainfall trend.
- NASA POWER resolution and licence are not yet verified.
- Mann-Kendall assumes independent years; autocorrelation is not corrected.
- Charts need an internet connection (Chart.js from a CDN).

## Next up: Milestone 3
3. Live weather honesty: label forecast values as model output with their issue time; tests for incomplete live responses.
4. Verify NASA POWER's resolution and licence; close Milestone 3.
Then: prepare a station-data import (CSV) so the comparison engine is ready when the station data arrives.

## Changing code
Edit `index.src.html` or a module, run `node build.js`, then `node run_tests.js`.

## How to update this file
At the end of each milestone or step: move it to "Done", update "Next up", and
update the date. Then commit and push.
