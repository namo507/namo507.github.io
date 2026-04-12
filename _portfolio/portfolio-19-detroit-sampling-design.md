---
title: "Multi-Stage Area Probability Sample Design for the Detroit Transportation Security Survey"
excerpt: "Three-stage area probability PPS sampling design for 1,000 interviews across 266 Detroit census tracts, with age-domain stratification and self-weighting design achieving a 95% CI of 12.3%–17.7% on key transportation outcomes."
collection: portfolio
date: 2026-01-01
tags: [Survey Sampling, Statistical Design, PPS Sampling, Survey Methods, Probability Sampling]
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
  <h2 style="color: white; margin: 0;">Multi-Stage Area Probability Sample Design for the Detroit Transportation Security Survey</h2>
  <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">University of Maryland | Jan 2026 – May 2026</p>
  <div style="margin-top: 1rem;">
    <span class="tech-tag">R</span>
    <span class="tech-tag">PPS Sampling</span>
    <span class="tech-tag">Survey Weighting</span>
    <span class="tech-tag">Census Frames</span>
    <span class="tech-tag">Design Effects</span>
  </div>
</div>

## Project Overview

A comprehensive multi-stage area probability sample design for a Detroit transportation security study, developed from raw Census data through to a fully operationalized field deployment plan with rigorous statistical justification.

## Key Contributions

<div class="metric-card">
  <strong>Frame Construction:</strong> Cleaned 276 raw census tracts into an operational sampling frame of 266 tracts and 614 block groups covering 639,090 residents and 480,102 adults.
</div>

<div class="metric-card">
  <strong>PPS Design:</strong> Built a probability proportionate to size design selecting 40 census tracts and 40 block groups to support 1,000 planned interviews, with equal domain targets of 250 completes for each age group from 18-34 through 65 and older.
</div>

<div class="metric-card">
  <strong>Sampling Fractions and Weights:</strong> Converted response-rate assumptions of 35 percent to 65 percent into age-specific sampling fractions of 0.42 percent to 0.49 percent and constant within-domain base weights of 203.9 to 235.5, preserving a self-weighting design by age group.
</div>

<div class="metric-card">
  <strong>Field Workload Balance:</strong> Estimated a composite measure of size of 2,154.46, yielding an average of 53.86 adults approached and 25.01 expected completes per sampled tract for field operations planning.
</div>

<div class="metric-card">
  <strong>Operational Allocation:</strong> Operationalized 2,155 integer person selections across 40 sampled block groups, including 714 for ages 18-34, 556 for 35-49, 500 for 50-64, and 385 for ages 65 and older.
</div>

<div class="metric-card">
  <strong>Design Comparison:</strong> Benchmarked the final design against a simpler equal-rate alternative and showed that the naive allocation would miss the 35-49 target by 21.8 completes while overshooting older domains, justifying the domain-specific PPS strategy.
</div>

<div class="metric-card">
  <strong>Survey Precision:</strong> Estimated precision for a key transportation outcome at p = 0.15 with design effect 1.48, standard error 0.0137, effective sample size of about 676, and a 95 percent confidence interval of 12.3 percent to 17.7 percent.
</div>

## Technical Stack

- **Methods:** Multi-Stage Sampling, PPS Design, Stratified Allocation, Design Effect Estimation
- **Data:** Census Frame Construction, Block Group Sampling, Fieldwork Allocation
- **Programming:** R
- **Application Area:** Survey Weighting, Transportation Survey Methods

## Key Results

| Metric | Value |
|--------|-------|
| Census Tracts in Final Frame | 266 |
| Block Groups in Final Frame | 614 |
| Planned Interviews | 1,000 |
| Effective Sample Size | ~676 |
| 95% Confidence Interval | 12.3%-17.7% |

## Associated With

University of Maryland | Jan 2026 – May 2026