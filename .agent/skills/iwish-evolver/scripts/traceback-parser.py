#!/usr/bin/env python3
"""
traceback-parser.py

A compiler-independent traceback parser that extracts filenames, line numbers,
error types, and messages from standard Python tracebacks and Node.js stack traces.
It filters out third-party/system library frames to focus on user-editable files,
and extracts context lines (default: +-5 lines) around the crash line.
"""

import re
import os
import sys
import json
import argparse
from typing import List, Dict, Any, Optional

def is_user_code(file_path: str) -> bool:
    """
    Checks if a file path belongs to user-editable code.
    Filters out system, standard library, and package manager dependencies.
    """
    if not file_path:
        return False
    
    # Standard patterns for dependencies/libraries
    ignored_patterns = [
        "node_modules",
        "site-packages",
        "dist-packages",
        "lib/python",
        "lib-dynload",
        "node:internal",
        "<built-in>",
        "<frozen",
        "internal/modules",
    ]
    
    for pattern in ignored_patterns:
        if pattern in file_path:
            return False
            
    return True

def resolve_file_path(file_path: str, cwd: Optional[str] = None) -> Optional[str]:
    """
    Normalizes a file path and attempts to resolve it to an existing absolute path.
    """
    if not file_path:
        return None
        
    # Strip file:// scheme if present
    if file_path.startswith("file://"):
        file_path = file_path[7:]
        
    # Check if absolute and exists
    if os.path.isabs(file_path):
        if os.path.exists(file_path):
            return os.path.abspath(file_path)
        return None
        
    # Try resolving relative to CWD parameter
    if cwd:
        abs_path = os.path.join(cwd, file_path)
        if os.path.exists(abs_path):
            return os.path.abspath(abs_path)
            
    # Try resolving relative to script execution CWD
    abs_path = os.path.join(os.getcwd(), file_path)
    if os.path.exists(abs_path):
        return os.path.abspath(abs_path)
        
    return None

def extract_context_code(file_path: str, line_number: int, context_range: int = 5) -> Dict[str, Any]:
    """
    Extracts surrounding lines of code for the given file and line number.
    Line number is 1-indexed.
    """
    if not file_path or not os.path.exists(file_path):
        return {
            "lines": [],
            "text": f"File not found: {file_path}"
        }
        
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
    except Exception as e:
        return {
            "lines": [],
            "text": f"Error reading file {file_path}: {str(e)}"
        }
        
    total_lines = len(lines)
    if total_lines == 0:
        return {
            "lines": [],
            "text": "File is empty"
        }
        
    # Compute 1-indexed line range
    start_idx = max(0, line_number - 1 - context_range)
    end_idx = min(total_lines, line_number + context_range)
    
    context_lines = []
    formatted_lines = []
    
    for idx in range(start_idx, end_idx):
        curr_line_num = idx + 1
        code_line = lines[idx].rstrip("\r\n")
        is_crash = (curr_line_num == line_number)
        marker = "=> " if is_crash else "   "
        formatted_lines.append(f"{marker}{curr_line_num:4d} | {code_line}")
        
        context_lines.append({
            "line_number": curr_line_num,
            "code": code_line,
            "is_crash_line": is_crash
        })
        
    return {
        "lines": context_lines,
        "text": "\n".join(formatted_lines)
    }

def parse_python_tracebacks(text: str) -> List[Dict[str, Any]]:
    """
    Parses all Python tracebacks found in the log text.
    """
    tracebacks = []
    lines = text.splitlines()
    i = 0
    n = len(lines)
    
    while i < n:
        line = lines[i]
        if "Traceback (most recent call last):" in line:
            start_line = i
            frames = []
            exception_info = ""
            i += 1
            
            while i < n:
                curr_line = lines[i]
                # A Python frame header looks like:
                #   File "filename.py", line 12, in function_name
                frame_match = re.match(r'^\s+File "([^"]+)", line (\d+), in (\S+)', curr_line)
                if frame_match:
                    file_path = frame_match.group(1)
                    line_num = int(frame_match.group(2))
                    func_name = frame_match.group(3)
                    source_line = ""
                    i += 1
                    
                    # Next line is usually the indented source code line
                    if i < n:
                        next_line = lines[i]
                        if next_line.startswith(" ") and not re.match(r'^\s+File "', next_line):
                            source_line = next_line.strip()
                            i += 1
                            
                    frames.append({
                        "file_path": file_path,
                        "line_number": line_num,
                        "column_number": None,
                        "function_name": func_name,
                        "source_line": source_line
                    })
                elif curr_line.strip() == "":
                    # Skip empty lines
                    i += 1
                else:
                    # Final exception line (e.g., ValueError: error description)
                    exception_info = curr_line.strip()
                    i += 1
                    break
            
            if frames:
                # Separate error type and error message
                if ":" in exception_info:
                    parts = exception_info.split(":", 1)
                    error_type = parts[0].strip()
                    error_message = parts[1].strip()
                else:
                    error_type = exception_info.strip()
                    error_message = ""
                    
                tracebacks.append({
                    "language": "python",
                    "error_type": error_type,
                    "error_message": error_message,
                    "frames": frames,
                    "start_line": start_line
                })
        else:
            i += 1
            
    return tracebacks

