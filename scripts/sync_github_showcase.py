#!/usr/bin/env python3

from __future__ import annotations

import datetime as dt
import json
import os
import re
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


def github_json_request(url: str, token: str | None, payload: dict | None = None) -> object:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "namo507-github-showcase-sync",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    request_data = None
    method = "GET"
    if payload is not None:
        headers["Content-Type"] = "application/json"
        request_data = json.dumps(payload).encode("utf-8")
        method = "POST"

    request = urllib.request.Request(url, headers=headers, data=request_data, method=method)
    try:
        with urllib.request.urlopen(request) as response:
            response_text = response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise GitHubSyncError(f"GitHub API request failed for {url}: {error.code} {detail}") from error
    except urllib.error.URLError as error:
        raise GitHubSyncError(f"GitHub API request failed for {url}: {error}") from error

    return json.loads(response_text)


def github_request(url: str, token: str | None) -> list[dict]:
    data = github_json_request(url, token)
    if not isinstance(data, list):
        raise GitHubSyncError(f"Expected a list response from {url}, received: {data}")
    return data


def github_graphql_request(query: str, variables: dict[str, object], token: str) -> dict:
    data = github_json_request(
        "https://api.github.com/graphql",
        token,
        payload={"query": query, "variables": variables},
    )
    if not isinstance(data, dict):
        raise GitHubSyncError(f"Expected a dict response from GitHub GraphQL, received: {data}")
    if data.get("errors"):
        raise GitHubSyncError(f"GitHub GraphQL request failed: {data['errors']}")
    graphql_data = data.get("data")
    if not isinstance(graphql_data, dict):
        raise GitHubSyncError(f"GitHub GraphQL response missing data payload: {data}")
    return graphql_data


def github_text_request(url: str) -> str:
    headers = {
        "User-Agent": "namo507-github-showcase-sync",
    }
    request = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(request) as response:
            return response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise GitHubSyncError(f"GitHub page request failed for {url}: {error.code} {detail}") from error
    except urllib.error.URLError as error:
        raise GitHubSyncError(f"GitHub page request failed for {url}: {error}") from error


def format_month_year(timestamp: str) -> str:
    parsed = dt.datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    return parsed.strftime("%b %Y")


def normalize_language(repo: dict, override: dict | None) -> str:
    if override and override.get("language"):
        return override["language"]
    return repo.get("language") or "Multi-language"


def derive_theme(repo: dict, tags: list[str]) -> str:
    text = " ".join(
        [
            repo.get("name", ""),
            repo.get("full_name", ""),
            repo.get("description") or "",
            repo.get("language") or "",
            *tags,
        ]
    ).lower()

    if any(keyword in text for keyword in ("jekyll", "github pages", "portfolio", "academic site", "github.io")):
        return "portfolio"
    if any(keyword in text for keyword in ("security", "redact", "privacy", "confidential", "office.js")):
        return "security"
    if any(keyword in text for keyword in ("automation", "workflow", "n8n", "supabase", "orchestration")):
        return "automation"
    if any(keyword in text for keyword in ("cv", "resume", "latex", "pdf", "document")):
        return "document"
    return "research"


def default_metrics(repo: dict) -> list[dict]:
    return [
        {"value": str(repo.get("stargazers_count", 0)), "label": "stars"},
        {"value": str(repo.get("forks_count", 0)), "label": "forks"},
        {"value": str(repo.get("size", 0)), "label": "repo KB"},
    ]


