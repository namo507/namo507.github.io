---
title: "Analyzing Public Perceptions and Sentiment of Electric Vehicles in the Era of Sustainable Transformation"
collection: publications
permalink: /publication/2025-ev-sentiment
excerpt: 'I engineered a multi-source sentiment analysis pipeline processing 1.1M+ social media posts, achieving 91.6% classification accuracy using DistilBERT transformers.'
date: 2025-05-16
venue: '80th Annual Conference of the American Association for Public Opinion Research (AAPOR)'
citation: 'Chakravarty, S., & Shrivastava, N. (2025). Analyzing Public Perceptions and Sentiment of Electric Vehicles in the Era of Sustainable Transformation. 80th Annual AAPOR Conference.'
---

This research examines how public sentiment toward electric vehicles has evolved from 2020-2024 across social media and traditional news platforms. I engineered a comprehensive sentiment analysis pipeline that processes over 1.1 million social media posts from 5 Reddit communities (550K comments) and 40 New York Times articles.

## Methodology

I implemented a DistilBERT transformer model achieving 91.6% classification accuracy on electric vehicle discourse. The research involved:

- Multi-source data collection from Reddit and New York Times APIs
- Comparative analysis of 10 Groq LLM variants (Llama 3.1/3.2 series, Mixtral)
- Statistical analysis using R for temporal trend identification

## Key Discoveries

### LLM Bias Detection
I discovered systematic bias in large language model sentiment prediction. LLMs exhibited +0.57 positive sentiment bias compared to actual Reddit data (M=-0.18, SD=0.52), with statistical significance (F(2,549)=28.43, p<.001).

### Temporal Trends
Identified 35% increase in negative EV sentiment on Reddit post-2022 despite rising adoption rates. NYT coverage remained consistently negative (M=-0.23) for core EV terms but positive for "Tesla" and "autonomous" keywords.

### Model Performance
Llama-3.2-90b-vision-preview best approximated human sentiment patterns among tested models.
