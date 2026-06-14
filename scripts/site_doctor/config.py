"""Central configuration for the site_doctor health/cleaning/visual toolkit.

Every tunable lives here so the individual audit passes stay declarative and the
GitHub Actions workflow never has to hard-code a path or threshold. Paths are all
resolved relative to the repository root, which is detected by walking up from this
file until a directory containing ``_config.yml`` is found.
"""

from __future__ import annotations

import os
from pathlib import Path


def find_repo_root(start: Path | None = None) -> Path:
    """Walk upward until we find the Jekyll site root (``_config.yml``)."""
    here = (start or Path(__file__)).resolve()
    for candidate in (here, *here.parents):
        if (candidate / "_config.yml").is_file():
            return candidate
    # Fallback: two levels up from scripts/site_doctor/config.py
    return Path(__file__).resolve().parents[2]


REPO_ROOT = find_repo_root()

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
DATA_DIR = REPO_ROOT / "_data"
SASS_DIR = REPO_ROOT / "_sass"
ASSETS_DIR = REPO_ROOT / "assets"
COSMIC_DIR = ASSETS_DIR / "cosmic"
SITE_DIR = REPO_ROOT / "_site"
REPORT_DIR = REPO_ROOT / "scripts" / "site_doctor" / "reports"

# CSS files that carry the visual theme. The cosmic stylesheet drives the
# animated homepage (the tiles); main.scss compiles the Jekyll theme.
THEME_CSS_FILES = [
    COSMIC_DIR / "styles.css",
]

# Front-matter collections whose YAML we validate.
CONTENT_GLOBS = [
    "_pages/**/*.md",
    "_pages/**/*.html",
    "_portfolio/**/*.md",
    "_posts/**/*.md",
    "_publications/**/*.md",
    "_talks/**/*.md",
    "_teaching/**/*.md",
]

# ---------------------------------------------------------------------------
# Cleaning policy
# ---------------------------------------------------------------------------
# Files that should never be tracked and are deleted on sight from the work tree.
JUNK_FILE_NAMES = {".DS_Store", "Thumbs.db", "desktop.ini"}
JUNK_DIR_NAMES = {".sass-cache"}

# Extensions we normalize (trailing whitespace + final newline). Binary and
# generated/minified assets are deliberately excluded.
TEXT_EXTENSIONS = {
    ".py", ".rb", ".js", ".mjs", ".jsx", ".ts", ".scss", ".css",
    ".html", ".md", ".yml", ".yaml", ".json", ".sh", ".txt",
}

# Whitespace normalization is scoped to user-authored code so the daily bot does
# not churn the vendored Academic Pages theme (_includes/_layouts/vendor) or the
# generated data files owned by the other sync bots. Junk removal stays
# repo-wide; only normalization is restricted to these path prefixes.
CLEAN_NORMALIZE_INCLUDE = (
    "assets/cosmic/",
    "scripts/site_doctor/",
    "_pages/",
)

# Never touch these paths during cleaning/normalization (vendored, generated,
# or intentionally minified). Matched as path substrings relative to root.
CLEAN_EXCLUDE_SUBSTRINGS = (
    "node_modules/", ".venv/", "vendor/", "_site/", ".git/",
    ".min.js", ".min.css", "main.min.js", "assets/css/academicons",
    ".sass-cache/", "scripts/site_doctor/reports/",
)

# ---------------------------------------------------------------------------
# Contrast policy (WCAG 2.1)
# ---------------------------------------------------------------------------
# Target ratio for normal body text. Large/secondary text uses LARGE_TEXT_RATIO.
AA_NORMAL_RATIO = 4.5
AA_LARGE_RATIO = 3.0

# Role -> minimum required contrast. Caption-only tokens are intentionally dim
# in the design ("captions only"), so they are held to the large-text bar and
# flagged rather than aggressively recolored, preserving the author's intent.
TOKEN_ROLE_MIN_RATIO = {
    "primary": AA_NORMAL_RATIO,
    "secondary": AA_NORMAL_RATIO,
    "tertiary": AA_NORMAL_RATIO,
    "caption": AA_LARGE_RATIO,
    "accent": AA_NORMAL_RATIO,
}

# Classification of the cosmic CSS custom properties so the auditor knows which
# token is body text vs caption vs surface. Surfaces are composited under text.
INK_TOKENS = {
    "--ink": "primary",
    "--ink-soft": "secondary",
    "--ink-mute": "tertiary",
    "--ink-faint": "caption",
    "--accent": "accent",
    "--accent-warm": "accent",
    "--accent-cool": "accent",
    "--accent-pop": "accent",
}
SURFACE_TOKENS = ("--bg", "--panel", "--panel-strong")

# The canonical background a text token is judged against. The panels are
# semi-transparent, so they are alpha-composited over --bg before scoring.
DEFAULT_SURFACE_TOKEN = "--panel"

# Auto-fix is allowed to recolor these roles to reach AA. Caption tokens are
# only flagged (never recolored) to respect the deliberate "dim caption" intent.
AUTOFIX_ROLES = {"primary", "secondary", "tertiary", "accent"}

# ---------------------------------------------------------------------------
# Tile alignment policy
# ---------------------------------------------------------------------------
# Selectors that render as rectangular content "tiles/cards" and should share a
# consistent corner radius. Pills (999px) and circles (50%) are excluded, as is
# hero scaffolding (.hero-connect*) whose larger radii are intentional.
TILE_SELECTORS = (
    ".card", ".project", ".skill", ".stat", ".metric",
    ".repo", ".contact-card", ".linkedin-card__item",
)
# Canonical radius scale (px). Outliers within CARD_RADIUS_RANGE are snapped to
# the nearest canonical value so every tile aligns to the same rhythm.
CANONICAL_RADIUS_SCALE = (12, 16, 18, 22)
CARD_RADIUS_MIN, CARD_RADIUS_MAX = 12, 32
# Radius values to leave alone (intentional pills / circles).
RADIUS_IGNORE = (50, 999)

# Grid gaps that should be consistent across multi-column tile grids.
GRID_GAP_SELECTORS = (".grid-2", ".grid-3", ".grid-4", ".project-grid")
CANONICAL_GRID_GAP = 18  # px

# ---------------------------------------------------------------------------
# Asset / link audit
# ---------------------------------------------------------------------------
# Internal URL prefixes that resolve to files in the built _site directory.
SITE_BASEURL = ""  # GitHub Pages user site is served from root.
IGNORE_LINK_PREFIXES = ("http://", "https://", "mailto:", "tel:", "#", "data:", "javascript:")

# ---------------------------------------------------------------------------
# Workflow self-heal
# ---------------------------------------------------------------------------
# Other automation workflows whose health we monitor. If their most recent run
# failed, the doctor reports it and (optionally) re-dispatches them.
MONITORED_WORKFLOWS = (
    "sync_github_showcase.yml",
    "sync_linkedin_profile.yml",
    "scrape_talks.yml",
)
REPO_SLUG = os.environ.get("GITHUB_REPOSITORY", "namo507/namo507.github.io")