def parse_node_tracebacks(text: str) -> List[Dict[str, Any]]:
    """
    Parses all Node.js stack traces found in the log text.
    """
    tracebacks = []
    lines = text.splitlines()
    i = 0
    n = len(lines)
    
    while i < n:
        line = lines[i]
        at_match = re.match(r'^\s+at\s+', line)
        if at_match:
            # We hit a stack trace frame. Backtrack to find the error header
            header_lines = []
            j = i - 1
            # Collect up to 3 non-empty, non-indented lines that don't look like stack frames
            while j >= 0:
                prev_line = lines[j]
                if prev_line.strip() == "" or prev_line.startswith(" ") or "at " in prev_line:
                    break
                header_lines.insert(0, prev_line.strip())
                # Stop backtracking if we hit a standard error type
                if re.match(r'^(\w*Error|Error|Exception|Uncaught\s+\w+):', prev_line.strip()):
                    break
                j -= 1
                
            error_header = " ".join(header_lines) if header_lines else "Error"
            start_line = j + 1
            
            frames = []
            while i < n:
                curr_line = lines[i]
                if not curr_line.strip():
                    i += 1
                    continue
                if not re.match(r'^\s+at\s+', curr_line):
                    break
                
                # Match patterns:
                # 1) at funcName (path:line:col) / at async funcName (path:line:col)
                # 2) at path:line:col
                m1 = re.search(r'^\s*at\s+(?:async\s+)?([^(]+)\s+\((.+):(\d+):(\d+)\)$', curr_line)
                m2 = re.search(r'^\s*at\s+(.+):(\d+):(\d+)$', curr_line)
                
                if m1:
                    func_name = m1.group(1).strip()
                    file_path = m1.group(2).strip()
                    line_num = int(m1.group(3))
                    col_num = int(m1.group(4))
                    frames.append({
                        "file_path": file_path,
                        "line_number": line_num,
                        "column_number": col_num,
                        "function_name": func_name,
                        "source_line": ""
                    })
                elif m2:
                    file_path = m2.group(1).strip()
                    line_num = int(m2.group(2))
                    col_num = int(m2.group(3))
                    frames.append({
                        "file_path": file_path,
                        "line_number": line_num,
                        "column_number": col_num,
                        "function_name": "",
                        "source_line": ""
                    })
                i += 1
                
            if frames:
                if ":" in error_header:
                    parts = error_header.split(":", 1)
                    error_type = parts[0].strip()
                    error_message = parts[1].strip()
                else:
                    error_type = error_header.strip()
                    error_message = ""
                    
                tracebacks.append({
                    "language": "javascript",
                    "error_type": error_type,
                    "error_message": error_message,
                    "frames": frames,
                    "start_line": start_line
                })
        else:
            i += 1
            
    return tracebacks

def process_log(text: str, cwd: Optional[str] = None, context_range: int = 5) -> Dict[str, Any]:
    """
    Main logic to parse python and node tracebacks, select the target frame,
    extract context code, and fallback gracefully if no traceback is found.
    """
    py_traces = parse_python_tracebacks(text)
    node_traces = parse_node_tracebacks(text)
    
    # Merge and sort by appearance order
    all_traces = py_traces + node_traces
    all_traces.sort(key=lambda t: t["start_line"])
    
    if not all_traces:
        # Fallback to returning log tail
        tail = text.splitlines()[-20:]
        return {
            "success": False,
            "error": "No Python traceback or Node.js stack trace detected.",
            "fallback_log_tail": tail,
            "fallback_log_text": "\n".join(tail)
        }
        
    # Choose the last traceback (most recent crash)
    trace = all_traces[-1]
    lang = trace["language"]
    frames = trace["frames"]
    
    # Select the target frame based on filtering rules (AC4)
    target_frame = None
    
    # Python: oldest call first, newest last. Scan from bottom to top (reverse)
    # Node.js: newest call first, oldest last. Scan from top to bottom (forward)
    search_order = reversed(frames) if lang == "python" else frames
    
    for f in search_order:
        if is_user_code(f["file_path"]):
            target_frame = f.copy()
            break
            
    # Fallback to absolute last/first frame if all are filtered out
    if not target_frame and frames:
        target_frame = frames[-1].copy() if lang == "python" else frames[0].copy()
        
    if not target_frame:
        return {
            "success": False,
            "error": "Traceback found, but contains no valid frames.",
            "fallback_log_tail": text.splitlines()[-20:],
            "fallback_log_text": "\n".join(text.splitlines()[-20:])
        }
        
    # Resolve the file path
    resolved_path = resolve_file_path(target_frame["file_path"], cwd)
    target_frame["absolute_path"] = resolved_path
    
    # Extract context code if file exists
    context_data = None
    if resolved_path:
        context_data = extract_context_code(resolved_path, target_frame["line_number"], context_range)
        
    return {
        "success": True,
        "language": lang,
        "error_type": trace["error_type"],
        "error_message": trace["error_message"],
        "target_frame": target_frame,
        "context": context_data,
        "all_frames": frames
    }

def main():
    parser = argparse.ArgumentParser(
        description="Parse Python or Node.js crash tracebacks from log files or stdin."
    )
    parser.add_argument(
        "file",
        nargs="?",
        default=None,
        help="Path to the log file (reads from stdin if omitted or '-')"
    )
    parser.add_argument(
        "--text",
        default=None,
        help="Direct raw text string of the logs to parse"
    )
    parser.add_argument(
        "--cwd",
        default=None,
        help="Base working directory to resolve relative file paths"
    )
    parser.add_argument(
        "--context",
        type=int,
        default=5,
        help="Number of lines of code context to extract around crash line (default: 5)"
    )
    
    args = parser.parse_args()
    
    # Retrieve raw text input
    if args.text is not None:
        raw_text = args.text
    elif args.file is not None and args.file != "-":
        try:
            with open(args.file, "r", encoding="utf-8", errors="ignore") as f:
                raw_text = f.read()
        except Exception as e:
            print(json.dumps({
                "success": False,
                "error": f"Failed to read file {args.file}: {str(e)}"
            }, indent=2))
            sys.exit(1)
    else:
        # Read from stdin
        raw_text = sys.stdin.read()
        
    result = process_log(raw_text, args.cwd, args.context)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
