#!/usr/bin/env python3
"""Unified Category A script for restored review gates (Steps 12-15).
Integrated into pipeline-integrity-runner.py --phase review."""
import sys, json, re, os
import sys, os, json, re
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
from pathlib import Path

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

# Import shared source roots
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pipeline_constants import SOURCE_ROOTS, EXCLUDE_DIRS, get_source_files


def _collect_source_files(extensions=None):
    """Collect source files from all SOURCE_ROOTS relative to cwd."""
    return get_source_files(Path.cwd(), extensions=extensions, include_tests=False)


def check_contract_drift(story_dir: Path) -> list:
    """Step 12: API contract consistency"""
    findings = []
    api_routes = Path("src/shared/api-routes.ts")
    if not api_routes.exists():
        return []  # No API contract file = skip (not all stories have API)
    
    # Check if story created any new route handlers without updating api-routes.ts
    story_files = list(story_dir.rglob("*.ts"))
    for f in story_files:
        try:
            content = f.read_text(encoding="utf-8")
        except UnicodeDecodeError as e:
            print(f"❌ SECURITY ANOMALY: File {f} is not valid UTF-8. Potential bypass payload. {e}")
            sys.exit(1)
        except Exception:
            continue
        
        # Detect route handler patterns not in api-routes.ts
        route_patterns = re.findall(r'(router\.(get|post|put|delete|patch))\s*\([\'"]([^\'"]+)[\'"]\)', content)
        if route_patterns:
            api_content = api_routes.read_text(encoding="utf-8")
            for _, method, path in route_patterns:
                if path not in api_content:
                    findings.append(f"Route {method.upper()} {path} in {f.name} not in api-routes.ts")
    return findings

def check_ui_compliance(story_dir: Path) -> list:
    """Step 13: UI-UX Orchestrator — check DESIGN.md compliance"""
    findings = []
    design_md = Path("_iwish-output/2. Product Planning/design-system/cowokai/DESIGN.md")
    if not design_md.exists():
        return []  # No design system = skip
    
    ui_spec = story_dir / "ui-spec.md"
    if not ui_spec.exists():
        return []  # No UI spec = backend story, skip
    
    # Check for hardcoded color values across ALL source roots (not just src/)
    tsx_files = _collect_source_files(extensions={".tsx", ".jsx"})
    for f in tsx_files:
        try:
            content = f.read_text(encoding="utf-8")
        except UnicodeDecodeError as e:
            print(f"❌ SECURITY ANOMALY: File {f} is not valid UTF-8. Potential bypass payload. {e}")
            sys.exit(1)
        except Exception:
            continue
            
        hardcoded_colors = re.findall(r'(?i)(?:color|background|border)\s*[:=]\s*[\'"]?#[0-9a-fA-F]{3,8}[\'"]?', content)
        if hardcoded_colors:
            findings.append(f"{f.name} has {len(hardcoded_colors)} hardcoded color(s)")
    return findings

def check_stitch_enrichment(story_dir: Path) -> list:
    """Step 14: Stitch Enrichment Validation"""
    findings = []
    ui_spec = story_dir / "ui-spec.md"
    if not ui_spec.exists():
        return []
    
    try:
        content = ui_spec.read_text(encoding="utf-8")
        if 'Enrichment_Required: true' in content:
            if '[POST_STITCH_ENRICHMENT_LOGIC]' not in content:
                findings.append("ui-spec.md has Enrichment_Required but missing POST_STITCH_ENRICHMENT_LOGIC")
    except Exception:
        pass
    return findings

def check_specialist_tags(story_dir: Path, story_id: str) -> list:
    """Step 15: Domain-specific checklist based on tags"""
    findings = []
    story_md = story_dir / "story.md"
    if not story_md.exists():
        return []
    
    try:
        content = story_md.read_text(encoding="utf-8")
        
        # [DATA] tag → check for migration files
        if '[DATA]' in content or 'database' in content.lower():
            migration_files = list(Path("prisma/migrations").rglob("*.sql")) if Path("prisma/migrations").exists() else []
            # Just verify awareness — not blocking
        
        # [AUTH] tag → check for RBAC references across ALL source roots
        if '[AUTH]' in content or 'authentication' in content.lower():
            src_files = _collect_source_files(extensions={".ts", ".tsx"})
            has_rbac_check = False
            for f in src_files:
                try:
                    if f.stat().st_size < 50000:
                        fc = f.read_text(encoding="utf-8")
                        if 'checkPermission' in fc or 'authorize' in fc:
                            has_rbac_check = True
                            break
                except UnicodeDecodeError as e:
                    print(f"❌ SECURITY ANOMALY: File {f} is not valid UTF-8. Potential bypass payload. {e}")
                    sys.exit(1)
                except Exception:
                    continue
            if not has_rbac_check and '[AUTH]' in content:
                findings.append(f"Story {story_id} tagged [AUTH] but no checkPermission/authorize calls found")
    except Exception:
        pass
    return findings

def main():
    if len(sys.argv) < 2:
        sys.exit(0)
    story_dir = Path(sys.argv[1])
    story_id = sys.argv[2] if len(sys.argv) > 2 else "unknown"
    
    all_findings = []
    
    all_findings.extend([("Contract Drift", f) for f in check_contract_drift(story_dir)])
    all_findings.extend([("UI Compliance", f) for f in check_ui_compliance(story_dir)])
    all_findings.extend([("Stitch Enrichment", f) for f in check_stitch_enrichment(story_dir)])
    all_findings.extend([("Specialist Tags", f) for f in check_specialist_tags(story_dir, story_id)])
    
    if all_findings:
        print(f"⚠️ Extended Review Gates found {len(all_findings)} issue(s):")
        for category, finding in all_findings:
            print(f"   [{category}] {finding}")
        # Non-blocking (warnings) — exit 0 with report
    else:
        print("✅ Extended Review Gates: all clear")
    
    sys.exit(0)

if __name__ == "__main__":
    main()
