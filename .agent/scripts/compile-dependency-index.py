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

"""Compiled Dependency Index (CDI) Builder — D10

Triangulates 4 sources (story frontmatter, epic tables, cross-deps analysis,
data specs) to build a confidence-scored dependency index.

Output: _iwish-output/notebooks/dependency-index.yaml
"""
import os
import re
import yaml
import json
import subprocess
from datetime import datetime, timezone

# Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
OUTPUT_DIR = os.path.join(BASE_DIR, '_iwish-output')
EPIC_STORY_DIR = os.path.join(OUTPUT_DIR, '3. Development', '1. Epic & Story')
CROSS_DEPS_FILE = os.path.join(OUTPUT_DIR, '2. Product Planning', '2.7. cross-dependencies.md')
NOTEBOOKS_DIR = os.path.join(OUTPUT_DIR, 'notebooks')
CDI_OUTPUT_FILE = os.path.join(NOTEBOOKS_DIR, 'dependency-index.yaml')
SCRATCH_DIR = os.path.join(OUTPUT_DIR, 'adhoc-workspace', 'scratch')
FINDINGS_FILE = os.path.join(SCRATCH_DIR, 'cdi-unknowns-findings.json')
VALIDATE_SCRIPT = os.path.join(BASE_DIR, '.agent', 'scripts', 'validate-cdi.py')


def parse_frontmatter(content):
    """Extract YAML frontmatter from markdown content."""
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if match:
        try:
            return yaml.safe_load(match.group(1)) or {}
        except yaml.YAMLError:
            return {}
    return {}


