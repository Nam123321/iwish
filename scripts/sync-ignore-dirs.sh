#!/bin/bash
# sync-ignore-dirs.sh — Extract directory patterns from .gitignore → generate IGNORE_DIRS string
# Used by CodeGraphContext workflows to keep IGNORE_DIRS in sync with .gitignore
#
# KEY LEARNING: .gitignore is the single source of truth for artifact dirs.
# This script extracts simple dir patterns (e.g. "node_modules/", ".next/")
# and generates a comma-separated IGNORE_DIRS string.
#
# Usage:
#   ./scripts/sync-ignore-dirs.sh                    # Output IGNORE_DIRS string
#   ./scripts/sync-ignore-dirs.sh --check            # Compare vs mcp.json, report gaps
#   ./scripts/sync-ignore-dirs.sh --update-mcp       # Auto-update mcp.json IGNORE_DIRS
#
# Safety: Only matches simple "dirname/" patterns. Skips globs, negations, nested paths.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GITIGNORE="$PROJECT_ROOT/.gitignore"
MCP_JSON="$PROJECT_ROOT/mcp.json"
ENV_FILE="$PROJECT_ROOT/.env"

# --- Core dirs that MUST always be in IGNORE_DIRS (even if not in .gitignore) ---
CORE_DIRS="node_modules,venv,.venv,env,.env,.git,.idea,.vscode,__pycache__"

# --- Extract simple directory patterns from .gitignore ---
extract_gitignore_dirs() {
  if [ ! -f "$GITIGNORE" ]; then
    echo ""
    return
  fi
  # Match lines that are simple dir names ending with /
  # Skip: comments (#), negations (!), globs (*), nested paths (containing /)
  # ONLY match lines ending with / — these are guaranteed directory patterns
  grep -E '^\.?[a-zA-Z][a-zA-Z0-9._-]*/\s*$' "$GITIGNORE" \
    | grep -v '^#' \
    | grep -v '^!' \
    | grep -v '\*' \
    | sed 's|/[[:space:]]*$||' \
    | sort -u \
    | tr '\n' ',' \
    | sed 's/,$//'
}

# --- Build full IGNORE_DIRS from core + gitignore ---
build_ignore_dirs() {
  local gitignore_dirs
  gitignore_dirs=$(extract_gitignore_dirs)
  
  # Merge core + gitignore, deduplicate
  local all_dirs="$CORE_DIRS"
  if [ -n "$gitignore_dirs" ]; then
    all_dirs="$all_dirs,$gitignore_dirs"
  fi
  
  # Deduplicate
  echo "$all_dirs" | tr ',' '\n' | sort -u | tr '\n' ',' | sed 's/,$//'
}

# --- Get current IGNORE_DIRS from mcp.json ---
get_mcp_ignore_dirs() {
  if [ ! -f "$MCP_JSON" ]; then
    echo ""
    return
  fi
  grep '"IGNORE_DIRS"' "$MCP_JSON" | sed 's/.*"IGNORE_DIRS": *"//; s/".*//' | tr ',' '\n' | sort -u | tr '\n' ',' | sed 's/,$//'
}

# --- Check mode: compare gitignore vs mcp.json ---
check_gaps() {
  local should_have
  should_have=$(build_ignore_dirs)
  local currently_has
  currently_has=$(get_mcp_ignore_dirs)
  
  # Find dirs in should_have but not in currently_has
  local missing=""
  IFS=',' read -ra SHOULD <<< "$should_have"
  IFS=',' read -ra HAS <<< "$currently_has"
  
  for dir in "${SHOULD[@]}"; do
    local found=false
    for has_dir in "${HAS[@]}"; do
      if [ "$dir" = "$has_dir" ]; then
        found=true
        break
      fi
    done
    if [ "$found" = false ]; then
      if [ -n "$missing" ]; then
        missing="$missing,$dir"
      else
        missing="$dir"
      fi
    fi
  done
  
  if [ -n "$missing" ]; then
    echo "⚠️  IGNORE_DIRS MISMATCH — Missing dirs in mcp.json:"
    echo "   $missing"
    echo ""
    echo "   Run: ./scripts/sync-ignore-dirs.sh --update-mcp"
    return 1
  else
    echo "✅ IGNORE_DIRS is in sync with .gitignore"
    return 0
  fi
}

# --- Update mcp.json IGNORE_DIRS ---
update_mcp() {
  local new_dirs
  new_dirs=$(build_ignore_dirs)
  
  if [ ! -f "$MCP_JSON" ]; then
    echo "❌ mcp.json not found at $MCP_JSON"
    return 1
  fi
  
  # Use sed to replace IGNORE_DIRS value in mcp.json
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|\"IGNORE_DIRS\": \"[^\"]*\"|\"IGNORE_DIRS\": \"$new_dirs\"|" "$MCP_JSON"
  else
    sed -i "s|\"IGNORE_DIRS\": \"[^\"]*\"|\"IGNORE_DIRS\": \"$new_dirs\"|" "$MCP_JSON"
  fi
  
  # Also update .env if present
  if [ -f "$ENV_FILE" ]; then
    if grep -q "^IGNORE_DIRS=" "$ENV_FILE"; then
      if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^IGNORE_DIRS=.*|IGNORE_DIRS=$new_dirs|" "$ENV_FILE"
      else
        sed -i "s|^IGNORE_DIRS=.*|IGNORE_DIRS=$new_dirs|" "$ENV_FILE"
      fi
      echo "✅ Updated .env IGNORE_DIRS"
    fi
  fi
  
  echo "✅ Updated mcp.json IGNORE_DIRS to:"
  echo "   $new_dirs"
}

# --- Main ---
case "${1:-}" in
  --check)
    check_gaps
    ;;
  --update-mcp)
    update_mcp
    ;;
  *)
    build_ignore_dirs
    ;;
esac
