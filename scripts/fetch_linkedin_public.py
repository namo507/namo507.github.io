#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from linkedin_sync_lib import LinkedInSyncError, fetch_public_profile_html, resolve_profile_url


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch public LinkedIn HTML without browser automation.")
    parser.add_argument("--profile-url", help="Override the LinkedIn profile URL.")
    parser.add_argument("--output", help="Optional JSON file for the raw response payload.")
    parser.add_argument("--verbose", action="store_true", help="Print fetch details.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        profile_url = resolve_profile_url(args.profile_url)
        result = fetch_public_profile_html(profile_url, verbose=args.verbose)
    except LinkedInSyncError as error:
        print(str(error), file=sys.stderr)
        return 1

    payload = {
        "url": result.url,
        "final_url": result.final_url,
        "status_code": result.status_code,
        "fetched_at": result.fetched_at,
        "html": result.html,
    }

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
        print(f"Wrote raw LinkedIn response to {output_path}")
        return 0

    print(json.dumps({key: value for key, value in payload.items() if key != "html"}, indent=2, ensure_ascii=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())