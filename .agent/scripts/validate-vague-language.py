#!/usr/bin/env python3
import sys
import re
import json
from pathlib import Path

VAGUE_WORDS = [
    "fast", "quick", "slow", "good", "bad", "poor",
    "user-friendly", "easy", "simple", "secure", "safe",
    "scalable", "flexible", "performant", "efficient", "optimal",
    "nhanh", "muot", "mượt", "on dinh", "ổn định", "de dang", "dễ dàng"
]

VAGUE_PATTERN = re.compile(
    r'\b(?:should\s+be\s+|must\s+be\s+|needs?\s+to\s+be\s+)?'
    r'(' + '|'.join(VAGUE_WORDS) + r')\b',
    re.IGNORECASE
)

def scan_file(filepath: Path):
    if not filepath.is_file():
        print(json.dumps({"ok": False, "error": f"File not found: {filepath}"}))
        sys.exit(1)

    text = filepath.read_text()
    lines = text.split('\n')
    
    findings = []
    
    for idx, line in enumerate(lines):
        matches = VAGUE_PATTERN.findall(line)
        if matches:
            findings.append({
                "line_number": idx + 1,
                "content": line.strip(),
                "terms": list(set(matches))
            })
            
    score_penalty = min(len(findings), 10)
    
    output = {
        "ok": True,
        "vague_words_found": len(findings) > 0,
        "findings_count": len(findings),
        "score_penalty": score_penalty,
        "findings": findings
    }
    
    print(json.dumps(output, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "error": "Usage: validate-vague-language.py <file_path>"}))
        sys.exit(1)
        
    scan_file(Path(sys.argv[1]))
