#!/usr/bin/env python3
"""UIP FMEA Scanner — Type A+B failure mode & effects analysis tool.

Phase 1 (Type A): Deterministic regex-based analysis for error-handling patterns,
    risk indicators, integration points, and missing-test signals. Computes RPN.
Phase 2 (Type B, --deep): YAML prompt template for LLM reasoning.

Exit codes: 0=success, 1=fatal error, 2=partial results.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from typing import Any

SEVERITY_RUBRIC = {
    "9-10": "Data loss, security breach, financial impact",
    "7-8": "Feature completely broken for all users",
    "5-6": "Degraded experience, workaround exists",
    "3-4": "Cosmetic issue, minor inconvenience",
    "1-2": "Negligible impact",
}

OCCURRENCE_RUBRIC = {
    "9-10": "Almost certain on every execution / very common path",
    "7-8": "Occurs frequently under normal usage",
    "5-6": "Occasional — specific conditions trigger it",
    "3-4": "Uncommon — edge-case or unusual input required",
    "1-2": "Extremely rare — theoretical or near-impossible",
}

DETECTION_RUBRIC = {
    "9-10": "No monitoring, no tests, no alerting — failure is silent",
    "7-8": "Minimal logging; only caught by user report",
    "5-6": "Some logging but no automated test covers the path",
    "3-4": "Automated tests exist but coverage is incomplete",
    "1-2": "Comprehensive tests + monitoring + alerting in place",
}

_ERROR_PATTERNS = [
    re.compile(r"\b(try|catch|except|finally|rescue|recover)\b", re.I),
    re.compile(r"\b(throw|raise|panic)\b", re.I),
    re.compile(r"\breturn\s+(\{?\s*error|err|null|nil|None|false)\b", re.I),
    re.compile(r"\.(catch|on_error|on_failure)\s*\(", re.I),
]

_RISK_KW = re.compile(
    r"\b(critical|failure|risk|edge[\s_-]?case|fallback|crash|timeout|"
    r"deadlock|race[\s_-]?condition|overflow|security|vulnerability|"
    r"data[\s_-]?loss|corrupt|breach)\b", re.I,
)

_INTEGRATION = [
    re.compile(r"\b(fetch|axios|http|request|api[_\s]?call|REST|graphql)\b", re.I),
    re.compile(r"\b(SELECT|INSERT|UPDATE|DELETE|CREATE\s+TABLE|DROP)\b"),
    re.compile(r"\b(prisma|sequelize|typeorm|mongoose|sqlalchemy|knex)\b", re.I),
    re.compile(r"\b(redis|kafka|rabbitmq|sqs|sns|pubsub|websocket|grpc)\b", re.I),
    re.compile(r"\b(supabase|firebase|aws|gcp|azure)\b", re.I),
    re.compile(r"\b(smtp|sendgrid|twilio|stripe|paypal)\b", re.I),
]

_FUNC_DEF = re.compile(
    r"(?:^|\s)(?:function|def|fn|func|async\s+function|const\s+\w+\s*=\s*(?:async\s*)?\()"
    r"\s*(\w+)?", re.M,
)

_TEST_REF = re.compile(
    r"\b(test|spec|it\(|describe\(|expect\(|assert|should|jest|mocha|pytest|unittest)\b", re.I,
)


def _clamp(v: int, lo: int = 1, hi: int = 10) -> int:
    return max(lo, min(hi, v))


def _read(path: str) -> str:
    for enc in ("utf-8", "latin-1"):
        try:
            with open(path, encoding=enc) as f:
                return f.read()
        except UnicodeDecodeError:
            continue
    raise OSError(f"Cannot decode: {path}")


class Finding:
    __slots__ = ("failure_mode", "severity", "occurrence", "detection",
                 "rpn", "evidence_location", "evidence_snippet", "category")

    def __init__(self, failure_mode, severity, occurrence, detection,
                 evidence_location, evidence_snippet="", category="general"):
        self.failure_mode = failure_mode
        self.severity = _clamp(severity)
        self.occurrence = _clamp(occurrence)
        self.detection = _clamp(detection)
        self.rpn = self.severity * self.occurrence * self.detection
        self.evidence_location = evidence_location
        self.evidence_snippet = evidence_snippet
        self.category = category

    def to_dict(self) -> dict:
        return {
            "failure_mode": self.failure_mode,
            "severity": self.severity, "occurrence": self.occurrence,
            "detection": self.detection, "rpn": self.rpn,
            "evidence_location": self.evidence_location,
            "evidence_snippet": self.evidence_snippet[:200],
            "category": self.category,
        }


def _analyse_errors(lines, filepath):
    findings = []
    has_handling = False
    for idx, line in enumerate(lines, 1):
        for pat in _ERROR_PATTERNS:
            if pat.search(line):
                has_handling = True
    if not has_handling:
        findings.append(Finding("No error handling detected", 8, 7, 8, filepath,
                                "No try/catch/except patterns found", "error_handling"))
    else:
        for idx, line in enumerate(lines, 1):
            s = line.strip()
            if re.match(r"^(catch|except)\s*(\(\s*\))?\s*[:{]?\s*$", s, re.I):
                findings.append(Finding("Bare catch/except — errors silently swallowed",
                                        7, 5, 6, f"{filepath}:{idx}", s, "error_handling"))
    return findings


def _analyse_risks(lines, filepath):
    findings = []
    for idx, line in enumerate(lines, 1):
        for kw in _RISK_KW.findall(line):
            kl = kw.lower().replace(" ", "_").replace("-", "_")
            sev = 7 if kl in ("critical", "security", "vulnerability", "data_loss", "breach", "corrupt") else 5
            findings.append(Finding(f"Risk indicator '{kw}'", sev, 5, 5,
                                    f"{filepath}:{idx}", line.strip()[:200], "risk_indicator"))
    return findings


def _analyse_integrations(lines, filepath):
    findings, seen = [], set()
    for idx, line in enumerate(lines, 1):
        for pat in _INTEGRATION:
            m = pat.search(line)
            if m:
                tok = m.group(0).lower()
                if tok not in seen:
                    seen.add(tok)
                    findings.append(Finding(f"Integration '{m.group(0)}' — external dependency",
                                            6, 5, 6, f"{filepath}:{idx}", line.strip()[:200],
                                            "integration_point"))
    return findings


def _analyse_tests(lines, filepath):
    findings = []
    content = "\n".join(lines)
    has_tests = bool(_TEST_REF.search(content))
    funcs = [(m.group(1), idx) for idx, line in enumerate(lines, 1)
             for m in [_FUNC_DEF.search(line)] if m and m.group(1)]
    if funcs and not has_tests:
        findings.append(Finding(f"{len(funcs)} function(s) with no test references",
                                5, 6, 8, filepath,
                                ", ".join(f for f, _ in funcs[:10]), "missing_tests"))
    return findings


def run_phase1(filepath):
    content = _read(filepath)
    lines = content.splitlines()
    all_findings, partial = [], False
    for analyser in (_analyse_errors, _analyse_risks, _analyse_integrations, _analyse_tests):
        try:
            all_findings.extend(analyser(lines, filepath))
        except Exception as exc:
            partial = True
            all_findings.append(Finding(f"Analyser {analyser.__name__} failed: {exc}",
                                        3, 2, 2, filepath, category="scanner_error"))
    all_findings.sort(key=lambda f: f.rpn, reverse=True)
    return {
        "tool": "uip-fmea-scanner", "version": "1.0.0", "phase": "A",
        "context_file": filepath, "total_lines": len(lines),
        "findings_count": len(all_findings),
        "max_rpn": all_findings[0].rpn if all_findings else 0,
        "findings": [f.to_dict() for f in all_findings],
    }, partial


def build_phase_b(phase1):
    try:
        import yaml
    except ImportError:
        return "# PyYAML not installed — Phase B skipped"
    deep = {
        "tool": "uip-fmea-scanner", "phase": "B",
        "prompt_template": {
            "role": "system",
            "content": (
                "You are a senior reliability engineer performing FMEA. "
                "A deterministic scanner identified the findings below. "
                "Identify ADDITIONAL failure modes the regex pass missed — "
                "logical errors, race conditions, state bugs, business-rule violations. "
                "Assign S, O, D scores using the rubrics. Compute RPN = S × O × D. "
                "Focus on failure modes NOT already listed."
            ),
        },
        "context_data": {
            "context_file": phase1["context_file"],
            "total_lines": phase1["total_lines"],
            "findings_count": phase1["findings_count"],
            "top_findings": phase1["findings"][:10],
        },
        "output_schema": {
            "type": "object",
            "required": ["additional_findings"],
            "properties": {
                "additional_findings": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["failure_mode", "severity", "occurrence", "detection", "rpn", "rationale"],
                        "properties": {
                            "failure_mode": {"type": "string"},
                            "severity": {"type": "integer", "minimum": 1, "maximum": 10},
                            "occurrence": {"type": "integer", "minimum": 1, "maximum": 10},
                            "detection": {"type": "integer", "minimum": 1, "maximum": 10},
                            "rpn": {"type": "integer"},
                            "rationale": {"type": "string"},
                            "mitigation": {"type": "string"},
                        },
                    },
                },
            },
        },
        "guardrails": {
            "severity_rubric": SEVERITY_RUBRIC,
            "occurrence_rubric": OCCURRENCE_RUBRIC,
            "detection_rubric": DETECTION_RUBRIC,
            "constraints": [
                "S, O, D MUST be integers in [1, 10].",
                "RPN MUST equal S × O × D exactly.",
                "Do NOT duplicate findings from context_data.",
                "Provide one-sentence rationale per score.",
            ],
        },
    }
    return yaml.dump(deep, default_flow_style=False, sort_keys=False, width=120)


def main(argv=None):
    p = argparse.ArgumentParser(prog="uip-fmea-scanner",
        description="FMEA scanner for story/spec/architecture files. "
                    "Phase 1: structured JSON. Phase 2 (--deep): YAML prompt template.")
    p.add_argument("--context", required=True, metavar="FILE", help="File to analyse")
    p.add_argument("--deep", action="store_true", help="Enable Phase 2 LLM prompt")
    p.add_argument("--dry-run", action="store_true", help="Validate inputs only")
    args = p.parse_args(argv)

    path = os.path.abspath(args.context)
    if not os.path.isfile(path):
        print(json.dumps({"tool": "uip-fmea-scanner", "error": f"Not found: {path}"}))
        return 1

    if args.dry_run:
        print(json.dumps({"tool": "uip-fmea-scanner", "dry_run": True,
                          "context_file": path, "deep": args.deep, "status": "ready"}, indent=2))
        return 0

    result, partial = run_phase1(path)
    print(json.dumps(result, indent=2))

    if args.deep:
        print("\n---")
        print(build_phase_b(result))

    return 2 if partial else 0


if __name__ == "__main__":
    sys.exit(main())
