#!/usr/bin/env bash

# Exit immediately if any command in the script fails, except for user commands that we evaluate.
set -euo pipefail

# Print usage instructions
usage() {
    echo "Usage: $0 <skill-name> <command | --promote | --abort>"
    echo ""
    echo "Commands:"
    echo "  <command>    Execute a command inside the sandbox branch."
    echo "  --promote    Promote (merge) sandbox changes back to the original branch."
    echo "  --abort      Discard sandbox changes and return to the original branch."
    exit 1
}

if [ $# -lt 2 ]; then
    usage
fi

SKILL_NAME="$1"
ACTION="$2"
# Do not shift here, we will shift inside the case statement if it is a command wrapper.

# Define paths and variables
GIT_ROOT=$(git rev-parse --show-toplevel)
STATE_DIR="${GIT_ROOT}/.git"
STATE_FILE="${STATE_DIR}/iwish-sandbox-${SKILL_NAME}"
SANDBOX_BRANCH="evolve/${SKILL_NAME}-sandbox"

# Load existing state if it exists
ORIG_BRANCH=""
STASHED="false"
if [ -f "$STATE_FILE" ]; then
    # shellcheck source=/dev/null
    . "$STATE_FILE"
fi

# Function to check if repository is dirty
is_dirty() {
    [ -n "$(git status --porcelain)" ]
}

# Function to save state
save_state() {
    mkdir -p "$(dirname "$STATE_FILE")"
    cat <<EOF > "$STATE_FILE"
ORIG_BRANCH="$ORIG_BRANCH"
STASHED="$STASHED"
EOF
}

case "$ACTION" in
    --promote)
        echo "Promoting sandbox changes for skill '${SKILL_NAME}'..."
        if [ -z "$ORIG_BRANCH" ]; then
            echo "Error: No sandbox state found for skill '${SKILL_NAME}'."
            exit 1
        fi
        
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
        if [ "$CURRENT_BRANCH" != "$SANDBOX_BRANCH" ]; then
            echo "Warning: Not currently on the sandbox branch '${SANDBOX_BRANCH}'."
        fi
        
        # Merge changes to original branch
        git checkout "$ORIG_BRANCH"
        
        echo "Merging '${SANDBOX_BRANCH}' into '${ORIG_BRANCH}'..."
        if ! git merge "$SANDBOX_BRANCH" --no-edit; then
            echo "Error: Conflict during merge. Please resolve manually on branch '${ORIG_BRANCH}'."
            exit 1
        fi
        
        echo "Deleting sandbox branch '${SANDBOX_BRANCH}'..."
        git branch -d "$SANDBOX_BRANCH" || git branch -D "$SANDBOX_BRANCH"
        
        if [ "$STASHED" = "true" ]; then
            echo "Restoring stashed changes..."
            git stash pop || echo "Warning: Stash pop failed. Please run 'git stash pop' manually."
        fi
        
        rm -f "$STATE_FILE"
        echo "Promotion complete."
        ;;
        
    --abort)
        echo "Aborting sandbox for skill '${SKILL_NAME}'..."
        if [ -z "$ORIG_BRANCH" ]; then
            echo "Error: No sandbox state found for skill '${SKILL_NAME}'."
            exit 1
        fi
        
        git reset --hard HEAD
        git clean -fd
        
        git checkout "$ORIG_BRANCH"
        git branch -D "$SANDBOX_BRANCH" || true
        
        if [ "$STASHED" = "true" ]; then
            echo "Restoring stashed changes..."
            git stash pop || echo "Warning: Stash pop failed. Please run 'git stash pop' manually."
        fi
        
        rm -f "$STATE_FILE"
        echo "Sandbox aborted and rolled back successfully."
        ;;
        
    *)
        # It's a command wrapper
        shift # Remove SKILL_NAME
        COMMAND_TO_RUN="$@"
        
        # 1. Determine original branch if we are not already on sandbox branch
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
        if [ "$CURRENT_BRANCH" != "$SANDBOX_BRANCH" ]; then
            # If the state file doesn't exist, we start a new sandbox session
            if [ ! -f "$STATE_FILE" ]; then
                ORIG_BRANCH="$CURRENT_BRANCH"
                STASHED="false"
                
                # Check for dirty changes
                if is_dirty; then
                    echo "Workspace is dirty. Stashing unstaged/untracked changes..."
                    git stash push --include-untracked -m "git-sandbox-wrapper-stash-before-${SKILL_NAME}"
                    STASHED="true"
                fi
                
                save_state
                
                # Create and checkout fresh sandbox branch
                echo "Creating fresh sandbox branch '${SANDBOX_BRANCH}'..."
                git checkout -B "$SANDBOX_BRANCH"
            else
                # State file exists, so we resume the sandbox session
                echo "Resuming sandbox session for skill '${SKILL_NAME}'..."
                # Load the state
                # shellcheck source=/dev/null
                . "$STATE_FILE"
                
                # Checkout the existing sandbox branch
                git checkout "$SANDBOX_BRANCH"
            fi
        else
            echo "Already on sandbox branch '${SANDBOX_BRANCH}'."
        fi
        
        # 3. Run the command
        echo "Running command inside sandbox: $COMMAND_TO_RUN"
        
        # We disable 'set -e' temporarily to capture exit status of command
        set +e
        ( eval "$COMMAND_TO_RUN" )
        CMD_EXIT_CODE=$?
        set -e
        
        # 4. Handle success or failure
        if [ $CMD_EXIT_CODE -ne 0 ]; then
            echo "Command failed with status $CMD_EXIT_CODE. Rolling back..."
            git reset --hard HEAD
            git clean -fd
            
            if [ -n "$ORIG_BRANCH" ]; then
                git checkout "$ORIG_BRANCH"
            else
                git checkout -
            fi
            
            # Delete sandbox branch to discard broken changes
            git branch -D "$SANDBOX_BRANCH" || true
            
            if [ "$STASHED" = "true" ]; then
                echo "Restoring stashed changes..."
                git stash pop || echo "Warning: Stash pop failed. Please run 'git stash pop' manually."
            fi
            
            rm -f "$STATE_FILE"
            exit $CMD_EXIT_CODE
        else
            echo "Command executed successfully."
            
            # Commit on success if there are changes
            if is_dirty; then
                git add -A
                
                # Configure local git user if not set
                if ! git config user.name >/dev/null 2>&1; then
                    git config --local user.name "I-Wish Evolver"
                fi
                if ! git config user.email >/dev/null 2>&1; then
                    git config --local user.email "evolver@iwish.local"
                fi
                
                git commit -m "Auto-commit: mutation success for ${SKILL_NAME}"
                echo "Changes committed to sandbox branch."
            else
                echo "No changes detected to commit."
            fi
            exit 0
        fi
        ;;
esac
