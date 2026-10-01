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
import json
import subprocess
import re
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

class TraceMapping(BaseModel):
    ac_id: str
    code: str
    test: str
    confidence: float
    reasoning: str

class TraceResult(BaseModel):
    traceability: list[TraceMapping]

def get_all_files():
    cmd = "find src server packages tests -type f -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/.next/*' 2>/dev/null"
    output = subprocess.check_output(cmd, shell=True, text=True)
    return [f for f in output.split('\n') if f.strip()]

def method_1_pre_filter(ac_text):
    print("--- Running Method 1 (Lexical Pre-filter) ---")
    files = get_all_files()
    keywords = ['sheet', 'google', 'read', 'api']
    filtered = [f for f in files if any(k in f.lower() for k in keywords)]
    candidate_list = "\n".join(filtered)
    
    prompt = f"""
You are mapping ACs to codebase files. 
ACs:
{ac_text}

Candidate Files:
{candidate_list}

Map each AC to a code file and a test file from the candidate list. Output exact paths. If not found, output "Not Found".
"""
    return run_llm(prompt)

def method_2_structural_grep(ac_text):
    print("--- Running Method 2 (Structural CodeGraph) ---")
    cmd = "grep -rn 'spreadsheets\\.get\\|spreadsheets\\.values\\.get\\|google_sheets' src server packages tests --exclude-dir=node_modules --exclude-dir=dist 2>/dev/null | cut -d: -f1 | sort -u"
    try:
        output = subprocess.check_output(cmd, shell=True, text=True)
        filtered = [f for f in output.split('\n') if f.strip()]
    except Exception:
        filtered = []
        
    candidate_list = "\n".join(filtered)
    
    prompt = f"""
You are mapping ACs to codebase files. 
ACs:
{ac_text}

Structurally Related Files:
{candidate_list}

Map each AC to a code file and a test file from the candidate list. Output exact paths. If not found, output "Not Found".
"""
    return run_llm(prompt)

def method_3_zero_context(ac_text):
    print("--- Running Method 3 (Zero-Context Inference) ---")
    prompt = f"""
You are mapping ACs to codebase files in a Next.js App Router codebase.
ACs:
{ac_text}

Predict the most likely exact file paths for the implementation and test files for each AC based on standard Next.js conventions (e.g. src/app/api/v1/...).
Output exact paths.
"""
    return run_llm(prompt)

def run_llm(prompt):
    client = genai.Client()
    response = client.models.generate_content(
        model='gemini-3.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=TraceResult,
        ),
    )
    return response.parsed

def evaluate_result(result: TraceResult):
    for trace in result.traceability:
        ac = trace.ac_id
        code_exists = os.path.exists(trace.code) if trace.code != "Not Found" else False
        test_exists = os.path.exists(trace.test) if trace.test != "Not Found" else False
        print(f"[{ac}] Code: {trace.code} (Exists: {code_exists}) | Test: {trace.test} (Exists: {test_exists}) | Conf: {trace.confidence}")
        print(f"      Reasoning: {trace.reasoning}")

def main():
    story_path = "_iwish-output/3. Development/1. Epic & Story/FG-07-Data-Platform-Analytics/Epic-23/Story-23.5/story.md"
    if not os.path.exists(story_path):
        print("Story not found!")
        return
        
    with open(story_path, 'r') as f:
        content = f.read()
        
    ac_match = re.search(r'## Acceptance Criteria(.*?)(##|\Z)', content, re.DOTALL)
    ac_text = ac_match.group(1).strip() if ac_match else ""
    
    print(f"Evaluating Story 23.5 with 3 methods...\n")
    
    # Run tests
    try:
        res1 = method_1_pre_filter(ac_text)
        evaluate_result(res1)
    except Exception as e:
        print(f"Method 1 Error: {e}")
        
    print("\n")
    try:
        res2 = method_2_structural_grep(ac_text)
        evaluate_result(res2)
    except Exception as e:
        print(f"Method 2 Error: {e}")

    print("\n")
    try:
        res3 = method_3_zero_context(ac_text)
        evaluate_result(res3)
    except Exception as e:
        print(f"Method 3 Error: {e}")

if __name__ == '__main__':
    main()
