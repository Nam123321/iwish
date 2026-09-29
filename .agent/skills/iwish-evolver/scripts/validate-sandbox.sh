#!/usr/bin/env bash

set -euo pipefail

# Define test workspace
TEST_DIR=$(mktemp -d -t git-sandbox-test-XXXXXX)
trap 'rm -rf "$TEST_DIR"' EXIT

echo "=== Setting up isolated test Git repository in $TEST_DIR ==="
cd "$TEST_DIR"
git init -q
git checkout -b main -q
git config user.name "Tester"
git config user.email "tester@example.com"

# Create initial commit
echo "Initial content" > README.md
git add README.md
git commit -q -m "Initial commit"

# Copy the wrapper script
WRAPPER_SRC="{project-root}/.agent/skills/iwish-evolver/scripts/git-sandbox-wrapper.sh"
cp "$WRAPPER_SRC" ./git-sandbox-wrapper.sh
chmod +x ./git-sandbox-wrapper.sh
git add git-sandbox-wrapper.sh
git commit -q -m "Add wrapper script"

echo "=== Test 1: AC1 & AC2 - Success Mutation ==="
# Running wrapper with success command
./git-sandbox-wrapper.sh test-skill "echo 'mutated content' >> README.md"

# Verify we are on the sandbox branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "evolve/test-skill-sandbox" ]; then
    echo "FAIL: Expected current branch to be evolve/test-skill-sandbox, got $CURRENT_BRANCH"
    exit 1
fi

# Verify the changes were committed
if ! git log -n 1 --oneline | grep -q "Auto-commit: mutation success for test-skill"; then
    echo "FAIL: Change was not committed on success"
    exit 1
fi
echo "SUCCESS: Test 1 passed."

echo "=== Test 2: AC3 - Failure Rollback ==="
# Go back to main first
git checkout main -q

# Run wrapper with a command that fails
# We expect the wrapper to return exit code 1
set +e
./git-sandbox-wrapper.sh test-skill "echo 'broken content' >> README.md && exit 1"
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -ne 1 ]; then
    echo "FAIL: Expected wrapper to return exit code 1, got $EXIT_CODE"
    exit 1
fi

# Verify we are back on main
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "FAIL: Expected current branch to be main after rollback, got $CURRENT_BRANCH"
    exit 1
fi

# Verify branch evolve/test-skill-sandbox is deleted/discarded
if git show-ref --verify --quiet refs/heads/evolve/test-skill-sandbox; then
    echo "FAIL: evolve/test-skill-sandbox branch should have been deleted"
    exit 1
fi

# Verify README.md has no broken content
if grep -q "broken content" README.md; then
    echo "FAIL: README.md contains broken content that should have been rolled back"
    exit 1
fi
echo "SUCCESS: Test 2 passed."

echo "=== Test 3: AC4 - Dirty State Handling & Stash/Unstash ==="
# Make repository dirty on main
echo "dirty edit" >> README.md
echo "untracked content" > untracked.txt

# Run wrapper with a successful command
./git-sandbox-wrapper.sh test-skill "echo 'another mutation' >> README.md"

# Verify we are on sandbox branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "evolve/test-skill-sandbox" ]; then
    echo "FAIL: Expected sandbox branch, got $CURRENT_BRANCH"
    exit 1
fi

# Verify that the dirty changes (dirty edit and untracked file) are NOT on the sandbox branch
if grep -q "dirty edit" README.md; then
    echo "FAIL: Dirty changes should have been stashed and not present in sandbox"
    exit 1
fi
if [ -f untracked.txt ]; then
    echo "FAIL: Untracked file should have been stashed and not present in sandbox"
    exit 1
fi

# Now promote and verify that the stashed changes are restored
./git-sandbox-wrapper.sh test-skill --promote

# Verify we are back on main
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "FAIL: Expected to be on main branch after promote, got $CURRENT_BRANCH"
    exit 1
fi

# Verify dirty changes are restored
if ! grep -q "dirty edit" README.md; then
    echo "FAIL: Stashed edit was not restored on promote"
    exit 1
fi
if [ ! -f untracked.txt ] || ! grep -q "untracked content" untracked.txt; then
    echo "FAIL: Stashed untracked file was not restored on promote"
    exit 1
fi

echo "SUCCESS: Test 3 passed."

echo "=== Test 4: Abort Sandbox ==="
# Clean test workspace
git reset --hard HEAD -q
git clean -fd -q

# Make repository dirty
echo "dirty edit for abort" >> README.md
echo "untracked for abort" > untracked.txt

# Start sandbox
./git-sandbox-wrapper.sh test-skill "echo 'mutation' >> README.md"

# Verify sandbox is active
if [ "$(git rev-parse --abbrev-ref HEAD)" != "evolve/test-skill-sandbox" ]; then
    echo "FAIL: Sandbox branch not active"
    exit 1
fi

# Abort sandbox
./git-sandbox-wrapper.sh test-skill --abort

# Verify we are on main, branch is deleted, and stash is popped
if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
    echo "FAIL: Not on main after abort"
    exit 1
fi
if git show-ref --verify --quiet refs/heads/evolve/test-skill-sandbox; then
    echo "FAIL: Sandbox branch still exists after abort"
    exit 1
fi
if ! grep -q "dirty edit for abort" README.md; then
    echo "FAIL: Stash not restored after abort"
    exit 1
fi
if [ ! -f untracked.txt ]; then
    echo "FAIL: Untracked stash not restored after abort"
    exit 1
fi

echo "SUCCESS: Test 4 passed."

echo "=== All Tests Passed Successfully! ==="
