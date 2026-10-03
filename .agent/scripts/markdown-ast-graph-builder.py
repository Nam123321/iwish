import os
import sys
import json
import re
import argparse
import watchmen_core

watchmen_core.verify_execution(__file__)

def build_graph(directory):
    graph = {"nodes": [], "edges": []}
    node_set = set()
    file_list = []
    
    link_pattern = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')
    base_dir = os.path.abspath(directory)
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.md'):
                file_path = os.path.relpath(os.path.join(root, file), directory)
                file_list.append(file_path)
                
                if file_path not in node_set:
                    graph["nodes"].append({"id": file_path, "type": "file"})
                    node_set.add(file_path)
                
                with open(os.path.join(root, file), 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    links = link_pattern.findall(content)
                    for text, url in links:
                        parts = url.split('#')[0].split()
                        if not parts:
                            continue
                        clean_url = parts[0].strip().strip('"').strip("'")
                        
                        if not clean_url.startswith('http') and clean_url.endswith('.md'):
                            target_path = os.path.normpath(os.path.join(os.path.dirname(file_path), clean_url))
                            target_full_path = os.path.abspath(os.path.join(directory, target_path))
                            
                            if target_full_path.startswith(base_dir) and os.path.exists(target_full_path):
                                if target_path not in node_set:
                                    graph["nodes"].append({"id": target_path, "type": "file"})
                                    node_set.add(target_path)
                                
                                graph["edges"].append({
                                    "source": file_path,
                                    "target": target_path,
                                    "label": text
                                })
                                
    degrees = {node: 0 for node in file_list}
    for edge in graph["edges"]:
        degrees[edge["source"]] = degrees.get(edge["source"], 0) + 1
        degrees[edge["target"]] = degrees.get(edge["target"], 0) + 1
        
    isolated_nodes = [node for node, deg in degrees.items() if deg == 0]
    if isolated_nodes:
        isolated_nodes.sort()
        connected_nodes = [node for node, deg in degrees.items() if deg > 0]
        root_node = connected_nodes[0] if connected_nodes else None
        
        if root_node:
            for node in isolated_nodes:
                graph["edges"].append({"source": root_node, "target": node, "label": "fallback_link"})
        else:
            for i in range(len(isolated_nodes) - 1):
                graph["edges"].append({"source": isolated_nodes[i], "target": isolated_nodes[i+1], "label": "linear_fallback"})
            
    return graph

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build Markdown AST Topology Graph")
    parser.add_argument("--dir", required=True, help="Target directory to scan")
    parser.add_argument("--uuid", required=True, help="UUID for the output file")
    args = parser.parse_args()

    if not os.path.exists(args.dir):
        print(f"Error: Directory {args.dir} does not exist.")
        sys.exit(1)

    topology = build_graph(args.dir)
    
    out_dir = "_iwish-output/adhoc-workspace/scratch"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{args.uuid}-repo-topology.json")
    
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(topology, f, indent=2)
    
    print(f"Topology graph built and saved to {out_path}")
    print(f"Nodes: {len(topology['nodes'])}, Edges: {len(topology['edges'])}")
