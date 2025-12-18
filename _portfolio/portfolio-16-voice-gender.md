---
title: "Voice Gender Recognition"
excerpt: "Developed audio classification system for voice gender recognition achieving 96% accuracy using MFCC features and SVM/Random Forest classifiers.<br/><img src='/images/projects/voice-gender.png' style='max-width:500px;'>"
collection: portfolio
date: 2022-07-15
tags: [Machine Learning, Audio Processing, Python, Classification]
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
  <h2 style="color: white; margin: 0;">Voice Gender Recognition</h2>
  <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">BITS Pilani | Jul 2022</p>
  <div style="margin-top: 1rem;">
    <span class="tech-tag">Python</span>
    <span class="tech-tag">Librosa</span>
    <span class="tech-tag">MFCC</span>
    <span class="tech-tag">SVM</span>
    <span class="tech-tag">Audio Processing</span>
  </div>
</div>

## Project Overview

Built audio classification system for automatic gender recognition from voice samples, applicable to voice assistants, call center analytics, and speaker identification systems.

## Key Contributions

<div class="metric-card">
  <strong>Feature Extraction:</strong> Extracted acoustic features (MFCCs, spectral centroid, zero-crossing rate) from 3,168 voice samples using Librosa library
</div>

<div class="metric-card">
  <strong>Model Development:</strong> Trained SVM and Random Forest classifiers achieving 96% accuracy on gender classification task with cross-validation
</div>

<div class="metric-card">
  <strong>Feature Analysis:</strong> Analyzed feature importance, identifying fundamental frequency (F0) and formant frequencies as strongest gender discriminators
</div>

## Technologies Used

- **Languages:** Python
- **Libraries:** Librosa, Scikit-Learn
- **Features:** MFCC, Spectral Centroid, ZCR
- **Models:** SVM (RBF kernel), Random Forest

## Key Results

| Metric | Value |
|--------|-------|
| Accuracy | 96% |
| Voice Samples | 3,168 |
| Features Extracted | 20+ |
| Best Model | SVM (RBF) |

## Audio Features Used

| Feature | Description |
|---------|-------------|
| MFCC | Mel-frequency cepstral coefficients (13 coefficients) |
| Spectral Centroid | Center of mass of spectrum |
| Zero-Crossing Rate | Rate of sign changes in signal |
| Spectral Rolloff | Frequency below which 85% energy lies |
| Chroma Features | Pitch class profile |

## Applications

- Voice assistant personalization
- Call center analytics and routing
- Speaker identification systems
- Audio content tagging