def main():
    os.makedirs(NOTEBOOKS_DIR, exist_ok=True)
    os.makedirs(SCRATCH_DIR, exist_ok=True)

    sources_used = {
        'story_frontmatter': 0,
        'epic_tables': 0,
        'cross_dependencies_md': os.path.exists(CROSS_DEPS_FILE),
        'data_specs': 0
    }

    # Data structures
    epics_data = {}
    
    # Seed epics_data with all physical epic directories
    if os.path.exists(EPIC_STORY_DIR):
        for fg_folder in os.listdir(EPIC_STORY_DIR):
            fg_path = os.path.join(EPIC_STORY_DIR, fg_folder)
            if os.path.isdir(fg_path):
                for epic_folder in os.listdir(fg_path):
                    if epic_folder.startswith('Epic-') and os.path.isdir(os.path.join(fg_path, epic_folder)):
                        epics_data[epic_folder] = {'upstream': [], 'downstream': []}

    stories_data = {}
    merged_deps = {}  # (source_id, target_id) -> {evidence: set()}
    
    def add_edge(src, dst, evidence_source):
        """Add a dependency edge with evidence tracking."""
        if not src or not dst or src == dst:
            return
        key = (src, dst)
        if key not in merged_deps:
            merged_deps[key] = {'evidence': set()}
        merged_deps[key]['evidence'].add(evidence_source)

    # ================================================================
    # S1: Walk story.md files — extract declared dependencies
    # ================================================================
    if os.path.exists(EPIC_STORY_DIR):
        for root, dirs, files in os.walk(EPIC_STORY_DIR):
            if 'story.md' in files:
                sources_used['story_frontmatter'] += 1
                story_path = os.path.join(root, 'story.md')
                story_dir_name = os.path.basename(root)  # e.g., "Story-72.9"
                
                with open(story_path, 'r', encoding='utf-8') as f:
                    fm = parse_frontmatter(f.read())
                
                deps = fm.get('dependencies', [])
                if isinstance(deps, str):
                    deps = [d.strip() for d in deps.split(',') if d.strip()]
                    
                stories_data[story_dir_name] = {
                    'declared_deps': deps,
                    'analyzed_deps': [],
                    'merged_deps': [],
                    'conflicts': []
                }
                
                for d in deps:
                    add_edge(story_dir_name, d, 'frontmatter')

    # ================================================================
    # S2: Walk epic.md files — extract Dependencies column from Stories table
    # ================================================================
    if os.path.exists(EPIC_STORY_DIR):
        for root, dirs, files in os.walk(EPIC_STORY_DIR):
            if 'epic.md' in files:
                sources_used['epic_tables'] += 1
                epic_path = os.path.join(root, 'epic.md')
                epic_dir_name = os.path.basename(root)  # e.g., "Epic-72"
                
                with open(epic_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Find ## Stories section and parse table
                stories_match = re.search(r'## Stories.*?(##|$)', content, re.DOTALL)
                if stories_match:
                    table_text = stories_match.group(0)
                    header_found = False
                    story_id_idx = -1
                    deps_idx = -1
                    for line in table_text.split('\n'):
                        line = line.strip()
                        if not line.startswith('|'):
                            continue
                        cols = [col.strip() for col in line.split('|')]
                        # Standard format: | Story ID | Title | Dependencies | Status |
                        if not header_found and 'Story ID' in line:
                            header_found = True
                            for i, c in enumerate(cols):
                                if 'Story ID' in c: story_id_idx = i
                                if 'Dependencies' in c: deps_idx = i
                            continue
                        if '---' in line or not header_found or story_id_idx == -1 or deps_idx == -1:
                            continue
                        
                        if len(cols) > max(story_id_idx, deps_idx):
                            story_id_match = re.search(r'Story-[\d.]+', cols[story_id_idx])
                            if story_id_match:
                                src_story = story_id_match.group()
                                deps_str = cols[deps_idx]
                                dep_ids = re.findall(r'(Story-[\d.]+|Epic-\d+)', deps_str)
                                for dep_id in dep_ids:
                                    add_edge(src_story, dep_id, 'epic_table')
                                        
                                # Also extract epic-level dependencies from mentions
                                all_epic_refs = re.findall(r'Epic-\d+', deps_str)
                                for ref in all_epic_refs:
                                    if ref != epic_dir_name:
                                        add_edge(epic_dir_name, ref, 'epic_table')

    # ================================================================
    # S3: Parse 2.7. cross-dependencies.md
    # ================================================================
    if sources_used['cross_dependencies_md']:
        with open(CROSS_DEPS_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract Dependency Matrix (Section 2)
        # Look for tables with Epic/Feature references
        table_lines = []
        in_dep_section = False
        for line in content.split('\n'):
            if re.search(r'##.*[Dd]ependency.*[Mm]atrix', line):
                in_dep_section = True
                continue
            if in_dep_section:
                if line.strip().startswith('#') and '##' in line:
                    in_dep_section = False
                    continue
                if '|' in line and '---' not in line:
                    table_lines.append(line)
        
        for line in table_lines:
            cells = [c.strip() for c in line.split('|') if c.strip()]
            all_epics = re.findall(r'Epic-\d+', ' '.join(cells))
            # First epic mentioned is typically the subject
            if len(all_epics) >= 2:
                src_epic = all_epics[0]
                for dep_epic in all_epics[1:]:
                    if dep_epic != src_epic:
                        add_edge(src_epic, dep_epic, 'cross-deps-matrix')
        
        # Extract Shared Entity Map (Section 3)
        shared_lines = []
        in_shared_section = False
        for line in content.split('\n'):
            if re.search(r'##.*[Ss]hared.*[Ee]ntit', line):
                in_shared_section = True
                continue
            if in_shared_section:
                if line.strip().startswith('#') and '##' in line:
                    in_shared_section = False
                    continue
                if '|' in line and '---' not in line:
                    shared_lines.append(line)
        
        for line in shared_lines:
            cells = [c.strip() for c in line.split('|') if c.strip()]
            all_refs = re.findall(r'(Epic-\d+|Story-[\d.]+)', ' '.join(cells))
            # Create edges between all referenced entities
            for i in range(len(all_refs)):
                for j in range(i + 1, len(all_refs)):
                    add_edge(all_refs[i], all_refs[j], 'shared-entity-map')
        
        # Extract Execution Order (Section 4)
        exec_lines = []
        in_exec_section = False
        for line in content.split('\n'):
            if re.search(r'##.*[Ee]xecution.*[Oo]rder', line):
                in_exec_section = True
                continue
            if in_exec_section:
                if line.strip().startswith('#') and '##' in line:
                    in_exec_section = False
                    continue
                if '|' in line and '---' not in line:
                    exec_lines.append(line)
        
        for line in exec_lines:
            cells = [c.strip() for c in line.split('|') if c.strip()]
            all_refs = re.findall(r'(Epic-\d+|Story-[\d.]+)', ' '.join(cells))
            for i in range(len(all_refs) - 1):
                add_edge(all_refs[i], all_refs[i + 1], 'execution-order')

    # ================================================================
    # S4: Scan per-story data-spec.md
    # ================================================================
    if os.path.exists(EPIC_STORY_DIR):
        for root, dirs, files in os.walk(EPIC_STORY_DIR):
            if 'data-spec.md' in files:
                sources_used['data_specs'] += 1
                spec_path = os.path.join(root, 'data-spec.md')
                story_dir_name = os.path.basename(root)
                
                with open(spec_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if '## Shared Entities' in content or '## Events Consumed' in content or '## Events Produced' in content:
                    mentions = re.findall(r'(Story-[\d.]+|Epic-\d+)', content)
                    for dst in set(mentions):
                        if dst != story_dir_name:
                            add_edge(story_dir_name, dst, 'data-specs')

    # ================================================================
    # Triangulation & Confidence Scoring
    # ================================================================
    unknowns = []
    
    for (src, dst), data in merged_deps.items():
        evidence = data['evidence']
        
        # Confidence scoring
        analytical_sources = {'cross-deps-matrix', 'shared-entity-map', 'data-specs', 'execution-order'}
        has_analytical = bool(evidence & analytical_sources)
        has_frontmatter = 'frontmatter' in evidence
        has_epic_table_only = evidence == {'epic_table'}
        
        if len(evidence) >= 2:
            conf = 1.0
        elif has_analytical and not has_frontmatter:
            conf = 0.7
        elif has_frontmatter and not has_analytical:
            conf = 0.5
        elif has_epic_table_only:
            conf = 0.3
        else:
            conf = 0.5  # default
        
        data['confidence'] = conf
        data['evidence'] = sorted(list(evidence))
        
        # Track low-confidence edges for unknowns staging
        if conf < 0.7:
            unknowns.append({
                'source': src,
                'target': dst,
                'confidence': conf,
                'evidence': data['evidence'],
                'severity': 'warning',
                'macro_impact': False
            })
        
        # Detect conflicts: analyzed but missing from frontmatter
        if has_analytical and not has_frontmatter:
            if src in stories_data:
                stories_data[src]['conflicts'].append({
                    'type': 'missing_in_frontmatter',
                    'dep': dst,
                    'source': list(evidence & analytical_sources)[0],
                    'severity': 'warning'
                })
        
        # Build epic-level output structure
        src_str = str(src)
        dst_str = str(dst)
        if src_str.startswith('Epic-'):
            if src_str not in epics_data:
                epics_data[src_str] = {'upstream': [], 'downstream': []}
            epics_data[src_str]['downstream'].append({
                'id': dst_str, 'confidence': conf, 'evidence': data['evidence']
            })
        if dst_str.startswith('Epic-'):
            if dst_str not in epics_data:
                epics_data[dst_str] = {'upstream': [], 'downstream': []}
            epics_data[dst_str]['upstream'].append({
                'id': src_str, 'confidence': conf, 'evidence': data['evidence']
            })
        
        # Build story-level output structure
        if src_str.startswith('Story-') and src_str in stories_data:
            stories_data[src_str]['merged_deps'].append({
                'id': dst_str, 'confidence': conf, 'evidence': data['evidence']
            })
            if has_analytical:
                if dst_str not in stories_data[src_str]['analyzed_deps']:
                    stories_data[src_str]['analyzed_deps'].append(dst_str)

    # ================================================================
    # Write CDI Output
    # ================================================================
    cdi_output = {
        'version': '1.0',
        'compiled_at': datetime.now(timezone.utc).isoformat(),
        'sources_used': sources_used,
        'epics': epics_data,
        'stories': stories_data
    }

    with open(CDI_OUTPUT_FILE, 'w', encoding='utf-8') as f:
        yaml.dump(cdi_output, f, sort_keys=False, default_flow_style=False)
    
    print(f"CDI compiled: {len(epics_data)} epics, {len(stories_data)} stories, "
          f"{len(merged_deps)} edges.")

    # ================================================================
    # Step 8 (ZT-REMEDIATION F6): Stage Unknowns Findings
    # ================================================================
    if unknowns:
        with open(FINDINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(unknowns, f, indent=2)
        print(f"Staged {len(unknowns)} low-confidence findings to {FINDINGS_FILE}")
    
    # ================================================================
    # Step 7 (ZT-REMEDIATION F5): Validate CDI Output
    # ================================================================
    if os.path.exists(VALIDATE_SCRIPT):
        print("Running CDI validation...")
        import sys
        result = subprocess.run([sys.executable, VALIDATE_SCRIPT, CDI_OUTPUT_FILE])
        if result.returncode != 0:
            print("CDI VALIDATION FAILED. Exiting with code 1.")
            exit(1)
    else:
        print(f"[WARNING] Validator not found at {VALIDATE_SCRIPT}. Skipping validation.")


if __name__ == '__main__':
    main()
