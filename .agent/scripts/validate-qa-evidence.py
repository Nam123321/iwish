#!/usr/bin/env python3
"""
Zero-Trust QA Evidence Validator v3.0
=====================================
Enforces 5 Hard Gates:
  1. Fragile Selector Lint (existing)
  2. Assertion Enforcer (NEW) — rejects scripts with 0 expect() calls
  3. Anti-Padding Detection (NEW) — rejects DOM/HAR padding tricks
  4. HAR Network Health (existing, improved)
  5. Evidence Existence + Size (existing)
"""
import sys
import os
import re
import glob
import json


# ─────────────────────────────────────────────────────────────
# GATE 1: Fragile Selector Lint
# ─────────────────────────────────────────────────────────────
def check_fragile_selectors(epic_id, story_id):
    print("\n🔍 [Gate 1] Checking for fragile CSS/XPath locators in test scripts...")
    test_files = glob.glob(f"tests/e2e/Epic-{epic_id}/**/*{story_id}*.*", recursive=True) + glob.glob(f"tests/e2e/Epic-{epic_id}/*{story_id}*.*")
    if not test_files:
        print("⚠️ Warning: No explicit test script files found for fragile locator linting.")
        return True

    # Regex covers all major Playwright actions
    fragile_patterns = [r'\.?(locator|click|fill|type|press|waitForSelector|check|uncheck|selectOption|hover|dblclick)\([\'"][\.\#\/]']
    failed = False
    for tf in test_files:
        with open(tf, 'r', encoding='utf-8') as f:
            content = f.read()
            for pattern in fragile_patterns:
                matches = re.findall(pattern, content)
                if matches:
                    print(f"❌ Error: Fragile CSS/XPath locator found via action '{matches[0]}' in {tf}. Use semantic locators (getByRole, getByText, getByTestId) instead.")
                    failed = True

    if failed:
        return False
    print("✅ Gate 1 passed: Only semantic locators detected.")
    return True


# ─────────────────────────────────────────────────────────────
# GATE 2: Assertion Enforcer (NEW)
# Rejects test scripts that import expect but never call it.
# ─────────────────────────────────────────────────────────────
def check_assertion_enforcement(epic_id, story_id):
    print("\n🔍 [Gate 2] Checking for behavioral assertions (expect() calls) in test scripts...")
    test_files = glob.glob(f"tests/e2e/Epic-{epic_id}/**/*{story_id}*.spec.ts", recursive=True) + \
                 glob.glob(f"tests/e2e/Epic-{epic_id}/*{story_id}*.spec.ts") + \
                 glob.glob(f"tests/e2e/Epic-{epic_id}/**/*{story_id}*.spec.js", recursive=True) + \
                 glob.glob(f"tests/e2e/Epic-{epic_id}/*{story_id}*.spec.js")
    # Deduplicate
    test_files = list(set(test_files))

    if not test_files:
        print("⚠️ Warning: No test script files found for assertion enforcement.")
        return True

    failed = False
    for tf in test_files:
        with open(tf, 'r', encoding='utf-8') as f:
            content = f.read()

        # Count actual expect() CALLS (not just the import statement)
        # Match patterns like: expect(something).toBeVisible()
        # Exclude: import { expect } and comments
        lines = content.split('\n')
        expect_call_count = 0
        for line in lines:
            stripped = line.strip()
            # Skip import lines and comments
            if stripped.startswith('import ') or stripped.startswith('//') or stripped.startswith('*'):
                continue
            # Count expect( calls — must be an actual invocation
            expect_calls_in_line = re.findall(r'\bexpect\s*\(', stripped)
            expect_call_count += len(expect_calls_in_line)

        if expect_call_count == 0:
            print(f"❌ ASSERTION ENFORCER FAIL: File '{tf}' has ZERO expect() assertions.")
            print(f"   The script imports 'expect' but never invokes it. This is a fake test ('làm màu').")
            print(f"   Every test MUST contain at least 1 behavioral assertion (e.g. expect(locator).toBeVisible()).")
            failed = True
        else:
            print(f"  ✅ '{os.path.basename(tf)}': Found {expect_call_count} expect() assertion(s).")

    if failed:
        return False
    print("✅ Gate 2 passed: All test scripts contain behavioral assertions.")
    return True


