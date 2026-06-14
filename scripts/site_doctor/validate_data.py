"""Data-integrity pass: parse every data file and content front-matter block.

A single malformed YAML file silently breaks a Jekyll build on GitHub Pages, so
this pass parses all ``_data/*.yml`` and ``*.json`` files plus the front matter
of every content page. Parse failures are reported as errors (they block the
build); they are not auto-fixed because the correct value requires human intent.
"""

from __future__ import annotations

import json
from pathlib import Path

import yaml

import config
from report import DoctorReport, Finding, get_logger

log = get_logger()

_FRONT_MATTER = "---"


def _validate_yaml(path: Path, report: DoctorReport) -> None:
    rel = path.relative_to(config.REPO_ROOT).as_posix()
    try:
        yaml.safe_load(path.read_text(encoding="utf-8"))
    except yaml.YAMLError as exc:
        mark = getattr(exc, "problem_mark", None)
        loc = f"{rel}:{mark.line + 1}" if mark else rel
        report.add(Finding("data", "error", "Invalid YAML", loc, detail=str(exc).splitlines()[0]))
    except OSError as exc:
        report.add(Finding("data", "error", "Unreadable file", rel, detail=str(exc)))


def _validate_json(path: Path, report: DoctorReport) -> None:
    rel = path.relative_to(config.REPO_ROOT).as_posix()
    try:
        json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        report.add(Finding("data", "error", "Invalid JSON", f"{rel}:{exc.lineno}", detail=exc.msg))
    except OSError as exc:
        report.add(Finding("data", "error", "Unreadable file", rel, detail=str(exc)))


def _validate_front_matter(path: Path, report: DoctorReport) -> None:
    rel = path.relative_to(config.REPO_ROOT).as_posix()
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return
    if not text.startswith(_FRONT_MATTER):
        return  # pages without front matter are valid (static html includes, etc.)
    end = text.find("\n" + _FRONT_MATTER, len(_FRONT_MATTER))
    if end == -1:
        report.add(Finding("data", "error", "Unterminated front matter", rel,
                           detail="Opening '---' has no closing '---'."))
        return
    block = text[len(_FRONT_MATTER):end]
    try:
        yaml.safe_load(block)
    except yaml.YAMLError as exc:
        mark = getattr(exc, "problem_mark", None)
        line = (mark.line + 2) if mark else 1  # +2 accounts for the opening fence
        report.add(Finding("data", "error", "Invalid front matter YAML", f"{rel}:{line}",
                           detail=str(exc).splitlines()[0]))


def run(report: DoctorReport, apply: bool = True) -> None:  # apply unused; validation only
    log.info("validate_data: parsing data files and front matter")
    report.passes_run.append("data")

    for path in sorted(config.DATA_DIR.rglob("*")):
        if not path.is_file():
            continue
        if path.suffix.lower() in (".yml", ".yaml"):
            _validate_yaml(path, report)
        elif path.suffix.lower() == ".json":
            _validate_json(path, report)

    seen: set[Path] = set()
    for pattern in config.CONTENT_GLOBS:
        for path in config.REPO_ROOT.glob(pattern):
            if path.is_file() and path not in seen:
                seen.add(path)
                _validate_front_matter(path, report)

    errors = report.error_count
    log.info("validate_data: %d content files checked, %d parse errors", len(seen), errors)


if __name__ == "__main__":
    rpt = DoctorReport()
    run(rpt)
    print(rpt.to_markdown())
