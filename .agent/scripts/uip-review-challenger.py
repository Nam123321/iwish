#!/usr/bin/env python3
"""UIP Review Challenger — Type A+B merged quiz + debiasing tool.

Phase 1 (Type A): Diff analysis + cognitive bias marker detection.
Phase 2 (Type B, --deep): YAML prompt templates for LLM review/analysis.

Modes: quiz | debias | both (default: both)
Exit codes: 0=success, 1=error, 2=partial.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter
from datetime import datetime, timezone

TOOL_NAME = "uip-review-challenger"
VERSION = "1.0.0"

# Bias detection patterns
CERTAINTY_WORDS = re.compile(
    r"\b(definitely|clearly|obviously|certainly|undoubtedly|unquestionably|"
    r"indisputably|absolutely|no\s+question)\b", re.I)

SURVIVORSHIP = re.compile(
    r"\b(successful\s+companies\s+do|best\s+practices?|industry\s+leaders?\s+"
    r"(always|typically)|top\s+performers?\s+(use|adopt|follow))\b", re.I)

PLANNING_FALLACY = re.compile(
    r"\b(should\s+take\s+(about|roughly|around)\s+\d|"
    r"estimated?\s+(at\s+)?\d+\s*(days?|weeks?|hours?|months?|sprints?)|"
    r"will\s+be\s+done\s+(by|in)\s+\d|ETA[:\s]+\d|deadline[:\s]+\d)\b", re.I)

CONFIDENCE_INTERVAL = re.compile(
    r"\b(confidence\s+interval|CI[:\s]|±|plus\s+or\s+minus|"
    r"range\s+of\s+\d.*to\s+\d|best.case.*worst.case)\b", re.I)

TODO_MARKERS = re.compile(r"\b(TODO|FIXME|HACK|XXX|WORKAROUND|KLUDGE)\b")

PRO_MARKERS = re.compile(
    r"\b(benefit|advantage|pro|upside|strength|positive|supports?|confirms?|"
    r"validates?|proves?|enables?)\b", re.I)
CON_MARKERS = re.compile(
    r"\b(drawback|disadvantage|con|downside|weakness|negative|risk|"
    r"counter-?argument|limitation|caveat|concern|issue|problem)\b", re.I)

# Diff parsing
DIFF_FILE = re.compile(r"^(?:diff --git a/|[+\-]{3} [ab]/)(.+)$", re.M)
FUNC_SIG = re.compile(
    r"^[+\-]\s*(?:(?:export\s+)?(?:async\s+)?function\s+(\w+)|"
    r"(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(|"
    r"def\s+(\w+)\s*\(|"
    r"(?:public|private|protected)\s+(?:static\s+)?(?:async\s+)?\w+\s+(\w+)\s*\()", re.M)
IMPORT_PAT = re.compile(
    r"^[+]\s*(?:import\s+.+|from\s+\S+\s+import\s+.+|"
    r"const\s+\{?.+\}?\s*=\s*require\(.+\))", re.M)
DB_SCHEMA = re.compile(
    r"^[+\-]\s*(?:CREATE\s+TABLE|ALTER\s+TABLE|model\s+\w+\s*\{|"
    r"migration\.|\.createTable|\.addColumn|\.removeColumn|"
    r"@Entity|@Column|@ManyTo|@OneToMany)", re.M | re.I)
API_ROUTE = re.compile(
    r"^[+\-]\s*(?:(?:app|router)\.\s*(?:get|post|put|patch|delete)\s*\(|"
    r"@(?:Get|Post|Put|Patch|Delete)\s*\(|"
    r"export\s+(?:async\s+)?function\s+(?:GET|POST|PUT|PATCH|DELETE))", re.M | re.I)
DEP_CHANGE = re.compile(r'^([+\-])\s*"(\S+)":\s*"[^"]*"', re.M)


def _read(path):
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError as e:
        print(json.dumps({"tool": TOOL_NAME, "error": str(e)}), file=sys.stderr)
        sys.exit(1)


def _unique(matches):
    seen, result = set(), []
    for m in matches:
        val = m if isinstance(m, str) else next((g for g in m if g), "")
        if val and val not in seen:
            seen.add(val)
            result.append(val)
    return result


# --- Phase 1: Quiz ---
def analyze_diff(content):
    files = _unique(DIFF_FILE.findall(content))
    funcs = _unique(FUNC_SIG.findall(content))
    imports = [m.strip().lstrip("+").strip() for m in IMPORT_PAT.findall(content)]
    db_changes = [m.strip().lstrip("+-").strip() for m in DB_SCHEMA.findall(content)]
    api_changes = [m.strip().lstrip("+-").strip() for m in API_ROUTE.findall(content)]
    added, removed = [], []
    for line in content.splitlines():
        m = DEP_CHANGE.match(line)
        if m:
            (added if m.group(1) == "+" else removed).append(m.group(2))

    ext_count = Counter(os.path.splitext(f)[1] or "(no ext)" for f in files)
    return {
        "changed_files": files[:50], "changed_file_count": len(files),
        "file_type_breakdown": dict(ext_count.most_common(15)),
        "modified_functions": funcs[:30],
        "new_imports": list(dict.fromkeys(imports))[:30],
        "db_schema_changes": list(dict.fromkeys(db_changes))[:15],
        "api_route_changes": list(dict.fromkeys(api_changes))[:15],
        "added_dependencies": list(dict.fromkeys(added)),
        "removed_dependencies": list(dict.fromkeys(removed)),
    }


def quiz_findings(ds):
    findings = []
    if ds["db_schema_changes"]:
        findings.append({"id": "QUIZ-DB-SCHEMA", "severity": "high",
                         "message": f"DB schema changes ({len(ds['db_schema_changes'])}). Verify migration safety."})
    if ds["api_route_changes"]:
        findings.append({"id": "QUIZ-API-ROUTES", "severity": "high",
                         "message": f"API route changes ({len(ds['api_route_changes'])}). Check backward compat."})
    if ds["added_dependencies"]:
        findings.append({"id": "QUIZ-NEW-DEPS", "severity": "medium",
                         "message": f"New deps: {', '.join(ds['added_dependencies'][:5])}. Check licenses."})
    if ds["changed_file_count"] > 20:
        findings.append({"id": "QUIZ-LARGE-DIFF", "severity": "medium",
                         "message": f"Large changeset ({ds['changed_file_count']} files). Consider splitting."})
    if not findings:
        findings.append({"id": "QUIZ-CLEAN", "severity": "info",
                         "message": "No high-risk diff patterns detected."})
    return findings


# --- Phase 1: Debias ---
def analyze_biases(content):
    markers, findings = [], []

    cert = CERTAINTY_WORDS.findall(content)
    if cert:
        c = Counter(w.lower() for w in cert)
        markers.append({"type": "certainty_inflation", "count": len(cert), "examples": dict(c.most_common(5))})
        findings.append({"id": "BIAS-CERTAINTY", "severity": "medium",
                         "message": f"Certainty inflation ({len(cert)} instances): '{c.most_common(1)[0][0]}'"})

    surv = SURVIVORSHIP.findall(content)
    if surv:
        markers.append({"type": "survivorship_bias", "count": len(surv)})
        findings.append({"id": "BIAS-SURVIVORSHIP", "severity": "medium",
                         "message": f"Survivorship bias ({len(surv)} instances)"})

    timeline = PLANNING_FALLACY.findall(content)
    has_ci = bool(CONFIDENCE_INTERVAL.search(content))
    if timeline and not has_ci:
        markers.append({"type": "planning_fallacy", "estimates": len(timeline), "has_confidence_intervals": False})
        findings.append({"id": "BIAS-PLANNING", "severity": "high",
                         "message": f"Planning fallacy: {len(timeline)} timeline estimate(s) without confidence intervals"})

    pro = len(PRO_MARKERS.findall(content))
    con = len(CON_MARKERS.findall(content))
    total = pro + con
    if total >= 4:
        ratio = pro / total
        markers.append({"type": "confirmation_bias", "pro": pro, "con": con, "ratio": round(ratio, 3)})
        if ratio > 0.80:
            findings.append({"id": "BIAS-CONFIRMATION", "severity": "high",
                             "message": f"Confirmation bias: {pro} pro vs {con} con ({ratio:.0%} pro)"})

    todos = TODO_MARKERS.findall(content)
    if todos:
        c = Counter(todos)
        markers.append({"type": "shortcuts", "count": len(todos), "breakdown": dict(c)})
        if len(todos) >= 5:
            findings.append({"id": "BIAS-SHORTCUTS", "severity": "medium",
                             "message": f"High shortcut markers ({len(todos)}): {dict(c)}"})

    if not findings:
        findings.append({"id": "DEBIAS-CLEAN", "severity": "info", "message": "No significant bias markers detected."})
    return markers, findings


# --- Phase 2: Deep Prompts ---
def gen_quiz_prompt(ds, findings):
    files_yaml = "\n".join(f"    - {f}" for f in ds["changed_files"][:20]) or "    - (none)"
    funcs_yaml = "\n".join(f"    - {f}" for f in ds["modified_functions"][:15]) or "    - (none)"
    return f"""---
