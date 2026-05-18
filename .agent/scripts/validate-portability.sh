#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

SCAN_PATHS=(
  ".agent"
  "templates"
  "docs"
  "_iwish-output"
)

USER_HOME_PATTERN='/''Users/'
FILE_URL_PATTERN='file:///'"Users"
DESKTOP_WORKSPACE_PATTERN='Desktop/AI '"Project"
LEGACY_SANDBOX_PATTERN='~/.iwish-'"sandbox"
FORBIDDEN_REGEX="(${USER_HOME_PATTERN}|${FILE_URL_PATTERN}|${DESKTOP_WORKSPACE_PATTERN}|${LEGACY_SANDBOX_PATTERN})"

echo "Checking I-Wish public portability..."

existing_paths=()
for path in "${SCAN_PATHS[@]}"; do
  if [[ -e "$path" ]]; then
    existing_paths+=("$path")
  fi
done

if [[ ${#existing_paths[@]} -eq 0 ]]; then
  echo "No portability scan paths found."
  exit 0
fi

if rg -n --hidden --glob '!**/.DS_Store' --glob '!**/node_modules/**' --glob '!**/.git/**' "$FORBIDDEN_REGEX" "${existing_paths[@]}"; then
  echo
  echo "Portability check failed: replace user-specific paths with repo-relative paths, {project-root}, or \${IWISH_HOME}."
  exit 1
fi

echo "Portability check passed."
