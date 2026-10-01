#!/usr/bin/env python3
import json
import sys
import os
import yaml

def parse_args():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing JSON payload argument"}))
        sys.exit(1)
    try:
        return json.loads(sys.argv[1])
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON payload"}))
        sys.exit(1)

def get_tool_registry():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    registry_path = os.path.join(script_dir, '../unknowns/tool-registry.yaml')
    try:
        with open(registry_path, 'r') as f:
            registry = yaml.safe_load(f)
            return registry.get('tools', [])
    except Exception as e:
        print(json.dumps({"error": f"Failed to load tool registry: {str(e)}"}))
        sys.exit(1)

def main():
    payload = parse_args()
    phase = payload.get('phase')
    depth = payload.get('depth', 'quick')
    scope = payload.get('scope', 'all')
    
    tools = get_tool_registry()
    
    # Filter tools by phase
    available_tools = []
    for tool in tools:
        if phase in tool.get('phases', []):
            available_tools.append(tool)
    
    # Simple scoring logic: 
    # High cost = lower priority, unless depth is full.
    # Micro/Macro matched by scope.
    scored_tools = []
    skipped_tools = []
    skip_reasons = {}
    
    for tool in available_tools:
        is_macro = any(q in ['unknown-unknown', 'unknown-known'] for q in tool.get('quadrants', []))
        is_micro = any(q in ['known-unknown', 'known-known'] for q in tool.get('quadrants', []))
        
        # Determine if it matches scope
        if scope == 'macro' and not is_macro:
            skipped_tools.append(tool['id'])
            skip_reasons[tool['id']] = "Not macro scope"
            continue
        if scope == 'micro' and not is_micro:
            skipped_tools.append(tool['id'])
            skip_reasons[tool['id']] = "Not micro scope"
            continue
            
        # Basic scoring: Priority 1 (high relevance), Priority 2 (medium), etc.
        priority = 1
        if tool.get('cost') == 'high':
            priority += 1
            
        scored_tools.append({
            "tool_id": tool['id'],
            "priority": priority,
            "estimated_cost": tool.get('cost', 'medium')
        })
    
    # Sort by priority
    scored_tools.sort(key=lambda x: x['priority'])
    
    # Depth filtering
    if depth == 'quick':
        scored_tools = scored_tools[:3]
    elif depth == 'partial':
        scored_tools = scored_tools[:5]
        
    recommended_steps = []
    if scope == 'macro' or phase in ['discovery', 'planning', 'architecture']:
        recommended_steps = ["step-u-01", "step-u-02", "step-u-05"]
    elif scope == 'micro' or phase in ['story', 'dev', 'review']:
        recommended_steps = ["step-u-01", "step-u-03", "step-u-05"]
    elif scope in ['bridge', 'all']:
        recommended_steps = ["step-u-01", "step-u-02", "step-u-03", "step-u-04", "step-u-05", "step-u-06"]

    result = {
        "execution_plan": scored_tools,
        "skipped_tools": skipped_tools,
        "skip_reasons": skip_reasons,
        "recommended_steps": recommended_steps,
        "estimated_duration": "5-10 min" if depth == 'quick' else "15-30 min"
    }
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
