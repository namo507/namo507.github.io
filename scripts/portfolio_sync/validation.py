from __future__ import annotations

import subprocess
from typing import Any

from .config import (
    COSMIC_DATA_PATH,
    CV_JSON_PATH,
    CV_SITE_PATH,
    CV_YAML_PATH,
    PORTFOLIO_SYNC_ASSET_PATH,
    ROOT,
    TARGET_ROLE_MATCH,
)
from .redaction import assert_public_safe
from .utils import load_json, load_yaml, parse_json_from_js_assignment


def _find_cv_site_role(data: dict[str, Any]) -> dict[str, Any]:
    for role in data.get("experience", []):
        if role.get("organization") == TARGET_ROLE_MATCH["cv_site"]["organization"] and role.get("role") == TARGET_ROLE_MATCH["cv_site"]["role"]:
            return role
    raise RuntimeError("Target role not found in cv site yaml")


def _find_cv_json_role(data: dict[str, Any]) -> dict[str, Any]:
    for role in data.get("work", []):
        if role.get("company") == TARGET_ROLE_MATCH["cv_json"]["company"] and role.get("position") == TARGET_ROLE_MATCH["cv_json"]["position"]:
            return role
    raise RuntimeError("Target role not found in cv json")


def _load_generated_asset() -> dict[str, Any]:
    text = PORTFOLIO_SYNC_ASSET_PATH.read_text(encoding="utf-8")
    return parse_json_from_js_assignment(text, "PORTFOLIO_SYNC")


def validate_cosmic_merge_key() -> None:
    """Assert the React data file really contains the role we merge onto.

    mergePortfolioSyncIntoSite() in app.jsx joins the overlay to a role on an
    exact (org, role) pair. If either string drifts the join quietly matches
    nothing and every generated bullet disappears from the site while all four
    backend layers still agree with each other — so symmetry alone would pass.
    """
    text = COSMIC_DATA_PATH.read_text(encoding="utf-8")
    org = TARGET_ROLE_MATCH["cosmic"]["org"]
    role = TARGET_ROLE_MATCH["cosmic"]["role"]
    anchor = text.find(f'org: "{org}"')
    if anchor == -1:
        raise RuntimeError(f'assets/cosmic/data.js has no experience entry with org: "{org}"')
    if f'role: "{role}"' not in text[anchor : anchor + 400]:
        raise RuntimeError(f'assets/cosmic/data.js entry for "{org}" is not role: "{role}"')


def validate_symmetry() -> dict[str, Any]:
    cv_site = load_yaml(CV_SITE_PATH)
    cv_yaml = load_yaml(CV_YAML_PATH)
    cv_json = load_json(CV_JSON_PATH)
    asset = _load_generated_asset()

    cv_site_role = _find_cv_site_role(cv_site)
    cv_yaml_role = _find_cv_site_role(cv_yaml)
    cv_json_role = _find_cv_json_role(cv_json)
    asset_role = (asset.get("experience") or [{}])[0]

    site_bullets = cv_site_role.get("generated_bullets", [])
    yaml_bullets = cv_yaml_role.get("generated_bullets", [])
    json_bullets = cv_json_role.get("generatedHighlights", [])
    asset_bullets = asset_role.get("generated_bullets", [])

    if not (site_bullets == yaml_bullets == json_bullets == asset_bullets):
        raise RuntimeError("Generated bullets drifted between backend and frontend layers")

    assert_public_safe(site_bullets)
    return {
        "generated_bullet_count": len(site_bullets),
        "sync_status": (asset.get("meta") or {}).get("sync_status", "unavailable"),
    }


def _run_command(command: list[str]) -> None:
    result = subprocess.run(command, cwd=ROOT, check=False)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed with exit code {result.returncode}: {' '.join(command)}")


def run_build_validation(*, run_js_build: bool, run_site_build: bool) -> None:
    if run_js_build:
        _run_command(["npm", "run", "build:js"])
    if run_site_build:
        _run_command(["bundle", "exec", "jekyll", "build"])


def validate_all(*, run_js_build: bool = False, run_site_build: bool = False) -> dict[str, Any]:
    validate_cosmic_merge_key()
    summary = validate_symmetry()
    run_build_validation(run_js_build=run_js_build, run_site_build=run_site_build)
    return summary
