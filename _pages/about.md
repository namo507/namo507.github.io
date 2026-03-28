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
  <p class="home-hero__lead">{{ site.data.cv.profile.summary }}</p>

  <div class="page__actions">
    <a class="button-link button-link--primary" href="{{ '/cv/' | relative_url }}">View CV</a>
    <a class="button-link" href="{{ '/publications/' | relative_url }}">Publications</a>
    <a class="button-link" href="{{ '/portfolio/' | relative_url }}">Projects</a>
    <a class="button-link" href="{{ '/github/' | relative_url }}">GitHub</a>
  </div>

  <div class="hero-metrics">
    {% for metric in site.data.cv.hero_metrics %}
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
    {% for link in site.data.cv.links %}
      <a class="social-link-card" href="{{ link.url }}">{{ link.label }}</a>
    {% endfor %}
  </div>
</section>

<section class="page__section page__section--split" data-reveal>
  <article class="page__panel page__panel--highlight">
    <p class="page__eyebrow">Research Focus</p>
    <h2>Turning complex data pipelines into reliable measurement systems.</h2>
    <p>My work centers on building trustworthy data integration frameworks that connect survey methodology with modern AI systems, so automated collection, classification, and inference stay interpretable and empirically grounded.</p>
    <ul class="detail-list">
      <li>Survey-aware AI workflows for data collection and quality assurance.</li>
      <li>Geospatial and epidemiological modeling over large-scale public datasets.</li>
      <li>Privacy-preserving and responsible measurement in applied ML systems.</li>
    </ul>
  </article>

  <article class="page__panel">
    <p class="page__eyebrow">Current Roles</p>
    <div class="timeline-stack">
      {% for role in site.data.cv.experience limit:3 %}
        <div class="timeline-card">
          <h3>{{ role.role }}</h3>
          <p>{{ role.organization }}</p>
          <span>{{ role.location }} • {{ role.dates }}</span>
        </div>
      {% endfor %}
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
    {% for result in site.data.cv.featured_results %}
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
      {% for degree in site.data.cv.education limit:2 %}
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
