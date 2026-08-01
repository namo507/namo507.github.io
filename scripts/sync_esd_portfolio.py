#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from portfolio_sync.config import BRANCH_PREFIX, DEFAULT_LOOKBACK_DAYS, RUN_SUMMARY_PATH, STATE_PATH
from portfolio_sync.github_fetch import GitHubEvidenceFetcher
from portfolio_sync.redaction import filter_sensitive_tasks
from portfolio_sync.site_writer import aggregate_public_bullets, default_state_manifest, write_public_updates, write_state
from portfolio_sync.slack_fetch import fetch_weekly_agenda_markdown, parse_agenda_markdown, summarize_task_taxonomy
from portfolio_sync.synthesis import build_weekly_updates, match_tasks_to_evidence
from portfolio_sync.utils import compact_whitespace, dump_json, load_json, sha1_text, slugify, utcnow_iso, write_text_if_changed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync weekly Slack agenda work into portfolio bullets.")
    parser.add_argument("--agenda-source-file", help="Read agenda markdown from a local file instead of Slack MCP.")
    parser.add_argument("--summary-path", default=str(RUN_SUMMARY_PATH), help="Path to the generated run summary JSON.")
    parser.add_argument("--state-path", default=str(STATE_PATH), help="Path to the committed state manifest.")
    parser.add_argument("--dry-run", action="store_true", help="Compute updates without writing site files or state.")
    parser.add_argument("--verbose", action="store_true", help="Print additional run details.")
    return parser.parse_args()


def load_state(path: Path) -> dict[str, Any]:
    state = load_json(path, default=None)
    return state if isinstance(state, dict) else default_state_manifest()


def merge_week_record(existing: list[dict[str, Any]], update: dict[str, Any]) -> list[dict[str, Any]]:
    merged: list[dict[str, Any]] = []
    replaced = False
    for item in existing:
        if item.get("week", {}).get("label") == update.get("week", {}).get("label"):
            merged.append(update)
            replaced = True
        else:
            merged.append(item)
    if not replaced:
        merged.append(update)
    merged.sort(key=lambda item: (item.get("week", {}).get("start") or "", item.get("week", {}).get("end") or ""))
    return merged


def summarize_bundles(bundles: dict[str, Any]) -> dict[str, Any]:
    summary: dict[str, Any] = {}
    for alias, bundle in bundles.items():
        summary[alias] = {
            "activity_items": len(bundle["items"]),
            "top_level_paths": bundle["structure"],
        }
    return summary


def compute_window(tasks: list[Any]) -> tuple[datetime, datetime]:
    earliest = min(task.week.start for task in tasks)
    latest = max(task.week.end for task in tasks)
    start = datetime.combine(earliest, datetime.min.time(), tzinfo=timezone.utc) - timedelta(days=3)
    end = datetime.combine(latest, datetime.max.time(), tzinfo=timezone.utc) + timedelta(days=1)
    return start, end


def reusable_commits_for_reprocessed_weeks(state: dict[str, Any], reprocessed_labels: set[str]) -> set[str]:
    reusable: set[str] = set()
    for week in state.get("processed_weeks", []):
        label = week.get("week", {}).get("label")
        if label not in reprocessed_labels:
            continue
        for match in week.get("matched", []):
            for evidence in match.get("evidence", []):
                commit_sha = evidence.get("commit_sha")
                if commit_sha:
                    reusable.add(commit_sha)
    return reusable


def week_pr_title(weeks: list[dict[str, Any]]) -> str:
    if not weeks:
        return "Portfolio update: ESD Lab agenda"
    if len(weeks) == 1:
        return f"Portfolio update: ESD Lab agenda {weeks[0]['week']['label']}"
    first = weeks[0]["week"]["label"]
    last = weeks[-1]["week"]["label"]
    return f"Portfolio update: ESD Lab agenda {first} to {last}"


