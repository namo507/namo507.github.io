/* Keep already-minified vendor distributions intact; only minify our code. */
const fs = require("node:fs");
const path = require("node:path");
const uglify = require("uglify-js");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const vendors = [
  "node_modules/jquery/dist/jquery.min.js",
  "node_modules/fitvids/dist/fitvids.min.js",
  "node_modules/jquery-smooth-scroll/jquery.smooth-scroll.min.js",
  "node_modules/plotly.js-dist-min/plotly.min.js",
];
const sources = ["assets/js/plugins/jquery.greedy-navigation.js", "assets/js/_main.js"];
const result = uglify.minify(Object.fromEntries(sources.map((file) => [file, read(file)])), {
  compress: true,
  mangle: true,
});
if (result.error) throw result.error;
const output = vendors.map(read).concat(result.code).join("\n;\n") + "\n";
fs.writeFileSync(path.join(root, "assets/js/main.min.js"), output);
process.stdout.write(`Built classic JavaScript (${Buffer.byteLength(output)} bytes).\n`);
