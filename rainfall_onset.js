// Rainfall onset detection and year-over-year variability analysis
// Pure functions — no network, testable in isolation
//
// Onset criterion (AGRHYMET/WMO-style, standard in Sahel agromet research):
//   First day where cumulative rainfall over 3 consecutive days >= 20mm,
//   AND no dry spell longer than 10 days occurs in the following 30 days
//   (filters out "false starts" — early rain that doesn't sustain the season).

function dateStringToDayOfYear(dateStr) {
  // dateStr format: "YYYYMMDD" (as returned by NASA POWER)
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6));
  const day = parseInt(dateStr.substring(6, 8));
  const date = Date.UTC(year, month - 1, day);
  const startOfYear = Date.UTC(year, 0, 1);
  return Math.round((date - startOfYear) / 86400000) + 1; // 1-indexed
}

function dayOfYearToDateString(year, dayOfYear) {
  const date = new Date(Date.UTC(year, 0, 1));
  date.setUTCDate(date.getUTCDate() + dayOfYear - 1);
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${mm}-${dd}`;
}

function groupDailyByYear(dailySeries) {
  // dailySeries: output of parseNasaPowerSeries — [{date, year, value}]
  const byYear = {};
  for (const d of dailySeries) {
    if (!byYear[d.year]) byYear[d.year] = [];
    byYear[d.year].push({ dayOfYear: dateStringToDayOfYear(d.date), value: d.value });
  }
  for (const year in byYear) {
    byYear[year].sort((a, b) => a.dayOfYear - b.dayOfYear);
  }
  return byYear;
}

function detectOnsetForYear(yearDays, options = {}) {
  const {
    startDayOfYear = 60,      // ~March 1 — earliest plausible search start
    thresholdMM = 20,         // cumulative rain needed in window to trigger a candidate
    windowDays = 3,
    dryspellCheckDays = 30,   // how far ahead to check for a false start
    maxDrySpellDays = 10,     // longer than this in the check window = false start
    dryDayThreshold = 1.0     // mm below which a day counts as "dry"
  } = options;

  const valueByDay = {};
  for (const d of yearDays) valueByDay[d.dayOfYear] = d.value;
  const maxDay = yearDays.length ? yearDays[yearDays.length - 1].dayOfYear : 0;

  for (let start = startDayOfYear; start <= maxDay - windowDays + 1; start++) {
    let windowSum = 0;
    for (let k = 0; k < windowDays; k++) windowSum += valueByDay[start + k] || 0;
    if (windowSum < thresholdMM) continue;

    const checkStart = start + windowDays;
    const checkEnd = Math.min(checkStart + dryspellCheckDays - 1, maxDay);
    let longestDry = 0, currentDry = 0;
    for (let day = checkStart; day <= checkEnd; day++) {
      const v = valueByDay[day] || 0;
      if (v < dryDayThreshold) {
        currentDry++;
        longestDry = Math.max(longestDry, currentDry);
      } else {
        currentDry = 0;
      }
    }
    if (longestDry <= maxDrySpellDays) {
      return start; // valid onset day-of-year
    }
  }
  return null; // no valid onset found in this year's data
}

function computeOnsetDatesAllYears(dailySeries, options = {}) {
  const byYear = groupDailyByYear(dailySeries);
  return Object.keys(byYear)
    .map(yearStr => {
      const year = parseInt(yearStr);
      const onsetDay = detectOnsetForYear(byYear[year], options);
      return {
        year,
        onsetDayOfYear: onsetDay,
        onsetDate: onsetDay ? dayOfYearToDateString(year, onsetDay) : null
      };
    })
    .sort((a, b) => a.year - b.year);
}

function coefficientOfVariation(values) {
  const n = values.length;
  if (n === 0) return { mean: 0, stdDev: 0, cv: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);
  const cv = mean === 0 ? 0 : (stdDev / mean) * 100;
  return {
    mean: Math.round(mean * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    cv: Math.round(cv * 100) / 100
  };
}

function onsetVariability(onsetResults) {
  const validOnsets = onsetResults.filter(r => r.onsetDayOfYear !== null).map(r => r.onsetDayOfYear);
  const stats = coefficientOfVariation(validOnsets);
  const missingYears = onsetResults.filter(r => r.onsetDayOfYear === null).map(r => r.year);
  return {
    ...stats,
    yearsWithValidOnset: validOnsets.length,
    yearsTotal: onsetResults.length,
    missingYears
  };
}

module.exports = {
  dateStringToDayOfYear,
  dayOfYearToDateString,
  groupDailyByYear,
  detectOnsetForYear,
  computeOnsetDatesAllYears,
  coefficientOfVariation,
  onsetVariability
};
