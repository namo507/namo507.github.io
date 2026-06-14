"""Dynamic contrast auditor for the cosmic theme.

Two complementary checks run against ``assets/cosmic/styles.css``:

1. Token readability. Every text/accent custom property in ``:root`` is scored
   against the actual surfaces it sits on (the frosted ``--panel`` composited
   over ``--bg``, and the raw ``--bg``). The governing ratio is the worst of the
   two. Tokens that fall below their role's WCAG AA target are nudged to the
   minimal hue-preserving lightness that passes, and the single declaration is
   surgically rewritten so comments and formatting survive. Caption-only tokens
   are flagged, never recolored, to respect the deliberate dim-caption design.

2. Explicit pairs. Any rule that pairs a concrete ``color`` with a concrete
   ``background`` (for example the call-to-action buttons) is scored directly so
   one-off foreground/background bugs are caught. These are reported, not
   auto-changed, because the right fix depends on design intent.
"""

from __future__ import annotations

import re
from pathlib import Path

import tinycss2

import config
from colors import Color, composite_over, contrast_ratio, parse_color, adjust_to_contrast
from report import DoctorReport, Finding, get_logger

log = get_logger()

_VAR_RE = re.compile(r"var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)")


# ---------------------------------------------------------------------------
# Token graph
# ---------------------------------------------------------------------------
def load_root_tokens(css: str) -> dict[str, str]:
    tokens: dict[str, str] = {}
    for rule in tinycss2.parse_stylesheet(css, skip_whitespace=True, skip_comments=True):
        if rule.type != "qualified-rule":
            continue
        if tinycss2.serialize(rule.prelude).strip() != ":root":
            continue
        for decl in tinycss2.parse_declaration_list(rule.content, skip_whitespace=True, skip_comments=True):
            if decl.type == "declaration" and decl.name.startswith("--"):
                tokens[decl.name] = tinycss2.serialize(decl.value).strip()
    return tokens


def resolve_color(value: str, tokens: dict[str, str], _depth: int = 0) -> Color | None:
    """Resolve a CSS value (literal or ``var(--x)``) to a concrete Color."""
    if value is None or _depth > 8:
        return None
    value = value.strip()
    m = _VAR_RE.search(value)
    if m and m.group(1) in tokens:
        return resolve_color(tokens[m.group(1)], tokens, _depth + 1)
    return parse_color(value)


def effective_surface(token_name: str, tokens: dict[str, str]) -> Color | None:
    """Resolve a surface token, compositing translucency over ``--bg``."""
    col = resolve_color(tokens.get(token_name, token_name), tokens)
    if col is None:
        return None
    if col.a < 1.0:
        bg = resolve_color(tokens.get("--bg", "#000000"), tokens) or Color(0, 0, 0)
        col = composite_over(col, bg)
    return col


def _governing_surfaces(tokens: dict[str, str]) -> list[tuple[str, Color]]:
    surfaces: list[tuple[str, Color]] = []
    for name in (config.DEFAULT_SURFACE_TOKEN, "--bg"):
        surf = effective_surface(name, tokens)
        if surf is not None:
            surfaces.append((name, surf))
    return surfaces


# ---------------------------------------------------------------------------
# Pass 1: token readability + auto-fix
# ---------------------------------------------------------------------------
def _rewrite_token(css: str, token: str, new_hex: str) -> str:
    pattern = re.compile(rf"({re.escape(token)}\s*:\s*)([^;]+)(;)")
    return pattern.sub(lambda mo: f"{mo.group(1)}{new_hex}{mo.group(3)}", css, count=1)


