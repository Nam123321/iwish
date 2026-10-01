#!/usr/bin/env python3
"""UIP Market Audit — Type B LLM prompt template tool.

Merges pmf-validator + competitive-blindspot functionality.
Outputs structured prompt templates for market analysis.

Modes: pmf | blindspot | both (default: both)
Exit codes: 0=success, 1=error.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone

TOOL_NAME = "uip-market-audit"
VERSION = "1.0.0"


def _read_file(path: str) -> str:
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError as e:
        print(json.dumps({"tool": TOOL_NAME, "error": str(e)}))
        sys.exit(1)


def _build_pmf_template(context_excerpt: str) -> dict:
    return {
        "mode": "pmf",
        "prompt_template": {
            "role": "system",
            "content": (
                "You are a Product-Market Fit analyst. Evaluate whether the product "
                "described has genuine market demand based on available evidence.\n\n"
                "You MUST structure your analysis into 4 mandatory categories:\n"
                "1. direct_signals: User interviews, survey data, waitlist numbers, beta feedback\n"
                "2. proxy_signals: Market size estimates, competitor traction, industry reports\n"
                "3. counter_signals: Evidence AGAINST PMF (you MUST include these)\n"
                "4. missing_evidence: What data would validate/invalidate PMF?\n\n"
                "DEVIL'S ADVOCATE RULE: For every positive signal, generate one counter-argument.\n"
                "PMF cannot be declared with confidence < 0.7 unless direct_signals are strong."
            ),
        },
        "context_excerpt": context_excerpt[:3000],
        "output_schema": {
            "type": "object",
            "required": ["direct_signals", "proxy_signals", "counter_signals", "missing_evidence", "pmf_confidence"],
            "properties": {
                "direct_signals": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "signal": {"type": "string"},
                            "strength": {"type": "string", "enum": ["strong", "moderate", "weak"]},
                            "counter_argument": {"type": "string"},
                        },
                        "required": ["signal", "strength", "counter_argument"],
                    },
                },
                "proxy_signals": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "signal": {"type": "string"},
                            "reliability": {"type": "string", "enum": ["verified", "estimated", "speculative"]},
                        },
                    },
                },
                "counter_signals": {
                    "type": "array", "minItems": 1,
                    "items": {
                        "type": "object",
                        "properties": {
                            "signal": {"type": "string"},
                            "severity": {"type": "string", "enum": ["blocking", "concerning", "minor"]},
                        },
                    },
                },
                "missing_evidence": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "what": {"type": "string"},
                            "how_to_get": {"type": "string"},
                            "impact_if_negative": {"type": "string"},
                        },
                    },
                },
                "pmf_confidence": {
                    "type": "number", "minimum": 0, "maximum": 1,
                    "description": "Overall PMF confidence score",
                },
            },
        },
        "guardrails": [
            "counter_signals array MUST NOT be empty",
            "Every direct_signal must have a counter_argument",
            "Do NOT declare pmf_confidence > 0.7 without strong direct signals",
            "missing_evidence must suggest actionable research methods",
        ],
    }


def _build_blindspot_template(context_excerpt: str) -> dict:
    return {
        "mode": "blindspot",
        "prompt_template": {
            "role": "system",
            "content": (
                "You are a Competitive Intelligence Analyst specializing in blind spot detection. "
                "Use Porter's Five Forces + PESTLE framework for systematic coverage.\n\n"
                "Porter's Five Forces:\n"
                "1. Threat of new entrants\n"
                "2. Bargaining power of suppliers\n"
                "3. Bargaining power of buyers\n"
                "4. Threat of substitutes\n"
                "5. Competitive rivalry\n\n"
                "PESTLE factors: Political, Economic, Social, Technological, Legal, Environmental\n\n"
                "For each blindspot:\n"
                "- Distinguish 'overlooked_known' (publicly available but not addressed) "
                "  from 'speculative_unknown' (genuinely novel threat)\n"
                "- Include 'verifiability': how to confirm/deny this blindspot\n"
                "- Be SPECIFIC: 'EU AI Act compliance gap' > 'regulatory risk'\n"
                "- Hard cap: 5 blindspots maximum"
            ),
        },
        "context_excerpt": context_excerpt[:3000],
        "output_schema": {
            "type": "object",
            "required": ["blindspots", "framework_coverage"],
            "properties": {
                "blindspots": {
                    "type": "array", "maxItems": 5,
                    "items": {
                        "type": "object",
                        "required": ["area", "type", "description", "verifiability", "impact"],
                        "properties": {
                            "area": {"type": "string"},
                            "type": {"type": "string", "enum": ["overlooked_known", "speculative_unknown"]},
                            "description": {"type": "string"},
                            "verifiability": {"type": "string"},
                            "impact": {"type": "string", "enum": ["critical", "high", "medium", "low"]},
                            "porter_force": {"type": "string", "enum": ["new_entrants", "suppliers", "buyers", "substitutes", "rivalry", "N/A"]},
                            "pestle_factor": {"type": "string", "enum": ["political", "economic", "social", "technological", "legal", "environmental", "N/A"]},
                        },
                    },
                },
                "framework_coverage": {
                    "type": "object",
                    "description": "Which Porter/PESTLE dimensions were examined",
                    "properties": {
                        "porter_covered": {"type": "array", "items": {"type": "string"}},
                        "pestle_covered": {"type": "array", "items": {"type": "string"}},
                        "gaps": {"type": "array", "items": {"type": "string"}},
                    },
                },
            },
        },
        "guardrails": [
            "Maximum 5 blindspots — quality over quantity",
            "Each blindspot must be specific and actionable",
            "verifiability field is MANDATORY — no unverifiable claims",
            "Use framework_coverage to ensure systematic analysis, not random brainstorming",
            "ANTI-FABRICATION: unverifiable speculative_unknown items must acknowledge their speculative nature explicitly",
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
        "co_registers_with": "unique-advantage-evaluator",
        "templates": [],
    }

    if mode in ("pmf", "both"):
        result["templates"].append(_build_pmf_template(content))
    if mode in ("blindspot", "both"):
        result["templates"].append(_build_blindspot_template(content))

    return result


def main(argv=None):
    p = argparse.ArgumentParser(prog=TOOL_NAME,
        description="Market Audit — merges PMF validator + competitive blindspot scanner. "
                    "Outputs prompt templates for LLM market analysis.")
    p.add_argument("--context", required=True, metavar="FILE", help="Context file")
    p.add_argument("--mode", choices=["pmf", "blindspot", "both"],
                   default="both", help="Analysis mode (default: both)")
    p.add_argument("--output-format", choices=["json", "yaml"], default="json")
    p.add_argument("--dry-run", action="store_true")
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
