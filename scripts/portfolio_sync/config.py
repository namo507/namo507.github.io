from __future__ import annotations

import os
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "_data"
ASSET_DIR = ROOT / "assets" / "cosmic"
CV_SITE_PATH = DATA_DIR / "cv_site.yml"
CV_YAML_PATH = DATA_DIR / "cv.yml"
CV_JSON_PATH = DATA_DIR / "cv.json"
STATE_PATH = ROOT / "scripts" / "portfolio_sync" / "state_manifest.json"
RUN_SUMMARY_PATH = ROOT / "scripts" / "portfolio_sync" / "last_run_summary.json"
WORKFLOW_SUMMARY_PATH = ROOT / "scripts" / "portfolio_sync" / "last_workflow_summary.md"
PORTFOLIO_SYNC_ASSET_PATH = ASSET_DIR / "portfolio-sync.generated.js"
COSMIC_DATA_PATH = ASSET_DIR / "data.js"

SCHEMA_VERSION = 1
MCP_PROTOCOL_VERSION = os.getenv("PORTFOLIO_SYNC_MCP_PROTOCOL_VERSION", "2024-11-05")
DEFAULT_LOOKBACK_DAYS = int(os.getenv("PORTFOLIO_SYNC_LOOKBACK_DAYS", "21"))
DEFAULT_MAX_PUBLIC_BULLETS = int(os.getenv("PORTFOLIO_SYNC_MAX_PUBLIC_BULLETS", "6"))
DEFAULT_MAX_TASKS_PER_WEEK = int(os.getenv("PORTFOLIO_SYNC_MAX_TASKS_PER_WEEK", "8"))
DEFAULT_GITHUB_PER_PAGE = int(os.getenv("PORTFOLIO_SYNC_GITHUB_PER_PAGE", "50"))
BRANCH_PREFIX = os.getenv("PORTFOLIO_SYNC_BRANCH_PREFIX", "automation/portfolio-update")

# The role the weekly agenda actually describes. The organization/role strings
# must match _data/cv_site.yml, _data/cv.yml, _data/cv.json and
# assets/cosmic/data.js verbatim — the frontend overlay merges on (org, role),
# so a typo here silently drops every generated bullet instead of failing.
TARGET_ROLE_MATCH = {
    "cv_site": {
        "organization": "Institute for Mind and Brain, University of South Carolina",
        "role": "Data Scientist II",
    },
    "cv_json": {
        "company": "Institute for Mind and Brain, University of South Carolina",
        "position": "Data Scientist II",
    },
    "cosmic": {
        "org": "Institute for Mind and Brain, U. South Carolina",
        "role": "Data Scientist II",
    },
}

SOURCE_REPOSITORIES = [
    {
        "alias": "study_monorepo",
        "full_name": "namo507/ESD-Lab-USC",
        "public_label": "study monorepo",
    },
    {
        "alias": "automation_workspace",
        "full_name": "namo507/esd-redcap-metadata-watcher",
        "public_label": "automation workspace",
    },
]

HARD_DENYLIST = [
    "namo507/ESD-Lab-USC",
    "github.com/namo507/ESD-Lab-USC",
    "https://github.com/namo507/ESD-Lab-USC",
    "namo507/esd-redcap-metadata-watcher",
    "github.com/namo507/esd-redcap-metadata-watcher",
    "https://github.com/namo507/esd-redcap-metadata-watcher",
    "ESD-Lab-USC",
    "esd-redcap-metadata-watcher",
]

INTERNAL_URL_DENYLIST = [
    "sharepoint.com",
    "notion.site",
    "notion.so",
    "redcap.",
    "slack.com/archives",
    "slack.com/canvas",
]

