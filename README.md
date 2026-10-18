# Obsidian Meteorology

A browser-based meteorology tool for the Department of Meteorology, UMYU Katsina:
live weather, historical climate analysis, and role-based views for students,
lecturers, and NiMET-style users.

**Status: working prototype, not yet scientifically validated.**
A Milestone 0 audit is in [docs/audit-m0.md](docs/audit-m0.md). It lists the known
bugs and scientific limitations that are being fixed in Milestone 1. Until then,
treat the historical numbers as exploratory, not as research results.

## Feature status

| Feature | Status |
|---|---|
| Current conditions and 7-day forecast (Open-Meteo, model-derived) | Implemented |
| Location switcher (Katsina and other Nigerian cities) | Implemented |
| Student / Advanced / NiMET-style views | Implemented |
| Annual rainfall and mean temperature (NASA POWER, daily data from 1981) | Experimental |
| Trend test (Mann-Kendall with Sen's slope), wettest/driest/hottest/coolest year | Experimental |
| Rainy-season onset detection and variability | Experimental |
| Data-completeness checks, significance testing | Experimental |
| Automatic second-source check: NASA POWER vs ERA5 (Open-Meteo), with a warning banner | Experimental |
| Saved copies of downloads, retries and clear error messages | Implemented |
| CSV export | Planned |
| Instruments library, learning centre, remote sensing | Planned |
| Accounts and roles | Planned (needs a backend) |

## Files

- `index.html`: the app, a single self-contained file (open it any way you like). **Generated: never edit it directly.**
- `index.src.html`: the source of the page (interface, API calls, charts)
- `climate_math.js`, `trend_stats.js`, `rainfall_onset.js`, `knowledge_layer.js`, `data_sources.js`, `source_compare.js`, `cache_store.js`, `request_tools.js`: modules (one copy each, tested)
- `build.js`: combines `index.src.html` and the modules into `index.html`
- `test_*.js`: unit tests, including `test_pipeline_golden.js` (whole pipeline vs independent Python results in `fixtures/`); `run_tests.js` runs all of them
- `docs/`: audit, method notes (`onset-method.md`, `trend-method.md`), data sources (`data-sources.md`), validation record and project status

## Working on the code

1. Edit `index.src.html` or a module file.
2. Run `node build.js` to regenerate `index.html`.
3. Run `node run_tests.js`. One test fails if `index.html` is out of date.

## Run the tests

```
node run_tests.js
```

## Data sources

- Current conditions and forecast: [Open-Meteo](https://open-meteo.com) (CC BY 4.0).
  These are model-derived values, not station observations.
- Historical data: [NASA POWER](https://power.larc.nasa.gov), daily point data for
  temperature (T2M) and corrected precipitation (PRECTOTCORR). These are gridded
  estimates, not a Katsina station record. Resolution, processing and terms of use
  will be documented in Milestone 3.

## Author

Ahmad Suleiman (Obsidian), B.Sc. Meteorology, UMYU Katsina.
