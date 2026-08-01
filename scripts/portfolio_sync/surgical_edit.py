"""Line-targeted writers for the hand-maintained CV data files.

The sync only ever owns one key per file: the generated-bullet list on the
target role. Round-tripping the whole document through a YAML/JSON dumper
would rewrite every unrelated line as a side effect (reflowed long strings,
collapsed blank-line grouping, expanded inline arrays), which buries the two
lines the bot actually changed inside a several-hundred-line diff and makes
the weekly pull request impossible to review.

These helpers splice the owned key in place and leave every other byte of the
file exactly as the human left it.
"""

from __future__ import annotations

import json
import re


class SurgicalEditError(RuntimeError):
    pass


def _indent_of(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def _is_blank(line: str) -> bool:
    return not line.strip()


def _join(original: str, lines: list[str]) -> str:
    """Rejoin without changing whether the file ended with a newline."""
    text = "\n".join(lines)
    return text + "\n" if original.endswith("\n") else text


# ── YAML ────────────────────────────────────────────────────────────────────

def _yaml_scalar(value: str) -> str:
    """Always double-quote, so bullets containing ': ', '#' or a leading '-'
    can never change the document shape."""
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def _render_yaml_block(key: str, values: list[str], indent: int) -> list[str]:
    pad = " " * indent
    if not values:
        return [f"{pad}{key}: []"]
    item_pad = " " * (indent + 2)
    return [f"{pad}{key}:", *[f"{item_pad}- {_yaml_scalar(value)}" for value in values]]


def _yaml_sequence_spans(lines: list[str], section: str) -> list[tuple[int, int]]:
    """Return (start, end) line spans for each entry of a top-level sequence.

    Only dashes at the sequence's own indentation open a new entry; deeper
    dashes belong to a nested list (a role's `bullets:`, say) and must stay
    inside the entry that owns them.
    """
    try:
        section_start = next(
            index for index, line in enumerate(lines) if line.rstrip() == f"{section}:"
        )
    except StopIteration as error:
        raise SurgicalEditError(f"Could not find '{section}:' block") from error

    starts: list[int] = []
    entry_indent: int | None = None
    section_end = len(lines)
    for index in range(section_start + 1, len(lines)):
        line = lines[index]
        if _is_blank(line):
            continue
        indent = _indent_of(line)
        if indent == 0:
            section_end = index
            break
        if not line.lstrip(" ").startswith("- "):
            continue
        if entry_indent is None:
            entry_indent = indent
        if indent == entry_indent:
            starts.append(index)

    spans: list[tuple[int, int]] = []
    for position, start in enumerate(starts):
        end = starts[position + 1] if position + 1 < len(starts) else section_end
        while end > start and _is_blank(lines[end - 1]):
            end -= 1
        spans.append((start, end))
    return spans


def _yaml_entry_field(lines: list[str], span: tuple[int, int], field: str) -> str | None:
    """Read a top-level field of a sequence entry, ignoring nested mappings."""
    start, end = span
    key_indent = _indent_of(lines[start]) + 2
    pattern = re.compile(rf"^(\s*)(?:-\s+)?{re.escape(field)}:\s*(.*)$")
    for index in range(start, end):
        match = pattern.match(lines[index])
        if not match:
            continue
        dash = lines[index].lstrip(" ").startswith("- ")
        indent = len(match.group(1)) + (2 if dash else 0)
        if indent != key_indent:
            continue
        return match.group(2).strip().strip("\"'")
    return None


def set_yaml_generated_bullets(
    text: str,
    *,
    section: str,
    match_fields: dict[str, str],
    key: str,
    values: list[str],
) -> str:
    lines = text.splitlines()
    target: tuple[int, int] | None = None
    for span in _yaml_sequence_spans(lines, section):
        if all(_yaml_entry_field(lines, span, field) == expected for field, expected in match_fields.items()):
            target = span
            break
    if target is None:
        raise SurgicalEditError(f"Target role {match_fields} not found in '{section}:' block")

    start, end = target
    key_indent = _indent_of(lines[start]) + 2
    key_pattern = re.compile(rf"^ {{{key_indent}}}{re.escape(key)}:\s*(.*)$")
    key_index: int | None = None
    for index in range(start, end):
        if key_pattern.match(lines[index]):
            key_index = index
            break

    if key_index is None:
        # Key absent: append it at the end of the role block, at the same
        # indentation as the entry's other keys.
        block = _render_yaml_block(key, values, key_indent)
        return _join(text, [*lines[:end], *block, *lines[end:]])

    block_end = key_index + 1
    while block_end < end and (_is_blank(lines[block_end]) or _indent_of(lines[block_end]) > key_indent):
        if _is_blank(lines[block_end]):
            break
        block_end += 1

    block = _render_yaml_block(key, values, key_indent)
    return _join(text, [*lines[:key_index], *block, *lines[block_end:]])


# ── JSON ────────────────────────────────────────────────────────────────────

def _render_json_block(key: str, values: list[str], indent: int, trailing_comma: bool) -> list[str]:
    pad = " " * indent
    suffix = "," if trailing_comma else ""
    if not values:
        return [f'{pad}"{key}": []{suffix}']
    item_pad = " " * (indent + 2)
    body = [f"{item_pad}{json.dumps(value, ensure_ascii=True)}," for value in values]
    body[-1] = body[-1].rstrip(",")
    return [f'{pad}"{key}": [', *body, f"{pad}]{suffix}"]


def _json_object_spans(lines: list[str], section: str) -> list[tuple[int, int]]:
    try:
        section_start = next(
            index for index, line in enumerate(lines) if line.strip().startswith(f'"{section}": [')
        )
    except StopIteration as error:
        raise SurgicalEditError(f'Could not find \'"{section}": [\' block') from error

    section_indent = _indent_of(lines[section_start])
    object_indent = section_indent + 2
    spans: list[tuple[int, int]] = []
    start: int | None = None
    for index in range(section_start + 1, len(lines)):
        line = lines[index]
        stripped = line.strip()
        indent = _indent_of(line)
        if indent == section_indent and stripped.startswith("]"):
            break
        if indent == object_indent and stripped == "{":
            start = index
        elif indent == object_indent and stripped.startswith("}") and start is not None:
            spans.append((start, index + 1))
            start = None
    return spans


def _json_entry_field(lines: list[str], span: tuple[int, int], field: str) -> str | None:
    start, end = span
    pattern = re.compile(rf'^\s*"{re.escape(field)}":\s*(.*?),?\s*$')
    for index in range(start, end):
        match = pattern.match(lines[index])
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                return None
    return None


def set_json_generated_bullets(
    text: str,
    *,
    section: str,
    match_fields: dict[str, str],
    key: str,
    values: list[str],
) -> str:
    lines = text.splitlines()
    target: tuple[int, int] | None = None
    for span in _json_object_spans(lines, section):
        if all(_json_entry_field(lines, span, field) == expected for field, expected in match_fields.items()):
            target = span
            break
    if target is None:
        raise SurgicalEditError(f'Target role {match_fields} not found in "{section}" array')

    start, end = target
    key_pattern = re.compile(rf'^(\s*)"{re.escape(key)}":\s*(.*)$')
    key_index: int | None = None
    key_indent = 0
    remainder = ""
    for index in range(start, end):
        match = key_pattern.match(lines[index])
        if match:
            key_index = index
            key_indent = len(match.group(1))
            remainder = match.group(2)
            break

    if key_index is None:
        # Key absent: append it as the last member of the object, which means
        # the previous last member now needs a trailing comma.
        last_member = end - 2
        if not lines[last_member].rstrip().endswith(","):
            lines[last_member] = lines[last_member].rstrip() + ","
        key_indent = _indent_of(lines[last_member])
        block = _render_json_block(key, values, key_indent, trailing_comma=False)
        return _join(text, [*lines[: end - 1], *block, *lines[end - 1 :]])

    if remainder.startswith("["):
        if "]" in remainder:
            block_end = key_index + 1
        else:
            block_end = key_index + 1
            while block_end < end and not (
                _indent_of(lines[block_end]) == key_indent and lines[block_end].strip().startswith("]")
            ):
                block_end += 1
            block_end += 1
    else:
        raise SurgicalEditError(f'Unexpected value shape for "{key}"')

    trailing_comma = lines[block_end - 1].rstrip().endswith(",")
    block = _render_json_block(key, values, key_indent, trailing_comma=trailing_comma)
    return _join(text, [*lines[:key_index], *block, *lines[block_end:]])
