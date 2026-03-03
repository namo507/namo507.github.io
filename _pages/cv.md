---
layout: archive
title: "Curriculum Vitae"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

<style>
.cv-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 10px;
  margin-bottom: 2rem;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.cv-header:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}
.cv-header a { color: white; transition: opacity 0.2s ease; }
.cv-header a:hover { opacity: 0.8; }
.exp-card {
  background: #f8f9fa;
  border-left: 4px solid #667eea;
  padding: 1.2rem;
  margin-bottom: 1.2rem;
  border-radius: 0 8px 8px 0;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-left-width 0.3s ease;
}
.exp-card:hover {
  transform: translateX(5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  border-left-width: 6px;
}
.exp-card h4 { color: #667eea; margin: 0 0 0.3rem 0; }
.exp-meta { color: #666; font-size: 0.9rem; margin-bottom: 0.8rem; }
.skill-tag {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.25rem 0.7rem;
  border-radius: 15px;
  font-size: 0.8rem;
  margin: 0.15rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: default;
}
.skill-tag:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.4);
}
.gpa-badge {
  background: #28a745;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  font-size: 0.85rem;
  transition: transform 0.2s ease;
}
.gpa-badge:hover { transform: scale(1.1); }
.award-badge {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  font-size: 0.85rem;
  transition: transform 0.2s ease;
}
.award-badge:hover { transform: scale(1.1); }
</style>

<div class="cv-header">
  <h2 style="color:white;margin-bottom:0.5rem;">Namit Shrivastava</h2>
  <p>College Park, MD | (240) 476-8513 | <a href="mailto:namit507@gmail.com">namit507@gmail.com</a></p>
  <p>
    <a href="https://linkedin.com/in/namit-shrivastava-baab47204">LinkedIn</a> |
    <a href="https://github.com/namo507">GitHub</a> |
    <a href="https://scholar.google.com/citations?user=7bvTB-sAAAAJ">Google Scholar</a> |
    <a href="https://orcid.org/0009-0005-7920-8350">ORCID</a>
  </p>
</div>

## Research Summary
High performance AI and Data Engineer with 2+ years of experience shipping production-grade ML systems and scalable ETL pipelines on Azure and AWS. Currently serving as a **Graduate Research Assistant** at the **Social Data Science Center, University of Maryland**, managing data lifecycle and taxonomy for a university-wide open data repository. Specialized in deploying RAG architectures, geospatial analytics, and high-throughput microservices. Research interests span trustworthy data integration, survey methodology, and privacy-preserving computational methods.

---

## Education

#### University of Maryland, College Park

**M.S. in Survey & Data Science** (Data Science Track) | Aug 2024 – May 2026

<span class="gpa-badge">GPA: 3.8142/4.0</span> <span class="award-badge">Dean's Fellowship AY 2025-26</span>

**Coursework:** Statistical Modeling & Machine Learning, Fundamentals of Data Collection, Experimental Design & Causal Inference, Long-Context Language Models, Machine Learning for Social Science, Applied Sampling

#### BITS Pilani, India

**B.E. (Hons) in Civil Engineering** (Minor: Data Science) | Nov 2020 – Jul 2024

<span class="gpa-badge">GPA: 3.327/4.0</span>

**Coursework:** Foundations of Data Science, Machine Learning, Artificial Intelligence, Applied Statistical Methods, Data Mining, Data Visualization, Probability & Statistics, Object Oriented Programming

---

## Professional Experience

#### Graduate Research Assistant

Social Data Science Center, University of Maryland | Jan 2026 – May 2026 | College Park, MD

*   Engineered Python automation suite interacting with CKAN REST API to manage lifecycle of **18 datasets**, ensuring **100% resource accessibility** and data integrity
*   Architected scalable data taxonomy for university repository transforming flat catalogs into hierarchical thematic groups, improving **search discoverability by 35%**
*   Implemented bulk metadata update scripts reducing manual maintenance overhead by **90%** and ensuring strict schema compliance across the repository

#### Teaching & Graduate Assistant

Joint Program in Survey Methodology (JPSM), University of Maryland | Feb 2025 – May 2026 | College Park, MD

*   Assisted Dr. Jörg Drechsler (IAB) in teaching SURV735, guiding **23 students** in data privacy and confidentiality principles
*   Redesigned Canvas LMS infrastructure for **10+ JPSM instructors** supporting **125+ graduate students**, increasing course satisfaction by **30%** and reducing setup time by **40%**

#### Research Assistant

Institute for Social Research, University of Michigan | May 2025 – Dec 2025 | Ann Arbor, MI

*   Architected production-scale geospatial data integration pipeline processing **129,572 U.S. census tracts** across 3 RUCA strata, achieving **100% broadband data completeness** through multi-source fusion (FCC, ACS, CDC)
*   Developed stratified epidemiological modeling framework analyzing COVID-19 incidence patterns across **2,788 census tracts** with 100% social determinant coverage, uncovering statistically significant non-linear rural inflections (**p < 0.01**)
*   Designed multi-stage data quality assurance protocol integrating Moran's I spatial autocorrelation analysis, identifying **15% spatial clustering violations** and achieving 85% of tracts with ≥95% temporal completeness

#### Machine Learning Engineer

Legistify Services Private Limited | Jan 2024 – Jun 2024 | Gurugram, India

*   Engineered scalable logo similarity detection system processing **2.4 million images** for IP infringement analysis using perceptual hashing, SIFT, and Faiss, achieving **92% precision** and reducing manual review time by **70%**
*   Deployed Azure Cognitive Services API processing **50,000+ legal filings** with **95% extraction accuracy** and bilingual OCR (English/Hindi)
*   Developed phonetic trademark similarity algorithm comparing **50,000 new trademarks** against **300,000 database entries** with **92% accuracy**

#### Advanced Application Engineering Analyst

Accenture | Jun 2023 – Aug 2023 | Bangalore, India

*   Monitored enterprise security infrastructure analyzing threat intelligence (MITRE ATT&CK, AlienVault OTX), achieving **89% accuracy** in threat classification
*   Conducted penetration testing on **50+ web applications**, identifying **120+ vulnerabilities** (15 critical, 45 high-severity)
*   Supported incident response during 3 security breaches, reducing MTTR by **80%** through automated runbooks

#### Web Developer

Indian Red Cross Society | May 2022 – Jul 2022 | Bangalore, India

*   Designed Drupal-based CMS for volunteer registry and donor database, reducing manual data entry by **50%**
*   Implemented multilingual support (Hindi/Kannada) achieving **95% bug-free** experience across **10,000+ monthly visitors**

---

## Technical Skills

**Programming:** <span class="skill-tag">Python</span> <span class="skill-tag">R</span> <span class="skill-tag">Java</span> <span class="skill-tag">C++</span> <span class="skill-tag">JavaScript</span> <span class="skill-tag">TypeScript</span> <span class="skill-tag">SQL</span> <span class="skill-tag">Bash</span>

**AI/ML:** <span class="skill-tag">PyTorch</span> <span class="skill-tag">TensorFlow</span> <span class="skill-tag">Hugging Face</span> <span class="skill-tag">LangChain</span> <span class="skill-tag">LlamaIndex</span> <span class="skill-tag">Scikit-Learn</span> <span class="skill-tag">NLTK</span> <span class="skill-tag">Spacy</span>

**Data & Databases:** <span class="skill-tag">PostgreSQL</span> <span class="skill-tag">MongoDB</span> <span class="skill-tag">Snowflake</span> <span class="skill-tag">Neo4j</span> <span class="skill-tag">Pinecone</span> <span class="skill-tag">Apache Spark</span> <span class="skill-tag">Kafka</span>

**Cloud & DevOps:** <span class="skill-tag">AWS</span> <span class="skill-tag">Azure</span> <span class="skill-tag">GCP</span> <span class="skill-tag">Docker</span> <span class="skill-tag">Kubernetes</span> <span class="skill-tag">Terraform</span> <span class="skill-tag">CI/CD</span>

**Core Competencies:** <span class="skill-tag">LLMs</span> <span class="skill-tag">Generative AI</span> <span class="skill-tag">Survey Methodology</span> <span class="skill-tag">Causal Inference</span> <span class="skill-tag">Deep Learning</span> <span class="skill-tag">NLP</span> <span class="skill-tag">Computer Vision</span> <span class="skill-tag">MLOps</span>

---

## Publications

{% for post in site.publications reversed %}
  {% include archive-single-cv.html %}
{% endfor %}

## Talks & Presentations

{% for post in site.talks reversed %}
  {% include archive-single-talk-cv.html %}
{% endfor %}

## Teaching

{% for post in site.teaching reversed %}
  {% include archive-single-cv.html %}
{% endfor %}

---

## Certifications & Achievements

**Certifications:**
- Microsoft Certified: Azure AI Fundamentals
- API-based Programming (Postman)
- AI For Everyone (Coursera)
- Deep Learning & Machine Learning (Smartknower, Internshala)

**Achievements:**
- <span class="award-badge">1st Rank</span> Human Resource Development (180 students, BITS Pilani)
- <span class="award-badge">Top 10</span> Water & Wastewater Treatment (98 students, BITS Pilani)
- <span class="award-badge">Dean's Fellowship</span> JPSM Award AY 2025-26

---

## Leadership & Service

#### Terrapin Leadership Institute, University of Maryland

Member | Aug 2024 – May 2025

*   Achieved 100% participation in workshops on leadership, ethics, inclusion, and resilience

#### National Service Scheme (NSS), BITS Pilani

Executive Committee & Blood Donation Camp Core Team | Mar 2022 – Dec 2023

*   Planned 10+ activities to improve English skills in villages around campus
*   Organized blood donation camp coordinating 60+ volunteers, managing 1,000+ donors, achieving **844 successful donations**

#### Peer Mentorship Program (PMP), BITS Pilani

Mentor | Aug 2021 – Dec 2023

*   Assisted juniors with advice and materials for smooth transition into college life
