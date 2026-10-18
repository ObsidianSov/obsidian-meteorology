const { DATA_SOURCES, buildArchiveUrl, parseArchiveResponse, EARLIEST_ARCHIVE_YEAR, ARCHIVE_BASE_URL } = require('./data_sources.js');

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

console.log(`\nRESULTS: ${passed}/${total} tests passed`);
process.exit(passed === total ? 0 : 1);
