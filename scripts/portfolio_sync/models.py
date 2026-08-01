from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any


@dataclass(frozen=True)
class DateWindow:
    label: str
    start: date
    end: date

    def to_dict(self) -> dict[str, str]:
        return {
            "label": self.label,
            "start": self.start.isoformat(),
            "end": self.end.isoformat(),
        }


@dataclass
class SlackTask:
    week: DateWindow
    row_fingerprint: str
    task_name: str
    deliverable_type: str
    tools: list[str]
    raw_text: str
    source_cells: list[str]
    sensitivity_flags: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "week": self.week.to_dict(),
            "row_fingerprint": self.row_fingerprint,
            "task_name": self.task_name,
            "deliverable_type": self.deliverable_type,
            "tools": list(self.tools),
            "raw_text": self.raw_text,
            "source_cells": list(self.source_cells),
            "sensitivity_flags": list(self.sensitivity_flags),
        }


@dataclass
class EvidenceItem:
    repo_alias: str
    repo_full_name: str
    kind: str
    identifier: str
    title: str
    text: str
    occurred_at: datetime
    deliverable_type: str
    subsystems: list[str]
    tool_hints: list[str]
    paths: list[str] = field(default_factory=list)
    commit_sha: str | None = None
    pr_number: int | None = None
    workflow_run_id: int | None = None
    source_url: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "repo_alias": self.repo_alias,
            "repo_full_name": self.repo_full_name,
            "kind": self.kind,
            "identifier": self.identifier,
            "title": self.title,
            "text": self.text,
            "occurred_at": self.occurred_at.isoformat(),
            "deliverable_type": self.deliverable_type,
            "subsystems": list(self.subsystems),
            "tool_hints": list(self.tool_hints),
            "paths": list(self.paths),
            "commit_sha": self.commit_sha,
            "pr_number": self.pr_number,
            "workflow_run_id": self.workflow_run_id,
            "source_url": self.source_url,
        }


@dataclass
class MatchedTask:
    task: SlackTask
    score: float
    evidence: list[EvidenceItem]
    subsystems: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "task": self.task.to_dict(),
            "score": round(self.score, 3),
            "evidence": [item.to_dict() for item in self.evidence],
            "subsystems": list(self.subsystems),
        }


@dataclass
class WeeklyPortfolioUpdate:
    week: DateWindow
    row_fingerprint: str
    tasks: list[SlackTask]
    filtered_count: int
    matched: list[MatchedTask]
    bullets: list[str]
    metrics: dict[str, int]
    subsystems: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "week": self.week.to_dict(),
            "row_fingerprint": self.row_fingerprint,
            "tasks": [task.to_dict() for task in self.tasks],
            "filtered_count": self.filtered_count,
            "matched": [match.to_dict() for match in self.matched],
            "bullets": list(self.bullets),
            "metrics": dict(self.metrics),
            "subsystems": list(self.subsystems),
        }
