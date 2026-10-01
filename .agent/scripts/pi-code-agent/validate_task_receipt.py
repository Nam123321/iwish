#!/usr/bin/env python3
"""Validate a redacted execution receipt before state transition."""
from core import main

if __name__ == "__main__":
    raise SystemExit(main(["validate-receipt", *__import__("sys").argv[1:]]))
