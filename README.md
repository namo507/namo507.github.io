# Namit Shrivastava - Academic Personal Website

[![Pages Build Deployment](https://github.com/namo507/namo507.github.io/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/namo507/namo507.github.io/actions/workflows/pages/pages-build-deployment)

Welcome to my academic personal website repository! This website showcases my research, publications, projects, and professional activities.

🔗 **Live Website**: [https://namo507.github.io](https://namo507.github.io)

## About Me

I'm a **Graduate Researcher** at the **University of Maryland** specializing in **survey methodology and data science**. I bridge traditional survey research with cutting-edge AI technologies to advance automated data collection, quality assurance, and responsible measurement at scale.

Currently, I serve as a **Research Assistant** at the **University of Michigan's Institute for Social Research**, where I conduct geospatial epidemiological research analyzing COVID-19 patterns across 129,000+ U.S. census tracts.

## Website Sections

### 🏠 [Home](https://namo507.github.io)
Welcome page with an overview of my background, current work, and research metrics including:
- 129K+ Census Tracts Analyzed
- 1.1M+ Social Posts Processed
- 2.4M Images in ML Pipeline
- 91.6% Model Accuracy

### 📄 [CV](https://namo507.github.io/cv/)
Comprehensive curriculum vitae featuring:
- Education: M.S. in Survey & Data Science (UMD), B.E. in Civil Engineering (BITS Pilani)
- Professional Experience
- Research Summary
- Awards and Honors

### 📚 [Publications](https://namo507.github.io/publications/)
Scholarly work including:
- **Journal Articles**: Research on supply chain sustainability (Springer, 2024)
- **Conference Papers**: EV sentiment analysis presented at AAPOR 2025

### 💼 [Projects](https://namo507.github.io/portfolio/)
Showcase of technical projects:
- Performance Based Seismic Design
- Voice Gender Recognition (96% accuracy)
- Website Development - Indian Red Cross Society

### 🧑‍💻 [GitHub](https://namo507.github.io/github/)
Repository showcase featuring research repositories, starred spotlights, and linked project mappings.

### 🧠 [Copilot Prompts](https://namo507.github.io/copilot-prompts/)
Prompt library mapping GitHub repositories to portfolio and LinkedIn project context for GitHub Copilot Chat.

### 🎤 [Talks](https://namo507.github.io/talks/)
Conference presentations and talks:
- AAPOR 2025: Electric Vehicles sentiment analysis

### 👨‍🏫 [Teaching](https://namo507.github.io/teaching/)
Teaching experience:
- SURV735: Data Privacy and Confidentiality (Teaching Assistant)
- Canvas LMS Infrastructure & Course Administration (Graduate Assistant)

## Research Interests

- Survey Methodology
- Causal Inference
- Transformer NLP
- Geospatial Analysis
- Privacy-Preserving AI
- Statistical Modeling
- Deep Learning
- Sentiment Analysis

## Key Highlights

✨ Published in Springer's Advances in Data-Driven Computing and Intelligent Systems
✨ Presented at the 80th AAPOR Annual Conference (May 2025)
✨ Awarded JPSM Dean's Fellowship for Academic Year 2025-26
✨ Processing 129,572 U.S. census tracts for COVID-19 geospatial analysis
✨ Built ML pipelines processing 2.4M+ images

## Technology Stack

This website is built using:
- **Jekyll** - Static site generator
- **GitHub Pages** - Hosting platform
- **Academic Pages** - Template theme (fork of Minimal Mistakes)
- **Markdown** - Content formatting

### Animated homepage

`index.html` is served ahead of the Jekyll pages and renders a React single-page
portfolio. The two views share the `theme` localStorage key, so the light/dark
choice carries across the whole site.

| File | Role |
| --- | --- |
| `assets/cosmic/app.jsx` | The React app. Compiled in the browser by Babel standalone. |
| `assets/cosmic/styles.css` | Design tokens and every component class. `scripts/site_doctor` parses this file directly, so its token names and tile selectors are mirrored in `scripts/site_doctor/config.py`. |
| `assets/cosmic/explainers-3d.js` | Per-section Three.js scenes, mounted onto `[data-scene]` elements. One WebGL context renders every scene through scissored viewports, so adding sections does not add contexts. |
| `assets/cosmic/data.js` | Hand-authored site content (`window.SITE`). |
| `assets/cosmic/portfolio-sync.generated.js` | Machine-managed overlay from the weekly ESD sync. |
| `assets/cosmic/linkedin.generated.js` | Machine-managed LinkedIn snapshot. |

Both generated files are optional at runtime: the loader resolves on error and
the app renders from `window.SITE` alone, so a failed or stale sync degrades to
a smaller page rather than a broken one.

## Repository Structure

```
.
├── _data/              # Site data and navigation
├── _pages/             # Main content pages
├── _portfolio/         # Project entries
├── _publications/      # Publication entries
├── _talks/             # Talk entries
├── _teaching/          # Teaching entries
├── assets/             # CSS, JS, and other assets
├── files/              # PDFs and downloadable files
├── images/             # Image assets
└── _config.yml         # Site configuration
```

## Running Locally

To preview the website locally:

### Prerequisites
- Ruby (2.7+)
- Bundler
- Node.js

### Installation

1. Clone the repository:
```bash
git clone https://github.com/namo507/namo507.github.io.git
cd namo507.github.io
```

2. Install dependencies:
```bash
bundle install
```

3. Run the local server:
```bash
bundle exec jekyll serve -l -H localhost
```

4. Visit `http://localhost:4000` in your browser

### Using Docker

Alternatively, use Docker:
```bash
chmod -R 777 .
docker compose up
```

## GitHub Showcase Automation

The GitHub showcase data is generated automatically rather than maintained by hand.

- Source metadata for curated repositories lives in `scripts/github_showcase_source.json`
- Generated site data is written to `_data/github.yml`
- Refresh locally with `python3 scripts/sync_github_showcase.py`
- Scheduled refresh runs via `.github/workflows/sync_github_showcase.yml`

## LinkedIn Portfolio Sync

The LinkedIn integration is machine-managed and intentionally conservative.

- Target profile URL resolves from `_config.yml` `author.linkedin` unless `--profile-url` is passed.
- Public-profile fetch, parse, and schema validation run through `scripts/sync_linkedin_content.py`.
- If `scripts/linkedin_seed.yml` is present, the sync command can promote that curated seed into the first successful validated snapshot when live public fetches are blocked.
- Generated site data is written to `_data/linkedin_profile.yml`, `_data/linkedin_experience.yml`, `_data/linkedin_featured.yml`, `_data/linkedin_updates.yml`, `_data/linkedin_sync_meta.yml`, and `_data/linkedin_snapshot.json`.
- The animated homepage consumes `assets/cosmic/linkedin.generated.js`, which is generated from the same validated snapshot and loaded through a no-cache script loader before the React app mounts.
- Existing generated data is preserved when LinkedIn returns a blocked or unavailable response such as HTTP `999`, an auth wall, a short response, or suspiciously empty content.
- Once a real public snapshot succeeds, blocked fetches stop overwriting it with the curated seed; the seed is only there to establish and maintain the first validated fallback path.

Current site surfaces consuming LinkedIn-derived data:

- `_pages/about.md` loads `_includes/linkedin-sync-classic.html` for the classic/about view.
- `_pages/cv.md` loads `_includes/linkedin-sync-cv.html` for the CV page.
- `index.html` loads `assets/cosmic/linkedin.generated.js`, and `assets/cosmic/app.jsx` only renders the LinkedIn section when the validated sync status is `ok`.

Generated files:

- `_data/linkedin_profile.yml`
- `_data/linkedin_experience.yml`
- `_data/linkedin_featured.yml`
- `_data/linkedin_updates.yml`
- `_data/linkedin_sync_meta.yml`
- `_data/linkedin_snapshot.json`
- `assets/cosmic/linkedin.generated.js`

Curated fallback seed:

- `scripts/linkedin_seed.yml`

Refresh locally:

```bash
python3 -m pip install -r scripts/requirements-linkedin-sync.txt
python3 scripts/sync_linkedin_content.py
python3 scripts/sync_linkedin_content.py --dry-run
python3 scripts/sync_linkedin_content.py --verbose
python3 scripts/sync_linkedin_content.py --no-write
python3 scripts/sync_linkedin_content.py --bootstrap-placeholders
python3 scripts/sync_linkedin_content.py --seed-file scripts/linkedin_seed.yml --dry-run --verbose
python3 scripts/sync_linkedin_content.py --source-file scripts/fixtures/linkedin_public_profile.sample.html --dry-run --verbose
```

Useful flags:

- `--no-write` validates fetch, parse, diff, and schema output without touching generated files.
- `--source-file` lets you parse a saved HTML or JSON response for offline testing.
- `--seed-file` points to a curated YAML or JSON seed used only when live public fetches cannot produce the first successful validated snapshot.
- `--bootstrap-placeholders` writes the machine-managed files once so templates and the homepage script can load safely before the first successful live sync.

Layout-safety protections:

- LinkedIn content is normalized into a strict internal schema before templates read it.
- Generated preview fields are capped (`headline_short`, `about_short`, `description_short`, `summary_short`) so long public text cannot blow out cards or headings.
- Reusable card styles clamp preview text, enable `overflow-wrap:anywhere`, and keep grids stable even when item counts vary.
- The Jekyll includes and the animated homepage gate rendering on `linkedin_sync_meta.sync_status == ok`, so blocked or partial data never creates malformed UI.
- The GitHub Actions workflow runs `bundle exec jekyll build` before any commit, so invalid generated data never lands if the site stops building.

Fail-safe behavior:

- Fetch failures keep the current machine-managed files unchanged.
- Parse or schema-validation failures keep the current machine-managed files unchanged.
- Suspiciously empty responses are rejected when they collapse too far relative to the previous validated snapshot.
- If no validated public snapshot exists yet, the workflow can fall back to `scripts/linkedin_seed.yml` so the LinkedIn section stays populated without trusting blocked public responses.
- Whitespace-only or equivalent normalized content changes do not produce a commit.
- The workflow commits only generated LinkedIn files, and only after a successful Jekyll build.

Automation details:

- Scheduled refresh runs every five days via `.github/workflows/sync_linkedin_profile.yml`.
- The workflow only commits generated LinkedIn files after `bundle exec jekyll build` succeeds.
- There is no push trigger, so the workflow cannot create a commit loop.
- Disable the automation by turning off the `Sync LinkedIn Profile` workflow in the GitHub Actions UI or by removing the schedule from `.github/workflows/sync_linkedin_profile.yml`.

## Weekly ESD Portfolio Sync

The ESD portfolio sync is machine-managed and only promotes publicly safe, generalized bullets into the **Data Scientist II** role at the Institute for Mind and Brain, University of South Carolina — the role the weekly lab agenda describes.

- The orchestrator lives in `scripts/sync_esd_portfolio.py`.
- Supporting modules live under `scripts/portfolio_sync/`.
- The committed state manifest lives at `scripts/portfolio_sync/state_manifest.json`.
- The frontend overlay is generated into `assets/cosmic/portfolio-sync.generated.js`.
- Backend role updates are written symmetrically into `_data/cv_site.yml`, `_data/cv.yml`, and `_data/cv.json`.
- Validation runs through `scripts/validate_esd_portfolio_sync.py` and blocks any commit when generated text fails redaction checks or the site stops building.
- Scheduled automation runs via `.github/workflows/sync_esd_portfolio.yml`.

### Retargeting the sync to a different role

`TARGET_ROLE_MATCH` in `scripts/portfolio_sync/config.py` is the single source of truth. Its three entries must match the role verbatim in `_data/cv_site.yml` + `_data/cv.yml` (`organization` / `role`), `_data/cv.json` (`company` / `position`), and `assets/cosmic/data.js` (`org` / `role`). The React overlay joins on the `(org, role)` pair, so a mismatch there would silently drop every generated bullet — `validate_cosmic_merge_key()` fails the run instead.

### Why the writers are line-targeted

The sync owns exactly one key per file (`generated_bullets` / `generatedHighlights`). `scripts/portfolio_sync/surgical_edit.py` splices that key in place instead of re-serializing the document, because a full YAML/JSON round-trip rewrites every unrelated line — reflowing long strings, dropping blank-line grouping, expanding inline arrays — which turns a two-line content change into a ~440-line diff and makes the weekly pull request unreviewable. Hand-maintained formatting in the CV data files therefore survives every run.

Required GitHub secrets and variables:

- `ESD_PORTFOLIO_GITHUB_TOKEN`: read-only token scoped to the two private evidence repositories.
- `ESD_LAB_SLACK_BOT_TOKEN`: read-only Slack bot token.
- `ESD_LAB_SLACK_MCP_COMMAND` or `ESD_LAB_SLACK_MCP_URL`: how GitHub Actions should reach the Slack MCP server.
- `ESD_LAB_SLACK_MCP_TOOL`: MCP tool name for reading the weekly agenda canvas.
- `ESD_LAB_SLACK_MCP_TOOL_ARGS_JSON`: optional JSON arguments merged into the Slack MCP tool call.
- `ESD_LAB_SLACK_CANVAS_ID`: optional explicit canvas identifier when the MCP tool expects one.

Refresh locally:

```bash
python3 -m pip install -r scripts/requirements-portfolio-sync.txt
python3 scripts/sync_esd_portfolio.py --dry-run --verbose --agenda-source-file path/to/agenda.md
python3 scripts/validate_esd_portfolio_sync.py
```

## Contact & Connect

- 📧 **Email**: [namit507@gmail.com](mailto:namit507@gmail.com)
- 🎓 **Google Scholar**: [Profile](https://scholar.google.com/citations?user=7bvTB-sAAAAJ&hl=en)
- 🔬 **ORCID**: [0009-0005-7920-8350](https://orcid.org/0009-0005-7920-8350)
- 💼 **LinkedIn**: [namit-shrivastava-baab47204](https://www.linkedin.com/in/namit-shrivastava-baab47204)
- 🐙 **GitHub**: [@namo507](https://github.com/namo507)
- 🦋 **Bluesky**: [Profile](https://bsky.app/profile/bsky.app)
- 🐦 **X (Twitter)**: [@Namit507](https://twitter.com/Namit507)

## License

This website is based on the [Academic Pages template](https://github.com/academicpages/academicpages.github.io), which is released under the MIT License.

© 2025 Namit Shrivastava. All rights reserved.

---

*Site last updated: December 18, 2025*
