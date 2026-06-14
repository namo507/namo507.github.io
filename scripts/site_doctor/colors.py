"""Exact, dependency-free colour science for the contrast auditor.

Implements the WCAG 2.1 relative-luminance and contrast-ratio formulae, CSS
colour parsing (hex / rgb / rgba), straight alpha compositing, and a
hue-preserving lightness search that nudges a failing text colour to the
minimal value that satisfies a target contrast ratio. Everything here is pure
Python and deterministic so it can be unit-tested and run identically in CI.
"""

from __future__ import annotations

import colorsys
import re
from dataclasses import dataclass

RGB = tuple[int, int, int]
RGBA = tuple[int, int, int, float]

_HEX_RE = re.compile(r"^#([0-9a-fA-F]{3,8})$")
_RGB_RE = re.compile(
    r"rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class Color:
    r: int
    g: int
    b: int
    a: float = 1.0

    @property
    def rgb(self) -> RGB:
        return (self.r, self.g, self.b)

    def to_hex(self) -> str:
        return f"#{self.r:02x}{self.g:02x}{self.b:02x}"


def parse_color(text: str) -> Color | None:
    """Parse a CSS colour literal. Returns ``None`` for non-literal values
    such as ``var(--x)`` or named colours, which the caller resolves itself."""
    if text is None:
        return None
    s = text.strip()
    m = _HEX_RE.match(s)
    if m:
        h = m.group(1)
        if len(h) == 3:
            r, g, b = (int(c * 2, 16) for c in h)
            return Color(r, g, b)
        if len(h) == 4:
            r, g, b, a = (int(c * 2, 16) for c in h)
            return Color(r, g, b, a / 255)
        if len(h) == 6:
            return Color(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))
        if len(h) == 8:
            return Color(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), int(h[6:8], 16) / 255)
        return None
    m = _RGB_RE.search(s)
    if m:
        r, g, b = (int(round(float(m.group(i)))) for i in (1, 2, 3))
        a = float(m.group(4)) if m.group(4) is not None else 1.0
        return Color(_clamp8(r), _clamp8(g), _clamp8(b), max(0.0, min(1.0, a)))
    return None


def _clamp8(v: int) -> int:
    return max(0, min(255, v))


def composite_over(src: Color, dst: Color) -> Color:
    """Straight 'source over' alpha compositing, assuming ``dst`` is opaque.

    Used to flatten a semi-transparent panel onto the page background so the
    effective surface colour behind text can be scored.
    """
    a = src.a
    r = round(src.r * a + dst.r * (1 - a))
    g = round(src.g * a + dst.g * (1 - a))
    b = round(src.b * a + dst.b * (1 - a))
    return Color(_clamp8(r), _clamp8(g), _clamp8(b), 1.0)


def _linearize(channel: float) -> float:
    c = channel / 255.0
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def relative_luminance(color: Color) -> float:
    """WCAG 2.1 relative luminance in [0, 1]."""
    r, g, b = (_linearize(c) for c in color.rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(c1: Color, c2: Color) -> float:
    """WCAG 2.1 contrast ratio in [1, 21]. Order independent."""
    l1, l2 = relative_luminance(c1), relative_luminance(c2)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def adjust_to_contrast(fg: Color, bg: Color, target: float, *, max_steps: int = 64) -> Color:
    """Return a colour with the same hue/saturation as ``fg`` whose contrast
    with ``bg`` meets ``target``. Lightness is moved in the direction that
    increases contrast (lighter on dark backgrounds, darker on light ones).

    If ``fg`` already meets the target it is returned unchanged, which keeps the
    auto-fix idempotent.
    """
    if contrast_ratio(fg, bg) >= target:
        return fg

    h, l, s = colorsys.rgb_to_hls(fg.r / 255, fg.g / 255, fg.b / 255)
    bg_lum = relative_luminance(bg)
    # On a dark surface we lighten the text (move L toward 1), else darken it.
    lo, hi = (l, 1.0) if bg_lum < 0.5 else (0.0, l)

    best = fg
    for _ in range(max_steps):
        mid = (lo + hi) / 2
        r, g, b = colorsys.hls_to_rgb(h, mid, s)
        cand = Color(_clamp8(round(r * 255)), _clamp8(round(g * 255)), _clamp8(round(b * 255)))
        if contrast_ratio(cand, bg) >= target:
            best = cand
            # Tighten toward the original lightness to stay minimal.
            if bg_lum < 0.5:
                hi = mid
            else:
                lo = mid
        else:
            if bg_lum < 0.5:
                lo = mid
            else:
                hi = mid
    # Guarantee the result actually clears the bar even at the search extreme.
    if contrast_ratio(best, bg) < target:
        extreme = "#ffffff" if bg_lum < 0.5 else "#000000"
        best = parse_color(extreme)  # type: ignore[assignment]
    return best
