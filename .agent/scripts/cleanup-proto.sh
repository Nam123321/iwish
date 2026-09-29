#!/bin/bash

# BMAD Prototype Cleanup Script
# Purpose: Backup prototype as a patch and delete the branch safely.

PROTO_DIR="_iwish-output/prototypes"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [[ ! "$CURRENT_BRANCH" =~ ^proto/ ]]; then
  echo "❌ Error: Not on a prototype branch (must start with proto/)."
  exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PATCH_NAME="${CURRENT_BRANCH/\//_}_${TIMESTAMP}.patch"

mkdir -p "$PROTO_DIR"
echo "💾 Creating patch backup: $PATCH_NAME..."
git diff main > "${PROTO_DIR}/${PATCH_NAME}"

if [ $? -eq 0 ]; then
  echo "✅ Patch saved to ${PROTO_DIR}/${PATCH_NAME}"
  git checkout main
  echo "🗑️ Deleting branch $CURRENT_BRANCH..."
  git branch -D "$CURRENT_BRANCH"
  echo "🏁 Cleanup complete."
else
  echo "❌ Error creating patch. Cleanup aborted."
  exit 1
fi
