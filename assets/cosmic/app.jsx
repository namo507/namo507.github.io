/* global React, ReactDOM */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ── Hooks ───────────────────────────────────────────────────────────────────
function useTypewriter(words, pause = 1700, typingSpeed = 70, deletingSpeed = 35) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState("typing");
  useEffect(() => {
    const w = words[idx];
    let t;
    if (phase === "typing") {
      if (text.length < w.length) t = setTimeout(() => setText(w.slice(0, text.length + 1)), typingSpeed);
      else t = setTimeout(() => setPhase("holding"), pause);
    } else if (phase === "holding") {
      t = setTimeout(() => setPhase("deleting"), pause);
    } else if (phase === "deleting") {
      if (text.length > 0) t = setTimeout(() => setText(w.slice(0, text.length - 1)), deletingSpeed);
      else { setPhase("typing"); setIdx((idx + 1) % words.length); }
    }
    return () => clearTimeout(t);
  }, [text, phase, idx, words, pause, typingSpeed, deletingSpeed]);
  return text;
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); }),
      { threshold: 0.12 }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  });
}

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY + window.innerHeight * 0.35;
      let cur = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= y) cur = id;
      }
      setActive(cur);
      if (window.BG) window.BG.setSection(cur);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ids]);
  return active;
}

function normalizeLinkedInSync(sync) {
  if (!sync || !sync.meta || sync.meta.sync_status !== "ok") return null;
  if (!sync.profile || (!sync.profile.headline_short && !sync.profile.about_short)) return null;
  return {
    meta: sync.meta,
    profile: sync.profile,
    experience: Array.isArray(sync.experience) ? sync.experience.slice(0, 2) : [],
    featured: Array.isArray(sync.featured) ? sync.featured.slice(0, 2) : [],
    updates: Array.isArray(sync.updates) ? sync.updates.slice(0, 2) : [],
  };
}

function mergeLinkedInIntoSite(baseData, sync) {
  const linkedin = normalizeLinkedInSync(sync);
  if (!linkedin) return baseData;

  const links = (baseData.links || []).map((link) => {
    if (link.label === "LinkedIn" && linkedin.profile.profile_url) {
      return { ...link, url: linkedin.profile.profile_url };
    }
    return link;
  });

  return {
    ...baseData,
    links,
    linkedin,
  };
}

function formatLinkedInDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

function getLinkedInSourceView(meta) {
  const seeded = meta && meta.source === "linkedin-curated-seed";
  const validatedDate = formatLinkedInDate(meta && meta.last_successful_sync_at);
  return {
    eyebrow: seeded ? "LinkedIn Snapshot" : "LinkedIn Signals",
    title: seeded
      ? "A curated LinkedIn snapshot, rendered safely while live sync catches up."
      : "Public profile changes, normalized before they touch the layout.",
    lead: seeded
      ? "This section is driven by a curated, validated snapshot that keeps the portfolio complete while public LinkedIn fetches are rate-limited."
      : "Machine-managed cards rendered only when public LinkedIn data passes fetch, parse, diff, and schema validation.",
    badge: seeded ? "Curated snapshot" : "Public sync",
    snapshotLabel: seeded ? "Profile snapshot" : "Current public snapshot",
    updatesLabel: seeded ? "Recent highlights" : "Latest public updates",
    experienceLabel: seeded ? "Experience in focus" : "Recent LinkedIn Experience",
    featuredLabel: seeded ? "Featured work" : "Featured from LinkedIn",
    note: meta && meta.warning
      ? meta.warning
      : seeded
        ? "Curated from portfolio-owned profile data and validated against the same schema as the live sync."
        : "Live public LinkedIn data is currently driving these cards.",
    metaLine: validatedDate
      ? `Last validated snapshot · ${validatedDate}`
      : seeded
        ? "Validated curated snapshot"
        : "Validated public snapshot",
    seeded,
  };
}

// ── Atoms ───────────────────────────────────────────────────────────────────
function Tag({ children, accent }) {
  return <span className={"tag" + (accent ? " tag--accent" : "")}>{children}</span>;
}

function Metric({ v, k, color }) {
  return (
    <div className="metric reveal">
      <span className="metric__v" style={{ color: color || undefined }}>{v}</span>
      <span className="metric__k">{k}</span>
    </div>
  );
}

