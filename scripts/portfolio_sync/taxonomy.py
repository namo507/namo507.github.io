from __future__ import annotations

from typing import Iterable

from .config import DELIVERABLE_KEYWORDS, MATCH_STOPWORDS, SUBSYSTEM_RULES, TECH_KEYWORDS
from .utils import compact_whitespace, dedupe_preserve, tokenize


def extract_tools(text: str, extra_terms: Iterable[str] | None = None) -> list[str]:
    haystack = f" {compact_whitespace(text).lower()} "
    found: list[str] = []
    for canonical, aliases in TECH_KEYWORDS.items():
        for alias in aliases:
            if alias.startswith(" ") and alias.endswith(" "):
                if alias in haystack:
                    found.append(canonical)
                    break
            elif alias in haystack:
                found.append(canonical)
                break
    if extra_terms:
        for term in extra_terms:
            if term and term not in found:
                found.append(term)
    return dedupe_preserve(found)


def infer_deliverable_type(text: str) -> str:
    haystack = compact_whitespace(text).lower()
    for deliverable, keywords in DELIVERABLE_KEYWORDS.items():
        if any(keyword in haystack for keyword in keywords):
            return deliverable
    return "automation"


def classify_subsystems(text: str, paths: Iterable[str] | None = None) -> list[str]:
    haystack = compact_whitespace(text).lower()
    normalized_paths = [path.lower() for path in (paths or [])]
    matches: list[str] = []
    for rule in SUBSYSTEM_RULES:
        if any(prefix in path for prefix in rule["path_prefixes"] for path in normalized_paths):
            matches.append(rule["name"])
            continue
        if any(keyword in haystack for keyword in rule["keywords"]):
            matches.append(rule["name"])
    return dedupe_preserve(matches or ["Research automation"])


def impact_phrase(subsystem_name: str) -> str:
    for rule in SUBSYSTEM_RULES:
        if rule["name"] == subsystem_name:
            return rule["impact"]
    return "advance reproducible research delivery"


def tokenize_for_match(text: str) -> set[str]:
    return {
        token
        for token in tokenize(text)
        if len(token) > 2 and token not in MATCH_STOPWORDS and not token.isdigit()
    }
