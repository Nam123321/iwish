import watchmen_core
watchmen_core.verify_execution(__file__)
import os
import sys
import subprocess
from pathlib import Path

def get_untracked_files():
    result = subprocess.run(['git', 'ls-files', '--others', '--exclude-standard'], capture_output=True, text=True)
    if result.returncode != 0:
        print("Error getting untracked files.")
        return []
    return result.stdout.strip().split('\n')

def main():
    target_dirs = sys.argv[1:] if len(sys.argv) > 1 else ['src/', 'prisma/', 'server/', 'tests/']
    untracked = get_untracked_files()
    
    purged_count = 0
    for file_path in untracked:
        if not file_path:
            continue
            
        # Ensure path is strictly within the workspace
        p = Path(file_path).resolve()
        workspace_root = Path.cwd().resolve()
        
        try:
            p.relative_to(workspace_root)
        except ValueError:
            print(f"Skipping Out-of-bounds file: {file_path}")
            continue
            
        # Check if it matches target dirs
        matches_target = False
        for d in target_dirs:
            if file_path.startswith(d):
                matches_target = True
                break
                
        if matches_target and p.exists() and p.is_file():
            try:
                os.remove(p)
                print(f"[Ghost File Buster] Purged: {file_path}")
                purged_count += 1
            except Exception as e:
                print(f"[Ghost File Buster] Failed to remove {file_path}: {e}")
                
    print(f"Purge complete. Removed {purged_count} ghost files safely.")

if __name__ == '__main__':
    main()
