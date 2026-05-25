#!/bin/bash

# verify-iwish-migration.sh
# Verifies that no legacy BMAD/DragonBall references exist in the I-Wish codebase.

set -e

echo "Running I-Wish Migration Verification..."

# Define directories to search
SEARCH_DIRS="src _iwish .agent docs package.json README.md scripts"

# Search for prohibited terms
# Exclude the verify script itself and the fallback manifest from the check
echo "Scanning for legacy terms: 'bmad', 'BMAD', 'DragonBall', '_bmad', 'bmad-'"
MATCHES=$(grep -rli "bmad\|BMAD\|DragonBall\|_bmad\|bmad-" \
  --include="*.ts" --include="*.md" --include="*.yaml" \
  --include="*.json" --include="*.js" \
  --exclude="verify-iwish-migration.sh" \
  --exclude="fallback-manifest.yaml" \
  --exclude="iwish_repo_analysis.md" \
  --exclude="implementation_plan.md" \
  $SEARCH_DIRS 2>/dev/null || true)

if [ -n "$MATCHES" ]; then
    echo ""
    echo "❌ ERROR: Residual legacy references found in the following files:"
    echo "$MATCHES"
    echo ""
    echo "Please update these files to use I-Wish terminology and re-run."
    exit 1
else
    echo "✅ SUCCESS: No residual legacy references found!"
fi

echo "Verifying structural paths..."
if [ -d "_bmad" ] || [ -d "_bmad-output" ]; then
    echo "❌ ERROR: Legacy directories (_bmad or _bmad-output) still exist."
    exit 1
fi

echo "✅ SUCCESS: Structural paths look clean!"
echo "Migration verification passed."
exit 0