# ─────────────────────────────────────────────────────────────
# GATE 3: Anti-Padding Detection (NEW)
# Detects DOM padding, HAR padding, and error-swallowing patterns.
# ─────────────────────────────────────────────────────────────
def check_anti_padding(epic_id, story_id):
    print("\n🔍 [Gate 3] Scanning for evidence-padding / fake-pass tricks in test scripts...")
    test_files = glob.glob(f"tests/e2e/Epic-{epic_id}/**/*{story_id}*.*", recursive=True) + \
                 glob.glob(f"tests/e2e/Epic-{epic_id}/*{story_id}*.*")
    test_files = [f for f in set(test_files) if f.endswith(('.ts', '.js', '.cjs', '.mjs'))]

    if not test_files:
        return True

    # Patterns that indicate intentional evidence gaming
    padding_patterns = [
        (r'Array\s*\(\s*\d{2,}\s*\)\s*\.fill\s*\(', 'DOM Padding: Array(N).fill() used to inflate DOM size'),
        (r'\?\s*padding\s*=', 'HAR Padding: Dummy /?padding= requests to inflate network log'),
        (r'for\s*\(\s*let\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*\d{2,}\s*;.*fetch\s*\(', 'HAR Padding: Loop generating bulk fetch requests'),
        (r'console\.log\s*\(\s*[`\'"].*[Pp]adding', 'Log Padding: Generating fake console log entries for evidence size'),
        (r'\.innerHTML\s*=\s*Array\s*\(', 'DOM Injection: innerHTML set with Array padding'),
    ]

    failed = False
    for tf in test_files:
        with open(tf, 'r', encoding='utf-8') as f:
            content = f.read()

        for pattern, description in padding_patterns:
            if re.search(pattern, content):
                print(f"❌ ANTI-PADDING FAIL in '{tf}': {description}")
                failed = True

        # Check for error-swallowing try/catch that prevents test failure
        # Pattern: catch block that only logs but doesn't rethrow or fail
        catch_blocks = re.finditer(r'catch\s*\([^)]*\)\s*\{([^}]*)\}', content)
        for match in catch_blocks:
            catch_body = match.group(1).strip()
            # If catch body only has console.log and doesn't rethrow or call expect
            if catch_body and 'console.log' in catch_body and 'throw' not in catch_body and 'expect' not in catch_body:
                print(f"⚠️ Warning in '{tf}': catch block swallows errors silently (only logs, no rethrow). This masks real failures.")

    if failed:
        return False
    print("✅ Gate 3 passed: No evidence-padding tricks detected.")
    return True


# ─────────────────────────────────────────────────────────────
# GATE 4: HAR Network Health Validation (existing, improved)
# ─────────────────────────────────────────────────────────────
def validate_har_file(filepath):
    print(f"\n🔍 [Gate 4] Parsing HAR file: {os.path.basename(filepath)}")
    has_errors = False
    meaningful_request_count = 0
    try:
        file_size = os.path.getsize(filepath)
        if file_size > 150 * 1024 * 1024:
            print(f"⚠️ Warning: HAR file is very large ({file_size/1024/1024:.1f} MB).")

        with open(filepath, 'r', encoding='utf-8') as f:
            har_data = json.load(f)

        entries = har_data.get('log', {}).get('entries', [])
        for entry in entries:
            request = entry.get('request', {})
            response = entry.get('response', {})

            url = request.get('url', '')
            status = response.get('status', 0)

            # Filter: Only check business API calls, skip padding/static/3rd-party
            if '?padding=' in url:
                # This IS a padding request — flag it
                print(f"  ⚠️ Detected padding request in HAR: {url} — This inflates evidence artificially.")
                continue

            if '/api/' in url or 'graphql' in url:
                meaningful_request_count += 1
                if status >= 400:
                    print(f"❌ HAR Error: API endpoint returned HTTP {status} for {url}")
                    content_text = response.get('content', {}).get('text', '')
                    if content_text:
                        print(f"   Response Body: {content_text[:300]}")
                    has_errors = True

        if meaningful_request_count == 0:
            print(f"  ⚠️ Warning: No meaningful API requests found in HAR. The test may not be exercising any backend routes.")

    except json.JSONDecodeError as e:
        print(f"❌ Error: HAR file is not valid JSON! {e}")
        has_errors = True
    except MemoryError:
        print(f"❌ Error: OOM while parsing HAR file.")
        has_errors = True
    except Exception as e:
        print(f"⚠️ Warning: Could not parse HAR file {filepath} - {e}")
        has_errors = True

    if has_errors:
        return False
    print(f"  ✅ HAR validation passed ({meaningful_request_count} meaningful API request(s), no critical errors).")
    return True


