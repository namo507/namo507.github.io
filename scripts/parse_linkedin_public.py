#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from linkedin_sync_lib import (
    LinkedInSyncError,
    extract_profile_payload,
    read_source_payload,
    resolve_profile_url,
    validate_payload,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Parse fetched LinkedIn HTML into the internal normalized schema.")
    parser.add_argument("--input", required=True, help="Path to raw HTML or JSON from fetch_linkedin_public.py.")
    parser.add_argument("--profile-url", help="Override the LinkedIn profile URL.")
    parser.add_argument("--output", help="Optional file path for the normalized JSON payload.")
    parser.add_argument("--verbose", action="store_true", help="Print parsing details.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source_path = Path(args.input)
    if not source_path.exists():
        print(f"Input file does not exist: {source_path}", file=sys.stderr)
        return 1

    try:
        source = read_source_payload(source_path)
        profile_url = resolve_profile_url(args.profile_url) if args.profile_url else source.url or resolve_profile_url(None)
        payload = extract_profile_payload(source.html, profile_url, source.fetched_at, verbose=args.verbose)
        validate_payload(payload)
    except LinkedInSyncError as error:
        print(str(error), file=sys.stderr)
        return 1

    serialized = json.dumps(payload, indent=2, ensure_ascii=True) + "\n"
    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(serialized, encoding="utf-8")
        print(f"Wrote normalized LinkedIn payload to {output_path}")
        return 0

    print(serialized, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())