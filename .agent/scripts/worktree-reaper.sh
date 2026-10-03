#!/bin/bash
# Wrapper for worktree-reaper.py to satisfy plan requirements
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
python3 "$DIR/worktree-reaper.py" "$@"