// ── TileCreature ────────────────────────────────────────────────────────────
// Tiny pseudo-3D SVG figures dropped into every content tile. Each `kind`
// renders a self-contained scene (person + prop) with looping CSS animations
// keyed off classNames defined in styles.css. `position` selects the corner
// (br = bottom-right, default), `delay` desyncs neighbouring tiles so the
// grid never animates in lockstep.
function TileCreature({ kind, color, delay = 0, position = "br" }) {
  const styleVars = { "--c": color || "var(--accent)", "--d": (delay || 0) + "s" };
  const cls = "creature creature--" + kind + " creature--" + position;

  let body = null;

  if (kind === "desk") {
    body = (
      <svg viewBox="0 0 90 70" className="creature__svg" aria-hidden="true">
        <g className="creature__shadow"><ellipse cx="46" cy="64" rx="30" ry="3" /></g>
        <rect x="46" y="22" width="30" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <rect className="creature__screen" x="49" y="25" width="24" height="14" fill="currentColor" />
        <line x1="46" y1="42" x2="76" y2="42" stroke="currentColor" strokeWidth="1.4" />
        <line x1="61" y1="42" x2="61" y2="48" stroke="currentColor" strokeWidth="1.4" />
        <rect x="56" y="48" width="10" height="2" fill="currentColor" />
        <rect x="14" y="50" width="60" height="2" fill="currentColor" opacity="0.55" />
        <g className="creature__person creature__person--type">
          <circle cx="28" cy="30" r="5" fill="currentColor" />
          <rect x="24" y="34" width="8" height="14" rx="2" fill="currentColor" />
          <line x1="28" y1="48" x2="25" y2="58" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="28" y1="48" x2="32" y2="58" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line className="creature__arm-l" x1="25" y1="38" x2="36" y2="44" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line className="creature__arm-r" x1="31" y1="38" x2="42" y2="46" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      </svg>
    );
  } else if (kind === "chart") {
    body = (
      <svg viewBox="0 0 90 70" className="creature__svg" aria-hidden="true">
        <g className="creature__shadow"><ellipse cx="46" cy="64" rx="32" ry="3" /></g>
        <line x1="14" y1="56" x2="80" y2="56" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
        <rect className="creature__bar creature__bar--1" x="48" y="42" width="6" height="14" fill="currentColor" opacity="0.7" />
        <rect className="creature__bar creature__bar--2" x="58" y="34" width="6" height="22" fill="currentColor" opacity="0.7" />
        <rect className="creature__bar creature__bar--3" x="68" y="22" width="6" height="34" fill="currentColor" opacity="0.7" />
        <g className="creature__person creature__person--point">
          <circle cx="26" cy="28" r="5" fill="currentColor" />
          <rect x="22" y="32" width="8" height="14" rx="2" fill="currentColor" />
          <line x1="26" y1="46" x2="22" y2="56" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="26" y1="46" x2="30" y2="56" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="23" y1="36" x2="18" y2="42" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line className="creature__arm-point" x1="29" y1="36" x2="44" y2="28" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      </svg>
    );
  } else if (kind === "gear") {
    const teeth = [0, 45, 90, 135, 180, 225, 270, 315];
    body = (
      <svg viewBox="0 0 90 70" className="creature__svg" aria-hidden="true">
        <g className="creature__shadow"><ellipse cx="46" cy="64" rx="30" ry="3" /></g>
        <g className="creature__gear">
          <circle cx="60" cy="36" r="11" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="60" cy="36" r="3" fill="currentColor" />
          {teeth.map((a) => (
            <rect key={a} x="58.5" y="22" width="3" height="5" fill="currentColor" transform={"rotate(" + a + " 60 36)"} />
          ))}
        </g>
        <g className="creature__person creature__person--turn">
          <circle cx="26" cy="28" r="5" fill="currentColor" />
          <rect x="22" y="32" width="8" height="14" rx="2" fill="currentColor" />
          <line x1="26" y1="46" x2="22" y2="56" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="26" y1="46" x2="30" y2="56" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="23" y1="36" x2="18" y2="42" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="29" y1="36" x2="46" y2="38" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      </svg>
    );
  } else if (kind === "read") {
    body = (
      <svg viewBox="0 0 90 70" className="creature__svg" aria-hidden="true">
        <g className="creature__shadow"><ellipse cx="46" cy="64" rx="28" ry="3" /></g>
        <g className="creature__person creature__person--read">
          <polygon points="34,18 54,18 44,12" fill="currentColor" />
          <line x1="44" y1="12" x2="50" y2="14" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="44" cy="24" r="6" fill="currentColor" />
          <rect x="38" y="30" width="12" height="18" rx="2" fill="currentColor" />
          <line x1="44" y1="48" x2="40" y2="60" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="44" y1="48" x2="48" y2="60" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </g>
        <g className="creature__book">
          <path d="M52 44 L60 42 L60 56 L52 58 Z" fill="currentColor" opacity="0.55" />
          <path className="creature__page" d="M60 42 L68 44 L68 58 L60 56 Z" fill="currentColor" opacity="0.85" />
        </g>
      </svg>
    );
  } else if (kind === "paper") {
    body = (
      <svg viewBox="0 0 90 70" className="creature__svg" aria-hidden="true">
        <g className="creature__shadow"><ellipse cx="46" cy="64" rx="30" ry="3" /></g>
        <g className="creature__paper">
          <rect x="46" y="22" width="28" height="34" rx="1" fill="currentColor" opacity="0.18" />
          <line className="creature__line creature__line--1" x1="50" y1="28" x2="70" y2="28" stroke="currentColor" strokeWidth="1.2" />
          <line className="creature__line creature__line--2" x1="50" y1="34" x2="68" y2="34" stroke="currentColor" strokeWidth="1.2" />
          <line className="creature__line creature__line--3" x1="50" y1="40" x2="66" y2="40" stroke="currentColor" strokeWidth="1.2" />
          <line className="creature__line creature__line--4" x1="50" y1="46" x2="70" y2="46" stroke="currentColor" strokeWidth="1.2" />
        </g>
        <g className="creature__person creature__person--review">
          <circle cx="28" cy="26" r="5" fill="currentColor" />
          <rect x="24" y="30" width="8" height="14" rx="2" fill="currentColor" />
          <line x1="28" y1="44" x2="24" y2="56" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="28" y1="44" x2="32" y2="56" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="25" y1="34" x2="20" y2="40" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line className="creature__arm-pen" x1="31" y1="34" x2="48" y2="38" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      </svg>
    );
  } else if (kind === "build") {
    body = (
      <svg viewBox="0 0 90 70" className="creature__svg" aria-hidden="true">
        <g className="creature__shadow"><ellipse cx="46" cy="64" rx="30" ry="3" /></g>
        <g className="creature__cube">
          <path d="M54 30 L62 26 L70 30 L70 44 L62 48 L54 44 Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <line x1="54" y1="30" x2="62" y2="34" stroke="currentColor" strokeWidth="1.2" />
          <line x1="62" y1="34" x2="70" y2="30" stroke="currentColor" strokeWidth="1.2" />
          <line x1="62" y1="34" x2="62" y2="48" stroke="currentColor" strokeWidth="1.2" />
        </g>
        <g className="creature__person creature__person--hammer">
          <circle cx="26" cy="28" r="5" fill="currentColor" />
          <rect x="22" y="32" width="8" height="14" rx="2" fill="currentColor" />
          <line x1="26" y1="46" x2="22" y2="58" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="26" y1="46" x2="30" y2="58" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <g className="creature__hammer-arm">
            <line x1="29" y1="36" x2="44" y2="34" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <rect x="42" y="30" width="6" height="8" fill="currentColor" />
          </g>
        </g>
      </svg>
    );
  } else if (kind === "commit") {
    body = (
      <svg viewBox="0 0 90 70" className="creature__svg" aria-hidden="true">
        <g className="creature__shadow"><ellipse cx="46" cy="64" rx="32" ry="3" /></g>
        <rect x="40" y="20" width="38" height="22" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <text x="44" y="32" fontFamily="monospace" fontSize="6" fill="currentColor" opacity="0.75">$ git</text>
        <text x="44" y="40" fontFamily="monospace" fontSize="6" fill="currentColor" opacity="0.6">
          commit<tspan className="creature__cursor">_</tspan>
        </text>
        <rect x="40" y="42" width="38" height="2" fill="currentColor" />
        <g className="creature__person creature__person--type">
          <circle cx="22" cy="28" r="5" fill="currentColor" />
          <rect x="18" y="32" width="8" height="14" rx="2" fill="currentColor" />
          <line x1="22" y1="46" x2="18" y2="58" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="22" y1="46" x2="26" y2="58" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line className="creature__arm-l" x1="19" y1="36" x2="32" y2="44" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line className="creature__arm-r" x1="25" y1="36" x2="36" y2="46" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </g>
        <g className="creature__commit-dot">
          <circle cx="78" cy="14" r="3" fill="currentColor" />
        </g>
      </svg>
    );
  } else if (kind === "present") {
    body = (
      <svg viewBox="0 0 90 70" className="creature__svg" aria-hidden="true">
        <g className="creature__shadow"><ellipse cx="46" cy="64" rx="32" ry="3" /></g>
        <rect x="46" y="14" width="32" height="22" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <line className="creature__slide-line creature__slide-line--1" x1="50" y1="20" x2="74" y2="20" stroke="currentColor" strokeWidth="1.2" />
        <line className="creature__slide-line creature__slide-line--2" x1="50" y1="26" x2="68" y2="26" stroke="currentColor" strokeWidth="1.2" />
        <line className="creature__slide-line creature__slide-line--3" x1="50" y1="32" x2="72" y2="32" stroke="currentColor" strokeWidth="1.2" />
        <line x1="46" y1="36" x2="78" y2="36" stroke="currentColor" strokeWidth="1.4" />
        <line x1="62" y1="36" x2="62" y2="42" stroke="currentColor" strokeWidth="1.4" />
        <g className="creature__person creature__person--present">
          <circle cx="22" cy="32" r="5" fill="currentColor" />
          <rect x="18" y="36" width="8" height="14" rx="2" fill="currentColor" />
          <line x1="22" y1="50" x2="18" y2="60" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="22" y1="50" x2="26" y2="60" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="19" y1="40" x2="14" y2="46" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line className="creature__arm-pointer" x1="25" y1="40" x2="44" y2="26" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      </svg>
    );
  } else if (kind === "teach") {
    body = (
      <svg viewBox="0 0 90 70" className="creature__svg" aria-hidden="true">
        <g className="creature__shadow"><ellipse cx="46" cy="64" rx="32" ry="3" /></g>
        <rect x="44" y="14" width="34" height="26" rx="2" fill="currentColor" opacity="0.18" />
        <rect x="44" y="14" width="34" height="26" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path className="creature__chalk creature__chalk--1" d="M48 22 q4 4 8 0 q4 -4 8 0" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path className="creature__chalk creature__chalk--2" d="M48 30 q3 -3 6 0 q3 3 6 0 q3 -3 6 0" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <g className="creature__person creature__person--teach">
          <circle cx="26" cy="30" r="5" fill="currentColor" />
          <rect x="22" y="34" width="8" height="14" rx="2" fill="currentColor" />
          <line x1="26" y1="48" x2="22" y2="58" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="26" y1="48" x2="30" y2="58" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="23" y1="38" x2="18" y2="44" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line className="creature__arm-write" x1="29" y1="38" x2="44" y2="32" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      </svg>
    );
  } else {
    // wave (default)
    body = (
      <svg viewBox="0 0 90 70" className="creature__svg" aria-hidden="true">
        <g className="creature__shadow"><ellipse cx="46" cy="64" rx="22" ry="3" /></g>
        <g className="creature__person creature__person--wave">
          <circle cx="46" cy="22" r="6" fill="currentColor" />
          <rect x="40" y="28" width="12" height="18" rx="2" fill="currentColor" />
          <line x1="46" y1="46" x2="40" y2="60" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="46" y1="46" x2="52" y2="60" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="40" y1="32" x2="34" y2="42" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <g className="creature__wave-arm">
            <line x1="52" y1="32" x2="60" y2="20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="60" cy="18" r="2" fill="currentColor" />
          </g>
        </g>
      </svg>
    );
  }

  return (
    <span className={cls} style={styleVars} aria-hidden="true">
      {body}
    </span>
  );
}

