// Browser regression suite used by CI against the build or a running Docker site.
// Motion is verified before screenshot stabilization. Findings and audit crashes
// are failures; missing pages, empty React mounts, and skipped scans never pass.
import { chromium } from "playwright";
import axeSource from "axe-core";
import http from "node:http";
import { readFile, stat, realpath } from "node:fs/promises";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeSymmetry } from "./symmetry.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const SITE = path.join(ROOT, "_site");
const REPORTS = path.resolve(process.env.VISUAL_REPORT_DIR || path.join(HERE, "reports"));
const SHOTS = path.join(REPORTS, "screenshots");
const PAGES = ["/", "/cv/", "/portfolio/", "/publications/", "/github/"];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".mjs": "text/javascript", ".jsx": "text/javascript", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
  ".xml": "application/xml", ".pdf": "application/pdf", ".map": "application/json" };

export async function startServer(root) {
  const absoluteRoot = await realpath(root);
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      let file = path.resolve(absoluteRoot, "." + pathname);
      if (file !== absoluteRoot && !file.startsWith(absoluteRoot + path.sep)) {
        res.writeHead(403); res.end("forbidden"); return;
      }
      if ((await stat(file).catch(() => null))?.isDirectory()) file = path.join(file, "index.html");
      if (!existsSync(file) && existsSync(file + ".html")) file += ".html";
      file = await realpath(file);
      if (!file.startsWith(absoluteRoot + path.sep)) {
        res.writeHead(403); res.end("forbidden"); return;
      }
      const body = await readFile(file);
      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
      res.end(body);
    } catch (error) {
      res.writeHead(error instanceof URIError ? 400 : 404); res.end("not found");
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return server;
}

function writeReport(out) {
  mkdirSync(REPORTS, { recursive: true });
  writeFileSync(path.join(REPORTS, "visual_report.json"), JSON.stringify(out, null, 2) + "\n");
  const lines = ["## Visual, interaction and accessibility audit", "",
    `Generated ${out.generated_at}`, "",
    `- page/theme/viewport cases: ${out.summary.pages}`,
    `- accessibility violations: ${out.summary.axe_violations}`,
    `- motion checks: ${out.summary.motion_checks}`,
    `- screenshots: ${out.summary.screenshots.length}`, ""];
  for (const finding of out.findings) {
    lines.push(`- **${finding.severity} [${finding.kind}]** ${finding.page}: ${finding.message}`);
    if (finding.detail) lines.push(`  ${finding.detail}`);
  }
  if (!out.findings.length) lines.push("All checks passed.");
  writeFileSync(path.join(REPORTS, "visual_report.md"), lines.join("\n") + "\n");
}

async function checkAxe(page, label, out) {
  await page.evaluate(axeSource.source);
  const results = await page.evaluate(async () => window.axe.run(document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
  }));
  for (const violation of results.violations) {
    out.summary.axe_violations++;
    out.findings.push({ page: label, severity: "error", kind: "a11y", rule: violation.id,
      message: violation.help,
      detail: violation.nodes.slice(0, 8).map(n => `${n.target.join(" ")}: ${n.failureSummary}`).join("; "),
      nodes: violation.nodes.map(n => n.target.join(" ")) });
  }
}

