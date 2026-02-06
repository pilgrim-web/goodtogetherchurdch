#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path


def html_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for path in root.rglob("*.html"):
        rel = path.relative_to(root)
        if rel.parts and rel.parts[0] in {".git", "admin"}:
            continue
        files.append(path)
    return files


def depth_prefix(relative_path: Path) -> str:
    depth = max(0, len(relative_path.parts) - 1)
    return "../" * depth


def normalize_content(content: str, prefix: str) -> str:
    output = content

    output = re.sub(
        r'href="(?!https?://)[^"]*css/main\.css"',
        f'href="{prefix}css/main.css"',
        output,
    )

    output = re.sub(
        r'src="(?!https?://)[^"]*assets/js/([a-zA-Z0-9_.-]+\.js)"',
        lambda m: f'src="{prefix}assets/js/{m.group(1)}"',
        output,
    )

    output = re.sub(
        r'src="(?!https?://)[^"]*assets/img/([^"]+)"',
        lambda m: f'src="{prefix}assets/img/{m.group(1)}"',
        output,
    )

    return output


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    changed = 0
    scanned = 0

    for file_path in html_files(root):
        scanned += 1
        rel = file_path.relative_to(root)
        prefix = depth_prefix(rel)
        before = file_path.read_text(encoding="utf-8", errors="ignore")
        after = normalize_content(before, prefix)
        if after != before:
            file_path.write_text(after, encoding="utf-8")
            changed += 1

    print(f"Normalized HTML asset paths: changed={changed} scanned={scanned}")


if __name__ == "__main__":
    main()

