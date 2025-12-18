---
title: "LEXNet for Internet Traffic Classification"
excerpt: "Implemented CNN architecture achieving 98.7% accuracy on ISCXVPN2016 dataset for encrypted traffic classification and VPN detection.<br/><img src='/images/projects/lexnet.png' style='max-width:500px;'>"
collection: portfolio
date: 2023-12-15
tags: [Deep Learning, CNN, Network Security, Python]
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
  <h2 style="color: white; margin: 0;">LEXNet for Internet Traffic Classification</h2>
  <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">BITS Pilani | Aug 2023 – Dec 2023</p>
  <div style="margin-top: 1rem;">
    <span class="tech-tag">Python</span>
    <span class="tech-tag">PyTorch</span>
    <span class="tech-tag">CNN</span>
    <span class="tech-tag">Network Security</span>
    <span class="tech-tag">ISCXVPN2016</span>
  </div>
</div>

## Project Overview

Developed deep learning system for classifying encrypted internet traffic and detecting VPN usage, critical for network security and traffic management applications.

## Key Contributions

<div class="metric-card">
  <strong>Architecture Implementation:</strong> Implemented LEXNet (Lightweight Encrypted Traffic Classifier) CNN architecture in PyTorch for encrypted traffic classification
</div>

<div class="metric-card">
  <strong>Data Processing:</strong> Preprocessed ISCXVPN2016 dataset converting raw PCAP files to payload byte representations, extracting first-N-bytes features for 12 traffic classes
</div>

<div class="metric-card">
  <strong>High Accuracy:</strong> Achieved 98.7% overall accuracy and 97.2% F1-score on VPN vs. non-VPN detection task, outperforming baseline Random Forest by 8%
</div>

## Technologies Used

- **Languages:** Python
- **Framework:** PyTorch
- **Architecture:** CNN (LEXNet)
- **Dataset:** ISCXVPN2016
- **Domain:** Network Security

## Key Results

| Metric | Value |
|--------|-------|
| Overall Accuracy | 98.7% |
| F1-Score (VPN Detection) | 97.2% |
| Traffic Classes | 12 |
| Improvement over RF | +8% |

## Model Architecture

```
Input Layer → Conv1D → BatchNorm → ReLU → MaxPool
           → Conv1D → BatchNorm → ReLU → MaxPool
           → Flatten → FC → Softmax
```
