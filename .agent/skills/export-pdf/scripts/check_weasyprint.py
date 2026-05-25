#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import sys


def main() -> int:
    installed = importlib.util.find_spec("weasyprint") is not None
    if installed:
        print("[Check] WeasyPrint is installed.")
        return 0

    print(
        "[Check] WeasyPrint is not installed. Ask the user whether they want it installed, "
        "then run `python3 -m pip install weasyprint` if they approve.",
        file=sys.stderr,
    )
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
