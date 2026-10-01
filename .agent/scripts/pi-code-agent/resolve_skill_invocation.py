#!/usr/bin/env python3
"""Resolve a skill only through the current catalog and authorization route."""
from core import main

if __name__ == "__main__":
    raise SystemExit(main(["resolve-skill", *__import__("sys").argv[1:]]))
