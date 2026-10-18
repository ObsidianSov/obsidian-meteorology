// Data sources: what each source is, how to request it, and how to read its answer safely.
// Pure functions — no network, testable in isolation. See docs/data-sources.md.

const DATA_SOURCES = {
  nasa_power: {
    id: "nasa_power",
    name: "NASA POWER",
    provider: "NASA Langley Research Center (POWER project)",
    product: "Daily point data, agroclimatology community (AG)",
    typeLabel: "Gridded estimate for the chosen coordinates (not a station observation)",
    origin: "Most meteorological parameters come from the MERRA-2 reanalysis; an IMERG-based precipitation option also exists (per a NASA POWER evaluation poster).",
    variables: {
      T2M: { name: "Air temperature at 2 m", unit: "°C" },
      PRECTOTCORR: { name: "Precipitation (corrected)", unit: "mm/day" }
    },
    coverage: "From 1981 to near the present",
    resolution: "Not yet verified by this project",
    licence: "Not yet verified by this project: check NASA POWER's terms of use",
    knownLimitations: [
      "Estimate for a grid cell, not a point measurement",
      "Reanalysis precipitation can have biases and discontinuities",
      "Katsina rainfall for 2020 to 2024 (983 to 1,785 mm a year) is not seen in ERA5 (320 to 544 mm); found on 18 Oct 2026, cause unknown, awaiting station data",
      "Katsina rainfall runs about 220 mm a year above ERA5 even before 2020, so the two disagree on the level"
    ]
  },
  era5_open_meteo: {
    id: "era5_open_meteo",
    name: "ERA5 via Open-Meteo",
    provider: "Open-Meteo Historical Weather API (data from ECMWF ERA5 / ERA5-Land)",
    product: "Daily archive, default model selection (ERA5-based)",
    typeLabel: "Reanalysis (a computer model constrained by observations), not a station observation",
    origin: "ERA5 and ERA5-Land reanalysis from ECMWF, served by Open-Meteo",
    variables: {
      temperature_2m_mean: { name: "Mean air temperature at 2 m", unit: "°C" },
      precipitation_sum: { name: "Precipitation sum (rain, showers and snow)", unit: "mm" }
    },
    coverage: "From 1940 to about two days before today",
    resolution: "About 9 to 25 km (ERA5 and ERA5-Land), per Open-Meteo",
    licence: "CC BY 4.0 with attribution (Open-Meteo)",
    knownLimitations: [
      "A reanalysis, not truth: tropical rainfall in reanalyses can be biased",
      "The exact model used for each day is chosen by the service"
    ]
  },
  open_meteo_forecast: {
    id: "open_meteo_forecast",
    name: "Open-Meteo forecast",
    provider: "Open-Meteo",
    product: "Current conditions and 7-day forecast",
    typeLabel: "Weather-model values (not station observations)",
    origin: "Numerical weather prediction models, selected by the service",
    variables: {
      temperature_2m: { name: "Air temperature at 2 m", unit: "°C" },
      precipitation_sum: { name: "Daily precipitation", unit: "mm" }
    },
    coverage: "Now and the next 7 days",
    resolution: "Not yet verified by this project",
    licence: "CC BY 4.0 with attribution (Open-Meteo)",
    knownLimitations: ["Model estimates, not measurements", "Forecast skill drops with lead time"]
  }
};

const ARCHIVE_BASE_URL = "https://archive-api.open-meteo.com/v1/archive";
const EARLIEST_ARCHIVE_YEAR = 1940;

function buildArchiveUrl(lat, lon, startYear, endYear) {
  const la = Number(lat), lo = Number(lon), sy = Number(startYear), ey = Number(endYear);
  if (!Number.isFinite(la) || la < -90 || la > 90) throw new Error("latitude must be a number between -90 and 90");
  if (!Number.isFinite(lo) || lo < -180 || lo > 180) throw new Error("longitude must be a number between -180 and 180");
  if (!Number.isInteger(sy) || !Number.isInteger(ey)) throw new Error("start and end year must be whole numbers");
  if (sy > ey) throw new Error("the start year must not be after the end year");
  if (sy < EARLIEST_ARCHIVE_YEAR) throw new Error(`the archive starts in ${EARLIEST_ARCHIVE_YEAR}`);
  return `${ARCHIVE_BASE_URL}?latitude=${la}&longitude=${lo}` +
    `&start_date=${sy}-01-01&end_date=${ey}-12-31` +
    `&daily=temperature_2m_mean,precipitation_sum`;
}

