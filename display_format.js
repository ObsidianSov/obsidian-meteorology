// Showing numbers to people: a missing value is shown as "n/a", never as 0.
// Pure functions — no browser needed.

function isNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

function fmt(v, digits = 0, unit = "") {
  // fmt(21.46, 0, "°C") -> "21°C"; fmt(null) -> "n/a" (the unit is dropped, not shown next to n/a)
  if (!isNumber(v)) return "n/a";
  const text = v.toFixed(digits);
  return (text === "-0" ? "0" : text) + unit;
}

function showRaw(v) {
  // The value exactly as the service gave it, or "n/a"
  return isNumber(v) ? String(v) : "n/a";
}

if (typeof module !== "undefined") module.exports = { isNumber, fmt, showRaw };
