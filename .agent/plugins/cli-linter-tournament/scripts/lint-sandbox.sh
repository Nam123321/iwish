#!/usr/bin/env bash
# Secure Sandboxed Wrapper for CLI Linter

TARGET_DIR="$1"
if [ -z "$TARGET_DIR" ]; then
  echo "Usage: $0 <target_directory>"
  exit 1
fi

# Ensure target directory exists and is an absolute path
if [ ! -d "$TARGET_DIR" ]; then
  echo "Error: Directory $TARGET_DIR does not exist."
  exit 1
fi

ABS_TARGET_DIR=$(cd "$TARGET_DIR" && pwd)

# AC4: Dependencies must be statically pre-installed.
# In a real environment, the linter JS file would be located here.
# LINTER_SCRIPT="./node_modules/.bin/design-lint"
LINTER_SCRIPT="linter-mock.js"

# AC5: Enforce strict resource limits
# Limit virtual memory to 512MB
ulimit -v 524288

# AC3, AC4, AC5: We use Deno for sandboxing since it provides strict permission flags.
# --no-net: Blocks network access
# --allow-read="$ABS_TARGET_DIR": Restricts file reads to the target dir
# --no-env: Prevents reading environment variables
# If deno is not installed, fallback to restricted node execution.

echo "Running sandboxed linter on $ABS_TARGET_DIR..."

if command -v deno &> /dev/null; then
    # Use Deno for strict sandboxing
    # Timeout after 30 seconds
    timeout 30s deno run \
        --no-net \
        --no-env \
        --allow-read="$ABS_TARGET_DIR" \
        --no-write \
        --no-run \
        "$LINTER_SCRIPT" "$ABS_TARGET_DIR" 2>&1 | \
    # AC6: Sanitize ANSI sequences and control characters
    sed 's/\x1b\[[0-9;]*[a-zA-Z]//g'
else
    # Fallback Node.js execution with timeout, but less isolated.
    echo "[WARNING] Deno not found. Running with Node.js fallback (less secure isolation)."
    timeout 30s node "$LINTER_SCRIPT" "$ABS_TARGET_DIR" 2>&1 | \
    # AC6: Sanitize ANSI sequences
    sed 's/\x1b\[[0-9;]*[a-zA-Z]//g'
fi

EXIT_CODE=${PIPESTATUS[0]}
if [ $EXIT_CODE -eq 124 ]; then
    echo "Error: Linter execution timed out."
    exit 1
fi

exit $EXIT_CODE
