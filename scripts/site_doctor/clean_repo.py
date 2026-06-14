"""Cleaning pass: remove OS/editor junk and normalize text files.

This is the "cleaning" half of the daily automation. It is deliberately
conservative: it only deletes well-known junk artifacts, only normalizes files
with a known text extension, and never touches vendored, generated, or minified
assets (see ``CLEAN_EXCLUDE_SUBSTRINGS``). All actions are recorded as fixes so
the workflow can commit them with a clear message.
"""

from __future__ import annotations

from pathlib import Path

import config
from report import DoctorReport, Finding, get_logger

log = get_logger()


def _excluded(path: Path) -> bool:
    rel = path.relative_to(config.REPO_ROOT).as_posix()
    return any(sub in rel for sub in config.CLEAN_EXCLUDE_SUBSTRINGS)


def _iter_files() -> list[Path]:
    files: list[Path] = []
    for path in config.REPO_ROOT.rglob("*"):
        if path.is_file() and not _excluded(path):
            files.append(path)
    return files


def remove_junk(report: DoctorReport, apply: bool) -> None:
    """Delete .DS_Store / Thumbs.db and stray sass-cache dirs from the tree."""
    for path in config.REPO_ROOT.rglob("*"):
        rel = path.relative_to(config.REPO_ROOT).as_posix()
        if ".git/" in rel:
            continue
        if path.is_file() and path.name in config.JUNK_FILE_NAMES:
            if apply:
                try:
                    path.unlink(missing_ok=True)
                    report.record_fix(f"Removed junk file `{rel}`")
                except OSError as exc:
                    # Never let one undeletable file abort the cleaning pass.
                    report.add(Finding("clean", "warning", f"Could not delete junk file `{rel}`",
                                       rel, detail=str(exc)))
            else:
                report.add(Finding("clean", "warning", f"Junk file present `{rel}`", rel, auto_fixable=True))


def normalize_text(report: DoctorReport, apply: bool) -> None:
    """Strip trailing whitespace and guarantee a single final newline, scoped to
    user-authored code (see ``CLEAN_NORMALIZE_INCLUDE``)."""
    for path in _iter_files():
        if path.suffix.lower() not in config.TEXT_EXTENSIONS:
            continue
        rel = path.relative_to(config.REPO_ROOT).as_posix()
        if not rel.startswith(config.CLEAN_NORMALIZE_INCLUDE):
            continue
        try:
            raw = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue  # binary or unreadable; leave it alone
        lines = raw.split("\n")
        stripped = [ln.rstrip(" \t") for ln in lines]
        new = "\n".join(stripped)
        if new and not new.endswith("\n"):
            new += "\n"
        # Collapse a trailing run of blank lines to exactly one newline.
        while new.endswith("\n\n"):
            new = new[:-1]
        if new != raw:
            if apply:
                path.write_text(new, encoding="utf-8")
                report.record_fix(f"Normalized whitespace in `{rel}`")
            else:
                report.add(Finding("clean", "info", f"Whitespace needs normalizing `{rel}`", rel, auto_fixable=True))


def check_gitignore(report: DoctorReport) -> None:
    """Confirm the junk patterns are actually ignored so they do not return."""
    gitignore = config.REPO_ROOT / ".gitignore"
    if not gitignore.is_file():
        report.add(Finding("clean", "warning", "No .gitignore found", ".gitignore"))
        return
    text = gitignore.read_text(encoding="utf-8")
    for needed in (".DS_Store", "_site/", ".sass-cache/", "node_modules"):
        if needed not in text:
            report.add(Finding(
                "clean", "warning",
                f"`.gitignore` is missing `{needed}`",
                ".gitignore",
                detail="Junk can re-enter the repo without this rule.",
            ))


def run(report: DoctorReport, apply: bool = True) -> None:
    log.info("clean_repo: scanning (apply=%s)", apply)
    report.passes_run.append("clean")
    remove_junk(report, apply)
    normalize_text(report, apply)
    check_gitignore(report)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Cleaning pass")
    parser.add_argument("--check", action="store_true", help="report only, do not modify files")
    args = parser.parse_args()
    rpt = DoctorReport()
    run(rpt, apply=not args.check)
    print(rpt.to_markdown())
