import re

def parse_feature_hierarchy(filepath):
    mapping = {}
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    current_module = "Uncategorized"
    
    for line in lines:
        module_match = re.match(r'^###\s+(\d+\.\s+.*?)$', line.strip())
        if module_match:
            current_module = module_match.group(1).strip()
            continue
            
        epic_match = re.search(r'\((?:E|Epic\s*)(\d+)', line, re.IGNORECASE)
        if epic_match:
            epic_num = int(epic_match.group(1))
            mapping[epic_num] = current_module
            
    return mapping

print(parse_feature_hierarchy("_iwish-output/2. Product Planning/2.5. feature-hierarchy.md"))
