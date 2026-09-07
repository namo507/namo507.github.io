"""Bounded HTTP smoke checks for the served container and deployed Pages artifact."""
from __future__ import annotations

import argparse
import json
from http.client import HTTPException
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

ROUTES = ("", "cv/", "portfolio/", "publications/", "github/", "talks/",
          "assets/cosmic/styles.css", "assets/cosmic/app.min.js")


def check(base: str, attempts: int = 3, expected_revision: str | None = None) -> None:
    for route in ROUTES:
        url = urljoin(base.rstrip("/") + "/", route)
        for attempt in range(attempts):
            try:
                request = Request(url, headers={"User-Agent": "PortfolioHealthCheck/1.0"})
                with urlopen(request, timeout=20) as response:
                    body = response.read()
                    if response.status != 200 or not body:
                        raise ValueError(f"HTTP {response.status} or empty response")
                    if not route or route.endswith("/"):
                        if b"<html" not in body.lower():
                            raise ValueError("Expected an HTML page")
                    if not route and b'id="app"' not in body:
                        raise ValueError("Missing portfolio application mount")
                print(f"PASS {url}")
                break
            except (HTTPError, URLError, HTTPException, TimeoutError, ValueError) as exc:
                if attempt + 1 == attempts:
                    raise SystemExit(f"FAIL {url}: {exc}") from exc
                time.sleep(min(2 ** attempt, 8))
    if expected_revision:
        url = urljoin(base.rstrip("/") + "/", "site-revision.json")
        for attempt in range(12):
            try:
                request = Request(url + "?revision=" + expected_revision,
                                  headers={"Cache-Control": "no-cache"})
                with urlopen(request, timeout=20) as response:
                    actual = json.load(response).get("sha")
                if actual == expected_revision:
                    print(f"PASS deployed revision {actual}")
                    return
            except (HTTPError, URLError, HTTPException, TimeoutError, ValueError):
                actual = "unavailable"
            time.sleep(5)
        raise SystemExit(f"FAIL deployed revision {actual}; expected {expected_revision}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base_url")
    parser.add_argument("--expected-revision")
    args = parser.parse_args()
    check(args.base_url, expected_revision=args.expected_revision)
