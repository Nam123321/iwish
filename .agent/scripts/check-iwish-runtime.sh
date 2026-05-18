#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=.agent/scripts/iwish-runtime-lib.sh
source ".agent/scripts/iwish-runtime-lib.sh"

MODE="source"
NAMESPACE="iwish"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      MODE="${2:-}"
      shift 2
      ;;
    --namespace)
      NAMESPACE="${2:-}"
      shift 2
      ;;
    --help|-h)
      cat <<'EOF'
Usage: ./.agent/scripts/check-iwish-runtime.sh [--mode source|project] [--namespace iwish|legacy-iwish]

Reports I-Wish/I-Wish workflow runtime health:
  materialized  destination exists under the selected runtime root
  template-only destination missing, source asset exists
  missing       destination and source are both missing
  conflict      destination exists but differs from generated runtime output

Project mode exits non-zero when any required runtime file is not materialized exactly.
EOF
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 2
      ;;
  esac
done

if [[ "$MODE" != "source" && "$MODE" != "project" ]]; then
  echo "Invalid mode: $MODE. Expected source or project." >&2
  exit 2
fi

printf "I-Wish workflow runtime health (mode=%s, namespace=%s)\n" "$MODE" "$NAMESPACE"
printf "%-16s %-70s %s\n" "status" "runtime" "source"

failures=0
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

while IFS= read -r mapping; do
  IFS='|' read -r runtime source class materialization <<< "$mapping"
  expected_tmp="$TMP_DIR/$(echo "$runtime" | tr '/:' '__')"
  status="$(iwish_runtime_status "$runtime" "$source" "$materialization" "$expected_tmp" "$NAMESPACE")"

  printf "%-16s %-70s %s (%s)\n" "$status" "$runtime" "$source" "$class"

  if [[ "$MODE" == "project" && "$status" != "materialized" ]]; then
    failures=$((failures + 1))
  elif [[ "$status" == "missing" || "$status" == "conflict" ]]; then
    failures=$((failures + 1))
  fi
done < <(runtime_mappings_print "$NAMESPACE")

if [[ "$failures" -gt 0 ]]; then
  if [[ "$MODE" == "project" ]]; then
    echo "Runtime check failed: project mode requires all runtime files to be materialized." >&2
  else
    echo "Runtime check failed: one or more source assets are missing." >&2
  fi
  exit 1
fi

echo "Runtime check passed."
