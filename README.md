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
| Linear trend, wettest/driest/hottest/coolest year | Experimental |
| Rainy-season onset detection and variability | Experimental |
| Significance testing, data-completeness checks | Planned (Milestone 1) |
| CSV export | Planned |
| Instruments library, learning centre, remote sensing | Planned |
| Accounts and roles | Planned (needs a backend) |

## Files

- `index.html`: the application (interface, API calls, charts)
- `climate_math.js`, `rainfall_onset.js`, `knowledge_layer.js`: scientific modules
- `test_*.js`: unit tests, one per module
- `run_tests.js`: runs all tests
- `docs/`: audit and project documentation

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
