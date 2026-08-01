#!/usr/bin/env python3

from __future__ import annotations

import argparse

from portfolio_sync.validation import validate_all


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate generated Slack-to-portfolio sync output.")
    parser.add_argument("--run-js-build", action="store_true", help="Run npm build:js as part of validation.")
    parser.add_argument("--run-site-build", action="store_true", help="Run bundle exec jekyll build as part of validation.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    summary = validate_all(run_js_build=args.run_js_build, run_site_build=args.run_site_build)
    print(f"[portfolio-sync] generated bullets validated: {summary['generated_bullet_count']}")
    print(f"[portfolio-sync] frontend sync status: {summary['sync_status']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
