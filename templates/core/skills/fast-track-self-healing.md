---
name: fast-track-self-healing
description: Automates compilation checks and retries for agent-generated code with a strict 3-retry limit.
---

# Fast-Track Self-Healing Loop

This skill executes a given compilation or test command via Python's `subprocess`. If the command fails, it captures the `stderr` and `stdout` traces, auto-injects them into a retry prompt for the LLM, and retries the process up to a hard limit of 3 times.

## Python Reference Implementation

```python
#!/usr/bin/env python3
import subprocess
import sys

def run_with_self_healing(command, llm_prompt_callback, max_retries=3):
    """
    Executes a shell command. If it fails, uses the LLM to fix the code
    and retries up to max_retries times.
    
    Args:
        command (list): The command to run, e.g., ['python3', 'script.py']
        llm_prompt_callback (function): Function that takes stderr and returns True if fixed.
        max_retries (int): Hard limit on retry loops.
    """
    retries = 0
    
    while retries <= max_retries:
        print(f"[Attempt {retries + 1}/{max_retries + 1}] Running: {' '.join(command)}")
        
        # AC1: Capture compilation stderr traces.
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        if result.returncode == 0:
            print("Execution succeeded!")
            print(result.stdout)
            return True
            
        print(f"Execution failed with return code {result.returncode}.")
        error_context = result.stderr if result.stderr.strip() else result.stdout
        
        if retries == max_retries:
            # AC3: Hard limit loops to exactly 3 retries.
            print("Max retries reached. Failing gracefully.")
            print(f"Final error:\n{error_context}")
            return False
            
        # AC2: Auto-inject traceback context into LLM prompt.
        print("Auto-injecting traceback context into LLM prompt...")
        prompt = (
            f"The command {' '.join(command)} failed with the following traceback/error:\n"
            f"```\n{error_context}\n```\n"
            "Please analyze this error and provide a fix for the code."
        )
        
        fix_applied = llm_prompt_callback(prompt)
        if not fix_applied:
            print("LLM could not apply a fix. Aborting self-healing loop.")
            return False
            
        retries += 1

if __name__ == "__main__":
    # Example usage placeholder
    # def dummy_llm_fix(prompt):
    #     print("Simulating LLM fix based on prompt...")
    #     return True
    # run_with_self_healing(['python3', 'faulty_script.py'], dummy_llm_fix)
    pass
```
