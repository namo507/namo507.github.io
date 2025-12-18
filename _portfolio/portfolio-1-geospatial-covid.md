---
title: "Geospatial COVID-19 Epidemiological Analysis"
excerpt: "Production-scale pipeline analyzing 129,572 U.S. census tracts for COVID-19 patterns and broadband access disparities"
collection: portfolio
date: 2025-05-01
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

## 🔬 Project Overview

Architected and deployed a **production-scale geospatial data integration pipeline** for the **University of Michigan Institute for Social Research**, analyzing COVID-19 incidence patterns across U.S. census tracts and their relationship with broadband access disparities.

<div class="project-stats">
  <div class="stat-box">
    <div class="stat-number">129,572</div>
    <div>Census Tracts</div>
  </div>
  <div class="stat-box">
    <div class="stat-number">100%</div>
    <div>Data Completeness</div>
  </div>
  <div class="stat-box">
    <div class="stat-number">28.6%</div>
    <div>Missingness Reduction</div>
  </div>
  <div class="stat-box">
    <div class="stat-number">3</div>
    <div>RUCA Strata</div>
  </div>
</div>

## 🎯 Technical Achievements

### Data Integration Pipeline
- Processed **129,572 U.S. census tracts** across **3 RUCA** (Rural-Urban Commuting Area) strata
- Achieved **100% broadband data completeness** through multi-source fusion (FCC, ACS, CDC)
- Reduced baseline missingness by **28.6%** via composite measure imputation
- Integrated social determinants of health data with epidemiological outcomes

### Epidemiological Modeling Framework
- Developed stratified framework analyzing COVID-19 incidence across **2,788 census tracts**
- Achieved **100% social determinant coverage** across all analysis units
- Uncovered statistically significant **non-linear rural inflections** (p < 0.01)
- Identified heterogeneous broadband effects by urbanicity level

### Data Quality Assurance Protocol
- Implemented **Moran's I spatial autocorrelation analysis**
- Identified **15% spatial clustering violations** requiring methodological adjustment
- Achieved **85% of tracts with ≥95% temporal completeness**
- RUCA-stratified missingness diagnostics for bias detection

## 🛠️ Technology Stack

<div class="tech-stack">
  <span class="tech-tag">Python</span>
  <span class="tech-tag">R</span>
  <span class="tech-tag">GeoPandas</span>
  <span class="tech-tag">PySAL</span>
  <span class="tech-tag">PostgreSQL/PostGIS</span>
  <span class="tech-tag">Apache Spark</span>
  <span class="tech-tag">QGIS</span>
  <span class="tech-tag">Statistical Modeling</span>
  <span class="tech-tag">Spatial Econometrics</span>
</div>

## 📊 Research Impact

This research contributes to understanding:
- **Digital Divide Effects**: How broadband access affects health outcomes in rural vs. urban areas
- **Spatial Epidemiology**: The geographic distribution of COVID-19 across different community types
- **Missing Data Methods**: Best practices for handling complex missingness in large-scale epidemiological studies
- **Health Equity**: Identifying communities with compounding vulnerabilities

## 🏢 Organization

**Institute for Social Research, University of Michigan**  
*May 2025 – Present*
