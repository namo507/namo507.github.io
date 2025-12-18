---
title: "EV Sentiment Analysis with Transformer Models"
excerpt: "Multi-source NLP pipeline processing 1.1M+ social media posts with 91.6% accuracy, comparing LLM variants for bias detection"
collection: portfolio
date: 2025-05-16
---

<style>
.project-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}
.stat-box {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.2rem;
  border-radius: 10px;
  text-align: center;
}
.stat-number { font-size: 1.6rem; font-weight: bold; }
.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
}
.tech-tag {
  background: #e9ecef;
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  font-size: 0.85rem;
}
</style>

## 📊 Project Overview

Engineered a **multi-source sentiment analysis pipeline** to analyze public perceptions of electric vehicles (EVs) across social media and news platforms from 2020-2024. This research was presented at the **80th AAPOR Annual Conference**.

<div class="project-stats">
  <div class="stat-box">
    <div class="stat-number">1.1M+</div>
    <div>Posts Analyzed</div>
  </div>
  <div class="stat-box">
    <div class="stat-number">91.6%</div>
    <div>Model Accuracy</div>
  </div>
  <div class="stat-box">
    <div class="stat-number">10</div>
    <div>LLMs Compared</div>
  </div>
  <div class="stat-box">
    <div class="stat-number">5</div>
    <div>Reddit Communities</div>
  </div>
</div>

## 🎯 Technical Implementation

### Data Collection Pipeline
- Collected data from **5 Reddit communities** totaling **550K+ comments**
- Scraped and analyzed **40 New York Times articles** on EV topics
- Built robust data pipeline handling rate limits and API constraints
- Temporal coverage spanning 2020-2024 for trend analysis

### Transformer-Based Classification
- Implemented **DistilBERT** transformer model for sentiment classification
- Achieved **91.6% classification accuracy** on EV discourse
- Fine-tuned on domain-specific EV terminology
- Multi-class sentiment prediction (positive, negative, neutral)

### LLM Comparative Analysis
- Systematic evaluation of **10 Groq LLM variants**:
  - Llama 3.1 series (8B, 70B, 405B)
  - Llama 3.2 series (1B, 3B, 11B, 90B)
  - Mixtral 8x7B
- Discovered **+0.57 positive sentiment bias** in LLMs vs. actual Reddit data
- Statistical validation: **F(2,549)=28.43, p<0.001**

## 📈 Key Findings

### Sentiment Trends
- **35% increase in negative EV sentiment** on Reddit post-2022
- NYT coverage consistently negative (**M=-0.23**) for core EV terms
- Tesla and autonomous vehicle keywords showed positive sentiment
- Significant divergence between public discourse and media coverage

### LLM Bias Detection
- LLMs systematically overestimate positive sentiment
- **Llama-3.2-90b-vision-preview** best approximates human patterns
- Critical implications for AI-assisted survey research

## 🛠️ Technology Stack

<div class="tech-stack">
  <span class="tech-tag">Python</span>
  <span class="tech-tag">Hugging Face Transformers</span>
  <span class="tech-tag">DistilBERT</span>
  <span class="tech-tag">Groq API</span>
  <span class="tech-tag">PRAW (Reddit API)</span>
  <span class="tech-tag">BeautifulSoup</span>
  <span class="tech-tag">Pandas</span>
  <span class="tech-tag">Matplotlib/Seaborn</span>
  <span class="tech-tag">SciPy/Statsmodels</span>
</div>

## 🎤 Presentation

**80th Annual AAPOR Conference**  
*May 15-17, 2025 | St. Louis, MO*

[📄 View Conference Abstract](https://aapor.confex.com/aapor/2025/meetingapp.cgi/Paper/3714){:target="_blank"}
