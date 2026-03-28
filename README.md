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
