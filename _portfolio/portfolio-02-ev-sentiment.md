---
title: "EV Sentiment Analysis Using Transformer Models"
excerpt: "Analyzed 1.1M+ Reddit posts on electric vehicles using transformer-based NLP models, achieving 91.6% accuracy in sentiment classification. Presented at AAPOR 2025.<br/><img src='/images/projects/ev-sentiment.png' style='max-width:500px;'>"
collection: portfolio
date: 2025-05-15
tags: [NLP, Deep Learning, Transformers, Survey Research, Python]
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
  <h2 style="color: white; margin: 0;">EV Sentiment Analysis Using Transformer Models</h2>
  <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">University of Maryland | Sep 2024 – May 2025</p>
  <div style="margin-top: 1rem;">
    <span class="tech-tag">Python</span>
    <span class="tech-tag">Hugging Face</span>
    <span class="tech-tag">BERT/RoBERTa</span>
    <span class="tech-tag">PyTorch</span>
    <span class="tech-tag">PRAW API</span>
  </div>
</div>

## Project Overview

Developed comprehensive sentiment analysis pipeline to understand public perception of electric vehicles using transformer-based NLP models on large-scale social media data.

## Key Contributions

<div class="metric-card">
  <strong>Data Collection:</strong> Collected and preprocessed 1.1M+ Reddit posts spanning 2019–2024 using PRAW API with temporal stratification across EV-related subreddits
</div>

<div class="metric-card">
  <strong>Model Development:</strong> Fine-tuned BERT, RoBERTa, and DistilBERT on 5,000+ manually labeled posts for domain-specific EV sentiment classification, achieving 91.6% accuracy (F1: 0.89)
</div>

<div class="metric-card">
  <strong>Trend Analysis:</strong> Conducted longitudinal sentiment analysis correlating public perception shifts with EV policy milestones (e.g., IRA, state incentives), identifying 23% sentiment improvement post-2022
</div>

<div class="metric-card">
  <strong>Academic Presentation:</strong> Presented findings at AAPOR 2025 conference, demonstrating novel integration of social media analysis with traditional survey methodology
</div>

## Technologies Used

- **Languages:** Python
- **ML/NLP:** PyTorch, Hugging Face Transformers
- **Models:** BERT, RoBERTa, DistilBERT
- **Data Collection:** PRAW Reddit API

## Key Results

| Metric | Value |
|--------|-------|
| Posts Analyzed | 1.1M+ |
| Model Accuracy | 91.6% |
| F1 Score | 0.89 |
| Time Period | 2019-2024 |
| Labeled Training Set | 5,000+ posts |

## Publication

This research was presented at the **80th Annual AAPOR Conference** (May 2025) in Arlington, VA.
