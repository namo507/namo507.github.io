---
title: "Analyzing Public Perceptions and Sentiment of Electric Vehicles in the Era of Sustainable Transformation"
collection: talks
type: "Conference Presentation"
permalink: /talks/2025-aapor-ev-sentiment
venue: "80th Annual AAPOR Conference"
date: 2025-05-16
location: "St. Louis, MO, USA"
---

## Presentation Overview

Presented research on public sentiment analysis toward electric vehicles (EVs) at the prestigious **American Association for Public Opinion Research (AAPOR)** annual conference—the premier venue for survey methodology and public opinion research.

## Abstract

This study examines public sentiment toward electric vehicles (EVs) across social media and traditional news platforms from 2020-2024. We engineered a multi-source sentiment analysis pipeline processing 1.1M+ posts from Reddit and New York Times, implementing DistilBERT transformers achieving 91.6% accuracy. Our comparative evaluation of 10 LLM variants revealed systematic positive bias (+0.57) in AI-generated sentiment assessments, with critical implications for AI-assisted survey research.

## Key Topics Covered

### 1. Multi-Source Data Collection
- Reddit API integration across 5 EV-focused communities (550K+ comments)
- New York Times article analysis (40 articles, 2020-2024)
- Robust data pipeline handling rate limits and API constraints

### 2. Transformer-Based Sentiment Analysis
- DistilBERT implementation achieving **91.6% accuracy**
- Domain-specific fine-tuning for EV terminology
- Temporal trend analysis revealing sentiment shifts

### 3. LLM Comparative Evaluation
- Systematic comparison of **10 Groq LLM variants**
- Discovery of **+0.57 positive sentiment bias** in LLM predictions
- Statistical validation: F(2,549)=28.43, p<0.001
- Implications for AI-assisted survey research methodology

## Key Findings

| Finding | Details |
|---------|---------|
| Sentiment Shift | 35% increase in negative EV sentiment post-2022 |
| NYT Coverage | Consistently negative (M=-0.23) for core EV terms |
| LLM Bias | +0.57 systematic positive bias vs. actual Reddit data |
| Best LLM | Llama-3.2-90b-vision-preview closest to human patterns |

## Conference Details

- **Conference**: 80th Annual Conference of the American Association for Public Opinion Research
- **Dates**: May 15-17, 2025
- **Location**: St. Louis, Missouri, USA
- **Session**: Survey Methodology & AI Integration
- **Co-author**: Snigdha Chakravarty

## Resources

[View Conference Abstract](https://aapor.confex.com/aapor/2025/meetingapp.cgi/Paper/3714){:target="_blank"}

## Implications

This research has significant implications for:
- **Survey Methodologists**: Understanding LLM limitations in sentiment analysis
- **Public Opinion Researchers**: Capturing authentic public discourse on green technologies
- **AI Practitioners**: Developing bias-aware sentiment analysis tools
- **Policy Makers**: Evidence-based understanding of public EV perceptions
