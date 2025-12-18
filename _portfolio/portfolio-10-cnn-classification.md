---
title: "Convolutional Neural Networks for Image Classification"
excerpt: "Implemented CNN architectures from scratch achieving 92% accuracy on CIFAR-10, exploring various optimization techniques and regularization methods.<br/><img src='/images/projects/cnn-classification.png' style='max-width:500px;'>"
collection: portfolio
date: 2022-12-05
tags: [Deep Learning, CNN, Computer Vision, PyTorch]
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
  <h2 style="color: white; margin: 0;">Convolutional Neural Networks for Image Classification</h2>
  <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">BITS Pilani | Sep 2022 – Dec 2022</p>
  <div style="margin-top: 1rem;">
    <span class="tech-tag">Python</span>
    <span class="tech-tag">PyTorch</span>
    <span class="tech-tag">CNN</span>
    <span class="tech-tag">CIFAR-10</span>
    <span class="tech-tag">Computer Vision</span>
  </div>
</div>

## Project Overview

Deep dive into convolutional neural network architectures, implementing various designs from scratch and analyzing their performance on standard image classification benchmarks.

## Key Contributions

<div class="metric-card">
  <strong>Architecture Implementation:</strong> Implemented LeNet, VGG-style, and custom CNN architectures from scratch in PyTorch, achieving 92% accuracy on CIFAR-10
</div>

<div class="metric-card">
  <strong>Optimization Experiments:</strong> Conducted ablation studies on optimization techniques (SGD, Adam, RMSprop), learning rate schedules, and batch normalization effects
</div>

<div class="metric-card">
  <strong>Regularization Analysis:</strong> Analyzed impact of dropout, L2 regularization, and data augmentation on model generalization, reducing overfitting gap by 15%
</div>

## Technologies Used

- **Languages:** Python
- **Framework:** PyTorch
- **Dataset:** CIFAR-10 (60,000 images, 10 classes)
- **Hardware:** GPU acceleration (CUDA)

## Key Results

| Metric | Value |
|--------|-------|
| Final Accuracy | 92% |
| Dataset | CIFAR-10 |
| Architectures Tested | 4 |
| Overfitting Reduction | 15% |

## Architectures Explored

1. **LeNet-5:** Classic architecture, baseline performance
2. **VGG-style:** Deeper networks with 3x3 convolutions
3. **Custom CNN:** Optimized architecture for CIFAR-10
4. **ResNet-inspired:** Skip connections for deeper training
