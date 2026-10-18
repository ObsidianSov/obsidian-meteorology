const { erfc, normalCDF, mannKendall, senSlope, analyzeTrend, formatPValue, describeTrend, TREND_ALPHA, MIN_YEARS_FOR_TREND } = require('./trend_stats.js');

let passed = 0, total = 0;
function check(name, condition) {
  total++;
  if (condition) { passed++; console.log(`PASS: ${name}`); }
  else console.log(`FAIL: ${name}`);
}
const close = (a, b, tol) => Math.abs(a - b) <= tol;

// Reference values were produced independently with Python:
//   pymannkendall.original_test (S, variance, Z, p, tau) and scipy.stats.theilslopes (slope, 95% interval)
// Series use years 1990, 1991, ... in order.
const FIXTURES = [{"name": "noise n=34", "years": [1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023], "values": [428.6, 521.7, 329.3, 625.6, 557.4, 473.7, 471.9, 527.3, 475.9, 479.7, 564.8, 546.3, 494.2, 492.3, 514.5, 444.7, 463.7, 549.3, 488.3, 376.3, 457.0, 559.1, 479.1, 486.6, 557.8, 664.2, 435.8, 621.3, 389.3, 515.7, 394.7, 621.6, 575.1, 602.4], "s": 71.0, "varS": 4550.333333333333, "z": 1.037711032628559, "p": 0.29940460703930927, "tau": 0.1265597147950089, "slope": 1.6347826086956532, "low": -1.6999999999999948, "high": 4.596428571428571, "trend": "no trend"}, {"name": "increasing trend n=34", "years": [1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023], "values": [396.9, 497.1, 430.9, 440.6, 504.4, 532.6, 498.3, 454.3, 448.5, 590.7, 545.6, 559.2, 653.0, 479.0, 687.6, 729.1, 643.1, 601.6, 518.2, 623.7, 543.4, 574.7, 564.6, 605.0, 671.3, 566.7, 546.9, 551.8, 559.9, 538.1, 575.2, 713.6, 606.4, 663.4], "s": 239.0, "varS": 4550.333333333333, "z": 3.528217510937101, "p": 0.000418368226904553, "tau": 0.42602495543672014, "slope": 4.904545454545453, "low": 2.4299999999999984, "high": 7.075000000000017, "trend": "increasing"}, {"name": "decreasing trend n=20", "years": [1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009], "values": [651.3, 700.8, 618.4, 654.0, 766.2, 646.7, 708.8, 676.2, 645.9, 619.9, 691.5, 626.9, 689.1, 593.2, 618.3, 628.6, 618.9, 548.6, 565.4, 578.2], "s": -94.0, "varS": 950.0, "z": -3.017318433032183, "p": 0.0025502176384633035, "tau": -0.49473684210526314, "slope": -5.795000000000003, "low": -9.637500000000003, "high": -2.290909090909085, "trend": "decreasing"}, {"name": "integer onset days with ties n=30", "years": [1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019], "values": [137.0, 158.0, 137.0, 154.0, 162.0, 167.0, 169.0, 143.0, 161.0, 155.0, 160.0, 163.0, 151.0, 139.0, 162.0, 156.0, 139.0, 149.0, 140.0, 161.0, 146.0, 137.0, 144.0, 156.0, 155.0, 164.0, 147.0, 156.0, 168.0, 146.0], "s": -4.0, "varS": 3129.3333333333335, "z": -0.05362846194068558, "p": 0.9572311797860447, "tau": -0.009195402298850575, "slope": 0.0, "low": -0.5555555555555556, "high": 0.42857142857142855, "trend": "no trend"}, {"name": "n=10 borderline", "years": [1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999], "values": [482.2, 577.8, 525.9, 522.2, 557.9, 564.4, 605.4, 515.9, 449.6, 577.7], "s": 3.0, "varS": 125.0, "z": 0.17888543819998318, "p": 0.8580276569875211, "tau": 0.06666666666666667, "slope": 3.9600000000000137, "low": -12.71666666666666, "high": 18.924999999999997, "trend": "no trend"}, {"name": "constant n=12", "years": [1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001], "values": [500.0, 500.0, 500.0, 500.0, 500.0, 500.0, 500.0, 500.0, 500.0, 500.0, 500.0, 500.0], "s": 0.0, "varS": 0.0, "z": 0.0, "p": 1.0, "tau": 0.0, "slope": 0.0, "low": 0.0, "high": 0.0, "trend": "no trend"}, {"name": "n=7 (too few years)", "years": [1990, 1991, 1992, 1993, 1994, 1995, 1996], "values": [469.4, 528.6, 643.2, 534.9, 658.2, 697.3, 703.0], "s": 19.0, "varS": 44.333333333333336, "z": 2.7033813413374976, "p": 0.00686379498544909, "tau": 0.9047619047619048, "slope": 39.09999999999991, "low": 7.5, "high": 81.19999999999999, "trend": "increasing"}];

