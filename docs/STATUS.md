# Project Status

Where the project stands right now. Updated at the end of every milestone or step.
(The README describes what the project is. This file says where we stopped.)

**Last updated:** 18 Oct 2026
**Current milestone:** 3, Weather and Climate Data Reliability (in progress, steps 1 to 3 done)
**Last completed milestone:** 1, Scientific Core Stabilisation (tag `m1-complete`)

## Done

### Milestone 0 and Milestone 1 (complete)
- Audit, single-file build, missing-data handling, verified onset criterion, honest trend tests, unusual-year flags, whole-pipeline cross-check against independent Python. See `docs/audit-m0.md`, `onset-method.md`, `trend-method.md`, `validation.md`.

### Milestone 3, step 1: second source and provenance
- Data-source audit; ERA5 via Open-Meteo as a second source; year-by-year comparison.
- **Finding:** NASA POWER rainfall for Katsina jumps in 2020 to 2024 (983 to 1,785 mm) while ERA5 does not (320 to 544 mm); NASA also runs about 220 mm a year above ERA5 before 2020. Temperature agrees (r = 0.80).

### Milestone 3, step 2: reliable requests and saved copies
- Time limits, retries, clear messages; saved copies for 7 days; automatic second-source check with a warning banner. Confirmed on the phone.

### Milestone 3, step 3: honest live view and disputed trends
- The live view labels every number as a weather-model value with its model time and fetch time. Fixed misleading labels: "Station Reading" and "Measured at 10 m" (NiMET view) and "Rain today" (which was only the latest model interval).
- A missing value from the weather service now shows as "n/a" with a count, instead of being shown as 0 (temperature) or crashing the page (rain). Short or empty forecasts are handled.
- When the second source disagrees about a trend, a "Disputed:" note appears directly under the headline trend sentence (before, only the banner at the top warned).
- Tests: 583 of 583 pass across 11 files; the live view was driven through five bad-response cases without errors.

## Known issues
- NASA POWER rainfall for Katsina cannot be trusted yet. Waiting for station data (about two months, from the SIWES placement). Do not quote the 1990 to 2024 rainfall trend.
- NASA POWER resolution and licence are not yet verified.
- Mann-Kendall assumes independent years; autocorrelation is not corrected.
- Charts need an internet connection (Chart.js from a CDN).

## Next up
4. Milestone 3, last step: verify NASA POWER's resolution and licence; close the milestone (tag `m3-complete`).
Then: a station-data CSV import, so the comparison engine is ready when the station data arrives. After that, Milestone 2 (phone-first interface structure, seasons and months view, offline charts).

## Changing code
Edit `index.src.html` or a module, run `node build.js`, then `node run_tests.js`.

## How to update this file
At the end of each milestone or step: move it to "Done", update "Next up", and
update the date. Then commit and push.
