---
permalink: /
title: "Home"
excerpt: "Graduate researcher at the intersection of survey methodology, trustworthy AI, and computational social science."
author_profile: true
hide_title: true
hide_excerpt: true
redirect_from: 
  - /about/
  - /about.html
---

<section class="home-hero" data-reveal>
  <p class="page__eyebrow">Survey Methodology • Data Science • Responsible AI</p>
  <h1 class="home-hero__title">Designing rigorous measurement systems for AI-enabled research.</h1>
  <p class="home-hero__lead">{{ site.data.cv_site.profile.summary }}</p>

  <div class="page__actions">
    <a class="button-link button-link--primary" href="{{ '/cv/' | relative_url }}">View CV</a>
    <a class="button-link" href="{{ '/publications/' | relative_url }}">Publications</a>
    <a class="button-link" href="{{ '/portfolio/' | relative_url }}">Projects</a>
    <a class="button-link" href="{{ '/github/' | relative_url }}">GitHub</a>
  </div>

  <div class="hero-metrics">
    {% for metric in site.data.cv_site.hero_metrics %}
      <article class="metric-card">
        <span class="metric-card__value">{{ metric.value }}</span>
        <span class="metric-card__label">{{ metric.label }}</span>
      </article>
    {% endfor %}
  </div>
</section>

<section class="page__section" data-reveal>
  <p class="page__eyebrow">Links</p>
  <div class="social-link-grid">
    {% for link in site.data.cv_site.links %}
      <a class="social-link-card" href="{{ link.url }}"{% if link.url contains '://' or link.url contains 'mailto:' %} target="_blank" rel="noopener"{% endif %}>{{ link.label }}</a>
    {% endfor %}
  </div>
</section>

