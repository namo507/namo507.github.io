from __future__ import annotations

import hashlib
import json
import re
import subprocess
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Iterable


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def utcnow_iso() -> str:
    return utcnow().isoformat()


def compact_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def sha1_text(value: str) -> str:
    return hashlib.sha1((value or "").encode("utf-8")).hexdigest()


def slugify(value: str) -> str:
    text = compact_whitespace(value).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "portfolio-update"


def dedupe_preserve(items: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        ordered.append(item)
    return ordered


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def load_json(path: Path, default: Any | None = None) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def dump_json(data: Any) -> str:
    return json.dumps(data, indent=2, ensure_ascii=True) + "\n"


def write_text_if_changed(path: Path, content: str) -> bool:
    ensure_parent(path)
    current = path.read_text(encoding="utf-8") if path.exists() else None
    if current == content:
        return False
    path.write_text(content, encoding="utf-8")
    return True


def load_yaml(path: Path) -> Any:
    script = (
        "require 'yaml'; require 'json'; "
        "data = YAML.safe_load(File.read(ARGV[0]), aliases: true); "
        "print JSON.generate(data)"
    )
    result = subprocess.run(
        ["ruby", "-e", script, str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def dump_yaml(data: Any) -> str:
    script = (
        "require 'json'; require 'yaml'; "
        "data = JSON.parse(STDIN.read); "
        "yaml = YAML.dump(data).sub(/\\A---\\s*\n/, ''); "
        "print yaml"
    )
    result = subprocess.run(
        ["ruby", "-e", script],
        input=json.dumps(data, ensure_ascii=True),
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout


def tokenize(value: str) -> list[str]:
    return re.findall(r"[a-z0-9][a-z0-9_\-/+.]+", (value or "").lower())


def month_number_from_name(name: str) -> int:
    normalized = (name or "").strip().lower()[:3]
    months = {
        "jan": 1,
        "feb": 2,
        "mar": 3,
        "apr": 4,
        "may": 5,
        "jun": 6,
        "jul": 7,
        "aug": 8,
        "sep": 9,
        "oct": 10,
        "nov": 11,
        "dec": 12,
    }
    if normalized not in months:
        raise ValueError(f"Unsupported month name: {name}")
    return months[normalized]


def infer_year(month_number: int, today: date) -> int:
    if month_number >= today.month + 9:
        return today.year - 1
    if month_number <= today.month - 9:
        return today.year + 1
    return today.year


def parse_datetime(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def parse_json_from_js_assignment(text: str, variable_name: str) -> Any:
    pattern = re.compile(
        rf"window\.{re.escape(variable_name)}\s*=\s*Object\.freeze\((.*)\);\s*$",
        re.DOTALL,
    )
    match = pattern.search(text.strip())
    if not match:
        raise ValueError(f"Could not parse generated payload for {variable_name}")
    return json.loads(match.group(1))
