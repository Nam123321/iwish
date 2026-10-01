#!/usr/bin/env python3
"""UIP Risk Scanner — Type B LLM prompt template tool.

Merges pre-mortem + assumption-map functionality into a single tool.
Outputs structured YAML prompt templates for agent LLM reasoning.

Modes: pre-mortem | assumptions | both (default: both)
Exit codes: 0=success, 1=error.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone

TOOL_NAME = "uip-risk-scanner"
VERSION = "1.0.0"


def _read_file(path: str) -> str:
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError as e:
        print(json.dumps({"tool": TOOL_NAME, "error": str(e)}))
        sys.exit(1)


def _build_pre_mortem_template(context_excerpt: str) -> dict:
    return {
        "mode": "pre-mortem",
        "prompt_template": {
            "role": "system",
            "content": (
                "You are performing a Pre-Mortem Analysis. Imagine this project "
                "has FAILED catastrophically 12 months from now. Your task is to "
                "identify the 5-7 most likely causes of failure.\n\n"
                "Rules:\n"
                "- Each risk MUST cite a specific artifact, decision, or dependency from the context\n"
                "- Only include P0/P1 severity failures (would block release or cause data loss)\n"
                "- Each risk must include a 'verifiability' field: how would you confirm this risk exists?\n"
                "- Include at least 1 'counter_signal' for every 3 risks (evidence AGAINST the risk)\n"
                "- Risks without evidence grounding are tagged as confidence: 'speculative'\n"
            ),
        },
        "context_excerpt": context_excerpt[:3000],
        "output_schema": {
            "type": "object",
            "required": ["risks"],
            "properties": {
                "risks": {
                    "type": "array",
                    "minItems": 5, "maxItems": 7,
                    "items": {
                        "type": "object",
                        "required": ["description", "severity", "evidence", "verifiability", "confidence"],
                        "properties": {
                            "description": {"type": "string"},
                            "severity": {"type": "string", "enum": ["P0", "P1"]},
                            "evidence": {"type": "string", "description": "Specific artifact/decision that triggers this risk"},
                            "verifiability": {"type": "string", "description": "How to confirm/deny this risk"},
                            "confidence": {"type": "string", "enum": ["grounded", "speculative"]},
                            "counter_signal": {"type": "string", "description": "Evidence against this risk (optional)"},
                        },
                    },
                },
            },
        },
        "guardrails": [
            "Each risk must reference a concrete artifact or decision from the context",
            "Ungrounded risks get confidence: 'speculative'",
            "Hard cap: 7 risks maximum",
            "At least 1 counter_signal per 3 risks",
        ],
    }


def _build_assumptions_template(context_excerpt: str) -> dict:
    return {
        "mode": "assumptions",
        "prompt_template": {
            "role": "system",
            "content": (
                "You are an Assumptions Analyst. Your task is to identify ALL "
                "implicit and explicit assumptions in this document.\n\n"
                "For each assumption:\n"
                "1. Quote the exact text that reveals the assumption\n"
                "2. Classify as: verified (has evidence), unverified (no evidence), "
                "   or contradicted (evidence against it)\n"
                "3. Rate risk level if the assumption is wrong: critical / high / medium / low\n"
                "4. Suggest validation method\n\n"
                "Focus on IMPLICIT assumptions — things the document takes for granted "
                "without stating. These are the most dangerous.\n"
                "Look for: modal verbs (should, will, must, expect), quantitative claims "
                "without sources, timeline estimates, technology assumptions, user behavior assumptions."
            ),
        },
        "context_excerpt": context_excerpt[:3000],
        "output_schema": {
            "type": "object",
            "required": ["assumptions"],
            "properties": {
                "assumptions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["text", "type", "status", "risk_if_wrong", "validation_method"],
                        "properties": {
                            "text": {"type": "string", "description": "The assumption statement"},
                            "type": {"type": "string", "enum": ["explicit", "implicit"]},
                            "status": {"type": "string", "enum": ["verified", "unverified", "contradicted"]},
                            "risk_if_wrong": {"type": "string", "enum": ["critical", "high", "medium", "low"]},
                            "source_quote": {"type": "string", "description": "Exact text from document"},
                            "validation_method": {"type": "string"},
                        },
                    },
                },
                "summary": {
                    "type": "object",
                    "properties": {
                        "total": {"type": "integer"},
                        "verified": {"type": "integer"},
                        "unverified": {"type": "integer"},
                        "contradicted": {"type": "integer"},
                        "critical_unverified": {"type": "integer"},
                    },
                },
            },
        },
        "guardrails": [
            "Each assumption must include a source_quote from the document",
            "Implicit assumptions must explain WHY they are implicit",
            "Do not invent assumptions not supported by the document text",
            "Prioritize critical+unverified assumptions in output ordering",
        ],
    }


def generate_output(mode: str, context_path: str) -> dict:
    content = _read_file(context_path)
    result = {
        "tool": TOOL_NAME,
        "version": VERSION,
        "phase": "B",
        "mode": mode,
        "context_file": context_path,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "co_registers_with": "idea-hardening",
        "templates": [],
    }

    if mode in ("pre-mortem", "both"):
        result["templates"].append(_build_pre_mortem_template(content))
    if mode in ("assumptions", "both"):
        result["templates"].append(_build_assumptions_template(content))

    return result


def main(argv=None):
    p = argparse.ArgumentParser(prog=TOOL_NAME,
        description="Risk Scanner — merges pre-mortem + assumption-map. "
                    "Outputs YAML/JSON prompt templates for LLM analysis.")
    p.add_argument("--context", required=True, metavar="FILE", help="Context file to scan")
    p.add_argument("--mode", choices=["pre-mortem", "assumptions", "both"],
                   default="both", help="Analysis mode (default: both)")
    p.add_argument("--output-format", choices=["json", "yaml"], default="json",
                   help="Output format (default: json)")
    p.add_argument("--dry-run", action="store_true", help="Validate inputs only")
    args = p.parse_args(argv)

    path = os.path.abspath(args.context)
    if not os.path.isfile(path):
        print(json.dumps({"tool": TOOL_NAME, "error": f"Not found: {path}"}))
        return 1

    if args.dry_run:
        print(json.dumps({"tool": TOOL_NAME, "dry_run": True, "mode": args.mode,
                          "context_file": path, "status": "ready"}, indent=2))
        return 0

    result = generate_output(args.mode, path)

    if args.output_format == "yaml":
        try:
            import yaml
            print(yaml.dump(result, default_flow_style=False, sort_keys=False, width=120))
        except ImportError:
            print(json.dumps(result, indent=2))
    else:
        print(json.dumps(result, indent=2))

    return 0


if __name__ == "__main__":
    sys.exit(main())
