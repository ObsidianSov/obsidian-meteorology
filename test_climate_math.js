const {
  parseNasaPowerSeries,
  aggregateAnnualRainfall,
  aggregateAnnualMeanTemp,
  linearRegression,
  findExtremeYear
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

console.log(`\nRESULTS: ${passed}/${total} tests passed`);
process.exit(passed === total ? 0 : 1);