def main() -> int:
    args = parse_args()
    state_path = Path(args.state_path)
    summary_path = Path(args.summary_path)
    state = load_state(state_path)

    markdown = fetch_weekly_agenda_markdown(source_file=args.agenda_source_file)
    all_tasks = parse_agenda_markdown(markdown)
    taxonomy_summary = summarize_task_taxonomy(all_tasks)
    processed_labels = {
        item.get("week", {}).get("label"): item.get("row_fingerprint")
        for item in state.get("processed_weeks", [])
    }

    pending_tasks: list[Any] = []
    reprocessed_labels: set[str] = set()
    for task in all_tasks:
        known_fingerprint = processed_labels.get(task.week.label)
        if known_fingerprint == task.row_fingerprint:
            continue
        if known_fingerprint and known_fingerprint != task.row_fingerprint:
            reprocessed_labels.add(task.week.label)
        pending_tasks.append(task)

    safe_tasks, filtered_count = filter_sensitive_tasks(pending_tasks)

    if safe_tasks:
        since, until = compute_window(safe_tasks)
    else:
        until = datetime.now(timezone.utc)
        since = until - timedelta(days=DEFAULT_LOOKBACK_DAYS)

    github_token = os.getenv("EVIDENCE_GITHUB_TOKEN") or os.getenv("PORTFOLIO_SYNC_GITHUB_TOKEN")
    if not github_token:
        raise RuntimeError("EVIDENCE_GITHUB_TOKEN or PORTFOLIO_SYNC_GITHUB_TOKEN must be set")
    bundles = GitHubEvidenceFetcher(github_token).fetch(since=since, until=until)
    reusable_commits = reusable_commits_for_reprocessed_weeks(state, reprocessed_labels)
    effective_processed_commits: dict[str, list[str]] = {}
    for alias, shas in state.get("processed_commits", {}).items():
        effective_processed_commits[alias] = [sha for sha in shas if sha not in reusable_commits]
    matches = match_tasks_to_evidence(safe_tasks, bundles, effective_processed_commits)
    updates = build_weekly_updates(safe_tasks, matches, filtered_count)

    updated_state = dict(state)
    updated_state.setdefault("processed_weeks", [])
    updated_state.setdefault("processed_commits", {"study_monorepo": [], "automation_workspace": []})
    for update in updates:
        updated_state["processed_weeks"] = merge_week_record(updated_state["processed_weeks"], update.to_dict())
    for match in matches:
        for evidence in match.evidence:
            if evidence.commit_sha:
                updated_state["processed_commits"].setdefault(evidence.repo_alias, [])
                if evidence.commit_sha not in updated_state["processed_commits"][evidence.repo_alias]:
                    updated_state["processed_commits"][evidence.repo_alias].append(evidence.commit_sha)
    updated_state["updated_at"] = utcnow_iso()
    updated_state["generated_bullets"] = aggregate_public_bullets(updated_state)

    changed_paths: list[str] = []
    state_changed = False
    if not args.dry_run:
        changed_paths.extend(write_public_updates(updated_state))
        state_changed = write_state(state_path, updated_state)
        if state_changed:
            changed_paths.append(str(state_path.relative_to(state_path.parents[2])))

    weeks = [update.to_dict() for update in updates]
    latest_label = weeks[-1]["week"]["label"] if weeks else ""
    summary = {
        "changed": bool(changed_paths),
        "changed_files": changed_paths,
        "rows_read": taxonomy_summary["rows_read"],
        "tasks_read": taxonomy_summary["tasks_read"],
        "filtered_count": filtered_count,
        "matched_count": len(matches),
        "matched_by_repo": {
            alias: len([item for match in matches for item in match.evidence if item.repo_alias == alias])
            for alias in bundles.keys()
        },
        "final_bullets": updated_state.get("generated_bullets", []),
        "weeks_processed": weeks,
        "activity_summary": summarize_bundles(bundles),
        "validation_window": {
            "since": since.isoformat(),
            "until": until.isoformat(),
        },
        "pr_title": week_pr_title(weeks),
        "branch_name": f"{BRANCH_PREFIX}/{slugify(latest_label or utcnow_iso()[:10])}",
        "content_hash": sha1_text(json.dumps(updated_state.get("generated_bullets", []), sort_keys=True)),
    }

    write_text_if_changed(summary_path, dump_json(summary))

    if args.verbose:
        print(f"[portfolio-sync] rows read: {summary['rows_read']}")
        print(f"[portfolio-sync] tasks read: {summary['tasks_read']}")
        print(f"[portfolio-sync] sensitivity filtered: {summary['filtered_count']}")
        print(f"[portfolio-sync] matched evidence items: {summary['matched_count']}")
        for alias, count in summary["matched_by_repo"].items():
            print(f"[portfolio-sync] matched against {alias}: {count}")
        print(f"[portfolio-sync] final bullets written: {len(summary['final_bullets'])}")
        print(f"[portfolio-sync] changed files: {', '.join(summary['changed_files']) or 'none'}")

    if os.getenv("GITHUB_OUTPUT"):
        with open(os.getenv("GITHUB_OUTPUT"), "a", encoding="utf-8") as handle:
            handle.write(f"changed={'true' if summary['changed'] else 'false'}\n")
            handle.write(f"branch_name={summary['branch_name']}\n")
            handle.write(f"pr_title={summary['pr_title']}\n")
            handle.write(f"latest_label={compact_whitespace(latest_label)}\n")
            handle.write(f"summary_path={summary_path}\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
