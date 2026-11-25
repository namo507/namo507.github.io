import React from "react";
import { createRoot } from "react-dom/client";
/* Cosmic portfolio — implementation of the "Portfolio Redesign" Claude Design
 * canvas. The canvas authored its logic as a `DCLogic` subclass whose
 * `renderVals()` fed `{{ }}` bindings; here that same logic is a React class
 * component rendering the markup directly, with the canvas's inline styles
 * living in assets/cosmic/styles.css.
 *
 * Data contract (unchanged from the previous build, so the sync bots keep
 * working):
 *   window.SITE            — assets/cosmic/data.js
 *   window.PORTFOLIO_SYNC  — assets/cosmic/portfolio-sync.generated.js
 *   window.LINKEDIN_SYNC   — assets/cosmic/linkedin.generated.js
 */

const { useMemo } = React;

// ── Sync merges ─────────────────────────────────────────────────────────────
// scripts/portfolio_sync/validation.py asserts this join explicitly: the
// overlay is matched to a role on (org, role) and only appends bullets the
// hand-authored entry does not already carry. Renaming either key, or dropping
// this merge, breaks `scripts/validate_esd_portfolio_sync.py`.
function normalizePortfolioSync(sync) {
  if (!sync || !sync.meta || sync.meta.sync_status !== "ok") return null;
  return {
    meta: sync.meta,
    experience: Array.isArray(sync.experience) ? sync.experience : [],
  };
}

function mergePortfolioSyncIntoSite(baseData, sync) {
  const portfolioSync = normalizePortfolioSync(sync);
  if (!portfolioSync || !Array.isArray(baseData.experience)) return baseData;

  const experience = baseData.experience.map((role) => {
    const override = portfolioSync.experience.find((item) => item.role === role.role && item.org === role.org);
    if (!override || !Array.isArray(override.generated_bullets) || override.generated_bullets.length === 0) {
      return role;
    }
    const generated = override.generated_bullets.filter((bullet) => !role.bullets.includes(bullet));
    if (generated.length === 0) return role;
    return { ...role, bullets: [...role.bullets, ...generated] };
  });

  return { ...baseData, experience, portfolioSync };
}

// LinkedIn data is only trusted when the sync validated; a failed or stale
// fetch leaves `sync_status !== "ok"` and the hand-authored link stands.
function normalizeLinkedInSync(sync) {
  if (!sync || !sync.meta || sync.meta.sync_status !== "ok") return null;
  if (!sync.profile || (!sync.profile.headline_short && !sync.profile.about_short)) return null;
  return sync;
}

function buildData() {
  const base = mergePortfolioSyncIntoSite(window.SITE, window.PORTFOLIO_SYNC);
  const linkedin = normalizeLinkedInSync(window.LINKEDIN_SYNC);
  if (!linkedin) return { ...base, linkedin: null };

  // Keep the canonical profile URL in sync with whatever the bot last validated.
  const links = (base.links || []).map((link) =>
    link.label === "LinkedIn" && linkedin.profile.profile_url
      ? { ...link, url: linkedin.profile.profile_url }
      : link
  );
  return { ...base, links, linkedin };
}

// Seven sections, each answering one question. Talks and teaching share a
// section (three tiles between them), and the LinkedIn snapshot is no longer
// a section of its own: it repeated the hero and the experience bullets. The
// sync still feeds the canonical LinkedIn URL in buildData().
const ALL_SECTIONS = [
  ["experience", "Experience"],
  ["projects", "Projects"],
  ["publications", "Publications"],
  ["skills", "Skills"],
  ["code", "Code"],
  ["talks", "Talks & Teaching"],
  ["contact", "Contact"],
];

// ── Progressive disclosure ──────────────────────────────────────────────────
// Every section shows a first layer that reads in a few seconds; the rest is
// one deliberate click away (a card's overlay, or a "show more" toggle).
// Project index filters, in display order. Every project carries at least one
// theme (see `themes` in data.js), so each chip returns a real subset.
const THEMES = ["Survey & public data", "Machine learning", "Stats & forecasting", "Environment & civil", "Sports"];
// Tools a skill tile lists before "+N"; the lead tile always shows its full set.
const TOOL_PEEK = 5;
// Repositories shown before "Show more".
const REPO_PEEK = 4;

// Hyphenated compounds ("AI-enabled") must not break at the hyphen: a balanced
// display headline otherwise strands "AI-" at the end of one line. Wrapping
// the whole word in a no-wrap span keeps the text selectable and searchable.
function keepHyphenated(text) {
  return String(text || "").split(/(\S+-\S+)/).map((part, i) =>
    i % 2 ? <span className="nowrap" key={i}>{part}</span> : part);
}

const FACTS = [
  "129,572 U.S. census tracts analyzed — every tract in the country — for broadband completeness.",
  "DistilBERT reached 91.6% accuracy on 1.1M+ EV sentiment posts presented at AAPOR 2025.",
  "LEXNet: 97% smaller, 93% faster inference, +4% accuracy over the baseline CNN.",
  "Voice gender recognition hit 98.3% accuracy — 11 misclassifications on the held-out test.",
  "€38bn football transfer market modeled over 7,023 player-season observations; 78% of player-level variance explained.",
  "A two-day blood drive: 60+ volunteers, 1,000+ donor records, 844 successful donations.",
  "+0.57 systematic positive bias found in LLM sentiment vs Reddit data, F(2,549)=28.43, p<0.001.",
];

