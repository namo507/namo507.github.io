#!/usr/bin/env python3
"""Generate stable map data from talk front matter, geocoding new locations only.

Known coordinates are retained in org-locations.json. A network error for a new
location fails before either output is written, preserving the published map.
"""

from __future__ import annotations

import argparse
import html
import json
import math
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

import yaml

from sync_utils import read_json, write_text_if_changed

ROOT = Path(__file__).resolve().parents[1]


def coordinates(value: dict) -> tuple[float, float]:
    lat, lon = float(value["latitude"]), float(value["longitude"])
    if not (math.isfinite(lat) and math.isfinite(lon) and -90 <= lat <= 90 and -180 <= lon <= 180):
        raise ValueError("Invalid map coordinates")
    return lat, lon


def load_talks(directory: Path) -> list[dict]:
    talks = []
    for path in sorted(directory.glob("*.md")):
        parts = path.read_text(encoding="utf-8").split("---", 2)
        if len(parts) != 3 or parts[0].strip():
            raise ValueError(f"Missing talk front matter: {path.name}")
        data = yaml.safe_load(parts[1])
        if not isinstance(data, dict):
            raise ValueError(f"Invalid talk front matter: {path.name}")
        location = str(data.get("location") or "").strip()
        if not location:
            continue
        title = str(data.get("title") or "").strip()
        venue = str(data.get("venue") or "").strip()
        if not title or not venue:
            raise ValueError(f"A mapped talk needs title and venue: {path.name}")
        talks.append({"title": title, "venue": venue, "location": location})
    return talks


def load_cache(directory: Path, talks: list[dict]) -> dict:
    path = directory / "org-locations.json"
    if path.is_file():
        payload = json.loads(path.read_text(encoding="utf-8"))
        cache = payload["locations"]
        for value in cache.values():
            coordinates(value)
        return cache
    # Migrate the existing map without refetching already published coordinates.
    legacy = directory / "org-locations.js"
    if not legacy.is_file():
        return {}
    points = json.loads(legacy.read_text(encoding="utf-8").split("=", 1)[1].strip().rstrip(";"))
    cache = {}
    for talk in talks:
        description = f"{talk['title']}<br />{talk['venue']}; {talk['location']}"
        for point in points:
            if point[0] == description:
                value = {"latitude": point[1], "longitude": point[2]}
                coordinates(value)
                cache[talk["location"]] = value
    return cache


def geocode(location: str) -> dict:
    # Nominatim policy requires identification, caching and <=1 request/second.
    time.sleep(1.1)
    query = urllib.parse.urlencode({"q": location, "format": "jsonv2", "limit": 1})
    request = urllib.request.Request(
        f"https://nominatim.openstreetmap.org/search?{query}",
        headers={"User-Agent": "namo507-talkmap/1.0 (+https://namo507.github.io)", "Accept": "application/json"},
    )
    results = read_json(request)
    if not isinstance(results, list) or not results:
        raise ValueError(f"No coordinates found for {location}; previous map preserved")
    result = {"latitude": float(results[0]["lat"]), "longitude": float(results[0]["lon"])}
    coordinates(result)
    return result


def generate(root: Path, *, dry_run: bool = False) -> list[str]:
    talks = load_talks(root / "_talks")
    cache = load_cache(root / "talkmap", talks)
    points = []
    for talk in talks:
        location = talk["location"]
        if location not in cache:
            cache[location] = geocode(location)
        lat, lon = coordinates(cache[location])
        description = f"{html.escape(talk['title'])}<br />{html.escape(talk['venue'])}; {html.escape(location)}"
        points.append([description, lat, lon])
    payload = {"version": 1, "locations": dict(sorted(cache.items())), "talks": talks}
    outputs = {
        "talkmap/org-locations.json": json.dumps(payload, indent=2, ensure_ascii=True) + "\n",
        "talkmap/org-locations.js": "var addressPoints = " + json.dumps(points, indent=2, ensure_ascii=True) + ";\n",
    }
    changed = []
    for name, content in outputs.items():
        if not dry_run and write_text_if_changed(root / name, content):
            changed.append(name)
    print(f"Validated {len(talks)} mapped talks; {len(changed)} files changed.")
    return changed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    try:
        generate(ROOT, dry_run=args.dry_run)
    except (OSError, ValueError, KeyError, TypeError, yaml.YAMLError) as error:
        print(f"Talk map generation failed; existing map retained: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
