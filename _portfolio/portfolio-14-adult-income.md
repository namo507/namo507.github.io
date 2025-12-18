---
title: "Adult Income Classification"
excerpt: "Built ensemble classification models on UCI Adult Census dataset achieving 87% accuracy in predicting income levels using gradient boosting and feature engineering.<br/><img src='/images/projects/income-classification.png' style='max-width:500px;'>"
collection: portfolio
date: 2022-08-15
tags: [Machine Learning, Classification, Python, Scikit-Learn]
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
  <h2 style="color: white; margin: 0;">Adult Income Classification</h2>
  <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">BITS Pilani | Jul 2022 – Aug 2022</p>
  <div style="margin-top: 1rem;">
    <span class="tech-tag">Python</span>
    <span class="tech-tag">Scikit-Learn</span>
    <span class="tech-tag">XGBoost</span>
    <span class="tech-tag">Feature Engineering</span>
    <span class="tech-tag">UCI Dataset</span>
  </div>
</div>

## Project Overview

Developed machine learning pipeline to predict whether an individual's income exceeds $50K based on census data, exploring various classification algorithms and feature engineering techniques.

## Key Contributions

<div class="metric-card">
  <strong>Data Preprocessing:</strong> Performed comprehensive EDA on UCI Adult Census dataset (48,842 instances), handling missing values (7% MCAR) and encoding categorical features
</div>

<div class="metric-card">
  <strong>Model Comparison:</strong> Benchmarked Logistic Regression, Random Forest, and Gradient Boosting classifiers achieving 87% accuracy and 0.82 AUC-ROC
</div>

<div class="metric-card">
  <strong>Feature Analysis:</strong> Identified education level, capital gain, and occupation as top predictors through SHAP analysis and permutation importance
</div>

## Technologies Used

- **Languages:** Python
- **Libraries:** Scikit-Learn, XGBoost, pandas
- **Methods:** Ensemble Learning, Feature Engineering
- **Dataset:** UCI Adult Census (48,842 instances)

## Key Results

| Metric | Value |
|--------|-------|
| Accuracy | 87% |
| AUC-ROC | 0.82 |
| Dataset Size | 48,842 instances |
| Missing Data | 7% (MCAR) |
| Features | 14 |

## Feature Importance (Top 5)

1. Education level
2. Capital gain
3. Occupation
4. Hours per week
5. Age

## Models Compared

| Model | Accuracy | AUC-ROC |
|-------|----------|---------|
| Logistic Regression | 84% | 0.78 |
| Random Forest | 86% | 0.80 |
| Gradient Boosting | 87% | 0.82 |
