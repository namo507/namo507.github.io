from __future__ import annotations

import json
import os
import re
from datetime import date, timedelta
from typing import Any

from .config import DEFAULT_MAX_TASKS_PER_WEEK
from .mcp_client import build_mcp_client
from .models import DateWindow, SlackTask
from .taxonomy import classify_subsystems, extract_tools, infer_deliverable_type
from .utils import compact_whitespace, dedupe_preserve, infer_year, month_number_from_name, sha1_text


DATE_RANGE_PATTERNS = [
    re.compile(r"^(?P<start_day>\d{1,2})\s*-\s*(?P<end_day>\d{1,2})\s+(?P<month>[A-Za-z]+)$"),
    re.compile(r"^(?P<start_day>\d{1,2})\s+(?P<month>[A-Za-z]+)\s*-\s*(?P<end_day>\d{1,2})\s+(?P<end_month>[A-Za-z]+)$"),
    re.compile(r"^(?P<start_day>\d{1,2})\s+(?P<month>[A-Za-z]+)\s*-\s*(?P<end_day>\d{1,2})$"),
]


def fetch_weekly_agenda_markdown(source_file: str | None = None) -> str:
    if source_file:
        return open(source_file, "r", encoding="utf-8").read()

    tool_name = os.getenv("SLACK_MCP_TOOL", "read_weekly_agenda_canvas")
    arguments: dict[str, Any] = {}
    if os.getenv("SLACK_AGENDA_CANVAS_ID"):
        arguments["canvas_id"] = os.getenv("SLACK_AGENDA_CANVAS_ID")
    if os.getenv("SLACK_AGENDA_CHANNEL_ID"):
        arguments["channel_id"] = os.getenv("SLACK_AGENDA_CHANNEL_ID")
    if os.getenv("SLACK_MCP_TOOL_ARGS_JSON"):
        arguments.update(json.loads(os.getenv("SLACK_MCP_TOOL_ARGS_JSON", "{}")))

    extra_env = {}
    if os.getenv("SLACK_BOT_TOKEN"):
        extra_env["SLACK_BOT_TOKEN"] = os.getenv("SLACK_BOT_TOKEN", "")

    with build_mcp_client("SLACK_MCP_", extra_env=extra_env) as client:
        result = client.call_tool(tool_name, arguments)
    markdown = extract_text_from_tool_result(result)
    if not compact_whitespace(markdown):
        raise RuntimeError("Slack MCP tool returned no markdown content")
    return markdown


def extract_text_from_tool_result(result: dict[str, Any]) -> str:
    if isinstance(result, str):
        return result
    structured = result.get("structuredContent")
    if isinstance(structured, dict):
        for key in ("markdown", "text", "content", "canvas_markdown"):
            value = structured.get(key)
            if isinstance(value, str) and value.strip():
                return value
    content = result.get("content")
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, dict):
                text = item.get("text") or item.get("content")
                if isinstance(text, str) and text.strip():
                    parts.append(text)
        if parts:
            return "\n".join(parts)
    for key in ("text", "markdown", "content"):
        value = result.get(key)
        if isinstance(value, str) and value.strip():
            return value
    raise RuntimeError(f"Unsupported Slack MCP result payload: {result}")


def parse_week_label(label: str, *, today: date | None = None) -> DateWindow:
    today = today or date.today()
    normalized = compact_whitespace(label.replace("–", "-").replace("—", "-").replace(" to ", " - "))
    for pattern in DATE_RANGE_PATTERNS:
        match = pattern.match(normalized)
        if not match:
            continue
        groups = match.groupdict()
        start_month = month_number_from_name(groups["month"])
        end_month = month_number_from_name(groups.get("end_month") or groups["month"])
        start_year = infer_year(start_month, today)
        end_year = infer_year(end_month, today)
        start = date(start_year, start_month, int(groups["start_day"]))
        end = date(end_year, end_month, int(groups["end_day"]))
        if end < start:
            end = end.replace(year=start.year)
        return DateWindow(label=normalized, start=start, end=end)
    raise ValueError(f"Could not parse agenda date range: {label}")


