---
permalink: /copilot-prompts/
title: "Copilot Prompts"
excerpt: "Ready-to-paste GitHub Copilot Chat prompts mapped to repositories, portfolio pages, and LinkedIn project context."
author_profile: true
---

<section class="page__panel page__panel--highlight page__panel--compact" data-reveal>
  <p class="page__eyebrow">Prompt Library</p>
  <h2>Prompt-ready repository context for GitHub Copilot Chat.</h2>
  <p>These prompts map GitHub repositories to portfolio projects and LinkedIn context so the workspace instructions are immediately grounded in the actual research question, metrics, and file structure for each codebase.</p>
  <div class="page__actions">
    <a class="button-link button-link--primary" href="{{ '/github/' | relative_url }}">Back to GitHub showcase</a>
    <a class="button-link" href="{{ site.data.github.overview.profile_url }}" target="_blank" rel="noopener">GitHub profile</a>
  </div>
</section>

<section class="page__section page__section--split" data-reveal>
  <article class="page__panel">
    <p class="page__eyebrow">How To Use</p>
    <ul class="detail-list detail-list--compact">
      <li>Open the relevant repository as the VS Code workspace root before pasting a prompt into GitHub Copilot Chat.</li>
      <li>Use the repository mapping on the GitHub page to move between source code and the corresponding website project writeup.</li>
      <li>Adapt filenames or paths if a repository has evolved since the prompt was first drafted.</li>
    </ul>
  </article>

  <article class="page__panel">
    <p class="page__eyebrow">Coverage</p>
    <div class="tag-cloud tag-cloud--compact">
      <span class="tag-chip">12 prompts</span>
      <span class="tag-chip">Python</span>
      <span class="tag-chip">R</span>
      <span class="tag-chip">Jupyter</span>
      <span class="tag-chip">Quarto</span>
      <span class="tag-chip">Portfolio-wide CI</span>
    </div>
  </article>
</section>

<section class="page__section" data-reveal>
  <p class="page__eyebrow">Prompt Library</p>
  {% for prompt in site.data.copilot_prompts.prompts %}
    <details class="prompt-card" id="{{ prompt.anchor }}" data-reveal>
      <summary class="prompt-card__summary">
        <div class="prompt-card__summary-main">
          <p class="prompt-card__summary-eyebrow">Prompt {{ forloop.index }} · {{ prompt.repo }}</p>
          <strong>{{ prompt.title }}</strong>
          <span>{{ prompt.projects | join: ' · ' }}</span>
        </div>
        <span class="prompt-card__summary-side">{{ prompt.languages | join: ' / ' }}</span>
      </summary>

      <div class="prompt-card__body">
        <p class="prompt-card__meta"><a href="{{ prompt.repo_url }}" target="_blank" rel="noopener">{{ prompt.repo_url }}</a></p>
        <p>{{ prompt.focus }}</p>
        <p class="prompt-card__hint"><strong>Workspace hint:</strong> {{ prompt.workspace_hint }}</p>
        <pre class="prompt-card__code"><code>{{ prompt.prompt | escape }}</code></pre>
      </div>
    </details>
  {% endfor %}
</section>