// Pure tile-symmetry geometry analysis, separated from the Playwright harness
// so it can be unit-tested without a browser. Given a list of tile bounding
// boxes ({sel,x,y,w,h}) it groups them into visual rows and flags rows whose
// tile tops, heights, or inter-column gaps are not aligned within tolerance.

export function analyzeSymmetry(rects, tol = 4, gapTol = 6) {
  const issues = [];
  const rows = [];
  for (const r of rects.slice().sort((a, b) => a.y - b.y)) {
    const cy = r.y + r.h / 2;
    let row = rows.find((g) => Math.abs(g.cy - cy) < Math.max(r.h, 24) / 2);
    if (!row) { row = { cy, items: [] }; rows.push(row); }
    row.items.push(r);
    row.cy = row.items.reduce((s, it) => s + it.y + it.h / 2, 0) / row.items.length;
  }
  for (const [i, row] of rows.entries()) {
    if (row.items.length < 2) continue;
    const items = row.items.slice().sort((a, b) => a.x - b.x);
    const tops = items.map((it) => it.y);
    const heights = items.map((it) => it.h);
    const topSpread = Math.max(...tops) - Math.min(...tops);
    const heightSpread = Math.max(...heights) - Math.min(...heights);
    if (topSpread > tol) {
      issues.push({ kind: "row-top-misalign", row: i + 1, spread: topSpread,
        detail: `Row ${i + 1}: tile tops vary by ${topSpread}px (tolerance ${tol}px).` });
    }
    if (heightSpread > tol) {
      issues.push({ kind: "row-height-mismatch", row: i + 1, spread: heightSpread,
        detail: `Row ${i + 1}: tile heights vary by ${heightSpread}px (tolerance ${tol}px).` });
    }
    const gaps = [];
    for (let k = 1; k < items.length; k++) gaps.push(items[k].x - (items[k - 1].x + items[k - 1].w));
    if (gaps.length >= 2) {
      const gapSpread = Math.max(...gaps) - Math.min(...gaps);
      if (gapSpread > gapTol) {
        issues.push({ kind: "uneven-gaps", row: i + 1, spread: gapSpread,
          detail: `Row ${i + 1}: column gaps vary by ${gapSpread}px (${gaps.join(", ")}).` });
      }
    }
  }
  return issues;
}
