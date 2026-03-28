---
layout: archive
title: "Curriculum Vitae"
permalink: /cv/
author_profile: true
excerpt: "Experience, education, research output, and technical focus."
redirect_from:
  - /resume
---

{% include base_path %}

<div class="page__panel page__panel--highlight page__panel--compact" data-reveal>
  <p class="page__eyebrow">Curriculum Vitae</p>
  <h2>{{ site.data.cv.profile.name }}</h2>
  <p>{{ site.data.cv.profile.location }} | {{ site.data.cv.profile.phone }} | <a href="mailto:{{ site.data.cv.profile.email }}">{{ site.data.cv.profile.email }}</a></p>
  <div class="page__actions">
    {% for link in site.data.cv.links %}
      <a class="button-link{% if forloop.first %} button-link--primary{% endif %}" href="{{ link.url }}">{{ link.label }}</a>
    {% endfor %}
  </div>
</div>

## Research Summary
{{ site.data.cv.profile.summary }}

## Quantified Highlights

<div class="result-grid">
  {% for result in site.data.cv.featured_results %}
    <article class="result-card">
      <span class="result-card__metric">{{ result.metric }}</span>
      <h3>{{ result.title }}</h3>
      <p>{{ result.detail }}</p>
    </article>
  {% endfor %}
</div>

---

## Education
{% for degree in site.data.cv.education %}
<article class="cv-entry-card" data-reveal>
  <div class="cv-entry-card__header">
    <div>
      <h3>{{ degree.institution }}</h3>
      <p>{{ degree.degree }}</p>
    </div>
    <div class="cv-entry-card__meta">{{ degree.dates }}<br>{{ degree.location }}</div>
  </div>
  {% if degree.highlights %}
  <div class="tag-cloud tag-cloud--compact">
    {% for highlight in degree.highlights %}
      <span class="tag-chip">{{ highlight }}</span>
    {% endfor %}
  </div>
  {% endif %}
  {% if degree.coursework %}
  <p class="cv-entry-card__supporting"><strong>Coursework:</strong> {{ degree.coursework | join: ', ' }}</p>
  {% endif %}
</article>
{% endfor %}

---

## Professional Experience
{% for role in site.data.cv.experience %}
<article class="cv-entry-card" data-reveal>
  <div class="cv-entry-card__header">
    <div>
      <h3>{{ role.role }}</h3>
      <p>{{ role.organization }}</p>
    </div>
    <div class="cv-entry-card__meta">{{ role.dates }}<br>{{ role.location }}</div>
  </div>
  <ul class="detail-list detail-list--compact">
    {% for bullet in role.bullets %}
      <li>{{ bullet }}</li>
    {% endfor %}
  </ul>
</article>
{% endfor %}

---

## Publications & Projects

{% for project in site.data.cv.projects %}
<article class="cv-entry-card" data-reveal>
  <div class="cv-entry-card__header">
    <div>
      <h3>{{ project.title }}</h3>
      <p>{{ project.type }}</p>
    </div>
    <div class="cv-entry-card__meta">{{ project.dates }}<br>{{ project.location }}</div>
  </div>
  <p class="cv-entry-card__supporting"><a href="{{ project.url }}">{{ project.link_label }}</a></p>
  <ul class="detail-list detail-list--compact">
    {% for bullet in project.bullets %}
      <li>{{ bullet }}</li>
    {% endfor %}
  </ul>
</article>
{% endfor %}

---

## Technical Skills
{% for skill_group in site.data.cv.skills %}
### {{ skill_group[0] }}

<div class="tag-cloud tag-cloud--compact">
  {% for skill in skill_group[1] %}
    <span class="tag-chip">{{ skill }}</span>
  {% endfor %}
</div>
{% endfor %}

---

## Certifications & Achievements

### Certifications

<ul class="detail-list detail-list--compact">
  {% for cert in site.data.cv.certifications %}
    <li>{{ cert }}</li>
  {% endfor %}
</ul>

### Achievements

<div class="tag-cloud tag-cloud--compact">
  {% for achievement in site.data.cv.achievements %}
    <span class="tag-chip">{{ achievement }}</span>
  {% endfor %}
</div>

---

## Leadership & Service

{% for role in site.data.cv.service %}
<article class="cv-entry-card" data-reveal>
  <div class="cv-entry-card__header">
    <div>
      <h3>{{ role.organization }}</h3>
      <p>{{ role.role }}</p>
    </div>
    <div class="cv-entry-card__meta">{{ role.dates }}<br>{{ role.location }}</div>
  </div>
  <ul class="detail-list detail-list--compact">
    {% for bullet in role.bullets %}
      <li>{{ bullet }}</li>
    {% endfor %}
  </ul>
</article>
{% endfor %}
