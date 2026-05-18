import os
import re
import json
import glob
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BMAD_OUTPUT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))
NAV_JS_FILE = os.path.join(SCRIPT_DIR, 'js', 'navigator-data.js')

MIN_CONFIDENCE = 60
AMBIGUITY_DELTA = 10

class DataIntegrityErrors(Exception):
    def __init__(self, errors):
        self.errors = errors

def parse_yaml_lines(yaml_text):
    data = {}
    for line in yaml_text.split('\n'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        parts = line.split(':', 1)
        if len(parts) == 2:
            key = parts[0].strip()
            val = parts[1].strip().strip('"').strip("'")
            if key in ['refs', 'related_to', 'depends_on']:
                val = val.strip('[]')
                data[key] = [v.strip().strip('"').strip("'") for v in val.split(',') if v.strip()]
            else:
                data[key] = val
    return data

def guess_phase_from_path(filepath):
    path_lower = filepath.lower()
    if '/epics/' in path_lower:
        return 'origin'
    if '/brainstorming/' in path_lower:
        return 'spark'
    if '/research/' in path_lower:
        return 'deep_dive'
    if '/stories/' in path_lower:
        return 'forge'
    return None

def fuzzy_match(reference, candidate_filenames):
    ref_norm = reference.lower().replace('-', ' ').strip()
    matches = []
    
    for candidate in candidate_filenames:
        cand_base = os.path.basename(candidate)
        cand_norm = cand_base.lower().replace('.md', '').replace('-', ' ').strip()
        
        # Exact match
        if ref_norm == cand_norm:
            matches.append((candidate, 100))
            continue
            
        # Substring match
        if ref_norm in cand_norm or cand_norm in ref_norm:
            score = 50 + (len(ref_norm) / len(cand_norm) * 50 if len(cand_norm) > 0 else 0)
            matches.append((candidate, min(99, score)))
            
    matches.sort(key=lambda x: x[1], reverse=True)
    return matches

def process_file(filepath, candidate_filenames):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        print(f"⚠️ Encoding error in {os.path.basename(filepath)}. Skipping.")
        return None

    # Match yaml frontmatter allowing leading whitespace/BOM
    content_stripped = content.lstrip('\ufeff').lstrip()
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)', content_stripped, re.DOTALL)
    if not match:
        return None # Not a bmad markdown file with yaml frontmatter

    yaml_text = match.group(1)
    body_text = match.group(2)
    yaml_data = parse_yaml_lines(yaml_text)

    phase = yaml_data.get('phase')
    if not phase:
        guessed_phase = guess_phase_from_path(filepath)
        if guessed_phase:
            # Auto-heal the markdown file
            new_yaml_text = yaml_text.strip() + f'\nphase: "{guessed_phase}"\n'
            new_content = f'---\n{new_yaml_text}\n---\n{body_text}'
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✅ Auto-healed missing phase for {os.path.basename(filepath)} -> {guessed_phase}")
            phase = guessed_phase
            yaml_data['phase'] = phase
        else:
            print(f"⚠️ Missing or unmappable phase for {os.path.basename(filepath)}")
            return None

    # Determine type
    doc_type = 'node'
    if '/epics/' in filepath:
        doc_type = 'epic'
    elif '/stories/' in filepath:
        doc_type = 'story'

    id_val = yaml_data.get('story_id') or yaml_data.get('epic_id') or yaml_data.get('epic') or os.path.basename(filepath).replace('.md', '')
    tag_val = yaml_data.get('story_id') or yaml_data.get('epic') or 'Node'
    title_val = yaml_data.get('title') or os.path.basename(filepath)
    
    # Try to find a description from markdown if not in YAML
    desc_val = yaml_data.get('description', '')
    if not desc_val:
        # Extract paragraph after **I want** (can span multiple lines, stopping at empty line)
        desc_match = re.search(r'\*\*I want\*\*\s+(.*?)(?:\n\s*\n|#)', body_text, re.DOTALL)
        if desc_match:
            desc_val = desc_match.group(1).strip()
        else:
            # Take first 100 chars, stripping standard headings
            clean_text = re.sub(r'#.*?\n', '', body_text).strip()
            desc_val = clean_text[:100] + '...' if len(clean_text) > 100 else clean_text
            
    footer_left = f"Status: {yaml_data.get('status', 'Planning')}"
    footer_right = yaml_data.get('assignee', '#node')

    file_errors = []
    relations = {}
    for rel_type in ['refs', 'related_to', 'depends_on']:
        refs_list = yaml_data.get(rel_type, [])
        if isinstance(refs_list, str):
            refs_list = [refs_list]
        
        resolved_refs = []
        for ref in refs_list:
            matches = fuzzy_match(ref, candidate_filenames)
            if not matches or matches[0][1] < MIN_CONFIDENCE:
                file_errors.append({
                    "type": "missing",
                    "file": os.path.basename(filepath),
                    "ref": ref
                })
                continue
            
            if len(matches) > 1:
                top_score = matches[0][1]
                second_score = matches[1][1]
                if top_score - second_score < AMBIGUITY_DELTA:  # Ambiguity threshold
                    file_errors.append({
                        "type": "ambiguous",
                        "file": os.path.basename(filepath),
                        "ref": ref,
                        "matches": matches
                    })
                    continue
                    
            resolved_refs.append(matches[0][0])
            
        relations[rel_type] = resolved_refs

    pivots = []
    blocks = re.split(r'\n\s*\n', body_text)
    for block in blocks:
        # Match PIVOT only as a whole word, not part of inline code like `PIVOT` if possible.
        # A simple check: replace `...` with empty string for checking.
        clean_block = re.sub(r'`[^`]*`', '', block)
        if re.search(r'\bPIVOT\b', clean_block):
            pivots.append(block.strip())
            
    has_pivot = len(pivots) > 0

    if file_errors:
        raise DataIntegrityErrors(file_errors)

    return {
        "filepath": os.path.relpath(filepath, BMAD_OUTPUT_DIR),
        "phase": phase,
        "relations": relations,
        "data": {
            "id": id_val,
            "tag": tag_val,
            "type": doc_type,
            "title": title_val,
            "description": desc_val,
            "content": body_text.strip(),
            "footerLeft": footer_left,
            "footerRight": footer_right,
            "resolved_refs": relations.get('refs', []),
            "hasPivot": has_pivot,
            "pivots": pivots
        }
    }

