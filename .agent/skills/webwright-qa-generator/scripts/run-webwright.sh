#!/bin/bash
# Wrapper script for Webwright - QA Adapter
# This script injects LLM credentials dynamically and safely, runs Webwright with a Flaky Loop (3 retries).
# BUGFIX: Removed file-based API key storage to prevent leaks on SIGKILL. Variables are exported directly.

# Inject Dynamic Config securely via environment
export OPENAI_API_KEY="${OPENAI_API_KEY}"
export IWISH_LLM_MODEL="${IWISH_LLM_MODEL:-gpt-4o}"

if [ -z "$OPENAI_API_KEY" ]; then
    echo "ERROR: OPENAI_API_KEY is not set in the environment. Aborting."
    exit 1
fi

# Install Playwright browsers (ephemeral environment initialization)
echo "Initializing Playwright environment..."
uvx --with playwright run python -m playwright install chromium

MAX_RETRIES=3
RETRY_COUNT=0
SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "Starting Webwright (Attempt $((RETRY_COUNT+1))/$MAX_RETRIES)..."
    
    # Run Webwright via uvx, passing all arguments
    OUTPUT=$(uvx --with playwright webwright run "$@" 2>&1)
    EXIT_CODE=$?
    
    echo "$OUTPUT"
    
    if [ $EXIT_CODE -eq 0 ]; then
        SUCCESS=true
        break
    fi
    
    # [EDGE-CASE: EC-P2-002] Check for Rate Limit 429
    if echo "$OUTPUT" | grep -q "429"; then
        echo "ERROR: Rate Limit 429 encountered. Aborting immediately to prevent loop exhaustion."
        exit 1
    fi
    
    RETRY_COUNT=$((RETRY_COUNT+1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo "Webwright execution failed. Retrying..."
        sleep 2
    fi
done

if [ "$SUCCESS" = false ]; then
    echo "ERROR: Webwright failed after $MAX_RETRIES attempts. Fallback to vanilla Playwright code generation required."
    exit 1
fi

echo "Webwright execution completed successfully."
exit 0
