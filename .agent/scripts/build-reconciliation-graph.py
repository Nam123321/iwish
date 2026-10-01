import os
import re
import yaml
import sys
from typing import Dict, List, Set, Any

class CycleError(Exception):
    pass

class Node:
    def __init__(self, resource_id: str, filepath: str, frontmatter: Dict[str, Any]):
        self.resource_id = resource_id
        self.filepath = filepath
        self.frontmatter = frontmatter
        self.dependencies: List[str] = frontmatter.get('dependencies', [])
        self.links_to: List[str] = frontmatter.get('links_to', [])
        self.parent_doc: str = frontmatter.get('parent_doc', '')
        
        # Edges
        self.outgoing: Set[str] = set()
        self.incoming: Set[str] = set()
        self.structural_outgoing: Set[str] = set()
        
        # Extract dependencies
        self._parse_edges()
        
    def _parse_edges(self):
        for dep in self.dependencies:
            self.outgoing.add(dep)
            self.structural_outgoing.add(dep)
        for link in self.links_to:
            self.outgoing.add(link)
        if self.parent_doc:
            self.outgoing.add(self.parent_doc)
            self.structural_outgoing.add(self.parent_doc)

class ReconciliationGraph:
    def __init__(self):
        self.nodes: Dict[str, Node] = {}
        
    def add_node(self, filepath: str, frontmatter: Dict[str, Any]):
        # Priority for ID: 'resource', then 'id', then filepath
        resource_id = frontmatter.get('resource', frontmatter.get('id', filepath))
        # Ensure resource_id is clean
        if isinstance(resource_id, str):
            node = Node(resource_id, filepath, frontmatter)
            self.nodes[resource_id] = node
            
    def build_edges(self):
        # Resolve edges and build incoming edges
        for node_id, node in self.nodes.items():
            for out_id in node.outgoing:
                # To be robust against relative paths, we might need a loose match
                # if out_id is exactly matching another node's resource_id
                if out_id in self.nodes:
                    self.nodes[out_id].incoming.add(node_id)
                else:
                    # Attempt fuzzy match (e.g. filename only)
                    matched_id = self._fuzzy_match(out_id)
                    if matched_id:
                        self.nodes[matched_id].incoming.add(node_id)
                        
    def _fuzzy_match(self, out_id: str) -> str:
        # If out_id is a filepath, extract basename
        basename = os.path.basename(out_id)
        for nid in self.nodes:
            if basename == os.path.basename(nid) or nid.endswith(out_id):
                return nid
            # Hierarchical mode edge case: nid is a filepath like '.../Story-10.1/story.md' and out_id is 'story-10.1'
            if os.path.basename(nid) == 'story.md':
                parent_dir = os.path.basename(os.path.dirname(nid))
                # e.g., parent_dir='Story-10.1', out_id='story-10.1'
                if parent_dir.lower() == out_id.lower().replace('-', ''):
                    return nid
                if parent_dir.lower() == out_id.lower().replace('story-', 'story-'):
                    return nid
                # just do a flexible string match
                if out_id.lower().replace('story-', '') in parent_dir.lower():
                    return nid
        return None

    def detect_cycles(self):
        visited = set()
        stack = set()
        
        def dfs(node_id: str, path: List[str]):
            visited.add(node_id)
            stack.add(node_id)
            
            node = self.nodes[node_id]
            for neighbor in node.structural_outgoing:
                matched_neighbor = neighbor if neighbor in self.nodes else self._fuzzy_match(neighbor)
                if matched_neighbor:
                    if matched_neighbor in stack:
                        cycle_path = path + [matched_neighbor]
                        raise CycleError(f"Cycle detected: {' -> '.join(cycle_path)}")
                    if matched_neighbor not in visited:
                        dfs(matched_neighbor, path + [matched_neighbor])
            
            stack.remove(node_id)
            
        for node_id in self.nodes:
            if node_id not in visited:
                dfs(node_id, [node_id])
                
    def check_orphans(self):
        orphans = []
        for node_id, node in self.nodes.items():
            # Allowed orphans: top-level like idea discovery or epics.md
            if not node.incoming and not node.outgoing:
                # Filter out intentional standalone files if needed
                orphans.append(node_id)
        return orphans

def extract_frontmatter(filepath: str) -> Dict[str, Any]:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if match:
        try:
            return yaml.safe_load(match.group(1)) or {}
        except yaml.YAMLError as e:
            print(f"YAML Error in {filepath}: {e}")
            return None
    return None

def build_graph(directories: List[str]) -> ReconciliationGraph:
    graph = ReconciliationGraph()
    for directory in directories:
        if not os.path.exists(directory):
            continue
        for root, _, files in os.walk(directory):
            for file in files:
                if file.endswith('.md'):
                    filepath = os.path.join(root, file)
                    frontmatter = extract_frontmatter(filepath)
                    if frontmatter:
                        graph.add_node(filepath, frontmatter)
                        
    graph.build_edges()
    return graph

if __name__ == "__main__":
    target_dirs = [
        "1. Idea Discovery",
        "2. Product Planning",
        "_iwish-output/stories",
        "_iwish-output"
    ]
    print("Building OKF YAML Reconciliation Graph...")
    graph = build_graph(target_dirs)
    print(f"Graph constructed with {len(graph.nodes)} nodes.")
    
    try:
        graph.detect_cycles()
        print("Cycle detection: PASSED (No cycles found)")
    except CycleError as e:
        print(f"Cycle detection: FAILED\n{e}")
        sys.exit(1)
        
    orphans = graph.check_orphans()
    if orphans:
        print(f"Warning: Found {len(orphans)} orphaned nodes (no incoming or outgoing links):")
        for o in orphans:
            print(f"  - {o}")
    else:
        print("Orphan check: PASSED (No pure orphans)")
