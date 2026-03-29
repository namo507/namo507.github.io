---
layout: single
title: "Curriculum Vitae"
permalink: /cv/
author_profile: true
hide_title: true
hide_excerpt: true
excerpt: "Experience, education, research output, and technical focus."
redirect_from:
  - /resume
---

{% include base_path %}

<section class="cv-showcase">
  <div class="cv-hero page__panel page__panel--highlight" data-reveal>
    <div class="cv-hero__content">
      <p class="page__eyebrow">Curriculum Vitae</p>
      <h2 class="cv-hero__name">{{ site.data.cv_site.profile.name }}</h2>
      <p class="cv-hero__headline">{{ site.data.cv_site.profile.headline }}</p>
      <p class="cv-hero__summary">{{ site.data.cv_site.profile.summary }}</p>

      <div class="cv-inline-meta">
        <span class="cv-inline-meta__item">{{ site.data.cv_site.profile.location }}</span>
        <span class="cv-inline-meta__item">{{ site.data.cv_site.profile.phone }}</span>
        <a class="cv-inline-meta__item" href="mailto:{{ site.data.cv_site.profile.email }}">{{ site.data.cv_site.profile.email }}</a>
      </div>

      <div class="page__actions">
        <a class="button-link button-link--primary" href="{{ site.data.cv_site.profile.pdf_url | relative_url }}" target="_blank" rel="noopener">Download PDF</a>
        <a class="button-link" href="mailto:{{ site.data.cv_site.profile.email }}">Email</a>
        <a class="button-link" href="{{ '/publications/' | relative_url }}">Publications</a>
        <a class="button-link" href="{{ '/github/' | relative_url }}">GitHub Showcase</a>
      </div>
    </div>

    <div class="cv-hero__sidebar">
      <div class="cv-hero__signal">
        <span class="cv-hero__signal-label">Snapshot</span>
        <strong>Research, engineering, and teaching work presented through quantified outcomes.</strong>
      </div>

      <div class="hero-metrics cv-hero__metrics">
        {% for metric in site.data.cv_site.hero_metrics %}
          <article class="metric-card">
            <span class="metric-card__value">{{ metric.value }}</span>
            <span class="metric-card__label">{{ metric.label }}</span>
          </article>
        {% endfor %}
      </div>
    </div>
  </div>

  <nav class="cv-section-nav" aria-label="CV sections" data-reveal>
    <a class="cv-section-nav__link" href="#impact">Impact</a>
    <a class="cv-section-nav__link" href="#skills">Technical Skills</a>
    <a class="cv-section-nav__link" href="#experience">Experience</a>
    <a class="cv-section-nav__link" href="#projects">Publications & Projects</a>
    <a class="cv-section-nav__link" href="#education">Education</a>
    <a class="cv-section-nav__link" href="#service">Leadership</a>
  </nav>

  <section class="cv-section-block" id="impact" data-reveal>
    <div class="cv-section-heading">
      <p class="page__eyebrow">Impact</p>
      <h2>Evidence-led work across public health, data infrastructure, and applied machine learning.</h2>
      <p>The CV now opens with the measurable outcomes that make the strongest case for the underlying work, instead of forcing everything into a single linear document flow.</p>
    </div>

    <div class="result-grid">
      {% for result in site.data.cv_site.featured_results %}
        <article class="result-card cv-impact-card">
          <span class="result-card__metric">{{ result.metric }}</span>
          <h3>{{ result.title }}</h3>
          <p>{{ result.detail }}</p>
        </article>
      {% endfor %}
    </div>
  </section>

  <section class="cv-section-block" id="links" data-reveal>
    <div class="cv-section-heading">
      <p class="page__eyebrow">Profiles</p>
      <h2>Primary academic and professional links.</h2>
    </div>

    <div class="social-link-grid cv-social-grid">
      {% for link in site.data.cv_site.links %}
        <a class="social-link-card" href="{{ link.url }}"{% unless link.url contains 'mailto:' %} target="_blank" rel="noopener"{% endunless %}>{{ link.label }}</a>
      {% endfor %}
    </div>
  </section>

  <section class="cv-section-block" id="skills" data-reveal>
    <div class="cv-section-heading">
      <p class="page__eyebrow">Technical Skills</p>
      <h2>Research and machine-learning capabilities now carry the strongest visual priority.</h2>
      <p>The layout now foregrounds survey methodology, statistical research design, and applied machine learning, while keeping delivery and platform skills in a supporting role.</p>
    </div>

    <div class="cv-skill-grid">
      {% for skill_group in site.data.cv_site.skill_groups %}
        <article class="cv-skill-card{% if skill_group.featured %} cv-skill-card--featured{% endif %}" style="--skill-score: {{ skill_group.score }}%;" data-theme="{{ skill_group.theme | default: 'default' }}" data-reveal>
          <div class="cv-skill-card__header">
            <div>
              <p class="cv-skill-card__tier">{{ skill_group.tier }}</p>
              <h3>{{ skill_group.name }}</h3>
              <p>{{ skill_group.summary }}</p>
            </div>
          </div>
          <div class="cv-skill-meter" aria-hidden="true">
            <span class="cv-skill-meter__fill"></span>
          </div>
          <div class="tag-cloud tag-cloud--compact cv-skill-cloud">
            {% for skill in skill_group.tools %}
              <span class="tag-chip">{{ skill }}</span>
            {% endfor %}
          </div>
        </article>
      {% endfor %}
    </div>
  </section>

  <section class="cv-section-block" id="experience" data-reveal>
    <div class="cv-section-heading">
      <p class="page__eyebrow">Professional Experience</p>
      <h2>Research and engineering roles arranged as a readable timeline.</h2>
    </div>

    <div class="cv-record-grid cv-record-grid--stacked">
      {% for role in site.data.cv_site.experience %}
        <article class="cv-entry-card cv-entry-card--timeline" data-reveal>
          <div class="cv-entry-card__header">
            <div>
              <p class="cv-entry-card__eyebrow">{{ role.organization }}</p>
              <h3>{{ role.role }}</h3>
              <p>{{ role.location }}</p>
            </div>
            <div class="cv-entry-card__meta">{{ role.dates }}</div>
          </div>

          <ul class="detail-list detail-list--compact">
            {% for bullet in role.bullets limit:2 %}
              <li>{{ bullet }}</li>
            {% endfor %}
          </ul>

          {% if role.bullets.size > 2 %}
            <details class="cv-disclosure">
              <summary>View additional impact</summary>
              <ul class="detail-list detail-list--compact">
                {% for bullet in role.bullets offset:2 %}
                  <li>{{ bullet }}</li>
                {% endfor %}
              </ul>
            </details>
          {% endif %}
        </article>
      {% endfor %}
    </div>
  </section>

  <section class="cv-section-block" id="projects" data-reveal>
    <div class="cv-section-heading">
      <p class="page__eyebrow">Publications & Projects</p>
      <h2>Research papers, conference work, and analytical builds with supporting links.</h2>
    </div>

    <div class="cv-record-grid cv-record-grid--projects">
      {% for project in site.data.cv_site.projects %}
        <article class="cv-entry-card cv-entry-card--project" data-reveal>
          <div class="cv-entry-card__header">
            <div>
              <p class="cv-entry-card__eyebrow">{{ project.type }}</p>
              <h3>{{ project.title }}</h3>
              <p>{{ project.location }}</p>
            </div>
            <div class="cv-entry-card__meta">{{ project.dates }}</div>
          </div>

          <ul class="detail-list detail-list--compact">
            {% for bullet in project.bullets limit:1 %}
              <li>{{ bullet }}</li>
            {% endfor %}
          </ul>

          {% if project.bullets.size > 1 %}
            <details class="cv-disclosure">
              <summary>Expand project details</summary>
              <ul class="detail-list detail-list--compact">
                {% for bullet in project.bullets offset:1 %}
                  <li>{{ bullet }}</li>
                {% endfor %}
              </ul>
            </details>
          {% endif %}

          <div class="cv-entry-card__footer">
            <a class="button-link" href="{{ project.url }}" target="_blank" rel="noopener">{{ project.link_label }}</a>
          </div>
        </article>
      {% endfor %}
    </div>
  </section>

  <section class="cv-section-block" id="education" data-reveal>
    <div class="cv-section-heading">
      <p class="page__eyebrow">Education</p>
      <h2>Formal training, awards, and relevant coursework.</h2>
    </div>

    <div class="cv-record-grid cv-record-grid--education">
      {% for degree in site.data.cv_site.education %}
        <article class="cv-entry-card" data-reveal>
          <div class="cv-entry-card__header">
            <div>
              <p class="cv-entry-card__eyebrow">{{ degree.institution }}</p>
              <h3>{{ degree.degree }}</h3>
              <p>{{ degree.location }}</p>
            </div>
            <div class="cv-entry-card__meta">{{ degree.dates }}</div>
          </div>

          {% if degree.highlights %}
            <div class="tag-cloud tag-cloud--compact">
              {% for highlight in degree.highlights %}
                <span class="tag-chip">{{ highlight }}</span>
              {% endfor %}
            </div>
          {% endif %}

          {% if degree.coursework %}
            <details class="cv-disclosure cv-disclosure--coursework">
              <summary>View relevant coursework</summary>
              <div class="tag-cloud tag-cloud--compact">
                {% for course in degree.coursework %}
                  <span class="tag-chip">{{ course }}</span>
                {% endfor %}
              </div>
            </details>
          {% endif %}
        </article>
      {% endfor %}
    </div>
  </section>

  <section class="cv-section-block cv-section-block--split" id="service" data-reveal>
    <article class="page__panel" data-reveal>
      <div class="cv-section-heading cv-section-heading--compact">
        <p class="page__eyebrow">Certifications & Achievements</p>
        <h2>Credentials that reinforce the research and engineering profile.</h2>
      </div>

      <h3 class="cv-subheading">Certifications</h3>
      <ul class="detail-list detail-list--compact">
        {% for cert in site.data.cv_site.certifications %}
          <li>{{ cert }}</li>
        {% endfor %}
      </ul>

      <h3 class="cv-subheading">Achievements</h3>
      <div class="tag-cloud tag-cloud--compact">
        {% for achievement in site.data.cv_site.achievements %}
          <span class="tag-chip">{{ achievement }}</span>
        {% endfor %}
      </div>
    </article>

    <article class="page__panel" data-reveal>
      <div class="cv-section-heading cv-section-heading--compact">
        <p class="page__eyebrow">Leadership & Service</p>
        <h2>Work beyond the classroom and lab.</h2>
      </div>

      <div class="cv-record-grid cv-record-grid--service">
        {% for role in site.data.cv_site.service %}
          <article class="cv-entry-card cv-entry-card--service">
            <div class="cv-entry-card__header">
              <div>
                <p class="cv-entry-card__eyebrow">{{ role.organization }}</p>
                <h3>{{ role.role }}</h3>
                <p>{{ role.location }}</p>
              </div>
              <div class="cv-entry-card__meta">{{ role.dates }}</div>
            </div>

            <ul class="detail-list detail-list--compact">
              {% for bullet in role.bullets %}
                <li>{{ bullet }}</li>
              {% endfor %}
            </ul>
          </article>
        {% endfor %}
      </div>
    </article>
  </section>

  <section class="cv-download-panel page__panel page__panel--highlight" data-reveal>
    <div>
      <p class="page__eyebrow">Download</p>
      <h2>Prefer the printable version?</h2>
      <p>Use the PDF generated from the attached TeX resume for applications, formal submissions, and offline sharing.</p>
    </div>
    <div class="page__actions">
      <a class="button-link button-link--primary" href="{{ site.data.cv_site.profile.pdf_url | relative_url }}" target="_blank" rel="noopener">Open PDF</a>
    </div>
  </section>
</section>