<section class="page__section page__section--split" data-reveal>
  <article class="page__panel page__panel--highlight focus-panel">
    <p class="page__eyebrow">Research Focus</p>
    <h2>Turning complex data pipelines into reliable measurement systems.</h2>
    <p class="focus-panel__lead">My work centers on building trustworthy data integration frameworks that connect survey methodology with modern AI systems, so automated collection, classification, and inference stay interpretable and empirically grounded.</p>

    <div class="focus-card-stack">
      <article class="focus-card" style="--focus-accent: #69d7c3; --reveal-delay: 80ms;" data-reveal>
        <span class="focus-card__step">01 • Collect</span>
        <h3>Survey-aware acquisition and quality control</h3>
        <p>Designing multimode collection systems, response-monitoring logic, and missing-data adjustment plans so inference starts from defensible measurement foundations.</p>
        <div class="focus-card__meta">
          <span>Survey design</span>
          <span>Missing data</span>
          <span>Quality assurance</span>
        </div>
      </article>

      <article class="focus-card" style="--focus-accent: #8fb6ff; --reveal-delay: 160ms;" data-reveal>
        <span class="focus-card__step">02 • Model</span>
        <h3>Large-scale spatial and social inference</h3>
        <p>Connecting administrative, geospatial, and behavioral signals into modeling pipelines that stay readable across public-health, survey, and computational social-science settings.</p>
        <div class="focus-card__meta">
          <span>Geospatial modeling</span>
          <span>Epidemiology</span>
          <span>Causal inference</span>
        </div>
      </article>

      <article class="focus-card" style="--focus-accent: #f1b76a; --reveal-delay: 240ms;" data-reveal>
        <span class="focus-card__step">03 • Govern</span>
        <h3>Responsible AI and privacy-preserving deployment</h3>
        <p>Embedding confidentiality, interpretability, and auditability into NLP and machine-learning systems so automation can scale without weakening measurement trust.</p>
        <div class="focus-card__meta">
          <span>Transformer NLP</span>
          <span>Privacy</span>
          <span>Responsible AI</span>
        </div>
      </article>
    </div>

    <div class="focus-signal-grid">
      <article class="focus-signal" style="--reveal-delay: 300ms;" data-reveal>
        <span class="focus-signal__value">18</span>
        <span class="focus-signal__label">datasets automated through CKAN lifecycle tooling</span>
      </article>
      <article class="focus-signal" style="--reveal-delay: 360ms;" data-reveal>
        <span class="focus-signal__value">129,572</span>
        <span class="focus-signal__label">census tracts integrated in public-data research</span>
      </article>
      <article class="focus-signal" style="--reveal-delay: 420ms;" data-reveal>
        <span class="focus-signal__value">1.1M+</span>
        <span class="focus-signal__label">social posts modeled in transformer sentiment work</span>
      </article>
    </div>
  </article>

  <article class="page__panel workflow-panel">
    <p class="page__eyebrow">Work + Education Snapshot</p>
    <h2>A compact pipeline from technical foundations to research systems delivery.</h2>
    <p class="workflow-panel__lead">This view compresses the education and work journey into a readable sequence so the homepage feels directional instead of list-driven.</p>

    <div class="workflow-pipeline">
      <article class="workflow-stage" style="--workflow-accent: #8fb6ff;" data-reveal>
        <span class="workflow-stage__step">01 • Quantitative foundation</span>
        <h3>{{ site.data.cv_site.education[1].institution }}</h3>
        <p>Built the base in engineering, statistics, and machine learning through a civil engineering degree with a data science minor.</p>
        <div class="workflow-stage__meta">
          <span>{{ site.data.cv_site.education[1].dates }}</span>
          <span>{{ site.data.cv_site.education[1].location }}</span>
        </div>
      </article>

      <article class="workflow-stage" style="--workflow-accent: #f1b76a;" data-reveal>
        <span class="workflow-stage__step">02 • Applied engineering</span>
        <h3>{{ site.data.cv_site.experience[3].organization }}</h3>
        <p>Moved into production-oriented ML and platform work across OCR, trademark similarity systems, API testing, and scalable automation.</p>
        <div class="workflow-stage__meta">
          <span>{{ site.data.cv_site.experience[3].role }}</span>
          <span>{{ site.data.cv_site.experience[3].dates }}</span>
        </div>
      </article>

      <article class="workflow-stage" style="--workflow-accent: #69d7c3;" data-reveal>
        <span class="workflow-stage__step">03 • Graduate methods depth</span>
        <h3>{{ site.data.cv_site.education[0].institution }}</h3>
        <p>Deepened survey methodology, data collection, and causal inference while also teaching privacy and confidentiality through JPSM.</p>
        <div class="workflow-stage__meta">
          <span>{{ site.data.cv_site.education[0].degree }}</span>
          <span>{{ site.data.cv_site.experience[2].role }}</span>
        </div>
      </article>

      <article class="workflow-stage" style="--workflow-accent: #9ed9c5;" data-reveal>
        <span class="workflow-stage__step">04 • Research systems delivery</span>
        <h3>{{ site.data.cv_site.experience[1].organization }}</h3>
        <p>Scaled into large public-data research and infrastructure, from geospatial epidemiology at census-tract scale to CKAN-driven repository automation.</p>
        <div class="workflow-stage__meta">
          <span>{{ site.data.cv_site.experience[1].dates }}</span>
          <span>{{ site.data.cv_site.experience[0].organization }}</span>
        </div>
      </article>
    </div>

    <div class="page__actions workflow-panel__actions">
      <a class="button-link" href="{{ '/cv/' | relative_url }}">Open full CV</a>
    </div>
  </article>
</section>

<section class="page__section" data-reveal>
  <p class="page__eyebrow">Research Interests</p>
  <div class="tag-cloud">
    <span class="tag-chip">Survey Methodology</span>
    <span class="tag-chip">Causal Inference</span>
    <span class="tag-chip">Transformer NLP</span>
    <span class="tag-chip">Geospatial Analysis</span>
    <span class="tag-chip">Privacy-Preserving AI</span>
    <span class="tag-chip">Statistical Modeling</span>
    <span class="tag-chip">Deep Learning</span>
    <span class="tag-chip">Sentiment Analysis</span>
  </div>
</section>