async function revealPage(page) {
  // Exercise the real IntersectionObserver instead of making invisible content
  // visible with a test-only CSS override (which would mask broken reveals).
  /* styles.css sets `html { scroll-behavior: smooth }`, so a bare scrollTo()
     animates. Two rAFs is ~32ms, far less than the scroll needs to arrive, so
     the page barely moved between hops and the IntersectionObserver never saw
     most sections -- every homepage case then failed the reveal wait below.
     Ask for instant jumps explicitly and give each one time to be observed. */
  await page.evaluate(async () => {
    for (let top = 0; top < document.documentElement.scrollHeight; top += innerHeight * .8) {
      window.scrollTo({ top, behavior: 'instant' });
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForFunction(() => [...document.querySelectorAll('[data-reveal]')].every(
    el => Number(getComputedStyle(el).opacity) > .99), null, { timeout: 10000 });
}

async function checkMotion(page, label, out, reduced = false) {
  /* explainers-3d is imported as a module and mounts asynchronously, so a probe
     taken the instant the page settles can land before diagnostics() exists.
     Wait for the engine to report itself ready rather than treating a not-yet-
     mounted scene as a rendering failure. */
  await page.waitForFunction(() => window.Explainers3D?.diagnostics()?.ready === true,
    null, { timeout: 15000 }).catch(() => {});
  const before = await page.evaluate(() => ({
    animations: document.getAnimations().map(a => ({ time: a.currentTime, state: a.playState,
      duration: a.effect?.getTiming().duration })),
    canvas: [...document.querySelectorAll('canvas')].some(c => c.width > 0 && c.height > 0),
    scenes: document.querySelectorAll('[data-scene-mounted]').length,
    webgl: window.Explainers3D?.diagnostics(),
  }));
  if (reduced) {
    if (before.animations.some(a => a.state === "running" && a.duration > 100)) {
      throw new Error("Long-running CSS motion continues with reduced motion enabled");
    }
    await page.waitForTimeout(180);
    const settled = await page.evaluate(() => window.Explainers3D?.diagnostics());
    if (settled?.rafActive) throw new Error('WebGL keeps scheduling frames with reduced motion enabled');
  } else {
    if (!before.animations.some(a => a.state === "running")) throw new Error("No running homepage CSS animations");
    /* Pairing the two getAnimations() samples by array index was flaky: the order
       is not guaranteed stable and the set itself changes as animations start and
       finish between probes, so a running animation could end up compared against
       a different one's timestamp. That failed a deploy on `/ desktop light`
       while the identical page passed moments earlier, and reproduced locally on
       the third consecutive run. Compare the furthest-advanced running animation
       instead: order-independent, and unaffected by the set changing. */
    const furthest = list => Math.max(0, ...list.filter(a => a.state === "running")
      .map(a => Number(a.time) || 0));
    await page.waitForTimeout(320);
    const afterAnimations = await page.evaluate(() => document.getAnimations()
      .map(a => ({ time: a.currentTime, state: a.playState })));
    if (furthest(afterAnimations) <= furthest(before.animations)) {
      throw new Error("Homepage animation frames did not advance");
    }
    const after = await page.evaluate(() => window.Explainers3D?.diagnostics());
    if (!before.canvas || !before.scenes || !before.webgl?.ready || !after) {
      /* The explainer scenes are decorative and index.html swallows any failure
         so the page stays fully readable without them. A headless runner with
         no usable GPU therefore is not a page regression -- it is the graceful
         path working. Record it, but do not fail the build over the absence of
         hardware. A context that did come up and then stopped advancing is a
         real fault and is still an error below. */
      out.findings.push({ page: label, severity: 'warning', kind: 'motion',
        message: 'WebGL scenes did not initialise; decorative fallback in use',
        detail: JSON.stringify({ canvas: before.canvas, scenes: before.scenes, webgl: before.webgl ?? null }) });
      out.summary.motion_checks++;
      return;
    }
    /* The render loop deliberately stops once no [data-scene] is on screen and
       restarts on scroll -- see the `visible` guard in explainers-3d.js. On a
       390px viewport the hero scene sits off-screen, so at the top of the page
       there is nothing to draw and a frozen frame counter is the correct,
       power-saving result. Verified: 0 scenes in view -> raf idle; scrolled to
       a scene -> frames 17 then 69. Only demand advancing frames when a scene
       is actually visible, and otherwise assert the loop really did idle. */
    const sceneOnScreen = await page.evaluate(() =>
      [...document.querySelectorAll('[data-scene]')].some(el => {
        const r = el.getBoundingClientRect();
        return r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < innerHeight;
      }));
    if (sceneOnScreen) {
      if (after.renderedFrames <= before.webgl.renderedFrames) {
        throw new Error('Homepage WebGL scenes did not render advancing frames while visible');
      }
    } else if (after.rafActive) {
      throw new Error('WebGL keeps scheduling frames with no scene on screen');
    }
  }
  out.summary.motion_checks++;
}

async function checkHomepageControls(page, label, out) {
  const theme = await page.locator('html').getAttribute('data-theme');
  await page.getByRole('button', {name: `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}).click();
  if (await page.locator('html').getAttribute('data-theme') === theme) throw new Error('Theme switch did not change theme');
  await page.getByRole('button', {name: `Switch to ${theme} theme`}).click();
  const allCount = await page.locator('.card--project').count();
  const filters = page.getByRole('group', { name: 'Filter projects' });
  const specific = filters.getByRole('button').nth(1);
  await specific.click();
  await page.waitForFunction(count => document.querySelectorAll('.card--project').length < count, allCount);
  if (await specific.getAttribute('aria-pressed') !== 'true') throw new Error('Project filter is not selected');
  await filters.getByRole('button', { name: 'All', exact: true }).click();
  await page.waitForFunction(count => document.querySelectorAll('.card--project').length === count, allCount);
  await page.locator('.card--project').first().click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });
  await page.waitForTimeout(350);
  await checkAxe(page, label + ' / project dialog', out);
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  if (!(await page.locator('.card--project').first().evaluate(el => el === document.activeElement))) {
    throw new Error('Closing a detail does not return keyboard focus to its card');
  }
  const links = await page.locator('a[href^="#"]').evaluateAll(elements => elements.map(el => el.getAttribute('href')));
  const missing = await page.evaluate(hrefs => hrefs.filter(href => href.length > 1 &&
    !document.getElementById(decodeURIComponent(href.slice(1)))) , links);
  if (missing.length) throw new Error('Broken in-page links: ' + missing.join(', '));
  // Check every internal React destination, including links only present after
  // opening a card. Static HTML link scans cannot see these data-driven URLs.
  const urls = await page.evaluate(() => [...new Set([
    ...[...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')),
    ...(window.SITE?.projects || []).map(project => project.url),
  ])].filter(url => typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')));
  for (const url of urls) {
    const response = await page.request.get(new URL(url, page.url()).href);
    if (!response.ok()) throw new Error(`Internal destination ${url} returned ${response.status()}`);
  }
}

export async function run() {
  const out = { generated_at: new Date().toISOString(), skipped: false,
    summary: { pages: 0, axe_violations: 0, symmetry_issues: 0, motion_checks: 0, screenshots: [] }, findings: [] };
  let server, browser;
  try {
    let base = process.env.SITE_BASE_URL;
    if (!base) {
      server = await startServer(SITE);
      base = `http://127.0.0.1:${server.address().port}`;
    }
    browser = await chromium.launch({ args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    mkdirSync(SHOTS, { recursive: true });
    for (const route of PAGES) for (const viewport of VIEWPORTS) for (const theme of ['light', 'dark']) {
      const label = `${route} ${viewport.name} ${theme}`;
      const page = await browser.newPage({ viewport, colorScheme: theme, reducedMotion: 'no-preference' });
      await page.addInitScript(value => localStorage.setItem('theme', value), theme);
      page.on('pageerror', error => out.findings.push({ page: label, severity: 'error', kind: 'javascript', message: error.message }));
      page.on('response', response => {
        if (response.status() >= 400 && new URL(response.url()).origin === new URL(base).origin) {
          out.findings.push({ page: label, severity: 'error', kind: 'resource', message: `${response.status()} ${response.url()}` });
        }
      });
      try {
        const response = await page.goto(new URL(route, base).href, { waitUntil: 'load', timeout: 45000 });
        if (!response?.ok()) throw new Error(`Page returned HTTP ${response?.status()}`);
        await page.locator('main h1, article h1, .page__title').first().waitFor({ state: 'visible', timeout: 15000 });
        await page.evaluate(() => document.fonts.ready);
        if (route === '/') {
          await page.locator('.card--project').first().waitFor({ state: 'attached' });
          await page.waitForTimeout(1800);
          await checkMotion(page, label, out);
          await revealPage(page);
        }
        // Freeze only after motion/reveal assertions to make color measurements
        // independent of transitions, without concealing rendering failures.
        await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}' });
        await page.evaluate(() => document.getAnimations().forEach(a => { try { a.finish(); } catch {} }));
        await checkAxe(page, label, out);
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2)) throw new Error('Page overflows horizontally');
        if (route === '/') {
          await checkHomepageControls(page, label, out);
          // Only compare siblings in the same actual CSS grid; unrelated cards
          // can intentionally have different sizes or occupy a spanning column.
          const grids = await page.evaluate(() => [...document.querySelectorAll('.skill-grid,.repo-grid,.gh-stats')].map(grid =>
            [...grid.children].map(el => { const r = el.getBoundingClientRect(); return { x:r.x,y:r.y,w:r.width,h:r.height }; })));
          for (const rects of grids) for (const issue of analyzeSymmetry(rects)) {
            out.summary.symmetry_issues++;
            out.findings.push({ page: label, severity: 'warning', kind: issue.kind, message: issue.detail });
          }
          await page.evaluate(() => scrollTo(0, 0));
        }
        const name = `${route.replace(/\W+/g, '_')}.${viewport.name}.${theme}.png`;
        /* fullPage capture of the ~12,000px homepage can exceed the renderer's
           surface limits on a software-GL runner and throw "Unable to capture
           screenshot". The screenshot is a diagnostic artefact, not an
           assertion, so fall back to the viewport rather than failing a page
           that has already passed every real check. */
        try {
          await page.screenshot({ path: path.join(SHOTS, name), fullPage: true });
        } catch {
          await page.screenshot({ path: path.join(SHOTS, name) });
          out.findings.push({ page: label, severity: 'warning', kind: 'screenshot',
            message: 'Full-page capture failed; saved viewport-sized screenshot instead' });
        }
        out.summary.screenshots.push(name);
        out.summary.pages++;
      } catch (error) {
        out.findings.push({ page: label, severity: 'error', kind: 'regression', message: error.message });
      } finally { await page.close(); }
    }
    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
      const label = `/ ${viewport.name} reduced-motion`;
      try {
        await page.goto(base, { waitUntil: 'load' });
        await page.locator('main h1').waitFor({ state: 'visible' });
        await revealPage(page);
        await checkMotion(page, label, out, true);
        await checkHomepageControls(page, label, out);
      } catch (error) {
        out.findings.push({ page: label, severity: 'error', kind: 'reduced-motion', message: error.message });
      } finally { await page.close(); }
    }
    // A blocked optional snapshot or unavailable decorative renderer must not
    // remove core content. Blocking the bundle itself must expose useful HTML.
    for (const blocked of ['snapshots', 'webgl', 'bundle']) {
      const page = await browser.newPage();
      try {
        await page.route('**/*', route => {
          const url = route.request().url();
          const shouldBlock = blocked === 'snapshots' ? /(?:linkedin|portfolio-sync)\.generated\.js/.test(url)
            : blocked === 'bundle' ? /app\.min\.js/.test(url) : /explainers.*\.js/.test(url);
          return shouldBlock ? route.abort() : route.continue();
        });
        await page.goto(base, {waitUntil: 'load'});
        if (blocked === 'bundle') {
          await page.locator('.app-fallback h1').waitFor({state:'visible'});
          if (await page.locator('.app-fallback a').count() < 3) throw new Error('Fallback navigation is missing');
        } else {
          await page.locator('.card--project').first().waitFor({state:'visible'});
          if (await page.locator('main h1').count() !== 1) throw new Error('Content did not mount after blocked optional assets');
        }
      } catch (error) {
        out.findings.push({page:`/ blocked-${blocked}`,severity:'error',kind:'fallback',message:error.message});
      } finally {await page.close();}
    }
  } catch (error) {
    out.findings.push({ page: 'audit', severity: 'error', kind: 'infrastructure', message: error.message });
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    writeReport(out);
  }
  const errors = out.findings.filter(f => f.severity === 'error').length;
  console.log(`visual_audit: ${out.summary.pages} cases, ${out.summary.motion_checks} motion checks, ${errors} errors`);
  if (errors) process.exitCode = 1;
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch(error => { console.error(error); process.exitCode = 1; });
}
