#!/usr/bin/env python3

from __future__ import annotations

import datetime as dt
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "scripts" / "github_showcase_source.json"
OUTPUT_PATH = ROOT / "_data" / "github.yml"


class GitHubSyncError(RuntimeError):
    pass


def read_source() -> dict:
    with SOURCE_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def github_request(url: str, token: str | None) -> list[dict]:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "namo507-github-showcase-sync",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    request = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(request) as response:
            payload = response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise GitHubSyncError(f"GitHub API request failed for {url}: {error.code} {detail}") from error
    except urllib.error.URLError as error:
        raise GitHubSyncError(f"GitHub API request failed for {url}: {error}") from error

    data = json.loads(payload)
    if not isinstance(data, list):
        raise GitHubSyncError(f"Expected a list response from {url}, received: {data}")
    return data


def format_month_year(timestamp: str) -> str:
    parsed = dt.datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    return parsed.strftime("%b %Y")


def normalize_language(repo: dict, override: dict | None) -> str:
    if override and override.get("language"):
        return override["language"]
    return repo.get("language") or "Multi-language"


def default_metrics(repo: dict) -> list[dict]:
    return [
        {"value": str(repo.get("stargazers_count", 0)), "label": "stars"},
        {"value": str(repo.get("forks_count", 0)), "label": "forks"},
        {"value": str(repo.get("size", 0)), "label": "repo KB"},
    ]


def merge_card(repo: dict, override: dict | None = None) -> dict:
    merged = {
        "name": repo["name"],
        "full_name": repo["full_name"],
        "badge": (override or {}).get("badge", "Repository"),
        "hero_metric": (override or {}).get("hero_metric", str(repo.get("stargazers_count", 0))),
        "hero_label": (override or {}).get("hero_label", "public stars"),
        "theme": (override or {}).get("theme", "research"),
        "language": normalize_language(repo, override),
        "url": repo["html_url"],
        "description": (override or {}).get("description") or repo.get("description") or "Public repository in the GitHub profile.",
        "metrics": (override or {}).get("metrics") or default_metrics(repo),
        "tags": (override or {}).get("tags", []),
        "related_links": (override or {}).get("related_links", []),
        "stars": repo.get("stargazers_count", 0),
        "forks": repo.get("forks_count", 0),
        "size": repo.get("size", 0),
        "updated": format_month_year(repo["updated_at"]),
    }
    return merged


def language_mix(repos: list[dict]) -> list[dict]:
    counts = Counter(repo.get("language") for repo in repos if repo.get("language"))
    ordered = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    return [{"language": language, "count": count} for language, count in ordered[:8]]


def build_repository_mappings(source: dict, repo_index: dict[str, dict]) -> list[dict]:
    mappings = []
    for item in source.get("repository_mappings", []):
        repo = repo_index.get(item["full_name"])
        mappings.append(
            {
                "full_name": item["full_name"],
                "repo_name": repo["name"] if repo else item["full_name"].split("/", 1)[1],
                "repo_url": repo["html_url"] if repo else f"https://github.com/{item['full_name']}",
                "projects": item.get("projects", []),
            }
        )
    return mappings


def build_recent_repositories(repos: list[dict], excluded: set[str], limit: int = 6) -> list[dict]:
    recent = []
    for repo in repos:
        if repo["full_name"] in excluded:
            continue
        recent.append(
            {
                "name": repo["name"],
                "language": repo.get("language") or "Repository",
                "updated": format_month_year(repo["updated_at"]),
                "url": repo["html_url"],
                "description": repo.get("description") or "Recently updated repository from the public GitHub profile.",
            }
        )
        if len(recent) >= limit:
            break
    return recent


def yaml_scalar(value: object) -> str:
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, (int, float)):
        return str(value)
    return json.dumps(str(value), ensure_ascii=False)


