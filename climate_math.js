// Pure functions for the historical climate layer — no network, testable in isolation

function parseNasaPowerSeries(paramObject) {
  // paramObject looks like: {"20200101": 25.3, "20200102": 26.1, ...}
  return Object.entries(paramObject).map(([dateStr, value]) => ({
    date: dateStr,
    year: parseInt(dateStr.substring(0, 4)),
    value: value
  })).filter(d => typeof d.value === 'number' && Number.isFinite(d.value) && d.value !== -999);
  // NASA POWER uses -999 for missing data. Missing days are REMOVED, never turned into zeros:
  // downstream code counts how many valid days each year really has.
}

const DEFAULT_MIN_COVERAGE = 0.95; // project choice (not a WMO standard): a year needs >= 95% valid days

function daysInYear(year) {
  return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
}

function aggregateAnnualRainfall(dailyPrecip) {
  // dailyPrecip: array of {year, value} — sums to annual totals
  // Output: [{year, total (mm, sum of VALID days only), validDays}]
  const byYear = {};
  for (const d of dailyPrecip) {
    if (!byYear[d.year]) byYear[d.year] = { sum: 0, count: 0 };
    byYear[d.year].sum += d.value;
    byYear[d.year].count += 1;
  }
  return Object.entries(byYear)
    .map(([year, agg]) => ({ year: parseInt(year), total: Math.round(agg.sum * 10) / 10, validDays: agg.count }))
    .sort((a, b) => a.year - b.year);
}

function aggregateAnnualMeanTemp(dailyTemp) {
  const byYear = {};
  for (const d of dailyTemp) {
    if (!byYear[d.year]) byYear[d.year] = { sum: 0, count: 0 };
    byYear[d.year].sum += d.value;
    byYear[d.year].count += 1;
  }
  return Object.entries(byYear)
    .map(([year, agg]) => ({ year: parseInt(year), mean: Math.round((agg.sum / agg.count) * 10) / 10, validDays: agg.count }))
    .sort((a, b) => a.year - b.year);
}

function selectCompleteYears(annualData, startYear, endYear, minCoverage = DEFAULT_MIN_COVERAGE) {
  // Keeps only years with enough valid days (validDays / days in that year >= minCoverage).
  // Every year from startYear to endYear is accounted for: a year with no data at all is
  // reported as excluded with 0% coverage, never silently skipped.
  // Returns { eligible: [item + expectedDays + coverage], excluded: [{year, validDays, expectedDays, coverage}], minCoverage }
  const byYear = {};
  for (const item of annualData) byYear[item.year] = item;
  const eligible = [], excluded = [];
  for (let year = startYear; year <= endYear; year++) {
    const expectedDays = daysInYear(year);
    const item = byYear[year];
    const validDays = item ? item.validDays : 0;
    const coverage = Math.round((validDays / expectedDays) * 1000) / 1000;
    if (item && coverage >= minCoverage) eligible.push({ ...item, expectedDays, coverage });
    else excluded.push({ year, validDays, expectedDays, coverage });
  }
  return { eligible, excluded, minCoverage };
}

function linearRegression(points) {
  // points: array of {year, value} (value = total or mean, whichever series)
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };

  const xs = points.map(p => p.year);
  const ys = points.map(p => p.value);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;

  // R-squared
  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * xs[i] + intercept;
    ssRes += (ys[i] - predicted) ** 2;
    ssTot += (ys[i] - meanY) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

  return { slope: Math.round(slope * 1000) / 1000, intercept: Math.round(intercept * 100) / 100, r2: Math.round(r2 * 1000) / 1000 };
}

function findExtremeYear(yearlyData, valueKey, mode) {
  // mode: 'max' or 'min'. Returns null for an empty list (never throws).
  if (!yearlyData || yearlyData.length === 0) return null;
  return yearlyData.reduce((best, current) => {
    if (mode === 'max') return current[valueKey] > best[valueKey] ? current : best;
    return current[valueKey] < best[valueKey] ? current : best;
  });
}

if (typeof module !== "undefined") module.exports = {
  DEFAULT_MIN_COVERAGE,
  daysInYear,
  selectCompleteYears,
  parseNasaPowerSeries,
  aggregateAnnualRainfall,
  aggregateAnnualMeanTemp,
  linearRegression,
  findExtremeYear
};
