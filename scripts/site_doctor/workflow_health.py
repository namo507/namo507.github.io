"""Workflow self-heal monitor.

Checks the most recent run of every other automation workflow via the GitHub
REST API. If a monitored workflow's last run failed, that is surfaced in the
report, and (when re-dispatch is enabled and a token is present) the workflow is
automatically re-triggered, which recovers transient failures without human
intervention. Without a token (for example a local run) the pass degrades to an
informational note instead of erroring.
"""

from __future__ import annotations

import os

import requests

import config
from report import DoctorReport, Finding, get_logger

log = get_logger()

API = "https://api.github.com"


def _headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def _latest_run(slug: str, workflow_file: str, token: str) -> dict | None:
    url = f"{API}/repos/{slug}/actions/workflows/{workflow_file}/runs"
    try:
        resp = requests.get(url, headers=_headers(token), params={"per_page": 1}, timeout=20)
    except requests.RequestException as exc:
        log.warning("workflow_health: request failed for %s: %s", workflow_file, exc)
        return None
    if resp.status_code != 200:
        log.warning("workflow_health: %s -> HTTP %s", workflow_file, resp.status_code)
        return None
    runs = resp.json().get("workflow_runs", [])
    return runs[0] if runs else None


def _redispatch(slug: str, workflow_file: str, token: str, branch: str) -> bool:
    url = f"{API}/repos/{slug}/actions/workflows/{workflow_file}/dispatches"
    try:
        resp = requests.post(url, headers=_headers(token), json={"ref": branch}, timeout=20)
    except requests.RequestException as exc:
        log.warning("workflow_health: re-dispatch failed for %s: %s", workflow_file, exc)
        return False
    return resp.status_code in (201, 204)


def run(report: DoctorReport, apply: bool = True) -> None:
    report.passes_run.append("workflow")
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if not token:
        report.add(Finding("workflow", "info", "No GITHUB_TOKEN; skipping workflow health check",
                           detail="Runs automatically inside GitHub Actions where a token is present."))
        return

    slug = config.REPO_SLUG
    branch = os.environ.get("GITHUB_REF_NAME", "master")
    redispatch_enabled = apply and os.environ.get("SITE_DOCTOR_REDISPATCH", "1") == "1"

    for wf in config.MONITORED_WORKFLOWS:
        run_info = _latest_run(slug, wf, token)
        if run_info is None:
            report.add(Finding("workflow", "info", f"No run history for `{wf}`", wf))
            continue
        status = run_info.get("status")
        conclusion = run_info.get("conclusion")
        html_url = run_info.get("html_url", "")
        if status != "completed":
            report.add(Finding("workflow", "info", f"`{wf}` currently {status}", wf, detail=html_url))
            continue
        if conclusion == "success":
            report.add(Finding("workflow", "info", f"`{wf}` last run succeeded", wf))
        else:
            healed = ""
            if redispatch_enabled and run_info.get("event") in ("schedule", "workflow_dispatch", "push"):
                if _redispatch(slug, wf, token, branch):
                    healed = " — re-dispatched to self-heal"
                    report.record_fix(f"Self-heal: re-dispatched failing workflow `{wf}`")
            report.add(Finding("workflow", "warning",
                               f"`{wf}` last run concluded `{conclusion}`{healed}", wf, detail=html_url))


if __name__ == "__main__":
    rpt = DoctorReport()
    run(rpt)
    print(rpt.to_markdown())
