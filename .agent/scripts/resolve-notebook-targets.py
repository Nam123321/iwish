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

import argparse
import json
import os
import re
import sys

import yaml

def parse_frontmatter(filepath):
    if not os.path.exists(filepath):
        print(f"WARN: Context file missing: {filepath}", file=sys.stderr)
        return {}
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            # Find the first occurrences of ---
            content = content.lstrip()
            if content.startswith('---'):
                parts = content.split('---', 2)
                if len(parts) >= 3:
                    fm_yaml = parts[1]
                    data = yaml.safe_load(fm_yaml)
                    if isinstance(data, dict):
                        return {
                            'dependencies': data.get('dependencies', []),
                            'tags': data.get('tags', []),
                            'title': data.get('title', ''),
                            'description': data.get('description', '')
                        }
        return {}
    except yaml.YAMLError as e:
        print(f"ERROR: YAML parsing failed for {filepath}: {e}", file=sys.stderr)
        return {}
    except OSError as e:
        print(f"ERROR: I/O error for {filepath}: {e}", file=sys.stderr)
        return {}

def parse_registry(filepath):
    if not os.path.exists(filepath):
        print(f"WARN: Registry file missing: {filepath}", file=sys.stderr)
        return []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f) or {}
            return data if isinstance(data, list) else data.get('notebooks', [])
    except yaml.YAMLError as e:
        print(f"ERROR: YAML parsing failed for registry {filepath}: {e}", file=sys.stderr)
        return []
    except OSError as e:
        print(f"ERROR: I/O error reading registry {filepath}: {e}", file=sys.stderr)
        return []

def find_context_file(context_type, context_id, base_dir):
    search_dir = os.path.join(base_dir, '_iwish-output', '3. Development', '1. Epic & Story')
    if not os.path.exists(search_dir):
        return None
        
    for root, dirs, files in os.walk(search_dir):
        if context_type == 'story':
            if f'Story-{context_id}' in root and 'story.md' in files:
                return os.path.join(root, 'story.md')
        elif context_type == 'epic':
            if f'Epic-{context_id}' in root and 'epic.md' in files:
                return os.path.join(root, 'epic.md')
    return None

