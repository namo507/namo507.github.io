"""Audit and safely repair text tokens in both inherited color themes.

Every normal-text token is checked against each configured surface, after alpha
compositing. Repairs modify only the relevant theme declaration and are accepted
only if they meet the requirement on every surface. Browser checks handle actual
font sizes, gradients, nested surfaces, and component-specific overrides.
"""

from __future__ import annotations

import re
from pathlib import Path

import tinycss2

import config
from colors import Color, composite_over, contrast_ratio, parse_color, adjust_to_contrast
from report import DoctorReport, Finding, get_logger

log = get_logger()
_VAR_RE = re.compile(r"var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)")
_THEME_RE = re.compile(r''':root(?:\[data-theme\s*=\s*["']?(light|dark)["']?\])?$''')


def _offset(text: str, line: int, column: int) -> int:
    return sum(len(item) for item in text.splitlines(keepends=True)[:line - 1]) + column - 1


def _theme_blocks(css: str) -> list[tuple[str, int, int]]:
    blocks = []
    for rule in tinycss2.parse_stylesheet(css, skip_whitespace=True, skip_comments=True):
        if rule.type != "qualified-rule":
            continue
        selector = tinycss2.serialize(rule.prelude).strip()
        if not _THEME_RE.fullmatch(selector):
            continue
        start = css.find("{", _offset(css, rule.source_line, rule.source_column)) + 1
        end = css.find("}", start)
        if start and end >= start:
            blocks.append((selector, start, end))
    return blocks


def load_root_tokens(css: str, selector: str = ":root") -> dict[str, str]:
    tokens = {}
    for name, start, end in _theme_blocks(css):
        if name != selector:
            continue
        for declaration in tinycss2.parse_declaration_list(css[start:end], skip_comments=True, skip_whitespace=True):
            if declaration.type == "declaration" and declaration.name.startswith("--"):
                tokens[declaration.name] = tinycss2.serialize(declaration.value).strip()
    return tokens


def resolve_color(value: str | None, tokens: dict[str, str], _depth: int = 0) -> Color | None:
    if value is None or _depth > 8:
        return None
    value = value.strip()
    match = _VAR_RE.fullmatch(value)
    if match:
        resolved = tokens.get(match.group(1), match.group(2))
        return resolve_color(resolved, tokens, _depth + 1)
    return parse_color(value)


def effective_surface(token_name: str, tokens: dict[str, str]) -> Color | None:
    surface = resolve_color(tokens.get(token_name), tokens)
    if surface and surface.a < 1:
        background = resolve_color(tokens.get("--bg"), tokens)
        if not background or background.a < 1:
            return None
        return composite_over(surface, background)
    return surface


def _governing_surfaces(tokens: dict[str, str]) -> list[tuple[str, Color]]:
    return [(name, color) for name in config.SURFACE_TOKENS
            if (color := effective_surface(name, tokens)) is not None]


def _text_contrast(foreground: Color, background: Color) -> float:
    return contrast_ratio(composite_over(foreground, background), background)


def _rewrite_token(css: str, token: str, new_hex: str, selector: str = ":root") -> str:
    blocks = [block for block in _theme_blocks(css) if block[0] == selector]
    if not blocks:
        return css
    # CSS cascade uses the last declaration, including repeated theme blocks.
    for _, start, end in reversed(blocks):
        body = css[start:end]
        declarations = [item for item in tinycss2.parse_declaration_list(body, skip_comments=True, skip_whitespace=True)
                        if item.type == "declaration" and item.name == token]
        if declarations:
            declaration = declarations[-1]
            offset = _offset(body, declaration.source_line, declaration.source_column)
            value_start = body.find(":", offset) + 1
            value_end = body.find(";", value_start)
            if value_end == -1:
                value_end = len(body)
            replacement = " " + new_hex + (" !important" if declaration.important else "")
            return css[:start + value_start] + replacement + css[start + value_end:]
    # An inherited token needs a local override; altering :root would break the
    # other theme. Keep the rest of the theme's source untouched.
    _, _, end = blocks[-1]
    return css[:end] + f"  {token}: {new_hex};\n" + css[end:]


def _repair(foreground: Color, surfaces: list[tuple[str, Color]], required: float) -> Color | None:
    candidates = [adjust_to_contrast(foreground, color, required) for _, color in surfaces]
    candidates.extend([Color(0, 0, 0), Color(255, 255, 255)])
    passing = [candidate for candidate in candidates
               if all(_text_contrast(candidate, color) >= required for _, color in surfaces)]
    return min(passing, key=lambda color: sum((a - b) ** 2 for a, b in zip(color.rgb, foreground.rgb))) if passing else None


