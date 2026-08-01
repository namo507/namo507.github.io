from __future__ import annotations

import re
from typing import Iterable

from .config import HARD_DENYLIST, INTERNAL_URL_DENYLIST
from .utils import compact_whitespace, dedupe_preserve


SENSITIVE_ID_PATTERN = re.compile(
    r"\b(?:participant|subject|record|project|pid|study|survey)\s*(?:id|#|number)?\s*[:=-]?\s*[A-Za-z0-9_-]{2,}\b",
    re.IGNORECASE,
)
URL_PATTERN = re.compile(r"https?://\S+", re.IGNORECASE)
HANDLE_PATTERN = re.compile(r"@[A-Za-z0-9_-]+")
FULL_NAME_PATTERN = re.compile(r"\b(?:Dr\.?|Prof\.?|PI\b|with)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+")
POTENTIAL_DEMOGRAPHIC_PATTERN = re.compile(
    r"\b(?:male|female|gender|race|ethnicity|age|ages|years old|cohort)\b",
    re.IGNORECASE,
)


def find_denylist_hits(text: str) -> list[str]:
    lower = (text or "").lower()
    hits: list[str] = []
    for pattern in [*HARD_DENYLIST, *INTERNAL_URL_DENYLIST]:
        if pattern.lower() in lower:
            hits.append(pattern)
    if SENSITIVE_ID_PATTERN.search(text or ""):
        hits.append("sensitive-id")
    if POTENTIAL_DEMOGRAPHIC_PATTERN.search(text or ""):
        hits.append("demographic-language")
    return dedupe_preserve(hits)


def redact_public_text(text: str) -> str:
    value = compact_whitespace(text)
    value = URL_PATTERN.sub("[redacted-link]", value)
    value = HANDLE_PATTERN.sub("[redacted-handle]", value)
    value = FULL_NAME_PATTERN.sub("collaborators", value)
    value = SENSITIVE_ID_PATTERN.sub("[redacted-id]", value)
    for pattern in HARD_DENYLIST:
        value = re.sub(re.escape(pattern), "internal research workspace", value, flags=re.IGNORECASE)
    for pattern in INTERNAL_URL_DENYLIST:
        value = re.sub(re.escape(pattern), "[redacted-link]", value, flags=re.IGNORECASE)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def filter_sensitive_tasks(tasks: Iterable[object]) -> tuple[list[object], int]:
    safe: list[object] = []
    filtered = 0
    for task in tasks:
        raw_text = getattr(task, "raw_text", "")
        if find_denylist_hits(raw_text):
            filtered += 1
            continue
        sensitivity_flags = getattr(task, "sensitivity_flags", [])
        if "phi-adjacent" in sensitivity_flags or "identifier" in sensitivity_flags:
            filtered += 1
            continue
        safe.append(task)
    return safe, filtered


def assert_public_safe(lines: Iterable[str]) -> None:
    for line in lines:
        hits = find_denylist_hits(line)
        if hits:
            raise RuntimeError(f"Generated public text failed redaction checks: {hits} in '{line}'")
