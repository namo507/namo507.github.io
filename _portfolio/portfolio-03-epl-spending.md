---
title: "English Premier League Spending Analysis"
excerpt: "Quasi-experimental analysis examining causal effects of squad investment on team performance using synthetic control and difference-in-differences methods.<br/><img src='/images/projects/epl-spending.png' style='max-width:500px;'>"
collection: portfolio
date: 2025-04-15
tags: [Causal Inference, Sports Analytics, R, Statistics]
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
  <h2 style="color: white; margin: 0;">English Premier League Spending Analysis</h2>
  <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">University of Maryland | Jan 2025 – Apr 2025</p>
  <div style="margin-top: 1rem;">
    <span class="tech-tag">R</span>
    <span class="tech-tag">Synthetic Control</span>
    <span class="tech-tag">Difference-in-Differences</span>
    <span class="tech-tag">ggplot2</span>
  </div>
</div>

## Project Overview

Applied quasi-experimental causal inference methods to examine the relationship between squad investment and team performance in the English Premier League.

## Key Contributions

<div class="metric-card">
  <strong>Causal Framework:</strong> Applied synthetic control and difference-in-differences (DiD) methods to estimate causal effects of squad investment on league position, controlling for confounding factors
</div>

<div class="metric-card">
  <strong>Model Implementation:</strong> Constructed synthetic counterfactuals for treated clubs using convex combinations of donor pool teams, validating pre-treatment parallel trends
</div>

<div class="metric-card">
  <strong>Statistical Inference:</strong> Conducted placebo tests and permutation inference to assess statistical significance, finding significant ROI heterogeneity across club tiers (top-6 vs. mid-table)
</div>

## Technologies Used

- **Languages:** R
- **Methods:** Synthetic Control, Difference-in-Differences
- **Visualization:** ggplot2
- **Data Sources:** TransferMarkt, Premier League

## Key Findings

| Analysis | Result |
|----------|--------|
| Treatment Effect (Top-6) | Significant positive |
| Treatment Effect (Mid-table) | Heterogeneous |
| Pre-treatment Parallel Trends | Validated |
| Placebo Tests | Passed |
