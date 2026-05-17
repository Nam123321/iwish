#!/usr/bin/env python3

from __future__ import annotations

import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 3:
        print(
            "Usage: python3 .agent/skills/export-pdf/scripts/export_html_to_pdf.py "
            '"/absolute/input.html" "/absolute/output.pdf"',
            file=sys.stderr,
        )
        return 1

    input_path = Path(sys.argv[1]).expanduser().resolve()
    output_path = Path(sys.argv[2]).expanduser().resolve()

    if not input_path.exists():
        print(f"Input HTML not found: {input_path}", file=sys.stderr)
        return 1

    if input_path.suffix.lower() != ".html":
        print(f"Expected an .html input file, got: {input_path.name}", file=sys.stderr)
        return 1

    try:
        from weasyprint import HTML
    except Exception:
        print(
            "WeasyPrint is not installed in this Python environment. "
            "Install it first, then rerun this export.",
            file=sys.stderr,
        )
        return 2

    output_path.parent.mkdir(parents=True, exist_ok=True)

    HTML(filename=str(input_path), base_url=str(input_path.parent)).write_pdf(str(output_path))
    print(f"[Output] PDF exported to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
