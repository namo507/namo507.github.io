from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .config import (
    CV_JSON_PATH,
    CV_SITE_PATH,
    CV_YAML_PATH,
    DEFAULT_MAX_PUBLIC_BULLETS,
    JSON_MACHINE_HEADER,
    PORTFOLIO_SYNC_ASSET_PATH,
    TARGET_ROLE_MATCH,
)
from .utils import dump_json, dump_yaml, load_json, load_yaml, sha1_text, write_text_if_changed


def default_state_manifest() -> dict[str, Any]:
    return {
        "schema_version": 1,
        "updated_at": "",
        "target_role": {
            "organization": TARGET_ROLE_MATCH["cv_site"]["organization"],
            "role": TARGET_ROLE_MATCH["cv_site"]["role"],
        },
        "processed_weeks": [],
        "processed_commits": {
            "study_monorepo": [],
            "automation_workspace": [],
        },
        "generated_bullets": [],
    }


def aggregate_public_bullets(state: dict[str, Any]) -> list[str]:
    weeks = sorted(
        state.get("processed_weeks", []),
        key=lambda item: (item.get("week", {}).get("end") or "", item.get("week", {}).get("start") or ""),
        reverse=True,
    )
    bullets: list[str] = []
    for week in weeks:
        for bullet in week.get("bullets", []):
            if bullet not in bullets:
                bullets.append(bullet)
            if len(bullets) >= DEFAULT_MAX_PUBLIC_BULLETS:
                return bullets
    return bullets


def _find_cv_site_role(data: dict[str, Any]) -> dict[str, Any]:
    for role in data.get("experience", []):
        if role.get("organization") == TARGET_ROLE_MATCH["cv_site"]["organization"] and role.get("role") == TARGET_ROLE_MATCH["cv_site"]["role"]:
            return role
    raise RuntimeError("Could not find target role in _data/cv_site.yml")


def _find_cv_json_role(data: dict[str, Any]) -> dict[str, Any]:
    for role in data.get("work", []):
        if role.get("company") == TARGET_ROLE_MATCH["cv_json"]["company"] and role.get("position") == TARGET_ROLE_MATCH["cv_json"]["position"]:
            return role
    raise RuntimeError("Could not find target role in _data/cv.json")


def _update_yaml_file(path: Path, bullets: list[str]) -> bool:
    data = load_yaml(path)
    role = _find_cv_site_role(data)
    role["generated_bullets"] = bullets
    return write_text_if_changed(path, dump_yaml(data))


def _update_json_file(path: Path, bullets: list[str]) -> bool:
    data = load_json(path)
    role = _find_cv_json_role(data)
    role["generatedHighlights"] = bullets
    return write_text_if_changed(path, dump_json(data))


def generated_asset_content(bullets: list[str], state: dict[str, Any]) -> str:
    payload = {
        "meta": {
            "sync_status": "ok" if bullets else "unavailable",
            "updated_at": state.get("updated_at", ""),
            "date_ranges": [item.get("week", {}).get("label") for item in state.get("processed_weeks", [])[-4:]],
            "content_hash": sha1_text(json.dumps(bullets, sort_keys=True))[:12],
        },
        "experience": [
            {
                "org": TARGET_ROLE_MATCH["cosmic"]["org"],
                "role": TARGET_ROLE_MATCH["cosmic"]["role"],
                "generated_bullets": bullets,
            }
        ],
    }
    return JSON_MACHINE_HEADER + "window.PORTFOLIO_SYNC = Object.freeze(" + json.dumps(payload, indent=2, ensure_ascii=True) + ");\n"


def write_generated_frontend_asset(bullets: list[str], state: dict[str, Any]) -> bool:
    return write_text_if_changed(PORTFOLIO_SYNC_ASSET_PATH, generated_asset_content(bullets, state))


def write_state(path: Path, state: dict[str, Any]) -> bool:
    return write_text_if_changed(path, dump_json(state))


def write_public_updates(state: dict[str, Any]) -> list[str]:
    bullets = aggregate_public_bullets(state)
    changed_paths: list[str] = []
    if _update_yaml_file(CV_SITE_PATH, bullets):
        changed_paths.append(str(CV_SITE_PATH.relative_to(CV_SITE_PATH.parents[1])))
    if _update_yaml_file(CV_YAML_PATH, bullets):
        changed_paths.append(str(CV_YAML_PATH.relative_to(CV_YAML_PATH.parents[1])))
    if _update_json_file(CV_JSON_PATH, bullets):
        changed_paths.append(str(CV_JSON_PATH.relative_to(CV_JSON_PATH.parents[1])))
    if write_generated_frontend_asset(bullets, state):
        changed_paths.append(str(PORTFOLIO_SYNC_ASSET_PATH.relative_to(PORTFOLIO_SYNC_ASSET_PATH.parents[2])))
    state["generated_bullets"] = bullets
    return changed_paths
