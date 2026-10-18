// Rainfall onset detection and year-over-year variability analysis
// Pure functions — no network, testable in isolation
//
// Method: Sivakumar (1988), Agricultural and Forest Meteorology 42(4):295-305, as described in
// later West African studies. Onset = the first date, from 1 May, on which
//   - at least 20 mm of rain falls over 3 consecutive days, AND
//   - no dry sequence longer than 7 days occurs in the following 30 days
//     (this filters out "false starts": early rain that does not sustain the season).
// Implementation choices NOT fixed by the criterion (see docs/onset-method.md):
//   - a dry day is a day under 1.0 mm
//   - the onset date is the first wet day (>= 1.0 mm) of the triggering 3-day window
//   - the 30-day check starts the day after the 3-day window
//   - missing days are never treated as dry or wet (see detectOnsetDetailed)

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

function formatDayOfYear(dayOfYear) {
  // "1 May" style label for a day-of-year. Uses a non-leap reference year, so in leap years the
  // label for days after 28 February is one day later than the real date (documented limit).
  const iso = dayOfYearToDateString(2021, Math.round(dayOfYear));
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${parseInt(iso.slice(8, 10), 10)} ${months[parseInt(iso.slice(5, 7), 10) - 1]}`;
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

function detectOnsetDetailed(yearDays, options = {}) {
  // Returns { day, status } where status is:
  //   'detected'          a valid onset was found and confirmed
  //   'none'              the data are complete enough and no valid onset exists in this year
  //   'insufficient_data' missing days stop us from confirming the answer
  // Missing days (days absent from yearDays) are NEVER treated as dry or as zero rain.
  const {
    startDayOfYear = 121,     // 1 May in a non-leap year (computeOnsetDatesAllYears sets the exact day per year)
    thresholdMM = 20,         // cumulative rain needed in window to trigger a candidate
    windowDays = 3,
    dryspellCheckDays = 30,   // how far ahead to check for a false start
    maxDrySpellDays = 7,      // a dry sequence LONGER than this in the check window = false start
    dryDayThreshold = 1.0     // mm below which a day counts as "dry"
  } = options;

  const valueByDay = {};
  for (const d of yearDays) valueByDay[d.dayOfYear] = d.value;
  const maxDay = yearDays.length ? yearDays[yearDays.length - 1].dayOfYear : 0;

  let unknownWindowBefore = false; // a window with missing days that might have been the true onset

  for (let start = startDayOfYear; start <= maxDay - windowDays + 1; start++) {
    let windowSum = 0, missingInWindow = 0;
    for (let k = 0; k < windowDays; k++) {
      const v = valueByDay[start + k];
      if (v === undefined) missingInWindow++; else windowSum += v;
    }
    if (windowSum < thresholdMM) {
      // With missing days we cannot rule this window out as the true onset
      if (missingInWindow > 0) unknownWindowBefore = true;
      continue;
    }
    // windowSum is a lower bound, so reaching the threshold is certain even with missing days.

    const checkStart = start + windowDays;
    const checkEnd = checkStart + dryspellCheckDays - 1; // days past the data count as missing
    let confirmedRun = 0, confirmedLongest = 0, possibleRun = 0, possibleLongest = 0;
    for (let day = checkStart; day <= checkEnd; day++) {
      const v = valueByDay[day];
      const missing = v === undefined;
      const dry = !missing && v < dryDayThreshold;
      if (dry) { confirmedRun++; confirmedLongest = Math.max(confirmedLongest, confirmedRun); } else confirmedRun = 0;
      if (dry || missing) { possibleRun++; possibleLongest = Math.max(possibleLongest, possibleRun); } else possibleRun = 0;
    }
    if (confirmedLongest > maxDrySpellDays) continue;           // confirmed false start
    if (possibleLongest > maxDrySpellDays) return { day: null, status: 'insufficient_data' }; // cannot confirm
    if (unknownWindowBefore) return { day: null, status: 'insufficient_data' };               // cannot confirm it is the first
    // Onset date: the first wet day of the triggering window (a window can begin on a dry day)
    let onsetDay = start;
    for (let k = 0; k < windowDays; k++) {
      const v = valueByDay[start + k];
      if (v !== undefined && v >= dryDayThreshold) { onsetDay = start + k; break; }
    }
    return { day: onsetDay, status: 'detected' };
  }
  return { day: null, status: unknownWindowBefore ? 'insufficient_data' : 'none' };
}

function detectOnsetForYear(yearDays, options = {}) {
  // Convenience wrapper: the onset day-of-year, or null if there is none / it cannot be confirmed.
  return detectOnsetDetailed(yearDays, options).day;
}

function computeOnsetDatesAllYears(dailySeries, options = {}, years = null) {
  // years (optional): every year in this list gets a result, even if it has no data at all.
  const byYear = groupDailyByYear(dailySeries);
  const yearList = years ? years : Object.keys(byYear).map(y => parseInt(y));
  return yearList
    .map(year => {
      const days = byYear[year] || [];
      const yearOptions = { ...options };
      if (yearOptions.startDayOfYear === undefined) yearOptions.startDayOfYear = dateStringToDayOfYear(`${year}0501`); // 1 May, leap-safe
      const detail = days.length ? detectOnsetDetailed(days, yearOptions) : { day: null, status: 'insufficient_data' };
      return {
        year,
        onsetDayOfYear: detail.day,
        onsetDate: detail.day ? dayOfYearToDateString(year, detail.day) : null,
        status: detail.status
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
  const insufficientYears = onsetResults.filter(r => r.status === 'insufficient_data').map(r => r.year);
  const noOnsetYears = onsetResults.filter(r => r.onsetDayOfYear === null && r.status !== 'insufficient_data').map(r => r.year);
  return {
    ...stats,
    yearsWithValidOnset: validOnsets.length,
    yearsTotal: onsetResults.length,
    missingYears,        // all years without an onset, for any reason
    insufficientYears,   // subset: missing data prevented a decision
    noOnsetYears         // subset: data adequate, no valid onset found
  };
}

if (typeof module !== "undefined") module.exports = {
  dateStringToDayOfYear,
  dayOfYearToDateString,
  formatDayOfYear,
  groupDailyByYear,
  detectOnsetDetailed,
  detectOnsetForYear,
  computeOnsetDatesAllYears,
  coefficientOfVariation,
  onsetVariability
};