tool: {TOOL_NAME}
mode: quiz
phase: B
prompt: |
  You are a senior code reviewer. Generate 5-7 specific review questions
  grounded in the diff summary below. Each question must reference a specific
  file or function by name.
diff_summary:
  changed_file_count: {ds['changed_file_count']}
  changed_files:
{files_yaml}
  modified_functions:
{funcs_yaml}
  db_schema_changes: {json.dumps(ds['db_schema_changes'][:10])}
  api_route_changes: {json.dumps(ds['api_route_changes'][:10])}
  added_deps: {json.dumps(ds['added_dependencies'][:10])}
guardrails:
  - Do NOT fabricate file names not in the diff_summary
  - Every question must have a concrete target_file
  - At least 1 question per DB/API change if present
"""


def gen_debias_prompt(markers, findings):
    markers_json = json.dumps(markers, indent=2)
    return f"""---
tool: {TOOL_NAME}
mode: debias
phase: B
prompt: |
  You are a cognitive bias analyst. Examine the document for structural biases
  Phase 1 regex cannot detect: sunk cost, groupthink, availability bias,
  Dunning-Kruger, framing effects. Score document objectivity 1-10.
phase1_markers: {markers_json}
guardrails:
  - Validate each Phase 1 marker (genuine vs false positive)
  - Identify at least 2 higher-order biases with evidence
  - objectivity_score: 1-3=heavily biased, 4-6=moderate, 7-9=objective, 10=exceptional