def audit_tokens(css: str, tokens: dict[str, str], report: DoctorReport, apply: bool) -> str:
    surfaces = _governing_surfaces(tokens)
    if not surfaces:
        report.add(Finding("contrast", "warning", "No resolvable surfaces in :root", "styles.css"))
        return css

    for token, role in config.INK_TOKENS.items():
        if token not in tokens:
            continue
        fg = resolve_color(tokens[token], tokens)
        if fg is None:
            continue
        # Governing (worst) case across the surfaces this token sits on.
        worst_name, worst_surface, worst_ratio = None, None, 99.0
        for sname, surf in surfaces:
            ratio = contrast_ratio(fg, surf)
            if ratio < worst_ratio:
                worst_name, worst_surface, worst_ratio = sname, surf, ratio

        required = config.TOKEN_ROLE_MIN_RATIO[role]
        loc = f"styles.css :root {token}"
        if worst_ratio >= required:
            report.add(Finding("contrast", "info",
                               f"{token} OK ({worst_ratio:.2f}:1 on {worst_name})", loc))
            continue

        detail = (f"{token} = {fg.to_hex()} on {worst_name} ({worst_surface.to_hex()}) "
                  f"is {worst_ratio:.2f}:1, needs {required:.1f}:1 ({role} text).")

        if role in config.AUTOFIX_ROLES and apply:
            fixed = adjust_to_contrast(fg, worst_surface, required)
            new_hex = fixed.to_hex()
            new_ratio = contrast_ratio(fixed, worst_surface)
            css = _rewrite_token(css, token, new_hex)
            tokens[token] = new_hex
            report.record_fix(
                f"Contrast: recolored `{token}` {fg.to_hex()} -> {new_hex} "
                f"({worst_ratio:.2f}:1 -> {new_ratio:.2f}:1 on {worst_name})")
        else:
            sev = "warning" if role == "caption" else "error"
            report.add(Finding("contrast", sev, f"{token} below WCAG AA", loc, detail=detail,
                               auto_fixable=role in config.AUTOFIX_ROLES))
    return css


# ---------------------------------------------------------------------------
# Pass 2: explicit color/background pairs
# ---------------------------------------------------------------------------
def audit_explicit_pairs(css: str, tokens: dict[str, str], report: DoctorReport) -> None:
    for rule in tinycss2.parse_stylesheet(css, skip_whitespace=True, skip_comments=True):
        if rule.type != "qualified-rule":
            continue
        selector = tinycss2.serialize(rule.prelude).strip()
        color_val = bg_val = None
        for decl in tinycss2.parse_declaration_list(rule.content, skip_whitespace=True, skip_comments=True):
            if decl.type != "declaration":
                continue
            name = decl.name.lower()
            val = tinycss2.serialize(decl.value).strip()
            if name == "color":
                color_val = val
            elif name in ("background", "background-color"):
                # Take the first colour-like token from a shorthand background.
                bg_val = val
        if not color_val or not bg_val:
            continue
        fg = resolve_color(color_val, tokens)
        bg = resolve_color(bg_val, tokens)
        if fg is None or bg is None:
            continue
        if bg.a < 1.0:
            base = resolve_color(tokens.get("--bg", "#000"), tokens) or Color(0, 0, 0)
            bg = composite_over(bg, base)
        ratio = contrast_ratio(fg, bg)
        if ratio < config.AA_LARGE_RATIO:
            report.add(Finding("contrast", "error",
                               f"Pair `{selector}` only {ratio:.2f}:1",
                               f"styles.css {selector}",
                               detail=f"{fg.to_hex()} on {bg.to_hex()} (needs >= 3:1 even for large text)."))
        elif ratio < config.AA_NORMAL_RATIO:
            report.add(Finding("contrast", "warning",
                               f"Pair `{selector}` {ratio:.2f}:1 (below AA for body text)",
                               f"styles.css {selector}",
                               detail=f"{fg.to_hex()} on {bg.to_hex()}; fine for large text, low for body."))


def run(report: DoctorReport, apply: bool = True) -> None:
    report.passes_run.append("contrast")
    for css_path in config.THEME_CSS_FILES:
        if not Path(css_path).is_file():
            continue
        css = Path(css_path).read_text(encoding="utf-8")
        tokens = load_root_tokens(css)
        log.info("contrast: %s has %d root tokens", Path(css_path).name, len(tokens))
        new_css = audit_tokens(css, tokens, report, apply)
        audit_explicit_pairs(new_css, tokens, report)
        if apply and new_css != css:
            Path(css_path).write_text(new_css, encoding="utf-8")
            log.info("contrast: rewrote %s", Path(css_path).name)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Contrast audit")
    parser.add_argument("--check", action="store_true", help="report only, do not modify CSS")
    args = parser.parse_args()
    rpt = DoctorReport()
    run(rpt, apply=not args.check)
    print(rpt.to_markdown())