def main():
    print("🚀 Starting BMAD Navigator Sync Engine...")
    
    # Ensure JS directory exists
    os.makedirs(os.path.dirname(NAV_JS_FILE), exist_ok=True)

    nav_data = {
        "origin": [],
        "spark": [],
        "deep_dive": [],
        "forge": [],
        "edges": []
    }

    search_pattern = os.path.join(BMAD_OUTPUT_DIR, '**', '*.md')
    md_files = glob.glob(search_pattern, recursive=True)
    
    # Use relative paths for candidates to avoid collision issues and match id_val
    candidate_filenames = [os.path.relpath(f, BMAD_OUTPUT_DIR) for f in md_files]
    
    processed_count = 0
    all_errors = []
    processed_files = []
    file_to_id = {}

    for filepath in md_files:
        try:
            result = process_file(filepath, candidate_filenames)
        except DataIntegrityErrors as e:
            all_errors.extend(e.errors)
            continue

        if result:
            phase = result['phase'].lower()
            if phase in nav_data:
                nav_data[phase].append(result['data'])
                processed_files.append(result)
                file_to_id[result['filepath']] = result['data']['id']
                processed_count += 1
            else:
                print(f"⚠️ Unknown phase '{phase}' in {os.path.basename(filepath)}")

    # Build Edges
    for result in processed_files:
        src_id = result['data']['id']
        for rel_type, resolved_paths in result.get('relations', {}).items():
            if rel_type in ['related_to', 'depends_on']:
                for target_path in resolved_paths:
                    target_id = file_to_id.get(target_path)
                    if target_id:
                        nav_data['edges'].append({
                            "source": src_id,
                            "target": target_id,
                            "type": rel_type
                        })

    if all_errors:
        print("\n❌ DATA INTEGRITY ERRORS DETECTED")
        print("The sync engine encountered unresolvable references. To maintain project integrity, no output was generated.\n")
        
        for err in all_errors:
            if err["type"] == "missing":
                print(f"  [MISSING] In '{err['file']}': Could not find reference '{err['ref']}'")
            elif err["type"] == "ambiguous":
                print(f"  [AMBIGUOUS] In '{err['file']}': Reference '{err['ref']}' is ambiguous. Matches:")
                for idx, (cand, score) in enumerate(err["matches"][:5]):
                    rec = " -> RECOMMENDATION" if idx == 0 else ""
                    print(f"    {idx+1}. {cand} (Score: {score:.1f}){rec}")
        
        print("\nAGENT INSTRUCTION: Ask user to provide the correct file references, update the source markdown's YAML 'refs', and rerun.")
        print("\n⚠️ Proceeding with generation despite errors for visualization purposes...")

    # Write to navigator-data.js safely
    json_payload = json.dumps(nav_data, ensure_ascii=False, indent=2)
    js_content = f"window.BMAD_NAV_DATA = {json_payload};\n"
    
    with open(NAV_JS_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print(f"✅ Sync complete! Processed {processed_count} files into {os.path.relpath(NAV_JS_FILE, BMAD_OUTPUT_DIR)}")

if __name__ == '__main__':
    main()
