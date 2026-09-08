/* Interaction audit: drives the real UI rather than inspecting markup.
 *
 * visual_audit.mjs proves pages render and meet contrast; this proves the
 * controls actually do something -- nav links scroll to their section, filters
 * narrow the grid, overlays open and give focus back, the theme survives a
 * reload, the assistant answers.
 *
 * Runs against SITE_BASE_URL, defaulting to production. Not wired into the
 * deploy gate: it drives animation and smooth scrolling, so it is inherently
 * more timing-sensitive than the other passes. Promote it once it has a track
 * record. Waits poll for a condition instead of sleeping a fixed time, which
 * is what made the first draft report false failures on smooth scrolling.
 */
import { chromium } from "playwright";

const BASE = process.env.SITE_BASE_URL || "https://namo507.github.io";
const results = [], errors = [];
const ok = (name, pass, detail = "") => results.push({ name, pass: !!pass, detail });

/** Poll until `fn` is true in the page, or give up. Smooth scrolling and CSS
 *  transitions make any fixed timeout either flaky or needlessly slow. */
async function settle(page, fn, arg = null, timeout = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await page.evaluate(fn, arg)) return true;
    await page.waitForTimeout(150);
  }
  return false;
}

const NAV = [["Experience", "experience"], ["Projects", "projects"], ["Publications", "publications"],
  ["Skills", "skills"], ["Code", "code"], ["Signals", "signals"], ["Talks", "talks"],
  ["Teaching", "teaching"], ["Contact", "contact"]];
const inView = id => {
  const el = document.getElementById(id);
  if (!el) return false;
  const top = el.getBoundingClientRect().top;
  return top > -200 && top < 540;
};

