---
title: "IP Infringement Detection System"
excerpt: "Scalable ML pipeline processing 2.4M images for trademark conflict identification with 92% precision"
collection: portfolio
date: 2024-06-01
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

## 🤖 Project Overview

Engineered a **scalable logo similarity detection system** at **Legistify Services** for intellectual property infringement analysis, serving **150+ client cases monthly** and supporting **500+ daily active users**.

<div class="project-stats">
  <div class="stat-box">
    <div class="stat-number">2.4M</div>
    <div>Images Processed</div>
  </div>
  <div class="stat-box">
    <div class="stat-number">92%</div>
    <div>Precision</div>
  </div>
  <div class="stat-box">
    <div class="stat-number">70%</div>
    <div>Time Reduction</div>
  </div>
  <div class="stat-box">
    <div class="stat-number">150+</div>
    <div>Monthly Cases</div>
  </div>
</div>

## 🎯 Technical Implementation

### Image Similarity Pipeline
- **Perceptual Hashing**: Implemented imagehash library for fast image fingerprinting
- **Feature Extraction**: SIFT (Scale-Invariant Feature Transform) for robust keypoint detection
- **Vector Search**: Faiss-based approximate nearest neighbor search for scalable similarity matching
- **API Architecture**: FastAPI microservice for production deployment with async processing

### Document Analysis System
- Deployed **Azure Cognitive Services** with Vision Studio 4.0
- Multi-modal document analysis: OCR, object detection, image captioning
- Processed **50,000+ legal filings** with **95% extraction accuracy**
- Bilingual text recognition (English/Hindi) using EasyOCR for Indian legal documents

### Phonetic Trademark Matching
- Implemented **Double Metaphone** algorithm for phonetic encoding
- **Jellyfish** string matching for fuzzy comparison
- Compared **50,000 new trademarks** against **300,000 database entries**
- Achieved **92% accuracy** in conflict detection
- **60% reduction** in computational overhead through intelligent pre-filtering and optimized SQL queries

## 🛠️ Technology Stack

<div class="tech-stack">
  <span class="tech-tag">Python</span>
  <span class="tech-tag">FastAPI</span>
  <span class="tech-tag">OpenCV</span>
  <span class="tech-tag">Faiss</span>
  <span class="tech-tag">Azure Cognitive Services</span>
  <span class="tech-tag">EasyOCR</span>
  <span class="tech-tag">PostgreSQL</span>
  <span class="tech-tag">Docker</span>
  <span class="tech-tag">Redis</span>
</div>

## 💼 Business Impact

- **70% reduction** in manual trademark review time
- Enabled automated IP infringement detection for legal teams
- Supports **500+ daily active users** on the platform
- Directly supports **150+ client cases monthly**
- Integrated with **Legistrak API ecosystem** (150+ REST API calls, 95% success rate)

## 🏢 Organization

**Legistify Services Private Limited**  
*Jan 2024 – Jun 2024 | Gurugram, India*