function SectionTitle({ num, eyebrow, title, lead }) {
  return (
    <div className="reveal">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="h-section">{title}</h2>
        </div>
        <div className="section-title-row__num">{num}</div>
      </div>
      {lead && <p style={{ color: "var(--ink-soft)", maxWidth: 720, marginBottom: 32 }}>{lead}</p>}
    </div>
  );
}

function HeroConnectWorkflow({ data, onJump }) {
  const workflowLinks = [
    {
      label: "Email",
      url: "mailto:" + data.profile.email,
      meta: "reply first",
      accent: true,
    },
    {
      label: "LinkedIn",
      url: "https://www.linkedin.com/in/namit-shrivastava-baab47204/",
      meta: "network",
    },
    {
      label: "GitHub",
      url: "https://github.com/namo507",
      meta: "code",
    },
    {
      label: "Scholar",
      url: "https://scholar.google.com/citations?user=7bvTB-sAAAAJ&hl=en",
      meta: "papers",
    },
  ];

  return (
    <div className="hero-connect card reveal">
      <div className="hero-connect__header">
        <div>
          <p className="eyebrow">Connect workflow</p>
          <h3 className="h-card hero-connect__title">Follow the signal, not the scavenger hunt.</h3>
        </div>
        <button className="hero-connect__jump" onClick={() => onJump("contact")}>Open contact</button>
      </div>

      <p className="hero-connect__copy">Start with email, then branch into code, papers, or the professional internet.</p>

      <div className="hero-connect__map">
        <svg className="hero-connect__svg" viewBox="0 0 520 280" aria-hidden="true" preserveAspectRatio="none">
          <defs>
            <linearGradient id="workflow-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(127,230,210,0.12)" />
              <stop offset="45%" stopColor="rgba(127,230,210,0.9)" />
              <stop offset="100%" stopColor="rgba(168,197,255,0.75)" />
            </linearGradient>
          </defs>
          <path d="M 110 140 C 170 140, 208 92, 298 70" />
          <path d="M 110 140 C 170 140, 208 128, 298 116" />
          <path d="M 110 140 C 170 140, 208 164, 298 164" />
          <path d="M 110 140 C 170 140, 208 206, 298 210" />
          <circle cx="110" cy="140" r="9" />
        </svg>

        <div className="hero-connect__hub">
          <span className="hero-connect__hub-label">Start here</span>
          <strong>Connect</strong>
          <span className="hero-connect__hub-meta">survey + ML + applied systems</span>
        </div>

        {workflowLinks.map((link, index) => (
          <a
            key={link.label}
            className={"hero-connect__node hero-connect__node--" + (index + 1) + (link.accent ? " hero-connect__node--accent" : "")}
            href={link.url}
            target={link.url.startsWith("mailto:") ? undefined : "_blank"}
            rel={link.url.startsWith("mailto:") ? undefined : "noopener"}
          >
            <span className="hero-connect__node-label">{link.label}</span>
            <span className="hero-connect__node-meta">{link.meta}</span>
          </a>
        ))}
      </div>

      <div className="hero-connect__footer">
        <span>{data.profile.location}</span>
        <span>{data.profile.phone}</span>
      </div>
    </div>
  );
}

