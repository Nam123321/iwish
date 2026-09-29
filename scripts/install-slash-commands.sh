#!/usr/bin/env bash

# Script: install-slash-commands.sh
# Purpose: Generates slash command bridges for Cursor IDE, Claude Code, and OpenAI Codex
# This enables I-Wish workflows to be triggered via native slash commands in these environments.

echo "Installing I-Wish Slash Commands for third-party IDEs and Runners..."

WORKFLOWS_DIR=".agent/workflows"
CURSOR_DIR=".cursor/commands"
CLAUDE_DIR=".claude/skills"
CODEX_PROMPTS_DIR="$HOME/.codex/prompts"
CODEX_SKILLS_DIR="$HOME/.codex/skills"

if [ ! -d "$WORKFLOWS_DIR" ]; then
    echo "Error: Cannot find $WORKFLOWS_DIR. Make sure you are in the I-Wish project root."
    exit 1
fi

# Initialize target directories
echo "Creating destination directories..."
mkdir -p "$CURSOR_DIR"
mkdir -p "$CLAUDE_DIR"
mkdir -p "$CODEX_PROMPTS_DIR"
mkdir -p "$CODEX_SKILLS_DIR"

COUNT=0

# Iterate through all I-Wish workflows
for file in "$WORKFLOWS_DIR"/*.md ".agent/agents"/*.md; do
    if [ ! -f "$file" ]; then
        continue
    fi
    
    # Extract filename without extension (e.g., make-story)
    basename=$(basename "$file")
    cmd_name="${basename%.*}"
    
    # 1. Cursor IDE (.cursor/commands/ is relative to project)
    cat <<EOF > "$CURSOR_DIR/$cmd_name.md"
[I-Wish Workflow: $cmd_name]
You are running within the I-Wish framework.
You MUST read, adhere to, and strictly execute the instructions defined in this workflow file: $file
Do NOT skip steps.
EOF

    # 2. Claude Code (.claude/skills/ is relative to project)
    mkdir -p "$CLAUDE_DIR/$cmd_name"
    cat <<EOF > "$CLAUDE_DIR/$cmd_name/SKILL.md"
---
name: $cmd_name
description: Run the I-Wish $cmd_name workflow
---
[I-Wish Workflow: $cmd_name]
You are running within the I-Wish framework.
You MUST read, adhere to, and strictly execute the instructions defined in this workflow file: $file
Do NOT skip steps.

Input Context/Arguments: \$ARGUMENTS
EOF

    # 3. OpenAI Codex - Legacy Prompts (~/.codex/prompts/ is global, needs absolute path)
    cat <<EOF > "$CODEX_PROMPTS_DIR/$cmd_name.md"
[I-Wish Workflow: $cmd_name]
You are running within the I-Wish framework.
You MUST read, adhere to, and strictly execute the instructions defined in this workflow file: $PWD/$file
Do NOT skip steps.

Input Context/Arguments: \$ARGUMENTS
EOF

    # 4. OpenAI Codex - Skills Framework (~/.codex/skills/ is global, needs absolute path)
    mkdir -p "$CODEX_SKILLS_DIR/$cmd_name"
    cat <<EOF > "$CODEX_SKILLS_DIR/$cmd_name/SKILL.md"
---
name: $cmd_name
description: Run the I-Wish $cmd_name workflow
---
[I-Wish Workflow: $cmd_name]
You are running within the I-Wish framework.
You MUST read, adhere to, and strictly execute the instructions defined in this workflow file: $PWD/$file
Do NOT skip steps.

Input Context/Arguments: \$ARGUMENTS
EOF

    ((COUNT++))
done

echo ""
echo "✅ Successfully synced $COUNT slash commands!"
echo "---------------------------------------------------"
echo "Project-Level Installations:"
echo " - Cursor IDE: $CURSOR_DIR/"
echo " - Claude Code: $CLAUDE_DIR/"
echo ""
echo "Global Installations:"
echo " - OpenAI Codex (Legacy): $CODEX_PROMPTS_DIR/"
echo " - OpenAI Codex (Skills): $CODEX_SKILLS_DIR/"
echo "---------------------------------------------------"
echo "⚠️ IMPORTANT: Please RESTART your Cursor/Claude Code/Codex session to load the new slash commands."
echo "If you update workflows in I-Wish, re-run this script to sync."
