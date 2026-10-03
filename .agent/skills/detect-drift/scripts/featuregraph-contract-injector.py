#!/usr/bin/env python3
import sys
import argparse
import subprocess
import json
import os

def inject_contract(story_dir: str):
    """Injects contract nodes into FalkorDB."""
    bundle_path = os.path.join(story_dir, "contract-bundle.json")
    if not os.path.exists(bundle_path):
        print(f"[SKIP] No contract bundle found at {bundle_path}")
        return
        
    try:
        with open(bundle_path, 'r') as f:
            bundle = json.load(f)
            
        story_id = bundle.get("storyId")
        entities = bundle.get("entities", [])
        
        if not entities:
            print("[SKIP] No entities to inject.")
            return
            
        print(f"[INJECT] Injecting {len(entities)} entities for Story-{story_id} into FeatureGraph...")
        
        # Here we would normally build Cypher queries to inject into FalkorDB.
        # Example Cypher: MERGE (e:DataEntity {name: '...'}) MERGE (s:Story {id: '...'}) MERGE (s)-[:MUTATES]->(e)
        
        # Checking if FalkorDB is running on port 6379 (defined in .env for this workspace)
        # Using a timeout to prevent hanging.
        check_cmd = ["timeout", "2s", "redis-cli", "-h", "localhost", "-p", "6379", "PING"]
        result = subprocess.run(check_cmd, capture_output=True, text=True)
        
        if "PONG" not in result.stdout:
            print("[WARN] FalkorDB is not reachable on port 6379. Skipping injection.")
            return
            
        for entity in entities:
            name = entity.get("name")
            action = entity.get("action")
            
            cypher = f"MERGE (e:DataEntity {{name: '{name}'}}) MERGE (s:Story {{id: 'Story-{story_id}'}}) MERGE (s)-[:{action.upper()}]->(e)"
            subprocess.run(["redis-cli", "-h", "localhost", "-p", "6379", "GRAPH.QUERY", "featuregraph", cypher], capture_output=True)
            
        print("[SUCCESS] Contract nodes injected into FeatureGraph.")
            
    except Exception as e:
        print(f"[ERROR] Failed to inject contract: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--story-dir", required=True)
    args = parser.parse_args()
    
    inject_contract(args.story_dir)
