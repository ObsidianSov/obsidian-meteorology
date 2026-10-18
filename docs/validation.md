# Validation record

What has been checked, how, and what has not.

## Milestone 1 (17 to 18 Oct 2026)

| Component | Checked against | Result |
|---|---|---|
| Mann-Kendall S, variance, Z, p, tau | `pymannkendall` 1.4.3 on 7 series (noise, trends, ties, constant, short) | agree to 1e-9 (p to 1e-8) |
| Sen's slope and 95% range | `scipy.stats.theilslopes` (scipy 1.17.1) on the same series | agree to 1e-9 |
| Quartiles for unusual-year flags | `numpy.percentile` on 4 series | agree to 1e-9 |
| Normal CDF and erfc | Python `math.erfc` and `scipy.stats.norm` over -8 to 8 | max error 5e-10 (relative) |
| Annual totals, means, coverage, year selection | `pandas` on a synthetic NASA-shaped dataset with deliberate gaps | agree (within 0.1 rounding) |
| Rainy-season onset (day and status, 22 years) | an independent Python implementation of the documented rule | all 22 agree |
| Trends on that dataset (rainfall, temperature, onset) | `pymannkendall` and `scipy` | agree |

All of these run on every `node run_tests.js` (`test_trend_stats.js`, `test_pipeline_golden.js`).

## Milestone 3 (18 Oct 2026)

| Component | Checked against | Result |
|---|---|---|
| Pearson r and Spearman rho between two sources | `scipy.stats.pearsonr` and `spearmanr` on 4 series | agree to 1e-10 |
| Fences for unusual source differences | `numpy.percentile` | agree |
| ERA5 (Open-Meteo archive) response parser | fixtures shaped like the documented response, plus error, unit and missing-value cases | passes |
| Request and response with the **live** Open-Meteo archive | not yet checked from this environment (no network access to it) | **to be confirmed on a phone** |

False-alarm rate: a simulation (35 years, normal noise) showed the usual 1.5 x IQR fence would
wrongly report "sources disagree" in about 36% of comparisons, so the comparison uses 3 x IQR
(about 1%).

## What this does and does not prove

- The statistics (Mann-Kendall, Sen's slope, quartiles) were checked against independent,
  widely used libraries. These are strong checks.
- The onset reference was written by the same author as the JavaScript, from the same
  written rule. It proves the code does what `onset-method.md` says. It does **not** prove
  the rule is the right one for Katsina, and the original 1988 paper has not been read directly.
- Nothing has been validated against real station data yet. NASA POWER rainfall for Katsina
  looks anomalous for 2020 to 2024 (see `STATUS.md`).
- Not yet checked: behaviour with real autocorrelated series, and results for other locations.

## Bug found by this cross-check

A year whose data ended early (for example the current year, with data only to April) was
labelled "none" (no onset exists). It is now "insufficient data". Fixed in Milestone 1, step 6.
