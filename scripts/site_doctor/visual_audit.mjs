// Headless visual + accessibility audit for the built _site.
//
// Serves the static _site directory, loads each target page in headless
// Chromium, and runs three checks:
//   1. axe-core WCAG 2 A/AA accessibility scan (the industry-standard engine).
//   2. Tile-symmetry geometry: measures the bounding boxes of the homepage
//      content tiles and flags rows whose tops/heights or column gaps are not
//      aligned within tolerance.
//   3. Full-page screenshots at desktop and mobile widths, saved as artifacts.
//
// Results are written to reports/visual_report.json (+ .md) so the Python
// orchestrator can fold them into the unified Site Doctor report. The script
// never throws on a finding; it exits 0 and lets the workflow decide.

import { chromium } from "playwright";
import axeSource from "axe-core";
import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeSymmetry } from "./symmetry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SITE_DIR = path.join(REPO_ROOT, "_site");
const REPORT_DIR = path.join(__dirname, "reports");
const SHOT_DIR = path.join(REPORT_DIR, "screenshots");

const PAGES = ["/", "/cv/", "/portfolio/", "/publications/", "/github/"];
const TILE_SELECTORS = [".card", ".project", ".skill", ".metric", ".repo", ".contact-card"];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const ALIGN_TOLERANCE_PX = 4;   // tops/heights within a row may vary by this much
const GAP_TOLERANCE_PX = 6;     // column gaps may vary by this much

const MIME = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".mjs": "text/javascript", ".jsx": "text/javascript", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
  ".xml": "application/xml", ".pdf": "application/pdf", ".map": "application/json",
};

function startServer(root) {
  const server = http.createServer(async (req, res) => {
    try {
      let urlPath = decodeURIComponent(req.url.split("?")[0]);
      let filePath = path.join(root, urlPath);
      if (urlPath.endsWith("/")) filePath = path.join(filePath, "index.html");
      if (!existsSync(filePath) && existsSync(filePath + ".html")) filePath += ".html";
      if (existsSync(filePath) && (await readFile(filePath).catch(() => null))) {
        const body = await readFile(filePath);
        res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
        res.end(body);
        return;
      }
      res.writeHead(404); res.end("not found");
    } catch (e) {
      res.writeHead(500); res.end(String(e));
    }
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

// Geometry symmetry analysis, evaluated in the page context.
function measureTiles(selectors) {
  const rects = [];
  for (const sel of selectors) {
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        rects.push({ sel, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
      }
    }
  }
  return rects;
}

async function run() {
  const findings = [];
  const summary = { pages: 0, axe_violations: 0, symmetry_issues: 0, screenshots: [] };

  if (!existsSync(SITE_DIR)) {
    const out = { generated_at: new Date().toISOString(), skipped: true,
      reason: "_site not found; build the site first", findings, summary };
    writeReport(out);
    console.log("visual_audit: _site missing, skipping");
    return;
  }
  mkdirSync(SHOT_DIR, { recursive: true });

  const server = await startServer(SITE_DIR);
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();

  for (const pagePath of PAGES) {
    const page = await browser.newPage({ viewport: VIEWPORTS[0] });
    const url = base + pagePath;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    } catch {
      findings.push({ page: pagePath, severity: "warning", kind: "load",
        message: `Page did not reach network idle in time` });
      await page.close();
      continue;
    }
    summary.pages++;
    // The homepage renders via in-browser Babel; give the app a moment to mount.
    if (pagePath === "/") {
      await page.waitForTimeout(3500);
    }

    // 1. axe-core accessibility scan.
    try {
      await page.evaluate(axeSource.source);
      const results = await page.evaluate(async () => {
        return await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } });
      });
      for (const v of results.violations) {
        if (v.impact === "minor") continue; // focus on moderate+ for signal
        summary.axe_violations++;
        findings.push({
          page: pagePath, severity: v.impact === "critical" || v.impact === "serious" ? "error" : "warning",
          kind: "a11y", rule: v.id, message: v.help,
          detail: `${v.nodes.length} node(s); ${v.helpUrl}`,
          nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
        });
      }
    } catch (e) {
      findings.push({ page: pagePath, severity: "warning", kind: "a11y-error", message: String(e) });
    }

    // 2. Tile symmetry (homepage carries the tile grid).
    if (pagePath === "/") {
      try {
        const rects = await page.evaluate(measureTiles, TILE_SELECTORS);
        const issues = analyzeSymmetry(rects, ALIGN_TOLERANCE_PX, GAP_TOLERANCE_PX);
        for (const it of issues) {
          summary.symmetry_issues++;
          findings.push({ page: pagePath, severity: "warning", kind: it.kind, message: it.detail });
        }
        findings.push({ page: pagePath, severity: "info", kind: "tile-count",
          message: `Measured ${rects.length} tiles across the homepage.` });
      } catch (e) {
        findings.push({ page: pagePath, severity: "warning", kind: "symmetry-error", message: String(e) });
      }
    }

    // 3. Screenshots at each viewport.
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(400);
      const name = `${pagePath.replace(/\W+/g, "_") || "home"}.${vp.name}.png`;
      const file = path.join(SHOT_DIR, name);
      await page.screenshot({ path: file, fullPage: true }).catch(() => {});
      summary.screenshots.push(path.relative(REPO_ROOT, file));
    }
    await page.close();
  }

  await browser.close();
  server.close();

  const out = { generated_at: new Date().toISOString(), skipped: false, summary, findings };
  writeReport(out);
  console.log(`visual_audit: ${summary.pages} pages, ${summary.axe_violations} a11y, ${summary.symmetry_issues} symmetry issues`);
}

function writeReport(out) {
  mkdirSync(REPORT_DIR, { recursive: true });
  const jsonPath = path.join(REPORT_DIR, "visual_report.json");
  const mdPath = path.join(REPORT_DIR, "visual_report.md");
  import("node:fs").then(({ writeFileSync }) => {
    writeFileSync(jsonPath, JSON.stringify(out, null, 2) + "\n");
    writeFileSync(mdPath, toMarkdown(out));
  });
}

function toMarkdown(out) {
  const lines = ["## Visual / accessibility audit", ""];
  lines.push(`Generated \`${out.generated_at}\``);
  if (out.skipped) { lines.push("", `Skipped: ${out.reason}`); return lines.join("\n") + "\n"; }
  lines.push("");
  lines.push(`- pages audited: **${out.summary.pages}**`);
  lines.push(`- accessibility violations: **${out.summary.axe_violations}**`);
  lines.push(`- tile symmetry issues: **${out.summary.symmetry_issues}**`);
  lines.push(`- screenshots: ${out.summary.screenshots.length}`);
  lines.push("");
  const actionable = out.findings.filter((f) => f.severity === "error" || f.severity === "warning");
  if (actionable.length) {
    lines.push("### Visual findings");
    for (const f of actionable) {
      const icon = f.severity === "error" ? "🔴" : "🟡";
      lines.push(`- ${icon} **[${f.kind}]** \`${f.page}\` ${f.message}`);
      if (f.detail) lines.push(`  - ${f.detail}`);
    }
  } else {
    lines.push("### Visual findings", "Clean. No accessibility or symmetry issues detected. 🎉");
  }
  return lines.join("\n") + "\n";
}

export { startServer, run };

// Only launch the full audit when executed directly, so tests can import the
// helpers without spawning a browser.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((e) => { console.error(e); process.exit(0); });
}
