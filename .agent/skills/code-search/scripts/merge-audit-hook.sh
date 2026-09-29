#!/usr/bin/env bash
# ==============================================================================
# merge-audit-hook.sh — Pre-Merge Semantic Audit Hook
# ==============================================================================
# Part of: I-Wish / code-search skill (Story 2.2)
#
# Entry point for the semantic merge audit. Designed to be called as a
# pre-merge hook or manually before landing a branch.
#
# Usage:
#   bash merge-audit-hook.sh --branch story-1.1 --target main --project /path/to/project
#   bash merge-audit-hook.sh -b feature-auth -t develop -p .
#
# Exit codes:
#   0 — SAFE (or audit skipped gracefully)
#   1 — UNSAFE (stale references detected)
#   2 — UNKNOWN (audit could not complete)
# ==============================================================================

set -euo pipefail

# ── Constants ─────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MERGE_AUDIT_PY="${SCRIPT_DIR}/merge-audit.py"

# ── Color codes (stderr only) ─────────────────────────────────────────────────

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[merge-audit]${NC} $*" >&2; }
log_warn()  { echo -e "${YELLOW}[merge-audit]${NC} ⚠️  $*" >&2; }
log_error() { echo -e "${RED}[merge-audit]${NC} ❌ $*" >&2; }
log_step()  { echo -e "${BLUE}[merge-audit]${NC} → $*" >&2; }

# ── Defaults ──────────────────────────────────────────────────────────────────

BRANCH=""
TARGET="main"
PROJECT="."

# ── Argument parsing ─────────────────────────────────────────────────────────

usage() {
    cat >&2 <<EOF
Usage: $(basename "$0") --branch <branch-name> --target <target-branch> --project <root>

Pre-merge semantic audit hook that detects stale symbol references.

Options:
  --branch, -b    Branch being merged (required)
  --target, -t    Target branch to merge into (default: main)
  --project, -p   Project root directory (default: .)
  --help, -h      Show this help

Examples:
  $(basename "$0") --branch story-1.1 --target main --project /path/to/project
  $(basename "$0") -b feature-auth -t develop -p .
EOF
    exit 0
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --branch|-b)
                BRANCH="$2"
                shift 2
                ;;
            --target|-t)
                TARGET="$2"
                shift 2
                ;;
            --project|-p)
                PROJECT="$2"
                shift 2
                ;;
            --help|-h)
                usage
                ;;
            *)
                log_error "Unknown argument: $1"
                usage
                ;;
        esac
    done

    if [[ -z "$BRANCH" ]]; then
        log_error "Missing required argument: --branch"
        usage
    fi

    # Resolve project path
    PROJECT="$(cd "$PROJECT" 2>/dev/null && pwd)" || {
        log_error "Project directory not found: $PROJECT"
        exit 2
    }
}

# ── Prerequisite checks ──────────────────────────────────────────────────────

check_prerequisites() {
    # Check git
    if ! command -v git &>/dev/null; then
        log_error "git is not installed"
        exit 2
    fi

    # Check python3
    if ! command -v python3 &>/dev/null; then
        log_warn "python3 not available — audit skipped"
        echo "SKIP"
        exit 0
    fi

    # Check that the audit script exists
    if [[ ! -f "$MERGE_AUDIT_PY" ]]; then
        log_error "merge-audit.py not found at: $MERGE_AUDIT_PY"
        exit 2
    fi

    # Check that we're in a git repo
    if ! git -C "$PROJECT" rev-parse --git-dir &>/dev/null; then
        log_error "Not a git repository: $PROJECT"
        exit 2
    fi

    # Check that the branch exists
    if ! git -C "$PROJECT" rev-parse --verify "$BRANCH" &>/dev/null; then
        log_warn "Branch '$BRANCH' not found — audit skipped"
        echo "SKIP"
        exit 0
    fi

    # Check that the target exists
    if ! git -C "$PROJECT" rev-parse --verify "$TARGET" &>/dev/null; then
        log_warn "Target branch '$TARGET' not found — audit skipped"
        echo "SKIP"
        exit 0
    fi
}

# ── Main execution ───────────────────────────────────────────────────────────

main() {
    parse_args "$@"

    echo -e "${BOLD}╔══════════════════════════════════════════════════╗${NC}" >&2
    echo -e "${BOLD}║       Semantic Merge Audit Hook (Story 2.2)     ║${NC}" >&2
    echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}" >&2
    echo "" >&2

    log_step "Branch:  ${BRANCH}"
    log_step "Target:  ${TARGET}"
    log_step "Project: ${PROJECT}"
    echo "" >&2

    check_prerequisites

    log_step "Running semantic merge audit..."
    echo "" >&2

    # Run the Python audit script and capture output
    local audit_output
    local exit_code=0

    audit_output=$(python3 "$MERGE_AUDIT_PY" \
        --branch "$BRANCH" \
        --target "$TARGET" \
        --project "$PROJECT" \
        --format json \
        2>&2) || exit_code=$?

    if [[ $exit_code -ne 0 ]]; then
        log_error "Audit script exited with code $exit_code"
        echo "UNKNOWN"
        exit 2
    fi

    # Parse the verdict from JSON output
    local verdict
    verdict=$(echo "$audit_output" | python3 -c "import sys,json; print(json.load(sys.stdin).get('verdict','UNKNOWN'))" 2>/dev/null) || verdict="UNKNOWN"

    local summary
    summary=$(echo "$audit_output" | python3 -c "import sys,json; print(json.load(sys.stdin).get('summary',''))" 2>/dev/null) || summary=""

    local sym_count
    sym_count=$(echo "$audit_output" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('modified_symbols',[])))" 2>/dev/null) || sym_count="?"

    local cs_count
    cs_count=$(echo "$audit_output" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('call_sites',[])))" 2>/dev/null) || cs_count="?"

    local stale_count
    stale_count=$(echo "$audit_output" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('stale_references',[])))" 2>/dev/null) || stale_count="?"

    # Print summary
    echo "" >&2
    echo -e "${BOLD}── Audit Results ──────────────────────────────────${NC}" >&2
    echo -e "  Symbols found:     ${sym_count}" >&2
    echo -e "  Call-sites found:  ${cs_count}" >&2
    echo -e "  Stale references:  ${stale_count}" >&2
    echo "" >&2

    case "$verdict" in
        SAFE)
            echo -e "  ${GREEN}${BOLD}✅ VERDICT: SAFE${NC}" >&2
            echo -e "  ${summary}" >&2
            echo "" >&2
            # Output JSON to stdout
            echo "$audit_output"
            exit 0
            ;;
        UNSAFE)
            echo -e "  ${RED}${BOLD}❌ VERDICT: UNSAFE${NC}" >&2
            echo -e "  ${summary}" >&2
            echo "" >&2
            echo -e "  ${YELLOW}Stale references:${NC}" >&2
            echo "$audit_output" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for sr in data.get('stale_references', []):
    print(f\"    • {sr['symbol']} → {sr['file_path']} (branch: {sr['branch']})\")
    print(f\"      Reason: {sr['reason']}\")
" 2>/dev/null >&2 || true
            echo "" >&2
            # Output JSON to stdout
            echo "$audit_output"
            exit 1
            ;;
        *)
            echo -e "  ${YELLOW}${BOLD}⚠️  VERDICT: UNKNOWN${NC}" >&2
            echo -e "  ${summary}" >&2
            echo "" >&2
            echo "$audit_output"
            exit 2
            ;;
    esac
}

# ── Run ───────────────────────────────────────────────────────────────────────

main "$@"
