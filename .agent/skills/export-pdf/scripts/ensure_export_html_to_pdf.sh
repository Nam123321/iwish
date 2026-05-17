#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: bash .agent/skills/export-pdf/scripts/ensure_export_html_to_pdf.sh /absolute/input.html /absolute/output.pdf" >&2
  exit 1
fi

python3 "$(dirname "$0")/check_weasyprint.py" || {
  echo "WeasyPrint missing. Ask the user whether they want installation before continuing." >&2
  exit 2
}

python3 "$(dirname "$0")/export_html_to_pdf.py" "$1" "$2"
