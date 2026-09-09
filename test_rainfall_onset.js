const {
  dateStringToDayOfYear,
  dayOfYearToDateString,
  groupDailyByYear,
  detectOnsetForYear,
  computeOnsetDatesAllYears,
  coefficientOfVariation,
  onsetVariability
} = require('./rainfall_onset.js');

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

// Test 1: date <-> day-of-year conversion, including leap year handling
check("Jan 1 is day 1", dateStringToDayOfYear("20200101") === 1);
check("Feb 1 is day 32", dateStringToDayOfYear("20200201") === 32);
check("Dec 31 2020 (leap year) is day 366", dateStringToDayOfYear("20201231") === 366);
check("Dec 31 2021 (non-leap year) is day 365", dateStringToDayOfYear("20211231") === 365);
check("day-of-year round-trips back to date string", dayOfYearToDateString(2020, 1) === "2020-01-01");
check("day 366 round-trips correctly in leap year", dayOfYearToDateString(2020, 366) === "2020-12-31");

// Test 2: clean onset — 3-day window hits 20mm around day 150, no dry spell after
const cleanYear = [];
for (let d = 1; d <= 200; d++) cleanYear.push({ dayOfYear: d, value: 0 });
cleanYear[149] = { dayOfYear: 150, value: 8 };   // day 150
cleanYear[150] = { dayOfYear: 151, value: 7 };   // day 151
cleanYear[151] = { dayOfYear: 152, value: 6 };   // day 152 — sum = 21mm, triggers candidate
// sustained light rain afterwards so no 10+ day dry spell follows
for (let d = 153; d <= 180; d += 5) cleanYear[d - 1] = { dayOfYear: d, value: 2 };
const cleanOnset = detectOnsetForYear(cleanYear);
check("detects clean onset at day 150", cleanOnset === 150);

// Test 3: false start — early burst of rain followed by a long dry spell should be rejected
const falseStartYear = [];
for (let d = 1; d <= 200; d++) falseStartYear.push({ dayOfYear: d, value: 0 });
falseStartYear[69] = { dayOfYear: 70, value: 9 };
falseStartYear[70] = { dayOfYear: 71, value: 8 };
falseStartYear[71] = { dayOfYear: 72, value: 8 }; // day 70-72 sums to 25mm — looks like onset
// but then a 20-day dry spell follows (days 73-92) — exceeds maxDrySpellDays=10, so this is a false start
falseStartYear[159] = { dayOfYear: 160, value: 8 };
falseStartYear[160] = { dayOfYear: 161, value: 7 };
falseStartYear[161] = { dayOfYear: 162, value: 6 }; // real onset at day 160
for (let d = 163; d <= 190; d += 5) falseStartYear[d - 1] = { dayOfYear: d, value: 2 };
const rejectedFalseStart = detectOnsetForYear(falseStartYear);
check("rejects false start and finds real onset at day 160", rejectedFalseStart === 160);

// Test 4: no valid onset in the data (e.g. drought year / insufficient rain)
const droughtYear = [];
for (let d = 1; d <= 200; d++) droughtYear.push({ dayOfYear: d, value: 0.5 });
check("returns null when no window ever reaches threshold", detectOnsetForYear(droughtYear) === null);

// Test 5: computeOnsetDatesAllYears groups multiple years correctly
const multiYearSeries = [
  { date: "20200601", year: 2020, value: 25 },
  { date: "20200602", year: 2020, value: 0 },
  { date: "20200603", year: 2020, value: 0 },
  { date: "20210301", year: 2021, value: 0 },
];
const multiYearOnsets = computeOnsetDatesAllYears(multiYearSeries, { startDayOfYear: 1, dryspellCheckDays: 1, maxDrySpellDays: 30 });
check("computeOnsetDatesAllYears returns one entry per year", multiYearOnsets.length === 2);
check("computeOnsetDatesAllYears finds 2020 onset from a single 25mm day", multiYearOnsets.find(y => y.year === 2020).onsetDayOfYear !== null);

// Test 6: coefficient of variation — known values
const cvResult = coefficientOfVariation([10, 20, 30]);
check("CV mean is correct (20)", cvResult.mean === 20);
check("CV stdDev is correct (~8.16)", Math.abs(cvResult.stdDev - 8.16) < 0.01);
check("CV percentage is correct (~40.82)", Math.abs(cvResult.cv - 40.82) < 0.01);
check("CV of identical values is 0", coefficientOfVariation([10, 10, 10]).cv === 0);

// Test 7: onsetVariability separates valid onsets from missing years
const onsetResults = [
  { year: 2019, onsetDayOfYear: 150, onsetDate: "2019-05-30" },
  { year: 2020, onsetDayOfYear: 160, onsetDate: "2020-06-08" },
  { year: 2021, onsetDayOfYear: null, onsetDate: null },
  { year: 2022, onsetDayOfYear: 145, onsetDate: "2022-05-25" },
];
const variability = onsetVariability(onsetResults);
check("onsetVariability counts valid years correctly (3)", variability.yearsWithValidOnset === 3);
check("onsetVariability tracks total years (4)", variability.yearsTotal === 4);
check("onsetVariability flags the missing year (2021)", variability.missingYears.length === 1 && variability.missingYears[0] === 2021);
check("onsetVariability mean is based only on valid onsets", variability.mean === Math.round(((150 + 160 + 145) / 3) * 100) / 100);

console.log(`\nRESULTS: ${passed}/${total} tests passed`);
process.exit(passed === total ? 0 : 1);