TECH_KEYWORDS = {
    "Python": ["python", "pandas", "polars", "fastapi"],
    "R": [" r ", "tidyverse", "shiny", "rscript"],
    "REDCap": ["redcap"],
    "GitHub Actions": ["github actions", "workflow", "actions/checkout", "cron"],
    "Docker": ["docker", "container"],
    "Kubernetes": ["k8s", "kubernetes", "helm"],
    "SQL": ["sql", "postgres", "mysql", "sqlite", "query"],
    "Jupyter": ["notebook", "jupyter", ".ipynb"],
    "Dash": ["dash", "plotly"],
    "Streamlit": ["streamlit"],
    "React": ["react", "frontend", "component"],
    "JavaScript": ["javascript", "node", "typescript", "tsx", "jsx"],
    "Bash": ["shell", "bash", "sh script"],
    "CI/CD": ["ci/cd", "pipeline", "deployment"],
    "Airflow": ["airflow", "dag"],
    "dbt": ["dbt"],
    "Azure": ["azure"],
    "AWS": ["aws", "s3", "lambda"],
    "Machine Learning": ["model", "ml", "classifier", "training", "inference"],
}

DELIVERABLE_KEYWORDS = {
    "dashboard": ["dashboard", "ui", "frontend", "visualization", "monitor"],
    "script": ["script", "automation", "job", "cli", "tooling"],
    "analysis": ["analysis", "notebook", "statistical", "modeling", "exploration"],
    "data-pull": ["extract", "ingest", "pull", "sync", "fetch", "etl"],
    "cost-comparison": ["cost", "budget", "pricing", "comparison"],
    "discrepancy-report": ["discrepancy", "reconciliation", "qa", "audit", "report"],
    "workflow": ["workflow", "pipeline", "orchestration", "scheduler"],
    "deployment": ["deploy", "release", "k8s", "helm", "infra"],
}

SUBSYSTEM_RULES = [
    {
        "name": "REDCap automation",
        "path_prefixes": ["redcap/", "projects/redcap", "shared/redcap"],
        "keywords": ["redcap", "metadata", "instrument", "governance", "field mapping"],
        "impact": "strengthen metadata governance and submission reliability",
    },
    {
        "name": "ECG/behavioral pipeline",
        "path_prefixes": ["src/ecg", "src/behavior", "signals/", "behavior/"],
        "keywords": ["ecg", "behavioral", "signal", "wearable", "sensor"],
        "impact": "stabilize multimodal measurement pipelines for research operations",
    },
    {
        "name": "dashboard frontend",
        "path_prefixes": ["dashboard/", "web/", "frontend/", "ui/"],
        "keywords": ["dashboard", "frontend", "react", "plotly", "visualization", "monitoring"],
        "impact": "turn operational checks into reviewable decision surfaces",
    },
    {
        "name": "Kubernetes/DevOps",
        "path_prefixes": ["k8s/", "docker/", ".github/workflows/", "deploy/"],
        "keywords": ["k8s", "kubernetes", "docker", "deployment", "workflow", "cron"],
        "impact": "keep research infrastructure reproducible and release-ready",
    },
    {
        "name": "ML modeling",
        "path_prefixes": ["src/model", "models/", "notebooks/", "reports/"],
        "keywords": ["model", "training", "inference", "classifier", "forecast", "ml"],
        "impact": "translate analytic experiments into production-grade modeling workflows",
    },
    {
        "name": "cluster/statistical analysis",
        "path_prefixes": ["projects/caregiver-cluster-analysis", "projects/csbs-scoring-assignments", "notebooks/", "reports/"],
        "keywords": ["cluster", "scoring", "statistical", "analysis", "forecast", "regression"],
        "impact": "operationalize high-variance research analysis into repeatable evidence pipelines",
    },
]

MATCH_STOPWORDS = {
    "the",
    "and",
    "for",
    "with",
    "from",
    "that",
    "this",
    "into",
    "over",
    "through",
    "using",
    "built",
    "build",
    "work",
    "weekly",
    "agenda",
    "update",
    "data",
    "task",
    "tasks",
}

SUPPORTED_CONTEXT_FILES = (
    "README.md",
    "CHANGELOG.md",
    "BUGS_AND_FIXES.md",
    "TECH_DEBT.md",
)

JSON_MACHINE_HEADER = "/* MACHINE-MANAGED FILE. DO NOT EDIT. */\n"
