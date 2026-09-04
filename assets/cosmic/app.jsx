/* global React, ReactDOM */
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

// The LinkedIn card renders only when the sync validated; a failed or stale
// fetch leaves `sync_status !== "ok"` and the section falls away entirely.
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

const ALL_SECTIONS = [
  ["experience", "Experience"],
  ["projects", "Projects"],
  ["publications", "Publications"],
  ["skills", "Skills"],
  ["code", "Code"],
  ["signals", "Signals"],
  ["talks", "Talks"],
  ["teaching", "Teaching"],
  ["contact", "Contact"],
];

// #signals only renders when the LinkedIn sync validated, so drop it from the
// nav too — otherwise a failed sync leaves a link that scrolls nowhere.
function sectionsFor(data) {
  return data.linkedin ? ALL_SECTIONS : ALL_SECTIONS.filter(([id]) => id !== "signals");
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

function formatSyncDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

// ── App ─────────────────────────────────────────────────────────────────────
class Portfolio extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      theme: "dark",
      scrolled: false,
      active: "home",
      typed: "",
      ind: { x: 0, w: 0, ready: false },
      metricP: 0,
      filter: "All",
      expanded: null,
      expProgress: 0,
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
    };
    this.navRefs = {};
    this.timers = [];
    this.goCache = {};
    this.scrollerRef = React.createRef();
    this.closeRef = React.createRef();
    this.msgsRef = React.createRef();
    this.reduced = false;
  }

  // ── lifecycle ─────────────────────────────────────────────────────────────
  componentDidMount() {
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.setState({ theme: document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark" });

    this.osMq = window.matchMedia("(prefers-color-scheme: light)");
    this.onOS = (e) => {
      let stored = null;
      try { stored = localStorage.getItem("theme"); } catch (err) { /* storage blocked */ }
      if (!stored) this.applyTheme(e.matches ? "light" : "dark", false);
    };
    this.osMq.addEventListener("change", this.onOS);

    window.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("resize", this.measureNav, { passive: true });
    this.onScroll();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.onScroll());

    const mainEl = document.querySelector("main");
    if (mainEl && window.ResizeObserver) {
      this.ro = new ResizeObserver(() => this.onScroll());
      this.ro.observe(mainEl);
    }

    this.io = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      this.reveal(entry.target);
    }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    this.observeAll();
    this.mo = new MutationObserver(() => this.observeAll());
    this.mo.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("keydown", this.onKey);
    document.addEventListener("click", this.onDocClick);

    this.startTyper();
    this.countUp();
    this.mountScenes(0);
    this.timers.push(setTimeout(this.measureNav, 60));
    this.timers.push(setTimeout(this.sweepReveals, 900));
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
    window.removeEventListener("keydown", this.onKey);
    document.removeEventListener("click", this.onDocClick);
    if (this.osMq) this.osMq.removeEventListener("change", this.onOS);
    this.timers.forEach(clearTimeout);
    this.timers = [];
    clearTimeout(this._sweepT);
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.io) this.io.disconnect();
    if (this.mo) this.mo.disconnect();
    if (this.ro) this.ro.disconnect();
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
  onScroll = () => {
    if (this.dead) return;
    clearTimeout(this._sweepT);
    this._sweepT = setTimeout(this.sweepReveals, 140);
    const probe = window.innerHeight * 0.38;
    let cur = "home";
    for (const [id] of this.sections) {
      const el = document.getElementById(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      // height > 1 rejects sections that have not been laid out yet: on the
      // synchronous mount probe every rect is 0-high at top 0, which would
      // otherwise match all nine and latch the last one.
      if (r.height > 1 && r.top <= probe) cur = id;
    }
    const scrolled = window.scrollY > 40;

    let ep = this.state.expProgress;
    const tl = document.getElementById("exp-timeline");
    if (tl) {
      const r = tl.getBoundingClientRect();
      ep = Math.min(1, Math.max(0, (window.innerHeight * 0.62 - r.top) / Math.max(1, r.height)));
    }

    if (cur !== this.state.active || scrolled !== this.state.scrolled || Math.abs(ep - this.state.expProgress) > 0.004) {
      this.setState({ active: cur, scrolled, expProgress: ep });
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
    this.io.unobserve(el);
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
    document.querySelectorAll("[data-reveal]:not([data-in])").forEach((el) => {
      if (el.getBoundingClientRect().top < cutoff) this.reveal(el);
    });
  };

  observeAll() {
    document.querySelectorAll("[data-reveal]:not([data-in]):not([data-obs])").forEach((el) => {
      el.setAttribute("data-obs", "1");
      this.io.observe(el);
    });
  }

  go(id) {
    return this.goCache[id] || (this.goCache[id] = () => {
      const el = document.getElementById(id);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top, behavior: this.reduced ? "auto" : "smooth" });
    });
  }

  onKey = (e) => {
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
    if (persist) {
      try { localStorage.setItem("theme", next); } catch (e) { /* storage blocked */ }
    }
    this.setState({ theme: next });
  }

  // ── hero animations ───────────────────────────────────────────────────────
  startTyper() {
    const words = (this.props.data.profile && this.props.data.profile.typingWords) || [];
    if (!words.length) return;
    if (this.reduced) { this.setState({ typed: words[0] }); return; }

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
      this.setState({ typed: word.slice(0, Math.max(0, len)) });
      this.timers.push(setTimeout(step, delay));
    };
    step();
  }

  countUp() {
    if (this.reduced) { this.setState({ metricP: 1 }); return; }
    const t0 = performance.now() + 350;
    const dur = 1400;
    const tick = (now) => {
      if (this.dead) return;
      const p = Math.min(1, Math.max(0, (now - t0) / dur));
      this.setState({ metricP: 1 - Math.pow(1 - p, 3) });
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
    this.setState({ expanded: payload, ovFrom: this.flipTransform(el), ovClosing: false });
    this.timers.push(setTimeout(() => {
      if (this.closeRef.current) this.closeRef.current.focus();
    }, 60));
  }

  closeExpanded = () => {
    const el = this.lastTrigger;
    this.setState({ ovFrom: this.flipTransform(el), ovClosing: true });
    this.timers.push(setTimeout(() => {
      this.setState({ expanded: null, ovClosing: false });
      if (el && el.focus) el.focus();
    }, this.reduced ? 0 : 380));
  };

  // ── research assistant ────────────────────────────────────────────────────
  answer(q) {
    const D = this.props.data;
    const t = q.toLowerCase();
    const rules = [
      [/talk|present|aapor|keynote/, "One so far \u2014 AAPOR\u2019s 80th, St. Louis, May 2025. I took the EV sentiment work there: 1.1M+ posts, DistilBERT at 91.6%, and the part people asked about most, where the LLMs were quietly biased. Full details in Talks."],
      [/publicat|publish|paper|article|journal|conference|scholar|orcid/, "Two so far. A Springer article on keeping supply chains sustainable through disruption \u2014 fuzzy-AHP over 200+ experts, 2024 \u2014 and the AAPOR 2025 paper on EV sentiment, DistilBERT at 91.6% across 1.1M+ posts. Five more are working their way through the 2026 pipeline; ORCID has them."],
      [/skill|technolog|program|python|stack|pytorch/, "Strongest ground is survey and research methods (98%), then AI/ML (95%), core AI systems (91%) and programming (84%). Day to day that means Python and R, PyTorch and TensorFlow, Hugging Face and LangChain, on whichever of AWS, Azure or GCP the project lives."],
      [/educat|degree|university|gpa|bits|umd/, "An M.S. in Survey & Data Science from Maryland \u2014 3.817/4.0, and a JPSM Dean's Fellow in 2025\u201326. Before that, civil engineering at BITS Pilani with a data science minor, 3.327/4.0. The route here was not a straight line."],
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
    return sectionsFor(this.props.data);
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
      <header className="nav-wrap">
        <nav className="nav" aria-label="Primary" data-scrolled={scrolled ? "1" : undefined}>
          <button
            className="nav__brand"
            onClick={() => window.scrollTo({ top: 0, behavior: this.reduced ? "auto" : "smooth" })}
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
          </button>

          <div className="nav__menu">
            <button
              className="nav__menu-btn"
              onClick={(e) => { e.stopPropagation(); this.setState({ menuOpen: !menuOpen }); }}
              aria-expanded={menuOpen ? "true" : "false"}
              aria-haspopup="menu"
            >
              <span>{active === "home" ? "Sections" : activeLabel}</span>
              <span className="nav__caret" aria-hidden="true" style={{ transform: "rotate(" + (menuOpen ? 180 : 0) + "deg)" }}>▼</span>
            </button>
            {menuOpen ? (
              <div className="nav__menu-pop" role="menu" aria-label="Sections">
                {this.sections.map(([id, label], i) => (
                  <button
                    key={id}
                    className="nav__menu-item"
                    role="menuitem"
                    aria-current={active === id ? "true" : undefined}
                    onClick={() => { this.setState({ menuOpen: false }); this.go(id)(); }}
                  >
                    <span>{label}</span>
                    <span className="nav__menu-num" aria-hidden="true">{"0" + (i + 1)}</span>
                  </button>
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
              <button
                key={id}
                className="nav__link"
                ref={this.navRef(id)}
                onClick={this.go(id)}
                aria-current={active === id ? "true" : undefined}
              >{label}</button>
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
          <p className="sec__lead">{lead}</p>
        </div>
        <div className="scene" data-scene={scene} aria-hidden="true" />
      </div>
    );
  }

  render() {
    const D = this.props.data;
    const P = D.profile;
    const s = this.state;
    const li = D.linkedin;
    const seeded = li && li.meta.source === "linkedin-curated-seed";
    const validated = li ? formatSyncDate(li.meta.last_successful_sync_at) : "";

    const tags = ["All"].concat(Array.from(new Set(D.projects.flatMap((p) => p.tags))).slice(0, 9));
    const visible = s.filter === "All" ? D.projects : D.projects.filter((p) => p.tags.includes(s.filter));
    const langTotal = D.github.languageMix.reduce((a, l) => a + l.count, 0);
    const langFill = s.active === "code" || s.skillsIn ? 1 : 0;
    const ov = s.expanded;

    return (
      <React.Fragment>
        {this.renderNav(P)}

        <main id="content">
          {/* ── Home ───────────────────────────────────────────────────── */}
          <section id="home" className="sec sec--home">
            <div className="hero">
              <div data-reveal="1" data-in="1">
                <p className="eyebrow">{P.eyebrow}</p>
                <p className="hero__typed" aria-live="polite">
                  Currently building <b>{s.typed}</b>
                  <span className="caret" aria-hidden="true" />
                </p>
                <h1 className="hero__title">{P.headline}</h1>
                <p className="hero__summary">{P.summary}</p>
                <div className="btn-row hero__actions">
                  <button className="btn btn--primary" onClick={this.go("experience")}>View experience →</button>
                  <button className="btn" onClick={this.go("publications")}>Publications</button>
                  <button className="btn" onClick={this.go("projects")}>Projects</button>
                  <a className="btn" href={D.github.profileUrl} target="_blank" rel="noopener">GitHub ↗</a>
                </div>
                <div className="hero__metrics">
                  {D.metrics.map((m) => (
                    <div key={m.label}>
                      <div className="metric__v">{this.fmtMetric(m.value, s.metricP)}</div>
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
            <div className="interests" data-reveal="1">
              <span className="interests__label">Research interests</span>
              {D.interests.map((i) => <span className="pill" key={i}>{i}</span>)}
            </div>
          </section>

          {/* ── Experience ─────────────────────────────────────────────── */}
          <section id="experience" className="sec">
            {this.renderHead("01", "Experience",
              "From a volunteer registry to an NIH infant cohort.",
              "Seven roles, two countries, and domains that kept changing \u2014 disaster relief, legal tech, public health, survey methodology. The job underneath stayed the same: take data somebody has to trust, and make it worth trusting. Open any role for the full record.",
              "helix")}
            <div id="exp-timeline" className="exp">
              <div className="exp__rail" aria-hidden="true" />
              <div className="exp__rail exp__rail--fill" aria-hidden="true" style={{ "--fill": Math.min(1, Math.max(0, s.expProgress)) }} />
              {D.experience.map((r) => (
                <div className="exp__row" data-reveal="1" key={r.org + r.role}>
                  <div className="exp__aside">
                    <span className={"exp__dot" + (r.current ? " exp__dot--current" : "")} aria-hidden="true" />
                    <div className="exp__meta" data-hide-mobile="1">{r.dates}<br />{r.location}</div>
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
                    <div className="card__meta-row">
                      <span className="card__meta">{r.dates} · {r.location}</span>
                      {r.current ? <span className="badge">Current</span> : null}
                    </div>
                    <h3 className="card__title">{r.role}</h3>
                    <p className="card__org">{r.org}</p>
                    <p className="card__body">{r.bullets[0]}</p>
                    <p className="card__more">
                      {r.bullets.length > 1 ? "+" + (r.bullets.length - 1) + " more — open full record" : "Open full record"}
                    </p>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ── Projects ───────────────────────────────────────────────── */}
          <section id="projects" className="sec">
            {this.renderHead("02", "Selected work",
              "Twenty projects, and what each one actually took.",
              "Football transfer markets, air pollution, electric vehicles, forest cover \u2014 different subjects, consistent method. Filter by approach, or open any card for the full case study.",
              "lattice")}
            <div className="filters" role="group" aria-label="Filter projects" data-reveal="1">
              {tags.map((t) => (
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
            <div className="project-grid" data-cardgrid="1">
              {visible.map((p, i) => (
                <button
                  key={p.id}
                  className="card card--project"
                  data-span={i % 7 === 0 ? 2 : 1}
                  data-reveal="1"
                  aria-haspopup="dialog"
                  onClick={(ev) => this.openExpanded({
                    kicker: "Project " + p.id + " · " + p.type,
                    title: p.title,
                    subtitle: p.date + " · " + p.venue,
                    body: p.excerpt,
                    tags: p.tags,
                    hasTags: true,
                    url: p.url,
                    urlLabel: p.url.includes("github.com") ? "Open repository ↗" : "Open writeup ↗",
                  }, ev)}
                >
                  <div className="card__head">
                    <span>Project · {p.id}</span>
                    <span className="card__type">{p.type}</span>
                  </div>
                  <h3 className="card__title">{p.title}</h3>
                  <p className="card__excerpt" style={{ WebkitLineClamp: i % 7 === 0 ? 5 : 4 }}>{p.excerpt}</p>
                  <div className="card__foot">
                    {p.tags.map((tg) => <span className="tag" key={tg}>{tg}</span>)}
                    <span className="card__date">{p.date}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── Publications ───────────────────────────────────────────── */}
          <section id="publications" className="sec">
            {this.renderHead("03", "Research output",
              "Two published papers, five more in the pipeline.",
              "A Springer article on supply-chain sustainability under disruption, and an AAPOR paper on electric-vehicle sentiment across 1.1 million social posts. Five more are working through the 2026 pipeline.",
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
                  <p className="card__body">{p.excerpt}</p>
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
                    <span className="card__cite-cta">Read paper ↗</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="wip" data-reveal="1">
              <div className="wip__head">
                <p className="mono-meta">2026 research pipeline · via ORCID</p>
                <a href="https://orcid.org/0009-0005-7920-8350" target="_blank" rel="noopener"
                   style={{ fontFamily: "var(--mono)", fontSize: "11.5px" }}>0009-0005-7920-8350 ↗</a>
              </div>
              <ul className="wip__list">
                {D.worksInProgress.map((w) => (
                  <li className="wip__row" key={w.title}>
                    <span style={{ textWrap: "pretty" }}>{w.title}</span>
                    <span className="wip__kind">{w.kind} · {w.year}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="btn-row" style={{ marginTop: "28px" }} data-reveal="1">
              <a className="btn btn--primary" href="https://scholar.google.com/citations?user=7bvTB-sAAAAJ&hl=en" target="_blank" rel="noopener">Google Scholar ↗</a>
              <a className="btn" href="https://orcid.org/0009-0005-7920-8350" target="_blank" rel="noopener">ORCID ↗</a>
            </div>
          </section>

          {/* ── Skills ─────────────────────────────────────────────────── */}
          <section id="skills" className="sec">
            {this.renderHead("04", "Technical skills",
              "Methods first. The stack is just how they ship.",
              "Seven groups, scored by depth of real use rather than familiarity. Survey methodology leads because everything else supports it.",
              "rings")}
            <div id="skills-grid" className="skill-grid" data-cardgrid="1" data-reveal="1">
              {D.skills.map((k, i) => (
                <div className="skill" data-span={i === 0 ? 2 : 1} key={k.name}>
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
                  <div className="skill__tools">
                    {k.tools.map((t) => <span className="tag" key={t}>{t}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Code ───────────────────────────────────────────────────── */}
          <section id="code" className="sec">
            {this.renderHead("05", "Code portfolio",
              "Open code, from research pipelines to production tools.",
              "Research pipelines, NLP experiments, automation tools, and the source for this site. Counts and language mix update automatically from the GitHub API.",
              "cubes")}
            <div className="gh-stats" data-reveal="1">
              {D.github.stats.map((g) => (
                <div className="gh-stat" key={g.k}>
                  <div className="metric__v">{g.v}</div>
                  <div className="metric__k">{g.k}</div>
                </div>
              ))}
            </div>

            <div className="gh-panels" data-reveal="1">
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
              <div className="panel">
                <p className="mono-meta">What this code covers</p>
                <ul className="dot-list" style={{ marginTop: "14px" }}>
                  <li><span className="dot-list__dot" aria-hidden="true" />Research code — survey methodology, NLP, multilevel models, and public opinion.</li>
                  <li><span className="dot-list__dot" aria-hidden="true" />Prototypes that went to production — Office add-ins, n8n workflows, simulations.</li>
                  <li><span className="dot-list__dot" aria-hidden="true" />Docs that tie each repository back to the work it came from.</li>
                </ul>
              </div>
            </div>

            <h3 className="repos-title" data-reveal="1">Featured repositories</h3>
            <div className="repo-grid">
              {D.github.featured.map((r) => (
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
                    <span className="repo__metric">{r.metric} <span>{r.metricLabel}</span></span>
                  </div>
                  <h4 className="repo__name">{r.name}</h4>
                  <p className="repo__desc">{r.desc}</p>
                  <span className="repo__cta">Open repo ↗</span>
                </button>
              ))}
            </div>

            <div className="recent" data-reveal="1">
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
            </div>
          </section>

          {/* ── LinkedIn signals ───────────────────────────────────────── */}
          {li ? (
            <section id="signals" className="sec">
              {this.renderHead("06",
                seeded ? "LinkedIn snapshot" : "LinkedIn signals",
                seeded
                  ? "Recent activity on LinkedIn."
                  : "Recent activity on LinkedIn.",
                seeded
                  ? "A verified snapshot of my profile and recent posts, refreshed whenever live sync is available."
                  : "Profile updates and recent posts, synced from my public LinkedIn.",
                "wave")}
              <div className="li-grid">
                <div className="li-card" data-reveal="1">
                  <div className="li-card__head">
                    <span>{seeded ? "Profile snapshot" : "Current public snapshot"}</span>
                    <span className="badge li-card__badge">{seeded ? "Curated snapshot" : "Public sync"}</span>
                  </div>
                  <h3 className="li-card__headline">{li.profile.headline_short}</h3>
                  <p className="li-card__about">{li.profile.about_short}</p>
                  <div className="li-card__skills">
                    {(li.profile.top_skills || []).slice(0, 6).map((k) => <span className="tag" key={k}>{k}</span>)}
                  </div>
                  <p className="li-card__meta">
                    {[li.profile.current_role, li.profile.organization, li.profile.location].filter(Boolean).join(" · ")}
                  </p>
                  <p className="li-card__meta">{validated ? "Last validated snapshot · " + validated : "Validated snapshot"}</p>
                  <div className="li-card__cta">
                    <a className="btn btn--primary btn--sm" href={li.profile.profile_url} target="_blank" rel="noopener">Open LinkedIn ↗</a>
                  </div>
                </div>
                <div className="li-card" data-reveal="1">
                  <div className="mono-meta">{seeded ? "Recent highlights" : "Latest public updates"}</div>
                  <ul className="li-updates">
                    {(li.updates || []).slice(0, 3).map((u) => (
                      <li key={u.title}>
                        <a
                          href={u.canonical_url && u.canonical_url.startsWith("http") ? u.canonical_url : li.profile.profile_url}
                          target="_blank"
                          rel="noopener"
                        >
                          <span className="li-updates__kind">{u.posted_relative || u.kind}</span>
                          <strong className="li-updates__title">{u.title}</strong>
                          <p className="li-updates__summary">{u.summary_short}</p>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="li-note" data-reveal="1">
                {li.meta.warning || "These cards are running on live LinkedIn data right now."}
              </p>
            </section>
          ) : null}

          {/* ── Talks ──────────────────────────────────────────────────── */}
          <section id="talks" className="sec">
            {this.renderHead("07", "Talks & presentations",
              "Explaining the method, not just the result.",
              "AAPOR 2025, on what transformer models can and can\u2019t tell you about public opinion, and where a confident sentiment score goes wrong.",
              "rings")}
            <div className="card-grid-340">
              {D.talks.map((t) => (
                <a className="card card--talk" href={t.url} target="_blank" rel="noopener" data-reveal="1" key={t.title}>
                  <div className="mono-meta">{t.type} · {t.date} · {t.location}</div>
                  <h3 className="card__title">{t.title}</h3>
                  <p className="card__venue">{t.venue}</p>
                  <p className="card__body">{t.excerpt}</p>
                  <span className="card__cta">Conference page ↗</span>
                </a>
              ))}
              <div className="snapshot" data-reveal="1">
                <p className="mono-meta">Snapshot</p>
                <h3 className="snapshot__title">
                  {D.talks.length} {D.talks.length === 1 ? "talk" : "talks"} · 1 distinct venue · 2025
                </h3>
                <p className="snapshot__body">
                  Most recent presentation: AAPOR 2025, St. Louis, MO. Looking ahead to AAPOR 2026 and methods workshops in 2026.
                </p>
              </div>
            </div>
          </section>

          {/* ── Teaching ───────────────────────────────────────────────── */}
          <section id="teaching" className="sec">
            {this.renderHead("08", "Teaching practice",
              "Teaching the part everyone would rather skip.",
              "Two years at Maryland\u2019s Joint Program in Survey Methodology \u2014 a graduate course on privacy and confidentiality for 23 students, plus the Canvas infrastructure keeping 10+ instructors and 125+ of their students unblocked.",
              "wave")}
            <div className="card-grid-340">
              {D.teaching.map((t) => (
                <div className="card card--teach" data-reveal="1" key={t.title}>
                  <div className="mono-meta">{t.type} · {t.date}</div>
                  <h3 className="card__title">{t.title}</h3>
                  <p className="card__venue">{t.venue}</p>
                  <p className="card__body">{t.excerpt}</p>
                  <ul className="dot-list">
                    {t.bullets.map((b) => (
                      <li key={b}><span className="dot-list__dot" aria-hidden="true" />{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ── Contact ────────────────────────────────────────────────── */}
          <section id="contact" className="sec sec--contact">
            <div className="contact" data-reveal="1">
              <div className="scene contact__scene" data-scene="globe" aria-hidden="true" />
              <div className="contact__inner">
                <p className="eyebrow">09 — Get in touch</p>
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
        <div className="buddy">
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
              <div className="buddy__msgs" ref={this.msgsRef}>
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

const mountApp = () => {
  const root = ReactDOM.createRoot(document.getElementById("app"));
  root.render(<App />);
};

const syncLoads = [window.PORTFOLIO_SYNC_READY, window.LINKEDIN_SYNC_READY].filter(
  (promiseLike) => promiseLike && typeof promiseLike.then === "function"
);
if (syncLoads.length > 0) {
  Promise.allSettled(syncLoads).finally(mountApp);
} else {
  mountApp();
}
