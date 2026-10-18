// End-to-end check of the whole historical pipeline against results computed independently in Python
// (pandas, numpy, pymannkendall, scipy). The input is a NASA-POWER-shaped dataset with deliberate problems:
// missing days, a year with 60 missing days, a year with no data, a missing day in the onset search period,
// a missing month after the onset, and a partial last year. See fixtures/pipeline_reference.json.
const fs = require("fs");
const { parseNasaPowerSeries, aggregateAnnualRainfall, aggregateAnnualMeanTemp, selectCompleteYears } = require("./climate_math.js");
const { computeOnsetDatesAllYears, onsetVariability } = require("./rainfall_onset.js");
const { analyzeTrend } = require("./trend_stats.js");

const ref = JSON.parse(fs.readFileSync("./fixtures/pipeline_reference.json", "utf8"));
const exp = ref.expected;
const [startY, endY] = ref.years;
const param = ref.input.properties.parameter;

let passed = 0, total = 0;
function check(name, condition) {
  total++;
  if (condition) { passed++; console.log(`PASS: ${name}`); }
  else console.log(`FAIL: ${name}`);
}
const close = (a, b, tol) => Math.abs(a - b) <= tol;

// Same steps as the page
const dailyPrecip = parseNasaPowerSeries(param.PRECTOTCORR);
const dailyTemp = parseNasaPowerSeries(param.T2M);
const rainSel = selectCompleteYears(aggregateAnnualRainfall(dailyPrecip), startY, endY);
const tempSel = selectCompleteYears(aggregateAnnualMeanTemp(dailyTemp), startY, endY);
const years = []; for (let y = startY; y <= endY; y++) years.push(y);
const onsets = computeOnsetDatesAllYears(dailyPrecip, {}, years);
const onsetStats = onsetVariability(onsets);

// ----- completeness and annual values -----
check("rainfall: the same years are eligible", JSON.stringify(rainSel.eligible.map(e => e.year)) === JSON.stringify(exp.rain_eligible.map(e => e.year)));
check("rainfall: the same years are excluded", JSON.stringify(rainSel.excluded.map(e => e.year)) === JSON.stringify(exp.rain_excluded.map(e => e.year)));
check("rainfall: valid-day counts match for every eligible year", rainSel.eligible.every((e, i) => e.validDays === exp.rain_eligible[i].validDays));
check("rainfall: annual totals match pandas (within rounding)", rainSel.eligible.every((e, i) => close(e.total, exp.rain_eligible[i].value, 0.06)));
check("rainfall: coverage matches for eligible and excluded years", rainSel.eligible.every((e, i) => close(e.coverage, exp.rain_eligible[i].coverage, 1e-9)) && rainSel.excluded.every((e, i) => close(e.coverage, exp.rain_excluded[i].coverage, 1e-9) && e.validDays === exp.rain_excluded[i].validDays));
check("temperature: the same years are eligible and excluded", JSON.stringify(tempSel.eligible.map(e => e.year)) === JSON.stringify(exp.temp_eligible.map(e => e.year)) && JSON.stringify(tempSel.excluded.map(e => e.year)) === JSON.stringify(exp.temp_excluded.map(e => e.year)));
check("temperature: annual means match pandas (within rounding)", tempSel.eligible.every((e, i) => close(e.mean, exp.temp_eligible[i].value, 0.06)));
check("the year with 60 missing days (2005) is excluded, not filled with zeros", rainSel.excluded.some(e => e.year === 2005 && e.coverage < 0.95));
check("the year with no data (2008) is excluded with 0 valid days", rainSel.excluded.some(e => e.year === 2008 && e.validDays === 0));
check("the partial last year (2021) is excluded", rainSel.excluded.some(e => e.year === 2021));
check("the year with 3 missing days (2003) is still used", rainSel.eligible.some(e => e.year === 2003 && e.validDays === 362));

// ----- onset -----
for (const e of exp.onsets) {
  const j = onsets.find(o => o.year === e.year);
  check(`onset ${e.year}: day and status match the Python reference (${e.day === null ? "none" : e.day}, ${e.status})`, j.onsetDayOfYear === e.day && j.status === e.status);
}
check("onset: mean matches numpy", close(onsetStats.mean, exp.onset_mean, 0.051));
check("onset: standard deviation matches numpy (population)", close(onsetStats.stdDev, exp.onset_std_population, 0.006));
check("onset: number of detected years matches", onsetStats.yearsWithValidOnset === exp.onset_n);
check("the partial year (2021) is 'insufficient_data', not 'none'", onsets.find(o => o.year === 2021).status === 'insufficient_data');
check("the year with 60 missing days (2005) and the absent year (2008) are 'insufficient_data'", ["2005", "2008"].every(y => onsets.find(o => o.year === Number(y)).status === 'insufficient_data'));

// ----- trends -----
function compareTrend(name, pts, e) {
  const a = analyzeTrend(pts);
  check(`${name}: number of years matches`, a.n === e.n);
  check(`${name}: Mann-Kendall S and Z match pymannkendall`, a.s === e.s && close(a.z, e.z, 1e-9));
  check(`${name}: p-value matches pymannkendall`, close(a.p, e.p, 1e-8));
  check(`${name}: Sen's slope and 95% range match scipy`, close(a.slope, e.slope, 1e-9) && close(a.slopeLow, e.low, 1e-9) && close(a.slopeHigh, e.high, 1e-9));
  const verdict = e.n < 10 ? 'too_few' : (e.trend === 'no trend' ? 'none' : e.trend);
  check(`${name}: verdict is '${verdict}'`, a.verdict === verdict);
}
compareTrend("rainfall trend", rainSel.eligible.map(e => ({ year: e.year, value: e.total })), exp.rain_trend);
compareTrend("temperature trend", tempSel.eligible.map(e => ({ year: e.year, value: e.mean })), exp.temp_trend);
compareTrend("onset trend", onsets.filter(o => o.onsetDayOfYear !== null).map(o => ({ year: o.year, value: o.onsetDayOfYear })), exp.onset_trend);

console.log(`\nRESULTS: ${passed}/${total} tests passed`);
process.exit(passed === total ? 0 : 1);
