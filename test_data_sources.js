const { DATA_SOURCES, buildArchiveUrl, parseArchiveResponse, readLiveResponse, EARLIEST_ARCHIVE_YEAR, ARCHIVE_BASE_URL } = require('./data_sources.js');

let passed = 0, total = 0;
function check(name, condition) {
  total++;
  if (condition) { passed++; console.log(`PASS: ${name}`); }
  else console.log(`FAIL: ${name}`);
}

// ----- registry: every source must say what it is -----
const REQUIRED = ["id", "name", "provider", "product", "typeLabel", "origin", "coverage", "resolution", "licence"];
for (const [key, s] of Object.entries(DATA_SOURCES)) {
  check(`${key}: id matches its key and every descriptive field is filled in`, s.id === key && REQUIRED.every(f => typeof s[f] === "string" && s[f].length > 5));
  check(`${key}: every variable has a name and a unit`, Object.keys(s.variables).length > 0 && Object.values(s.variables).every(v => v.name && v.unit));
  check(`${key}: known limitations are listed`, Array.isArray(s.knownLimitations) && s.knownLimitations.length > 0);
}
check("NASA POWER is labelled as a gridded estimate, not a station observation", /not a station observation/.test(DATA_SOURCES.nasa_power.typeLabel));
check("ERA5 is labelled as a reanalysis, not a station observation", /Reanalysis/.test(DATA_SOURCES.era5_open_meteo.typeLabel) && /not a station observation/.test(DATA_SOURCES.era5_open_meteo.typeLabel));
check("the live forecast is labelled as model values, not observations", /not station observations/.test(DATA_SOURCES.open_meteo_forecast.typeLabel));
check("fields that have not been verified say so instead of guessing", /Not yet verified/.test(DATA_SOURCES.nasa_power.resolution) && /Not yet verified/.test(DATA_SOURCES.nasa_power.licence));

// ----- URL building -----
check("archive URL for Katsina 1990 to 2024 is exactly as documented",
  buildArchiveUrl(12.99, 7.6, 1990, 2024) === "https://archive-api.open-meteo.com/v1/archive?latitude=12.99&longitude=7.6&start_date=1990-01-01&end_date=2024-12-31&daily=temperature_2m_mean,precipitation_sum");
check("values given as text (from the page) are accepted", buildArchiveUrl("12.99", "7.6", "1990", "2024").includes("latitude=12.99&longitude=7.6"));
for (const [name, args] of [["latitude above 90", [91, 7, 1990, 2000]], ["longitude below -180", [10, -181, 1990, 2000]], ["start after end", [10, 7, 2005, 2000]],
  ["year before the archive starts", [10, 7, 1939, 2000]], ["a year that is not a whole number", [10, 7, 1990.5, 2000]], ["a non-numeric latitude", ["abc", 7, 1990, 2000]]]) {
  check(`URL building rejects ${name}`, (() => { try { buildArchiveUrl(...args); return false; } catch (e) { return true; } })());
}
check("the archive starts in 1940", EARLIEST_ARCHIVE_YEAR === 1940 && ARCHIVE_BASE_URL.startsWith("https://archive-api.open-meteo.com"));

// ----- parsing -----
const good = {
  latitude: 13, longitude: 7.5, daily_units: { time: "iso8601", temperature_2m_mean: "°C", precipitation_sum: "mm" },
  daily: { time: ["2020-01-01", "2020-01-02", "2020-01-03"], temperature_2m_mean: [24.1, 25.0, 23.8], precipitation_sum: [0, 5.2, 0.3] }
};
const p = parseArchiveResponse(good);
check("a good response is read", p.ok === true && p.rain.length === 3 && p.temp.length === 3);
check("dates become YYYYMMDD and the year is filled in, like NASA series", p.rain[1].date === "20200102" && p.rain[1].year === 2020 && p.rain[1].value === 5.2);
check("zero rain stays zero (a real value)", p.rain[0].value === 0);
const withNulls = JSON.parse(JSON.stringify(good)); withNulls.daily.precipitation_sum = [0, null, 0.3]; withNulls.daily.temperature_2m_mean = [24.1, 25.0, null];
const pn = parseArchiveResponse(withNulls);
check("null days are dropped, never turned into zeros", pn.ok && pn.rain.length === 2 && pn.missingRain === 1 && pn.temp.length === 2 && pn.missingTemp === 1 && !pn.rain.some(d => d.date === "20200102"));
check("text values and NaN are treated as missing", (() => { const x = JSON.parse(JSON.stringify(good)); x.daily.precipitation_sum = ["a", NaN, 1]; const r = parseArchiveResponse(x); return r.ok && r.rain.length === 1 && r.missingRain === 2; })());
check("an error response is reported with the service's reason", (() => { const r = parseArchiveResponse({ error: true, reason: "Daily API request limit exceeded" }); return r.ok === false && /Daily API request limit exceeded/.test(r.error); })());
check("an error flag without a reason still gives a message", parseArchiveResponse({ error: true }).ok === false);
check("null, text and numbers are not data", [null, "x", 5, undefined].every(v => parseArchiveResponse(v).ok === false));
check("a response with no daily block is rejected", parseArchiveResponse({ latitude: 1 }).ok === false);
check("a response with the wrong precipitation unit is rejected", (() => { const x = JSON.parse(JSON.stringify(good)); x.daily_units.precipitation_sum = "inch"; const r = parseArchiveResponse(x); return !r.ok && /inch/.test(r.error); })());
check("a response with the wrong temperature unit is rejected", (() => { const x = JSON.parse(JSON.stringify(good)); x.daily_units.temperature_2m_mean = "°F"; return !parseArchiveResponse(x).ok; })());
check("a missing variable is rejected", (() => { const x = JSON.parse(JSON.stringify(good)); delete x.daily.precipitation_sum; const r = parseArchiveResponse(x); return !r.ok && /precipitation_sum/.test(r.error); })());
check("arrays that do not line up with the dates are rejected", (() => { const x = JSON.parse(JSON.stringify(good)); x.daily.precipitation_sum = [1, 2]; return !parseArchiveResponse(x).ok; })());
check("an unreadable date is rejected", (() => { const x = JSON.parse(JSON.stringify(good)); x.daily.time[1] = "bad"; return !parseArchiveResponse(x).ok; })());
check("a response without a units block is still accepted (units are checked only when given)", (() => { const x = JSON.parse(JSON.stringify(good)); delete x.daily_units; return parseArchiveResponse(x).ok; })());


