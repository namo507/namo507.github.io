"""Audit rendered references, including same-site URLs and fragment targets.

Optional external checking follows redirects. Permanent failures block; access
restrictions and transient upstream outages remain explicitly unverified.
"""

from __future__ import annotations

import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import unquote, urlsplit

import requests
import yaml
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

import config
from report import DoctorReport, Finding, get_logger

log = get_logger()


def _site_host() -> str:
    settings = yaml.safe_load((config.REPO_ROOT / "_config.yml").read_text(encoding="utf-8")) or {}
    return (urlsplit(settings.get("url", "https://namo507.github.io")).hostname or "").lower()


def _is_external(url: str) -> bool:
    parts = urlsplit(url)
    return bool(parts.netloc and (parts.hostname or "").lower() != _site_host())


def _resolve(url: str, page: Path, site_root: Path) -> Path:
    path = unquote(urlsplit(url).path)
    if not path:
        return page
    if config.SITE_BASEURL and path.startswith(config.SITE_BASEURL + "/"):
        path = path[len(config.SITE_BASEURL):]
    target = (site_root / path.lstrip("/") if path.startswith("/") else page.parent / path).resolve()
    if not target.is_relative_to(site_root):
        raise ValueError("Reference escapes the built site")
    if target.is_dir() or path.endswith("/"):
        return target / "index.html"
    if not target.suffix:
        # GitHub Pages does serve /a/b from /a/b.html when there is no
        # /a/b/index.html. Verified against production: /publication/
        # 2024-supply-chain-sustainability, /teaching/2025-canvas-lms,
        # /talks/2025-aapor-ev-sentiment and /resume-json all return 200 while
        # existing on disk only as sibling .html files. Treating those as
        # broken produced 128 false positives and failed the strict gate.
        # Prefer a real directory index; fall back to the sibling file.
        index = target / "index.html"
        if index.exists():
            return index
        sibling = target.with_suffix(".html")
        if sibling.exists():
            return sibling
        return index
    return target


def check_external(url: str) -> tuple[str, str, str]:
    try:
        with requests.Session() as session:
            retries = Retry(total=2, backoff_factor=0.5, status_forcelist=(500, 502, 503, 504),
                            allowed_methods=("GET",), raise_on_status=False,
                            respect_retry_after_header=False)
            session.mount("https://", HTTPAdapter(max_retries=retries))
            session.mount("http://", HTTPAdapter(max_retries=retries))
            session.max_redirects = 8
            with session.get(url, timeout=(5, 15), allow_redirects=True, stream=True,
                             headers={"User-Agent": "namo507-site-doctor/1.0 (+https://namo507.github.io)"}) as response:
                status = response.status_code
                detail = f"HTTP {status}; final URL: {response.url}"
                if 200 <= status < 300:
                    return "info", "External link resolved", detail
                if status in (401, 403, 408, 429, 999) or status >= 500:
                    return "warning", "External link could not be verified", detail
                return "error", "Broken external link", detail
    except requests.TooManyRedirects:
        return "error", "External redirect loop", "Exceeded eight redirects."
    except requests.RequestException as error:
        return "warning", "External link could not be verified", type(error).__name__


def run(report: DoctorReport, apply: bool = True) -> None:
    report.passes_run.append("asset")
    site_root = config.SITE_DIR.resolve()
    if not site_root.is_dir():
        report.add(Finding("asset", "error", "Built site is missing; links were not audited", "_site",
                           detail="Run the Jekyll build before this check."))
        return
    pages = sorted(site_root.rglob("*.html"))
    if not pages:
        report.add(Finding("asset", "error", "Built site contains no HTML pages", "_site"))
        return
    documents = {}
    for page in pages:
        try:
            documents[page] = BeautifulSoup(page.read_text(encoding="utf-8"), "html.parser")
        except (OSError, UnicodeError) as error:
            report.add(Finding("asset", "error", "Could not parse built page", str(page.relative_to(site_root)), detail=str(error)))
    anchors = {path: {str(el.get("id") or el.get("name")) for el in soup.find_all()
                      if el.get("id") or (el.name == "a" and el.get("name"))}
               for path, soup in documents.items()}
    external: dict[str, set[str]] = {}
    host = _site_host()
    checked = 0
    starting_errors = report.error_count
    for page, soup in documents.items():
        location = page.relative_to(site_root).as_posix()
        refs = []
        for tag, attr in (("a", "href"), ("img", "src"), ("link", "href"), ("script", "src"),
                          ("source", "src"), ("video", "src"), ("video", "poster"), ("audio", "src"), ("iframe", "src")):
            for el in soup.find_all(tag):
                if not el.get(attr):
                    continue
                # preconnect and dns-prefetch name an *origin* to warm a
                # connection to; the browser never requests that bare URL. Both
                # Google Fonts origins answer 404 at the root while the
                # stylesheet path beneath them is fine, so checking them as
                # links failed the nightly run on a pair of healthy hints.
                if tag == "link":
                    rels = {r.lower() for r in (el.get("rel") or [])}
                    if rels & {"preconnect", "dns-prefetch"}:
                        continue
                refs.append((tag, str(el[attr]).strip()))
        for element in soup.find_all(["img", "source"]):
            srcset = element.get("srcset", "")
            if srcset and not srcset.startswith("data:"):
                refs.extend((element.name, item.strip().split()[0]) for item in srcset.split(",") if item.strip())
        for tag, url in refs:
            if not url or url == "#":
                continue
            try:
                parts = urlsplit(url)
                if parts.scheme and parts.scheme.lower() not in ("http", "https"):
                    continue
                if parts.netloc and (parts.hostname or "").lower() != host:
                    canonical = parts._replace(scheme=parts.scheme or "https", fragment="").geturl()
                    external.setdefault(canonical, set()).add(location)
                    continue
                checked += 1
                target = _resolve(url, page, site_root)
            except ValueError as error:
                report.add(Finding("asset", "error", f"Invalid reference `{url}`", location, detail=str(error)))
                continue
            if not target.is_file():
                report.add(Finding("asset", "error", f"Broken internal reference `{url}`", location,
                                   detail=f"Expected `{_safe_rel(target, site_root)}`."))
            elif tag == "a" and parts.fragment and target in anchors:
                fragment = unquote(parts.fragment).split(":~:text=", 1)[0]
                if fragment and fragment not in anchors[target]:
                    report.add(Finding("asset", "error", f"Missing anchor `{url}`", location))
    if report.error_count == starting_errors:
        report.add(Finding("asset", "info", f"All {checked} internal references resolve across {len(pages)} pages", "_site"))
    if os.environ.get("SITE_DOCTOR_EXTERNAL_LINKS") == "1":
        urls = sorted(external)
        log.info("asset: checking %d unique external links", len(urls))
        with ThreadPoolExecutor(max_workers=4) as executor:
            for url, result in zip(urls, executor.map(check_external, urls)):
                severity, message, detail = result
                report.add(Finding("asset", severity, f"{message}: {url}", ", ".join(sorted(external[url])[:3]), detail=detail))
    elif external:
        report.add(Finding("asset", "info", f"{len(external)} external links not checked in this run",
                           detail="Use --external-links for redirect and availability checks."))


def _safe_rel(target: Path, root: Path) -> str:
    try:
        return target.relative_to(root).as_posix()
    except ValueError:
        return target.as_posix()
