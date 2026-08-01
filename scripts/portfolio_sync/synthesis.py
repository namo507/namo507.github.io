from __future__ import annotations

from collections import defaultdict
from datetime import timedelta
from typing import Iterable

from .models import EvidenceItem, MatchedTask, SlackTask, WeeklyPortfolioUpdate
from .redaction import redact_public_text
from .taxonomy import classify_subsystems, impact_phrase, tokenize_for_match
from .utils import dedupe_preserve


def evidence_match_score(task: SlackTask, evidence: EvidenceItem) -> float:
    task_tokens = tokenize_for_match(" ".join([task.task_name, task.deliverable_type, *task.tools]))
    evidence_tokens = tokenize_for_match(" ".join([evidence.title, evidence.text, *evidence.paths]))
    overlap = len(task_tokens & evidence_tokens)
    tool_overlap = len(set(task.tools) & set(evidence.tool_hints))
    subsystem_overlap = len(set(classify_subsystems(task.task_name)) & set(evidence.subsystems))
    deliverable_bonus = 1.5 if task.deliverable_type == evidence.deliverable_type else 0.0
    path_bonus = 1.0 if evidence.paths else 0.0
    return overlap * 1.25 + tool_overlap * 2.0 + subsystem_overlap * 1.5 + deliverable_bonus + path_bonus


def is_evidence_within_week(task: SlackTask, evidence: EvidenceItem) -> bool:
    start = task.week.start - timedelta(days=2)
    end = task.week.end + timedelta(days=3)
    occurred = evidence.occurred_at.date()
    return start <= occurred <= end


def select_evidence_for_task(task: SlackTask, evidence_items: Iterable[EvidenceItem], processed_commits: set[str]) -> MatchedTask | None:
    scored: list[tuple[float, EvidenceItem]] = []
    for evidence in evidence_items:
        if evidence.commit_sha and evidence.commit_sha in processed_commits:
            continue
        if not is_evidence_within_week(task, evidence):
            continue
        score = evidence_match_score(task, evidence)
        if score >= 2.5:
            scored.append((score, evidence))
    if not scored:
        return None
    scored.sort(key=lambda item: item[0], reverse=True)
    top = scored[:3]
    selected = [item[1] for item in top]
    subsystems = dedupe_preserve(subsystem for item in selected for subsystem in item.subsystems)
    return MatchedTask(task=task, score=top[0][0], evidence=selected, subsystems=subsystems)


def match_tasks_to_evidence(tasks: list[SlackTask], bundles: dict[str, object], processed_commits: dict[str, list[str]]) -> list[MatchedTask]:
    evidence_items: list[EvidenceItem] = []
    for bundle in bundles.values():
        evidence_items.extend(bundle["items"])
    known_commits = {sha for values in processed_commits.values() for sha in values}
    matches: list[MatchedTask] = []
    for task in tasks:
        match = select_evidence_for_task(task, evidence_items, known_commits)
        if match:
            matches.append(match)
    return matches


def _group_metrics(matches: list[MatchedTask]) -> dict[str, int]:
    commits = {item.commit_sha for match in matches for item in match.evidence if item.commit_sha}
    prs = {item.pr_number for match in matches for item in match.evidence if item.pr_number is not None}
    workflows = {item.workflow_run_id for match in matches for item in match.evidence if item.workflow_run_id is not None}
    repos = {item.repo_alias for match in matches for item in match.evidence}
    paths = {path for match in matches for item in match.evidence for path in item.paths}
    return {
        "tasks_matched": len(matches),
        "commits": len(commits),
        "pull_requests": len(prs),
        "workflow_runs": len(workflows),
        "repos": len(repos),
        "paths": len(paths),
    }


def _action_phrase(deliverables: set[str]) -> str:
    ordered = [
        ("dashboard", "shipped reviewable dashboards"),
        ("discrepancy-report", "closed discrepancy-review loops"),
        ("data-pull", "automated recurring data pulls"),
        ("analysis", "translated weekly analyses into reproducible evidence"),
        ("deployment", "hardened deployment and release controls"),
        ("workflow", "operationalized recurring workflows"),
        ("script", "built research automation scripts"),
    ]
    for deliverable, phrase in ordered:
        if deliverable in deliverables:
            return phrase
    return "moved research operations into reproducible automation"


def generate_public_bullets(matches: list[MatchedTask]) -> list[str]:
    if not matches:
        return []
    grouped: dict[str, list[MatchedTask]] = defaultdict(list)
    for match in matches:
        dominant = match.subsystems[0] if match.subsystems else "Research automation"
        grouped[dominant].append(match)
    bullets: list[str] = []
    for subsystem, subsystem_matches in sorted(grouped.items(), key=lambda item: len(item[1]), reverse=True)[:2]:
        metrics = _group_metrics(subsystem_matches)
        tools = dedupe_preserve(tool for match in subsystem_matches for tool in match.task.tools for tool in [tool])
        deliverables = {match.task.deliverable_type for match in subsystem_matches}
        metric_parts = []
        if metrics["commits"]:
            metric_parts.append(f"{metrics['commits']} verified automation changes")
        if metrics["workflow_runs"]:
            metric_parts.append(f"{metrics['workflow_runs']} workflow validations")
        if not metric_parts:
            metric_parts.append(f"{metrics['tasks_matched']} confirmed delivery threads")
        metric_phrase = " and ".join(metric_parts[:2])
        tool_phrase = f" with {', '.join(tools[:3])}" if tools else ""
        bullet = (
            f"{metric_phrase} across {subsystem.lower()}, {_action_phrase(deliverables)}{tool_phrase} "
            f"to {impact_phrase(subsystem)}."
        )
        bullets.append(redact_public_text(bullet))
    return dedupe_preserve(bullets)


def build_weekly_updates(tasks: list[SlackTask], matches: list[MatchedTask], filtered_count: int) -> list[WeeklyPortfolioUpdate]:
    tasks_by_row: dict[str, list[SlackTask]] = defaultdict(list)
    for task in tasks:
        tasks_by_row[task.row_fingerprint].append(task)
    matches_by_row: dict[str, list[MatchedTask]] = defaultdict(list)
    for match in matches:
        matches_by_row[match.task.row_fingerprint].append(match)

    updates: list[WeeklyPortfolioUpdate] = []
    for row_fingerprint, row_tasks in tasks_by_row.items():
        row_matches = matches_by_row.get(row_fingerprint, [])
        week = row_tasks[0].week
        bullets = generate_public_bullets(row_matches)
        metrics = _group_metrics(row_matches)
        subsystems = dedupe_preserve(subsystem for match in row_matches for subsystem in match.subsystems)
        updates.append(
            WeeklyPortfolioUpdate(
                week=week,
                row_fingerprint=row_fingerprint,
                tasks=row_tasks,
                filtered_count=filtered_count,
                matched=row_matches,
                bullets=bullets,
                metrics=metrics,
                subsystems=subsystems,
            )
        )
    updates.sort(key=lambda item: item.week.start)
    return updates