check("constants: alpha 0.05, minimum 10 years", TREND_ALPHA === 0.05 && MIN_YEARS_FOR_TREND === 10);

// Normal distribution helpers against known values
check("normalCDF(0) = 0.5", close(normalCDF(0), 0.5, 1e-12));
check("normalCDF(1.959963985) = 0.975", close(normalCDF(1.959963984540054), 0.975, 1e-9));
check("normalCDF is symmetric: CDF(-1.3) + CDF(1.3) = 1", close(normalCDF(-1.3) + normalCDF(1.3), 1, 1e-12));
check("erfc(0) = 1 and erfc(-x) = 2 - erfc(x)", close(erfc(0), 1, 1e-12) && close(erfc(-0.7), 2 - erfc(0.7), 1e-12));
check("erfc(1) matches the known value 0.15729920705", close(erfc(1), 0.15729920705028513, 1e-10));
check("erfc(4) (continued-fraction branch) matches 1.541725790e-8", close(erfc(4) / 1.541725790028002e-8, 1, 1e-8));

for (const f of FIXTURES) {
  const mk = mannKendall(f.values);
  check(`${f.name}: Mann-Kendall S matches pymannkendall`, mk.s === f.s);
  check(`${f.name}: variance of S (with tie correction) matches`, close(mk.varS, f.varS, 1e-9));
  check(`${f.name}: Z score matches`, close(mk.z, f.z, 1e-9));
  check(`${f.name}: two-sided p-value matches`, close(mk.p, f.p, 1e-8));
  check(`${f.name}: Kendall tau matches`, close(mk.tau, f.tau, 1e-12));
  const sen = senSlope(f.years, f.values);
  check(`${f.name}: Sen's slope matches scipy`, close(sen.slope, f.slope, 1e-9));
  check(`${f.name}: 95% interval matches scipy (${f.low.toFixed(3)} to ${f.high.toFixed(3)})`, close(sen.low, f.low, 1e-9) && close(sen.high, f.high, 1e-9));
  const pts = f.years.map((y, i) => ({ year: y, value: f.values[i] }));
  const a = analyzeTrend(pts);
  const expected = f.values.length < 10 ? 'too_few' : (f.trend === 'no trend' ? 'none' : f.trend);
  check(`${f.name}: verdict is '${expected}'`, a.verdict === expected);
}

// Honest-verdict rules
const decr = FIXTURES.find(f => f.name.startsWith("decreasing"));
const few = FIXTURES.find(f => f.name.startsWith("n=7"));
check("a significant-looking series with only 7 years is NOT called a trend (too_few)", analyzeTrend(few.years.map((y, i) => ({ year: y, value: few.values[i] }))).verdict === 'too_few');
check("random-looking data with a slope still gets verdict 'none' (noise n=34 has a positive slope but p=0.30)",
  analyzeTrend(FIXTURES[0].years.map((y, i) => ({ year: y, value: FIXTURES[0].values[i] }))).verdict === 'none' && FIXTURES[0].slope > 0);