// ── Sections ────────────────────────────────────────────────────────────────
function Hero({ data, onJump }) {
  const word = useTypewriter(data.profile.typingWords);
  return (
    <section id="home" className="section">
      <div className="section__container">
        <div className="hero">
          <div className="reveal">
            <p className="eyebrow">{data.profile.eyebrow}</p>
            <p className="hero__typer">
              <span style={{ color: "var(--ink-mute)" }}>Currently building&nbsp;</span>
              <b>{word}</b>
              <span className="cursor" />
            </p>
            <h1 className="h-display">{data.profile.headline}</h1>
            <p className="hero__lead">{data.profile.summary}</p>
            <div className="btn-row">
              <button className="btn btn--primary" onClick={() => onJump("cv")}>View CV →</button>
              <button className="btn" onClick={() => onJump("publications")}>Publications</button>
              <button className="btn" onClick={() => onJump("projects")}>Projects</button>
              <a className="btn" href={data.github.profileUrl} target="_blank" rel="noopener">GitHub ↗</a>
            </div>
            <div className="metric-grid">
              {data.metrics.map((m, i) => <Metric key={i} v={m.value} k={m.label} />)}
            </div>
          </div>

          <div className="hero__visuals">
            <div className="orb-stage reveal">
              <div className="orb-ring"><div className="orb-ring__node" style={{"--col":"#69d7c3"}} /></div>
              <div className="orb-ring orb-ring--2"><div className="orb-ring__node" style={{"--col":"#8fb6ff", left:"30%"}} /></div>
              <div className="orb-ring orb-ring--3"><div className="orb-ring__node" style={{"--col":"#f1b76a", left:"70%"}} /></div>
              <div className="orb orb--core" />
              <div className="orb" style={{ "--col": "#8fb6ff", inset: "5% 70% 70% 5%", animationDelay: "-3s" }} />
              <div className="orb" style={{ "--col": "#f1b76a", inset: "65% 8% 12% 70%", animationDelay: "-7s" }} />
              <div className="orb" style={{ "--col": "#ff8a9b", inset: "55% 65% 18% 18%", animationDelay: "-11s" }} />
            </div>
            <HeroConnectWorkflow data={data} onJump={onJump} />
          </div>
        </div>

        {/* Ribbon */}
        <div className="ribbon">
          <div className="ribbon__track">
            {[...data.profile.typingWords, "Survey-aware AI", "Causal inference", "Geospatial epidemiology", "Privacy-preserving deployment", ...data.profile.typingWords].map((w, i) => (
              <React.Fragment key={i}>
                <span style={{color: i % 2 ? "var(--accent-warm)" : "var(--accent)"}}>● {w}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* interests cloud */}
        <div className="reveal" style={{ marginTop: 18 }}>
          <p className="eyebrow">Research interests</p>
          <div>{data.interests.map((i) => <Tag key={i}>{i}</Tag>)}</div>
        </div>
      </div>
    </section>
  );
}

function CVSection({ data }) {
  return (
    <section id="cv" className="section">
      <div className="section__container">
        <SectionTitle num="01" eyebrow="Curriculum Vitae" title="Experience, education, results, and skills." lead="Quantified outcomes across research, infrastructure, public health, and ML engineering." />

        {/* Impact */}
        <div className="grid-4 reveal">
          {data.results.map((r, i) => {
            const c = ["#69d7c3","#8fb6ff","#f1b76a","#ff8a9b"][i];
            return (
              <div className="card" key={i}>
                <span className="card__circle" style={{"--col": c}} />
                <p className="card__meta">Impact</p>
                <div className="metric__v" style={{fontSize:36}}>{r.metric}</div>
                <h3 className="h-card" style={{marginTop:8}}>{r.title}</h3>
                <p className="card__sub">{r.detail}</p>
                <TileCreature kind="chart" color={c} delay={i * 0.18} />
              </div>
            );
          })}
        </div>

        {/* Experience timeline */}
        <h3 className="h-card reveal" style={{marginTop:48, marginBottom:16, fontSize:22}}>Professional Experience</h3>
        <div className="grid-2">
          {data.experience.map((r, i) => {
            const c = ["#69d7c3","#8fb6ff","#f1b76a","#ff8a9b","#bcd86c","#c8a4ff"][i % 6];
            return (
              <div className="card reveal" key={i}>
                <span className="card__circle" style={{"--col": c}} />
                <p className="card__meta">{r.dates} · {r.location}</p>
                <h4 className="h-card">{r.role}</h4>
                <p className="card__sub" style={{color:"var(--accent)"}}>{r.org}</p>
                <ul className="card__bullets">
                  {r.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
                <TileCreature kind="desk" color={c} delay={i * 0.22} />
              </div>
            );
          })}
        </div>

        {/* Skills */}
        <h3 className="h-card reveal" style={{marginTop:48, marginBottom:16, fontSize:22}}>Technical Skills</h3>
        <div className="grid-2">
          {data.skills.map((s, i) => {
            const c = ["#69d7c3","#8fb6ff","#f1b76a","#ff8a9b","#bcd86c","#c8a4ff","#7ad6ff"][i % 7];
            return (
              <div className="skill reveal" key={s.name}>
                <span className="card__circle" style={{"--col": c}} />
                <div className="skill__head">
                  <div>
                    <div className="skill__tier">{s.tier}</div>
                    <div className="h-card" style={{marginTop:4}}>{s.name}</div>
                  </div>
                  <div className="metric__v" style={{fontSize:24, color: s.featured ? "var(--accent)" : "var(--ink)"}}>{s.score}%</div>
                </div>
                <p className="card__sub">{s.summary}</p>
                <div className="skill__bar"><div className="skill__fill" style={{"--w": s.score/100}} /></div>
                <div>{s.tools.map((t) => <Tag key={t}>{t}</Tag>)}</div>
                <TileCreature kind="gear" color={c} delay={i * 0.15} />
              </div>
            );
          })}
        </div>

        {/* Education */}
        <h3 className="h-card reveal" style={{marginTop:48, marginBottom:16, fontSize:22}}>Education</h3>
        <div className="grid-2">
          {data.education.map((e, i) => {
            const c = ["#8fb6ff","#f1b76a"][i];
            return (
              <div className="card reveal" key={i}>
                <span className="card__circle" style={{"--col": c}} />
                <p className="card__meta">{e.dates} · {e.location}</p>
                <h4 className="h-card">{e.degree}</h4>
                <p className="card__sub" style={{color:"var(--accent)"}}>{e.institution}</p>
                <div style={{marginTop:10}}>{e.highlights.map((h) => <Tag key={h} accent>{h}</Tag>)}</div>
                <div style={{marginTop:10}}>{e.coursework.map((c2) => <Tag key={c2}>{c2}</Tag>)}</div>
                <TileCreature kind="read" color={c} delay={i * 0.3} />
              </div>
            );
          })}
        </div>

        {/* Achievements + Service */}
        <div className="grid-2 reveal" style={{marginTop:48}}>
          <div className="card">
            <p className="card__meta">Achievements</p>
            <ul className="card__bullets">{data.achievements.map((a) => <li key={a}>{a}</li>)}</ul>
            <TileCreature kind="wave" color="#bcd86c" delay={0} />
          </div>
          <div className="card">
            <p className="card__meta">Service & Leadership</p>
            <ul className="card__bullets">
              {data.service.map((s) => <li key={s.org}><b>{s.role}</b> · {s.org} <span style={{color:"var(--ink-mute)"}}>({s.dates})</span><br/>{s.note}</li>)}
            </ul>
            <TileCreature kind="wave" color="#c8a4ff" delay={0.4} />
          </div>
        </div>

        <div className="btn-row reveal" style={{marginTop:32}}>
          <a className="btn btn--primary" href={data.profile.pdfUrl} target="_blank" rel="noopener">Download PDF CV</a>
          <a className="btn" href={"mailto:" + data.profile.email}>Email</a>
        </div>
      </div>
    </section>
  );
}

function PublicationsSection({ data }) {
  return (
    <section id="publications" className="section">
      <div className="section__container">
        <SectionTitle num="02" eyebrow="Research Output" title="Publications, papers, and scholarly work." lead="Peer-reviewed and conference research at the intersection of survey methodology, NLP, and applied AI." />
        <div className="grid-2">
          {data.publications.map((p, i) => {
            const c = ["#8fb6ff","#ff8a9b"][i];
            return (
              <a className="card reveal" key={i} href={p.url} target="_blank" rel="noopener" style={{display:"block"}}>
                <span className="card__circle" style={{"--col": c}} />
                <p className="card__meta">{p.category} · {p.date}</p>
                <h3 className="h-card">{p.title}</h3>
                <p className="card__sub" style={{color:"var(--accent)"}}>{p.venue}</p>
                <p className="card__sub" style={{marginTop:10}}>{p.excerpt}</p>
                <div className="grid-3" style={{marginTop:16, gap:8}}>
                  {p.stats.map((s) => (
                    <div key={s.k} style={{padding:"10px 12px", background:"rgba(255,255,255,0.04)", borderRadius:12}}>
                      <div className="metric__v" style={{fontSize:22, color:"var(--accent-cool)"}}>{s.v}</div>
                      <div className="metric__k">{s.k}</div>
                    </div>
                  ))}
                </div>
                <p style={{marginTop:14, color:"var(--ink-mute)", fontSize:12, fontFamily:"var(--mono)"}}>{p.citation}</p>
                <div style={{marginTop:14, color:"var(--accent)"}}>Read paper ↗</div>
                <TileCreature kind="paper" color={c} delay={i * 0.35} />
              </a>
            );
          })}
        </div>

        <div className="btn-row reveal" style={{marginTop:24}}>
          <a className="btn btn--primary" href="https://scholar.google.com/citations?user=7bvTB-sAAAAJ&hl=en" target="_blank" rel="noopener">Google Scholar ↗</a>
          <a className="btn" href="https://orcid.org/0009-0005-7920-8350" target="_blank" rel="noopener">ORCID ↗</a>
        </div>
      </div>
    </section>
  );
}

function ProjectsSection({ data }) {
  const [filter, setFilter] = useState("All");
  const tags = useMemo(() => {
    const set = new Set(["All"]);
    data.projects.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return [...set].slice(0, 10);
  }, [data.projects]);
  const visible = filter === "All" ? data.projects : data.projects.filter((p) => p.tags.includes(filter));
  const colors = ["#69d7c3","#8fb6ff","#f1b76a","#ff8a9b","#bcd86c","#c8a4ff","#7ad6ff"];

  return (
    <section id="projects" className="section">
      <div className="section__container">
        <SectionTitle num="03" eyebrow="Selected Work" title="Projects spanning ML, methodology, and engineering." lead="20 selected projects from graduate research, undergraduate work, and applied builds. Click through for code or LinkedIn writeups." />

        <div className="reveal" style={{marginBottom:24}}>
          {tags.map((t) => (
            <button key={t} className="tag" onClick={() => setFilter(t)}
              style={{cursor:"pointer", background: filter===t? "var(--accent)":"rgba(255,255,255,0.06)", color: filter===t? "#06120f":"var(--ink-soft)", borderColor: filter===t? "var(--accent)":"var(--line)", padding:"6px 12px", marginRight:6}}>
              {t}
            </button>
          ))}
        </div>

        <div className="project-grid">
          {visible.map((p, i) => {
            const c = colors[i % colors.length];
            return (
              <a className="project reveal" key={p.id} href={p.url} target="_blank" rel="noopener">
                <span className="project__circle" style={{"--col": c, "--ang": (i*48)+"deg"}} />
                <p className="project__id">PROJECT · {p.id}</p>
                <h3 className="h-card" style={{marginTop:10}}>{p.title}</h3>
                <p className="card__meta" style={{marginTop:6}}>{p.type} · {p.date} · {p.venue}</p>
                <p className="card__sub" style={{marginTop:10}}>{p.excerpt}</p>
                <div style={{marginTop:14}}>{p.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>
                <div style={{marginTop:14, color:"var(--accent)", fontSize:13, fontFamily:"var(--display)"}}>Open ↗</div>
                <TileCreature kind="build" color={c} delay={(i % 5) * 0.18} />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function GitHubSection({ data }) {
  const g = data.github;
  return (
    <section id="github" className="section">
      <div className="section__container">
        <SectionTitle num="04" eyebrow="Code Portfolio" title="Public repositories, automation workflows, and starred builds." lead="Repository showcase across research code, NLP, multilevel modeling, automation prototypes, and the source for this very site." />

        <div className="metric-grid reveal">
          {g.stats.map((s) => <Metric key={s.k} v={s.v} k={s.k} color="var(--accent-cool)" />)}
        </div>

        <div className="grid-2 reveal" style={{marginTop:32}}>
          <div className="card">
            <p className="card__meta">Language Mix</p>
            <div style={{marginTop:10}}>
              {g.languageMix.map((l) => <Tag key={l.lang}>{l.lang} · {l.count}</Tag>)}
            </div>
            <TileCreature kind="gear" color="#7ad6ff" delay={0} />
          </div>
          <div className="card">
            <p className="card__meta">What this code covers</p>
            <ul className="card__bullets">
              <li>Research pipelines: survey methodology, NLP, multilevel modeling, public opinion analysis.</li>
              <li>Applied AI prototypes: Office add-ins, n8n workflows, simulation frameworks.</li>
              <li>Repository docs that link source code back to portfolio work and CV artifacts.</li>
            </ul>
            <TileCreature kind="commit" color="#c8a4ff" delay={0.4} />
          </div>
        </div>

        <h3 className="h-card reveal" style={{marginTop:40, marginBottom:14, fontSize:22}}>Featured Repositories</h3>
        <div className="grid-3">
          {g.featured.map((r, i) => {
            const c = ["#69d7c3","#8fb6ff","#f1b76a","#ff8a9b","#bcd86c","#c8a4ff","#7ad6ff"][i % 7];
            return (
              <a className="repo reveal" key={r.name} href={r.url} target="_blank" rel="noopener">
                <span className="card__circle" style={{"--col": c}} />
                <p className="repo__lang">● {r.lang}</p>
                <h4 className="repo__name">{r.name}</h4>
                <p className="repo__desc">{r.desc}</p>
                <div className="repo__metric"><b>{r.metric}</b> {r.metricLabel}</div>
                <TileCreature kind="commit" color={c} delay={i * 0.2} />
              </a>
            );
          })}
        </div>

        <h3 className="h-card reveal" style={{marginTop:40, marginBottom:14, fontSize:22}}>Recently Updated</h3>
        <div className="grid-4">
          {g.recent.map((r) => (
            <a className="repo reveal" key={r.name} href={r.url} target="_blank" rel="noopener">
              <p className="repo__lang">● {r.lang}</p>
              <h4 className="repo__name" style={{fontSize:15}}>{r.name}</h4>
              <p className="card__meta" style={{marginTop:8}}>{r.updated}</p>
            </a>
          ))}
        </div>

        <div className="btn-row reveal" style={{marginTop:32}}>
          <a className="btn btn--primary" href={g.profileUrl} target="_blank" rel="noopener">@namo507 on GitHub ↗</a>
          <a className="btn" href={g.reposUrl} target="_blank" rel="noopener">All repositories</a>
          <a className="btn" href={g.starredUrl} target="_blank" rel="noopener">Starred spotlight</a>
        </div>
      </div>
    </section>
  );
}

function LinkedInSection({ data }) {
  const linkedin = data.linkedin;
  if (!linkedin) return null;
  const sourceView = getLinkedInSourceView(linkedin.meta);

  return (
    <section id="linkedin-signals" className="section">
      <div className="section__container">
        <SectionTitle
          num="05"
          eyebrow={sourceView.eyebrow}
          title={sourceView.title}
          lead={sourceView.lead}
        />

        <div className="grid-2">
          <div className="card linkedin-card linkedin-card--hero reveal" style={{display:"flex", flexDirection:"column"}}>
            <div className="linkedin-card__eyebrow-row">
              <p className="card__meta">{sourceView.snapshotLabel}</p>
              <span className="linkedin-card__badge">{sourceView.badge}</span>
            </div>
            <h3 className="h-card">{linkedin.profile.headline_short}</h3>
            <p className="linkedin-card__summary">{linkedin.profile.about_short}</p>
            <p className="linkedin-card__source-note">{sourceView.note}</p>
            <div className="linkedin-card__tags">
              {(linkedin.profile.top_skills || []).slice(0, 6).map((skill) => <Tag key={skill}>{skill}</Tag>)}
            </div>
            <p className="linkedin-card__meta-line">
              {[linkedin.profile.current_role, linkedin.profile.organization, linkedin.profile.location].filter(Boolean).join(" · ")}
            </p>
            <p className="linkedin-card__meta-line linkedin-card__meta-line--secondary">{sourceView.metaLine}</p>
            <div className="btn-row linkedin-card__actions">
              <a className="btn btn--primary" href={linkedin.profile.profile_url} target="_blank" rel="noopener">Open LinkedIn ↗</a>
            </div>
          </div>

          <div className="card linkedin-card reveal" style={{display:"flex", flexDirection:"column"}}>
            <div className="linkedin-card__eyebrow-row">
              <p className="card__meta">{sourceView.updatesLabel}</p>
              <span className="linkedin-card__badge linkedin-card__badge--muted">{linkedin.updates.length} cards</span>
            </div>
            <div className="linkedin-card__stack">
              {linkedin.updates.length ? linkedin.updates.map((item) => (
                <a className="linkedin-card__item" key={item.id} href={item.canonical_url || linkedin.profile.profile_url} target="_blank" rel="noopener">
                  <span>{item.posted_relative || item.kind}</span>
                  <strong>{item.title}</strong>
                  <p>{item.summary_short}</p>
                </a>
              )) : (
                <p className="linkedin-card__empty">{sourceView.seeded ? "The curated snapshot is live, but no highlight cards were defined in the current seed data." : "Validated LinkedIn data is available, but the public profile did not expose recent activity cards on the last successful sync."}</p>
              )}
            </div>
          </div>
        </div>

        {linkedin.experience.length ? (
          <>
            <h3 className="h-card reveal" style={{marginTop:40, marginBottom:14, fontSize:22}}>{sourceView.experienceLabel}</h3>
            <div className="grid-2">
              {linkedin.experience.map((item) => (
                <div className="card linkedin-card reveal" key={item.id}>
                  <p className="card__meta">{[item.date_range, item.location].filter(Boolean).join(" · ")}</p>
                  <h3 className="h-card">{item.role}</h3>
                  <p className="card__sub" style={{color:"var(--accent)"}}>{item.organization}</p>
                  <ul className="card__bullets">
                    {(item.bullets && item.bullets.length ? item.bullets : [item.description_short]).slice(0, 2).map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                  {item.canonical_url ? <div className="btn-row linkedin-card__actions"><a className="btn" href={item.canonical_url} target="_blank" rel="noopener">Open source item ↗</a></div> : null}
                </div>
              ))}
            </div>
          </>
        ) : null}

        {linkedin.featured.length ? (
          <>
            <h3 className="h-card reveal" style={{marginTop:40, marginBottom:14, fontSize:22}}>{sourceView.featuredLabel}</h3>
            <div className="grid-2">
              {linkedin.featured.map((item) => (
                <a className="card linkedin-card reveal" key={item.id} href={item.url || linkedin.profile.profile_url} target="_blank" rel="noopener" style={{display:"flex", flexDirection:"column"}}>
                  <p className="card__meta">{[item.type, item.subtitle].filter(Boolean).join(" · ")}</p>
                  <h3 className="h-card">{item.title}</h3>
                  <p className="linkedin-card__summary">{item.summary_short}</p>
                  <div className="linkedin-card__open">Open item ↗</div>
                </a>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function TalksSection({ data }) {
  return (
    <section id="talks" className="section">
      <div className="section__container">
        <SectionTitle num="06" eyebrow="Talks & Presentations" title="Communicating research methods and technical results." lead="Conference presentations translating transformer-based methods, sentiment analysis, and survey workflows." />

        <div className="grid-2">
          {data.talks.map((t, i) => (
            <a className="card reveal" key={i} href={t.url} target="_blank" rel="noopener" style={{display:"block"}}>
              <span className="card__circle" style={{"--col": "#ff8a9b"}} />
              <p className="card__meta">{t.type} · {t.date} · {t.location}</p>
              <h3 className="h-card">{t.title}</h3>
              <p className="card__sub" style={{color:"var(--accent-pop)"}}>{t.venue}</p>
              <p className="card__sub" style={{marginTop:12}}>{t.excerpt}</p>
              <div style={{marginTop:14, color:"var(--accent-pop)"}}>Conference page ↗</div>
              <TileCreature kind="present" color="#ff8a9b" delay={i * 0.25} />
            </a>
          ))}
          <div className="card reveal" style={{display:"flex",flexDirection:"column",justifyContent:"center"}}>
            <p className="card__meta">Snapshot</p>
            <h3 className="h-card">{data.talks.length} talk · 1 distinct venue · 2025</h3>
            <p className="card__sub">Most recent presentation: AAPOR 2025, St. Louis, MO. Looking ahead to AAPOR 2026 and methods workshops in 2026.</p>
            <TileCreature kind="chart" color="#a8c5ff" delay={0.5} />
          </div>
        </div>
      </div>
    </section>
  );
}

function TeachingSection({ data }) {
  return (
    <section id="teaching" className="section">
      <div className="section__container">
        <SectionTitle num="07" eyebrow="Teaching Practice" title="Course delivery, privacy instruction, and academic infrastructure." lead="Teaching and graduate-assistantship work across the Joint Program in Survey Methodology (JPSM) at the University of Maryland." />

        <div className="grid-2">
          {data.teaching.map((t, i) => {
            const c = ["#bcd86c","#c8a4ff"][i];
            return (
              <div className="card reveal" key={i}>
                <span className="card__circle" style={{"--col": c}} />
                <p className="card__meta">{t.type} · {t.date}</p>
                <h3 className="h-card">{t.title}</h3>
                <p className="card__sub" style={{color:"var(--accent)"}}>{t.venue}</p>
                <p className="card__sub" style={{marginTop:10}}>{t.excerpt}</p>
                <ul className="card__bullets">{t.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
                <TileCreature kind="teach" color={c} delay={i * 0.3} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ContactSection({ data }) {
  const linkedinUrl = data.linkedin?.profile?.profile_url || "https://www.linkedin.com/in/namit-shrivastava-baab47204/";
  return (
    <section id="contact" className="section" style={{paddingBottom: 120}}>
      <div className="section__container">
        <SectionTitle num="08" eyebrow="Get in touch" title="Good work usually starts with a sharp hello." />

        <div className="contact-card reveal">
          <p className="eyebrow">Connect</p>
          <h2 className="h-section" style={{maxWidth:780}}>Bring survey puzzles, ML tangles, geospatial detours, or just a well-aimed note.</h2>
          <div className="btn-row" style={{marginTop:18}}>
            <a className="btn btn--primary" href={"mailto:"+data.profile.email}>Email · {data.profile.email}</a>
            <a className="btn" href={linkedinUrl} target="_blank" rel="noopener">LinkedIn ↗</a>
            <a className="btn" href="https://github.com/namo507" target="_blank" rel="noopener">GitHub ↗</a>
            <a className="btn" href="https://scholar.google.com/citations?user=7bvTB-sAAAAJ&hl=en" target="_blank" rel="noopener">Google Scholar ↗</a>
            <a className="btn" href="https://orcid.org/0009-0005-7920-8350" target="_blank" rel="noopener">ORCID ↗</a>
          </div>
          <p style={{marginTop:30, color:"var(--ink-mute)", fontSize:13, fontFamily:"var(--mono)"}}>{data.profile.location} · {data.profile.phone}</p>
          <TileCreature kind="wave" color="#7fe6d2" delay={0.2} />
        </div>

        <p style={{marginTop:60, color:"var(--ink-mute)", fontSize:12, fontFamily:"var(--mono)", textAlign:"center"}}>
          © 2026 Namit Shrivastava · <a href="/classic/" style={{color:"var(--accent)"}}>Classic view</a> · <a href="https://github.com/namo507/namo507.github.io" target="_blank" rel="noopener" style={{color:"var(--accent)"}}>Source ↗</a>
        </p>
      </div>
    </section>
  );
}

// ── Top-level App ───────────────────────────────────────────────────────────
function App() {
  const data = useMemo(() => mergeLinkedInIntoSite(window.SITE, window.LINKEDIN_SYNC), []);
  const navIds = data.navigation.map((n) => n.id);
  const active = useActiveSection(navIds);
  useReveal();

  const jump = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 60, behavior: "smooth" });
  }, []);

  return (
    <>
      <nav className="nav">
        <div className="nav__brand">
          <div className={"nav__brand-mark" + (data.profile.avatarUrl ? " nav__brand-mark--photo" : "") }>
            {data.profile.avatarUrl ? (
              <img
                src={data.profile.avatarUrl}
                alt={data.profile.name + " profile portrait"}
                loading="eager"
                fetchpriority="high"
              />
            ) : null}
          </div>
          <div className="nav__brand-text">Namit Shrivastava <span>· Survey Methodology · Data Science</span></div>
        </div>
        <div className="nav__links">
          {data.navigation.map((n) => (
            <button key={n.id}
              className={"nav__link" + (active === n.id ? " nav__link--active" : "")}
              onClick={() => jump(n.id)}>{n.label}</button>
          ))}
        </div>
        <a className="nav__cta" href={data.profile.pdfUrl} target="_blank" rel="noopener">Download CV</a>
      </nav>

      <Hero data={data} onJump={jump} />
      <CVSection data={data} />
      <PublicationsSection data={data} />
      <ProjectsSection data={data} />
      <GitHubSection data={data} />
      <LinkedInSection data={data} />
      <TalksSection data={data} />
      <TeachingSection data={data} />
      <ContactSection data={data} />
    </>
  );
}

const mountApp = () => {
  const root = ReactDOM.createRoot(document.getElementById("app"));
  root.render(<App />);
};

const linkedInSyncReady = window.LINKEDIN_SYNC_READY;
if (linkedInSyncReady && typeof linkedInSyncReady.then === "function") {
  linkedInSyncReady.finally(mountApp);
} else {
  mountApp();
}
