"""Tile alignment auditor.

The animated homepage renders content as a family of rectangular tiles
(``.card``, ``.project``, ``.skill``, ``.stat`` ...). Over time their corner
radii drifted onto four different values (18 / 20 / 22 / 24 px), which reads as
subtle visual asymmetry. This pass snaps any off-scale tile radius to the
nearest value on a canonical scale so the tiles share one rhythm, while leaving
intentional pills (999px) and circles (50%) untouched. Grid gaps are reported
for review but not force-changed, because gap size legitimately tracks column
count.

Rewrites are scoped to the specific rule block (located by brace-bounded match)
so comments and the rest of the stylesheet are preserved and the diff stays
minimal.
"""

from __future__ import annotations

import re
from pathlib import Path

import config
from report import DoctorReport, Finding, get_logger

log = get_logger()

_RADIUS_RE = re.compile(r"border-radius:\s*([0-9]+)px", re.IGNORECASE)
_GAP_RE = re.compile(r"\bgap:\s*([0-9]+)px", re.IGNORECASE)


def _nearest_canonical(value: int) -> int:
    scale = config.CANONICAL_RADIUS_SCALE
    # Nearest value; on a tie prefer the larger radius (softer corner).
    return min(scale, key=lambda c: (abs(c - value), -c))


def _find_rule_body(css: str, selector: str) -> tuple[int, int] | None:
    """Return (body_start, body_end) for the first simple rule whose prelude
    contains ``selector`` as a whole class token. Bodies with no nested braces
    only, which is true for every tile rule here."""
    # selector must be followed by a class-terminating char (space, comma,
    # colon, brace) so '.card' does not match '.card__meta' or '.card-x'.
    sel_re = re.compile(re.escape(selector) + r"(?=[\s,:{])")
    for m in sel_re.finditer(css):
        brace = css.find("{", m.end())
        close = css.find("}", m.end())
        if brace == -1:
            continue
        # Ensure no other '}' sits between the selector and its opening brace
        # (which would mean we matched inside another rule's body).
        if close != -1 and close < brace:
            continue
        body_end = css.find("}", brace)
        if body_end == -1:
            continue
        return brace + 1, body_end
    return None


def audit_radii(css: str, report: DoctorReport, apply: bool) -> str:
    observed: dict[str, int] = {}
    for selector in config.TILE_SELECTORS:
        span = _find_rule_body(css, selector)
        if span is None:
            continue
        start, end = span
        body = css[start:end]
        m = _RADIUS_RE.search(body)
        if not m:
            continue
        value = int(m.group(1))
        if value in config.RADIUS_IGNORE or not (config.CARD_RADIUS_MIN <= value <= config.CARD_RADIUS_MAX):
            continue
        observed[selector] = value
        target = _nearest_canonical(value)
        loc = f"styles.css {selector}"
        if target == value:
            report.add(Finding("alignment", "info", f"{selector} radius {value}px on scale", loc))
            continue
        if apply:
            new_body = _RADIUS_RE.sub(f"border-radius: {target}px", body, count=1)
            css = css[:start] + new_body + css[end:]
            report.record_fix(f"Alignment: snapped `{selector}` border-radius {value}px -> {target}px")
        else:
            report.add(Finding("alignment", "warning",
                               f"{selector} radius {value}px is off the canonical scale",
                               loc, detail=f"Nearest canonical radius is {target}px.",
                               auto_fixable=True))
    if observed:
        uniq = sorted(set(observed.values()))
        if len(uniq) > 2:
            report.add(Finding("alignment", "info",
                               f"Tiles span {len(uniq)} radii: {uniq}px",
                               "styles.css",
                               detail="Consider consolidating to one or two values for tighter symmetry."))
    return css


def audit_grid_gaps(css: str, report: DoctorReport) -> None:
    for selector in config.GRID_GAP_SELECTORS:
        span = _find_rule_body(css, selector)
        if span is None:
            continue
        body = css[span[0]:span[1]]
        m = _GAP_RE.search(body)
        if not m:
            continue
        gap = int(m.group(1))
        if abs(gap - config.CANONICAL_GRID_GAP) > 6:
            report.add(Finding("alignment", "info",
                               f"{selector} gap {gap}px differs from canonical {config.CANONICAL_GRID_GAP}px",
                               f"styles.css {selector}",
                               detail="Intentional for column count? Left unchanged."))


def run(report: DoctorReport, apply: bool = True) -> None:
    report.passes_run.append("alignment")
    for css_path in config.THEME_CSS_FILES:
        if not Path(css_path).is_file():
            continue
        css = Path(css_path).read_text(encoding="utf-8")
        new_css = audit_radii(css, report, apply)
        audit_grid_gaps(new_css, report)
        if apply and new_css != css:
            Path(css_path).write_text(new_css, encoding="utf-8")
            log.info("alignment: rewrote %s", Path(css_path).name)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Tile alignment audit")
    parser.add_argument("--check", action="store_true", help="report only, do not modify CSS")
    args = parser.parse_args()
    rpt = DoctorReport()
    run(rpt, apply=not args.check)
    print(rpt.to_markdown())
