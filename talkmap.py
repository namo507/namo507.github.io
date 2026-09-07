#!/usr/bin/env python3
"""Compatibility entry point for the cached, deterministic talk-map generator."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "scripts"))
from scrape_talks import main

if __name__ == "__main__":
    raise SystemExit(main())
