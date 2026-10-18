# Data sources

Audit of every data provider the app uses (Milestone 3). The machine-readable version is
`DATA_SOURCES` in `data_sources.js`; the page shows the same labels.

| | NASA POWER | ERA5 via Open-Meteo | Open-Meteo forecast |
|---|---|---|---|
| Used for | Historical analysis (main) | Second-source check | Live view and 7-day forecast |
| What it is | Gridded estimate for the chosen coordinates | Reanalysis (ECMWF ERA5 / ERA5-Land) | Weather-model values |
| Station observation? | **No** | **No** | **No** |
| Variables | T2M (°C), PRECTOTCORR (mm/day) | temperature_2m_mean (°C), precipitation_sum (mm) | temperature, humidity, wind, pressure, precipitation, weather code |
| Coverage | 1981 to near present | 1940 to about 2 days ago | now and 7 days ahead |
| Origin | Mostly MERRA-2 reanalysis; an IMERG-based precipitation option exists (per a NASA POWER evaluation poster) | ECMWF reanalysis | numerical weather prediction models |
| Resolution | not yet verified | about 9 to 25 km (per Open-Meteo) | not yet verified |
| Licence | not yet verified (check NASA POWER terms) | CC BY 4.0, attribution | CC BY 4.0, attribution |
| Requested as | `power.larc.nasa.gov/api/temporal/daily/point` | `archive-api.open-meteo.com/v1/archive` | `api.open-meteo.com/v1/forecast` |

## What the app does with them

- Missing values are dropped, never turned into zeros (both historical sources).
- The ERA5 response is checked before use: error flag, units (mm and °C), matching array lengths,
  readable dates. Anything unexpected shows a message and leaves the NASA results untouched.
- The time each source was retrieved is shown on the page.
- Loaded data is kept in memory, so switching between Student, Advanced and NiMET does not download it again.

## Known problems

- NASA POWER rainfall for Katsina 2020 to 2024 looks anomalous (see `STATUS.md`). The second-source
  check exists to test whether ERA5 shows the same jump.
- Both historical sources are reanalyses. Agreement between them is encouraging but they are not
  independent of all assumptions. A rain-gauge-based source (for example CHIRPS) or station data would be stronger.
- The ERA5 request uses the service's default model selection, so the exact model behind each day
  is not recorded.
- Not yet verified by this project: NASA POWER resolution and licence, and the live ERA5 request
  (it could only be tested against fixtures).
