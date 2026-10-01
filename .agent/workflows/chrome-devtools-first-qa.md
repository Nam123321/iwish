---
name: 'chrome-devtools-first-qa'
description: 'Default browser usage-pack skeleton for Chrome DevTools or MCP-backed debugging and QA.'
---

# Chrome DevTools First QA

## Purpose

Provide the default usage-pack skeleton for `chrome-devtools-mcp`.

## Core Responsibilities

1. Use Chrome-backed inspection when the scenario depends on a richer browser session or DevTools context.
2. Gather UI, console, network, or layout evidence.
3. Hand results back to review, bugfix, or UX workflows.

## Expected Inputs

- selected browser tool profile = `chrome-devtools-mcp`
- target page or scenario
- story, bug, or UX audit context

## Expected Outputs

- inspection notes
- browser evidence
- suggested next workflow
