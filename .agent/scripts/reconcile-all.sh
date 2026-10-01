#!/bin/bash
set -e

echo "======================================================"
echo " ZERO-TRUST RECONCILE EXECUTION GATE"
echo "======================================================"

echo "[1/4] Rebuilding Sprint Status (sprint-status.yaml)"
python3 .agent/scripts/rebuild_sprint_status.py
echo "✓ sprint-status.yaml rebuilt."

echo "[2/4] Syncing Statuses to Epic files"
python3 .agent/scripts/sync_all_statuses.py
echo "✓ Epic status tables synced."

echo "[3/4] Rebuilding Cross-Dependency Index (CDI)"
if [ -f ".agent/scripts/compile-dependency-index.py" ]; then
    python3 .agent/scripts/compile-dependency-index.py
    echo "✓ CDI compiled."
    python3 .agent/scripts/validate-cdi.py
    echo "✓ CDI validated mathematically."
else
    echo "⚠️ compile-dependency-index.py not found, skipping."
fi

echo "[4/4] Idea Navigator Guardian Dashboard Sync"
if [ -f ".agent/scripts/navigator-guardian.sh" ]; then
    bash .agent/scripts/navigator-guardian.sh
    echo "✓ Dashboard synced."
else
    echo "⚠️ navigator-guardian.sh not found, skipping."
fi

echo "======================================================"
echo " ZERO-TRUST RECONCILE PASSED MECHANICALLY"
echo "======================================================"
