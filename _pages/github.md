---
permalink: /github/
title: "GitHub"
excerpt: "Repository showcase spanning research code, automation workflows, and starred builds with measurable outcomes."
author_profile: true
---

<section class="page__panel page__panel--highlight page__panel--compact" data-reveal>
  <p class="page__eyebrow">Code Portfolio</p>
  <h2>Public repositories, linked project mappings, and prompt-ready code showcases.</h2>
  <p>The GitHub profile spans research code, workflow automation, and production-minded prototypes. The showcase data now refreshes from the GitHub API on a schedule, while curated repository mappings connect code back to portfolio work and GitHub Copilot prompts.</p>
  <div class="page__actions">
    <a class="button-link button-link--primary" href="{{ site.data.github.overview.profile_url }}" target="_blank" rel="noopener">Open GitHub profile</a>
    <a class="button-link" href="{{ site.data.github.overview.repositories_url }}" target="_blank" rel="noopener">All repositories</a>
    <a class="button-link" href="{{ site.data.github.overview.starred_url }}" target="_blank" rel="noopener">Starred spotlight</a>
    <a class="button-link" href="{{ '/copilot-prompts/' | relative_url }}">Copilot prompt library</a>
  </div>
</section>

<section class="page__section" data-reveal>
  <p class="page__eyebrow">GitHub Snapshot</p>
  <div class="hero-metrics github-repo-metrics">
    {% for metric in site.data.github.overview.stats %}
      <article class="metric-card">
        <span class="metric-card__value">{{ metric.value }}</span>
        <span class="metric-card__label">{{ metric.label }}</span>
      </article>
    {% endfor %}
  </div>
</section>

<section class="page__section page__section--split" data-reveal>
  <article class="page__panel">
    <p class="page__eyebrow">Language Mix</p>
    <div class="tag-cloud tag-cloud--compact">
      {% for item in site.data.github.overview.language_mix %}
        <span class="tag-chip">{{ item.language }} · {{ item.count }} repos</span>
      {% endfor %}
    </div>
  </article>

  <article class="page__panel">
    <p class="page__eyebrow">What This Code Covers</p>
    <ul class="detail-list detail-list--compact">
      <li>Research pipelines in survey methodology, NLP, multilevel modeling, and public opinion analysis.</li>
      <li>Applied AI prototypes spanning Office add-ins, workflow automation, and simulation frameworks.</li>
      <li>Repository-level documentation that links source code back to portfolio work, CV artifacts, and site content.</li>
    </ul>
  </article>
</section>

<section class="page__section" data-reveal>
  <p class="page__eyebrow">Featured Repositories</p>
  <div class="github-repo-grid">
    {% for repo in site.data.github.featured_repositories %}
      {% include github-repo-card.html repo=repo %}
    {% endfor %}
  </div>
</section>

<section class="page__section" data-reveal>
  <p class="page__eyebrow">Repository Mapping</p>
  <div class="github-map-grid">
    {% for mapping in site.data.github.repository_mappings %}
      <article class="github-map-card">
        <p class="github-repo-list__meta">{{ mapping.full_name }}</p>
        <h3>{{ mapping.repo_name }}</h3>
        <div class="github-map-links">
          {% for project in mapping.projects %}
            <a class="github-map-link" href="{% if project.url contains '://' %}{{ project.url }}{% else %}{{ project.url | relative_url }}{% endif %}"{% if project.url contains '://' %} target="_blank" rel="noopener"{% endif %}>{{ project.label }}</a>
          {% endfor %}
        </div>
      </article>
    {% endfor %}
  </div>
</section>

<section class="page__section" data-reveal>
  <p class="page__eyebrow">Copilot Prompt Library</p>
  <div class="page__panel page__panel--highlight page__panel--compact">
    <h2>Ready-to-paste prompts mapped to the repositories and projects above.</h2>
    <p>The prompt library packages the repository context, quantifiable results, and target files so GitHub Copilot Chat can work at the right level of abstraction inside each repo.</p>
    <div class="page__actions">
      <a class="button-link button-link--primary" href="{{ '/copilot-prompts/' | relative_url }}">Open all prompts</a>
    </div>
  </div>

  <div class="github-repo-list">
    {% for prompt in site.data.copilot_prompts.prompts limit:4 %}
      <a class="github-repo-list__item" href="{{ '/copilot-prompts/' | relative_url }}#{{ prompt.anchor }}">
        <span class="github-repo-list__meta">{{ prompt.repo }} · Prompt {{ forloop.index }}</span>
        <strong>{{ prompt.title }}</strong>
        <span>{{ prompt.focus }}</span>
      </a>
    {% endfor %}
  </div>
</section>

<section class="page__section" data-reveal>
  <p class="page__eyebrow">Starred Spotlight</p>
  <div class="github-repo-grid">
    {% for repo in site.data.github.spotlight_repos %}
      {% include github-repo-card.html repo=repo %}
    {% endfor %}
  </div>
</section>

<section class="page__section" data-reveal>
  <p class="page__eyebrow">Recent Repositories</p>
  <div class="github-repo-list">
    {% for repo in site.data.github.recent_repositories %}
      <a class="github-repo-list__item" href="{{ repo.url }}" target="_blank" rel="noopener">
        <span class="github-repo-list__meta">{{ repo.language | default: 'Repository' }} · {{ repo.updated }}</span>
        <strong>{{ repo.name }}</strong>
        <span>{{ repo.description | default: repo.summary }}</span>
      </a>
    {% endfor %}
  </div>
</section>