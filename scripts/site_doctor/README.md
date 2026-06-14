# Site Doctor

A self-healing daily automation that keeps the `namo507.github.io` portfolio
clean, visually consistent, accessible, and link-healthy. It builds the site,
audits it on several axes, auto-commits the safe fixes straight to `master`,
files a single rolling issue for anything that needs a human, and re-triggers any
sibling automation workflow whose last run failed.

It runs every day at 07:30 UTC (and on relevant pushes, and on demand) via
[`.github/workflows/site-health.yml`](../../.github/workflows/site-health.yml).

## What it checks and fixes

| Pass | Looks at | Auto-fix (committed to `master`) | Flagged for review |
| --- | --- | --- | --- |
| `clean` | whole repo | deletes `.DS_Store`/`Thumbs.db`; strips trailing whitespace and fixes final newlines in `assets/cosmic`, `scripts/site_doctor`, `_pages` | missing `.gitignore` rules |
| `data` | `_data/*.yml`, `*.json`, page front matter | none (a wrong value needs intent) | YAML/JSON parse errors that would break the build |
| `contrast` | `assets/cosmic/styles.css` | recolors text/accent tokens that fail WCAG AA, preserving hue | caption-only tokens; risky hardcoded `color`/`background` pairs |
| `alignment` | `assets/cosmic/styles.css` | snaps off-scale tile corner radii onto the canonical scale | grid gaps that differ by column count |
| `asset` | built `_site` | none (target can be ambiguous) | broken internal links and missing images |
| `visual` | rendered pages (Playwright) | none | axe-core WCAG violations; tile rows whose tops/heights/gaps are misaligned |
| `workflow` | GitHub Actions API | re-dispatches a failed monitored workflow | a workflow whose latest run failed |

Auto-fixes are deliberately limited to changes that are deterministic and safe
to apply unattended. Anything that needs judgement is reported, never guessed.

## Daily flow

```
 cron 07:30 UTC / push / manual
            │
            ▼
   ┌──────────────────┐
   │  checkout (full) │
   └───────┬──────────┘
           ▼
  setup Python · Node · Ruby
           ▼
  bundle exec jekyll build ───────► _site/
           ▼
  node visual_audit.mjs ──► reports/visual_report.{json,md} + screenshots
           ▼
  python doctor.py
   ├─ clean      (apply)         deletes junk, normalizes whitespace
   ├─ data       (report)        validates YAML / JSON / front matter
   ├─ contrast   (apply)         WCAG AA recolor, hue preserved
   ├─ alignment  (apply)         snap tile radii to canonical scale
   ├─ asset      (report)        broken internal links / missing images
   ├─ workflow   (self-heal)     re-dispatch failed sibling workflows
   └─ ingest visual_report.json  one unified report
           ▼
  commit auto-fixes ─► rebase-and-retry push to master
           ▼
  upsert / close the rolling "site-health" issue
```

## Running it locally

From the repository root:

```bash
# one-time: install dependencies
pip install -r scripts/site_doctor/requirements.txt
( cd scripts/site_doctor && npm install && npx playwright install --with-deps chromium )

# report only, change nothing (recommended first run)
python scripts/site_doctor/doctor.py --check

# apply the safe auto-fixes to your working tree
python scripts/site_doctor/doctor.py

# build the site first if you want the link + visual audits to have data
bundle exec jekyll build
node scripts/site_doctor/visual_audit.mjs
python scripts/site_doctor/doctor.py
```

Individual passes are runnable on their own, which is handy when iterating:

```bash
python scripts/site_doctor/contrast_audit.py --check
python scripts/site_doctor/alignment_audit.py --check
python scripts/site_doctor/clean_repo.py --check
node    scripts/site_doctor/test_visual.mjs     # browser-free unit tests
```

Useful flags on `doctor.py`: `--check` (no writes), `--strict` (exit non-zero on
blocking errors, good as a pre-commit gate), `--only clean contrast` (restrict to
named passes), `--no-visual` (skip ingesting the Node report).

## How the contrast auto-fix works

`colors.py` implements the WCAG 2.1 relative-luminance and contrast-ratio
formulae exactly (verified against the standard reference pairs: black on white is
21:1, `#767676` on white is 4.54:1). Translucent panels are alpha-composited over
`--bg` before scoring, so a token is judged against the colour a reader actually
sees. The frosted `--panel` resolves to `#0d0f17` once flattened.

When a text token falls below its target, `adjust_to_contrast` performs a binary
search on lightness in HLS space while holding hue and saturation fixed, moving
toward white on dark surfaces (or black on light ones) until the ratio clears the
bar. Because it returns the original colour unchanged when it already passes, the
fix is idempotent: running the doctor twice produces no second change.

Caption-only tokens (`--ink-faint`, deliberately dim per the stylesheet's own
comment) are held to the 3:1 large-text bar and only flagged, never recolored, so
the automation respects the author's design intent instead of fighting it.

## Self-heal mechanisms

1. Push races. All four auto-committing workflows now share the
   `repo-autocommit` concurrency group, so only one runs at a time. Each push is
   wrapped in a rebase-and-retry loop, so even a race that slips through recovers
   without a failed run.
2. Failed sibling workflows. `workflow_health.py` reads the latest run of
   `sync_github_showcase`, `sync_linkedin_profile`, and `scrape_talks`. If one
   failed, it is re-dispatched automatically (guarded by `SITE_DOCTOR_REDISPATCH`,
   on by default in CI) and surfaced in the report.
3. Pass isolation. Every pass runs inside its own try/except in `doctor.py`, so a
   single failing pass is recorded as a finding rather than aborting the run. The
   job stays green and still commits whatever it fixed.

## Configuration

Everything tunable lives in `config.py`: the WCAG targets and per-role minimums,
the token role map, the tile selectors and canonical radius scale, the cleaning
include/exclude paths, and the list of monitored workflows. The audit logic reads
from there, so adjusting policy never means editing a pass.

## Trade-offs and what I would revisit

- Auto-commit straight to `master` (your choice) keeps the site current with zero
  friction but means visual fixes land unreviewed. The fixes are intentionally
  conservative for exactly this reason. If you ever want a safety net, switching
  the commit step to open a pull request is a few lines.
- The browser audit runs Playwright + axe on five pages. It is the slowest part
  (~1 to 2 minutes incl. browser install). If runtime ever matters, cache the
  Playwright browser or drop to static-only checks.
- Tile symmetry is measured at two viewport widths. Tighter tolerances would
  catch more but risk false positives on intentionally varied layouts.
- The contrast pass governs the cosmic stylesheet only. Extending it to the
  compiled Jekyll theme CSS would broaden coverage at the cost of more moving
  parts.

## Requirements

- Secrets: none beyond the automatic `GITHUB_TOKEN`. The workflow grants it
  `contents: write`, `issues: write`, and `actions: write`.
- Python 3.11, Node 20, Ruby 3.3 (provisioned by the workflow).
- Generated artifacts (`reports/`, `node_modules/`, screenshots) are git-ignored
  and uploaded as workflow artifacts instead of committed.
