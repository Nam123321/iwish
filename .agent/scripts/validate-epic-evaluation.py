#!/usr/bin/env python3
import os, sys
# --- [Watchmen Core Injection] ---
_script_dir = os.path.dirname(os.path.abspath(__file__))
_agent_dir = os.path.abspath(os.path.join(_script_dir, ".."))
if _agent_dir not in sys.path:
    sys.path.insert(0, _agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass # Ignore for environment without watchmen_core, let the system handle it
# ---------------------------------

"""
Epic Evaluation Gate - zero-trust preflight for /make-story.

This validator checks whether an Epic has a current evaluation passport before
story authoring is allowed. It intentionally validates evidence contracts and
content hashes, not agent promises.
"""

import argparse
import hashlib
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path.cwd()
DEV_ROOT = ROOT / "_iwish-output" / "3. Development" / "1. Epic & Story"
PLANNING_ROOT = ROOT / "_iwish-output" / "2. Product Planning"
EVAL_ROOT = ROOT / "_iwish-output" / "epic-evaluations"
REPORT_ROOT = ROOT / "_iwish-output" / "unknowns" / "reports"

ALLOWED_INTEGRITY = {"VERIFIED"}
ALLOWED_READINESS = {"READY", "CONDITIONAL"}
ENVELOPE_ORDER = ["NONE", "AUTHOR_ONLY", "INVESTIGATE", "IMPLEMENT", "RELEASE"]


def sha256_file(path):
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def canonical_epic_id(value):
    raw = str(value).strip()
    raw = re.sub(r"^Epic-", "", raw, flags=re.IGNORECASE)
    return raw


def find_epic_dir(epic_id):
    target = f"Epic-{canonical_epic_id(epic_id)}".lower()
    if not DEV_ROOT.exists():
        return None
    candidates = sorted(
        path for path in DEV_ROOT.glob("*/Epic-*")
        if path.is_dir() and path.name.lower() == target
    )
    # Reconciliation artifacts can create an evidence-only Epic directory in a
    # second Feature Group. A canonical Epic must own an epic.md; otherwise the
    # preflight could bind a new story to a ghost directory instead of its SSOT.
    for path in candidates:
        if (path / "epic.md").is_file():
            return path
    for path in candidates:
        if path.is_dir():
            return path
    return None


def derive_fg(epic_dir):
    if epic_dir and epic_dir.parent != DEV_ROOT:
        return epic_dir.parent.name
    return None


def context_files(epic_dir):
    candidates = [
        PLANNING_ROOT / "2.1. product-brief-or-prd.md",
        PLANNING_ROOT / "2.4. epics-and-stories.md",
        PLANNING_ROOT / "2.5. feature-hierarchy.md",
    ]
    if epic_dir:
        candidates.append(epic_dir / "epic.md")
    return [p for p in candidates if p.exists()]


def context_digest(files):
    payload = []
    for path in sorted(files, key=lambda p: str(p)):
        payload.append({
            "path": str(path.relative_to(ROOT)),
            "sha256": sha256_file(path),
        })
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()
    return digest, payload


def passport_path(epic_id):
    return EVAL_ROOT / f"Epic-{canonical_epic_id(epic_id)}" / "evaluation-passport.json"


def load_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise ValueError(f"{path} is not valid JSON: {exc}") from exc


def receipt_exists(receipt):
    if not isinstance(receipt, dict):
        return False
    path = receipt.get("path")
    digest = receipt.get("sha256")
    if not path or not digest:
        return False
    receipt_path = ROOT / path
    return receipt_path.exists() and sha256_file(receipt_path) == digest


def validate(epic_id, required_phase="AUTHOR_ONLY"):
    epic_id = canonical_epic_id(epic_id)
    epic_dir = find_epic_dir(epic_id)
    files = context_files(epic_dir)
    actual_digest, actual_files = context_digest(files)
    path = passport_path(epic_id)
    errors = []
    warnings = []

    if not epic_dir:
        errors.append(f"Epic-{epic_id} directory not found under {DEV_ROOT}")
    if not path.exists():
        errors.append(f"Evaluation passport missing: {path}")
        return {
            "status": "FAIL",
            "epic_id": f"Epic-{epic_id}",
            "fg": derive_fg(epic_dir),
            "passport": str(path.relative_to(ROOT)),
            "context_digest": actual_digest,
            "context_files": actual_files,
            "errors": errors,
            "warnings": warnings,
            "next_action": "Run Party Mode + Unknowns full evaluation for this FG/Epic, save a passport, approve that exact digest, then rerun this validator.",
        }

    try:
        data = load_json(path)
    except ValueError as exc:
        errors.append(str(exc))
        data = {}

    if data.get("schema_version") != "epic-evaluation-passport/v1":
        errors.append("schema_version must be epic-evaluation-passport/v1")
    if canonical_epic_id(data.get("epic_id", "")) != epic_id:
        errors.append("passport epic_id does not match requested epic")
    if derive_fg(epic_dir) and data.get("feature_group") != derive_fg(epic_dir):
        errors.append("passport feature_group does not match current Epic folder")
    if data.get("context_digest") != actual_digest:
        errors.append("context_digest is stale or invalid for current PRD/FG/Epic inputs")
    if data.get("evaluation_integrity") not in ALLOWED_INTEGRITY:
        errors.append("evaluation_integrity must be VERIFIED")
    if data.get("epic_readiness") not in ALLOWED_READINESS:
        errors.append("epic_readiness must be READY or CONDITIONAL")

    envelope = data.get("story_creation_envelope", {})
    max_phase = envelope.get("max_phase", "NONE")
    if max_phase not in ENVELOPE_ORDER:
        errors.append("story_creation_envelope.max_phase is invalid")
    elif ENVELOPE_ORDER.index(max_phase) < ENVELOPE_ORDER.index(required_phase):
        errors.append(f"story envelope max_phase={max_phase} does not allow {required_phase}")

    party = data.get("party_mode", {})
    if not isinstance(party, dict) or party.get("rounds", 0) < 2:
        errors.append("party_mode.rounds must be >= 2")
    roles = set(party.get("roles", [])) if isinstance(party, dict) else set()
    if not {"PM", "Architect", "Review"}.issubset(roles):
        errors.append("party_mode.roles must include PM, Architect, Review")

    unknowns = data.get("unknowns", {})
    quadrants = set(unknowns.get("quadrants", [])) if isinstance(unknowns, dict) else set()
    if not {"known_unknowns", "unknown_unknowns", "assumptions", "blind_spots"}.issubset(quadrants):
        errors.append("unknowns.quadrants must cover known_unknowns, unknown_unknowns, assumptions, blind_spots")

    receipts = data.get("evidence_receipts", [])
    if not isinstance(receipts, list) or not receipts:
        errors.append("evidence_receipts must contain at least one immutable receipt")
    else:
        missing = [r.get("id", r.get("path", "unknown")) for r in receipts if not receipt_exists(r)]
        if missing:
            errors.append(f"evidence receipts missing or hash-mismatched: {', '.join(missing)}")

    approval = data.get("approval", {})
    if approval.get("approved") is not True:
        errors.append("approval.approved must be true")
    if approval.get("context_digest") != actual_digest:
        errors.append("approval.context_digest must match current context_digest")

    approved_by = str(approval.get("approved_by", "")).strip().lower()
    ai_keywords = ["orchestrator", "agent", "ai", "system", "bot", "automated", ""]
    if approved_by in ai_keywords or "agent" in approved_by or "orchestrator" in approved_by:
        if approved_by == "orchestrator":
            errors.append("LEGACY_ORCHESTRATOR_APPROVAL: Epic must be re-evaluated. Epic readiness downgraded. STOP IMMEDIATELY. DO NOT PROCEED. ASK HUMAN USER FOR EXPLICIT APPROVAL.")
        else:
            errors.append("STOP IMMEDIATELY. DO NOT PROCEED. ASK HUMAN USER FOR EXPLICIT APPROVAL. (Auto-approval by AI is forbidden).")

    return {
        "status": "PASS" if not errors else "FAIL",
        "epic_id": f"Epic-{epic_id}",
        "fg": derive_fg(epic_dir),
        "passport": str(path.relative_to(ROOT)),
        "context_digest": actual_digest,
        "context_files": actual_files,
        "errors": errors,
        "warnings": warnings,
        "next_action": None if not errors else "Refresh the Epic evaluation passport from Party Mode + Unknowns evidence and get approval for the new digest.",
    }


def draft(epic_id):
    epic_id = canonical_epic_id(epic_id)
    epic_dir = find_epic_dir(epic_id)
    files = context_files(epic_dir)
    digest, file_hashes = context_digest(files)
    report = REPORT_ROOT / "unknowns-report-fg-epic-evaluation-gate.md"
    report_receipt = {
        "id": "fg-epic-evaluation-proposal",
        "path": str(report.relative_to(ROOT)) if report.exists() else "",
        "sha256": sha256_file(report) if report.exists() else "",
    }
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    return {
        "schema_version": "epic-evaluation-passport/v1",
        "epic_id": f"Epic-{epic_id}",
        "feature_group": derive_fg(epic_dir),
        "created_at": now,
        "updated_at": now,
        "context_digest": digest,
        "context_files": file_hashes,
        "evaluation_integrity": "PENDING",
        "epic_readiness": "PENDING_APPROVAL",
        "story_creation_envelope": {
            "max_phase": "NONE",
            "allowed_story_ids": [],
            "blocked_story_ids": [],
            "remediation_lane": False,
        },
        "party_mode": {
            "rounds": 0,
            "roles": [],
            "consensus_summary": "",
            "pushback_patterns": [],
        },
        "unknowns": {
            "depth": "full",
            "quadrants": [],
            "critical_open": [],
            "macro_open": [],
        },
        "evidence_receipts": [report_receipt] if report_receipt["path"] else [],
        "approval": {
            "approved": False,
            "approved_by": "",
            "approved_at": "",
            "context_digest": digest,
        },
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("epic_id")
    parser.add_argument("--required-phase", default="AUTHOR_ONLY", choices=ENVELOPE_ORDER)
    parser.add_argument("--output-json")
    parser.add_argument("--draft", action="store_true", help="Print a draft passport skeleton for the current Epic context.")
    args = parser.parse_args()

    result = draft(args.epic_id) if args.draft else validate(args.epic_id, args.required_phase)
    text = json.dumps(result, indent=2, ensure_ascii=False)
    if args.output_json:
        out = Path(args.output_json)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(text + "\n", encoding="utf-8")
    print(text)
    return 0 if args.draft or result["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
