#!/usr/bin/env python3
"""UIP Tech Stack Auditor — Type A+B technology dependency audit tool.

Phase 1 (Type A): Parse dependency files, check version pinning, count deps,
    detect lockfiles, analyze tech mix. Deterministic JSON output.
Phase 2 (Type B, --deep): YAML prompt template for architectural fit evaluation.

Exit codes: 0=success, 1=fatal error, 2=partial results.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

TOOL_NAME = "uip-tech-stack-audit"
VERSION = "1.0.0"

# Supported dependency files and their ecosystems
DEP_FILES = {
    "package.json": "node",
    "requirements.txt": "python",
    "Pipfile": "python",
    "pyproject.toml": "python",
    "Cargo.toml": "rust",
    "go.mod": "go",
    "Gemfile": "ruby",
    "pubspec.yaml": "dart",
    "composer.json": "php",
    "build.gradle": "java",
    "pom.xml": "java",
}

LOCKFILES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb",
    "Pipfile.lock", "poetry.lock", "uv.lock",
    "Cargo.lock", "go.sum", "Gemfile.lock",
    "pubspec.lock", "composer.lock",
}

# Version pinning patterns for node
_EXACT_PIN = re.compile(r"^\d+\.\d+\.\d+$")
_CARET_PIN = re.compile(r"^\^")
_TILDE_PIN = re.compile(r"^~")
_STAR_PIN = re.compile(r"^\*|latest|>=")

# Known high-risk patterns
HIGH_RISK_DEPS = {
    "node": {"eval", "exec", "child_process", "vm2", "safe-eval", "serialize-javascript"},
    "python": {"pickle", "eval", "exec", "os.system", "subprocess"},
}


def _read_json(path: str) -> dict | None:
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return None


def _read_lines(path: str) -> list[str]:
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            return f.readlines()
    except OSError:
        return []


def _analyze_package_json(filepath: str) -> dict:
    """Analyze a Node.js package.json."""
    data = _read_json(filepath)
    if not data:
        return {"error": f"Cannot parse: {filepath}"}

    deps = data.get("dependencies", {})
    dev_deps = data.get("devDependencies", {})
    all_deps = {**deps, **dev_deps}

    pinning = {"exact": 0, "caret": 0, "tilde": 0, "loose": 0, "other": 0}
    findings = []

    for name, version in all_deps.items():
        v = str(version).strip()
        if _EXACT_PIN.match(v):
            pinning["exact"] += 1
        elif _CARET_PIN.match(v):
            pinning["caret"] += 1
        elif _TILDE_PIN.match(v):
            pinning["tilde"] += 1
        elif _STAR_PIN.match(v):
            pinning["loose"] += 1
            findings.append({
                "id": "TSA-LOOSE-PIN",
                "severity": "medium",
                "dep": name,
                "version": v,
                "message": f"Loosely pinned dependency '{name}': '{v}'. Risk of breaking changes.",
            })
        else:
            pinning["other"] += 1

    # Check for known risky deps
    for dep_name in all_deps:
        if dep_name.lower() in HIGH_RISK_DEPS.get("node", set()):
            findings.append({
                "id": "TSA-RISKY-DEP",
                "severity": "high",
                "dep": dep_name,
                "message": f"High-risk dependency '{dep_name}' detected — security review required.",
            })

    total = len(all_deps)
    exact_pct = (pinning["exact"] / total * 100) if total else 0
    pinning_score = round(exact_pct + (pinning["tilde"] / total * 50) if total else 0, 1)

    if total > 100:
        findings.append({
            "id": "TSA-DEP-BLOAT",
            "severity": "medium",
            "message": f"Large dependency count: {total} packages. Consider dependency audit.",
        })

    # Check for engines/node version
    engines = data.get("engines", {})
    if not engines:
        findings.append({
            "id": "TSA-NO-ENGINES",
            "severity": "low",
            "message": "No 'engines' field in package.json — Node.js version not constrained.",
        })

    return {
        "ecosystem": "node",
        "file": filepath,
        "total_deps": len(deps),
        "total_dev_deps": len(dev_deps),
        "total_all": total,
        "pinning": pinning,
        "pinning_score": pinning_score,
        "engines": engines,
        "findings": findings,
    }


def _analyze_requirements_txt(filepath: str) -> dict:
    """Analyze a Python requirements.txt."""
    lines = _read_lines(filepath)
    deps = []
    pinning = {"exact": 0, "range": 0, "unpinned": 0}
    findings = []

    for line in lines:
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("-"):
            continue
        if "==" in line:
            pinning["exact"] += 1
            name = line.split("==")[0].strip()
        elif ">=" in line or "<=" in line or "~=" in line:
            pinning["range"] += 1
            name = re.split(r"[><=~!]", line)[0].strip()
        else:
            pinning["unpinned"] += 1
            name = line.strip()
            findings.append({
                "id": "TSA-UNPINNED",
                "severity": "medium",
                "dep": name,
                "message": f"Unpinned dependency '{name}' — non-reproducible builds.",
            })
        deps.append(name)

    total = len(deps)
    pinning_score = round((pinning["exact"] / total * 100) if total else 0, 1)

    return {
        "ecosystem": "python",
        "file": filepath,
        "total_deps": total,
        "pinning": pinning,
        "pinning_score": pinning_score,
        "findings": findings,
    }


def scan_project(project_dir: str) -> dict:
    """Scan project directory for dependency files and analyze them."""
    root = Path(project_dir)
    result = {
        "tool": TOOL_NAME,
        "version": VERSION,
        "phase": "A",
        "project_dir": str(root),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "dependency_files": [],
        "lockfiles_found": [],
        "lockfiles_missing": [],
        "ecosystems": [],
        "total_deps": 0,
        "overall_pinning_score": 0,
        "tech_mix_count": 0,
        "findings": [],
    }

    # Find dependency files
    ecosystems = set()
    dep_analyses = []

    for dep_file, ecosystem in DEP_FILES.items():
        # Check root and common subdirs
        for search_dir in [root, root / "frontend", root / "backend", root / "api", root / "server"]:
            path = search_dir / dep_file
            if path.exists():
                ecosystems.add(ecosystem)
                if dep_file == "package.json":
                    analysis = _analyze_package_json(str(path))
                elif dep_file == "requirements.txt":
                    analysis = _analyze_requirements_txt(str(path))
                else:
                    analysis = {"ecosystem": ecosystem, "file": str(path), "note": "Parser not implemented — file exists"}
                dep_analyses.append(analysis)
                result["dependency_files"].append(str(path.relative_to(root)))

    # Check lockfiles
    for lockfile in LOCKFILES:
        for search_dir in [root, root / "frontend", root / "backend"]:
            if (search_dir / lockfile).exists():
                result["lockfiles_found"].append(lockfile)
                break

    # Determine missing lockfiles
    if "node" in ecosystems and not any(lf in result["lockfiles_found"] for lf in
                                        ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb"]):
        result["lockfiles_missing"].append("node lockfile")
        result["findings"].append({
            "id": "TSA-NO-LOCKFILE",
            "severity": "high",
            "message": "No Node.js lockfile found. Builds are non-reproducible.",
        })

    if "python" in ecosystems and not any(lf in result["lockfiles_found"] for lf in
                                          ["Pipfile.lock", "poetry.lock", "uv.lock"]):
        result["lockfiles_missing"].append("python lockfile")
        result["findings"].append({
            "id": "TSA-NO-LOCKFILE-PY",
            "severity": "medium",
            "message": "No Python lockfile found. Consider using poetry/uv for reproducible builds.",
        })

    # Aggregate
    result["ecosystems"] = sorted(ecosystems)
    result["tech_mix_count"] = len(ecosystems)

    total_deps = sum(a.get("total_all", a.get("total_deps", 0)) for a in dep_analyses)
    result["total_deps"] = total_deps

    pinning_scores = [a["pinning_score"] for a in dep_analyses if "pinning_score" in a]
    result["overall_pinning_score"] = round(sum(pinning_scores) / len(pinning_scores), 1) if pinning_scores else 0

    # Collect all findings from sub-analyses
    for a in dep_analyses:
        result["findings"].extend(a.get("findings", []))

    # Tech mix warning
    if len(ecosystems) > 3:
        result["findings"].append({
            "id": "TSA-TECH-MIX",
            "severity": "medium",
            "message": f"High technology mix: {len(ecosystems)} ecosystems ({', '.join(sorted(ecosystems))}). "
                       "Increases maintenance burden and onboarding complexity.",
        })

    # Check for common infra files
    infra_checks = {
        ".env.example": "Environment template",
        "docker-compose.yml": "Docker Compose",
        "Dockerfile": "Docker",
        ".github/workflows": "GitHub Actions CI/CD",
        "jest.config.js": "Jest testing",
        "vitest.config.ts": "Vitest testing",
        "pytest.ini": "Pytest",
        "tsconfig.json": "TypeScript",
        ".eslintrc.js": "ESLint",
        ".prettierrc": "Prettier",
    }
    infra_present = []
    infra_missing_critical = []
    for file, label in infra_checks.items():
        p = root / file
        if p.exists() or (p.is_dir() and any(p.iterdir())):
            infra_present.append(label)

    if "Docker" not in infra_present and "Docker Compose" not in infra_present:
        infra_missing_critical.append("containerization")
    if not any(t in infra_present for t in ["Jest testing", "Vitest testing", "Pytest"]):
        infra_missing_critical.append("test framework")
        result["findings"].append({
            "id": "TSA-NO-TESTS",
            "severity": "high",
            "message": "No test framework configuration detected.",
        })
    if "GitHub Actions CI/CD" not in infra_present:
        infra_missing_critical.append("CI/CD pipeline")

    result["infrastructure"] = {
        "present": infra_present,
        "missing_critical": infra_missing_critical,
    }

    # Risk level
    high_count = sum(1 for f in result["findings"] if f.get("severity") == "high")
    med_count = sum(1 for f in result["findings"] if f.get("severity") == "medium")
    if high_count >= 3:
        result["risk_level"] = "high"
    elif high_count >= 1 or med_count >= 3:
        result["risk_level"] = "medium"
    else:
        result["risk_level"] = "low"

    result["analysis_details"] = dep_analyses
    return result


def build_phase_b(phase1: dict) -> str:
    """Return YAML prompt template for deep architectural fit analysis."""
    try:
        import yaml
    except ImportError:
        return "# PyYAML not installed — Phase B skipped"

    deep = {
        "tool": TOOL_NAME, "phase": "B",
        "prompt_template": {
            "role": "system",
            "content": (
                "You are a senior solutions architect evaluating the technology stack "
                "for a software project. Phase 1 deterministic analysis has already "
                "scanned dependency files and produced the findings below. Your task is "
                "to evaluate ARCHITECTURAL FIT, TEAM CAPABILITY ALIGNMENT, and identify "
                "MISSING INFRASTRUCTURE that the file-parsing pass cannot detect. "
                "Do NOT repeat Phase 1 findings — focus on strategic technology assessment."
            ),
        },
        "context_data": {
            "ecosystems": phase1.get("ecosystems", []),
            "total_deps": phase1.get("total_deps", 0),
            "pinning_score": phase1.get("overall_pinning_score", 0),
            "risk_level": phase1.get("risk_level", "unknown"),
            "infrastructure": phase1.get("infrastructure", {}),
            "top_findings": phase1.get("findings", [])[:10],
        },
        "output_schema": {
            "type": "object",
            "required": ["architectural_fit", "missing_infrastructure", "recommendations"],
            "properties": {
                "architectural_fit": {
                    "type": "object",
                    "properties": {
                        "score": {"type": "integer", "minimum": 1, "maximum": 10},
                        "rationale": {"type": "string"},
                        "concerns": {"type": "array", "items": {"type": "string"}},
                    },
                },
                "missing_infrastructure": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "category": {"type": "string", "enum": ["observability", "security", "ci_cd", "containerization", "documentation"]},
                            "description": {"type": "string"},
                            "priority": {"type": "string", "enum": ["critical", "recommended", "nice_to_have"]},
                        },
                    },
                },
                "recommendations": {
                    "type": "array", "maxItems": 5,
                    "items": {"type": "string"},
                },
            },
        },
        "guardrails": [
            "Do NOT repeat Phase 1 findings — focus on what file parsing cannot detect.",
            "Score architectural fit relative to the project's stated goals, not absolute standards.",
            "Missing infrastructure assessment must distinguish critical vs nice-to-have.",
            "Limit recommendations to top 5 most impactful changes.",
        ],
    }
    return yaml.dump(deep, default_flow_style=False, sort_keys=False, width=120)


def main(argv=None):
    p = argparse.ArgumentParser(prog=TOOL_NAME,
        description="Tech stack auditor. Phase 1: dependency analysis. Phase 2 (--deep): architectural fit.")
    p.add_argument("--project-dir", required=True, metavar="DIR", help="Project root directory")
    p.add_argument("--deep", action="store_true", help="Enable Phase 2 LLM prompt")
    p.add_argument("--dry-run", action="store_true", help="Validate inputs only")
    args = p.parse_args(argv)

    project = os.path.abspath(args.project_dir)
    if not os.path.isdir(project):
        print(json.dumps({"tool": TOOL_NAME, "error": f"Not a directory: {project}"}))
        return 1

    if args.dry_run:
        print(json.dumps({"tool": TOOL_NAME, "dry_run": True,
                          "project_dir": project, "deep": args.deep, "status": "ready"}, indent=2))
        return 0

    result = scan_project(project)
    print(json.dumps(result, indent=2, default=str))

    if args.deep:
        print("\n---")
        print(build_phase_b(result))

    return 0


if __name__ == "__main__":
    sys.exit(main())
