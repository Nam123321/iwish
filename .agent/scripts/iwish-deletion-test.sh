#!/bin/bash
# iwish-deletion-test.sh
# I-Wish Universal Deletion Test Engine
# Enforces architectural depth by verifying that a module's deletion causes tests to fail.

set -euo pipefail

# Strip trailing slash if present to avoid recursive mv errors
TARGET=${1%/}

if [ -z "${TARGET:-}" ]; then
    echo "Usage: $0 <target-file-or-dir>"
    exit 1
fi

if [ ! -e "$TARGET" ]; then
    echo "Error: Target '$TARGET' does not exist."
    exit 1
fi

# --- Whitelist of allowed test commands (Security Gate) ---
ALLOWED_COMMANDS=(
    "npx vitest run"
    "npx jest"
    "npx playwright test"
    "npx detox test"
    "flutter test"
    "npm test"
    "npm run test"
    "pnpm test"
    "pnpm run test"
    "yarn test"
    "yarn run test"
)

function is_allowed_command {
    local cmd="$1"
    for allowed in "${ALLOWED_COMMANDS[@]}"; do
        if [ "$cmd" = "$allowed" ]; then
            return 0
        fi
    done
    return 1
}

echo "🔍 Detecting Test Runner..."
TEST_CMD=""

if [ -f "package.json" ]; then
    if grep -q '"vitest"' package.json; then
        TEST_CMD="npx vitest run"
        echo "✅ Detected Vitest"
    elif grep -q '"jest"' package.json; then
        TEST_CMD="npx jest"
        echo "✅ Detected Jest"
    elif grep -q '"playwright"' package.json; then
        TEST_CMD="npx playwright test"
        echo "✅ Detected Playwright"
    elif grep -q '"detox"' package.json; then
        TEST_CMD="npx detox test"
        echo "✅ Detected Detox"
    fi
fi

# If we are in a flutter project
if [ -f "pubspec.yaml" ]; then
    TEST_CMD="flutter test"
    echo "✅ Detected Flutter"
fi

# Fallback: environment variable or interactive prompt
if [ -z "$TEST_CMD" ]; then
    echo "⚠️ No supported test runner detected automatically."

    if [ -n "${I-Wish_TEST_CMD:-}" ]; then
        TEST_CMD="$I-Wish_TEST_CMD"
        echo "📦 Using I-Wish_TEST_CMD from environment: $TEST_CMD"
    elif [ -n "${CI:-}" ] || [ ! -t 0 ]; then
        # Non-interactive environment (CI/CD) — fail fast instead of hanging
        echo "🚫 ERROR: No test runner detected and running in non-interactive mode (CI)."
        echo "Set I-Wish_TEST_CMD environment variable to specify the test command."
        exit 1
    else
        echo "Please provide a test command. Example: npm test"
        read -p "Enter test command to run: " TEST_CMD
    fi
fi

if [ -z "$TEST_CMD" ]; then
    echo "Error: No test command provided."
    exit 1
fi

# --- Security Gate: Validate command against whitelist ---
if ! is_allowed_command "$TEST_CMD"; then
    echo "🚫 SECURITY BLOCK: '$TEST_CMD' is not in the allowed command whitelist."
    echo "Allowed commands:"
    printf "  - %s\n" "${ALLOWED_COMMANDS[@]}"
    echo ""
    echo "If you need a custom command, add it to ALLOWED_COMMANDS in this script."
    exit 1
fi

echo "🚧 Isolating Target: $TARGET"
TEMP_NAME="${TARGET}.__iwish_deleted"
mv "$TARGET" "$TEMP_NAME"

# Clean up function to ensure the file is always restored
function restore_target {
    if [ -e "$TEMP_NAME" ]; then
        echo "♻️ Restoring Target..."
        mv "$TEMP_NAME" "$TARGET"
    fi
}
trap restore_target EXIT INT TERM HUP

echo "🚀 Running Deletion Test: $TEST_CMD"
# Execute the whitelisted command safely (no eval)
set +e
$TEST_CMD
TEST_EXIT_CODE=$?
set -e

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "❌ DELETION TEST FAILED: Tests passed even after deleting '$TARGET'."
    echo "This indicates a SHALLOW MODULE. The module lacks architectural depth or test coverage."
    exit 1
else
    echo ""
    echo "✅ DELETION TEST PASSED: Tests failed as expected when '$TARGET' was removed."
    echo "The module is structurally integrated."
    exit 0
fi
