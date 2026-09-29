#!/bin/bash
# navigator-guardian.sh
# Auto-syncs the Idea Navigator dashboard and prevents Python errors from crashing the main workflow.

echo "========================================"
echo "🛡️  Navigator Guardian: Initiating Sync"
echo "========================================"

# Resolve the absolute path to the project root assuming script is run from project root
PROJECT_ROOT=$(pwd)
SYNC_SCRIPT="$PROJECT_ROOT/_iwish-output/idea-navigator/scripts/sync-navigator.py"

if [ ! -f "$SYNC_SCRIPT" ]; then
  echo "⚠️ Navigator Guardian Warning: Sync script not found at $SYNC_SCRIPT"
  echo "⚠️ Skipping sync. The workflow will continue."
  echo "========================================"
  exit 0
fi

# Run the python sync script and capture exit code
python3 "$SYNC_SCRIPT"
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "⚠️ Navigator Guardian Warning: Sync encountered an error (Exit Code: $EXIT_CODE)."
  echo "⚠️ The workflow will continue, but idea-navigator.html might not be up-to-date."
  echo "⚠️ Please check for missing references or syntax errors in the markdown files."
else
  echo "✅ Navigator Guardian: Sync completed successfully."
fi

echo "========================================"
# Always exit 0 to prevent breaking the parent workflow
exit 0
