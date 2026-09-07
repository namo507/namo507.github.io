"""site_doctor orchestrator.

Runs every health/cleaning/visual pass in order, aggregates one report, applies
auto-fixes (unless ``--check``), and writes ``reports/report.json`` and
``reports/report.md``. Each pass is isolated in a try/except so a single failing
pass can never abort the rest; the failure is recorded as a finding instead.
Every pass completes so reports survive a failure. Blocking findings produce a
nonzero exit; collecting a report must never conceal a failed health check.
"""

from __future__ import annotations

import argparse
import json
import os
import traceback
from pathlib import Path

import config
from report import DoctorReport, Finding, get_logger

import clean_repo
import validate_data
import contrast_audit
import alignment_audit
import asset_audit
import workflow_health

log = get_logger()

# Order matters: clean first (so later passes see normalized files), validate
# data, then visual audits, then asset links, then external workflow health.
PASSES = [
    ("clean", clean_repo.run),
    ("data", validate_data.run),
    ("contrast", contrast_audit.run),
    ("alignment", alignment_audit.run),
    ("asset", asset_audit.run),
    ("workflow", workflow_health.run),
]


def run_all(apply: bool, only: set[str] | None = None) -> DoctorReport:
    report = DoctorReport()
    for name, fn in PASSES:
        if only and name not in only:
            continue
        log.info("=== pass: %s ===", name)
        try:
            fn(report, apply=apply)
        except Exception as exc:  # noqa: BLE001 - resilience is the whole point
            log.error("pass %s crashed: %s", name, exc)
            report.add(Finding(name, "error", f"Pass `{name}` crashed", detail=str(exc)))
            report.add(Finding(name, "info", "traceback", detail=traceback.format_exc()))
    return report


def ingest_visual_report(report: DoctorReport, report_dir: Path | None = None) -> None:
    """Fold the Node visual/axe audit (visual_report.json) into the report so
    the issue body and commit decision see one unified set of findings."""
    path = (report_dir or config.REPORT_DIR) / "visual_report.json"
    if not path.is_file():
        report.add(Finding("visual", "error", "No visual_report.json found; visual health is unverified",
                           detail="Run `node visual_audit.mjs` after building the site."))
        return
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        report.add(Finding("visual", "error", "Could not read visual_report.json", detail=str(exc)))
        return
    report.passes_run.append("visual")
    if not isinstance(data, dict) or not isinstance(data.get("findings"), list):
        report.add(Finding("visual", "error", "Visual report has an invalid shape"))
        return
    if data.get("skipped"):
        report.add(Finding("visual", "error", f"Visual audit skipped: {data.get('reason', 'unknown')}"))
        return
    pages = (data.get("summary") or {}).get("pages", 0)
    if not isinstance(pages, int) or pages < 1:
        report.add(Finding("visual", "error", "Visual audit did not complete any page checks"))
    built_index = config.SITE_DIR / "index.html"
    if built_index.is_file() and path.stat().st_mtime < built_index.stat().st_mtime:
        report.add(Finding("visual", "error", "Visual report predates the built site; rerun the visual audit"))
    for f in data.get("findings", []):
        if not isinstance(f, dict) or f.get("severity") not in ("error", "warning", "info"):
            report.add(Finding("visual", "error", "Visual report contains an invalid finding"))
            continue
        report.add(Finding(
            pass_name="visual",
            severity=f.get("severity", "info"),
            message=f.get("message", ""),
            location=f.get("page", ""),
            detail=f.get("detail", ""),
        ))


def _emit_github_outputs(report: DoctorReport) -> None:
    out = os.environ.get("GITHUB_OUTPUT")
    if not out:
        return
    with open(out, "a", encoding="utf-8") as fh:
        fh.write(f"has_fixes={'true' if report.changed else 'false'}\n")
        fh.write(f"error_count={report.error_count}\n")
        fh.write(f"warning_count={report.warning_count}\n")
        fh.write(f"needs_issue={'true' if (report.error_count or report.warning_count) else 'false'}\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the site_doctor health and cleaning passes.")
    parser.add_argument("--check", action="store_true", help="report only; do not modify any files")
    parser.add_argument("--strict", action="store_true", help="exit non-zero if blocking errors remain (default)")
    parser.add_argument("--report-only-exit-zero", action="store_true", help="write findings without using them as an exit gate")
    parser.add_argument("--only", nargs="+", choices=[name for name, _ in PASSES], help="restrict to named passes", default=None)
    parser.add_argument("--report-dir", default=str(config.REPORT_DIR))
    parser.add_argument("--no-visual", action="store_true", help="do not ingest visual_report.json")
    parser.add_argument("--external-links", action="store_true", help="follow and check external HTTP links")
    args = parser.parse_args()
    if args.external_links:
        os.environ["SITE_DOCTOR_EXTERNAL_LINKS"] = "1"

    report_dir = Path(args.report_dir)
    report = run_all(apply=not args.check, only=set(args.only) if args.only else None)
    if not args.no_visual and not args.only:
        ingest_visual_report(report, report_dir)

    report.write_json(report_dir / "report.json")
    (report_dir / "report.md").write_text(report.to_markdown(), encoding="utf-8")

    print(report.to_markdown())
    log.info("Summary: %d errors, %d warnings, %d fixes",
             report.error_count, report.warning_count, len(report.fixes))
    _emit_github_outputs(report)

    if report.has_blocking and (args.strict or not args.report_only_exit_zero):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
