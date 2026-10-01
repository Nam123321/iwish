#!/usr/bin/env python3
import os, sys, subprocess, fcntl, json
from pathlib import Path

QUEUE_DIR = ".agent/reconcile-queue"
LOCK_FILE = "/tmp/reconcile-engine.lock"

def run_git(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True)

# Add scripts directory to path so we can import the graph builder
sys.path.append(str(Path(__file__).parent))
try:
    from build_reconciliation_graph import build_graph, CycleError
except ImportError:
    # If the file is named with hyphens, we might need to use importlib
    import importlib.util
    spec = importlib.util.spec_from_file_location("build_reconciliation_graph", str(Path(__file__).parent / "build-reconciliation-graph.py"))
    build_reconciliation_graph = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(build_reconciliation_graph)
    build_graph = build_reconciliation_graph.build_graph
    CycleError = build_reconciliation_graph.CycleError

def pre_flight():
    run_git("git branch -D reconcile-tmp")
    out = run_git("git status --porcelain").stdout
    if out.strip():
        print("Workspace is dirty. Aborting.")
        sys.exit(1)

def main():
    with open(LOCK_FILE, 'w') as lf:
        try:
            fcntl.flock(lf, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print("Engine is already running. Aborting.")
            sys.exit(1)
        
        pre_flight()
        
        if not os.path.exists(QUEUE_DIR):
            return

        for qf in os.listdir(QUEUE_DIR):
            if not qf.endswith('.json'): continue
            path = os.path.join(QUEUE_DIR, qf)
            
            with open(path, 'r') as f:
                data = json.load(f)
            
            changed_files = data.get("files", [])
            print(f"Processing queue item: {qf} with changed files: {changed_files}")
            
            run_git("git checkout -b reconcile-tmp")
            
            # Calculate Blast Radius using the Graph SSOT
            target_dirs = [
                "1. Idea Discovery",
                "2. Product Planning",
                "_iwish-output/stories",
                "_iwish-output"
            ]
            
            print("Building Reconciliation Graph to calculate Blast Radius...")
            try:
                graph = build_graph(target_dirs)
                graph.detect_cycles()
            except Exception as e:
                print(f"Graph error: {e}")
                success = False
            
            success = True
            blast_radius = set()
            for cf in changed_files:
                matched_id = None
                cf_path = Path(cf).resolve()
                for nid, node in graph.nodes.items():
                    # For hierarchical mode where many files are just 'story.md', basename matching is dangerous.
                    # We must check if the absolute paths match, or if the relative paths end with the changed file.
                    try:
                        node_path = Path(node.filepath).resolve()
                        if cf_path == node_path:
                            matched_id = nid
                            break
                    except Exception:
                        pass
                    
                    # Fallback for logical IDs (e.g., if nid is 'story-10.1' and cf contains 'Story-10.1')
                    if nid in cf:
                        matched_id = nid
                        break
                
                if matched_id:
                    blast_radius.update(graph.nodes[matched_id].incoming)
                    blast_radius.update(graph.nodes[matched_id].outgoing)
            
            if blast_radius:
                print(f"Calculated Blast Radius: {list(blast_radius)}")
            else:
                print("No immediate downstream/upstream dependencies found.")
            
            # Here we would normally trigger downstream updates (e.g. LLM calls or sed scripts).
            # For this engine MVP, we validate that the blast radius isn't broken.
            
            if success:
                run_git("git checkout -")
                merge_res = run_git("git merge reconcile-tmp")
                if merge_res.returncode == 0:
                    os.rename(path, path + ".processing")
                    os.remove(path + ".processing")
                else:
                    run_git("git merge --abort")
            else:
                run_git("git checkout -")
            
            run_git("git branch -D reconcile-tmp")

if __name__ == "__main__":
    main()
