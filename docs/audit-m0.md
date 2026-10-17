# Milestone 0: Repository Audit

Date: 17 Oct 2026. Scope: the `main` branch of `obsidian-meteorology` (frontend only).
Method: read every file, ran every test suite, and checked suspected problems with small experiments.
Not done yet: browser-level testing of the live app, and deployment checks.

## 1. File inventory

| File | Lines | Role |
|---|---|---|
| index.html | 912 | UI, styling, API calls, charts, and inline copies of all scientific code |
| climate_math.js | 79 | Annual aggregation, linear regression, extreme years |
| rainfall_onset.js | 127 | Rainfall onset detection and variability |
| knowledge_layer.js | 68 | Variable definitions for Student/Advanced tiers |
| test_*.js (3 files) | 216 | Unit tests for the three modules |
| README.md | 68 | Documentation (out of date, replaced in this milestone) |

## 2. Verified capabilities (evidence in brackets)

- All unit tests pass: 10 + 36 + 19 = 65 of 65 [`node run_tests.js`].
- Linear regression, annual aggregation, extreme-year detection, day-of-year conversion and the knowledge-layer lookups behave correctly on their tested cases.
- All 14 scientific functions and the knowledge base copied inline into `index.html` are currently identical to the module versions [normalised text comparison].
- Not verified: live data loading, charts, tier switching, and the layout on phone and laptop.

## 3. Known-bug register

| ID | Severity | Problem | Evidence | Target |
|---|---|---|---|---|
| B1 | High | Code duplicated: `index.html` carries its own copies of every module function, so tests exercise code that does not ship. | Compared 14 functions plus the knowledge base: identical today, but nothing keeps them in sync. | M1 |
| B2 | High | Missing days are dropped silently. Annual totals and means use whatever days exist, and nothing reports coverage per year. | Code reading (`parseNasaPowerSeries`, `aggregateAnnualRainfall`). | M1 |
| B3 | High | In onset detection, a missing day is counted as 0 mm (`valueByDay[day] \|\| 0`), so a gap looks like a dry spell. | Code reading. A direct test was not conclusive. | M1 |
| B4 | Medium | Onset is accepted even when fewer than 30 days of data remain to check for a dry spell. | Test: onset accepted with only 6 days of follow-up. | M1 |
| B5 | Medium | Onset day is the first day of the 3-day window, which can be a dry day, so reported onset can be 1 to 2 days early. | Test: burst on days 120 to 122 gave onset 119. | M1 |
| B6 | Medium | A partial final year would be treated like a complete year (a year with 0 mm appears as the driest year and distorts the trend). | Test: partial 2026 gave driest year and slope of minus 168 mm/year. Currently hidden only because the year picker is capped at 2025. | M1 |
| B7 | Low | `findExtremeYear` throws on an empty list. | Test. | M1 |
| B8 | Low | Regression with 2 points reports R² = 1. | Test. | M1 |
| B9 | Low | The year picker maximum (2025) is hardcoded. | Code reading. | M1 |
| B10 | Low | Chart.js loads from a CDN, so charts fail offline. | Code reading. | M2 |

## 4. Scientific-risk register

| ID | Risk | Detail | Target |
|---|---|---|---|
| S1 | Trends reported without significance | Trend text is generated from the sign of the slope alone. Pure random noise gave "increasing 0.3 mm/year" with R² = 0.002. Needs a significance test (Mann-Kendall with Sen's slope is the usual choice for rainfall) and wording that says when no trend is detectable. | M1 |
| S2 | Gridded data presented as record | NASA POWER values are gridded estimates, not a Katsina station record. The Student view says "wettest year on record". Open-Meteo "current conditions" are model-derived, not observations. | M1 (wording), M3 (provenance) |
| S3 | Onset criterion label unverified | The UI calls it the "AGRHYMET/WMO criterion". As far as I know the published version starts searching on 1 May and uses a 7-day dry spell; this code starts on 1 March and allows 10. The label must be checked against the original source or removed. | M1 |
| S4 | Onset variability reported as a percentage | The coefficient of variation uses day-of-year counted from 1 January, an arbitrary origin. Standard deviation in days is easier to interpret. | M1 |
| S5 | Short, single-location record | At most about 45 years at one grid point. Conclusions about climate change need to say so. | M4 |

## 5. Documentation corrections

- README still lists historical analysis as "next". It is already implemented. README rewritten in this milestone.
- Feature status labels (Implemented / Experimental / In development / Planned) added to the README, as the blueprint requires.

## 6. Plan for Milestone 1 (in order)

1. One source of truth: `index.html` loads the module files instead of carrying copies (B1).
2. Data completeness per year; missing is never zero (B2, B3, B6).
3. Onset fixes: confirm full follow-up window, correct onset day, document the method (B4, B5, S3).
4. Mann-Kendall and Sen's slope with p-value, plus honest wording (S1, S4).
5. Edge-case fixes (B7, B8, B9) and tests for every fix.
6. Cross-check results against an independent Python (SciPy) calculation.
