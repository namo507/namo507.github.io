"""Shared result model and logging for every site_doctor pass.

A pass produces ``Finding`` objects (things observed) and may record ``fixes``
(things changed). ``DoctorReport`` aggregates them across passes, serialises to
JSON for the workflow artifact, and renders a Markdown summary that becomes the
body of the auto-filed GitHub issue.
"""

from __future__ import annotations

import dataclasses
import json
import logging
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

SEVERITY_ORDER = {"error": 0, "warning": 1, "info": 2, "fixed": 3}
SEVERITY_ICON = {"error": "🔴", "warning": "🟡", "info": "🔵", "fixed": "🟢"}


def get_logger(name: str = "site_doctor") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stderr)
        handler.setFormatter(logging.Formatter("%(asctime)s  %(levelname)-7s  %(name)s: %(message)s", "%H:%M:%S"))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


@dataclass
class Finding:
    pass_name: str
    severity: str            # error | warning | info | fixed
    message: str
    location: str = ""       # file:line or selector
    detail: str = ""
    auto_fixable: bool = False


@dataclass
class DoctorReport:
    generated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    findings: list[Finding] = field(default_factory=list)
    fixes: list[str] = field(default_factory=list)
    passes_run: list[str] = field(default_factory=list)

    def add(self, finding: Finding) -> None:
        self.findings.append(finding)

    def record_fix(self, message: str) -> None:
        self.fixes.append(message)
        self.findings.append(Finding(pass_name="autofix", severity="fixed", message=message))

    # -- queries ----------------------------------------------------------
    def by_severity(self, severity: str) -> list[Finding]:
        return [f for f in self.findings if f.severity == severity]

    @property
    def error_count(self) -> int:
        return len(self.by_severity("error"))

    @property
    def warning_count(self) -> int:
        return len(self.by_severity("warning"))

    @property
    def has_blocking(self) -> bool:
        return self.error_count > 0

    @property
    def changed(self) -> bool:
        return bool(self.fixes)

    # -- serialisation ----------------------------------------------------
    def to_dict(self) -> dict:
        return {
            "generated_at": self.generated_at,
            "summary": {
                "errors": self.error_count,
                "warnings": self.warning_count,
                "info": len(self.by_severity("info")),
                "fixes_applied": len(self.fixes),
                "passes_run": self.passes_run,
            },
            "fixes": self.fixes,
            "findings": [dataclasses.asdict(f) for f in self.findings],
        }

    def write_json(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.to_dict(), indent=2) + "\n", encoding="utf-8")

    def to_markdown(self) -> str:
        lines = ["## Site Doctor report", ""]
        lines.append(f"Generated `{self.generated_at}`")
        lines.append("")
        lines.append(f"- 🔴 errors: **{self.error_count}**")
        lines.append(f"- 🟡 warnings: **{self.warning_count}**")
        lines.append(f"- 🟢 auto-fixes applied: **{len(self.fixes)}**")
        lines.append(f"- passes: {', '.join(self.passes_run) or 'none'}")
        lines.append("")
        if self.fixes:
            lines.append("### Auto-fixes applied")
            for fx in self.fixes:
                lines.append(f"- 🟢 {fx}")
            lines.append("")
        actionable = [f for f in self.findings if f.severity in ("error", "warning")]
        if actionable:
            lines.append("### Needs attention")
            actionable.sort(key=lambda f: SEVERITY_ORDER.get(f.severity, 9))
            for f in actionable:
                loc = f" `{f.location}`" if f.location else ""
                lines.append(f"- {SEVERITY_ICON.get(f.severity, '')} **[{f.pass_name}]**{loc} {f.message}")
                if f.detail:
                    lines.append(f"  - {f.detail}")
            lines.append("")
        else:
            lines.append("### Needs attention")
            lines.append("Nothing outstanding. The site is healthy. 🎉")
            lines.append("")
        return "\n".join(lines)
