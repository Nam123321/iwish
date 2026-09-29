#!/bin/bash
echo "=== System Skill Audit ==="
echo "Scanning .agent/skills/ and .agent/workflows/ for files > 500 lines..."
echo ""

# Scan skills
find .agent/skills -name "SKILL.md" -type f 2>/dev/null | while read file; do
    lines=$(wc -l < "$file" | tr -d ' ')
    if [ "$lines" -gt 500 ]; then
        echo "🔴 [SKILL] $file: $lines lines"
    fi
done

# Scan workflows
find .agent/workflows -name "*.md" -type f 2>/dev/null | while read file; do
    lines=$(wc -l < "$file" | tr -d ' ')
    if [ "$lines" -gt 500 ]; then
        echo "🔴 [WORKFLOW] $file: $lines lines"
    fi
done

echo "Audit complete."