const browser = await chromium.launch({
  args: ["--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});

async function homepage() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
  page.on("pageerror", e => errors.push(`desktop pageerror: ${e.message.slice(0, 90)}`));
  page.on("console", m => { if (m.type() === "error") errors.push(`desktop console: ${m.text().slice(0, 90)}`); });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(4500);

  for (const [label, id] of NAV) {
    const link = page.locator(".nav__row a.nav__link").filter({ hasText: new RegExp(`^${label}$`) }).first();
    if (!await link.count()) { ok(`nav → ${id}`, false, "link missing"); continue; }
    await link.click();
    ok(`nav → ${id}`, await settle(page, inView, id));
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  const before = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  await page.getByRole("button", { name: /Switch to (light|dark) theme/ }).click();
  const after = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  ok("theme toggle flips", before !== after, `${before} → ${after}`);
  ok("theme persisted", await page.evaluate(() => localStorage.getItem("theme")) === after);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(4000);
  ok("theme survives reload", await page.evaluate(() => document.documentElement.getAttribute("data-theme")) === after);

  await page.evaluate(() => {
    const el = document.getElementById("projects");
    window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 90, behavior: "instant" });
  });
  await page.waitForTimeout(900);
  const chips = (await page.locator(".filters button").allTextContents()).filter(c => c !== "All");
  const all = await page.locator('#projects button[aria-haspopup="dialog"]').count();
  const empty = [];
  for (const chip of chips) {
    await page.locator(".filters button")
      .filter({ hasText: new RegExp(`^${chip.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }).first().click();
    await page.waitForTimeout(350);
    const shown = await page.locator('#projects button[aria-haspopup="dialog"]').count();
    if (shown === 0 || shown > all) empty.push(`${chip}=${shown}`);
  }
  ok("every filter returns a usable subset", empty.length === 0, empty.join(" "));
  await page.locator(".filters button").filter({ hasText: /^All$/ }).first().click();
  await page.waitForTimeout(400);
  ok("All restores the full set", await page.locator('#projects button[aria-haspopup="dialog"]').count() === all, `${all}`);

  for (const section of ["projects", "experience", "publications", "code"]) {
    const card = page.locator(`#${section} button[aria-haspopup="dialog"]`).first();
    if (!await card.count()) { ok(`${section} cards expand`, false, "no expandable cards"); continue; }
    await page.evaluate(id => {
      const el = document.getElementById(id);
      window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 90, behavior: "instant" });
    }, section);
    await page.waitForTimeout(700);
    await card.click();
    const opened = await settle(page, () => document.querySelectorAll('[role="dialog"]').length === 1);
    await page.keyboard.press("Escape");
    const closed = await settle(page, () => document.querySelectorAll('[role="dialog"]').length === 0);
    ok(`${section} card opens and Escape closes it`, opened && closed);
    if (section === "projects") {
      ok("focus returns to the card", await page.evaluate(() => document.activeElement?.getAttribute("aria-haspopup") === "dialog"));
    }
  }

  const launcher = page.locator('[aria-label="Open research assistant"], [aria-label="Research assistant"]').first();
  if (await launcher.count()) {
    await launcher.click();
    await page.waitForTimeout(500);
    const input = page.locator('input[aria-label="Ask the research assistant"]').first();
    ok("assistant opens", await input.count() > 0);
    if (await input.count()) {
      await input.fill("tell me about your publications");
      await page.locator('[aria-label="Send question"]').first().click();
      // Scope to the message list; the send button also lives under [class*=buddy].
      const answered = await settle(page, () =>
        /Springer|AAPOR/i.test(document.querySelector(".buddy__msgs")?.textContent || ""));
      ok("assistant answers from site data", answered);
    }
  } else ok("assistant launcher exists", false);

  await page.keyboard.press("Escape");
  await page.evaluate(() => window.scrollTo({ top: 9000, behavior: "instant" }));
  await page.waitForTimeout(600);
  const toTop = page.locator('[aria-label="Back to top"]').first();
  if (await toTop.count()) {
    await toTop.click();
    ok("back to top works", await settle(page, () => scrollY < 80));
  } else ok("back to top control exists", false);

  const placeholders = await page.evaluate(() => [...document.querySelectorAll("#contact a")]
    .filter(a => { const h = a.getAttribute("href"); return !h || h === "#"; }).map(a => a.textContent.trim()));
  ok("no placeholder hrefs in contact", placeholders.length === 0, placeholders.join(", "));
  await page.close();
}

async function mobile() {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 }, colorScheme: "dark", isMobile: true, hasTouch: true });
  page.on("pageerror", e => errors.push(`mobile pageerror: ${e.message.slice(0, 90)}`));
  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(4500);
  const menu = page.locator(".nav__menu-btn").first();
  ok("nav collapses to a Sections menu", await menu.count() === 1);
  await menu.click();
  await page.waitForTimeout(500);
  const items = await page.locator(".nav__menu-item").count();
  ok("Sections menu lists every section", items >= 9, `${items} items`);
  if (items) {
    await page.locator(".nav__menu-item").filter({ hasText: /Skills/ }).first().click();
    ok("Sections menu link scrolls", await settle(page, inView, "skills"));
  }
  await page.locator(".theme-toggle").first().click();
  ok("mobile theme toggle works",
    await settle(page, () => document.documentElement.getAttribute("data-theme") === "light"));
  await page.evaluate(() => {
    const el = document.getElementById("projects");
    window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 70, behavior: "instant" });
  });
  await page.waitForTimeout(800);
  await page.locator('#projects button[aria-haspopup="dialog"]').first().click();
  ok("mobile overlay opens", await settle(page, () => document.querySelectorAll('[role="dialog"]').length === 1));
  ok("no sideways overflow with the overlay open",
    !await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth));
  await page.keyboard.press("Escape");
  ok("mobile overlay closes", await settle(page, () => document.querySelectorAll('[role="dialog"]').length === 0));
  await page.close();
}

async function classicPages() {
  const routes = ["/cv/", "/publications/", "/portfolio/", "/github/", "/talks/",
    "/teaching/", "/tags/", "/about/", "/cv-json/", "/sitemap/", "/terms/"];
  for (const route of routes) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
    page.on("pageerror", e => errors.push(`${route} pageerror: ${e.message.slice(0, 80)}`));
    const response = await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60000 });
    ok(`${route} loads`, response.status() === 200, `HTTP ${response.status()}`);
    ok(`${route} has exactly one h1`,
      await page.evaluate(() => document.querySelectorAll("h1").length === 1),
      `${await page.evaluate(() => document.querySelectorAll("h1").length)} found`);
    const toggle = page.locator("#theme-toggle, .theme-toggle").first();
    if (await toggle.count()) {
      const before = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
      await toggle.click();
      ok(`${route} theme toggle`,
        await settle(page, b => document.documentElement.getAttribute("data-theme") !== b, before));
    }
    await page.close();
  }
}

try {
  await homepage();
  await mobile();
  await classicPages();
} finally {
  await browser.close();
}

const failed = results.filter(r => !r.pass);
console.log(`ui_audit: ${results.length - failed.length}/${results.length} checks passed, ${errors.length} page errors`);
for (const r of failed) console.log(`  FAIL  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
for (const e of errors) console.log(`  ERROR ${e}`);
if (failed.length || errors.length) process.exitCode = 1;
