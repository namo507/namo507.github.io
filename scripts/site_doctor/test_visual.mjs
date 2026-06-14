// Browser-free tests for the visual audit: symmetry math + static server.
import { analyzeSymmetry } from "./symmetry.mjs";
import { startServer } from "./visual_audit.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.resolve(__dirname, "..", "..", "_site");

let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`); if (!cond) failures++; };

// A perfectly aligned 3-up row: same top, same height, even gaps.
const aligned = [
  { sel: ".card", x: 0, y: 100, w: 200, h: 150 },
  { sel: ".card", x: 220, y: 100, w: 200, h: 150 },
  { sel: ".card", x: 440, y: 100, w: 200, h: 150 },
];
ok(analyzeSymmetry(aligned).length === 0, "aligned row yields no issues");

// One tile pushed down and shorter, with an uneven gap.
const skewed = [
  { sel: ".card", x: 0, y: 100, w: 200, h: 150 },
  { sel: ".card", x: 220, y: 118, w: 200, h: 120 },
  { sel: ".card", x: 470, y: 100, w: 200, h: 150 },
];
const issues = analyzeSymmetry(skewed);
ok(issues.some((i) => i.kind === "row-top-misalign"), "detects top misalignment");
ok(issues.some((i) => i.kind === "row-height-mismatch"), "detects height mismatch");
ok(issues.some((i) => i.kind === "uneven-gaps"), "detects uneven gaps");

// Static server should serve the built homepage if present.
if (path.basename(SITE_DIR) === "_site") {
  try {
    const server = await startServer(SITE_DIR);
    const port = server.address().port;
    const res = await fetch(`http://127.0.0.1:${port}/`);
    const body = await res.text();
    ok(res.status === 200, "static server returns 200 for /");
    ok(/<div id="app">|<html|<!doctype/i.test(body), "served homepage looks like HTML");
    server.close();
  } catch (e) {
    ok(false, "static server smoke test threw: " + e.message);
  }
}

console.log(failures === 0 ? "\nAll visual unit tests passed." : `\n${failures} test(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