def audit_tokens(css: str, tokens: dict[str, str], report: DoctorReport, apply: bool,
                 selector: str = ":root") -> str:
    surfaces = _governing_surfaces(tokens)
    if not surfaces:
        report.add(Finding("contrast", "error", f"No resolvable surfaces in {selector}", "styles.css"))
        return css
    pairs = [(token, role, surfaces) for token, role in config.INK_TOKENS.items()]
    # The accent button's text sits on --accent, not the page/card surfaces.
    accent = effective_surface("--accent", tokens)
    if accent and "--accent-ink" in tokens:
        pairs.append(("--accent-ink", "primary", [("--accent", accent)]))
    for token, role, backgrounds in pairs:
        if token not in tokens:
            continue
        foreground = resolve_color(tokens[token], tokens)
        location = f"styles.css {selector} {token}"
        if foreground is None:
            report.add(Finding("contrast", "warning", f"Could not resolve `{token}` for static contrast scoring", location))
            continue
        required = config.TOKEN_ROLE_MIN_RATIO[role]
        worst_name, worst_color = min(backgrounds, key=lambda pair: _text_contrast(foreground, pair[1]))
        ratio = _text_contrast(foreground, worst_color)
        if ratio >= required:
            report.add(Finding("contrast", "info", f"{token} OK ({ratio:.2f}:1 on {worst_name})", location))
            continue
        if apply and role in config.AUTOFIX_ROLES:
            repaired = _repair(foreground, backgrounds, required)
            if repaired:
                updated = _rewrite_token(css, token, repaired.to_hex(), selector)
                if updated != css:
                    css = updated
                    tokens[token] = repaired.to_hex()
                    report.record_fix(f"Contrast: {selector} `{token}` {foreground.to_hex()} -> {repaired.to_hex()} (all surfaces >= {required}:1)")
                    # The accent may have been repaired before its foreground.
                    if token == "--accent":
                        for pair in pairs:
                            if pair[0] == "--accent-ink":
                                pair[2][:] = [("--accent", repaired)]
                    continue
        report.add(Finding("contrast", "error", f"{token} below WCAG AA", location,
                           detail=f"{ratio:.2f}:1 on {worst_name}; needs {required}:1 on every surface.",
                           auto_fixable=role in config.AUTOFIX_ROLES))
    return css


def audit_explicit_pairs(css: str, tokens: dict[str, str], report: DoctorReport, theme: str = ":root") -> None:
    for rule in tinycss2.parse_stylesheet(css, skip_whitespace=True, skip_comments=True):
        if rule.type != "qualified-rule":
            continue
        selector = tinycss2.serialize(rule.prelude).strip()
        values = {}
        for declaration in tinycss2.parse_declaration_list(rule.content, skip_whitespace=True, skip_comments=True):
            if declaration.type == "declaration":
                values[declaration.lower_name] = tinycss2.serialize(declaration.value).strip()
        foreground = resolve_color(values.get("color"), tokens)
        background = resolve_color(values.get("background-color", values.get("background")), tokens)
        if foreground is None or background is None:
            continue
        if background.a < 1:
            base = resolve_color(tokens.get("--bg"), tokens)
            if not base:
                continue
            background = composite_over(background, base)
        ratio = _text_contrast(foreground, background)
        if ratio < config.AA_NORMAL_RATIO:
            report.add(Finding("contrast", "error" if ratio < config.AA_LARGE_RATIO else "warning",
                               f"Pair `{selector}` has {ratio:.2f}:1 contrast ({theme})",
                               f"styles.css {selector}", detail="Normal text needs 4.5:1. Verify rendered size in the browser audit."))


def run(report: DoctorReport, apply: bool = True) -> None:
    report.passes_run.append("contrast")
    for path in config.THEME_CSS_FILES:
        path = Path(path)
        if not path.is_file():
            report.add(Finding("contrast", "error", "Theme stylesheet is missing", str(path)))
            continue
        original = css = path.read_text(encoding="utf-8")
        selectors = list(dict.fromkeys(name for name, _, _ in _theme_blocks(css)))
        if ":root" not in selectors:
            report.add(Finding("contrast", "error", "Theme has no :root token declarations", str(path)))
            continue
        selectors.remove(":root")
        selectors.insert(0, ":root")
        for selector in selectors:
            tokens = {**load_root_tokens(css), **load_root_tokens(css, selector)}
            css = audit_tokens(css, tokens, report, apply, selector)
            audit_explicit_pairs(css, tokens, report, selector)
        if apply and css != original:
            path.write_text(css, encoding="utf-8")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    arguments = parser.parse_args()
    result = DoctorReport()
    run(result, apply=not arguments.check)
    print(result.to_markdown())
    raise SystemExit(1 if result.has_blocking else 0)