<section class="page__section" data-reveal>
  <p class="page__eyebrow">Explore</p>
  <div class="link-grid">
    <a class="stream-card" href="{{ '/publications/' | relative_url }}">
      <span class="stream-card__meta">Research</span>
      <strong>Publications</strong>
      <span>Conference papers and scholarly work on sentiment analysis, responsible data systems, and applied AI.</span>
    </a>
    <a class="stream-card" href="{{ '/portfolio/' | relative_url }}">
      <span class="stream-card__meta">Build</span>
      <strong>Projects</strong>
      <span>Selected technical projects spanning machine learning, forecasting, analytics, and engineering systems.</span>
    </a>
    <a class="stream-card" href="{{ '/github/' | relative_url }}">
      <span class="stream-card__meta">Ship</span>
      <strong>GitHub</strong>
      <span>Repository spotlight across research code, workflow automation, and starred builds with live project links.</span>
    </a>
    <a class="stream-card" href="{{ '/talks/' | relative_url }}">
      <span class="stream-card__meta">Present</span>
      <strong>Talks</strong>
      <span>Conference presentations and talks translating research into practical, communicable findings.</span>
    </a>
    <a class="stream-card" href="{{ '/teaching/' | relative_url }}">
      <span class="stream-card__meta">Teach</span>
      <strong>Teaching</strong>
      <span>Courses and instructional work focused on privacy, methodology, and computational practice.</span>
    </a>
  </div>
</section>

<section class="page__section" data-reveal>
  <p class="page__eyebrow">GitHub Spotlight</p>
  <div class="page__panel page__panel--highlight page__panel--compact">
    <h2>Starred repositories that best represent current work.</h2>
    <p>The GitHub showcase now refreshes from the GitHub API automatically and highlights the repositories that map most directly to active research, portfolio work, and reproducible code artifacts.</p>
    <div class="page__actions">
      <a class="button-link button-link--primary" href="{{ '/github/' | relative_url }}">Open GitHub showcase</a>
      <a class="button-link" href="{{ site.data.github.overview.repositories_url }}" target="_blank" rel="noopener">All repositories</a>
      <a class="button-link" href="{{ '/copilot-prompts/' | relative_url }}">Prompt library</a>
    </div>
  </div>

  <div class="github-repo-grid github-repo-grid--compact">
    {% for repo in site.data.github.featured_repositories limit:3 %}
      {% include github-repo-card.html repo=repo compact=true %}
    {% endfor %}
  </div>
</section>

<section class="page__section" data-reveal>
  <p class="page__eyebrow">CV Snapshot</p>
  <div class="result-grid">
    {% for result in site.data.cv_site.featured_results %}
      <article class="result-card">
        <span class="result-card__metric">{{ result.metric }}</span>
        <h3>{{ result.title }}</h3>
        <p>{{ result.detail }}</p>
      </article>
    {% endfor %}
  </div>
</section>

<section class="page__section page__section--split" data-reveal>
  <article class="page__panel">
    <p class="page__eyebrow">Education</p>
    <div class="timeline-stack">
      {% for degree in site.data.cv_site.education limit:2 %}
        <div class="timeline-card">
          <h3>{{ degree.degree }}</h3>
          <p>{{ degree.institution }}</p>
          <span>{{ degree.dates }}{% if degree.highlights and degree.highlights.size > 0 %} • {{ degree.highlights | join: ' • ' }}{% endif %}</span>
        </div>
      {% endfor %}
    </div>
  </article>

  <article class="page__panel">
    <p class="page__eyebrow">Highlights</p>
    <ul class="detail-list detail-list--compact">
      <li>Published survey research in Springer and presented at AAPOR on transformer-based sentiment analysis.</li>
      <li>Built ML systems processing 2.4M images, 1.1M social posts, and 129,572 census tracts.</li>
      <li>Improved data discoverability by 35% and reduced metadata maintenance work by 90%.</li>
      <li>Delivered quantifiable outcomes across research, infrastructure, public health, and ML engineering.</li>
    </ul>
  </article>
</section>

<section class="page__section page__section--contact" data-reveal>
  <p class="page__eyebrow">Contact</p>
  <h2>Open to research collaboration, data science work, and thoughtful conversations.</h2>
  <p>Reach out via <a href="mailto:namit507@gmail.com">email</a>, connect on <a href="https://www.linkedin.com/in/namit-shrivastava-baab47204/">LinkedIn</a>, or browse code on <a href="https://github.com/namo507">GitHub</a>.</p>
</section>
