---
permalink: /
title: "Welcome"
excerpt: "About me"
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

<style>
.hero-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}
.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.2rem;
  border-radius: 10px;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: default;
}
.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}
.stat-number { font-size: 1.8rem; font-weight: bold; }
.stat-label { font-size: 0.85rem; opacity: 0.9; }
.highlight-box {
  background: #f0f4ff;
  border-left: 4px solid #667eea;
  padding: 1rem 1.5rem;
  margin: 1.5rem 0;
  border-radius: 0 8px 8px 0;
  transition: border-left-width 0.3s ease, background 0.3s ease;
}
.highlight-box:hover {
  border-left-width: 6px;
  background: #e8efff;
}
.research-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
}
.research-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  font-size: 0.85rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: default;
}
.research-tag:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
.timeline-item {
  border-left: 3px solid #667eea;
  padding-left: 1.2rem;
  margin-bottom: 1.2rem;
  position: relative;
  transition: padding-left 0.3s ease;
}
.timeline-item:hover {
  padding-left: 1.5rem;
}
.timeline-item::before {
  content: '';
  position: absolute;
  left: -7px;
  top: 5px;
  width: 10px;
  height: 10px;
  background: #667eea;
  border-radius: 50%;
  transition: transform 0.3s ease;
}
.timeline-item:hover::before {
  transform: scale(1.3);
}
.badge {
  display: inline-block;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-left: 0.5rem;
  transition: transform 0.2s ease;
}
.badge:hover {
  transform: scale(1.1);
}
.cta-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 25px;
  text-decoration: none;
  margin: 0.3rem;
  display: inline-block;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.cta-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  color: white;
  text-decoration: none;
}
</style>

## Hi, I'm Namit!

I'm a **graduate researcher** at the **University of Maryland** specializing in **survey methodology and data science**. I bridge traditional survey research with cutting-edge AI technologies to advance automated data collection, quality assurance, and responsible measurement at scale.

Currently, I serve as a **Research Assistant** at the **University of Michigan's Institute for Social Research**, where I conduct geospatial epidemiological research analyzing COVID-19 patterns across 129,000+ U.S. census tracts.

<div class="hero-stats">
  <div class="stat-card">
    <div class="stat-number">129K+</div>
    <div class="stat-label">Census Tracts Analyzed</div>
  </div>
  <div class="stat-card">
    <div class="stat-number">1.1M+</div>
    <div class="stat-label">Social Posts Processed</div>
  </div>
  <div class="stat-card">
    <div class="stat-number">2.4M</div>
    <div class="stat-label">Images in ML Pipeline</div>
  </div>
  <div class="stat-card">
    <div class="stat-number">91.6%</div>
    <div class="stat-label">Model Accuracy</div>
  </div>
</div>

## Research Summary

<div class="highlight-box">
My research agenda focuses on developing <strong>trustworthy data integration frameworks</strong> that fuse survey methodology principles with generative AI, deep learning architectures, and privacy-preserving computational methods. I've published in <strong>Springer</strong> and presented at <strong>AAPOR 2025</strong> on transformer-based sentiment analysis.
</div>

## Research Interests

<div class="research-tags">
  <span class="research-tag">Survey Methodology</span>
  <span class="research-tag">Causal Inference</span>
  <span class="research-tag">Transformer NLP</span>
  <span class="research-tag">Geospatial Analysis</span>
  <span class="research-tag">Privacy-Preserving AI</span>
  <span class="research-tag">Statistical Modeling</span>
  <span class="research-tag">Deep Learning</span>
  <span class="research-tag">Sentiment Analysis</span>
</div>

## Education

<div class="timeline-item">
  <strong>M.S. in Survey & Data Science</strong> (Data Science Track)<br>
  <em>University of Maryland, College Park</em> | Aug 2024 – May 2026<br>
  <span class="badge">Dean's Fellow</span><span class="badge">GPA: 3.814</span>
</div>

<div class="timeline-item">
  <strong>B.E. (Hons) in Civil Engineering</strong> (Minor: Data Science)<br>
  <em>BITS Pilani, India</em> | Nov 2020 – Jul 2024<br>
  <span class="badge">GPA: 3.33</span>
</div>

## Current Positions

| Role | Organization | Focus |
|------|--------------|-------|
| Research Assistant | UMich Institute for Social Research | Geospatial COVID-19 epidemiology |
| Teaching Assistant | UMD JPSM | Data Privacy & Confidentiality |

## Recent Highlights

- **Published** in Springer's *Advances in Data-Driven Computing and Intelligent Systems*
- **Presented** at the 80th AAPOR Annual Conference (May 2025) on EV sentiment analysis
- **Awarded** JPSM Dean's Fellowship for Academic Year 2025-26
- **Processing** 129,572 U.S. census tracts for COVID-19 geospatial analysis
- **Built** ML pipelines processing 2.4M+ images for IP infringement detection

## Let's Connect!

I'm always excited to discuss research collaborations, data science projects, or survey methodology innovations. Feel free to reach out via [email](mailto:namit507@gmail.com), connect on [LinkedIn](https://www.linkedin.com/in/namit-shrivastava-baab47204/), or check out my work on [GitHub](https://github.com/namo507)!

---

<p style="text-align: center; margin-top: 2rem;">
  <a href="/cv/" class="cta-btn">View CV</a>
  <a href="/publications/" class="cta-btn">Publications</a>
  <a href="/portfolio/" class="cta-btn">Projects</a>
</p>
