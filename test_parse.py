import re
content = "**I want** to build a feature\nthat spans multiple lines.\n\nNext paragraph."
match = re.search(r'\*\*I want\*\* (.*?)\n', content, re.DOTALL)
print(repr(match.group(1)))
