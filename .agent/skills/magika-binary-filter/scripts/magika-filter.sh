#!/usr/bin/env bash
# I-Wish System Skill: Magika Binary Filter Helper
# Usage: ./magika-filter.sh [DIRECTORY] [OUTPUT_FILE]

set -e

DIR="${1:-.}"
OUTPUT_FILE="${2:-.repomixignore-magika}"

if ! command -v magika &> /dev/null; then
    echo "Error: Magika is not installed. Please install it using: pip install magika"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. Please install jq to run this filter."
    exit 1
fi

echo "Scanning directory '$DIR' with Magika..."

MAGIKA_OUTPUT=$(mktemp)
magika -r "$DIR" --jsonl > "$MAGIKA_OUTPUT"

# 1. Filter out text/code files for Repomix
jq -r 'select(.output.group != "text" and .output.group != "code" and .output.group != "empty") | .path' "$MAGIKA_OUTPUT" > "$OUTPUT_FILE"
COUNT=$(wc -l < "$OUTPUT_FILE" | awk '{print $1}')

# 2. Security Guard Rail: Detect dangerous executable formats
DANGEROUS_FILES=$(jq -r 'select(.output.group == "executable") | .path' "$MAGIKA_OUTPUT")

if [ -n "$DANGEROUS_FILES" ]; then
    echo -e "\033[1;31m🚨 [SECURITY GUARD RAIL WARNING]\033[0m Detected unexpected executable formats (potential malware/binaries):"
    echo "$DANGEROUS_FILES" | sed 's/^/  - /'
    echo -e "\033[33m⚠️  These files have been blocked from AI ingestion. Please verify their safety!\033[0m"
fi

rm -f "$MAGIKA_OUTPUT"

echo "Binary filter complete. Identified $COUNT binary/unsupported files."
echo "Excluded files saved to: $OUTPUT_FILE"
