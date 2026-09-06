// Pure functions for the historical climate layer — no network, testable in isolation

function parseNasaPowerSeries(paramObject) {
  // paramObject looks like: {"20200101": 25.3, "20200102": 26.1, ...}
  return Object.entries(paramObject).map(([dateStr, value]) => ({
    date: dateStr,
    year: parseInt(dateStr.substring(0, 4)),
    value: value
  })).filter(d => d.value !== -999); // NASA POWER uses -999 for missing data
}

function aggregateAnnualRainfall(dailyPrecip) {
  // dailyPrecip: array of {year, value} — sums to annual totals
  const byYear = {};
  for (const d of dailyPrecip) {
    byYear[d.year] = (byYear[d.year] || 0) + d.value;
  }
  return Object.entries(byYear)
    .map(([year, total]) => ({ year: parseInt(year), total: Math.round(total * 10) / 10 }))
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
    .map(([year, agg]) => ({ year: parseInt(year), mean: Math.round((agg.sum / agg.count) * 10) / 10 }))
    .sort((a, b) => a.year - b.year);
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
  // mode: 'max' or 'min'
  return yearlyData.reduce((best, current) => {
    if (mode === 'max') return current[valueKey] > best[valueKey] ? current : best;
    return current[valueKey] < best[valueKey] ? current : best;
  });
}

module.exports = {
  parseNasaPowerSeries,
  aggregateAnnualRainfall,
  aggregateAnnualMeanTemp,
  linearRegression,
  findExtremeYear
};
