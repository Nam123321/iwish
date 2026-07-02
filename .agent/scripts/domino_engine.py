import os
import json
import re
import yaml
import time
import logging

try:
    from falkordb import FalkorDB
    FALKOR_AVAILABLE = True
except ImportError:
    FALKOR_AVAILABLE = False

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

CACHE_FILE = ".agent/graph_cache.json"

def parse_frontmatter(content):
    if not content.startswith('---'):
        return None
    try:
        end = content.find('---', 3)
        if end != -1:
            fm_text = content[3:end]
            return yaml.safe_load(fm_text)
    except Exception:
        pass
    return None

def extract_status_from_content(content):
    match = re.search(r'\*\*Status\*\*:\s*([a-zA-Z-]+)', content)
    if match: return match.group(1).lower()
    if 'status: completed' in content.lower(): return 'completed'
    if 'status: in-progress' in content.lower(): return 'in-progress'
    return 'backlog'

def extract_number(filename):
    match = re.search(r'(\d+(?:\.\d+)?)', filename)
    return float(match.group(1)) if match else 999.0

class DominoEngine:
    def __init__(self, project_root="."):
        self.project_root = project_root
        self.use_falkor = False
        self.db = None
        self.graph = None
        
        self.cache_path = os.path.join(project_root, CACHE_FILE)
        self.cache_data = {
            "last_sync": 0,
            "epics_dict": {}
        }
        
        # Try to connect to FalkorDB
        if FALKOR_AVAILABLE:
            try:
                self.db = FalkorDB(host='localhost', port=6380)
                self.graph = self.db.select_graph("iwish_domino")
                # Test connection
                self.graph.query("RETURN 1")
                self.use_falkor = True
                logging.info("[Domino] Connected to FalkorDB successfully.")
            except Exception as e:
                logging.info("[Domino] FalkorDB connection failed, falling back to JSON Cache.")
                self.use_falkor = False
        else:
            logging.info("[Domino] FalkorDB package not found, using JSON Cache.")

        if not self.use_falkor:
            self._load_cache()

    def _load_cache(self):
        if os.path.exists(self.cache_path):
            try:
                with open(self.cache_path, "r", encoding="utf-8") as f:
                    self.cache_data = json.load(f)
            except json.JSONDecodeError:
                self.cache_data = {"last_sync": 0, "epics_dict": {}}

    def _save_cache(self):
        os.makedirs(os.path.dirname(self.cache_path), exist_ok=True)
        with open(self.cache_path, "w", encoding="utf-8") as f:
            json.dump(self.cache_data, f, indent=2, ensure_ascii=False)

    def parse_feature_groups(self):
        mapping = {}
        epics_file = os.path.join(self.project_root, "_iwish-output", "2. Product Planning", "2.4. epics-and-stories.md")
        if os.path.exists(epics_file):
            with open(epics_file, "r", encoding="utf-8") as f:
                for line in f:
                    match = re.search(r'\|\s*\*\*(?:Epic|E)-?(\d+)\*\*\s*\|[^\|]+\|\s*([^\|]+)\s*\|', line, re.IGNORECASE)
                    if match:
                        epic_num = int(match.group(1))
                        fg = match.group(2).strip()
                        if fg and fg.lower() != "uncategorized":
                            mapping[epic_num] = fg

        hierarchy_file = os.path.join(self.project_root, "_iwish-output", "2. Product Planning", "2.6. feature-hierarchy.md")
        if not os.path.exists(hierarchy_file):
            hierarchy_file = os.path.join(self.project_root, "_iwish-output", "2. Product Planning", "2.5. feature-hierarchy.md")
        
        if os.path.exists(hierarchy_file):
            with open(hierarchy_file, "r", encoding="utf-8") as f:
                lines = f.readlines()
            current_module = "Uncategorized"
            for line in lines:
                module_match = re.search(r'^(?:#{3,4})\s+(?:[^a-zA-Z0-9]*\s*)?(\d+\.\d+(?:\.\d+)?\s+.*?)$', line.strip())
                if module_match:
                    current_module = module_match.group(1).strip()
                    continue
                
                module_match_legacy = re.match(r'^###\s+(\d+\.\s+.*?)$', line.strip())
                if module_match_legacy:
                    current_module = module_match_legacy.group(1).strip()
                    continue
                    
                epic_match = re.search(r'\|\s*E-(\d+)', line, re.IGNORECASE) or re.search(r'\((?:E|Epic\s*)(\d+)', line, re.IGNORECASE)
                if epic_match:
                    epic_num = int(epic_match.group(1))
                    if epic_num not in mapping:
                        mapping[epic_num] = current_module

        return mapping

    def _process_story_file(self, story_md_path, story_id):
        if not os.path.exists(story_md_path): return None
        with open(story_md_path, "r", encoding="utf-8") as f:
            content = f.read()
        fm = parse_frontmatter(content)
        
        title = fm.get("title", "") if fm else ""
        if not title:
            match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
            title = match.group(1).strip() if match else story_id
            
        status = fm.get("status") if fm else None
        if not status:
            status = extract_status_from_content(content)
            
        return {
            "id": story_id,
            "title": title,
            "status": status.lower(),
            "dependencies": fm.get("dependencies", []) if fm else [],
            "mtime": os.path.getmtime(story_md_path)
        }

    def _process_epic_file(self, epic_md_path, epic_id, epic_to_fg_map):
        if not os.path.exists(epic_md_path): return None
        with open(epic_md_path, "r", encoding="utf-8") as f:
            content = f.read()
        fm = parse_frontmatter(content)
        
        title = fm.get("title", "") if fm else ""
        if not title:
            title = f"Epic {epic_id.split('-')[-1]}"
            
        status = fm.get("status") if fm else None
        if not status:
            status = extract_status_from_content(content)
            
        frs = "N/A"
        fr_match = re.search(r'(?:FRs|FR Covered):\s*([^\n]+)', content, re.IGNORECASE)
        if fr_match:
            frs = fr_match.group(1).strip()
            
        fg = "Uncategorized"
        fg_match = re.search(r'(?:Feature Group|FG):\s*([^\n]+)', content, re.IGNORECASE)
        if fg_match:
            fg = fg_match.group(1).strip()
        else:
            epic_num_str = epic_id.split('-')[-1]
            if epic_num_str.isdigit():
                epic_num = int(epic_num_str)
                if epic_num in epic_to_fg_map:
                    fg = epic_to_fg_map[epic_num]
            
        return {
            "id": epic_id,
            "title": title,
            "status": status.lower(),
            "frs": frs,
            "fg": fg,
            "mtime": os.path.getmtime(epic_md_path)
        }

    def sync_graph(self):
        base_dir = os.path.join(self.project_root, "_iwish-output", "3. Development", "1. Epic & Story")
        if not os.path.exists(base_dir):
            return self.cache_data["epics_dict"]

        epic_to_fg_map = self.parse_feature_groups()
        last_sync = self.cache_data.get("last_sync", 0)
        current_time = time.time()
        
        modified_count = 0
        epics_dict = self.cache_data.get("epics_dict", {})

        for item in os.listdir(base_dir):
            item_path = os.path.join(base_dir, item)
            if not os.path.isdir(item_path):
                continue
            
            epic_dirs = []
            if item.startswith("FG-"):
                for epic_item in os.listdir(item_path):
                    epic_path = os.path.join(item_path, epic_item)
                    if os.path.isdir(epic_path) and epic_item.startswith("Epic-"):
                        epic_dirs.append((epic_item, epic_path, item))
            elif item.startswith("Epic-"):
                epic_dirs.append((item, item_path, None))
                
            for epic_item, epic_path, fg_folder in epic_dirs:
                epic_id = f"epic-{extract_number(epic_item):g}".replace('.0', '')
                epic_md = os.path.join(epic_path, "epic.md")
                
                # Check if epic needs updating
                epic_mtime = os.path.getmtime(epic_md) if os.path.exists(epic_md) else 0
                needs_update = epic_id not in epics_dict or epic_mtime > last_sync
                
                if needs_update:
                    epic_data = self._process_epic_file(epic_md, epic_id, epic_to_fg_map)
                    if not epic_data:
                        epic_data = {"id": epic_id, "title": epic_item, "status": "backlog", "fg": fg_folder or "Uncategorized"}
                    elif fg_folder and epic_data["fg"] == "Uncategorized":
                        epic_data["fg"] = fg_folder
                        
                    epic_data["stories"] = []
                    modified_count += 1
                else:
                    epic_data = epics_dict[epic_id]
                
                for story_item in os.listdir(epic_path):
                    story_path = os.path.join(epic_path, story_item)
                    if os.path.isdir(story_path) and story_item.startswith("Story-"):
                        story_id = f"story-{story_item.split('-')[-1]}"
                        story_md = os.path.join(story_path, "story.md")
                        
                        story_mtime = os.path.getmtime(story_md) if os.path.exists(story_md) else 0
                        existing_story = next((s for s in epic_data.get("stories", []) if s["id"] == story_id), None)
                        
                        if not existing_story or story_mtime > last_sync:
                            story_data = self._process_story_file(story_md, story_id)
                            if story_data:
                                if existing_story:
                                    epic_data["stories"].remove(existing_story)
                                epic_data["stories"].append(story_data)
                                if not needs_update:
                                    modified_count += 1
                
                epic_data["stories"] = sorted(epic_data.get("stories", []), key=lambda x: extract_number(x["id"]))
                epics_dict[epic_id] = epic_data

        self.cache_data["epics_dict"] = epics_dict
        self.cache_data["last_sync"] = current_time
        
        if not self.use_falkor:
            self._save_cache()
        else:
            try:
                for epic_id, epic_data in epics_dict.items():
                    self.graph.query("MERGE (e:Epic {id: $id}) SET e.title=$title, e.status=$status, e.fg=$fg",
                        {'id': epic_id, 'title': epic_data['title'], 'status': epic_data['status'], 'fg': epic_data['fg']})
                    for story in epic_data.get('stories', []):
                        self.graph.query("MERGE (s:Story {id: $id}) SET s.title=$title, s.status=$status",
                            {'id': story['id'], 'title': story['title'], 'status': story['status']})
                        self.graph.query("MATCH (s:Story {id: $sid}), (e:Epic {id: $eid}) MERGE (s)-[:BELONGS_TO]->(e)",
                            {'sid': story['id'], 'eid': epic_id})
                        for dep in story.get('dependencies', []):
                            # Pre-create dep node if it doesn't exist, to avoid missing matches
                            self.graph.query("MERGE (d:Story {id: $did})", {'did': dep})
                            self.graph.query("MATCH (s:Story {id: $sid}), (d:Story {id: $did}) MERGE (s)-[:DEPENDS_ON]->(d)",
                                {'sid': story['id'], 'did': dep})
                logging.info("[Domino] Synced FalkorDB graph nodes and edges.")
            except Exception as e:
                logging.error(f"[Domino] Error pushing to FalkorDB: {e}")
            
        logging.info(f"[Domino] Synced {modified_count} modified file(s).")
        return epics_dict

    def get_epics_dict(self):
        return self.sync_graph()

if __name__ == "__main__":
    import sys
    engine = DominoEngine(sys.argv[1] if len(sys.argv) > 1 else ".")
    engine.sync_graph()
