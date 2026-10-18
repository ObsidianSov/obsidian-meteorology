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

## Reliability (Milestone 3, step 2)

- Every request has a time limit (NASA POWER 60 s, ERA5 45 s, live weather 20 s) and is retried up to
  twice, with growing waits, for temporary problems: no connection, time-out, "too many requests" (429)
  and server errors (5xx). A rejected request (other 4xx) or an unreadable answer is not retried.
  Error messages say what happened and what to do.
- Downloads are saved on the device for 7 days (localStorage when the browser allows it, otherwise in
  memory). An answer is checked before it is saved, so bad data is never kept. The page shows the
  retrieval time and, for a saved copy, its age, with a "Download a fresh copy" button.
- The second-source check runs by itself after each load and shows a warning banner at the top when the
  two sources disagree strongly. If it cannot run, the page says so: the NASA results are shown but marked
  as not cross-checked.

## Live weather view (Milestone 3, step 3)

- Every number in the live view is a weather-model value, not a station reading. The page says so in a
  "Data source" card with the model time and the time it was fetched. The NiMET view no longer says
  "Station Reading" or "Measured at 10 m"; precipitation is labelled "latest model interval, not a
  24-hour total", and the Student card "Rain expected today" shows the model's daily total.
- The answer is checked before use (errors, units, missing parts). A missing value shows as "n/a" and the
  card counts how many were missing: it is never shown as 0 and never crashes the page.
- A forecast with fewer than 7 days shows the days it has.

## Known problems

- **Found 18 Oct 2026:** NASA POWER rainfall for Katsina is 983 to 1,785 mm a year in 2020 to 2024;
  ERA5 gives 320 to 544 mm for the same years, with no jump. Even before 2020 NASA runs about 220 mm
  a year above ERA5. Neither source is verified. Station data (expected in about two months) will
  decide. Until then the 1990 to 2024 NASA rainfall trend must not be quoted.
- Both historical sources are reanalyses. Agreement between them is encouraging but they are not
  independent of all assumptions. A rain-gauge-based source (for example CHIRPS) or station data would be stronger.
- The ERA5 request uses the service's default model selection, so the exact model behind each day
  is not recorded.
- Not yet verified by this project: NASA POWER resolution and licence, and the live ERA5 request
  (it could only be tested against fixtures).
