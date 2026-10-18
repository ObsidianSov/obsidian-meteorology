// Builds the single-file app.
//   node build.js
// Reads index.src.html, replaces each <script src="module.js"></script> with the module's
// code, and writes index.html. The result runs from one file, opened any way
// (file manager, browser, GitHub Pages). Edit the module files and index.src.html,
// NEVER index.html directly.
const fs = require("fs");
const path = require("path");

const MODULES = ["knowledge_layer.js", "climate_math.js", "trend_stats.js", "rainfall_onset.js"];

function build(dir = __dirname) {
  let html = fs.readFileSync(path.join(dir, "index.src.html"), "utf8");
  for (const file of MODULES) {
    const tag = `<script src="${file}"></script>`;
    if (!html.includes(tag)) throw new Error(`index.src.html is missing ${tag}`);
    const code = fs.readFileSync(path.join(dir, file), "utf8").replace(/\s+$/, "");
    html = html.replace(tag, () =>
      `<script>\n// ===== ${file} (inlined by build.js: edit the module file, not this copy) =====\n${code}\n</script>`);
  }
  return html;
}

module.exports = { build, MODULES };

if (require.main === module) {
  const out = build();
  fs.writeFileSync(path.join(__dirname, "index.html"), out);
  console.log(`Built index.html (${out.length} bytes) from index.src.html + ${MODULES.length} modules`);
}
