#!/usr/bin/env python3

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path

from linkedin_sync_lib import (
    CURATED_SEED_SOURCE,
    DEFAULT_SEED_PATH,
    LinkedInSyncError,
    LinkedInUnavailableError,
    PUBLIC_SYNC_SOURCE,
    build_bundle,
    build_placeholder_bundle,
    build_sync_meta,
    content_hash,
    current_sync_meta,
    extract_profile_payload,
    fetch_public_profile_html,
    has_minimum_profile_content,
    has_successful_snapshot,
    is_suspiciously_empty,
    load_seed_payload,
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
    parser.add_argument(
        "--seed-file",
        help="Optional curated LinkedIn seed YAML/JSON used when live public fetches cannot produce the first successful snapshot.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Run fetch/parse/diff without writing files.")
    parser.add_argument("--no-write", action="store_true", help="Validate and print the outcome without writing files.")
    parser.add_argument("--verbose", action="store_true", help="Print detailed sync diagnostics.")
    parser.add_argument(
        "--bootstrap-placeholders",
        action="store_true",
        help="Write empty machine-managed files if they do not exist yet.",
    )
    return parser.parse_args()


def print_summary(payload: dict, diff_fields: list[str], *, source: str) -> None:
    profile = payload["linkedin_profile"]
    source_label = "curated seed" if source == CURATED_SEED_SOURCE else "public profile"
    print(
        f"Normalized LinkedIn content from {source_label}: "
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


def resolve_seed_path(explicit_seed_file: str | None) -> Path | None:
    if explicit_seed_file:
        return Path(explicit_seed_file)
    if DEFAULT_SEED_PATH.exists():
        return DEFAULT_SEED_PATH
    return None


def should_use_seed_fallback(previous_snapshot: dict | None) -> bool:
    if not has_successful_snapshot(previous_snapshot):
        return True
    previous_meta = current_sync_meta(previous_snapshot)
    return previous_meta.get("source") == CURATED_SEED_SOURCE


def load_curated_seed(seed_path: Path, profile_url: str, *, verbose: bool) -> tuple[dict, str, str, str]:
    checked_at = dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat()
    payload = load_seed_payload(seed_path, profile_url, checked_at, verbose=verbose)
    effective_profile_url = payload["linkedin_profile"].get("profile_url") or profile_url
    warning = "Rendering a validated curated LinkedIn seed until the first live public sync succeeds."
    return payload, effective_profile_url, checked_at, warning


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
    seed_path = resolve_seed_path(args.seed_file)

    payload: dict | None = None
    effective_profile_url = profile_url
    checked_at = ""
    sync_source = PUBLIC_SYNC_SOURCE
    sync_warning = ""

    try:
        if args.source_file:
            source = read_source_payload(Path(args.source_file))
            effective_profile_url = source.url or profile_url
            checked_at = source.fetched_at
            if args.verbose:
                print(f"Using local source file: {args.source_file}")
        else:
            source = fetch_public_profile_html(profile_url, verbose=args.verbose)
            effective_profile_url = source.url
            checked_at = source.fetched_at

        payload = extract_profile_payload(source.html, effective_profile_url, checked_at, verbose=args.verbose)
        validate_payload(payload)
        if not has_minimum_profile_content(payload):
            raise LinkedInUnavailableError("Public LinkedIn response did not expose enough profile fields to trust.")
        if is_suspiciously_empty(payload, previous_snapshot):
            raise LinkedInUnavailableError("Parsed LinkedIn content looked suspiciously empty compared with the previous validated snapshot.")
    except LinkedInUnavailableError as error:
        if not args.source_file and seed_path and should_use_seed_fallback(previous_snapshot):
            print(str(error))
            print(f"Falling back to curated LinkedIn seed: {seed_path}")
            payload, effective_profile_url, checked_at, sync_warning = load_curated_seed(seed_path, profile_url, verbose=args.verbose)
            sync_source = CURATED_SEED_SOURCE
        else:
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
        if seed_path and should_use_seed_fallback(previous_snapshot):
            print(str(error))
            print(f"Falling back to curated LinkedIn seed: {seed_path}")
            payload, effective_profile_url, checked_at, sync_warning = load_curated_seed(seed_path, profile_url, verbose=args.verbose)
            sync_source = CURATED_SEED_SOURCE
        else:
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
        if seed_path and should_use_seed_fallback(previous_snapshot):
            print(f"LinkedIn source input was not valid JSON: {error}")
            print(f"Falling back to curated LinkedIn seed: {seed_path}")
            payload, effective_profile_url, checked_at, sync_warning = load_curated_seed(seed_path, profile_url, verbose=args.verbose)
            sync_source = CURATED_SEED_SOURCE
        else:
            print(f"LinkedIn source input was not valid JSON: {error}")
            if previous_snapshot:
                print("Keeping existing generated LinkedIn data unchanged.")
            else:
                print("No generated LinkedIn data was changed.")
            return 0

    if payload is None:
        raise LinkedInSyncError("LinkedIn sync did not produce a payload.")

    diff_fields = summarize_diff(previous_snapshot, payload)
    print_summary(payload, diff_fields, source=sync_source)

    if previous_snapshot and content_hash(previous_snapshot) == content_hash(payload):
        print("No meaningful LinkedIn content changes detected.")
        return 0

    sync_meta = build_sync_meta(
        payload,
        effective_profile_url,
        checked_at,
        source=sync_source,
        warning=sync_warning,
    )
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