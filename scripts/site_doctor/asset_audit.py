"""Asset and internal-link auditor.

Runs against the built ``_site`` directory (the exact bytes GitHub Pages would
serve). It parses every rendered HTML page, collects internal references
(``<a href>``, ``<img src>``, ``<link href>``, ``<script src>``), and verifies
each one resolves to a real file in ``_site``. Broken internal links and missing
images are the most common silent regressions on a portfolio, so they are
reported as errors. External URLs are out of scope here (the workflow runs
html-proofer for those).
"""

from __future__ import annotations

from pathlib import Path
from urllib.parse import unquote, urldefrag

from bs4 import BeautifulSoup

import config
from report import DoctorReport, Finding, get_logger

log = get_logger()


def _is_external(url: str) -> bool:
    return url.startswith(config.IGNORE_LINK_PREFIXES) or url.startswith("//")


def _resolve(url: str, page: Path, site_root: Path) -> Path:
    """Map an internal URL to the file it should resolve to in _site."""
    url = urldefrag(url)[0]          # drop #fragment
    url = url.split("?", 1)[0]       # drop ?query
    url = unquote(url)
    if not url:
        return page
    if url.startswith("/"):
        target = site_root / url.lstrip("/")
    else:
        target = (page.parent / url)
    target = target.resolve()
    # A directory URL (or extensionless pretty URL) resolves to index.html.
    if target.is_dir():
        return target / "index.html"
    if not target.suffix:
        html = target.with_suffix(".html")
        if html.exists():
            return html
        return target / "index.html"
    return target


def run(report: DoctorReport, apply: bool = True) -> None:  # apply unused; read-only audit
    report.passes_run.append("asset")
    site_root = config.SITE_DIR
    if not site_root.is_dir():
        report.add(Finding("asset", "info", "_site not built; skipping link audit", "_site",
                           detail="Run `bundle exec jekyll build` first (the workflow does this)."))
        return

    site_root = site_root.resolve()
    pages = sorted(site_root.rglob("*.html"))
    broken_links = 0
    missing_assets = 0
    checked = 0

    for page in pages:
        try:
            soup = BeautifulSoup(page.read_text(encoding="utf-8", errors="ignore"), "html.parser")
        except Exception as exc:  # noqa: BLE001 - never let one page abort the pass
            report.add(Finding("asset", "warning", "Could not parse page", str(page.relative_to(site_root)),
                               detail=str(exc)))
            continue

        refs: list[tuple[str, str]] = []
        for tag, attr in (("a", "href"), ("img", "src"), ("link", "href"),
                          ("script", "src"), ("source", "src")):
            for el in soup.find_all(tag):
                val = el.get(attr)
                if val:
                    refs.append((attr, val))

        for attr, url in refs:
            if _is_external(url) or not url.strip():
                continue
            checked += 1
            target = _resolve(url, page, site_root)
            if not target.exists():
                rel_page = page.relative_to(site_root).as_posix()
                if attr == "src":
                    missing_assets += 1
                    report.add(Finding("asset", "error", f"Missing asset `{url}`", rel_page,
                                       detail=f"Expected file `{_safe_rel(target, site_root)}` does not exist."))
                else:
                    broken_links += 1
                    report.add(Finding("asset", "error", f"Broken internal link `{url}`", rel_page,
                                       detail=f"Expected `{_safe_rel(target, site_root)}`."))

    log.info("asset: %d pages, %d refs checked, %d broken links, %d missing assets",
             len(pages), checked, broken_links, missing_assets)
    if broken_links == 0 and missing_assets == 0 and checked:
        report.add(Finding("asset", "info", f"All {checked} internal references resolve", "_site"))


def _safe_rel(target: Path, root: Path) -> str:
    try:
        return target.relative_to(root).as_posix()
    except ValueError:
        return target.as_posix()


if __name__ == "__main__":
    rpt = DoctorReport()
    run(rpt)
    print(rpt.to_markdown())
