---
title: "Automated Plagiarism Detector"
excerpt: "Developed multi-algorithm plagiarism detection system using TF-IDF, cosine similarity, and Jaccard index achieving 91% detection accuracy.<br/><img src='/images/projects/plagiarism.png' style='max-width:500px;'>"
collection: portfolio
date: 2022-12-10
tags: [NLP, Text Analysis, Python, Machine Learning]
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
  <h2 style="color: white; margin: 0;">Automated Plagiarism Detector</h2>
  <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">BITS Pilani | Sep 2022 – Dec 2022</p>
  <div style="margin-top: 1rem;">
    <span class="tech-tag">Python</span>
    <span class="tech-tag">NLTK</span>
    <span class="tech-tag">TF-IDF</span>
    <span class="tech-tag">Cosine Similarity</span>
    <span class="tech-tag">Text Processing</span>
  </div>
</div>

## Project Overview

Built automated plagiarism detection system capable of identifying copied content across document corpora using multiple text similarity algorithms.

## Key Contributions

<div class="metric-card">
  <strong>Multi-Algorithm Approach:</strong> Developed ensemble plagiarism detection system combining TF-IDF vectorization, cosine similarity, and Jaccard index for robust text comparison
</div>

<div class="metric-card">
  <strong>Text Preprocessing:</strong> Implemented comprehensive NLP pipeline including tokenization, stemming, stopword removal, and n-gram extraction using NLTK
</div>

<div class="metric-card">
  <strong>High Accuracy:</strong> Achieved 91% plagiarism detection accuracy on test corpus of 500+ academic documents, with configurable similarity thresholds
</div>

## Technologies Used

- **Languages:** Python
- **NLP Libraries:** NLTK, Scikit-Learn
- **Methods:** TF-IDF, Cosine Similarity, Jaccard Index
- **Text Processing:** Tokenization, Stemming, N-grams

## Key Results

| Metric | Value |
|--------|-------|
| Detection Accuracy | 91% |
| Test Corpus Size | 500+ documents |
| Algorithms Used | 3 (TF-IDF, Cosine, Jaccard) |
| Similarity Threshold | Configurable |

## System Architecture

```
Document Input → Preprocessing Pipeline
               → Tokenization, Stemming, Stopword Removal
               → Feature Extraction (TF-IDF, N-grams)
               → Similarity Computation
               → Plagiarism Score → Report Generation
```
