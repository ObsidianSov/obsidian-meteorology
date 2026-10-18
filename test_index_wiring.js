// Checks that index.html uses the module files (single source of truth)
// instead of carrying its own copies, and that the modules load in a browser.
const fs = require("fs");
const vm = require("vm");

const html = fs.readFileSync("./index.src.html", "utf8");   // the source page: loads modules by <script src>
const built = fs.readFileSync("./index.html", "utf8");       // the shipped single file
const { build, MODULES: BUILD_MODULES } = require("./build.js");
const MODULES = ["knowledge_layer.js", "climate_math.js", "trend_stats.js", "rainfall_onset.js"];

let passed = 0, total = 0;
function check(name, condition) {
  total++;
  if (condition) { passed++; console.log(`PASS: ${name}`); }
  else console.log(`FAIL: ${name}`);
}

const inlineStart = html.indexOf("<script>");
const exportsByModule = {};
for (const file of MODULES) exportsByModule[file] = Object.keys(require("./" + file));

for (const file of MODULES) {
  const tag = `<script src="${file}"></script>`;
  const pos = html.indexOf(tag);
  check(`index.src.html loads ${file}`, pos !== -1);
  check(`${file} is loaded before the page script in index.src.html`, pos !== -1 && pos < inlineStart);
  check(`${file} exists on disk`, fs.existsSync(file));
}

const inlineCode = html.slice(inlineStart);
for (const file of MODULES) {
  for (const name of exportsByModule[file]) {
    const redefined = new RegExp(`(?:function|const|let|var)\\s+${name}\\b`).test(inlineCode);
    check(`index.src.html does not redefine ${name} (from ${file})`, !redefined);
  }
}

// Modules must load in a browser (no `module` object) and expose their functions as globals
for (const file of MODULES) {
  const sandbox = vm.createContext({});
  let loaded = true;
  try { vm.runInContext(fs.readFileSync(file, "utf8"), sandbox); } catch (e) { loaded = false; }
  check(`${file} loads without a Node 'module' object`, loaded);
  for (const name of exportsByModule[file]) {
    check(`${file} exposes ${name} as a global in the browser`,
      loaded && vm.runInContext(`typeof ${name} !== "undefined"`, sandbox));
  }
}


// The shipped index.html must be a single self-contained file that matches the sources exactly
check("index.html is exactly what build.js produces (if this fails, run: node build.js)", built === build());
check("build.js inlines the same modules this test checks", JSON.stringify(BUILD_MODULES) === JSON.stringify(MODULES));
for (const file of MODULES) {
  check(`index.html has no external <script src> for ${file} (works when opened from any place)`, !built.includes(`<script src="${file}"`));
  const firstLine = fs.readFileSync(file, "utf8").split("\n").find(l => l.trim().length > 0 && !l.trim().startsWith("//"));
  check(`index.html contains the code of ${file}`, built.includes(firstLine));
}
const externalScripts = (built.match(/<script src="[^"]+"/g) || []);
check("the only external script in index.html is the Chart.js CDN", externalScripts.length === 1 && /chart\.js/.test(externalScripts[0]));

console.log(`\nRESULTS: ${passed}/${total} tests passed`);
process.exit(passed === total ? 0 : 1);
