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

          <div className="orb-stage reveal">
            <div className="orb-ring"><div className="orb-ring__node" style={{"--col":"#69d7c3"}} /></div>
            <div className="orb-ring orb-ring--2"><div className="orb-ring__node" style={{"--col":"#8fb6ff", left:"30%"}} /></div>
            <div className="orb-ring orb-ring--3"><div className="orb-ring__node" style={{"--col":"#f1b76a", left:"70%"}} /></div>
            <div className="orb orb--core" />
            <div className="orb" style={{ "--col": "#8fb6ff", inset: "5% 70% 70% 5%", animationDelay: "-3s" }} />
            <div className="orb" style={{ "--col": "#f1b76a", inset: "65% 8% 12% 70%", animationDelay: "-7s" }} />
            <div className="orb" style={{ "--col": "#ff8a9b", inset: "55% 65% 18% 18%", animationDelay: "-11s" }} />
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
          {data.results.map((r, i) => (
            <div className="card" key={i}>
              <span className="card__circle" style={{"--col": ["#69d7c3","#8fb6ff","#f1b76a","#ff8a9b"][i]}} />
              <p className="card__meta">Impact</p>
              <div className="metric__v" style={{fontSize:36}}>{r.metric}</div>
              <h3 className="h-card" style={{marginTop:8}}>{r.title}</h3>
              <p className="card__sub">{r.detail}</p>
            </div>
          ))}
        </div>

        {/* Experience timeline */}
        <h3 className="h-card reveal" style={{marginTop:48, marginBottom:16, fontSize:22}}>Professional Experience</h3>
        <div className="grid-2">
          {data.experience.map((r, i) => (
            <div className="card reveal" key={i}>
              <span className="card__circle" style={{"--col": ["#69d7c3","#8fb6ff","#f1b76a","#ff8a9b","#bcd86c","#c8a4ff"][i % 6]}} />
              <p className="card__meta">{r.dates} · {r.location}</p>
              <h4 className="h-card">{r.role}</h4>
              <p className="card__sub" style={{color:"var(--accent)"}}>{r.org}</p>
              <ul className="card__bullets">
                {r.bullets.map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            </div>
          ))}
        </div>

        {/* Skills */}
        <h3 className="h-card reveal" style={{marginTop:48, marginBottom:16, fontSize:22}}>Technical Skills</h3>
        <div className="grid-2">
          {data.skills.map((s, i) => (
            <div className="skill reveal" key={s.name}>
              <span className="card__circle" style={{"--col": ["#69d7c3","#8fb6ff","#f1b76a","#ff8a9b","#bcd86c","#c8a4ff","#7ad6ff"][i % 7]}} />
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
            </div>
          ))}
        </div>

        {/* Education */}
        <h3 className="h-card reveal" style={{marginTop:48, marginBottom:16, fontSize:22}}>Education</h3>
        <div className="grid-2">
          {data.education.map((e, i) => (
            <div className="card reveal" key={i}>
              <span className="card__circle" style={{"--col": ["#8fb6ff","#f1b76a"][i]}} />
              <p className="card__meta">{e.dates} · {e.location}</p>
              <h4 className="h-card">{e.degree}</h4>
              <p className="card__sub" style={{color:"var(--accent)"}}>{e.institution}</p>
              <div style={{marginTop:10}}>{e.highlights.map((h) => <Tag key={h} accent>{h}</Tag>)}</div>
              <div style={{marginTop:10}}>{e.coursework.map((c) => <Tag key={c}>{c}</Tag>)}</div>
            </div>
          ))}
        </div>

        {/* Achievements + Service */}
        <div className="grid-2 reveal" style={{marginTop:48}}>
          <div className="card">
            <p className="card__meta">Achievements</p>
            <ul className="card__bullets">{data.achievements.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
          <div className="card">
            <p className="card__meta">Service & Leadership</p>
            <ul className="card__bullets">
              {data.service.map((s) => <li key={s.org}><b>{s.role}</b> · {s.org} <span style={{color:"var(--ink-mute)"}}>({s.dates})</span><br/>{s.note}</li>)}
            </ul>
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
          {data.publications.map((p, i) => (
            <a className="card reveal" key={i} href={p.url} target="_blank" rel="noopener" style={{display:"block"}}>
              <span className="card__circle" style={{"--col": ["#8fb6ff","#ff8a9b"][i]}} />
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
            </a>
          ))}
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
          {visible.map((p, i) => (
            <a className="project reveal" key={p.id} href={p.url} target="_blank" rel="noopener">
              <span className="project__circle" style={{"--col": colors[i % colors.length], "--ang": (i*48)+"deg"}} />
              <p className="project__id">PROJECT · {p.id}</p>
              <h3 className="h-card" style={{marginTop:10}}>{p.title}</h3>
              <p className="card__meta" style={{marginTop:6}}>{p.type} · {p.date} · {p.venue}</p>
              <p className="card__sub" style={{marginTop:10}}>{p.excerpt}</p>
              <div style={{marginTop:14}}>{p.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>
              <div style={{marginTop:14, color:"var(--accent)", fontSize:13, fontFamily:"var(--display)"}}>Open ↗</div>
            </a>
          ))}
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
          </div>
          <div className="card">
            <p className="card__meta">What this code covers</p>
            <ul className="card__bullets">
              <li>Research pipelines: survey methodology, NLP, multilevel modeling, public opinion analysis.</li>
              <li>Applied AI prototypes: Office add-ins, n8n workflows, simulation frameworks.</li>
              <li>Repository docs that link source code back to portfolio work and CV artifacts.</li>
            </ul>
          </div>
        </div>

        <h3 className="h-card reveal" style={{marginTop:40, marginBottom:14, fontSize:22}}>Featured Repositories</h3>
        <div className="grid-3">
          {g.featured.map((r, i) => (
            <a className="repo reveal" key={r.name} href={r.url} target="_blank" rel="noopener">
              <span className="card__circle" style={{"--col": ["#69d7c3","#8fb6ff","#f1b76a","#ff8a9b","#bcd86c","#c8a4ff","#7ad6ff"][i % 7]}} />
              <p className="repo__lang">● {r.lang}</p>
              <h4 className="repo__name">{r.name}</h4>
              <p className="repo__desc">{r.desc}</p>
              <div className="repo__metric"><b>{r.metric}</b> {r.metricLabel}</div>
            </a>
          ))}
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

function TalksSection({ data }) {
  return (
    <section id="talks" className="section">
      <div className="section__container">
        <SectionTitle num="05" eyebrow="Talks & Presentations" title="Communicating research methods and technical results." lead="Conference presentations translating transformer-based methods, sentiment analysis, and survey workflows." />

        <div className="grid-2">
          {data.talks.map((t, i) => (
            <a className="card reveal" key={i} href={t.url} target="_blank" rel="noopener" style={{display:"block"}}>
              <span className="card__circle" style={{"--col": "#ff8a9b"}} />
              <p className="card__meta">{t.type} · {t.date} · {t.location}</p>
              <h3 className="h-card">{t.title}</h3>
              <p className="card__sub" style={{color:"var(--accent-pop)"}}>{t.venue}</p>
              <p className="card__sub" style={{marginTop:12}}>{t.excerpt}</p>
              <div style={{marginTop:14, color:"var(--accent-pop)"}}>Conference page ↗</div>
            </a>
          ))}
          <div className="card reveal" style={{display:"flex",flexDirection:"column",justifyContent:"center"}}>
            <p className="card__meta">Snapshot</p>
            <h3 className="h-card">{data.talks.length} talk · 1 distinct venue · 2025</h3>
            <p className="card__sub">Most recent presentation: AAPOR 2025, St. Louis, MO. Looking ahead to AAPOR 2026 and methods workshops in 2026.</p>
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
        <SectionTitle num="06" eyebrow="Teaching Practice" title="Course delivery, privacy instruction, and academic infrastructure." lead="Teaching and graduate-assistantship work across the Joint Program in Survey Methodology (JPSM) at the University of Maryland." />

        <div className="grid-2">
          {data.teaching.map((t, i) => (
            <div className="card reveal" key={i}>
              <span className="card__circle" style={{"--col": ["#bcd86c","#c8a4ff"][i]}} />
              <p className="card__meta">{t.type} · {t.date}</p>
              <h3 className="h-card">{t.title}</h3>
              <p className="card__sub" style={{color:"var(--accent)"}}>{t.venue}</p>
              <p className="card__sub" style={{marginTop:10}}>{t.excerpt}</p>
              <ul className="card__bullets">{t.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection({ data }) {
  return (
    <section id="contact" className="section" style={{paddingBottom: 120}}>
      <div className="section__container">
        <SectionTitle num="07" eyebrow="Get in touch" title="Open to research collaboration, applied data science, and good conversations." />

        <div className="contact-card reveal">
          <p className="eyebrow">Connect</p>
          <h2 className="h-section" style={{maxWidth:780}}>Reach out for survey methodology, ML/NLP, geospatial work, or thoughtful research conversations.</h2>
          <div className="btn-row" style={{marginTop:18}}>
            <a className="btn btn--primary" href={"mailto:"+data.profile.email}>Email · {data.profile.email}</a>
            <a className="btn" href="https://www.linkedin.com/in/namit-shrivastava-baab47204/" target="_blank" rel="noopener">LinkedIn ↗</a>
            <a className="btn" href="https://github.com/namo507" target="_blank" rel="noopener">GitHub ↗</a>
            <a className="btn" href="https://scholar.google.com/citations?user=7bvTB-sAAAAJ&hl=en" target="_blank" rel="noopener">Google Scholar ↗</a>
            <a className="btn" href="https://orcid.org/0009-0005-7920-8350" target="_blank" rel="noopener">ORCID ↗</a>
          </div>
          <p style={{marginTop:30, color:"var(--ink-mute)", fontSize:13, fontFamily:"var(--mono)"}}>{data.profile.location} · {data.profile.phone}</p>
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
  const data = window.SITE;
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
                fetchPriority="high"
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
      <TalksSection data={data} />
      <TeachingSection data={data} />
      <ContactSection data={data} />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<App />);