def main():
    parser = argparse.ArgumentParser(description='Resolve NotebookLM targets')
    parser.add_argument('--context-type', required=True, choices=['story', 'epic', 'spec', 'review', 'bug', 'research', 'idea'])
    parser.add_argument('--context-id', required=True)
    parser.add_argument('--registry', default='_iwish-output/notebooks/notebook-registry.yaml')
    parser.add_argument('--taxonomy', default='_iwish-output/notebooks/domain-taxonomy.yaml')
    parser.add_argument('--output-json')
    args = parser.parse_args()

    base_dir = os.getcwd()
    
    registry_path = os.path.join(base_dir, args.registry)
    notebooks = parse_registry(registry_path)
    
    deps = []
    tags = []
    title = ""
    description = ""
    
    if args.context_type in ['story', 'epic']:
        filepath = find_context_file(args.context_type, args.context_id, base_dir)
        if filepath:
            # We still want tags, title, description from frontmatter
            fm = parse_frontmatter(filepath)
            tags = fm.get('tags', [])
            title = fm.get('title', '')
            description = fm.get('description', '')
            
            
            # === CDI Integration (D10b): CDI-First Approach ===
            cdi_path = os.path.join(base_dir, '_iwish-output', 'notebooks', 'dependency-index.yaml')
            cdi_fresh = False
            if os.path.exists(cdi_path):
                try:
                    with open(cdi_path, 'r', encoding='utf-8') as cf:
                        cdi_data = yaml.safe_load(cf) or {}
                        
                    compiled_at_str = cdi_data.get('compiled_at', '')
                    if compiled_at_str:
                        if compiled_at_str.endswith('Z'):
                            compiled_at_str = compiled_at_str[:-1] + '+00:00'
                        from datetime import datetime
                        cdi_time = datetime.fromisoformat(compiled_at_str).timestamp()
                    else:
                        cdi_time = os.path.getmtime(cdi_path)
                        
                    newest_mtime = 0
                    epic_dir = os.path.join(base_dir, '_iwish-output', '3. Development', '1. Epic & Story')
                    if os.path.exists(epic_dir):
                        for root, dirs, files in os.walk(epic_dir):
                            if 'story.md' in files:
                                smtime = os.path.getmtime(os.path.join(root, 'story.md'))
                                newest_mtime = max(newest_mtime, smtime)
                            if 'epic.md' in files:
                                emtime = os.path.getmtime(os.path.join(root, 'epic.md'))
                                newest_mtime = max(newest_mtime, emtime)
                                
                    if newest_mtime > cdi_time:
                        print("WARN: CDI file is older than the newest story.md/epic.md. Falling back to raw frontmatter.", file=sys.stderr)
                    else:
                        cdi_fresh = True
                except Exception as e:
                    print(f"WARN: Failed to parse CDI staleness: {e}", file=sys.stderr)
            
            cdi_deps_loaded = False
            if cdi_fresh:
                try:
                    with open(cdi_path, 'r', encoding='utf-8') as f:
                        cdi = yaml.safe_load(f) or {}
                    
                    if args.context_type == 'story':
                        cdi_key = f"Story-{args.context_id}"
                        story_data = cdi.get('stories', {}).get(cdi_key, {})
                        for dep_entry in story_data.get('merged_deps', []):
                            dep_id = dep_entry.get('id', '')
                            conf = dep_entry.get('confidence', 0)
                            if conf >= 0.5 and dep_id and dep_id not in deps:
                                deps.append(dep_id)
                        cdi_deps_loaded = True
                    elif args.context_type == 'epic':
                        cdi_key = f"Epic-{args.context_id}"
                        epic_data = cdi.get('epics', {}).get(cdi_key, {})
                        for dep_entry in epic_data.get('upstream', []) + epic_data.get('downstream', []):
                            dep_id = dep_entry.get('id', '')
                            conf = dep_entry.get('confidence', 0)
                            if conf >= 0.5 and dep_id and dep_id not in deps:
                                deps.append(dep_id)
                        cdi_deps_loaded = True
                except Exception as e:
                    print(f"WARN: Failed to read CDI: {e}. Falling back.", file=sys.stderr)
                    cdi_deps_loaded = False

            if not cdi_deps_loaded:
                deps = fm.get('dependencies', [])
                if args.context_type == 'epic':
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            fc = f.read()
                        stories_match = re.search(r'## Stories.*?(##|$)', fc, re.DOTALL)
                        if stories_match:
                            table_text = stories_match.group(0)
                            for line in table_text.split('\n'):
                                if line.strip().startswith('|') and 'Story ID' not in line and '---' not in line:
                                    cols = [col.strip() for col in line.split('|')]
                                    if len(cols) > 3:
                                        story_deps_str = cols[3]
                                        story_deps = [d.strip() for d in story_deps_str.split(',') if d.strip()]
                                        for sd in story_deps:
                                            if sd and sd not in deps:
                                                deps.append(sd)
                    except Exception:
                        pass
    else:
        title = args.context_id

    # === Step 1: Resolve Epic IDs from dependencies ===
    dep_epic_ids = set()
    dependencies_parsed = deps.copy()

    for dep in deps:
        if dep.startswith('Story-'):
            parts = dep.replace('Story-', '').split('.')
            if parts:
                dep_epic_ids.add(parts[0])
        elif dep.startswith('Epic-'):
            dep_epic_ids.add(dep.replace('Epic-', ''))

    # Also resolve the story's OWN epic
    own_epic_id = None
    if args.context_type == 'story' and '.' in args.context_id:
        own_epic_id = args.context_id.split('.')[0]

    # === Step 2: Scan directory to map Epic IDs → Feature Group folder names ===
    epic_dir = os.path.join(base_dir, '_iwish-output', '3. Development', '1. Epic & Story')
    epic_to_fg = {}  # e.g. {"72": "FG-07-Data-Platform-Analytics"}

    if os.path.exists(epic_dir):
        for fg_folder in os.listdir(epic_dir):
            fg_path = os.path.join(epic_dir, fg_folder)
            if os.path.isdir(fg_path) and fg_folder.startswith('FG-'):
                for epic_folder in os.listdir(fg_path):
                    if epic_folder.startswith('Epic-'):
                        eid = epic_folder.replace('Epic-', '')
                        epic_to_fg[eid] = fg_folder

    # Resolve dependency epics to FG names
    dep_fg_names = set()
    for eid in dep_epic_ids:
        if eid in epic_to_fg:
            dep_fg_names.add(epic_to_fg[eid])

    # Resolve own epic to FG name
    own_fg_name = None
    if own_epic_id and own_epic_id in epic_to_fg:
        own_fg_name = epic_to_fg[own_epic_id]

    feature_groups_resolved = sorted(dep_fg_names | ({own_fg_name} if own_fg_name else set()))

    # === Step 3: Extract keywords for research notebook matching ===
    keywords_extracted = set(tags)
    for word in title.split() + description.split():
        cleaned = word.lower().strip(',.()\'\"')
        if len(cleaned) > 4:
            keywords_extracted.add(cleaned)

    # Parse taxonomy for domain matching
    taxonomy_matches = []
    taxonomy_path = os.path.join(base_dir, args.taxonomy)
    taxonomy_keywords = {}  # domain_node -> [keywords]
    if os.path.exists(taxonomy_path):
        try:
            with open(taxonomy_path, 'r', encoding='utf-8') as f:
                content = f.read()
            # Parse root domains and their keywords
            current_domain = None
            for line in content.split('\n'):
                line = line.rstrip()
                # Match root domain (2 spaces indent)
                domain_match = re.match(r'^  (\w+):', line)
                if domain_match:
                    current_domain = domain_match.group(1)
                # Match keywords line
                kw_match = re.search(r'keywords:\s*\[(.*?)\]', line)
                if kw_match and current_domain:
                    kws = [k.strip(' "\'') for k in kw_match.group(1).split(',')]
                    if current_domain not in taxonomy_keywords:
                        taxonomy_keywords[current_domain] = []
                    taxonomy_keywords[current_domain].extend(kws)
        except Exception:
            pass

    # Match keywords against taxonomy
    for domain, domain_kws in taxonomy_keywords.items():
        for kw in keywords_extracted:
            for dkw in domain_kws:
                if kw.lower() in dkw.lower() or dkw.lower() in kw.lower():
                    match_key = f"{domain}"
                    if match_key not in taxonomy_matches:
                        taxonomy_matches.append(match_key)

    # === Step 4: Match against notebook registry ===
    primary_notebooks = []
    dependency_notebooks = []
    backbone_notebooks = []
    research_notebooks = []

    def _normalize(s):
        return re.sub(r'[^a-z0-9]', '', s.lower())

    for nb in notebooks:
        nb_type = nb.get('type', 'core')
        nb_name = nb.get('name', '')
        nb_fg_raw = nb.get('feature_groups') or []
        nb_tags_raw = nb.get('tags') or []
        if isinstance(nb_fg_raw, str):
            nb_fgs = re.findall(r'FG-\d+', nb_fg_raw)
            if 'ALL' in nb_fg_raw:
                nb_fgs.append('ALL')
        else:
            nb_fgs = []
            for fg in nb_fg_raw:
                if fg == 'ALL':
                    nb_fgs.append('ALL')
                else:
                    nb_fgs.extend(re.findall(r'FG-\d+', str(fg)))
                    
        if isinstance(nb_tags_raw, str):
            nb_tags = [t.strip(' "\'[]') for t in nb_tags_raw.split(',')]
        else:
            nb_tags = [str(t) for t in nb_tags_raw]

        out_nb = {"id": nb.get('id'), "name": nb_name, "type": nb_type, "reason": ""}

        if nb_type == 'epic':
            # Check 1: Match via feature_groups field
            fg_matched = False
            for fg_name in feature_groups_resolved:
                # Extract FG-XX from folder name like "FG-07-Data-Platform-Analytics"
                fg_id_match = re.match(r'(FG-\d+)', fg_name)
                if fg_id_match and fg_id_match.group(1) in nb_fgs:
                    fg_matched = True
                    break

            # Check 2: Fallback — fuzzy match FG folder name against notebook name
            name_matched = False
            if not fg_matched:
                for fg_name in feature_groups_resolved:
                    # Extract meaningful part: "FG-07-Data-Platform-Analytics" -> "data platform analytics"
                    fg_words = re.sub(r'^FG-\d+-', '', fg_name).replace('-', ' ').lower()
                    if fg_words and all(w in _normalize(nb_name) for w in fg_words.split() if len(w) > 2):
                        name_matched = True
                        break

            if fg_matched or name_matched:
                reason = "feature_groups field" if fg_matched else "name match"
                # Is this the story's OWN epic or a dependency?
                is_own = own_fg_name and any(
                    re.match(r'(FG-\d+)', own_fg_name) and re.match(r'(FG-\d+)', own_fg_name).group(1) in nb_fgs
                    for _ in [1]
                ) if nb_fgs else (own_fg_name and _normalize(own_fg_name.split('-', 2)[-1] if '-' in own_fg_name else own_fg_name) in _normalize(nb_name))

                if is_own:
                    out_nb["reason"] = f"Own Epic ({reason})"
                    primary_notebooks.append(out_nb)
                else:
                    out_nb["reason"] = f"Dependency ({reason})"
                    dependency_notebooks.append(out_nb)

        elif nb_type == 'research':
            # Match via tags field in registry
            tag_matched = False
            matched_tags = []
            for kw in keywords_extracted:
                for nt in nb_tags:
                    if kw.lower() in nt.lower() or nt.lower() in kw.lower():
                        tag_matched = True
                        matched_tags.append(nt)
                        break
            # Fallback: match keywords against notebook name
            if not tag_matched:
                for kw in keywords_extracted:
                    if len(kw) > 4 and kw.lower() in nb_name.lower():
                        tag_matched = True
                        matched_tags.append(kw)

            if tag_matched:
                out_nb["reason"] = f"Matched: {', '.join(list(set(matched_tags))[:3])}"
                research_notebooks.append(out_nb)

        elif nb_type == 'core':
            # Always include Core-PRD as baseline
            if 'Core-PRD' in nb_name:
                out_nb["reason"] = "Baseline (always included)"
                backbone_notebooks.append(out_nb)
            # Include Core-Architecture if story touches backend/data/infra
            elif 'Architecture' in nb_name:
                backend_kws = {'data', 'backend', 'architecture', 'database', 'api', 'service',
                               'infrastructure', 'queue', 'event', 'redis', 'bullmq', 'postgres'}
                if keywords_extracted & backend_kws or any(t in taxonomy_matches for t in ['architecture', 'database', 'security']):
                    out_nb["reason"] = "Backend/Data context"
                    backbone_notebooks.append(out_nb)
            # Include Core-UX if story touches UI/frontend
            elif 'UX' in nb_name or 'Design' in nb_name:
                ui_kws = {'ui', 'ux', 'frontend', 'design', 'component', 'layout', 'page', 'screen'}
                if keywords_extracted & ui_kws or 'frontend' in taxonomy_matches:
                    out_nb["reason"] = "UI/UX context"
                    backbone_notebooks.append(out_nb)
            # Include Core-Business-GTM if strategy/business related
            elif 'Business' in nb_name or 'GTM' in nb_name:
                biz_kws = {'business', 'strategy', 'pricing', 'market', 'revenue', 'billing', 'subscription'}
                if keywords_extracted & biz_kws:
                    out_nb["reason"] = "Business context"
                    backbone_notebooks.append(out_nb)
                
    output = {
        "context_type": args.context_type,
        "context_id": args.context_id,
        "primary_notebooks": primary_notebooks,
        "dependency_notebooks": dependency_notebooks,
        "backbone_notebooks": backbone_notebooks,
        "research_notebooks": research_notebooks,
        "total_count": len(primary_notebooks) + len(dependency_notebooks) + len(backbone_notebooks) + len(research_notebooks),
        "resolution_evidence": {
            "dependencies_parsed": dependencies_parsed,
            "feature_groups_resolved": feature_groups_resolved,
            "keywords_extracted": list(keywords_extracted),
            "taxonomy_matches": taxonomy_matches
        }
    }
    
    try:
        json_str = json.dumps(output, indent=2)
        print(json_str)
        if args.output_json:
            out_path = os.path.realpath(args.output_json)
            base_real = os.path.realpath(base_dir)
            allowed_dir1 = os.path.realpath(os.path.join(base_dir, '_iwish-output'))
            allowed_dir2 = os.path.realpath(os.path.join(base_dir, '.agent'))
            
            is_valid = False
            for allowed in [allowed_dir1, allowed_dir2]:
                if os.path.commonpath([allowed, out_path]) == allowed:
                    is_valid = True
                    break
                    
            if not is_valid:
                raise ValueError("Output path traversal detected: must be in _iwish-output or .agent directories")
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(json_str)
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
