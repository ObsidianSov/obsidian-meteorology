// Trend statistics for annual series: Mann-Kendall test and Sen's slope.
// Pure functions — no network, testable in isolation. See docs/trend-method.md.
//
// Why these and not just a regression line: annual rainfall is skewed and has outliers;
// Mann-Kendall (rank based) and Sen's slope (median of pairwise slopes) are the standard
// robust choices in climatology, and Mann-Kendall gives an honest p-value.

const TREND_ALPHA = 0.05;          // 5% significance level (convention)
const MIN_YEARS_FOR_TREND = 10;    // below this the normal approximation is not reliable
const Z_95 = 1.959963984540054;    // standard normal quantile for a 95% interval

function erfc(x) {
  // Complementary error function, accurate to about 1e-12 (series for small |x|, continued fraction for large).
  if (x < 0) return 2 - erfc(-x);
  if (x < 3) {
    let term = x, sum = x;
    for (let n = 1; n < 200; n++) {
      term *= -x * x / n;
      const add = term / (2 * n + 1);
      sum += add;
      if (Math.abs(add) < 1e-17) break;
    }
    return 1 - (2 / Math.sqrt(Math.PI)) * sum;
  }
  let t = x;
  for (let k = 80; k >= 1; k--) t = x + (k / 2) / t;
  return Math.exp(-x * x) / (Math.sqrt(Math.PI) * t);
}

function normalCDF(z) {
  return 0.5 * erfc(-z / Math.SQRT2);
}

function tieTerm(values) {
  // Sum over groups of tied values: t(t-1)(2t+5)
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  let sum = 0;
  for (const t of counts.values()) if (t > 1) sum += t * (t - 1) * (2 * t + 5);
  return sum;
}

function mannKendall(values) {
  // values: numbers in time order. Returns the Mann-Kendall statistic S, its tie-corrected variance,
  // the normal score Z (with continuity correction) and the two-sided p-value.
  const n = values.length;
  let s = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) s += Math.sign(values[j] - values[i]);
  }
  const varS = (n * (n - 1) * (2 * n + 5) - tieTerm(values)) / 18;
  let z = 0;
  if (varS > 0) {
    if (s > 0) z = (s - 1) / Math.sqrt(varS);
    else if (s < 0) z = (s + 1) / Math.sqrt(varS);
  }
  const p = 2 * (1 - normalCDF(Math.abs(z)));
  const tau = n > 1 ? s / (0.5 * n * (n - 1)) : 0;
  return { n, s, varS, z, p, tau };
}

function roundHalfEven(x) {
  const f = Math.floor(x), diff = x - f;
  if (diff < 0.5) return f;
  if (diff > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1;
}

function median(sorted) {
  const m = sorted.length;
  if (m === 0) return NaN;
  return m % 2 ? sorted[(m - 1) / 2] : (sorted[m / 2 - 1] + sorted[m / 2]) / 2;
}

function senSlope(xs, ys) {
  // Sen's slope: the median of all pairwise slopes, with a 95% confidence interval
  // from Sen (1968), using the same rank rule as scipy.stats.theilslopes.
  const slopes = [];
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = i + 1; j < xs.length; j++) {
      if (xs[j] !== xs[i]) slopes.push((ys[j] - ys[i]) / (xs[j] - xs[i]));
    }
  }
  slopes.sort((a, b) => a - b);
  const nt = slopes.length;
  const slope = median(slopes);
  const sigma = Math.sqrt(((ys.length * (ys.length - 1) * (2 * ys.length + 5)) - tieTerm(ys)) / 18);
  const ru = Math.min(roundHalfEven((nt + Z_95 * sigma) / 2), nt - 1);
  const rl = Math.max(roundHalfEven((nt - Z_95 * sigma) / 2) - 1, 0);
  return { slope, low: slopes[rl], high: slopes[ru], pairs: nt };
}

function analyzeTrend(points, alpha = TREND_ALPHA, minYears = MIN_YEARS_FOR_TREND) {
  // points: [{year, value}] in any order. Never claims a trend without enough years or a significant test.
  const sorted = [...points].sort((a, b) => a.year - b.year);
  const n = sorted.length;
  const base = { n, firstYear: n ? sorted[0].year : null, lastYear: n ? sorted[n - 1].year : null, alpha, minYears };
  if (n < 3) return { ...base, verdict: 'too_few', s: null, z: null, p: null, tau: null, slope: null, slopeLow: null, slopeHigh: null };
  const mk = mannKendall(sorted.map(d => d.value));
  const sen = senSlope(sorted.map(d => d.year), sorted.map(d => d.value));
  let verdict;
  if (n < minYears) verdict = 'too_few';
  else if (mk.p < alpha) verdict = mk.s > 0 ? 'increasing' : 'decreasing';
  else verdict = 'none';
  return { ...base, verdict, s: mk.s, z: mk.z, p: mk.p, tau: mk.tau, slope: sen.slope, slopeLow: sen.low, slopeHigh: sen.high };
}

function formatPValue(p) {
  return p < 0.001 ? "p < 0.001" : "p = " + p.toFixed(3);
}

function signedNumber(v, digits) {
  const text = v.toFixed(digits);
  return (v > 0 ? "+" : "") + text;
}

function describeTrend(t, opts = {}) {
  // Plain-English sentence for a result of analyzeTrend. The wording only ever claims a trend
  // when the test says it is statistically significant and there are enough years.
  const { label = "the series", unit = "", digits = 2,
          upPhrase = "increasing trend", downPhrase = "decreasing trend" } = opts;
  const span = `${t.firstYear}–${t.lastYear}`;
  const capLabel = label.charAt(0).toUpperCase() + label.slice(1);
  if (t.verdict === 'too_few') {
    return `Only ${t.n} usable year${t.n === 1 ? "" : "s"}: too few (at least ${t.minYears} are needed) to test for a trend in ${label}.`;
  }
  const estimate = `${signedNumber(t.slope, digits)} ${unit} per year (95% range ${signedNumber(t.slopeLow, digits)} to ${signedNumber(t.slopeHigh, digits)})`;
  if (t.verdict === 'none') {
    return `No statistically detectable trend in ${label} over ${span} (Mann-Kendall test, ${formatPValue(t.p)}). The best estimate is ${estimate}, which cannot be told apart from natural year-to-year variation.`;
  }
  const phrase = t.verdict === 'increasing' ? upPhrase : downPhrase;
  return `${capLabel} shows a statistically significant ${phrase} over ${span} (Mann-Kendall test, ${formatPValue(t.p)}): about ${estimate}. This describes this dataset at this location; it does not by itself explain the cause.`;
}

if (typeof module !== "undefined") module.exports = {
  TREND_ALPHA,
  MIN_YEARS_FOR_TREND,
  erfc,
  normalCDF,
  mannKendall,
  senSlope,
  analyzeTrend,
  formatPValue,
  signedNumber,
  describeTrend
};