function parseArchiveResponse(json) {
  // Returns { ok: true, rain, temp, missingRain, missingTemp } with series shaped like parseNasaPowerSeries output
  // ([{date: 'YYYYMMDD', year, value}]), or { ok: false, error } with a message a person can act on.
  // Missing or non-numeric days are dropped, never turned into zeros.
  if (!json || typeof json !== "object") return { ok: false, error: "The service returned something that is not data." };
  if (json.error) return { ok: false, error: json.reason ? `The service reported an error: ${json.reason}` : "The service reported an error." };
  const d = json.daily;
  if (!d || !Array.isArray(d.time)) return { ok: false, error: "The response has no daily data." };
  const units = json.daily_units || {};
  if (units.precipitation_sum !== undefined && units.precipitation_sum !== "mm")
    return { ok: false, error: `Unexpected unit for precipitation: ${units.precipitation_sum} (expected mm).` };
  if (units.temperature_2m_mean !== undefined && units.temperature_2m_mean !== "°C")
    return { ok: false, error: `Unexpected unit for temperature: ${units.temperature_2m_mean} (expected °C).` };
  for (const name of ["precipitation_sum", "temperature_2m_mean"]) {
    if (!Array.isArray(d[name])) return { ok: false, error: `The response is missing ${name}.` };
    if (d[name].length !== d.time.length) return { ok: false, error: `${name} does not line up with the dates.` };
  }
  const convert = (values) => {
    const out = []; let missing = 0;
    for (let i = 0; i < d.time.length; i++) {
      const v = values[i], t = d.time[i];
      if (typeof t !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(t)) return null;
      if (typeof v === "number" && Number.isFinite(v)) out.push({ date: t.slice(0, 10).replace(/-/g, ""), year: parseInt(t.slice(0, 4), 10), value: v });
      else missing++;
    }
    return { series: out, missing };
  };
  const rain = convert(d.precipitation_sum), temp = convert(d.temperature_2m_mean);
  if (!rain || !temp) return { ok: false, error: "The response contains a date that could not be read." };
  return { ok: true, rain: rain.series, temp: temp.series, missingRain: rain.missing, missingTemp: temp.missing };
}

const LIVE_UNITS = { temperature_2m: "°C", apparent_temperature: "°C", wind_speed_10m: "km/h", precipitation: "mm", surface_pressure: "hPa", relative_humidity_2m: "%" };
const LIVE_CURRENT_FIELDS = ["temperature_2m", "relative_humidity_2m", "apparent_temperature", "wind_speed_10m", "precipitation", "weather_code", "surface_pressure"];
const LIVE_DAILY_FIELDS = ["temperature_2m_max", "temperature_2m_min", "precipitation_sum", "weather_code", "wind_speed_10m_max", "uv_index_max"];

function readLiveResponse(json) {
  // Checks the Open-Meteo forecast answer and returns { ok: true, current, daily, missingCount, problems }
  // where every value is a number or null (never 0 for a missing value), or { ok: false, error }.
  if (!json || typeof json !== "object") return { ok: false, error: "The service returned something that is not data." };
  if (json.error) return { ok: false, error: json.reason ? `The service reported an error: ${json.reason}` : "The service reported an error." };
  if (!json.current || typeof json.current !== "object") return { ok: false, error: "The response has no current conditions." };
  if (!json.daily || !Array.isArray(json.daily.time)) return { ok: false, error: "The response has no daily forecast." };
  const cu = json.current_units || {};
  for (const [name, unit] of Object.entries(LIVE_UNITS)) {
    if (cu[name] !== undefined && cu[name] !== unit) return { ok: false, error: `Unexpected unit for ${name}: ${cu[name]} (expected ${unit}).` };
  }
  const problems = [];
  let missingCount = 0;
  const num = (v) => (typeof v === "number" && Number.isFinite(v)) ? v : null;
  const current = { time: typeof json.current.time === "string" ? json.current.time : null };
  for (const f of LIVE_CURRENT_FIELDS) {
    current[f] = num(json.current[f]);
    if (current[f] === null) { missingCount++; problems.push(`current ${f} is missing`); }
  }
  const n = json.daily.time.length;
  const daily = { time: json.daily.time.slice() };
  for (const f of LIVE_DAILY_FIELDS) {
    const src = Array.isArray(json.daily[f]) ? json.daily[f] : [];
    if (!Array.isArray(json.daily[f])) problems.push(`daily ${f} is missing`);
    daily[f] = Array.from({ length: n }, (_, i) => num(src[i]));
    missingCount += daily[f].filter(v => v === null).length;
  }
  return { ok: true, current, daily, missingCount, problems };
}

if (typeof module !== "undefined") module.exports = {
  DATA_SOURCES,
  ARCHIVE_BASE_URL,
  EARLIEST_ARCHIVE_YEAR,
  buildArchiveUrl,
  parseArchiveResponse,
  readLiveResponse
};
