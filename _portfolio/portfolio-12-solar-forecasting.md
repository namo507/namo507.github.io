---
title: "Statistical Analysis and Forecasting of Solar Energy Production"
excerpt: "Developed time series forecasting models (ARIMA, Prophet) for solar energy production achieving MAPE of 8.5% on 3-year historical data.<br/><img src='/images/projects/solar-forecasting.png' style='max-width:500px;'>"
collection: portfolio
date: 2022-11-15
tags: [Time Series, Forecasting, ARIMA, Python, Renewable Energy]
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
  <h2 style="color: white; margin: 0;">Statistical Analysis and Forecasting of Solar Energy Production</h2>
  <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">BITS Pilani | Sep 2022 – Dec 2022</p>
  <div style="margin-top: 1rem;">
    <span class="tech-tag">Python</span>
    <span class="tech-tag">ARIMA</span>
    <span class="tech-tag">Prophet</span>
    <span class="tech-tag">Time Series</span>
    <span class="tech-tag">Renewable Energy</span>
  </div>
</div>

## Project Overview

Developed comprehensive time series forecasting system for solar energy production to support grid planning and energy management decisions.

## Key Contributions

<div class="metric-card">
  <strong>Model Development:</strong> Developed ARIMA and Prophet time series models for daily solar energy production forecasting using 3 years of historical generation data
</div>

<div class="metric-card">
  <strong>Feature Engineering:</strong> Incorporated exogenous variables (temperature, cloud cover, humidity) improving forecast accuracy by 12% over univariate baseline
</div>

<div class="metric-card">
  <strong>High Accuracy:</strong> Achieved MAPE of 8.5% on 30-day ahead forecasts, enabling improved grid scheduling and energy trading decisions
</div>

## Technologies Used

- **Languages:** Python
- **Libraries:** statsmodels, Prophet, pandas
- **Methods:** ARIMA, SARIMA, Facebook Prophet
- **Data:** 3 years historical solar generation

## Key Results

| Metric | Value |
|--------|-------|
| MAPE (30-day forecast) | 8.5% |
| Historical Data | 3 years |
| Improvement over Baseline | +12% |
| Exogenous Variables | 3 |

## Forecasting Pipeline

```
Data Collection → Preprocessing → Stationarity Testing
                → Model Selection (AIC/BIC)
                → Parameter Optimization
                → Forecast Generation
                → Error Analysis → Deployment
```
