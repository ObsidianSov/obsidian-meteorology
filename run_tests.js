// Runs every test file in this folder and reports one overall PASS/FAIL.
// Usage:  node run_tests.js
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => /^test_.*\.js$/.test(f)).sort();
if (files.length === 0) { console.log("No test files found."); process.exit(1); }

let totalPassed = 0, totalTests = 0, failedFiles = [];
for (const f of files) {
  const r = spawnSync("node", [path.join(dir, f)], { encoding: "utf8" });
  const out = (r.stdout || "") + (r.stderr || "");
  const m = out.match(/RESULTS:\s*(\d+)\/(\d+)/);
  const passed = m ? Number(m[1]) : 0, total = m ? Number(m[2]) : 0;
  totalPassed += passed; totalTests += total;
  const ok = r.status === 0 && m && passed === total;
  if (!ok) { failedFiles.push(f); console.log(out); }
  console.log(`${ok ? "PASS" : "FAIL"}  ${f}  (${passed}/${total})`);
}
console.log(`\nTOTAL: ${totalPassed}/${totalTests} tests passed in ${files.length} files`);
if (failedFiles.length) { console.log("FAILED FILES: " + failedFiles.join(", ")); process.exit(1); }
console.log("ALL TESTS PASSED");
