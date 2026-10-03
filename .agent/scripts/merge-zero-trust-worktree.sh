#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <path_to_worktree>"
  exit 1
fi

WORKTREE_PATH="$1"

if [ ! -d "$WORKTREE_PATH" ]; then
  echo "❌ Error: Worktree not found at $WORKTREE_PATH"
  exit 1
fi

echo "======================================================"
echo " ZERO-TRUST WORKTREE MERGE GATEWAY"
echo "======================================================"
echo "Checking worktree: $WORKTREE_PATH"

# 1. We must verify that the 7 Zero-Trust Evidence files exist inside the worktree
# Since the story path might be different, let's scan the worktree for the evidence files
# We expect them to be generated in the story's folder.

EVIDENCE_FILES=("pipeline-evidence-pre-code.json" "pipeline-evidence-post-code.json" "pipeline-evidence-review.json" "pipeline-evidence-delivery.json" "pipeline-evidence-graph.json" "drift-report.json")

MISSING=0
for evidence in "${EVIDENCE_FILES[@]}"; do
  # Find if the evidence file exists anywhere in the worktree's _iwish-output
  FOUND=$(find "$WORKTREE_PATH/_iwish-output" -name "$evidence" 2>/dev/null | wc -l)
  if [ "$FOUND" -eq 0 ]; then
    echo "❌ Missing evidence file: $evidence"
    MISSING=1
  else
    echo "✅ Found evidence: $evidence"
  fi
done

ECC_FOUND=$(find "$WORKTREE_PATH/_iwish-output/_state/ecc" -name "Story-*-evidence.json" 2>/dev/null | wc -l)
if [ "$ECC_FOUND" -eq 0 ]; then
  echo "❌ Missing ECC evidence file in _state/ecc/"
  MISSING=1
else
  echo "✅ Found ECC evidence file"
fi

if [ "$MISSING" -eq 1 ]; then
  echo "❌ FATAL: Worktree lacks Zero-Trust cryptographic evidence. Merge REJECTED."
  exit 1
fi

echo "✅ Zero-Trust Evidence verified."

# 2. Extract branch name from worktree
cd "$WORKTREE_PATH"

if [[ -n $(git status -s) ]]; then
  echo "⚠️ Found uncommitted changes in worktree. Committing them now..."
  git add -u  # Only stage tracked files — prevents committing Agent scratch junk
  git commit -m "Auto-commit Zero-Trust Evidence & Code from subagent" || true
fi

BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
cd - > /dev/null

echo "Merging branch '$BRANCH_NAME' into main workspace..."

# 3. Merge the branch
git merge "$BRANCH_NAME" -m "Zero-Trust Merge: $BRANCH_NAME"

echo "======================================================"
echo " MERGE SUCCESSFUL"
echo "======================================================"
