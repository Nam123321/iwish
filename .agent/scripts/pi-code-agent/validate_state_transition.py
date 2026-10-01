#!/usr/bin/env python3
"""Validate task state transitions and acceptance evidence."""
from core import main

if __name__ == "__main__":
    raise SystemExit(main(["validate-transition", *__import__("sys").argv[1:]]))
