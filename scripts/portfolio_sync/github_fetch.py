from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Any

from .config import DEFAULT_GITHUB_PER_PAGE, SOURCE_REPOSITORIES, SUPPORTED_CONTEXT_FILES
from .models import EvidenceItem
from .taxonomy import classify_subsystems, extract_tools, infer_deliverable_type
from .utils import compact_whitespace, parse_datetime


class GitHubEvidenceError(RuntimeError):
    pass


def github_json_request(url: str, token: str) -> Any:
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "User-Agent": "namo507-portfolio-sync",
        },
    )
    try:
        with urllib.request.urlopen(request) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise GitHubEvidenceError(f"GitHub API request failed for {url}: {error.code} {detail}") from error
    except urllib.error.URLError as error:
        raise GitHubEvidenceError(f"GitHub API request failed for {url}: {error}") from error


class GitHubEvidenceFetcher:
    def __init__(self, token: str, *, repositories: list[dict[str, str]] | None = None) -> None:
        self.token = token
        self.repositories = repositories or SOURCE_REPOSITORIES

    def fetch(self, *, since: datetime, until: datetime | None = None) -> dict[str, Any]:
        bundles: dict[str, Any] = {}
        until = until or datetime.now(timezone.utc)
        for repo in self.repositories:
            bundles[repo["alias"]] = self._fetch_repository_bundle(repo, since=since, until=until)
        return bundles

    def _fetch_repository_bundle(self, repo: dict[str, str], *, since: datetime, until: datetime) -> dict[str, Any]:
        full_name = repo["full_name"]
        owner, repo_name = full_name.split("/", 1)
        repo_meta = github_json_request(f"https://api.github.com/repos/{owner}/{repo_name}", self.token)
        default_branch = repo_meta.get("default_branch", "master")
        structure = self._fetch_repository_structure(owner, repo_name, default_branch)
        commits = self._fetch_commits(repo, owner, repo_name, since, until)
        pulls = self._fetch_pull_requests(repo, owner, repo_name, since, until)
        workflows = self._fetch_workflow_runs(repo, owner, repo_name, since, until)
        evidence_items = [*commits, *pulls, *workflows]
        evidence_items.sort(key=lambda item: item.occurred_at, reverse=True)
        return {
            "alias": repo["alias"],
            "full_name": full_name,
            "public_label": repo["public_label"],
            "default_branch": default_branch,
            "structure": structure,
            "items": evidence_items,
        }

    def _fetch_repository_structure(self, owner: str, repo_name: str, default_branch: str) -> list[str]:
        encoded_branch = urllib.parse.quote(default_branch)
        url = f"https://api.github.com/repos/{owner}/{repo_name}/git/trees/{encoded_branch}?recursive=1"
        tree = github_json_request(url, self.token)
        if not isinstance(tree, dict) or not isinstance(tree.get("tree"), list):
            return []
        top_level: set[str] = set()
        for entry in tree["tree"]:
            path = entry.get("path") or ""
            if path:
                top_level.add(path.split("/", 1)[0])
        return sorted(top_level)

    def _fetch_commits(
        self,
        repo: dict[str, str],
        owner: str,
        repo_name: str,
        since: datetime,
        until: datetime,
    ) -> list[EvidenceItem]:
        query = urllib.parse.urlencode(
            {
                "since": since.isoformat().replace("+00:00", "Z"),
                "until": until.isoformat().replace("+00:00", "Z"),
                "per_page": DEFAULT_GITHUB_PER_PAGE,
            }
        )
        url = f"https://api.github.com/repos/{owner}/{repo_name}/commits?{query}"
        commits = github_json_request(url, self.token)
        if not isinstance(commits, list):
            raise GitHubEvidenceError(f"Unexpected commit response for {repo['full_name']}: {commits}")

        items: list[EvidenceItem] = []
        for entry in commits[:DEFAULT_GITHUB_PER_PAGE]:
            sha = entry.get("sha")
            if not sha:
                continue
            detail = github_json_request(
                f"https://api.github.com/repos/{owner}/{repo_name}/commits/{sha}",
                self.token,
            )
            commit = detail.get("commit") or {}
            message = compact_whitespace((commit.get("message") or "").replace("\n", " | "))
            occurred_at = parse_datetime(((commit.get("author") or {}).get("date") or entry.get("commit", {}).get("author", {}).get("date") or entry.get("commit", {}).get("committer", {}).get("date") or datetime.now(timezone.utc).isoformat()))
            files = detail.get("files") or []
            paths = [file.get("filename") for file in files if file.get("filename")]
            context_snippets: list[str] = []
            for file in files:
                filename = file.get("filename") or ""
                if filename.split("/")[-1] in SUPPORTED_CONTEXT_FILES:
                    patch = compact_whitespace(file.get("patch") or "")
                    if patch:
                        context_snippets.append(f"{filename}: {patch[:800]}")
            context_text = compact_whitespace(" ".join(context_snippets))
            evidence_text = compact_whitespace(" ".join(filter(None, [message, " ".join(paths), context_text])))
            items.append(
                EvidenceItem(
                    repo_alias=repo["alias"],
                    repo_full_name=repo["full_name"],
                    kind="commit",
                    identifier=sha,
                    title=message.split("|", 1)[0].strip() or sha[:12],
                    text=evidence_text,
                    occurred_at=occurred_at,
                    deliverable_type=infer_deliverable_type(evidence_text),
                    subsystems=classify_subsystems(evidence_text, paths),
                    tool_hints=extract_tools(evidence_text),
                    paths=paths,
                    commit_sha=sha,
                    source_url=entry.get("html_url"),
                )
            )
        return items

    def _fetch_pull_requests(
        self,
        repo: dict[str, str],
        owner: str,
        repo_name: str,
        since: datetime,
        until: datetime,
    ) -> list[EvidenceItem]:
        url = (
            f"https://api.github.com/repos/{owner}/{repo_name}/pulls"
            f"?state=all&sort=updated&direction=desc&per_page={DEFAULT_GITHUB_PER_PAGE}"
        )
        pulls = github_json_request(url, self.token)
        if not isinstance(pulls, list):
            raise GitHubEvidenceError(f"Unexpected PR response for {repo['full_name']}: {pulls}")
        items: list[EvidenceItem] = []
        for pr in pulls:
            updated_at = pr.get("updated_at")
            if not updated_at:
                continue
            occurred_at = parse_datetime(updated_at)
            if occurred_at < since - timedelta(days=2) or occurred_at > until + timedelta(days=1):
                continue
            text = compact_whitespace(" ".join(filter(None, [pr.get("title"), pr.get("body") or ""])))
            items.append(
                EvidenceItem(
                    repo_alias=repo["alias"],
                    repo_full_name=repo["full_name"],
                    kind="pull_request",
                    identifier=str(pr.get("number")),
                    title=compact_whitespace(pr.get("title") or ""),
                    text=text,
                    occurred_at=occurred_at,
                    deliverable_type=infer_deliverable_type(text),
                    subsystems=classify_subsystems(text),
                    tool_hints=extract_tools(text),
                    pr_number=pr.get("number"),
                    source_url=pr.get("html_url"),
                )
            )
        return items

    def _fetch_workflow_runs(
        self,
        repo: dict[str, str],
        owner: str,
        repo_name: str,
        since: datetime,
        until: datetime,
    ) -> list[EvidenceItem]:
        url = f"https://api.github.com/repos/{owner}/{repo_name}/actions/runs?per_page={DEFAULT_GITHUB_PER_PAGE}"
        payload = github_json_request(url, self.token)
        runs = payload.get("workflow_runs") if isinstance(payload, dict) else None
        if not isinstance(runs, list):
            raise GitHubEvidenceError(f"Unexpected workflow response for {repo['full_name']}: {payload}")
        items: list[EvidenceItem] = []
        for run in runs:
            updated_at = run.get("updated_at") or run.get("created_at")
            if not updated_at:
                continue
            occurred_at = parse_datetime(updated_at)
            if occurred_at < since - timedelta(days=2) or occurred_at > until + timedelta(days=1):
                continue
            text = compact_whitespace(
                " ".join(
                    filter(
                        None,
                        [
                            run.get("name"),
                            run.get("display_title"),
                            run.get("path"),
                            run.get("event"),
                            run.get("conclusion"),
                        ],
                    )
                )
            )
            items.append(
                EvidenceItem(
                    repo_alias=repo["alias"],
                    repo_full_name=repo["full_name"],
                    kind="workflow_run",
                    identifier=str(run.get("id")),
                    title=compact_whitespace(run.get("name") or run.get("display_title") or "workflow run"),
                    text=text,
                    occurred_at=occurred_at,
                    deliverable_type=infer_deliverable_type(text),
                    subsystems=classify_subsystems(text, [run.get("path") or ""]),
                    tool_hints=extract_tools(text),
                    paths=[run.get("path")] if run.get("path") else [],
                    workflow_run_id=run.get("id"),
                    source_url=run.get("html_url"),
                )
            )
        return items
