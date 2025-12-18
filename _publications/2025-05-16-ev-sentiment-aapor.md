---
title: "Analyzing Public Perceptions and Sentiment of Electric Vehicles in the Era of Sustainable Transformation"
collection: publications
category: conferences
permalink: /publication/2025-ev-sentiment-aapor
excerpt: 'Engineered a multi-source sentiment analysis pipeline processing 1.1M+ social media posts from Reddit and NYT, achieving 91.6% classification accuracy using DistilBERT and comparing 10 LLM variants for sentiment bias.'
date: 2025-05-16
venue: '80th Annual Conference of the American Association for Public Opinion Research (AAPOR)'
paperurl: 'https://aapor.confex.com/aapor/2025/meetingapp.cgi/Paper/3714'
citation: 'Chakravarty, S., & Shrivastava, N. (2025). &quot;Analyzing Public Perceptions and Sentiment of Electric Vehicles in the Era of Sustainable Transformation.&quot; <i>80th Annual AAPOR Conference</i>. St. Louis, MO.'
---

## Overview

This research examines how public sentiment toward electric vehicles (EVs) has evolved from 2020-2024 across social media and traditional news platforms, revealing critical insights about public perception gaps and systematic biases in LLM-based sentiment analysis.

## Methodology

### Data Collection & Processing
- Engineered a **multi-source sentiment analysis pipeline** processing **1.1M+ social media posts**
- Collected data from **5 Reddit communities** (**550K comments**) and **40 New York Times articles**
- Implemented **DistilBERT transformer model** achieving **91.6% classification accuracy** on electric vehicle discourse

### LLM Comparative Analysis
- Conducted systematic evaluation of **10 Groq LLM variants** (Llama 3.1/3.2 series, Mixtral)
- Discovered systematic bias in large language model sentiment prediction
- Found LLMs exhibited **+0.57 positive sentiment bias** compared to actual Reddit data (**M=-0.18, SD=0.52**)
- Statistical significance demonstrated: **F(2,549)=28.43, p<0.001**

## Key Discoveries

### Temporal Trends
- Identified **35% increase in negative EV sentiment** on Reddit post-2022 despite rising adoption rates
- NYT coverage remained consistently negative (**M=-0.23**) for core EV terms
- Positive sentiment observed for Tesla and autonomous vehicle keywords

### LLM Performance
- **Llama-3.2-90b-vision-preview** best approximated human sentiment patterns
- Revealed systematic optimism bias in AI-generated sentiment assessments
- Critical implications for using LLMs in survey research and public opinion analysis

## Research Implications

This study has significant implications for:
- **Survey methodologists** using AI-assisted data collection and analysis
- **Public policy researchers** analyzing public sentiment toward green technologies
- **AI researchers** developing more accurate and unbiased sentiment analysis tools
- **Climate communication** strategists understanding public EV perception

[View Conference Abstract](https://aapor.confex.com/aapor/2025/meetingapp.cgi/Paper/3714){:target="_blank"}
