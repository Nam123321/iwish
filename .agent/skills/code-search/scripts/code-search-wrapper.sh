#!/usr/bin/env bash
# ==============================================================================
# code-search-wrapper.sh — 3-Tier Fallback Wrapper for Semble Code Search
# ==============================================================================
# Part of: I-Wish / code-search skill (Story 1.1)
# Usage:
#   bash code-search-wrapper.sh search "<query>" <path> [--top-k N] [--content TYPE]
#   bash code-search-wrapper.sh find-related <file> <line> <path> [--top-k N]
#
# Fallback chain:
#   1. semble CLI (if installed)
#   2. uvx --from semble (if uvx available)
#   3. grep (basic lexical search with JSON output)
# ==============================================================================

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
TOP_K=5
CONTENT="code"
ENGINE="unknown"

# ── Color codes (stderr only) ─────────────────────────────────────────────────
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[code-search]${NC} $*" >&2; }
log_warn()  { echo -e "${YELLOW}[code-search]${NC} ⚠️  $*" >&2; }
log_error() { echo -e "${RED}[code-search]${NC} ❌ $*" >&2; }

# ── Detect available engine ───────────────────────────────────────────────────
detect_engine() {
  if command -v semble &>/dev/null; then
    ENGINE="semble"
    log_info "Using semble CLI (direct)"
  elif command -v uvx &>/dev/null; then
    ENGINE="uvx"
    log_info "semble not found, falling back to uvx"
  elif command -v python3 &>/dev/null; then
    # Try pip-installed semble via python3 -m
    if python3 -c "import semble" &>/dev/null; then
      ENGINE="python3"
      log_info "Using semble via python3 -m"
    else
      ENGINE="grep"
      log_warn "No semble runtime found. Using grep fallback (semantic search unavailable)"
    fi
  else
    ENGINE="grep"
    log_warn "No Python runtime found. Using grep fallback (semantic search unavailable)"
  fi
}

# ── Execute search via detected engine ────────────────────────────────────────
run_search() {
  local query="$1"
  local search_path="$2"

  case "$ENGINE" in
    semble)
      semble search "$query" "$search_path" --top-k "$TOP_K" --content "$CONTENT"
      ;;
    uvx)
      uvx --from semble semble search "$query" "$search_path" --top-k "$TOP_K" --content "$CONTENT"
      ;;
    python3)
      python3 -m semble search "$query" "$search_path" --top-k "$TOP_K" --content "$CONTENT"
      ;;
    grep)
      grep_fallback_search "$query" "$search_path"
      ;;
  esac
}

# ── Execute find-related via detected engine ──────────────────────────────────
run_find_related() {
  local file_path="$1"
  local line_num="$2"
  local search_path="$3"

  case "$ENGINE" in
    semble)
      semble find-related "$file_path" "$line_num" "$search_path" --top-k "$TOP_K"
      ;;
    uvx)
      uvx --from semble semble find-related "$file_path" "$line_num" "$search_path" --top-k "$TOP_K"
      ;;
    python3)
      python3 -m semble find-related "$file_path" "$line_num" "$search_path" --top-k "$TOP_K"
      ;;
    grep)
      grep_fallback_related "$file_path" "$line_num" "$search_path"
      ;;
  esac
}

# ── grep fallback: basic lexical search with JSON output ──────────────────────
grep_fallback_search() {
  local query="$1"
  local search_path="$2"

  log_warn "FALLBACK: Using grep for '$query' — results are lexical only, no semantic ranking"

  # Split query into words for multi-term grep
  local results=()
  local score=0.5
  local count=0

  while IFS=: read -r file line content; do
    if [[ $count -ge $TOP_K ]]; then
      break
    fi

    # Calculate a simple end_line (content chunk approximation)
    local end_line=$((line + 10))

    # Escape JSON special chars in content
    content=$(echo "$content" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g')

    results+=("{\"file_path\":\"$file\",\"start_line\":$line,\"end_line\":$end_line,\"content\":\"$content\",\"score\":$score}")
    count=$((count + 1))
    score=$(echo "$score - 0.05" | bc -l 2>/dev/null || echo "0.45")
  done < <(grep -rnI --include='*.py' --include='*.ts' --include='*.js' --include='*.tsx' --include='*.jsx' --include='*.go' --include='*.rs' --include='*.java' --include='*.rb' --include='*.sh' --include='*.md' -- "$query" "$search_path" 2>/dev/null | head -n "$((TOP_K * 3))")

  # Build JSON output
  local joined
  joined=$(IFS=,; echo "${results[*]:-}")

  echo "{\"query\":\"$(echo "$query" | sed 's/"/\\"/g')\",\"engine\":\"grep\",\"warning\":\"Semantic search unavailable. Results are lexical-only.\",\"results\":[${joined}]}"
}

# ── grep fallback: find-related (search for content at file:line) ─────────────
grep_fallback_related() {
  local file_path="$1"
  local line_num="$2"
  local search_path="$3"

  # Extract content around the target line to use as search query
  if [[ -f "$file_path" ]]; then
    local context
    context=$(sed -n "$((line_num > 2 ? line_num - 2 : 1)),$((line_num + 2))p" "$file_path" | tr '\n' ' ' | head -c 200)
    grep_fallback_search "$context" "$search_path"
  else
    log_error "File not found: $file_path"
    echo "{\"query\":\"find-related $file_path:$line_num\",\"engine\":\"grep\",\"error\":\"File not found\",\"results\":[]}"
  fi
}

# ── Parse arguments ───────────────────────────────────────────────────────────
parse_args() {
  if [[ $# -lt 2 ]]; then
    echo "Usage:" >&2
    echo "  $0 search \"<query>\" <path> [--top-k N] [--content TYPE]" >&2
    echo "  $0 find-related <file> <line> <path> [--top-k N]" >&2
    exit 1
  fi

  local command="$1"
  shift

  case "$command" in
    search)
      local query="$1"
      local search_path="${2:-.}"
      shift 2 || true

      # Parse optional flags
      while [[ $# -gt 0 ]]; do
        case "$1" in
          --top-k|-k) TOP_K="$2"; shift 2 ;;
          --content)  CONTENT="$2"; shift 2 ;;
          *) shift ;;
        esac
      done

      detect_engine
      run_search "$query" "$search_path"
      ;;

    find-related)
      local file_path="$1"
      local line_num="$2"
      local search_path="${3:-.}"
      shift 3 || true

      while [[ $# -gt 0 ]]; do
        case "$1" in
          --top-k|-k) TOP_K="$2"; shift 2 ;;
          *) shift ;;
        esac
      done

      detect_engine
      run_find_related "$file_path" "$line_num" "$search_path"
      ;;

    *)
      log_error "Unknown command: $command"
      echo "Commands: search, find-related" >&2
      exit 1
      ;;
  esac
}

# ── Main ──────────────────────────────────────────────────────────────────────
parse_args "$@"
