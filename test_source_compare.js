const { pearson, spearman, ranks, buildComparison, describeComparison, describeDispute, COMPARE_FENCE_K } = require('./source_compare.js');

let passed = 0, total = 0;
function check(name, condition) {
  total++;
  if (condition) { passed++; console.log(`PASS: ${name}`); }
  else console.log(`FAIL: ${name}`);
}
const close = (a, b, tol) => Math.abs(a - b) <= tol;

// Reference values were produced independently with scipy (pearsonr, spearmanr) and numpy (percentile)
const FX = {"pairs": [{"name": "correlated n=35", "x": [606.5, 679.0, 716.8, 543.1, 734.4, 678.1, 736.1, 680.0, 777.8, 546.8, 845.4, 782.3, 584.0, 722.6, 698.9, 458.0, 715.5, 585.6, 622.5, 583.7, 602.9, 657.9, 660.6, 478.5, 620.4, 502.1, 510.2, 611.8, 744.1, 719.4, 583.5, 571.9, 559.0, 665.7, 753.0], "y": [564.8, 659.2, 679.2, 565.3, 602.7, 545.4, 676.6, 657.9, 706.9, 525.6, 739.3, 677.2, 514.5, 705.7, 677.8, 397.4, 672.7, 518.7, 579.7, 498.3, 558.8, 582.4, 612.6, 418.9, 544.1, 471.5, 461.0, 569.8, 675.2, 693.6, 510.0, 562.6, 573.1, 608.3, 770.1], "pearson": 0.9210168748722994, "spearman": 0.9033613445378151}, {"name": "integers with ties n=30", "x": [135.0, 131.0, 142.0, 140.0, 137.0, 162.0, 122.0, 143.0, 141.0, 133.0, 145.0, 131.0, 122.0, 156.0, 149.0, 153.0, 158.0, 135.0, 166.0, 135.0, 151.0, 146.0, 150.0, 163.0, 128.0, 152.0, 143.0, 122.0, 160.0, 151.0], "y": [138.0, 139.0, 144.0, 139.0, 142.0, 168.0, 119.0, 150.0, 143.0, 128.0, 138.0, 129.0, 129.0, 151.0, 149.0, 153.0, 163.0, 138.0, 166.0, 140.0, 156.0, 139.0, 142.0, 170.0, 130.0, 145.0, 138.0, 129.0, 165.0, 151.0], "pearson": 0.9243173358985068, "spearman": 0.9083607664171334}, {"name": "unrelated n=20", "x": [27.5, 26.8, 27.0, 26.9, 26.1, 25.8, 27.8, 27.9, 27.7, 27.2, 27.2, 26.7, 27.1, 26.7, 26.6, 27.2, 28.4, 25.5, 27.5, 27.5], "y": [26.0, 27.3, 27.1, 26.6, 26.6, 25.9, 28.4, 28.9, 28.3, 26.8, 27.2, 27.3, 26.3, 26.8, 27.4, 26.7, 25.6, 26.0, 27.2, 26.7], "pearson": 0.3565749299690131, "spearman": 0.2601135888610356}, {"name": "n=5 short", "x": [1.0, 2.0, 3.0, 4.0, 5.5], "y": [2.0, 1.0, 4.0, 3.0, 6.0], "pearson": 0.8483871429665282, "spearman": 0.7999999999999999}], "jump": {"years": [1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024], "nasa": [533.9, 732.6, 599.6, 541.6, 605.2, 879.1, 494.0, 810.4, 733.5, 618.2, 555.3, 697.6, 688.6, 525.0, 769.8, 605.1, 675.0, 568.2, 572.1, 650.7, 645.2, 660.4, 729.7, 700.6, 811.4, 768.9, 694.8, 559.5, 685.9, 444.8, 1428.8, 1704.8, 1162.2, 2029.8, 1345.2], "era": [617.2, 799.2, 659.3, 571.1, 642.9, 887.4, 526.1, 846.6, 808.6, 632.4, 613.1, 806.1, 676.8, 591.6, 850.5, 669.2, 686.5, 654.2, 616.9, 663.7, 609.3, 705.8, 766.1, 769.4, 781.1, 814.5, 733.7, 583.5, 755.8, 468.6, 571.5, 681.9, 464.9, 811.9, 538.1], "flagged": [2020, 2021, 2022, 2023, 2024], "pearson": 0.13493189218090915, "pearsonWithout": 0.9464661529112037, "meanDiff": 95.77142857142857}, "agree": {"years": [1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024], "nasa": [488.7, 750.3, 758.8, 555.5, 673.3, 565.0, 717.1, 655.1, 515.2, 709.2, 609.1, 606.0, 729.2, 741.2, 703.7, 385.4, 715.0, 608.3, 701.8, 629.2, 762.0, 676.7, 643.5, 688.6, 438.4, 698.1, 642.9, 481.2, 709.4, 674.3, 659.5, 638.0, 716.5, 685.0, 657.8], "era": [516.3, 804.1, 817.5, 565.4, 726.0, 639.3, 747.1, 654.6, 551.0, 719.1, 626.0, 669.7, 757.4, 783.7, 719.2, 493.7, 726.4, 616.9, 767.9, 628.5, 806.9, 706.5, 650.0, 682.3, 456.0, 713.1, 662.6, 529.4, 694.8, 685.1, 689.3, 637.3, 736.7, 738.2, 660.3], "flagged": [], "pearson": 0.9579184465941994}};