def detect_sensitivity_flags(text: str) -> list[str]:
    lower = text.lower()
    flags: list[str] = []
    if any(keyword in lower for keyword in ("participant", "subject", "patient", "demographic", "dob", "mrn")):
        flags.append("phi-adjacent")
    if re.search(r"\b(?:pid|record id|project id|subject id)\b", lower):
        flags.append("identifier")
    if "http" in lower and any(host in lower for host in ("sharepoint", "notion", "redcap", "slack.com")):
        flags.append("internal-link")
    return dedupe_preserve(flags)


def split_task_fragments(text: str) -> list[str]:
    replaced = text.replace("<br>", "\n").replace("•", "\n").replace(";", "\n")
    lines = []
    for line in replaced.splitlines():
        cleaned = compact_whitespace(re.sub(r"^[-*\d.)\s]+", "", line))
        if cleaned:
            lines.append(cleaned)
    return lines


def row_to_tasks(week: DateWindow, cells: list[str]) -> list[SlackTask]:
    joined_cells = [compact_whitespace(cell) for cell in cells if compact_whitespace(cell)]
    row_fingerprint = sha1_text("|".join([week.label, *joined_cells]))
    raw_fragments: list[str] = []
    for cell in joined_cells[1:] if len(joined_cells) > 1 else joined_cells:
        raw_fragments.extend(split_task_fragments(cell))
    tasks: list[SlackTask] = []
    for fragment in raw_fragments[:DEFAULT_MAX_TASKS_PER_WEEK]:
        tasks.append(
            SlackTask(
                week=week,
                row_fingerprint=row_fingerprint,
                task_name=fragment,
                deliverable_type=infer_deliverable_type(fragment),
                tools=extract_tools(fragment),
                raw_text=fragment,
                source_cells=joined_cells,
                sensitivity_flags=detect_sensitivity_flags(fragment),
            )
        )
    return tasks


def parse_table_rows(markdown: str, *, today: date | None = None) -> list[SlackTask]:
    tasks: list[SlackTask] = []
    for raw_line in markdown.splitlines():
        line = raw_line.strip()
        if not line.startswith("|"):
            continue
        if re.fullmatch(r"\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?", line):
            continue
        cells = [compact_whitespace(cell) for cell in line.strip("|").split("|")]
        if not cells:
            continue
        first_cell = cells[0]
        if not first_cell or first_cell.lower() in {"date", "date range", "week", "week of", "timeline"}:
            continue
        try:
            week = parse_week_label(first_cell, today=today)
        except ValueError:
            continue
        tasks.extend(row_to_tasks(week, cells))
    return tasks


def parse_section_rows(markdown: str, *, today: date | None = None) -> list[SlackTask]:
    tasks: list[SlackTask] = []
    lines = markdown.splitlines()
    current_week: DateWindow | None = None
    current_cells: list[str] = []
    for line in lines:
        stripped = compact_whitespace(line)
        if not stripped:
            continue
        try:
            maybe_week = parse_week_label(stripped.lstrip("#"), today=today)
        except ValueError:
            maybe_week = None
        if maybe_week:
            if current_week and current_cells:
                tasks.extend(row_to_tasks(current_week, [current_week.label, *current_cells]))
            current_week = maybe_week
            current_cells = []
            continue
        if current_week:
            current_cells.append(stripped)
    if current_week and current_cells:
        tasks.extend(row_to_tasks(current_week, [current_week.label, *current_cells]))
    return tasks


def parse_agenda_markdown(markdown: str, *, today: date | None = None) -> list[SlackTask]:
    parsed = parse_table_rows(markdown, today=today)
    if parsed:
        return parsed
    return parse_section_rows(markdown, today=today)


def summarize_task_taxonomy(tasks: list[SlackTask]) -> dict[str, Any]:
    return {
        "rows_read": len({task.row_fingerprint for task in tasks}),
        "tasks_read": len(tasks),
        "deliverable_types": dedupe_preserve(task.deliverable_type for task in tasks),
        "tools": dedupe_preserve(tool for task in tasks for tool in task.tools),
        "subsystems": dedupe_preserve(
            subsystem for task in tasks for subsystem in classify_subsystems(task.task_name)
        ),
    }
