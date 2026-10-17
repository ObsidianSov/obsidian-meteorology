// Checks that index.html uses the module files (single source of truth)
// instead of carrying its own copies, and that the modules load in a browser.
const fs = require("fs");
const vm = require("vm");

const html = fs.readFileSync("./index.html", "utf8");
const MODULES = ["knowledge_layer.js", "climate_math.js", "rainfall_onset.js"];

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
  check(`index.html loads ${file}`, pos !== -1);
  check(`${file} is loaded before the inline script`, pos !== -1 && pos < inlineStart);
  check(`${file} exists on disk`, fs.existsSync(file));
}

const inlineCode = html.slice(inlineStart);
for (const file of MODULES) {
  for (const name of exportsByModule[file]) {
    const redefined = new RegExp(`(?:function|const|let|var)\\s+${name}\\b`).test(inlineCode);
    check(`index.html does not redefine ${name} (from ${file})`, !redefined);
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

console.log(`\nRESULTS: ${passed}/${total} tests passed`);
process.exit(passed === total ? 0 : 1);
