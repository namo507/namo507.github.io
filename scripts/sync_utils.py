"""Bounded network reads and atomic, idempotent writes for content syncs."""

from __future__ import annotations

import json
import os
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path


def read_response(request: urllib.request.Request, *, timeout: int = 30, attempts: int = 3) -> bytes:
    """Retry transient reads only; never wait indefinitely on an upstream API."""
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            retryable = error.code in (429, 500, 502, 503, 504) or (
                error.code == 403 and error.headers.get("X-RateLimit-Remaining") == "0"
            )
            if not retryable or attempt == attempts - 1:
                raise
            retry_after = error.headers.get("Retry-After", "")
            delay = min(float(retry_after), 30) if retry_after.isdigit() else 2 ** attempt
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            if attempt == attempts - 1:
                raise
            delay = 2 ** attempt
        time.sleep(delay)
    raise RuntimeError("No request attempts were allowed")


def read_json(request: urllib.request.Request) -> object:
    return json.loads(read_response(request).decode("utf-8"))


def write_text_if_changed(path: Path, content: str) -> bool:
    """Replace a complete file atomically; identical content keeps its timestamp."""
    if path.is_file() and path.read_text(encoding="utf-8") == content:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent, delete=False) as handle:
            temporary = Path(handle.name)
            handle.write(content)
        temporary.chmod(path.stat().st_mode & 0o777 if path.exists() else 0o644)
        os.replace(temporary, path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    return True
