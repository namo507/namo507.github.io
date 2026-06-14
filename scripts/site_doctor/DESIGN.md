# Site Doctor — system design

This is the design rationale behind the Site Doctor automation. The how-to-run
details live in `README.md`; this document covers the requirements, the
architecture, and the decisions and trade-offs behind them.

## 1. Requirements

Functional. Run daily and on demand. Clean OS/editor junk and normalize
whitespace in authored code. Validate every data file and front-matter block so a
malformed YAML never silently breaks the GitHub Pages build. Enforce WCAG AA
contrast on the cosmic theme tokens and fix failures automatically. Keep the
content tiles aligned to one corner-radius rhythm. Detect broken internal links
and missing assets in the built site. Run a real rendered-page accessibility and
tile-symmetry audit. Keep the sibling automation workflows healthy and recover
them when they fail. Apply safe fixes by committing them to `master`, and report
the rest.

Non-functional. The automation must be robust above all: one failing check can
never abort the run or block the fixes that did succeed. Fixes must be
deterministic and idempotent so a daily unattended commit cannot drift the site.
It must add no new secrets and stay within the free Actions tier. A full run
should finish in a couple of minutes.

Constraints. The site is Jekyll (Academic Pages theme) on GitHub Pages with a
custom React-based animated homepage in `assets/cosmic`. There is a single
maintainer, three existing auto-committing workflows, and no test or CI
infrastructure to build on. The toolkit had to fit this stack without disrupting
the theme or the existing bots.

## 2. High-level design

The work splits into a Python toolkit (`doctor.py` plus one module per pass) and
a Node visual auditor (`visual_audit.mjs`, Playwright + axe-core). A thin GitHub
Actions workflow sequences them: build the site, run the visual audit against the
built output, run the Python passes which apply fixes and ingest the visual
report into one unified result, commit and push, then reconcile a single rolling
issue.

```
 build _site ─► visual_audit.mjs ─► doctor.py (passes + ingest) ─► commit/push ─► issue upsert
```

Two design seams matter. First, the Python orchestrator and each pass share one
result model (`report.py`: `Finding` + `DoctorReport`), so adding a pass is just
appending findings; serialization, the Markdown issue body, and the GitHub Action
outputs come for free. Second, the visual auditor writes a plain JSON file that
the Python side ingests, which keeps the two runtimes decoupled and lets either
run independently.

## 3. Key decisions and deep dive

Exact colour math, no heavy dependency. Contrast is the core of the visual
check, so `colors.py` implements the WCAG formulae directly rather than pulling a
colour-science library. It is ~140 lines, has zero runtime dependencies, is
verified against the standard reference ratios, and is fully deterministic. The
auto-fix searches lightness in HLS space with hue and saturation pinned, so a
recolored token keeps its identity and only gets light enough to pass. Returning
the input unchanged when it already passes makes the whole pipeline idempotent,
which is what makes a daily auto-commit safe.

Composite before scoring. The panels are translucent (`rgba(14,16,24,0.92)`), so
text is scored against the panel flattened over `--bg`, not against the raw
token. Judging each token against the worst (lightest) surface it sits on means a
pass guarantees readability everywhere that token appears.

Surgical rewrites, not reserialization. Both CSS passes edit the single
declaration they are changing via a scoped, brace-bounded match instead of
parsing and re-emitting the stylesheet. Comments, formatting, and the rest of the
file survive, so the commit diff is exactly the change and nothing else.

Conservative auto-fix boundary. Caption tokens, hardcoded colour/background
pairs, broken links, and accessibility violations are reported, not auto-changed,
because the correct fix depends on intent. This is the line that lets unattended
commits go straight to `master` without eroding the design.

## 4. Reliability

Push races were the most likely real-world failure, since four workflows now
write to `master`. They are addressed twice over: a shared `repo-autocommit`
concurrency group serializes the workflows, and every push uses a
rebase-and-retry loop so a race that still occurs self-corrects instead of
failing. Each pass is sandboxed in its own try/except, and the build, visual, and
doctor steps are `continue-on-error`, so the job reaches the commit and issue
steps even when something upstream misbehaves. Sibling-workflow failures are
detected through the Actions API and re-dispatched automatically.

## 5. What I would revisit as it grows

If the maintainer ever wants review gates, the commit step becomes a
pull-request step with no change to the passes. If runtime becomes a concern, the
Playwright browser can be cached or the visual pass reduced to static checks. If
the theme CSS needs the same guarantees, the contrast pass generalizes to more
stylesheets at the cost of more tokens to reason about. And the single rolling
issue could become a small dashboard if the volume of findings ever justifies it.