def merge_card(repo: dict, override: dict | None = None, *, badge: str | None = None, related_links: list[dict] | None = None) -> dict:
    if override and "tags" in override:
        card_tags = override["tags"]
    else:
        card_tags = (repo.get("topics") or [])[:4]

    if override and "related_links" in override:
        card_related_links = override["related_links"]
    else:
        card_related_links = related_links or []

    merged = {
        "name": repo["name"],
        "full_name": repo["full_name"],
        "badge": (override or {}).get("badge", badge or "Repository"),
        "hero_metric": (override or {}).get("hero_metric", str(repo.get("stargazers_count", 0))),
        "hero_label": (override or {}).get("hero_label", "public stars"),
        "theme": (override or {}).get("theme", derive_theme(repo, card_tags)),
        "language": normalize_language(repo, override),
        "url": repo["html_url"],
        "description": (override or {}).get("description") or repo.get("description") or "Public repository in the GitHub profile.",
        "metrics": (override or {}).get("metrics") or default_metrics(repo),
        "tags": card_tags,
        "related_links": card_related_links,
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


def fetch_repository_topics(full_name: str, token: str | None) -> list[str]:
    owner, repo_name = full_name.split("/", 1)
    url = f"https://api.github.com/repos/{urllib.parse.quote(owner)}/{urllib.parse.quote(repo_name)}/topics"
    data = github_json_request(url, token)
    if not isinstance(data, dict) or not isinstance(data.get("names"), list):
        raise GitHubSyncError(f"Expected a topics response for {full_name}, received: {data}")
    return [str(name) for name in data["names"]]


def attach_topics(repos: list[dict], token: str | None) -> list[dict]:
    enriched_repos = []
    for repo in repos:
        enriched_repo = dict(repo)
        try:
            enriched_repo["topics"] = fetch_repository_topics(repo["full_name"], token)
        except GitHubSyncError as error:
            print(f"Warning: {error}", file=sys.stderr)
            enriched_repo["topics"] = []
        enriched_repos.append(enriched_repo)
    return enriched_repos


def normalize_graphql_repository(repo: dict) -> dict:
    topics = []
    topic_nodes = (((repo.get("repositoryTopics") or {}).get("nodes")) or [])
    for node in topic_nodes:
        topic = (node or {}).get("topic") or {}
        name = topic.get("name")
        if name:
            topics.append(name)

    primary_language = repo.get("primaryLanguage") or {}
    return {
        "name": repo["name"],
        "full_name": repo["nameWithOwner"],
        "html_url": repo["url"],
        "description": repo.get("description"),
        "stargazers_count": repo.get("stargazerCount", 0),
        "forks_count": repo.get("forkCount", 0),
        "size": repo.get("diskUsage", 0),
        "updated_at": repo["updatedAt"],
        "language": primary_language.get("name"),
        "topics": topics,
        "fork": repo.get("isFork", False),
    }


def fetch_pinned_repositories(username: str, token: str | None) -> list[dict]:
    if not token:
        return []

    query = """
    query($login: String!) {
      user(login: $login) {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              name
              nameWithOwner
              description
              url
              stargazerCount
              forkCount
              diskUsage
              updatedAt
              isFork
              primaryLanguage {
                name
              }
              repositoryTopics(first: 8) {
                nodes {
                  topic {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
    """

    try:
        data = github_graphql_request(query, {"login": username}, token)
    except GitHubSyncError as error:
        print(f"Warning: {error}", file=sys.stderr)
        return []

    user = data.get("user") or {}
    pinned_items = user.get("pinnedItems") or {}
    nodes = pinned_items.get("nodes") or []
    normalized = []
    for node in nodes:
        if not isinstance(node, dict) or not node.get("nameWithOwner"):
            continue
        normalized.append(normalize_graphql_repository(node))
    return normalized


def fetch_pinned_repository_names_from_profile(username: str) -> list[str]:
    profile_url = f"https://github.com/{urllib.parse.quote(username)}"
    html = github_text_request(profile_url)

    section_match = re.search(r"<ol[^>]*js-pinned-items-reorder-list.*?</ol>", html, re.DOTALL)
    if not section_match:
        return []

    repo_pattern = re.compile(rf'href="/(?P<full_name>{re.escape(username)}/[^"/?#]+)"')
    pinned_names = []
    seen = set()
    for match in repo_pattern.finditer(section_match.group(0)):
        full_name = match.group("full_name")
        if full_name in seen:
            continue
        seen.add(full_name)
        pinned_names.append(full_name)
    return pinned_names


def build_featured_repositories(
    username: str,
    repos: list[dict],
    repo_index: dict[str, dict],
    token: str | None,
    related_links_by_repo: dict[str, list[dict]],
) -> list[dict]:
    pinned_repositories = fetch_pinned_repositories(username, token)
    if not pinned_repositories:
        try:
            pinned_names = fetch_pinned_repository_names_from_profile(username)
        except GitHubSyncError as error:
            print(f"Warning: {error}", file=sys.stderr)
            pinned_names = []
        pinned_repositories = [dict(repo_index[full_name]) for full_name in pinned_names if full_name in repo_index]

    if pinned_repositories:
        if any(not repo.get("topics") for repo in pinned_repositories):
            pinned_repositories = attach_topics(pinned_repositories, token)
        return [
            merge_card(
                repo,
                badge="Pinned repository",
                related_links=related_links_by_repo.get(repo["full_name"], []),
            )
            for repo in pinned_repositories
        ]

    repos_with_topics = attach_topics(repos, token)
    topic_featured = [
        repo
        for repo in repos_with_topics
        if any(topic.lower() in {"featured", "showcase"} for topic in repo.get("topics", []))
    ]
    if topic_featured:
        return [
            merge_card(
                repo,
                badge="Featured repository",
                related_links=related_links_by_repo.get(repo["full_name"], []),
            )
            for repo in topic_featured[:6]
        ]

    fallback_repositories = [repo for repo in repos_with_topics if not repo.get("fork")][:3]
    return [
        merge_card(
            repo,
            badge="Recently updated",
            related_links=related_links_by_repo.get(repo["full_name"], []),
        )
        for repo in fallback_repositories
    ]


def build_recent_repositories(repos: list[dict], excluded: set[str], limit: int = 8) -> list[dict]:
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
    spotlight_overrides = {item["full_name"]: item for item in source.get("spotlight_overrides", [])}

    repository_mappings = build_repository_mappings(source, repo_index)
    related_links_by_repo = {mapping["full_name"]: mapping.get("projects", []) for mapping in repository_mappings}

    featured_repositories = build_featured_repositories(username, repos, repo_index, token, related_links_by_repo)

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
        "repository_mappings": repository_mappings,
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