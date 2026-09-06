const { KNOWLEDGE_BASE, getExplanation, getVariableInfo } = require('./knowledge_layer.js');

let passed = 0, total = 0;
function check(name, condition) {
  total++;
  if (condition) { passed++; console.log(`PASS: ${name}`); }
  else console.log(`FAIL: ${name}`);
}

// Every entry has the required minimum fields
const requiredFields = ['name', 'unit', 'definition', 'studentExplanation', 'advancedNote'];
for (const [key, entry] of Object.entries(KNOWLEDGE_BASE)) {
  for (const field of requiredFields) {
    check(`${key} has non-empty "${field}"`, typeof entry[field] === 'string' && entry[field].length > 0);
  }
}

// getExplanation returns the right text for the right tier
check("student tier returns studentExplanation for temperature",
  getExplanation('temperature', 'student') === KNOWLEDGE_BASE.temperature.studentExplanation);

check("advanced tier returns advancedNote for temperature",
  getExplanation('temperature', 'advanced') === KNOWLEDGE_BASE.temperature.advancedNote);

check("nimet tier also returns advancedNote (falls through, not student-only)",
  getExplanation('humidity', 'nimet') === KNOWLEDGE_BASE.humidity.advancedNote);

// Graceful handling of unknown keys — must not throw, must return empty string
check("unknown key returns empty string, not undefined/error",
  getExplanation('nonexistentVariable', 'student') === "");

check("getVariableInfo returns null for unknown key",
  getVariableInfo('nonexistentVariable') === null);

check("getVariableInfo returns the full entry for a known key",
  getVariableInfo('windSpeed').unit === 'km/h');

console.log(`\nRESULTS: ${passed}/${total} tests passed`);
process.exit(passed === total ? 0 : 1);