check("input order does not matter", analyzeTrend(decr.years.map((y, i) => ({ year: y, value: decr.values[i] })).reverse()).p === analyzeTrend(decr.years.map((y, i) => ({ year: y, value: decr.values[i] }))).p);
check("a perfect line gives the exact slope", analyzeTrend(Array.from({ length: 12 }, (_, i) => ({ year: 2000 + i, value: 10 + 3 * i }))).slope === 3);
check("a perfect upward line is significantly increasing", analyzeTrend(Array.from({ length: 12 }, (_, i) => ({ year: 2000 + i, value: 10 + 3 * i }))).verdict === 'increasing');
check("a constant series has p = 1 and verdict 'none'", (() => { const a = analyzeTrend(Array.from({ length: 12 }, (_, i) => ({ year: 2000 + i, value: 5 }))); return a.p === 1 && a.verdict === 'none'; })());
check("fewer than 3 points: no numbers, verdict 'too_few'", (() => { const a = analyzeTrend([{ year: 2000, value: 1 }, { year: 2001, value: 2 }]); return a.verdict === 'too_few' && a.slope === null && a.p === null; })());
check("empty input does not crash", analyzeTrend([]).verdict === 'too_few');
check("years with gaps use real year differences for the slope (2000,2002,2004 -> slope 5 per year)",
  close(senSlope([2000, 2002, 2004], [0, 10, 20]).slope, 5, 1e-12));
check("analyzeTrend reports the year range and n", (() => { const a = analyzeTrend(decr.years.map((y, i) => ({ year: y, value: decr.values[i] }))); return a.n === 20 && a.firstYear === 1990 && a.lastYear === 2009; })());


// ---------- Wording must never overclaim ----------
const asPts = f => f.years.map((y, i) => ({ year: y, value: f.values[i] }));
const noiseText = describeTrend(analyzeTrend(asPts(FIXTURES[0])), { label: "annual rainfall", unit: "mm", digits: 1 });
check("no-trend wording says 'No statistically detectable trend' and gives the p-value", /^No statistically detectable trend in annual rainfall over 1990–2023/.test(noiseText) && noiseText.includes("p = 0.299"));
check("no-trend wording does not use 'increasing', 'decreasing' or 'significant' as a claim even though the slope is positive",
  FIXTURES[0].slope > 0 && !/increasing|decreasing|shows a/.test(noiseText) && !/statistically significant/.test(noiseText));
check("no-trend wording says the estimate cannot be told apart from natural variation", /cannot be told apart from natural year-to-year variation/.test(noiseText));
const upText = describeTrend(analyzeTrend(asPts(FIXTURES[1])), { label: "annual rainfall", unit: "mm", digits: 1 });
check("significant wording names the direction, p-value and the 95% range", /Annual rainfall shows a statistically significant increasing trend/.test(upText) && upText.includes("p < 0.001") && /95% range/.test(upText));
check("significant wording warns it does not explain the cause", /does not by itself explain the cause/.test(upText));
const downText = describeTrend(analyzeTrend(asPts(FIXTURES[2])), { label: "annual mean temperature", unit: "°C", digits: 3, upPhrase: "warming trend", downPhrase: "cooling trend" });
check("custom wording is used for the direction (cooling trend)", /significant cooling trend/.test(downText));
const fewText = describeTrend(analyzeTrend(asPts(FIXTURES[6])), { label: "annual rainfall", unit: "mm" });
check("too-few-years wording says so and claims nothing", /Only 7 usable years: too few \(at least 10 are needed\)/.test(fewText) && !/significant|increasing|decreasing/.test(fewText));
check("signed slopes: positive gets a plus sign", describeTrend(analyzeTrend(asPts(FIXTURES[1])), { label: "x", unit: "u", digits: 1 }).includes("+"));
check("formatPValue: 0.0004 -> 'p < 0.001', 0.0423 -> 'p = 0.042'", formatPValue(0.0004) === "p < 0.001" && formatPValue(0.0423) === "p = 0.042");
check("singular year wording ('Only 1 usable year')", /Only 1 usable year:/.test(describeTrend({ verdict: 'too_few', n: 1, minYears: 10 }, { label: "x" })));

console.log(`\nRESULTS: ${passed}/${total} tests passed`);
process.exit(passed === total ? 0 : 1);
