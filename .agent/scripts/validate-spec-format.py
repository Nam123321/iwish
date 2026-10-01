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
Spec Format Validator — Upstream quality gate.

This script ensures that specifications (UI spec, Data spec) follow 
parseable formats (using tables/checklists, PascalCase component names, 
and avoiding subjective terms) before implementation starts.

EXIT CODES:
  0 = Spec structure is valid and parseable
  1 = Spec has structural issues that will degrade parser accuracy
"""

import argparse
import os
import re
import sys

def extract_section_content(content: str, section_name: str) -> str:
    """Fuzzy extracts content under a specific markdown section name, handling subheadings correctly."""
    lines = content.split('\n')
    section_lines = []
    in_section = False
    section_level = 0
    for line in lines:
        if line.strip().startswith('#'):
            header_level = len(line) - len(line.lstrip('#'))
            header_text = line.lstrip('#').strip().lower()
            if not in_section:
                if section_name.lower() in header_text:
                    in_section = True
                    section_level = header_level
                    continue
            else:
                if header_level <= section_level:
                    break
        if in_section:
            section_lines.append(line)
    return '\n'.join(section_lines)

def check_ui_spec(path):
    failures = []
    warnings = []
    
    if not os.path.exists(path):
        return [f"UI spec file not found at: {path}"], []
        
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Check 1: Component Hierarchy section
    comp_section = extract_section_content(content, 'Component Hierarchy')
    if not comp_section.strip():
        failures.append("Missing or empty 'Component Hierarchy' section (H2 heading)")
    else:
        # Check 2: Check for PascalCase names in Component Hierarchy
        pascal_components = re.findall(r'`?([A-Z][a-zA-Z]+(?:Page|Component|Panel|Modal|Dialog|Form|Card|List|Table|Button|Input|Header|Footer|Sidebar|Nav|Menu|Bar|Section))`?', comp_section)
        if len(pascal_components) < 2:
            failures.append("Component Hierarchy section should define at least 2 PascalCase components (e.g. `MyPanel`, `ActiveButton`)")
            
    # Check 3: Design Tokens table
    tokens_section = extract_section_content(content, 'Design Tokens')
    if not tokens_section.strip():
        failures.append("Missing or empty 'Design Tokens' section (H2 heading)")
    else:
        if '|' not in tokens_section:
            warnings.append("Design Tokens section should use markdown tables for token definitions")

    # Check 4: Interaction Patterns table
    interaction_section = extract_section_content(content, 'Interaction Patterns')
    if not interaction_section.strip():
        # Try fuzzy fallback for section name
        interaction_section = extract_section_content(content, 'Interactions')
        
    if interaction_section.strip():
        if '|' not in interaction_section:
            warnings.append("Interaction Patterns section should use markdown tables for behaviors")
            
    # Check 5: Subjective terms warn
    subjective_terms = ['smooth', 'premium', 'elegant', 'nice', 'beautiful']
    found_subjective = [term for term in subjective_terms if re.search(rf'\b{term}\b', content, re.IGNORECASE)]
    if found_subjective:
        warnings.append(
            f"Subjective terms found: {found_subjective}. "
            f"Ensure they are accompanied by quantified values (e.g., transition durations, pixel constraints)."
        )
        
    return failures, warnings

def check_data_spec(path):
    failures = []
    warnings = []
    
    if not os.path.exists(path):
        return [f"Data spec file not found at: {path}"], []
        
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Check 6: Prisma model block presence
    if not re.search(r'model\s+\w+\s*\{', content):
        failures.append("Data Spec must define at least one Prisma model block (e.g., 'model PlatformCredential {')")
        
    # Check 7: API endpoints defined
    if not re.search(r'(?:GET|POST|PUT|PATCH|DELETE)\s+`/api/', content, re.IGNORECASE):
        warnings.append("Data Spec should explicitly document API endpoints (e.g., 'POST `/api/credentials`')")
        
    return failures, warnings

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('ui_spec', help='Path to UI spec markdown file')
    parser.add_argument('data_spec', nargs='?', default=None, help='Path to Data spec markdown file (optional)')
    args = parser.parse_args()
    
    all_failures = []
    all_warnings = []
    
    if args.ui_spec and args.ui_spec != "skip":
        ui_fails, ui_warns = check_ui_spec(args.ui_spec)
        all_failures.extend(ui_fails)
        all_warnings.extend(ui_warns)
    
    if args.data_spec:
        data_fails, data_warns = check_data_spec(args.data_spec)
        all_failures.extend(data_fails)
        all_warnings.extend(data_warns)
        
    if all_warnings:
        print("⚠️ SPEC FORMAT WARNINGS:")
        for w in all_warnings:
            print(f"  - {w}")
            
    if all_failures:
        print("\n❌ SPEC FORMAT VALIDATION FAILED:")
        for f in all_failures:
            print(f"  - {f}")
        sys.exit(1)
        
    print("\n✅ Spec format validation passed.")
    sys.exit(0)

if __name__ == '__main__':
    main()
