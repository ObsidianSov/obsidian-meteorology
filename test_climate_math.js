const {
  parseNasaPowerSeries,
  aggregateAnnualRainfall,
  aggregateAnnualMeanTemp,
  linearRegression,
  findExtremeYear,
  selectCompleteYears,
  daysInYear,
  DEFAULT_MIN_COVERAGE
} = require('./climate_math.js');

let passed = 0, total = 0;

function check(name, condition) {
  total++;
  if (condition) {
    passed++;
    console.log(`PASS: ${name}`);
  } else {
    console.log(`FAIL: ${name}`);
  }
}

// Test 1: parsing filters out NASA's missing-data sentinel (-999)
const rawPrecip = {
  "20200101": 5.2,
  "20200102": -999,  // missing data
  "20200103": 0.0,
  "20210101": 12.4
};
const parsed = parseNasaPowerSeries(rawPrecip);
check("parseNasaPowerSeries filters -999 missing values", parsed.length === 3);
check("parseNasaPowerSeries extracts year correctly", parsed[0].year === 2020 && parsed[2].year === 2021);

// Test 2: annual rainfall aggregation — known sum
const dailyPrecip = [
  { year: 2020, value: 10 },
  { year: 2020, value: 20 },
  { year: 2020, value: 5 },
  { year: 2021, value: 100 },
];
const annualRain = aggregateAnnualRainfall(dailyPrecip);
check("annual rainfall 2020 sums to 35", annualRain.find(y => y.year === 2020).total === 35);
check("annual rainfall 2021 sums to 100", annualRain.find(y => y.year === 2021).total === 100);

// Test 3: annual mean temperature — known average
const dailyTemp = [
  { year: 2020, value: 30 },
  { year: 2020, value: 32 },
  { year: 2020, value: 34 },
];
const annualTemp = aggregateAnnualMeanTemp(dailyTemp);
check("annual mean temp 2020 = 32 (average of 30,32,34)", annualTemp[0].mean === 32);

// Test 4: linear regression — perfect known line: value = 2*year - 4000 (slope should be exactly 2)
const perfectLine = [
  { year: 2000, value: 0 },
  { year: 2001, value: 2 },
  { year: 2002, value: 4 },
  { year: 2003, value: 6 },
];
const regression = linearRegression(perfectLine);
check("linear regression finds slope = 2 on a perfect line", regression.slope === 2);
check("linear regression finds R² = 1 on a perfect line (no noise)", regression.r2 === 1);

// Test 5: regression on flat data (no trend) should give slope ~0
const flatLine = [
  { year: 2000, value: 50 },
  { year: 2001, value: 50 },
  { year: 2002, value: 50 },
];
const flatRegression = linearRegression(flatLine);
check("linear regression finds slope = 0 on flat data", flatRegression.slope === 0);

// Test 6: findExtremeYear correctly identifies max and min
const yearlyRainData = [
  { year: 2020, total: 800 },
  { year: 2021, total: 1200 },
  { year: 2022, total: 600 },
];
const wettest = findExtremeYear(yearlyRainData, 'total', 'max');
const driest = findExtremeYear(yearlyRainData, 'total', 'min');
check("findExtremeYear identifies wettest year (2021)", wettest.year === 2021);
check("findExtremeYear identifies driest year (2022)", driest.year === 2022);


// ---------- Milestone 1 step 2: data completeness ----------
check("DEFAULT_MIN_COVERAGE is 0.95", DEFAULT_MIN_COVERAGE === 0.95);
check("daysInYear handles leap years (2020=366, 2021=365, 1900=365, 2000=366)",
  daysInYear(2020) === 366 && daysInYear(2021) === 365 && daysInYear(1900) === 365 && daysInYear(2000) === 366);

// parsing never fills gaps with zero, and drops non-numeric values too
const messy = parseNasaPowerSeries({ "20200101": 1, "20200102": -999, "20200103": null, "20200104": "x", "20200105": 0 });
check("missing, null and non-numeric values are removed, not turned into 0", messy.length === 2 && messy.every(d => d.value === 1 || d.value === 0) && messy[1].date === "20200105");

// aggregation records how many valid days each year really has
const aggMissing = aggregateAnnualRainfall([{ year: 2020, value: 5 }, { year: 2020, value: 5 }, { year: 2021, value: 1 }]);
check("aggregateAnnualRainfall reports validDays per year", aggMissing.find(y => y.year === 2020).validDays === 2 && aggMissing.find(y => y.year === 2021).validDays === 1);
check("aggregateAnnualMeanTemp reports validDays per year", aggregateAnnualMeanTemp([{ year: 2020, value: 30 }, { year: 2020, value: 32 }])[0].validDays === 2);

// selectCompleteYears: build 2021 (full), 2022 (full), 2023 (only 100 days), 2024 missing entirely, 2020 leap year full
function annualWith(year, validDays, total) { return { year, total, validDays }; }
const annualMix = [annualWith(2020, 366, 500), annualWith(2021, 365, 520), annualWith(2022, 365, 540), annualWith(2023, 100, 80)];
const sel = selectCompleteYears(annualMix, 2020, 2024);
check("complete years are kept (2020, 2021, 2022)", sel.eligible.map(y => y.year).join(",") === "2020,2021,2022");
check("a partial year is excluded with its coverage reported (2023 = 100/365)",
  sel.excluded.find(y => y.year === 2023).validDays === 100 && sel.excluded.find(y => y.year === 2023).coverage === 0.274);
check("a year with no data at all is excluded with 0% coverage, not skipped (2024)",
  sel.excluded.find(y => y.year === 2024).coverage === 0 && sel.excluded.find(y => y.year === 2024).validDays === 0);
check("every requested year is accounted for (eligible + excluded = 5)", sel.eligible.length + sel.excluded.length === 5);
check("a leap year needs 366 days to be 100% (2020 expectedDays = 366)", sel.eligible[0].expectedDays === 366 && sel.eligible[0].coverage === 1);

// threshold boundary: 347/365 = 0.9507 passes, 346/365 = 0.9479 fails
const edge = selectCompleteYears([annualWith(2021, 347, 1), annualWith(2022, 346, 1)], 2021, 2022);
check("95% boundary: 347 of 365 days is eligible, 346 is excluded", edge.eligible.length === 1 && edge.eligible[0].year === 2021 && edge.excluded[0].year === 2022);
check("minCoverage can be changed (50% keeps a 274-day year)", selectCompleteYears([annualWith(2021, 274, 1)], 2021, 2021, 0.5).eligible.length === 1);

// B6: a partial last year must not distort the trend once it is excluded
const stable = [];
for (let y = 2015; y <= 2024; y++) stable.push(annualWith(y, 365, 500));
const withPartial = [...stable, annualWith(2025, 60, 0)];   // 2025 has only 60 days so far
const trendWrong = linearRegression(withPartial.map(y => ({ year: y.year, value: y.total })));
const trendRight = linearRegression(selectCompleteYears(withPartial, 2015, 2025).eligible.map(y => ({ year: y.year, value: y.total })));
check("including the partial year gives a false negative trend (the bug)", trendWrong.slope < -10);
check("excluding the partial year gives a flat trend (slope 0)", trendRight.slope === 0);

// B7: an empty list no longer crashes
check("findExtremeYear on an empty list returns null instead of throwing", findExtremeYear([], 'total', 'max') === null);

console.log(`\nRESULTS: ${passed}/${total} tests passed`);
process.exit(passed === total ? 0 : 1);
