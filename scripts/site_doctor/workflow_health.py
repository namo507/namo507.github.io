"""Report automation health and optionally retry one failed attempt of a run.

Recovery reuses the run id, so GitHub's run_attempt bounds retries durably. It
never creates a new run that resets that counter or reruns an obsolete commit.
"""

from __future__ import annotations

import os
from urllib.parse import quote

import requests

import config
from report import DoctorReport, Finding, get_logger

log = get_logger()
API = "https://api.github.com"


class WorkflowHealthError(RuntimeError):
    pass


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"}


def _get(url: str, token: str, **params) -> dict:
    try:
        response = requests.get(url, headers=_headers(token), params=params, timeout=20)
        if response.status_code != 200:
            raise WorkflowHealthError(f"GitHub health API returned HTTP {response.status_code}")
        payload = response.json()
        if not isinstance(payload, dict):
            raise WorkflowHealthError("GitHub health API returned an invalid object")
        return payload
    except (requests.RequestException, ValueError) as error:
        raise WorkflowHealthError(f"GitHub health API unavailable ({type(error).__name__})") from error


def _latest_run(slug: str, workflow_file: str, token: str, branch: str) -> dict | None:
    payload = _get(f"{API}/repos/{slug}/actions/workflows/{quote(workflow_file, safe='')}/runs",
                   token, per_page=10, branch=branch, exclude_pull_requests="true")
    runs = payload.get("workflow_runs")
    if not isinstance(runs, list):
        raise WorkflowHealthError("GitHub health API omitted workflow_runs")
    return next((run for run in runs if isinstance(run, dict) and run.get("head_branch") == branch
                 and run.get("event") not in ("pull_request", "pull_request_target")), None)


def _rerun_failed(slug: str, run_id: int, token: str) -> bool:
    try:
        response = requests.post(f"{API}/repos/{slug}/actions/runs/{run_id}/rerun-failed-jobs",
                                 headers=_headers(token), timeout=20)
        return response.status_code == 201
    except requests.RequestException:
        return False


def recovery_allowed(run_info: dict, *, apply: bool, branch: str) -> bool:
    return bool(
        apply and os.getenv("SITE_DOCTOR_REDISPATCH", "0") == "1"
        and os.getenv("GITHUB_EVENT_NAME") in ("schedule", "workflow_dispatch")
        and os.getenv("GITHUB_REF_NAME") == branch
        and run_info.get("head_branch") == branch
        and os.getenv("GITHUB_SHA") and run_info.get("head_sha") == os.environ["GITHUB_SHA"]
        and run_info.get("status") == "completed"
        and run_info.get("conclusion") in ("failure", "timed_out")
        and run_info.get("event") in ("schedule", "workflow_dispatch", "push", "workflow_run")
        and isinstance(run_info.get("run_attempt"), int) and run_info["run_attempt"] < 2
        and isinstance(run_info.get("id"), int)
    )


def run(report: DoctorReport, apply: bool = True) -> None:
    report.passes_run.append("workflow")
    token = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")
    if not token:
        report.add(Finding("workflow", "info", "Workflow health not checked: no GitHub token"))
        return
    slug = config.REPO_SLUG
    try:
        repository = _get(f"{API}/repos/{slug}", token)
        branch = repository.get("default_branch")
        if not branch:
            raise WorkflowHealthError("GitHub did not return the default branch")
    except WorkflowHealthError as error:
        report.add(Finding("workflow", "warning", "Workflow health could not be verified", detail=str(error)))
        return
    for workflow in config.MONITORED_WORKFLOWS:
        try:
            run_info = _latest_run(slug, workflow, token, branch)
        except WorkflowHealthError as error:
            report.add(Finding("workflow", "warning", f"Could not verify `{workflow}`", workflow, detail=str(error)))
            continue
        if run_info is None:
            report.add(Finding("workflow", "warning", f"No default-branch run history for `{workflow}`", workflow))
            continue
        status, conclusion = run_info.get("status"), run_info.get("conclusion")
        url = run_info.get("html_url", "")
        if status != "completed":
            report.add(Finding("workflow", "info", f"`{workflow}` currently {status}; completion not yet verified", workflow, detail=url))
        elif conclusion in ("success", "neutral", "skipped", "cancelled"):
            report.add(Finding("workflow", "info", f"`{workflow}` last run concluded `{conclusion}`", workflow, detail=url))
        else:
            recovery = ""
            if recovery_allowed(run_info, apply=apply, branch=branch):
                if _rerun_failed(slug, run_info["id"], token):
                    recovery = "; one retry requested, result pending"
                else:
                    recovery = "; retry request failed"
            elif run_info.get("run_attempt", 0) >= 2:
                recovery = "; retry limit reached, requires investigation"
            report.add(Finding("workflow", "warning", f"`{workflow}` concluded `{conclusion}`{recovery}", workflow, detail=url))