def dump_yaml(value: object, indent: int = 0) -> str:
    prefix = " " * indent
    if isinstance(value, dict):
        lines: list[str] = []
        for key, item in value.items():
            if isinstance(item, (dict, list)):
                if not item:
                    empty_marker = "{}" if isinstance(item, dict) else "[]"
                    lines.append(f"{prefix}{key}: {empty_marker}")
                else:
                    lines.append(f"{prefix}{key}:")
                    lines.append(dump_yaml(item, indent + 2))
            else:
                lines.append(f"{prefix}{key}: {yaml_scalar(item)}")
        return "\n".join(lines)

    if isinstance(value, list):
        lines = []
        for item in value:
            if isinstance(item, (dict, list)):
                if not item:
                    empty_marker = "{}" if isinstance(item, dict) else "[]"
                    lines.append(f"{prefix}- {empty_marker}")
                else:
                    lines.append(f"{prefix}-")
                    lines.append(dump_yaml(item, indent + 2))
            else:
                lines.append(f"{prefix}- {yaml_scalar(item)}")
        return "\n".join(lines)

    return f"{prefix}{yaml_scalar(value)}"


def main() -> int:
    source = read_source()
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    username = source["username"]

    repos_url = f"https://api.github.com/users/{urllib.parse.quote(username)}/repos?per_page=100&sort=updated"
    starred_url = f"https://api.github.com/users/{urllib.parse.quote(username)}/starred?per_page=100"

    repos = github_request(repos_url, token)
    starred = github_request(starred_url, token)

    repo_index = {repo["full_name"]: repo for repo in repos}
    non_fork_repos = [repo for repo in repos if not repo.get("fork")]
    featured_overrides = {item["full_name"]: item for item in source.get("featured_repositories", [])}
    spotlight_overrides = {item["full_name"]: item for item in source.get("spotlight_overrides", [])}

    featured_repositories = []
    for full_name, override in featured_overrides.items():
        repo = repo_index.get(full_name)
        if not repo:
            raise GitHubSyncError(f"Configured featured repository not found in public repos: {full_name}")
        featured_repositories.append(merge_card(repo, override))

    spotlight_priority = {full_name: index for index, full_name in enumerate(source.get("spotlight_priority", []))}
    sorted_starred = sorted(
        starred,
        key=lambda repo: (spotlight_priority.get(repo["full_name"], len(spotlight_priority) + 1000), repo["name"].lower()),
    )
    spotlight_repos = [merge_card(repo, spotlight_overrides.get(repo["full_name"])) for repo in sorted_starred]

    featured_names = {repo["full_name"] for repo in featured_repositories}

    data = {
        "generated_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "overview": {
            "profile_url": f"https://github.com/{username}",
            "repositories_url": f"https://github.com/{username}?tab=repositories",
            "starred_url": f"https://github.com/{username}?tab=stars",
            "stats": [
                {"value": len(repos), "label": "Public repositories"},
                {"value": len(non_fork_repos), "label": "Original builds"},
                {"value": len(starred), "label": "Starred spotlight repos"},
                {"value": sum(repo.get("stargazers_count", 0) for repo in repos), "label": "Public stars"},
            ],
            "language_mix": language_mix(non_fork_repos),
        },
        "featured_repositories": featured_repositories,
        "spotlight_repos": spotlight_repos,
        "repository_mappings": build_repository_mappings(source, repo_index),
        "recent_repositories": build_recent_repositories(non_fork_repos, featured_names),
    }

    yaml_output = "# Generated by scripts/sync_github_showcase.py\n# Do not edit manually; update scripts/github_showcase_source.json or rerun the sync script.\n\n"
    yaml_output += dump_yaml(data)
    yaml_output += "\n"
    OUTPUT_PATH.write_text(yaml_output, encoding="utf-8")
    print(f"Updated {OUTPUT_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except GitHubSyncError as error:
        print(error, file=sys.stderr)
        raise SystemExit(1) from error