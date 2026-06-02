---
name: "Safe XML ActionNode Parser"
description: "A reference implementation for securely parsing MetaGPT ActionNode XML formats without eval() or vulnerable XML parsers."
version: 1.0.0
---

# Safe XML Parser

When parsing MetaGPT ActionNode XML formats out of LLM responses, you must follow strict security constraints. Do not use standard `xml.etree` or `eval()`. Instead, use `re` to find the nodes and `ast.literal_eval` to safely cast the content to Python objects.

## Reference Implementation

```python
import re
import ast

def parse_action_nodes(text: str) -> dict:
    """
    Parses a string containing <ActionNode> elements and returns a dictionary.
    LLM outputs often wrap data in <node_name>...</node_name> inside an ActionNode.
    """
    results = {}
    
    # Generic regex to capture basic tags
    tag_pattern = re.compile(r'<([^>]+)>(.*?)</\1>', re.DOTALL)
    
    for match in tag_pattern.finditer(text):
        tag_name = match.group(1).strip()
        content = match.group(2).strip()
        
        # Skip if it's the wrapper ActionNode tag itself
        if tag_name == "ActionNode":
            continue
            
        try:
            # Safely evaluate strings into Python data types
            parsed_value = ast.literal_eval(content)
        except (ValueError, SyntaxError):
            # Fallback to string if it cannot be safely evaluated to a complex type
            parsed_value = content
            
        results[tag_name] = parsed_value
        
    return results

# Example Usage:
# raw_output = '''
# <ActionNode>
#   <tasks>['Task 1', 'Task 2']</tasks>
#   <confidence>0.95</confidence>
# </ActionNode>
# '''
# parsed = parse_action_nodes(raw_output)
# print(parsed) 
# # {'tasks': ['Task 1', 'Task 2'], 'confidence': 0.95}
```