"""


def main():
    p = argparse.ArgumentParser(prog=TOOL_NAME,
        description="Review Challenger — merged quiz + debiasing analysis.")
    p.add_argument("--context", required=True, metavar="FILE")
    p.add_argument("--mode", choices=["quiz", "debias", "both"], default="both")
    p.add_argument("--deep", action="store_true", help="Phase 2 LLM prompt")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    if not os.path.isfile(args.context):
        print(json.dumps({"tool": TOOL_NAME, "error": f"Not found: {args.context}"}))
        return 1

    if args.dry_run:
        print(json.dumps({"tool": TOOL_NAME, "dry_run": True, "mode": args.mode,
                          "deep": args.deep, "context_file": args.context}, indent=2))
        return 0

    content = _read(args.context)
    result = {"tool": TOOL_NAME, "version": VERSION, "mode": args.mode, "phase": "A",
              "context_file": args.context, "timestamp": datetime.now(timezone.utc).isoformat()}

    all_findings = []
    if args.mode in ("quiz", "both"):
        ds = analyze_diff(content)
        result["diff_summary"] = ds
        all_findings.extend(quiz_findings(ds))
    if args.mode in ("debias", "both"):
        markers, bf = analyze_biases(content)
        result["bias_markers"] = markers
        all_findings.extend(bf)

    result["findings"] = all_findings
    result["finding_count"] = len(all_findings)
    result["severity_summary"] = dict(Counter(f["severity"] for f in all_findings))

    print(json.dumps(result, indent=2))

    if args.deep:
        print("\n---")
        if args.mode in ("quiz", "both"):
            print(gen_quiz_prompt(result.get("diff_summary", {}),
                                  [f for f in all_findings if f["id"].startswith("QUIZ")]))
        if args.mode in ("debias", "both"):
            print(gen_debias_prompt(result.get("bias_markers", []),
                                    [f for f in all_findings if f["id"].startswith("BIAS")]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
