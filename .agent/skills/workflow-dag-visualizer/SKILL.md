---
name: workflow-dag-visualizer
description: Analyzes a workflow engine execution trace and renders the DAG state using Mermaid for debugging.
version: 1.0.0
---

# Workflow DAG Visualizer Skill

This skill analyzes workflow execution traces and generates Mermaid.js diagrams to visualize complex cyclic graphs and state transitions for debugging.

## Usage
When the user asks to debug or visualize a workflow execution:
1. Extract the raw JSON trace from the execution payload.
2. Iterate through the steps and dependencies.
3. Build a Mermaid `graph TD` block representing the DAG.
4. Output the diagram in an artifact file (`workflow-dag.md`) using the ```mermaid codeblock format.