// ── App ─────────────────────────────────────────────────────────────────────
class Portfolio extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      theme: "dark",
      scrolled: false,
      active: "home",
      ind: { x: 0, w: 0, ready: false },
      filter: "All",
      expanded: null,
      menuOpen: false,
      fadeL: false,
      fadeR: false,
      ovFrom: "none",
      ovClosing: false,
      buddyOpen: false,
      buddyInput: "",
      buddyMsgs: [],
      factIdx: 0,
      skillsIn: false,
      indexOpen: false,
      toolsOpen: false,
      reposOpen: false,
    };
    this.navRefs = {};
    this.timers = [];
    this.goCache = {};
    this.scrollerRef = React.createRef();
    this.closeRef = React.createRef();
    this.msgsRef = React.createRef();
    this.fillRef = React.createRef();
    this.typedRef = React.createRef();
    this.metricRefs = [];
    this._ep = -1;
    this.reduced = false;
  }

  // ── lifecycle ─────────────────────────────────────────────────────────────
  componentDidMount() {
    this.motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reduced = this.motionMq.matches;
    this.motionMq.addEventListener("change", this.onMotionChange);
    this.setState({ theme: document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark" });

    this.osMq = window.matchMedia("(prefers-color-scheme: light)");
    this.onOS = (e) => {
      let stored = null;
      try { stored = localStorage.getItem("theme"); } catch (err) { /* storage blocked */ }
      if (stored !== "light" && stored !== "dark") this.applyTheme(e.matches ? "light" : "dark", false);
    };
    this.osMq.addEventListener("change", this.onOS);

    window.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("resize", this.measureNav, { passive: true });
    window.addEventListener("hashchange", this.onHashChange);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    this.onScroll();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.onScroll());

    const mainEl = document.querySelector("main");
    if (mainEl && window.ResizeObserver) {
      this.ro = new ResizeObserver(() => this.onScroll());
      this.ro.observe(mainEl);
    }

    this.io = window.IntersectionObserver ? new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      this.reveal(entry.target);
    }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }) : null;
    this.observeAll();
    // Any DOM change at all re-runs observeAll, which walks the document. Wait
    // for the frame to settle so one render is one walk, not one per mutation.
    this.mo = new MutationObserver(() => {
      if (this._obsRaf) return;
      this._obsRaf = requestAnimationFrame(() => { this._obsRaf = 0; if (!this.dead) this.observeAll(); });
    });
    this.mo.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("keydown", this.onKey);
    document.addEventListener("click", this.onDocClick);

    this.startTyper();
    this.countUp();
    this.mountScenes(0);
    this.timers.push(setTimeout(this.measureNav, 60));
    this.timers.push(setTimeout(this.sweepReveals, 900));
    this.timers.push(setTimeout(this.onHashChange, 0));
  }

  componentDidUpdate() {
    if (this.dead) return;
    if (this._lastActive !== this.state.active) {
      this._lastActive = this.state.active;
      this.measureNav();
    }
  }

  componentWillUnmount() {
    this.dead = true;
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("resize", this.measureNav);
    window.removeEventListener("hashchange", this.onHashChange);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    window.removeEventListener("keydown", this.onKey);
    document.removeEventListener("click", this.onDocClick);
    if (this.osMq) this.osMq.removeEventListener("change", this.onOS);
    if (this.motionMq) this.motionMq.removeEventListener("change", this.onMotionChange);
    this.timers.forEach(clearTimeout);
    this.timers = [];
    clearTimeout(this._sweepT);
    clearTimeout(this._typeT);
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this._scrollRaf) cancelAnimationFrame(this._scrollRaf);
    if (this._obsRaf) cancelAnimationFrame(this._obsRaf);
    if (this.io) this.io.disconnect();
    if (this.mo) this.mo.disconnect();
    if (this.ro) this.ro.disconnect();
    if (this.state.expanded) document.body.style.overflow = this.bodyOverflow || "";
    if (window.Explainers3D) window.Explainers3D.dispose();
  }

  // ── 3D explainer scenes ───────────────────────────────────────────────────
  // explainers-3d.js loads as a module and may land after React mounts, so
  // poll briefly rather than racing it.
  mountScenes(tries) {
    if (this.dead) return;
    if (window.Explainers3D) { window.Explainers3D.mount(); return; }
    if (tries > 30) return;
    this.timers.push(setTimeout(() => this.mountScenes(tries + 1), 120));
  }

  // ── scroll / nav ──────────────────────────────────────────────────────────
  // Scroll events outrun frames on a high-refresh trackpad, and this handler
  // reads ten rects. Doing that per event -- with a setState in between to
  // invalidate layout -- makes every read a fresh forced reflow. Coalescing
  // onto one rAF caps it at one measurement per frame and puts the reads
  // before any write, so the browser answers them from a layout it already has.
  onScroll = () => {
    if (this.dead || this._scrollRaf) return;
    this._scrollRaf = requestAnimationFrame(this.readScroll);
  };

  readScroll = () => {
    this._scrollRaf = 0;
    if (this.dead) return;
    clearTimeout(this._sweepT);
    this._sweepT = setTimeout(this.sweepReveals, 140);
    const probe = window.innerHeight * 0.38;
    let cur = "home";
    for (const [id] of this.sections) {
      const el = document.getElementById(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      // height > 1 rejects sections that have not been laid out yet: before
      // first layout every rect is 0-high at top 0, which would otherwise
      // match all nine and latch the last one.
      if (r.height > 1 && r.top <= probe) cur = id;
    }
    const scrolled = window.scrollY > 40;

    // The rail fill only ever feeds one custom property on one node. Routing
    // it through state re-rendered the whole app for each 0.4% of travel --
    // a few hundred renders per pass down the timeline. Writing the variable
    // directly keeps the fill smooth and costs no React work at all.
    const tl = document.getElementById("exp-timeline");
    const fill = this.fillRef.current;
    if (tl && fill) {
      const r = tl.getBoundingClientRect();
      const ep = Math.min(1, Math.max(0, (window.innerHeight * 0.62 - r.top) / Math.max(1, r.height)));
      if (Math.abs(ep - this._ep) > 0.002) {
        this._ep = ep;
        fill.style.setProperty("--fill", String(ep));
      }
    }

    if (cur !== this.state.active || scrolled !== this.state.scrolled) {
      this.setState({ active: cur, scrolled });
    }
  };

  measureNav = () => {
    if (this.dead) return;
    this.readNavEdges();
    const ref = this.navRefs[this.state.active];
    const el = ref && ref.current;
    if (!el) {
      if (this.state.ind.ready) this.setState({ ind: { x: 0, w: 0, ready: false } });
      return;
    }
    const x = el.offsetLeft;
    const w = el.offsetWidth;
    if (x !== this.state.ind.x || w !== this.state.ind.w || !this.state.ind.ready) {
      this.setState({ ind: { x, w, ready: true } });
    }
    const sc = this.scrollerRef.current;
    if (sc && sc.scrollWidth > sc.clientWidth + 2) {
      const target = Math.max(0, Math.min(sc.scrollWidth - sc.clientWidth, x + w / 2 - sc.clientWidth / 2));
      if (Math.abs(sc.scrollLeft - target) > 6) sc.scrollLeft = target;
    }
    this.readNavEdges();
  };

  readNavEdges = () => {
    if (this.dead) return;
    const sc = this.scrollerRef.current;
    if (!sc) return;
    const overflow = sc.scrollWidth > sc.clientWidth + 2;
    const left = overflow && sc.scrollLeft > 4;
    const right = overflow && sc.scrollLeft < sc.scrollWidth - sc.clientWidth - 4;
    if (left !== this.state.fadeL || right !== this.state.fadeR) this.setState({ fadeL: left, fadeR: right });
  };

  reveal(el) {
    if (!el || el.getAttribute("data-in") === "1") return;
    el.setAttribute("data-in", "1");
    if (el.id === "skills-grid" && !this.state.skillsIn) this.setState({ skillsIn: true });
    if (this.io) this.io.unobserve(el);
  }

  /* IntersectionObserver only reports threshold *crossings*, and it samples at
     rendering opportunities. Scroll fast enough -- a trackpad flick, a held
     Page Down, a jump to a far section -- and an element can sit below the
     viewport at one sample and above it at the next, crossing nothing. No
     entry ever fires, so it stays at opacity 0 and the visitor scrolls back to
     a blank stretch of page.

     So the observer keeps driving the animation, and this catches the rest:
     debounced past the end of a scroll, anything still hidden whose top has
     already gone by is revealed outright. */
  sweepReveals = () => {
    if (this.dead) return;
    const cutoff = window.innerHeight;
    // Measure every candidate before revealing any of them. reveal() sets an
    // attribute the reveal transition keys off, so a read/write/read/write walk
    // made the browser re-lay-out the page between each element -- worst on
    // first load, when the whole page is still waiting to come in.
    const pending = [];
    document.querySelectorAll("[data-reveal]:not([data-in])").forEach((el) => {
      if (el.getBoundingClientRect().top < cutoff) pending.push(el);
    });
    pending.forEach((el) => this.reveal(el));
  };

  observeAll() {
    document.querySelectorAll("[data-reveal]:not([data-in]):not([data-obs])").forEach((el) => {
      el.setAttribute("data-obs", "1");
      if (!this.io || this.reduced) this.reveal(el);
      else this.io.observe(el);
    });
  }

  go(id) {
    return this.goCache[id] || (this.goCache[id] = (event) => {
      if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
      const el = document.getElementById(id);
      if (!el) return;
      if (event) event.preventDefault();
      if (window.location.hash !== "#" + id) window.history.pushState(null, "", "#" + id);
      const top = el.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top, behavior: this.reduced ? "auto" : "smooth" });
    });
  }

  onHashChange = () => {
    if (this.dead || !window.location.hash) return;
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (e) { return; }
    const target = document.getElementById(id);
    if (!target) return;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 84, behavior: "auto" });
    this.sweepReveals();
  };

  onKey = (e) => {
    if (e.key === "Tab" && this.state.expanded) {
      const dialog = document.querySelector(".overlay__dialog");
      const items = dialog ? Array.from(dialog.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), [tabindex='0']")) : [];
      const first = items[0], last = items[items.length - 1];
      if (first && ((e.shiftKey && document.activeElement === first) || (!e.shiftKey && document.activeElement === last) || !dialog.contains(document.activeElement))) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
      return;
    }
    if (e.key !== "Escape") return;
    if (this.state.expanded) this.closeExpanded();
    else if (this.state.menuOpen) this.setState({ menuOpen: false });
    else if (this.state.buddyOpen) this.setState({ buddyOpen: false });
  };

  onDocClick = (e) => {
    if (!this.state.menuOpen) return;
    const menu = document.querySelector(".nav__menu");
    if (menu && !menu.contains(e.target)) this.setState({ menuOpen: false });
  };

  // ── theme ─────────────────────────────────────────────────────────────────
  applyTheme(next, persist) {
    document.documentElement.setAttribute("data-theme", next);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", next === "light" ? "#f4f4f1" : "#0b0c11");
    if (persist) {
      try { localStorage.setItem("theme", next); } catch (e) { /* storage blocked */ }
    }
    this.setState({ theme: next });
  }

  // ── hero animations ───────────────────────────────────────────────────────
  onMotionChange = (event) => {
    this.reduced = event.matches;
    clearTimeout(this._typeT);
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.reduced) {
      document.querySelectorAll("[data-reveal]").forEach((el) => this.reveal(el));
      this.writeMetrics(1);
      this.setState({ skillsIn: true });
    }
    this.startTyper();
  };

  onVisibilityChange = () => {
    clearTimeout(this._typeT);
    if (document.hidden) {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.writeMetrics(1);
    } else this.startTyper();
  };

  startTyper() {
    clearTimeout(this._typeT);
    const words = (this.props.data.profile && this.props.data.profile.typingWords) || [];
    if (!words.length) return;
    if (this.reduced) { this.writeTyped(words[0]); return; }
    if (document.hidden) return;

    let idx = 0;
    let len = 0;
    let phase = "type";
    const step = () => {
      if (this.dead) return;
      const word = words[idx];
      let delay = 70;
      if (phase === "type") {
        len++;
        if (len >= word.length) { phase = "hold"; delay = 1700; }
      } else if (phase === "hold") {
        phase = "del";
        delay = 35;
      } else {
        len--;
        delay = 35;
        if (len <= 0) { phase = "type"; idx = (idx + 1) % words.length; delay = 300; }
      }
      this.writeTyped(word.slice(0, Math.max(0, len)));
      this._typeT = setTimeout(step, delay);
    };
    step();
  }

  // The typewriter ticks every 35-70ms for as long as the page is open. Held
  // in state that was a full re-render of all nine sections about twenty-five
  // times a second, forever, competing with scrolling for the same frames.
  // It is one text node; write it.
  writeTyped(text) {
    const el = this.typedRef.current;
    if (el) el.textContent = text;
  }

  writeMetrics(p) {
    const metrics = this.props.data.metrics || [];
    this.metricRefs.forEach((ref, i) => {
      const el = ref && ref.current;
      if (el && metrics[i]) el.textContent = this.fmtMetric(metrics[i].value, p);
    });
  }

  countUp() {
    if (this.reduced) { this.writeMetrics(1); return; }
    const t0 = performance.now() + 350;
    const dur = 1400;
    const tick = (now) => {
      if (this.dead) return;
      const p = Math.min(1, Math.max(0, (now - t0) / dur));
      this.writeMetrics(1 - Math.pow(1 - p, 3));
      if (p < 1) this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  fmtMetric(value, p) {
    const m = /^([\d.]+)(.*)$/.exec(value);
    if (!m) return value;
    const n = parseFloat(m[1]);
    const dec = (m[1].split(".")[1] || "").length;
    return (n * p).toFixed(dec) + m[2];
  }

  // ── FLIP expand / collapse ────────────────────────────────────────────────
  // The dialog animates out of the card that opened it: measure the trigger,
  // express it as a transform away from the dialog's resting position, and let
  // the ov-in keyframe run it back to zero.
  flipTransform(el) {
    if (!el || this.reduced) return "none";
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2 - window.innerWidth / 2;
    const cy = r.top + r.height / 2 - window.innerHeight / 2;
    const sc = Math.max(0.5, Math.min(1, r.width / Math.min(780, window.innerWidth * 0.9)));
    return "translate(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px) scale(" + sc.toFixed(3) + ")";
  }

  openExpanded(payload, ev) {
    const el = ev && ev.currentTarget;
    this.lastTrigger = el;
    this.bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    this.setState({ expanded: payload, ovFrom: this.flipTransform(el), ovClosing: false });
    this.timers.push(setTimeout(() => {
      if (this.closeRef.current) this.closeRef.current.focus();
    }, 60));
  }

  closeExpanded = () => {
    if (!this.state.expanded || this.state.ovClosing) return;
    const el = this.lastTrigger;
    this.setState({ ovFrom: this.flipTransform(el), ovClosing: true });
    this.timers.push(setTimeout(() => {
      document.body.style.overflow = this.bodyOverflow || "";
      this.setState({ expanded: null, ovClosing: false }, () => {
        if (el && el.focus) el.focus({ preventScroll: true });
      });
    }, this.reduced ? 0 : 420));
  };

  // ── research assistant ────────────────────────────────────────────────────
  answer(q) {
    const D = this.props.data;
    const t = q.toLowerCase();
    const rules = [
      [/talk|present|aapor|keynote/, "One so far \u2014 AAPOR\u2019s 80th, St. Louis, May 2025. I took the EV sentiment work there: 1.1M+ posts, DistilBERT at 91.6%, and the part people asked about most, where the LLMs were quietly biased. Full details under Talks & Teaching."],
      [/publicat|publish|paper|article|journal|conference|scholar|orcid/, "Two so far. A Springer article on keeping supply chains sustainable through disruption \u2014 fuzzy-AHP over 200+ experts, 2024 \u2014 and the AAPOR 2025 paper on EV sentiment, DistilBERT at 91.6% across 1.1M+ posts. Five more are working their way through the 2026 pipeline; ORCID has them."],
      [/skill|technolog|program|python|stack|pytorch/, "Strongest ground is survey and research methods (98%), then AI/ML (95%), core AI systems (91%) and programming (84%). Day to day that means Python and R, PyTorch and TensorFlow, Hugging Face and LangChain, on whichever of AWS, Azure or GCP the project lives."],
      [/educat|degree|university|gpa|bits|umd/, "An M.S. in Survey & Data Science from Maryland \u2014 3.814/4.0, and a JPSM Dean's Fellow in 2025\u201326. Before that, civil engineering at BITS Pilani with a data science minor, 3.327/4.0. The route here was not a straight line."],
      [/project|build|portfolio/, "Twenty of them. The ones I get asked about most: EV sentiment across 1.1M+ posts at 91.6%, football market value over 7,023 player-seasons, LEXNet squeezing a CNN down by 97%, and the broadband pipeline covering 129K census tracts. Open any card for how it actually went."],
      [/contact|email|reach|connect|phone/, "Email " + D.profile.email + " · LinkedIn, GitHub, Scholar and ORCID links are all in the Contact section. Based in " + D.profile.location + "."],
      [/github|repo|code|commit/, "44 public repositories, all at github.com/namo507. The ones worth starting with: AAPOR EV Sentiment, Project_Moneyball_FC, office-doc-redactor, live-meeting-copilot, and career-ops."],
      [/geospatial|census|broadband|michigan|epidemiol/, "That was Michigan\u2019s Institute for Social Research \u2014 a geospatial pipeline over 129,572 census tracts and 3 RUCA strata. It closed the broadband gaps completely, cut baseline missingness by 28.6%, and turned up rural inflection points that held at p < 0.01."],
      [/teach|course|student|surv735/, "I TA\u2019d SURV735, data privacy and confidentiality, for 23 graduate students at JPSM. Alongside it I rebuilt the Canvas setup 10+ instructors and 125+ students depend on \u2014 satisfaction up 30%, setup time down 40%."],
      [/award|fellow|achiev|honor/, "A JPSM Dean's Fellowship for 2025\u201326, first out of 180 in HRD at BITS Pilani, a top-ten finish in Water & Wastewater Treatment, and Microsoft\u2019s Azure AI Fundamentals along the way."],
      [/experience|job|role|position|current|now\b|work/, "Right now, Data Scientist II at the Institute for Mind and Brain in South Carolina \u2014 an analytics platform in React, TypeScript and Python, REDCap and clinical EHR pipelines feeding it, and PyTorch CNN-LSTM and Transformer models across 260 participants. Before that: SDSC at Maryland, Michigan\u2019s ISR, JPSM, Legistify, Accenture."],
      [/survey|methodolog|sampling|causal|measurement/, "That\u2019s the centre of it. Getting different sources to agree without quietly corrupting each other, checking quality without a human reading every row, drawing causal conclusions that survive scrutiny, and measuring people without exposing them."],
      [/hello|hi\b|hey|who are you|what can you do/, "Hello. Ask me about the papers, the projects, the skills, where I\u2019ve worked, what I\u2019ve taught, or how to reach me. I only answer from what\u2019s already on this page \u2014 nothing invented."],
    ];
    for (const [re, out] of rules) if (re.test(t)) return out;
    return "Not sure I follow \u2014 try me on the papers, the projects, the skills, the roles, the teaching, or how to get in touch. Short version: Namit is a Data Scientist II at the Institute for Mind and Brain in South Carolina, with a survey and data science master's from Maryland. Twenty projects, two papers, 44 repositories.";
  }

  sendBuddy = () => {
    const q = this.state.buddyInput.trim();
    if (!q) return;
    const msgs = this.state.buddyMsgs.concat([
      { role: "user", content: q },
      { role: "assistant", content: this.answer(q) },
    ]);
    this.setState({ buddyMsgs: msgs, buddyInput: "" });
    this.timers.push(setTimeout(() => {
      const el = this.msgsRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 60));
  };

  // ── render helpers ────────────────────────────────────────────────────────
  navRef(id) {
    return this.navRefs[id] || (this.navRefs[id] = React.createRef());
  }

  get sections() {
    return ALL_SECTIONS;
  }

  toggle(key) {
    return this.goCache["toggle:" + key] || (this.goCache["toggle:" + key] = () => {
      this.setState((st) => ({ [key]: !st[key] }));
    });
  }

  // One overlay payload for a project, whether it was opened from a finding,
  // a featured tile, or a row of the full index. A finding adds its headline
  // number to the record so the overlay keeps the hook that was clicked.
  openProject(p, ev, finding) {
    this.openExpanded({
      kicker: "Project " + p.id + " · " + p.type,
      title: p.title,
      subtitle: p.date + " · " + p.venue,
      body: p.excerpt,
      stats: finding ? [{ v: finding.value, k: finding.label }] : [],
      hasStats: !!finding,
      tags: p.tags,
      hasTags: true,
      url: p.url,
      urlLabel: p.url.includes("github.com") ? "Open repository ↗" : "Open writeup ↗",
    }, ev);
  }

  renderNav(profile) {
    const { active, scrolled, menuOpen, ind, fadeL, fadeR, theme } = this.state;
    const dark = theme === "dark";
    const activeLabel = (this.sections.find(([id]) => id === active) || [null, "Sections"])[1];
    const mask = fadeL || fadeR
      ? "linear-gradient(90deg, " + (fadeL ? "transparent 0, #000 22px" : "#000 0") + ", " +
        (fadeR ? "#000 calc(100% - 22px), transparent 100%" : "#000 100%") + ")"
      : "none";

    return (
      <header className="nav-wrap" inert={this.state.expanded ? "" : undefined} aria-hidden={this.state.expanded ? "true" : undefined}>
        <nav className="nav" aria-label="Primary" data-scrolled={scrolled ? "1" : undefined}>
          <a
            className="nav__brand"
            href="#home"
            onClick={this.go("home")}
            aria-label="Back to top"
          >
            <img
              className="nav__avatar"
              src={profile.avatarUrl}
              alt=""
              width="30"
              height="30"
              loading="eager"
              /* fetchpriority stays lowercase: React 18 forwards unknown
                 lowercase attributes to the DOM silently; the camelCase form
                 is only recognized from React 19 onward. */
              fetchpriority="high"
            />
            <span className="nav__name" data-hide-mobile="1">{profile.name}</span>
          </a>

          <div className="nav__menu">
            <button
              className="nav__menu-btn"
              onClick={(e) => { e.stopPropagation(); this.setState({ menuOpen: !menuOpen }); }}
              aria-expanded={menuOpen ? "true" : "false"}
              aria-controls="section-menu"
            >
              <span>{active === "home" ? "Sections" : activeLabel}</span>
              <span className="nav__caret" aria-hidden="true" style={{ transform: "rotate(" + (menuOpen ? 180 : 0) + "deg)" }}>▼</span>
            </button>
            {menuOpen ? (
              <div className="nav__menu-pop" id="section-menu">
                {this.sections.map(([id, label], i) => (
                  <a
                    key={id}
                    className="nav__menu-item"
                    href={"#" + id}
                    aria-current={active === id ? "true" : undefined}
                    onClick={(event) => { this.setState({ menuOpen: false }); this.go(id)(event); }}
                  >
                    <span>{label}</span>
                    <span className="nav__menu-num" aria-hidden="true">{"0" + (i + 1)}</span>
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div
            className="nav__row"
            ref={this.scrollerRef}
            onScroll={this.readNavEdges}
            style={{ WebkitMaskImage: mask, maskImage: mask }}
          >
            <span
              className="nav__ind"
              aria-hidden="true"
              style={{
                width: ind.w + "px",
                transform: "translateX(" + ind.x + "px)",
                opacity: ind.ready ? 1 : 0,
              }}
            />
            {this.sections.map(([id, label]) => (
              <a
                key={id}
                className="nav__link"
                ref={this.navRef(id)}
                href={"#" + id}
                onClick={this.go(id)}
                aria-current={active === id ? "true" : undefined}
              >{label}</a>
            ))}
          </div>

          <div className="nav__actions">
            <button
              className="theme-toggle"
              onClick={() => this.applyTheme(dark ? "light" : "dark", true)}
              aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
              title={dark ? "Switch to light theme" : "Switch to dark theme"}
            >
              <span aria-hidden="true">{dark ? "☀" : "☾"}</span>
            </button>
            <a className="btn btn--primary nav__cta" href={profile.pdfUrl} target="_blank" rel="noopener">CV ↗</a>
          </div>
        </nav>
      </header>
    );
  }

  renderHead(num, eyebrow, title, lead, scene) {
    return (
      <div className="sec__head" data-reveal="1">
        <div>
          <p className="eyebrow">{num} — {eyebrow}</p>
          <h2 className="sec__title">{title}</h2>
          {lead ? <p className="sec__lead">{lead}</p> : null}
        </div>
        <div className="scene" data-scene={scene} aria-hidden="true" />
      </div>
    );
  }

  render() {
    const D = this.props.data;
    const P = D.profile;
    const s = this.state;

    const findings = (D.findings || [])
      .map((f) => ({ f, p: D.projects.find((x) => x.id === f.project) }))
      .filter((x) => x.p);
    const featured = D.projects.filter((p) => p.featured).sort((a, b) => a.featured - b.featured);
    const themes = ["All"].concat(THEMES);
    const visible = s.filter === "All" ? D.projects : D.projects.filter((p) => (p.themes || []).includes(s.filter));
    const repos = s.reposOpen ? D.github.featured : D.github.featured.slice(0, REPO_PEEK);
    const hiddenTools = D.skills.slice(1).reduce((n, k) => n + Math.max(0, k.tools.length - TOOL_PEEK), 0);
    const langTotal = D.github.languageMix.reduce((a, l) => a + l.count, 0);
    const langFill = s.active === "code" || s.skillsIn ? 1 : 0;
    const ov = s.expanded;

    return (
      <React.Fragment>
        {this.renderNav(P)}

        <main id="content" tabIndex="-1" inert={ov ? "" : undefined} aria-hidden={ov ? "true" : undefined}>
          {/* ── Home ───────────────────────────────────────────────────── */}
          <section id="home" className="sec sec--home">
            <div className="hero">
              <div data-reveal="1" data-in="1">
                <p className="eyebrow">{P.eyebrow}</p>
                <p className="hero__typed" role="status" aria-live="polite" aria-label={"Currently building " + P.typingWords.join(", ") + "."}>
                  <span aria-hidden="true">Currently building <b ref={this.typedRef} /></span>
                  <span className="caret" aria-hidden="true" />
                </p>
                <h1 className="hero__title">{keepHyphenated(P.headline)}</h1>
                <p className="hero__summary">{P.summary}</p>
                <div className="btn-row hero__actions">
                  <a className="btn btn--primary" href="#experience" onClick={this.go("experience")}>View experience →</a>
                  <a className="btn" href="#projects" onClick={this.go("projects")}>Selected work</a>
                  <a className="btn" href={D.github.profileUrl} target="_blank" rel="noopener">GitHub ↗</a>
                </div>
                <div className="hero__metrics">
                  {D.metrics.map((m, i) => (
                    <div key={m.label}>
                      <div className="metric__v" role="img" aria-label={m.value}><span aria-hidden="true" ref={this.metricRefs[i] || (this.metricRefs[i] = React.createRef())}>{this.fmtMetric(m.value, 0)}</span></div>
                      <div className="metric__k">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hero__visual">
                <div className="scene hero__scene" data-scene="globe" data-scene-zoom="1.45" aria-hidden="true" />
                <figure className="portrait">
                  <img src={P.avatarUrl} alt={"Portrait of " + P.name} />
                  <figcaption className="portrait__cap">
                    <div className="portrait__role">{P.role}</div>
                    <div className="portrait__loc">{P.location}</div>
                  </figcaption>
                </figure>
              </div>
            </div>
            {/* Signature findings: the hook layer. One result per domain, each
                opening the full project record. Replaces the interests pill row,
                which restated the eyebrow and the skills section. */}
            {findings.length ? (
              <div className="findings" data-reveal="1">
                <div className="findings__head">
                  <p className="mono-meta">Signature findings</p>
                  <p className="findings__hint">Tap any to open</p>
                </div>
                <div className="findings__grid">
                  {findings.map(({ f, p }) => (
                    <button
                      key={f.project}
                      className="card finding"
                      aria-haspopup="dialog"
                      onClick={(ev) => this.openProject(p, ev, f)}
                    >
                      <span className="finding__src">{f.source}</span>
                      <span className="finding__v">{f.value}</span>
                      <span className="finding__k">{f.label}</span>
                      <span className="finding__hook">{f.hook}</span>
                      <span className="card__go" aria-hidden="true">→</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {/* ── Experience ─────────────────────────────────────────────── */}
          <section id="experience" className="sec">
            {this.renderHead("01", "Experience",
              "From a volunteer registry to an NIH infant cohort.",
              "Seven roles, two countries, one job underneath: make data somebody has to trust worth trusting.",
              "helix")}
            <div id="exp-timeline" className="exp">
              <div className="exp__rail" aria-hidden="true" />
              <div className="exp__rail exp__rail--fill" ref={this.fillRef} aria-hidden="true" style={{ "--fill": 0 }} />
              {D.experience.map((r) => (
                <div className="exp__row" data-reveal="1" key={r.org + r.role}>
                  <div className="exp__aside">
                    <span className={"exp__dot" + (r.current ? " exp__dot--current" : "")} aria-hidden="true" />
                    <div className="exp__meta" data-hide-mobile="1">{r.dates}<br /><span className="exp__loc">{r.location}</span></div>
                  </div>
                  <button
                    className="card card--exp"
                    aria-haspopup="dialog"
                    onClick={(ev) => this.openExpanded({
                      kicker: r.dates + " · " + r.location,
                      title: r.role,
                      subtitle: r.org,
                      body: r.bullets[0],
                      bullets: r.bullets.slice(1),
                      hasBullets: r.bullets.length > 1,
                    }, ev)}
                  >
                    {/* Dates live in the timeline gutter on desktop; this copy
                        only shows on phones, where the gutter is hidden. */}
                    <p className="exp__when">{r.dates} · {r.location}</p>
                    <div className="exp__who">
                      <div className="exp__title-row">
                        <h3 className="card__title">{r.role}</h3>
                        {r.current ? <span className="badge">Current</span> : null}
                      </div>
                      <p className="card__org">{r.org}</p>
                    </div>
                    <p className="exp__hook">{r.hook || r.bullets[0]}</p>
                    <span className="card__go" aria-hidden="true">→</span>
                  </button>
                </div>
              ))}
            </div>

            {D.education && D.education.length ? (
              <div className="edu" data-reveal="1">
                <p className="mono-meta">Education</p>
                <div className="edu__grid">
                  {D.education.map((e) => (
                    <div className="card card--edu" key={e.institution}>
                      <p className="card__meta">{e.dates} · {e.location}</p>
                      <h3 className="card__title">{e.degree}</h3>
                      <p className="card__org">{e.institution}</p>
                      <div className="card__foot">
                        {(e.highlights || []).map((h) => <span className="tag" key={h}>{h}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {/* ── Projects ───────────────────────────────────────────────── */}
          <section id="projects" className="sec">
            {this.renderHead("02", "Selected work",
              "Twenty projects, and what each one actually took.",
              "Six to open first. The full index, filterable by theme, sits underneath.",
              "lattice")}
            {/* Layer 1: six featured tiles — a count that divides evenly into
                3, 2 and 1 columns, so no breakpoint leaves an orphan tile. */}
            <div className="project-grid">
              {featured.map((p) => (
                <button
                  key={p.id}
                  className="card card--project"
                  data-reveal="1"
                  aria-haspopup="dialog"
                  onClick={(ev) => this.openProject(p, ev)}
                >
                  <div className="card__head">
                    <span className="card__type">{p.type}</span>
                    <span>{p.date}</span>
                  </div>
                  <h3 className="card__title">{p.title}</h3>
                  <p className="card__excerpt">{p.hook || p.excerpt}</p>
                  <div className="card__foot">
                    {p.tags.slice(0, 2).map((tg) => <span className="tag" key={tg}>{tg}</span>)}
                    <span className="card__go" aria-hidden="true">→</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Layer 2: the complete index — compact rows instead of twenty
                tiles, collapsed until asked for. */}
            <div className="disclose-row" data-reveal="1">
              <button
                className="disclose"
                aria-expanded={s.indexOpen ? "true" : "false"}
                aria-controls="project-index"
                onClick={this.toggle("indexOpen")}
              >
                {s.indexOpen ? "Close the index" : "Browse all " + D.projects.length + " projects"}
                <span className="disclose__chev" aria-hidden="true">▾</span>
              </button>
            </div>
            <div id="project-index" className="proj-index" hidden={!s.indexOpen}>
              <div className="filters" role="group" aria-label="Filter projects">
                {themes.map((t) => (
                  <button
                    key={t}
                    className="filter"
                    aria-pressed={s.filter === t ? "true" : "false"}
                    onClick={() => this.setState({ filter: t })}
                  >{t}</button>
                ))}
              </div>
              <p className="filter-count" aria-live="polite">
                {visible.length} {visible.length === 1 ? "project" : "projects"}{s.filter === "All" ? "" : " · " + s.filter}
              </p>
              <ul className="proj-index__list">
                {visible.map((p) => (
                  <li key={p.id}>
                    <button className="proj-row" aria-haspopup="dialog" onClick={(ev) => this.openProject(p, ev)}>
                      <span className="proj-row__num">{p.id}</span>
                      <span className="proj-row__title">{p.title}</span>
                      <span className="proj-row__meta">{p.type} · {p.date}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ── Publications ───────────────────────────────────────────── */}
          <section id="publications" className="sec">
            {this.renderHead("03", "Research output",
              "Two published papers, five more in the pipeline.",
              null,
              "stack")}
            <div className="pub-grid">
              {D.publications.map((p) => (
                <button
                  key={p.title}
                  className="card card--pub"
                  data-reveal="1"
                  aria-haspopup="dialog"
                  onClick={(ev) => this.openExpanded({
                    kicker: p.category + " · " + p.date,
                    title: p.title,
                    subtitle: p.venue,
                    body: p.excerpt,
                    stats: p.stats,
                    hasStats: true,
                    bullets: [p.citation],
                    hasBullets: true,
                    url: p.url,
                    urlLabel: "Read paper ↗",
                  }, ev)}
                >
                  <div className="mono-meta">{p.category} · {p.date}</div>
                  <h3 className="card__title">{p.title}</h3>
                  <p className="card__venue">{p.venue}</p>
                  <p className="card__body">{p.hook || p.excerpt}</p>
                  <div className="stat-row">
                    {p.stats.map((st) => (
                      <div className="stat" key={st.k}>
                        <div className="stat__v">{st.v}</div>
                        <div className="stat__k">{st.k}</div>
                      </div>
                    ))}
                  </div>
                  <div className="card__cite">
                    <span>{p.citation}</span>
                    <span className="card__go" aria-hidden="true">→</span>
                  </div>
                </button>
              ))}
            </div>

            {/* The 2026 pipeline is real but secondary: one line until opened. */}
            <details className="fold wip" data-reveal="1">
              <summary>
                <span className="mono-meta">2026 pipeline · {D.worksInProgress.length} works in progress</span>
                <span className="fold__chev" aria-hidden="true">▾</span>
              </summary>
              <ul className="wip__list">
                {D.worksInProgress.map((w) => (
                  <li className="wip__row" key={w.title}>
                    <span style={{ textWrap: "pretty" }}>{w.title}</span>
                    <span className="wip__kind">{w.kind} · {w.year}</span>
                  </li>
                ))}
              </ul>
            </details>

            <div className="btn-row pub-links" data-reveal="1">
              <a className="btn btn--primary" href="https://scholar.google.com/citations?user=7bvTB-sAAAAJ&hl=en" target="_blank" rel="noopener">Google Scholar ↗</a>
              <a className="btn" href="https://orcid.org/0009-0005-7920-8350" target="_blank" rel="noopener">ORCID ↗</a>
            </div>
          </section>

          {/* ── Skills ─────────────────────────────────────────────────── */}
          <section id="skills" className="sec">
            {this.renderHead("04", "Technical skills",
              "Methods first. The stack is just how they ship.",
              "Scored by depth of real use, not familiarity.",
              "rings")}
            {/* The lead group spans the full row; the six behind it divide
                evenly into 3, 2 and 1 columns. Each tile shows its first few
                tools, and one toggle opens the full toolkit everywhere. */}
            <div id="skills-grid" className="skill-grid" data-reveal="1">
              {D.skills.map((k, i) => {
                const lead = i === 0;
                const tools = lead || s.toolsOpen ? k.tools : k.tools.slice(0, TOOL_PEEK);
                const more = k.tools.length - tools.length;
                return (
                  <div className={"skill" + (lead ? " skill--lead" : "")} key={k.name}>
                    <div className="skill__info">
                      <div className="skill__head">
                        <div>
                          <div className="mono-meta">{k.tier}</div>
                          <h3 className="skill__name">{k.name}</h3>
                        </div>
                        <div className={"skill__score" + (k.featured ? " skill__score--featured" : "")}>{k.score}%</div>
                      </div>
                      <p className="skill__summary">{k.summary}</p>
                      <div className="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={k.score} aria-label={k.name}>
                        <div className="meter__fill" style={{ "--fill": s.skillsIn || this.reduced ? k.score / 100 : 0, "--delay": (i * 70) + "ms" }} />
                      </div>
                    </div>
                    <div className="skill__tools">
                      {tools.map((t) => <span className="tag" key={t}>{t}</span>)}
                      {more > 0 ? <span className="tag tag--more">+{more}</span> : null}
                    </div>
                  </div>
                );
              })}
            </div>
            {hiddenTools > 0 ? (
              <div className="disclose-row">
                <button
                  className="disclose"
                  aria-expanded={s.toolsOpen ? "true" : "false"}
                  aria-controls="skills-grid"
                  onClick={this.toggle("toolsOpen")}
                >
                  {s.toolsOpen ? "Show fewer tools" : "Show the full toolkit (+" + hiddenTools + ")"}
                  <span className="disclose__chev" aria-hidden="true">▾</span>
                </button>
              </div>
            ) : null}
          </section>

          {/* ── Code ───────────────────────────────────────────────────── */}
          <section id="code" className="sec">
            {this.renderHead("05", "Code portfolio",
              "Open code, from research pipelines to production tools.",
              null,
              "cubes")}
            <div className="gh-panels" data-reveal="1">
              <div className="panel">
                <p className="mono-meta">GitHub · namo507</p>
                <div className="gh-stats">
                  {D.github.stats.slice(0, 2).map((g) => (
                    <div className="gh-stat" key={g.k}>
                      <div className="metric__v">{g.v}</div>
                      <div className="metric__k">{g.k}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <p className="mono-meta">Language mix · {langTotal} tagged repos</p>
                <div className="langbar" aria-hidden="true">
                  {D.github.languageMix.map((l, i) => (
                    <div
                      className="langbar__seg"
                      key={l.lang}
                      style={{
                        "--pct": ((l.count / langTotal) * 100) + "%",
                        "--op": (1 - i * 0.11).toFixed(2),
                        "--fill": langFill,
                        "--delay": (i * 60) + "ms",
                      }}
                    />
                  ))}
                </div>
                <ul className="langlist">
                  {D.github.languageMix.map((l, i) => (
                    <li key={l.lang}>
                      <span className="langlist__swatch" aria-hidden="true" style={{ "--op": (1 - i * 0.11).toFixed(2) }} />
                      {l.lang} <span className="langlist__count">{l.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div id="repo-grid" className="repo-grid">
              {repos.map((r) => (
                <button
                  key={r.name}
                  className="card repo"
                  data-reveal="1"
                  aria-haspopup="dialog"
                  onClick={(ev) => this.openExpanded({
                    kicker: r.lang + " · repository",
                    title: r.name,
                    subtitle: r.metric + " " + r.metricLabel,
                    body: r.desc,
                    url: r.url,
                    urlLabel: "Open on GitHub ↗",
                  }, ev)}
                >
                  <div className="repo__head">
                    <span className="repo__lang">{r.lang}</span>
                  </div>
                  <h3 className="repo__name">{r.name}</h3>
                  <p className="repo__desc">{r.desc}</p>
                  <div className="card__foot">
                    <span className="repo__metric">{r.metric} <span>{r.metricLabel}</span></span>
                    <span className="card__go" aria-hidden="true">→</span>
                  </div>
                </button>
              ))}
            </div>
            {D.github.featured.length > REPO_PEEK ? (
              <div className="disclose-row">
                <button
                  className="disclose"
                  aria-expanded={s.reposOpen ? "true" : "false"}
                  aria-controls="repo-grid"
                  onClick={this.toggle("reposOpen")}
                >
                  {s.reposOpen ? "Show fewer repositories" : "Show " + (D.github.featured.length - REPO_PEEK) + " more repositories"}
                  <span className="disclose__chev" aria-hidden="true">▾</span>
                </button>
              </div>
            ) : null}

            <details className="fold recent" data-reveal="1">
              <summary>
                <span className="mono-meta">Recently pushed · {D.github.recent.length} repositories</span>
                <span className="fold__chev" aria-hidden="true">▾</span>
              </summary>
              <ul>
                {D.github.recent.map((r) => (
                  <li key={r.name}>
                    <a href={r.url} target="_blank" rel="noopener">
                      <span className="recent__name">{r.name}</span>
                      <span className="recent__lang">{r.lang}</span>
                      <span className="recent__updated">{r.updated}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </section>

          {/* ── Talks & teaching ───────────────────────────────────────── */}
          {/* One section, three equal tiles. The first teaching tile keeps the
              old #teaching anchor so existing deep links still land. */}
          <section id="talks" className="sec">
            {this.renderHead("06", "Talks & teaching",
              "Explaining the method, not just the result.",
              null,
              "wave")}
            <div className="card-grid-340">
              {D.talks.map((t) => (
                <a className="card card--talk" href={t.url} target="_blank" rel="noopener" data-reveal="1" key={t.title}>
                  <div className="mono-meta">Talk · {t.date}</div>
                  <h3 className="card__title">{t.title}</h3>
                  <p className="card__venue">{t.venue} · {t.location}</p>
                  <p className="card__body">{t.excerpt}</p>
                  <div className="card__foot">
                    <span className="card__cta">Conference page ↗</span>
                  </div>
                </a>
              ))}
              {D.teaching.map((t, i) => (
                <div className="card card--teach" id={i === 0 ? "teaching" : undefined} data-reveal="1" key={t.title}>
                  <div className="mono-meta">{t.type} · {t.date}</div>
                  <h3 className="card__title">{t.title}</h3>
                  <p className="card__venue">{t.venue}</p>
                  <p className="card__body">{t.excerpt}</p>
                  <div className="card__foot">
                    {t.bullets.map((b) => <span className="tag" key={b}>{b}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Contact ────────────────────────────────────────────────── */}
          <section id="contact" className="sec sec--contact">
            <div className="contact" data-reveal="1">
              <div className="scene contact__scene" data-scene="globe" aria-hidden="true" />
              <div className="contact__inner">
                <p className="eyebrow">07 — Get in touch</p>
                <h2 className="contact__title">
                  Bring survey puzzles, ML tangles, geospatial detours, or just a well-aimed note.
                </h2>
                <div className="btn-row contact__actions">
                  <a className="btn btn--primary btn--lg" href={"mailto:" + P.email}>Email · {P.email}</a>
                  {D.links.filter((l) => l.label !== "Email").map((l) => (
                    <a className="btn btn--lg" href={l.url.replace("&amp;", "&")} target="_blank" rel="noopener" key={l.label}>
                      {l.label} ↗
                    </a>
                  ))}
                </div>
                <p className="contact__meta">{P.location} · {P.phone}</p>
              </div>
            </div>
            <footer className="site-foot">
              <span>© 2026 {P.name}</span>
              <span className="site-foot__links">
                <a href="/terms/">Terms &amp; Privacy</a>
                <a href={P.siteUrl} target="_blank" rel="noopener">Live site</a>
                <a href="https://github.com/namo507/namo507.github.io" target="_blank" rel="noopener">Source ↗</a>
              </span>
            </footer>
          </section>
        </main>

        {/* ── Detail overlay ───────────────────────────────────────────── */}
        {ov ? (
          <div
            className="overlay"
            role="presentation"
            data-closing={s.ovClosing ? "1" : undefined}
            onClick={this.closeExpanded}
          >
            <div
              className="overlay__dialog"
              role="dialog"
              aria-modal="true"
              aria-label={ov.title}
              onClick={(e) => e.stopPropagation()}
              style={{ "--ov-from": s.ovFrom }}
            >
              <button className="overlay__close" onClick={this.closeExpanded} aria-label="Close detail" ref={this.closeRef}>✕</button>
              <p className="overlay__kicker">{ov.kicker}</p>
              <h2 className="overlay__title">{ov.title}</h2>
              <p className="overlay__subtitle">{ov.subtitle}</p>
              <p className="overlay__body">{ov.body}</p>
              {ov.hasBullets ? (
                <ul className="overlay__bullets">
                  {ov.bullets.map((b) => (
                    <li key={b}><span className="dot-list__dot" aria-hidden="true" />{b}</li>
                  ))}
                </ul>
              ) : null}
              {ov.hasStats ? (
                <div className="overlay__stats">
                  {ov.stats.map((st) => (
                    <div className="stat" key={st.k}>
                      <div className="stat__v">{st.v}</div>
                      <div className="stat__k">{st.k}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              {ov.hasTags ? (
                <div className="overlay__tags">
                  {ov.tags.map((tg) => <span className="tag" key={tg}>{tg}</span>)}
                </div>
              ) : null}
              <div className="overlay__foot">
                {ov.url ? (
                  <a className="btn btn--primary" href={ov.url} target="_blank" rel="noopener">{ov.urlLabel}</a>
                ) : null}
                <button className="btn" onClick={this.closeExpanded}>Close</button>
              </div>
              <p className="overlay__hint">Esc closes · returns to the card you opened</p>
            </div>
          </div>
        ) : null}

        {/* ── Research assistant ───────────────────────────────────────── */}
        <div className="buddy" inert={ov ? "" : undefined} aria-hidden={ov ? "true" : undefined}>
          {s.buddyOpen ? (
            <div className="buddy__panel" role="dialog" aria-label="Research assistant">
              <div className="buddy__head">
                <div>
                  <div className="buddy__title">Research assistant</div>
                  <div className="buddy__sub">Keyword search · answers from this page</div>
                </div>
                <button className="buddy__close" onClick={() => this.setState({ buddyOpen: false })} aria-label="Close assistant">✕</button>
              </div>
              <button className="buddy__fact" onClick={() => this.setState({ factIdx: s.factIdx + 1 })}>
                <span className="buddy__fact-label">Research fact · tap to rotate</span>
                <span className="buddy__fact-text">{FACTS[s.factIdx % FACTS.length]}</span>
              </button>
              <div className="buddy__msgs" ref={this.msgsRef} role="log" aria-live="polite" aria-label="Conversation">
                {(s.buddyMsgs.length ? s.buddyMsgs : [{
                  role: "assistant",
                  content: "Ask about the research, the projects, or the skills here. Answers come only from this page.",
                }]).map((m, i) => (
                  <div className={"buddy__msg" + (m.role === "user" ? " buddy__msg--user" : "")} key={i}>{m.content}</div>
                ))}
              </div>
              <div className="buddy__form">
                <input
                  className="buddy__input"
                  value={s.buddyInput}
                  onChange={(e) => this.setState({ buddyInput: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); this.sendBuddy(); } }}
                  placeholder="Ask about research, projects…"
                  aria-label="Ask the research assistant"
                />
                <button className="buddy__send" onClick={this.sendBuddy} aria-label="Send question">→</button>
              </div>
            </div>
          ) : null}
          <button
            className="buddy__fab"
            onClick={() => this.setState({ buddyOpen: !s.buddyOpen })}
            aria-label={s.buddyOpen ? "Close research assistant" : "Open research assistant"}
            aria-expanded={s.buddyOpen ? "true" : "false"}
          >
            <span className="buddy__ping" aria-hidden="true" />
            <span aria-hidden="true">{s.buddyOpen ? "✕" : "✦"}</span>
          </button>
        </div>
      </React.Fragment>
    );
  }
}

function App() {
  const data = useMemo(buildData, []);
  return <Portfolio data={data} />;
}

class AppBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main id="content" className="app-fallback">
      <h1>Namit Shrivastava</h1>
      <p>Survey methodology, data science, and responsible AI.</p>
      <p>The interactive portfolio is temporarily unavailable. Explore the full portfolio or download the CV below.</p>
      <div className="btn-row"><a href="/about/">Full portfolio</a><a href="/files/namit-shrivastava-cv.pdf">Download CV</a><a href="mailto:namit507@gmail.com">Email</a></div>
    </main>;
  }
}

const mountApp = () => {
  const root = createRoot(document.getElementById("app"));
  root.render(<AppBoundary><App /></AppBoundary>);
};

const syncLoads = [window.PORTFOLIO_SYNC_READY, window.LINKEDIN_SYNC_READY].filter(
  (promiseLike) => promiseLike && typeof promiseLike.then === "function"
);
if (syncLoads.length > 0) {
  // Optional feeds must never keep the entire portfolio waiting indefinitely.
  Promise.race([Promise.allSettled(syncLoads), new Promise((resolve) => setTimeout(resolve, 2500))]).finally(mountApp);
} else {
  mountApp();
}
