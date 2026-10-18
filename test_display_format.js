const { isNumber, fmt, showRaw } = require('./display_format.js');

let passed = 0, total = 0;
function check(name, condition) {
  total++;
  if (condition) { passed++; console.log(`PASS: ${name}`); }
  else console.log(`FAIL: ${name}`);
}

check("a number is formatted with the requested digits and unit", fmt(21.46, 0, "°C") === "21°C" && fmt(3.14159, 2) === "3.14" && fmt(0.04, 1, " mm") === "0.0 mm");
check("zero is shown as 0 (a real value), not as n/a", fmt(0, 1, " mm") === "0.0 mm" && fmt(0, 0, "%") === "0%");
check("null is n/a, never 0", fmt(null, 0, "°C") === "n/a");
check("undefined, NaN, Infinity and text are n/a", [undefined, NaN, Infinity, -Infinity, "12", {}, []].every(v => fmt(v, 1, "°C") === "n/a"));
check("the unit is not shown next to n/a", !fmt(null, 0, " km/h").includes("km/h"));
check("negative values keep their sign", fmt(-2.6, 0, "°C") === "-3°C");
check("a tiny negative number does not show as -0", fmt(-0.04, 0, "°C") === "0°C" && fmt(-0, 1) === "0.0");
check("showRaw returns the value as given", showRaw(21.4) === "21.4" && showRaw(0) === "0");
check("showRaw returns n/a for missing values", showRaw(null) === "n/a" && showRaw(undefined) === "n/a" && showRaw("x") === "n/a");
check("isNumber rejects NaN, Infinity and numeric text", isNumber(1) && isNumber(0) && !isNumber(NaN) && !isNumber(Infinity) && !isNumber("1"));

console.log(`\nRESULTS: ${passed}/${total} tests passed`);
process.exit(passed === total ? 0 : 1);
