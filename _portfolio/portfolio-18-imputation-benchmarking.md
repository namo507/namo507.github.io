---
title: "Benchmarking In-Context Learning against Chained Equations: A Simulation Study on Item Nonresponse Adjustment"
excerpt: "Monte Carlo simulation framework benchmarking 4 missing data imputation pipelines (MICE variants vs. TabPFN/In-Context Learning) across 24 distinct missingness conditions, achieving 5.3% reduction in downstream coefficient bias."
collection: portfolio
date: 2026-01-01
tags: [Statistical Modeling, Machine Learning, Monte Carlo Simulation, Missing Data, Survey Methods]
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
  <h2 style="color: white; margin: 0;">Benchmarking In-Context Learning against Chained Equations: A Simulation Study on Item Nonresponse Adjustment</h2>
  <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">University of Maryland | Jan 2026 – May 2026</p>
  <div style="margin-top: 1rem;">
    <span class="tech-tag">Python</span>
    <span class="tech-tag">Monte Carlo Methods</span>
    <span class="tech-tag">MICE</span>
    <span class="tech-tag">TabPFN</span>
    <span class="tech-tag">Survey Methods</span>
  </div>
</div>

## Project Overview

A rigorous Monte Carlo simulation study benchmarking missing data imputation pipelines for item nonresponse adjustment in survey settings. The study executed 720 total simulation iterations spanning 24 distinct missingness conditions across MCAR and MAR mechanisms up to 30 percent missingness, with evaluation framed through the Total Survey Error perspective.

## Key Contributions

<div class="metric-card">
  <strong>Simulation Architecture:</strong> Engineered a Monte Carlo simulation framework executing 720 total iterations to benchmark four missing data imputation pipelines, including MICE-PMM, MICE-LASSO, MICE-RF, and TabPFN-based in-context learning, across 24 distinct missingness conditions.
</div>

<div class="metric-card">
  <strong>Coefficient Bias Reduction:</strong> Achieved a 5.3 percent reduction in downstream coefficient bias by implementing a gradient-boosted TabPFN surrogate over traditional MICE-PMM under complex Missing at Random scenarios.
</div>

<div class="metric-card">
  <strong>Inferential Error Quantification:</strong> Identified a 16.7 percent degradation in 95 percent confidence interval validity when machine learning imputations were used without Rubin's Combining Rules, highlighting a critical inferential risk for applied survey workflows.
</div>

<div class="metric-card">
  <strong>Optimal Regularized Imputation:</strong> Found MICE-LASSO to be the strongest regularized approach for continuous variable imputation, minimizing RMSE to 5.14-5.40 on a 0-100 response scale across the full simulation grid.
</div>

<div class="metric-card">
  <strong>Downstream Inference Evaluation:</strong> Evaluated inference retention against a baseline logistic regression classifier for high-stress indicators with baseline AUC of 0.978, directly linking imputation quality to downstream model performance.
</div>

## Technical Stack

- **Methods:** Statistical Modeling, Monte Carlo Simulation, Multiple Imputation by Chained Equations, Rubin's Rules
- **Machine Learning:** TabPFN, Gradient-Boosted Surrogates, Logistic Regression
- **Programming:** Python
- **Application Area:** Missing Data, Survey Methods, Total Survey Error

## Key Results

| Metric | Value |
|--------|-------|
| Simulation Iterations | 720 |
| Missingness Conditions | 24 |
| Bias Reduction | 5.3% |
| CI Validity Degradation | 16.7% |
| Minimum RMSE | 5.14-5.40 |

## Associated With

University of Maryland | Jan 2026 – May 2026