import os
import json
import time
import argparse
import uuid
import ast
try:
    import fcntl
except ImportError:
    try:
        import msvcrt
    except ImportError:
        pass
from typing import Dict, Any, Callable, Optional

class ZeroTrustRunner:
    """
    I-Wish Core SDK for Zero-Trust physical execution scripts.
    Enforces state limits, strict validation gates, and structured failure classification.
    """
    @staticmethod
    def scan_ast_security(file_path: str) -> bool:
        """Scans AST of a python file to block dangerous execution functions."""
        with open(file_path, "r", encoding="utf-8") as f:
            tree = ast.parse(f.read(), filename=file_path)
        
        banned_modules = {"subprocess", "shutil"}
        banned_os_funcs = {"system", "popen", "exec", "spawn", "fork"}
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    if alias.name.split('.')[0] in banned_modules:
                        raise ValueError(f"Security enforcement: Import of banned module '{alias.name}' is blocked.")
            elif isinstance(node, ast.ImportFrom):
                if node.module and node.module.split('.')[0] in banned_modules:
                    raise ValueError(f"Security enforcement: Import of banned module '{node.module}' is blocked.")
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Attribute):
                    if isinstance(node.func.value, ast.Name) and node.func.value.id == "os":
                        for prefix in banned_os_funcs:
                            if node.func.attr.startswith(prefix):
                                raise ValueError(f"Security enforcement: Call to dangerous function 'os.{node.func.attr}' is blocked.")
        return True

    @staticmethod
    def safe_update_project_rules(rules_text: str, project_root: str = "."):
        """Safely appends rules to .agents/project-rules.md using file locking to prevent Race Conditions."""
        rules_path = os.path.join(project_root, ".agents", "project-rules.md")
        os.makedirs(os.path.dirname(rules_path), exist_ok=True)
        
        with open(rules_path, "a", encoding="utf-8") as f:
            lock_acquired = False
            for i in range(5):
                try:
                    if 'fcntl' in globals():
                        fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
                    elif 'msvcrt' in globals():
                        msvcrt.locking(f.fileno(), msvcrt.LK_NBLCK, 1)
                    lock_acquired = True
                    break
                except (IOError, OSError):
                    time.sleep(0.1 * (2 ** i)) # Exponential backoff
            
            if not lock_acquired:
                print(json.dumps({"status": "FATAL", "message": "Failed to acquire lock for project-rules.md after retries"}))
                return False
                
            f.write("\n" + rules_text + "\n")
            
            try:
                if 'fcntl' in globals():
                    fcntl.flock(f, fcntl.LOCK_UN)
                elif 'msvcrt' in globals():
                    msvcrt.locking(f.fileno(), msvcrt.LK_UNLCK, 1)
            except (IOError, OSError):
                pass
                
        return True

    def __init__(self, name: str, max_retries: int = 3, validator_func: Optional[Callable] = None):
        self.name = name
        self.max_retries = max_retries
        self.validator_func = validator_func
        self.state_file = f".{name}_runner_state.json"
        
    def load_state(self) -> Dict[str, Any]:
        if os.path.exists(self.state_file):
            with open(self.state_file, "r") as f:
                return json.load(f)
        return {"attempts": 0, "history": []}
        
    def save_state(self, state: Dict[str, Any]):
        with open(self.state_file, "w") as f:
            json.dump(state, f, indent=2)
            
    def classify_failure(self, error_msg: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Classifies failure to prevent endless loops or misdirected fixes.
        Developers using this SDK can override or extend this logic.
        """
        err_lower = str(error_msg).lower()
        if "timeout" in err_lower and "element" in err_lower:
            return {
                "type": "Type2_AppBug",
                "action": "HALT",
                "reason": "Missing UI component or App state error",
                "details": error_msg,
                "recommendation": "Trigger /enhance-skill to test Draft Patch on Dual-Run (HSEA-2.4)"
            }
        
        return {
            "type": "Type1_ScriptBug",
            "action": "HEAL",
            "reason": "Script execution or selector failure",
            "details": error_msg,
            "recommendation": "Trigger /learn to append Convention Rules to .agents/project-rules.md"
        }

    def execute(self, *args, **kwargs):
        state = self.load_state()
        
        if state["attempts"] >= self.max_retries:
            report = {
                "status": "FATAL",
                "message": f"Hard cap of {self.max_retries} retries reached. Infinite Loop Prevention triggered. Halting.",
                "action": "HALT"
            }
            print(json.dumps(report))
            state["history"].append(report)
            self.save_state(state)
            return

        state["attempts"] += 1
        self.save_state(state)
        
        try:
            # 1. Execution Core
            if not self.validator_func:
                raise NotImplementedError("A validator function must be provided to ZeroTrustRunner.")
                
            result = self.validator_func(*args, **kwargs)
            
            # 2. Hard Validation Gate
            if not result or result.get("status") != "PASS":
                raise Exception(result.get("error", "Validation gate failed without specific error."))
                
            print(json.dumps({
                "status": "PASS",
                "message": "Zero-Trust execution completed successfully."
            }))
            
            # Clean up state on success
            if os.path.exists(self.state_file):
                os.remove(self.state_file)
        
        except TimeoutError as e:
            failure_report = {
                "type": "Type0_SystemCrash",
                "action": "HALT",
                "reason": "Hard timeout detected during execution.",
                "details": str(e)
            }
            state["history"].append(failure_report)
            self.save_state(state)
            print(json.dumps({"status": "FATAL", "report": failure_report}))
        except MemoryError as e:
            failure_report = {
                "type": "Type0_SystemCrash",
                "action": "HALT",
                "reason": "Out of memory (OOM) detected.",
                "details": str(e)
            }
            state["history"].append(failure_report)
            self.save_state(state)
            print(json.dumps({"status": "FATAL", "report": failure_report}))
        except Exception as e:
            err_type = e.__class__.__name__
            err_str_lower = str(e).lower()
            
            if err_type == "MemoryError" or "memoryerror" in err_str_lower or "oom" in err_str_lower or "out of memory" in err_str_lower:
                failure_report = {
                    "type": "Type0_SystemCrash",
                    "action": "HALT",
                    "reason": "Out of memory (OOM) detected.",
                    "details": str(e)
                }
            elif err_type in ("TimeoutError", "TimeoutExpired") or ("timeout" in err_str_lower and "exceeded" in err_str_lower and "element" not in err_str_lower):
                failure_report = {
                    "type": "Type0_SystemCrash",
                    "action": "HALT",
                    "reason": "Hard timeout detected during execution.",
                    "details": str(e)
                }
            else:
                # 3. Smart Failure Classifier
                failure_report = self.classify_failure(str(e), kwargs)
            
            state["history"].append(failure_report)
            self.save_state(state)
            
            status = "FATAL" if failure_report.get("action") == "HALT" else "FAIL"
            print(json.dumps({
                "status": status,
                "report": failure_report
            }))

if __name__ == "__main__":
    # Example usage for LLM reference
    parser = argparse.ArgumentParser(description="Zero-Trust Runner Example")
    parser.add_argument("--target", required=True, help="Target resource to process")
    args = parser.parse_args()
    
    def my_custom_validation(target):
        # Implementation of physical checks (e.g. file exists, DOM is visible)
        if not target:
            return {"status": "FAIL", "error": "Target is missing."}
        return {"status": "PASS"}
        
    runner = ZeroTrustRunner(name="example_runner", validator_func=lambda: my_custom_validation(args.target))
    runner.execute()
