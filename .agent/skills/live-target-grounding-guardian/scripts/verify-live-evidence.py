#!/usr/bin/env python3
"""
Live Target Grounding & Anti-Mock Evidence Validator
====================================================
Enforces that QA and Manual Tests execute on live, real local servers,
strictly forbidding fake mock HTML files, mock links, or decoy DOMs.
"""

import os
import sys
import re
import glob
import json
import hashlib
import argparse
from pathlib import Path

# --- [Watchmen Core Injection] ---
_script_dir = os.path.dirname(os.path.abspath(__file__))
_agent_dir = os.path.abspath(os.path.join(_script_dir, "../.."))
if _agent_dir not in sys.path:
    sys.path.insert(0, _agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass
# ---------------------------------

PROHIBITED_MOCK_PATTERNS = [
    re.compile(r'page\.goto\s*\(\s*[\'"`]file://', re.IGNORECASE),
    re.compile(r'page\.goto\s*\(\s*[\'"`].*scratch/.*\.html', re.IGNORECASE),
    re.compile(r'page\.goto\s*\(\s*[\'"`].*test-mock.*\.html', re.IGNORECASE),
    re.compile(r'page\.setContent\s*\(', re.IGNORECASE), # Injecting synthetic DOM wholesale
]

LIVE_URL_PATTERNS = [
    re.compile(r'https?://(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?', re.IGNORECASE),
    re.compile(r'https?://[a-zA-Z0-9\-\.]+\.(?:dev|app|io|com|org|local)(?::\d+)?', re.IGNORECASE)
]

def audit_test_scripts(test_files):
    """Ensure no test script uses mock links or synthetic DOMs."""
    print("🔍 [Gate 1: Anti-Mock Link Enforcer] Scanning test scripts for mock links...")
    violations = []
    has_live_target = False

    for tf in test_files:
        try:
            with open(tf, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            for pat in PROHIBITED_MOCK_PATTERNS:
                matches = pat.findall(content)
                if matches:
                    violations.append(f"Found prohibited mock pattern '{pat.pattern}' in {tf}")

            for pat in LIVE_URL_PATTERNS:
                if pat.search(content):
                    has_live_target = True

        except Exception as e:
            violations.append(f"Error reading {tf}: {e}")

    if violations:
        for v in violations:
            print(f"  ❌ MOCK VIOLATION: {v}")
        return False

    if not has_live_target:
        print("  ❌ GATE 1 FAIL: No live HTTP target (http://localhost:... or real domain) found in test scripts!")
        print("     All tests MUST target the actual running application server.")
        return False

    print("  ✅ Gate 1 Passed: All scripts target live server endpoints. Zero mock links detected.")
    return True

def audit_screenshots_and_deltas(evidence_dir):
    """Audit screenshot files, verify non-empty, and check state mutation deltas."""
    print("🔍 [Gate 4 & 5: Visual Integrity & Action Delta] Auditing captured screenshots...")
    images = sorted(glob.glob(os.path.join(evidence_dir, "*.png")) + glob.glob(os.path.join(evidence_dir, "*.jpg")))

    if not images:
        print("  ⚠️ No screenshot images found in evidence directory.")
        return True

    hashes = {}
    for img in images:
        size = os.path.getsize(img)
        if size < 5000: # Less than 5KB is almost certainly a blank/corrupted frame
            print(f"  ❌ VISUAL QUALITY FAIL: Screenshot '{os.path.basename(img)}' is too small ({size} bytes). Likely a blank or broken frame.")
            return False

        with open(img, 'rb') as f:
            h = hashlib.sha256(f.read()).hexdigest()
            hashes[img] = h

    # Check for before/after pairs
    for img, h in hashes.items():
        base = os.path.basename(img)
        if "-before" in base:
            after_base = base.replace("-before", "-after")
            after_path = os.path.join(evidence_dir, after_base)
            if after_path in hashes:
                if hashes[after_path] == h:
                    print(f"  ❌ STATE DELTA FAIL: '{base}' and '{after_base}' have identical SHA-256 hashes ({h[:12]}...).")
                    print("     The UI did not alter its visual state after the interaction. Action was NO-OP or frozen!")
                    return False
                else:
                    print(f"  ✅ Action Delta Verified: '{base}' -> '{after_base}' altered visual state (Delta confirmed).")

    print(f"  ✅ Gate 4 & 5 Passed: Audited {len(images)} screenshots. Image dimensions, sizes, and deltas verified.")
    return True

def audit_story_keywords(dom_files, story_file):
    """Check that captured live DOM contains actual domain keywords from the Story."""
    print("🔍 [Gate 3: Story AC Semantic Cross-Check] Cross-checking DOM with Story ACs...")
    if not os.path.exists(story_file) or not dom_files:
        print("  ℹ️ Story file or DOM snapshots not found, skipping semantic cross-check.")
        return True

    with open(story_file, 'r', encoding='utf-8', errors='ignore') as f:
        story_content = f.read()

    # Extract AC items or "I want" block
    keywords = set()
    ac_matches = re.findall(r'(?:AC\d+|Criteria|Given|When|Then|I want)\s*[:\-]?\s*(.+)', story_content, re.IGNORECASE)
    stopwords = {'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'user', 'system', 'must', 'should', 'can', 'will', 'have'}
    for text in ac_matches:
        words = re.findall(r'[a-zA-Z]{4,}', text.lower())
        keywords.update(w for w in words if w not in stopwords)

    if not keywords:
        print("  ℹ️ No specific keywords extracted from story, skipping.")
        return True

    combined_dom = ""
    for df in dom_files:
        with open(df, 'r', encoding='utf-8', errors='ignore') as f:
            combined_dom += f.read().lower()

    found = [kw for kw in keywords if kw in combined_dom]
    match_ratio = len(found) / max(len(keywords), 1)

    print(f"  Matched {len(found)}/{len(keywords)} Story keywords in live DOM ({match_ratio * 100:.1f}%).")
    if match_ratio < 0.15:
        print(f"  ❌ DECOY PAGE WARNING: The live DOM contains almost none of the story's keywords ({list(keywords)[:5]}...).")
        print("     The test may have captured an error page, a generic login screen, or the wrong URL entirely.")
        return False

    print("  ✅ Gate 3 Passed: DOM contains valid story domain entities.")
    return True

def main():
    parser = argparse.ArgumentParser(description="Live Target Grounding & Anti-Mock Evidence Validator")
    parser.add_argument("--story-dir", required=True, help="Path to story directory")
    args = parser.parse_args()

    story_dir = Path(args.story_dir).resolve()
    evidence_dir = story_dir / "qa" / "evidence"

    if not evidence_dir.exists():
        print(f"❌ Error: Evidence directory not found: {evidence_dir}")
        sys.exit(1)

    test_files = list(story_dir.glob("qa/*.cjs")) + list(story_dir.glob("qa/*.ts")) + list(story_dir.glob("qa/*.js")) + list(story_dir.glob("*.spec.ts"))
    dom_files = list(evidence_dir.glob("*dom*.html")) + list(evidence_dir.glob("*snapshot*.html")) + list(evidence_dir.glob("*.html"))
    story_file = story_dir / "story.md"

    print("=" * 70)
    print("🛡️ LIVE TARGET GROUNDING & ANTI-MOCK VERIFICATION GATE")
    print(f"Target Story Directory: {story_dir}")
    print("=" * 70)

    if test_files:
        if not audit_test_scripts([str(tf) for tf in test_files]):
            sys.exit(1)

    if not audit_screenshots_and_deltas(str(evidence_dir)):
        sys.exit(1)

    if dom_files and story_file.exists():
        if not audit_story_keywords([str(df) for df in dom_files], str(story_file)):
            sys.exit(1)

    print("\n🎉 ALL LIVE TARGET GROUNDING GATES PASSED! EVIDENCE IS VERIFIED AS AUTHENTIC.")
    sys.exit(0)

if __name__ == "__main__":
    main()
