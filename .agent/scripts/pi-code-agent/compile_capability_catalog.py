#!/usr/bin/env python3
"""Compile the project-local, hash-pinned Pi capability catalog."""
from core import main

if __name__ == "__main__":
    raise SystemExit(main(["catalog", *__import__("sys").argv[1:]]))
