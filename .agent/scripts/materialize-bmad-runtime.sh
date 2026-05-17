#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=.agent/scripts/bmad-runtime-lib.sh
source ".agent/scripts/bmad-runtime-lib.sh"

APPLY=0
FORCE=0
NAMESPACE="iwish"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply)
      APPLY=1
      shift
      ;;
    --dry-run)
      APPLY=0
      shift
      ;;
    --force)
      FORCE=1
      shift
      ;;
    --namespace)
      NAMESPACE="${2:-}"
      shift 2
      ;;
    --help|-h)
      cat <<'EOF'
Usage: ./.agent/scripts/materialize-bmad-runtime.sh [--dry-run|--apply] [--force] [--namespace iwish|legacy-bmad]

Materializes I-Wish or legacy BMAD workflow runtime files.
Default is --dry-run. Existing files are never overwritten unless --force is supplied.
EOF
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 2
      ;;
  esac
done

write_file() {
  local dest="$1"
  local temp="$2"

  if [[ "$APPLY" -eq 0 ]]; then
    if [[ ! -f "$dest" ]]; then
      echo "DRY-RUN would-create: $dest"
    elif cmp -s "$dest" "$temp"; then
      echo "DRY-RUN identical: $dest"
    else
      if [[ "$FORCE" -eq 1 ]]; then
        echo "DRY-RUN conflict-would-overwrite: $dest"
      else
        echo "DRY-RUN conflict: $dest (use --force with --apply to overwrite)" >&2
        return 3
      fi
    fi
    return 0
  fi

  mkdir -p "$(dirname "$dest")"

  if [[ -f "$dest" ]]; then
    if cmp -s "$dest" "$temp"; then
      echo "SKIP identical: $dest"
      return 0
    fi

    if [[ "$FORCE" -ne 1 ]]; then
      echo "CONFLICT skipped: $dest (use --force to overwrite)" >&2
      return 3
    fi
  fi

  cp "$temp" "$dest"
  echo "WROTE: $dest"
}

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

failures=0

while IFS= read -r item; do
  IFS='|' read -r dest source_asset class materialization <<< "$item"
  if [[ ! -f "$source_asset" ]]; then
    echo "MISSING source asset: $source_asset" >&2
    failures=$((failures + 1))
    continue
  fi

  expected_tmp="$TMP_DIR/$(echo "$dest" | tr '/:' '__')"
  bmad_runtime_generate_expected "$dest" "$source_asset" "$materialization" "$expected_tmp" "$NAMESPACE"
  write_file "$dest" "$expected_tmp" || failures=$((failures + 1))
done < <(runtime_mappings_print "$NAMESPACE")

if [[ "$failures" -gt 0 ]]; then
  echo "Materialization completed with $failures issue(s)." >&2
  exit 1
fi

if [[ "$APPLY" -eq 1 ]]; then
  ./.agent/scripts/check-bmad-runtime.sh --mode project --namespace "$NAMESPACE"
else
  echo "Dry run complete. Re-run with --apply to write runtime files."
fi
