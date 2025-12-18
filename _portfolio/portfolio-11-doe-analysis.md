---
title: "Design of Experiments (DOE) Analysis"
excerpt: "Applied factorial design and response surface methodology to optimize industrial processes, achieving 25% improvement in process efficiency.<br/><img src='/images/projects/doe-analysis.png' style='max-width:500px;'>"
collection: portfolio
date: 2022-12-01
tags: [Statistics, DOE, R, Process Optimization]
---

<style>
.project-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
}
.tech-tag {
  display: inline-block;
  background: rgba(255,255,255,0.2);
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  margin: 0.2rem;
  font-size: 0.85rem;
  transition: transform 0.2s ease;
}
.tech-tag:hover {
  transform: scale(1.05);
}
.metric-card {
  background: #f8f9fa;
  border-left: 4px solid #667eea;
  padding: 1rem;
  margin: 0.5rem 0;
  border-radius: 0 8px 8px 0;
  transition: transform 0.3s ease;
}
.metric-card:hover {
  transform: translateX(5px);
}
</style>

<div class="project-header">
  <h2 style="color: white; margin: 0;">Design of Experiments (DOE) Analysis</h2>
  <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">BITS Pilani | Sep 2022 – Dec 2022</p>
  <div style="margin-top: 1rem;">
    <span class="tech-tag">R</span>
    <span class="tech-tag">Factorial Design</span>
    <span class="tech-tag">Response Surface</span>
    <span class="tech-tag">ANOVA</span>
    <span class="tech-tag">Process Optimization</span>
  </div>
</div>

## Project Overview

Applied statistical design of experiments methodology to systematically optimize industrial processes, identifying optimal factor settings and interaction effects.

## Key Contributions

<div class="metric-card">
  <strong>Factorial Analysis:</strong> Designed and analyzed 2^k full factorial and fractional factorial experiments to identify significant main effects and interactions among process variables
</div>

<div class="metric-card">
  <strong>Response Surface Optimization:</strong> Applied Response Surface Methodology (RSM) with Central Composite Design (CCD) to locate optimal operating conditions, improving process efficiency by 25%
</div>

<div class="metric-card">
  <strong>Statistical Inference:</strong> Conducted ANOVA, regression diagnostics, and lack-of-fit tests to validate model adequacy and identify statistically significant effects (α = 0.05)
</div>

## Technologies Used

- **Languages:** R
- **Libraries:** rsm, FrF2, DoE.base
- **Methods:** Factorial Design, RSM, ANOVA
- **Visualization:** contour plots, interaction plots

## Key Results

| Metric | Value |
|--------|-------|
| Process Improvement | 25% |
| Design Type | CCD, 2^k Factorial |
| Significance Level | α = 0.05 |
| Factors Analyzed | Multiple |

## DOE Workflow

```
1. Problem Definition → Response Variable Selection
2. Factor Identification → Screening Experiments
3. Full Factorial Design → Main Effects & Interactions
4. Response Surface Modeling → Optimization
5. Confirmation Runs → Validation
```