# ─────────────────────────────────────────────────────────────
# GATE 5: Evidence Existence + Size (existing)
# ─────────────────────────────────────────────────────────────
def is_valid_evidence(filename, evidence_dir, substrings, min_size):
    filename_lower = filename.lower()
    if any(sub in filename_lower for sub in substrings):
        filepath = os.path.join(evidence_dir, filename)
        if os.path.exists(filepath) and os.path.getsize(filepath) >= min_size:
            return filepath
    return None


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
def main():
    if len(sys.argv) < 3:
        print("Usage: python3 validate-qa-evidence.py <epic_id> <story_id>")
        sys.exit(1)

    epic_id = sys.argv[1]
    story_id = sys.argv[2]

    spec_pattern_flat = f"_iwish-output/stories/qa/manual-test-guide-{story_id}*.md"
    spec_pattern_hierarchical = f"_iwish-output/3. Development/1. Epic & Story/*/Epic-{epic_id}/Story-{story_id}/qa/manual-test-guide-{story_id}*.md"
    spec_pattern_flat_legacy = f"_iwish-output/stories/manual-test-guide-{story_id}*.md"
    spec_pattern_hierarchical_legacy = f"_iwish-output/3. Development/1. Epic & Story/*/Epic-{epic_id}/Story-{story_id}/manual-test-guide-{story_id}*.md"

    spec_files = glob.glob(spec_pattern_flat) + glob.glob(spec_pattern_hierarchical) + glob.glob(spec_pattern_flat_legacy) + glob.glob(spec_pattern_hierarchical_legacy)

    if not spec_files:
        print(f"❌ Error: No Spec files found for Epic {epic_id}, Story {story_id}")
        sys.exit(1)

    print(f"🔍 Validating QA Evidence for Epic {epic_id}, Story {story_id}...")
    print(f"   Running 5 Hard Gates: Locator Lint → Assertion Enforcer → Anti-Padding → HAR Health → Evidence Files\n")

    all_passed = True

    # ── GATE 1: Fragile Selector Lint ──
    if not check_fragile_selectors(epic_id, story_id):
        print("\n❌ VALIDATION FAILED at Gate 1: Fragile selectors detected.")
        sys.exit(1)

    # ── GATE 2: Assertion Enforcer (NEW) ──
    if not check_assertion_enforcement(epic_id, story_id):
        print("\n❌ VALIDATION FAILED at Gate 2: Test scripts have ZERO assertions.")
        print("   A test without expect() is not a test — it's a screenshot bot.")
        print("   Fix: Add behavioral assertions like expect(locator).toBeVisible() or expect(response.status()).toBe(200).")
        sys.exit(1)

    # ── GATE 3: Anti-Padding Detection (NEW) ──
    if not check_anti_padding(epic_id, story_id):
        print("\n❌ VALIDATION FAILED at Gate 3: Evidence-padding tricks detected in test scripts.")
        print("   The test artificially inflates evidence file sizes instead of generating real evidence.")
        print("   Fix: Remove all Array().fill(), /?padding= loops, and innerHTML injection code.")
        sys.exit(1)

    # ── GATE 4 & 5: Per-spec evidence validation ──
    for spec_path in spec_files:
        print(f"\n📄 Reading spec: {spec_path}")

        if "/qa/" in spec_path:
            evidence_dir = os.path.join(os.path.dirname(spec_path), "evidence")
        else:
            evidence_dir = f"_iwish-output/qa-evidence/Epic-{epic_id}/Story-{story_id}"

        if not os.path.exists(evidence_dir):
            print(f"❌ Error: Evidence directory not found at {evidence_dir}")
            sys.exit(1)

        files_in_dir = os.listdir(evidence_dir)
        print(f"📁 Found {len(files_in_dir)} files in evidence directory: {evidence_dir}")

        with open(spec_path, 'r', encoding='utf-8') as f:
            content = f.read()

        constraints = []
        in_zt_section = False
        for line in content.split('\n'):
            if "Zero-Trust Evidence Constraints" in line:
                in_zt_section = True
                continue
            if in_zt_section and line.startswith("##"):
                in_zt_section = False

            if in_zt_section:
                match = re.search(r'- \[(x|X)\]\s*(?:\*\*)?(.*?)(?:\*\*)?\s*$', line)
                if match:
                    constraints.append(match.group(2).strip())

        if not constraints:
            print("⚠️ Warning: No Zero-Trust evidence constraints defined in this spec. Passing by default.")
            continue

        print(f"📋 Required Evidence Types: {', '.join(constraints)}")

        missing_evidence = []
        for constraint in constraints:
            found_filepath = None
            if "DOM Hash" in constraint or "Snapshot" in constraint:
                for f in files_in_dir:
                    found_filepath = is_valid_evidence(f, evidence_dir, ['.html', 'dom', 'snapshot'], 200)
                    if found_filepath: break
            elif "Network" in constraint:
                for f in files_in_dir:
                    found_filepath = is_valid_evidence(f, evidence_dir, ['.har', 'network'], 200)
                    if found_filepath:
                        # GATE 4: Validate HAR content
                        if not validate_har_file(found_filepath):
                            all_passed = False
                        break
            elif "A11y" in constraint:
                for f in files_in_dir:
                    found_filepath = is_valid_evidence(f, evidence_dir, ['a11y', 'access'], 100)
                    if found_filepath: break
            elif "Visual" in constraint or "Screenshot" in constraint:
                for f in files_in_dir:
                    found_filepath = is_valid_evidence(f, evidence_dir, ['.png', '.jpg', '.jpeg', 'visual', 'screenshot'], 1024)
                    if found_filepath: break
            elif "Console Log" in constraint:
                for f in files_in_dir:
                    found_filepath = is_valid_evidence(f, evidence_dir, ['.log', 'console'], 100)
                    if found_filepath: break
            elif "Database" in constraint:
                for f in files_in_dir:
                    found_filepath = is_valid_evidence(f, evidence_dir, ['.sql', 'db', 'database'], 100)
                    if found_filepath: break
            elif "Performance" in constraint or "Trace" in constraint:
                for f in files_in_dir:
                    found_filepath = is_valid_evidence(f, evidence_dir, ['.trace', 'perf'], 500)
                    if found_filepath: break
            else:
                for f in files_in_dir:
                    if os.path.getsize(os.path.join(evidence_dir, f)) >= 100:
                        found_filepath = os.path.join(evidence_dir, f)
                        break

            if found_filepath:
                print(f"  ✅ [Gate 5] Found evidence for: {constraint}")
            else:
                print(f"  ❌ [Gate 5] Missing evidence for: {constraint}")
                missing_evidence.append(constraint)

        if missing_evidence:
            all_passed = False

    if not all_passed:
        print("\n❌ VALIDATION FAILED: Missing required physical evidence, or critical HAR errors detected.")
        print("Agent may be hallucinating a test pass or ignoring backend failures.")
        sys.exit(1)

    print("\n✅ VALIDATION PASSED: All 5 Hard Gates cleared. Evidence is genuine.")
    sys.exit(0)


if __name__ == "__main__":
    main()
