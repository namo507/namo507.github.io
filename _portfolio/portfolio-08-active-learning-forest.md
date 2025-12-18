---
title: "Active Learning for Forest Cover Classification"
excerpt: "Developed active learning framework achieving 94% accuracy with 30% less labeled data using uncertainty sampling and query-by-committee strategies.<br/><img src='/images/projects/forest-cover.png' style='max-width:500px;'>"
collection: portfolio
date: 2022-12-15
tags: [Machine Learning, Active Learning, Random Forest, Python]
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
  <h2 style="color: white; margin: 0;">Active Learning for Forest Cover Classification</h2>
  <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">BITS Pilani | Sep 2022 – Dec 2022</p>
  <div style="margin-top: 1rem;">
    <span class="tech-tag">Python</span>
    <span class="tech-tag">Scikit-Learn</span>
    <span class="tech-tag">Active Learning</span>
    <span class="tech-tag">Random Forest</span>
    <span class="tech-tag">UCI Dataset</span>
  </div>
</div>

## Project Overview

Implemented active learning framework to efficiently classify forest cover types with minimal labeled data, demonstrating significant labeling cost reduction.

## Key Contributions

<div class="metric-card">
  <strong>Active Learning Framework:</strong> Implemented uncertainty sampling and query-by-committee strategies on UCI Forest Covertype dataset (581,012 instances, 7 classes)
</div>

<div class="metric-card">
  <strong>Efficiency Gains:</strong> Achieved 94% classification accuracy using only 70% of training labels compared to passive learning baseline, reducing annotation costs by 30%
</div>

<div class="metric-card">
  <strong>Comparative Analysis:</strong> Analyzed learning curves and query efficiency, demonstrating uncertainty sampling outperforms random sampling by 12% at 50% label budget
</div>

## Technologies Used

- **Languages:** Python
- **Libraries:** Scikit-Learn, modAL
- **Methods:** Uncertainty Sampling, Query-by-Committee
- **Dataset:** UCI Forest Covertype (581K instances)

## Key Results

| Metric | Value |
|--------|-------|
| Dataset Size | 581,012 instances |
| Classes | 7 forest cover types |
| Final Accuracy | 94% |
| Label Reduction | 30% |
| Improvement over Random | +12% at 50% budget |

## Active Learning Workflow

```
1. Initialize with small labeled seed set
2. Train classifier on current labeled data
3. Score unlabeled instances by uncertainty
4. Query most informative samples for labeling
5. Update labeled set and retrain
6. Repeat until budget exhausted
```