// ----- live forecast response (Milestone 3, step 3) -----
const days = ["2026-10-18", "2026-10-19", "2026-10-20"];
const liveGood = {
  current_units: { temperature_2m: "°C", relative_humidity_2m: "%", apparent_temperature: "°C", wind_speed_10m: "km/h", precipitation: "mm", surface_pressure: "hPa" },
  current: { time: "2026-10-18T12:00", temperature_2m: 33.1, relative_humidity_2m: 41, apparent_temperature: 34.2, wind_speed_10m: 12.5, precipitation: 0, weather_code: 1, surface_pressure: 965.2 },
  daily: { time: days, temperature_2m_max: [35, 36, 34], temperature_2m_min: [22, 23, 22], precipitation_sum: [0, 1.2, 0], weather_code: [1, 3, 61], wind_speed_10m_max: [20, 18, 25], uv_index_max: [9, 8, 9] }
};
const L = readLiveResponse(liveGood);
check("live: a complete answer is read with nothing missing", L.ok && L.missingCount === 0 && L.problems.length === 0 && L.daily.time.length === 3);
check("live: zero rain stays 0 (a real value)", L.current.precipitation === 0 && L.daily.precipitation_sum[0] === 0);
const liveNulls = JSON.parse(JSON.stringify(liveGood)); liveNulls.current.temperature_2m = null; liveNulls.current.precipitation = null; liveNulls.daily.precipitation_sum[1] = null;
const LN = readLiveResponse(liveNulls);
check("live: null values stay null and are counted (never turned into 0)", LN.ok && LN.current.temperature_2m === null && LN.current.precipitation === null && LN.daily.precipitation_sum[1] === null && LN.missingCount === 3);
check("live: the problems list says which values are missing", LN.problems.includes("current temperature_2m is missing"));
check("live: text and NaN become null", (() => { const x = JSON.parse(JSON.stringify(liveGood)); x.current.wind_speed_10m = "fast"; x.daily.uv_index_max[0] = NaN; const r = readLiveResponse(x); return r.current.wind_speed_10m === null && r.daily.uv_index_max[0] === null; })());
const liveShort = JSON.parse(JSON.stringify(liveGood)); liveShort.daily.temperature_2m_max = [35];
const LS = readLiveResponse(liveShort);
check("live: a daily list that is too short is padded with null, not with zeros", LS.ok && LS.daily.temperature_2m_max.length === 3 && LS.daily.temperature_2m_max[1] === null && LS.daily.temperature_2m_max[2] === null);
const liveNoArray = JSON.parse(JSON.stringify(liveGood)); delete liveNoArray.daily.uv_index_max;
const LA = readLiveResponse(liveNoArray);
check("live: a missing daily variable becomes a column of nulls and is reported", LA.ok && LA.daily.uv_index_max.every(v => v === null) && LA.problems.includes("daily uv_index_max is missing"));
check("live: a response with no current conditions is rejected", !readLiveResponse({ daily: liveGood.daily }).ok);
check("live: a response with no daily forecast is rejected", !readLiveResponse({ current: liveGood.current }).ok);
check("live: an error response gives the service's reason", /limit/.test(readLiveResponse({ error: true, reason: "rate limit" }).error));
check("live: null, text and numbers are not data", [null, "x", 5].every(v => readLiveResponse(v).ok === false));
check("live: a wrong unit is rejected", (() => { const x = JSON.parse(JSON.stringify(liveGood)); x.current_units.temperature_2m = "°F"; const r = readLiveResponse(x); return !r.ok && /°F/.test(r.error); })());
check("live: a missing units block is accepted", (() => { const x = JSON.parse(JSON.stringify(liveGood)); delete x.current_units; return readLiveResponse(x).ok; })());
check("live: the input is not changed", (() => { const x = JSON.parse(JSON.stringify(liveGood)); const copy = JSON.stringify(x); readLiveResponse(x); return JSON.stringify(x) === copy; })());

console.log(`\nRESULTS: ${passed}/${total} tests passed`);
process.exit(passed === total ? 0 : 1);
