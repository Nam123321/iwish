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

import sys
import json
import yaml
import os
from datetime import datetime, timezone

REGISTRY_PATH = "_iwish-output/notebooks/notebook-registry.yaml"

def load_registry():
    if not os.path.exists(REGISTRY_PATH):
        return {"notebooks": []}
    with open(REGISTRY_PATH, 'r') as f:
        return yaml.safe_load(f) or {"notebooks": []}


def save_registry(data):
    os.makedirs(os.path.dirname(REGISTRY_PATH), exist_ok=True)
    with open(REGISTRY_PATH, 'w') as f:
        yaml.dump(data, f, sort_keys=False)


def get_json_input(args, index=2):
    if len(args) > index and args[index] != "-":
        return args[index]
    if not sys.stdin.isatty():
        MAX_PAYLOAD_SIZE = 5 * 1024 * 1024
        return sys.stdin.read(MAX_PAYLOAD_SIZE)
    raise ValueError(f"No JSON input provided on sys.argv[{index}] or sys.stdin")


import time
import fcntl
from contextlib import contextmanager

@contextmanager
def acquire_lock(lock_path, timeout=10):
    start_time = time.time()
    fd = None
    while True:
        try:
            fd = os.open(lock_path, os.O_CREAT | os.O_RDWR)
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            break
        except (IOError, OSError):
            if fd is not None:
                os.close(fd)
            if time.time() - start_time > timeout:
                raise TimeoutError(f"Could not acquire lock {lock_path} within {timeout}s")
            time.sleep(0.1)
    try:
        yield
    finally:
        if fd is not None:
            try:
                fcntl.flock(fd, fcntl.LOCK_UN)
                os.close(fd)
            except OSError:
                pass

def do_upsert_source(registry, req_data):
    nb_id = req_data.get('notebook_id')
    path = req_data.get('path')
    md5 = req_data.get('md5')
    if not nb_id or not path or not md5:
        raise ValueError("Missing required fields: notebook_id, path, md5")
    
    if 'last_synced' in req_data:
        last_synced_val = req_data['last_synced']
    else:
        last_synced_val = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    
    found_nb = None
    for nb in registry.get('notebooks', []):
        if nb.get('id') == nb_id:
            found_nb = nb
            break
    
    if not found_nb:
        raise ValueError(f"Notebook {nb_id} not found.")
    
    if 'sync_sources' not in found_nb:
        found_nb['sync_sources'] = []
    
    source_found = False
    for src in found_nb['sync_sources']:
        if src.get('path') == path:
            src['md5'] = md5
            src['last_synced'] = last_synced_val
            source_found = True
            break
    
    if not source_found:
        found_nb['sync_sources'].append({
            'path': path,
            'md5': md5,
            'last_synced': last_synced_val
        })
    return source_found, nb_id, path

def main():
    lock_path = REGISTRY_PATH + '.lock'
    with acquire_lock(lock_path):
        if len(sys.argv) < 2:
            print("Usage: python3 registry_crud_manager.py [add|update|remove|upsert_source] [json_data|id]")
            sys.exit(1)
            
        action = sys.argv[1]
        registry = load_registry()
        
        if action == "add":
            try:
                new_nb = json.loads(get_json_input(sys.argv))
                if 'id' not in new_nb:
                    raise ValueError("Missing 'id'")
                registry['notebooks'].append(new_nb)
                save_registry(registry)
                print(f"Successfully added notebook {new_nb['id']}")
            except Exception as e:
                print(f"Error adding notebook: {e}")
                sys.exit(1)
                
        elif action == "update":
            try:
                update_data = json.loads(get_json_input(sys.argv))
                nb_id = update_data.get('id')
                found = False
                for nb in registry['notebooks']:
                    if nb.get('id') == nb_id:
                        nb.update(update_data)
                        nb['last_synced'] = datetime.utcnow().isoformat() + "Z"
                        found = True
                        break
                if not found:
                    print(f"Notebook {nb_id} not found for update.")
                    sys.exit(1)
                save_registry(registry)
                print(f"Successfully updated notebook {nb_id}")
            except Exception as e:
                print(f"Error updating notebook: {e}")
                sys.exit(1)
                
        elif action == "remove":
            if len(sys.argv) < 3:
                print("Usage for remove: python3 registry_crud_manager.py remove <id>")
                sys.exit(1)
            nb_id = sys.argv[2]
            registry['notebooks'] = [nb for nb in registry['notebooks'] if nb.get('id') != nb_id]
            save_registry(registry)
            print(f"Successfully removed notebook {nb_id}")
        
        elif action == "upsert_source":
            try:
                req_data = json.loads(get_json_input(sys.argv))
                source_found, nb_id, path = do_upsert_source(registry, req_data)
                save_registry(registry)
                action_type = "updated" if source_found else "added"
                print(f"Successfully {action_type} source {path} for notebook {nb_id}")
            except Exception as e:
                print(f"Error upserting source: {e}")
                sys.exit(1)
        
        else:
            print("Unknown action")
            sys.exit(1)
        

if __name__ == "__main__":
    main()

