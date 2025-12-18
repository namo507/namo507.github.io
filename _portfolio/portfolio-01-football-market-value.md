---
title: "Player Market Value Analysis in Elite European Football"
excerpt: "Econometric analysis of transfer market valuation for 600+ players across Europe's top 5 leagues using regularized regression and feature engineering.<br/><img src='/images/projects/football-market.png' style='max-width:500px;'>"
collection: portfolio
date: 2025-12-15
tags: [Machine Learning, Sports Analytics, Regression, Python]
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
  <h2 style="color: white; margin: 0;">Player Market Value Analysis in Elite European Football</h2>
  <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">University of Maryland | Sep 2025 – Dec 2025</p>
  <div style="margin-top: 1rem;">
    <span class="tech-tag">Python</span>
    <span class="tech-tag">Scikit-Learn</span>
    <span class="tech-tag">Ridge/Lasso Regression</span>
    <span class="tech-tag">Random Forest</span>
    <span class="tech-tag">XGBoost</span>
  </div>
</div>

## Project Overview

Conducted comprehensive econometric analysis of transfer market valuation for **600+ players** across Europe's top 5 leagues (Premier League, La Liga, Bundesliga, Serie A, Ligue 1).

## Key Contributions

<div class="metric-card">
  <strong>Feature Engineering:</strong> Engineered 15+ domain-specific features including goal contribution rate, minutes-per-appearance ratios, and league prestige weights to capture latent valuation drivers
</div>

<div class="metric-card">
  <strong>Model Development:</strong> Benchmarked regularized regression (Ridge, Lasso, Elastic Net), Random Forest, and XGBoost models achieving optimal R² = 0.78 on holdout test set
</div>

<div class="metric-card">
  <strong>Interpretability:</strong> Applied SHAP values and permutation importance to identify age, goals scored, and league tier as top-3 valuation predictors, informing transfer strategy recommendations
</div>

## Technologies Used

- **Languages:** Python
- **ML Libraries:** Scikit-Learn, XGBoost
- **Analysis:** SHAP, Permutation Importance
- **Data:** TransferMarkt, FBref

## Key Results

| Metric | Value |
|--------|-------|
| Players Analyzed | 600+ |
| Features Engineered | 15+ |
| Best Model R² | 0.78 |
| Top Leagues Covered | 5 |
