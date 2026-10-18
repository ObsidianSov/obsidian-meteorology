// Comparing the same annual quantity from two data sources.
// Pure functions — no network, testable in isolation. Needs trend_stats.js loaded first.
// Method: line the series up by year, look at the year-by-year difference, and flag years where the
// difference is far outside the usual spread (Tukey fences at 3 x IQR). No fixed thresholds are invented:
// a year is flagged because it differs from how the two sources usually differ. The stricter 3 x IQR fence
// is used (not 1.5) because with 1.5 about 36% of comparisons between consistent sources would show a
// false disagreement (simulation, 35 years); with 3 about 1%.

const COMPARE_FENCE_K = 3;

function pearson(x, y) {
  const n = x.length;
  if (n < 3) return null;
  const mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
  if (sxx === 0 || syy === 0) return null;
  return sxy / Math.sqrt(sxx * syy);
}

function ranks(values) {
  // Average ranks for ties (as scipy.stats.rankdata)
  const idx = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const out = new Array(values.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) out[idx[k][1]] = avg;
    i = j + 1;
  }
  return out;
}

function spearman(x, y) {
  if (x.length < 3) return null;
  return pearson(ranks(x), ranks(y));
}

function buildComparison(seriesA, seriesB, minYears = MIN_YEARS_FOR_TREND) {
  // seriesA, seriesB: [{year, value}]. Only years present in both are compared.
  const mapB = new Map(seriesB.map(p => [p.year, p.value]));
  const rows = seriesA.filter(p => mapB.has(p.year))
    .map(p => ({ year: p.year, a: p.value, b: mapB.get(p.year), diff: p.value - mapB.get(p.year) }))
    .sort((p, q) => p.year - q.year);
  const n = rows.length;
  const base = { n, rows, minYears };
  if (n < 3) return { ...base, verdict: "too_few", pearson: null, spearman: null, meanDiff: null, flagged: [], pearsonWithoutFlagged: null, trendA: null, trendB: null };
  const a = rows.map(r => r.a), b = rows.map(r => r.b);
  const meanDiff = rows.reduce((s, r) => s + r.diff, 0) / n;
  const flaggedYears = flagUnusualYears(rows.map(r => ({ year: r.year, value: r.diff })), COMPARE_FENCE_K, minYears).flagged.map(f => f.year);
  const rest = rows.filter(r => !flaggedYears.includes(r.year));
  const verdict = n < minYears ? "too_few" : (flaggedYears.length > 0 ? "diverge" : "agree");
  return {
    ...base, verdict, meanDiff,
    pearson: pearson(a, b), spearman: spearman(a, b),
    flagged: flaggedYears, pearsonWithoutFlagged: flaggedYears.length ? pearson(rest.map(r => r.a), rest.map(r => r.b)) : null,
    trendA: analyzeTrend(rows.map(r => ({ year: r.year, value: r.a }))),
    trendB: analyzeTrend(rows.map(r => ({ year: r.year, value: r.b })))
  };
}

function describeComparison(cmp, opts = {}) {
  const { label = "the series", unit = "", digits = 1, nameA = "Source A", nameB = "Source B" } = opts;
  if (cmp.verdict === "too_few") return `Only ${cmp.n} year${cmp.n === 1 ? "" : "s"} in common: too few (at least ${cmp.minYears} are needed) to compare the two sources for ${label}.`;
  const r = cmp.pearson === null ? "n/a" : cmp.pearson.toFixed(2);
  const rs = cmp.spearman === null ? "n/a" : cmp.spearman.toFixed(2);
  const higher = cmp.meanDiff >= 0 ? nameA : nameB;
  const bias = `On average ${higher} is ${Math.abs(cmp.meanDiff).toFixed(digits)} ${unit} higher per year.`;
  const stats = `Over ${cmp.n} common years the correlation is r = ${r} (Spearman ${rs}).`;
  const verdictText = (t) => ({ increasing: "a significant increasing trend", decreasing: "a significant decreasing trend", none: "no significant trend", too_few: "too few years to test" })[t.verdict];
  const trends = `Trend for ${label}: ${nameA} shows ${verdictText(cmp.trendA)}; ${nameB} shows ${verdictText(cmp.trendB)}.`;
  if (cmp.verdict === "agree") return `No year stands out: the year-to-year difference between the two sources is never unusually large. ${stats} ${bias} ${trends}`;
  const list = cmp.flagged.map(y => { const row = cmp.rows.find(q => q.year === y); return `${y} (${nameA} ${row.a.toFixed(digits)}, ${nameB} ${row.b.toFixed(digits)} ${unit})`; }).join("; ");
  const without = cmp.pearsonWithoutFlagged === null ? "" : ` Without those years r = ${cmp.pearsonWithoutFlagged.toFixed(2)}.`;
  return `The two sources disagree in ${cmp.flagged.length} year${cmp.flagged.length === 1 ? "" : "s"}, where the difference between them is unusually large: ${list}. ${stats}${without} ${bias} ${trends} This does not say which source is right; treat results that depend on those years with caution.`;
}

function describeDispute(cmp, opts = {}) {
  // A note to show under a headline trend when the second source tells a different story.
  // Empty when the sources agree or when there is nothing to compare.
  const { label = "the series", nameA = "Source A", nameB = "Source B" } = opts;
  if (!cmp || cmp.verdict !== "diverge" || !cmp.trendA || !cmp.trendB) return "";
  if (cmp.trendA.verdict === cmp.trendB.verdict) return "";
  const words = { increasing: "a significant increasing trend", decreasing: "a significant decreasing trend", none: "no significant trend", too_few: "too few years to test" };
  return `Disputed: ${nameB} shows ${words[cmp.trendB.verdict]} for the same years, and the two sources disagree strongly in ${cmp.flagged.join(", ")}. Do not rely on the ${label} trend above yet.`;
}

if (typeof module !== "undefined") {
  const t = require("./trend_stats.js");
  globalThis.MIN_YEARS_FOR_TREND = t.MIN_YEARS_FOR_TREND;
  globalThis.flagUnusualYears = t.flagUnusualYears;
  globalThis.analyzeTrend = t.analyzeTrend;
  module.exports = { COMPARE_FENCE_K, pearson, spearman, ranks, buildComparison, describeComparison, describeDispute };
}
