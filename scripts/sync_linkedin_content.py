#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from linkedin_sync_lib import (
    LinkedInSyncError,
    LinkedInUnavailableError,
    build_bundle,
    build_placeholder_bundle,
    build_sync_meta,
    content_hash,
    extract_profile_payload,
    fetch_public_profile_html,
    has_minimum_profile_content,
    is_suspiciously_empty,
    load_existing_snapshot,
    read_source_payload,
    resolve_profile_url,
    summarize_diff,
    validate_payload,
    write_bundle,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync public LinkedIn content into machine-managed portfolio data files.")
    parser.add_argument("--profile-url", help="Override the LinkedIn profile URL resolved from _config.yml.")
    parser.add_argument("--source-file", help="Optional local HTML/JSON source file for offline parsing and testing.")
    parser.add_argument("--dry-run", action="store_true", help="Run fetch/parse/diff without writing files.")
    parser.add_argument("--no-write", action="store_true", help="Validate and print the outcome without writing files.")
    parser.add_argument("--verbose", action="store_true", help="Print detailed sync diagnostics.")
    parser.add_argument(
        "--bootstrap-placeholders",
        action="store_true",
        help="Write empty machine-managed files if they do not exist yet.",
    )
    return parser.parse_args()


def print_summary(payload: dict, diff_fields: list[str]) -> None:
    profile = payload["linkedin_profile"]
    print(
        "Normalized LinkedIn content: "
        f"name={profile['full_name'] or '<empty>'}; "
        f"experience={len(payload['linkedin_experience'])}; "
        f"featured={len(payload['linkedin_featured'])}; "
        f"updates={len(payload['linkedin_updates'])}"
    )
    if diff_fields:
        print("Meaningful changes: " + ", ".join(diff_fields))


def maybe_bootstrap(profile_url: str, *, write_enabled: bool, verbose: bool) -> int:
    if load_existing_snapshot():
        print("LinkedIn generated data already exists; bootstrap skipped.")
        return 0
    if not write_enabled:
        print("Placeholder bootstrap requested, but writes are disabled.")
        return 0
    written = write_bundle(build_placeholder_bundle(profile_url))
    if verbose:
        print("Wrote placeholder LinkedIn files:")
        for path in written:
            print(f"  - {path}")
    return 0


def main() -> int:
    args = parse_args()
    write_enabled = not (args.dry_run or args.no_write)

    try:
        profile_url = resolve_profile_url(args.profile_url)
    except LinkedInSyncError as error:
        print(str(error), file=sys.stderr)
        return 1

    if args.bootstrap_placeholders:
        return maybe_bootstrap(profile_url, write_enabled=write_enabled, verbose=args.verbose)

    previous_snapshot = load_existing_snapshot()

    try:
        if args.source_file:
            source = read_source_payload(Path(args.source_file))
            effective_profile_url = source.url or profile_url
            if args.verbose:
                print(f"Using local source file: {args.source_file}")
        else:
            source = fetch_public_profile_html(profile_url, verbose=args.verbose)
            effective_profile_url = source.url

        payload = extract_profile_payload(source.html, effective_profile_url, source.fetched_at, verbose=args.verbose)
        validate_payload(payload)
        if not has_minimum_profile_content(payload):
            raise LinkedInUnavailableError("Public LinkedIn response did not expose enough profile fields to trust.")
        if is_suspiciously_empty(payload, previous_snapshot):
            raise LinkedInUnavailableError("Parsed LinkedIn content looked suspiciously empty compared with the previous validated snapshot.")
    except LinkedInUnavailableError as error:
        print(str(error))
        if previous_snapshot:
            print("Keeping existing generated LinkedIn data unchanged.")
        else:
            print("No generated LinkedIn data was changed.")
        return 0
    except LinkedInSyncError as error:
        if args.source_file:
            print(str(error), file=sys.stderr)
            return 1
        print(str(error))
        if previous_snapshot:
            print("Keeping existing generated LinkedIn data unchanged.")
        else:
            print("No generated LinkedIn data was changed.")
        return 0
    except json.JSONDecodeError as error:
        if args.source_file:
            print(f"LinkedIn source input was not valid JSON: {error}", file=sys.stderr)
            return 1
        print(f"LinkedIn source input was not valid JSON: {error}")
        if previous_snapshot:
            print("Keeping existing generated LinkedIn data unchanged.")
        else:
            print("No generated LinkedIn data was changed.")
        return 0

    diff_fields = summarize_diff(previous_snapshot, payload)
    print_summary(payload, diff_fields)

    if previous_snapshot and content_hash(previous_snapshot) == content_hash(payload):
        print("No meaningful LinkedIn content changes detected.")
        return 0

    sync_meta = build_sync_meta(payload, effective_profile_url, source.fetched_at)
    bundle = build_bundle(payload, sync_meta)

    if not write_enabled:
        print("Write step skipped.")
        if args.verbose:
            print(json.dumps(bundle["linkedin_snapshot"], indent=2, ensure_ascii=True))
        return 0

    written = write_bundle(bundle)
    print("Updated machine-managed LinkedIn files:")
    for path in written:
        print(f"  - {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())