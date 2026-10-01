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

import os
import re

def main():
    root_dir = "_iwish-output/3. Development/1. Epic & Story"
    stories = []
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        if 'story.md' in filenames:
            file_path = os.path.join(dirpath, 'story.md')
            story_id = os.path.basename(dirpath)
            
            with open(file_path, 'r') as f:
                content = f.read()
                
            # Get status
            status_match = re.search(r'^status:\s*(\w+)', content, re.MULTILINE)
            status = status_match.group(1) if status_match else "unknown"
            
            # Count ACs
            ac_lines = [line for line in content.split('\n') if re.search(r'\|\s*AC\d+', line)]
            total_acs = len(ac_lines)
            
            missing_acs = 0
            missing_tests = 0
            
            for line in ac_lines:
                if '[MISSING_EVIDENCE]' in line or '[MIGRATION_PLACEHOLDER]' in line:
                    missing_acs += 1
                if '[MISSING_TEST]' in line or '[TBD]' in line:
                    missing_tests += 1
                    
            if total_acs == 0:
                ac_status = "No ACs"
                test_status = "N/A"
            else:
                if missing_acs == 0:
                    ac_status = "✅ Đủ (All Mapped)"
                else:
                    ac_status = f"❌ Thiếu {missing_acs}/{total_acs}"
                    
                if missing_tests == 0:
                    test_status = "✅ Đủ"
                else:
                    test_status = f"❌ Thiếu {missing_tests}/{total_acs}"
                    
            # Check impacts / data flow
            impacts_missing = "- [MIGRATION_PLACEHOLDER] Impacts mapping" in content
            dataflow_missing = "- [MIGRATION_PLACEHOLDER] Data flow mapping" in content
            
            if impacts_missing or dataflow_missing:
                deps_status = "❌ Miss"
            else:
                deps_status = "✅ Đã có"
                
            stories.append({
                'id': story_id,
                'status': status,
                'ac_status': ac_status,
                'test_status': test_status,
                'deps_status': deps_status
            })
            
    # sort by story_id
    def sort_key(s):
        try:
            parts = s['id'].replace('Story-', '').split('.')
            return (int(parts[0]), int(parts[1]))
        except:
            return (999, 999)
            
    stories.sort(key=sort_key)
    
    print("| Story | Status | Implementation Tasks (ACs) | Test File Paths | Cross-Feature Dependencies |")
    print("|---|---|---|---|---|")
    for s in stories:
        print(f"| {s['id']} | {s['status']} | {s['ac_status']} | {s['test_status']} | {s['deps_status']} |")

if __name__ == '__main__':
    main()