for (const p of FX.pairs) {
  check(`${p.name}: Pearson r matches scipy`, close(pearson(p.x, p.y), p.pearson, 1e-10));
  check(`${p.name}: Spearman rho matches scipy`, close(spearman(p.x, p.y), p.spearman, 1e-10));
}
check("ranks use the average rank for ties", JSON.stringify(ranks([10, 20, 20, 30])) === JSON.stringify([1, 2.5, 2.5, 4]));
check("correlation with fewer than 3 points is not reported", pearson([1, 2], [1, 2]) === null && spearman([1, 2], [1, 2]) === null);
check("correlation of a constant series is not reported", pearson([5, 5, 5, 5], [1, 2, 3, 4]) === null);
check("the comparison fence is 3 x IQR", COMPARE_FENCE_K === 3);

const toSeries = (years, values) => years.map((y, i) => ({ year: y, value: values[i] }));

// ---- the case that motivated this: one source jumps from 2020, the other does not ----
const jump = buildComparison(toSeries(FX.jump.years, FX.jump.nasa), toSeries(FX.jump.years, FX.jump.era));
check("jump: verdict is 'diverge'", jump.verdict === "diverge");
check("jump: the flagged years are 2020 to 2024 (matches numpy fences)", JSON.stringify(jump.flagged) === JSON.stringify(FX.jump.flagged));
check("jump: overall Pearson r matches scipy", close(jump.pearson, FX.jump.pearson, 1e-10));
check("jump: r without the flagged years matches scipy and is high", close(jump.pearsonWithoutFlagged, FX.jump.pearsonWithout, 1e-10) && jump.pearsonWithoutFlagged > 0.9);
check("jump: mean difference matches numpy", close(jump.meanDiff, FX.jump.meanDiff, 1e-9));
check("jump: the two sources reach different trend verdicts (A increasing, B no trend)", jump.trendA.verdict === "increasing" && jump.trendB.verdict === "none");
const jumpText = describeComparison(jump, { label: "annual rainfall", unit: "mm", digits: 1, nameA: "NASA POWER", nameB: "ERA5" });
check("jump wording says the sources disagree and names the years", /disagree in 5 years/.test(jumpText) && /2021 \(NASA POWER/.test(jumpText));
check("jump wording says it does not decide which source is right", /does not say which source is right/.test(jumpText));
check("jump wording reports both trend verdicts", /NASA POWER shows a significant increasing trend; ERA5 shows no significant trend/.test(jumpText));

// ---- two consistent sources ----
const agree = buildComparison(toSeries(FX.agree.years, FX.agree.nasa), toSeries(FX.agree.years, FX.agree.era));
check("agree: verdict is 'agree' and nothing is flagged", agree.verdict === "agree" && agree.flagged.length === 0);
check("agree: Pearson r matches scipy", close(agree.pearson, FX.agree.pearson, 1e-10));
const agreeText = describeComparison(agree, { label: "annual rainfall", unit: "mm", nameA: "NASA POWER", nameB: "ERA5" });
check("agree wording says no year stands out and gives r", /No year stands out/.test(agreeText) && /r = 0\.9\d/.test(agreeText) && !/disagree/.test(agreeText));

// ---- edge cases ----
check("only years present in both sources are compared", (() => { const c = buildComparison(toSeries([2000, 2001, 2002, 2003], [1, 2, 3, 4]), toSeries([2001, 2002, 2003, 2010], [1, 2, 3, 4])); return c.n === 3 && JSON.stringify(c.rows.map(r => r.year)) === "[2001,2002,2003]"; })());
check("fewer than 10 common years: 'too_few', nothing claimed", (() => { const c = buildComparison(toSeries(FX.jump.years.slice(0, 8), FX.jump.nasa.slice(0, 8)), toSeries(FX.jump.years.slice(0, 8), FX.jump.era.slice(0, 8))); return c.verdict === "too_few" && c.flagged.length === 0 && /too few/.test(describeComparison(c, { label: "x" })); })());
check("no common years does not crash", buildComparison([], []).verdict === "too_few" && buildComparison(toSeries([2000], [1]), toSeries([2005], [1])).n === 0);
check("the input series are not changed", (() => { const a = toSeries(FX.agree.years, FX.agree.nasa); const copy = JSON.stringify(a); buildComparison(a, toSeries(FX.agree.years, FX.agree.era)); return JSON.stringify(a) === copy; })());
check("a source that is higher on average is named in the bias sentence", /On average NASA POWER is [\d.]+ mm higher per year|On average ERA5 is [\d.]+ mm higher per year/.test(agreeText));


// ---- the note shown under a headline trend when the second source disagrees ----
const names = { label: "annual rainfall", nameA: "NASA POWER", nameB: "ERA5" };
const dispute = describeDispute(jump, names);
check("dispute: shown when the sources disagree AND reach different trend verdicts", /^Disputed: ERA5 shows no significant trend for the same years/.test(dispute));
check("dispute: names the years where the sources disagree", dispute.includes("2020, 2021, 2022, 2023, 2024"));
check("dispute: tells the reader not to rely on the trend above", /Do not rely on the annual rainfall trend above yet/.test(dispute));
check("dispute: empty when the sources agree", describeDispute(agree, names) === "");
check("dispute: empty when there is nothing to compare", describeDispute(null, names) === "" && describeDispute(buildComparison([], []), names) === "");
check("dispute: empty when the sources disagree in some years but reach the same verdict", (() => {
  const c = { ...jump, trendA: { verdict: "none" }, trendB: { verdict: "none" } };
  return describeDispute(c, names) === "";
})());
check("dispute: works the other way round (A no trend, B increasing)", /ERA5 shows a significant increasing trend/.test(describeDispute({ ...jump, trendA: { verdict: "none" }, trendB: { verdict: "increasing" } }, names)));

console.log(`\nRESULTS: ${passed}/${total} tests passed`);
process.exit(passed === total ? 0 : 1);
