import os
import sys
import json
import tempfile

# Dynamically load traceback-parser.py since it has a hyphen in its name
import importlib.util
spec = importlib.util.spec_from_file_location(
    "traceback_parser", 
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "traceback-parser.py")
)
parser = importlib.util.module_from_spec(spec)
sys.modules["traceback_parser"] = parser
spec.loader.exec_module(parser)

def test_python_traceback():
    print("Testing Python traceback parsing...")
    mock_log = """
Starting python execution...
Traceback (most recent call last):
  File "user_app.py", line 10, in main
    app.run()
  File "/usr/local/lib/python3.9/site-packages/flask/app.py", line 2447, in run
    cli.show_server_banner(self.env, self.debug, self.name, self.extra_files)
  File "/usr/local/lib/python3.9/site-packages/flask/cli.py", line 123, in show_server_banner
    raise ValueError("Port already in use")
ValueError: Port already in use
Finished run with code 1.
"""
    # Create a temporary user file to verify context extraction works if the file exists
    with tempfile.TemporaryDirectory() as tmpdir:
        user_file_path = os.path.join(tmpdir, "user_app.py")
        # Let's put a specific line at 10
        lines = [f"// line {i}" for i in range(1, 21)]
        lines[9] = "    app.run()"
        with open(user_file_path, "w") as f:
            f.write("\n".join(lines))
            
        # Parse log with CWD set to tmpdir so "user_app.py" is resolved
        res = parser.process_log(mock_log, cwd=tmpdir, context_range=5)
        
        assert res["success"] is True, f"Failed parsing: {res}"
        assert res["language"] == "python"
        assert res["error_type"] == "ValueError"
        assert res["error_message"] == "Port already in use"
        
        # Verify AC4: node_modules/site-packages filtered out.
        # The crash was at flask/cli.py (site-packages), which should be filtered out,
        # so target frame must be user_app.py line 10.
        target = res["target_frame"]
        assert target["file_path"] == "user_app.py"
        assert target["line_number"] == 10
        assert target["function_name"] == "main"
        assert target["source_line"] == "app.run()"
        
        # Verify AC3: context extraction ±5 lines
        context = res["context"]
        assert context is not None
        assert len(context["lines"]) == 11 # 10-5 to 10+5 inclusive is lines 5 to 15 (11 lines)
        assert context["lines"][5]["is_crash_line"] is True
        assert context["lines"][5]["code"] == "    app.run()"
        print("Python traceback parsing: PASS")

def test_node_traceback():
    print("Testing Node.js traceback parsing...")
    mock_log = """
npm run dev
TypeError: Cannot read properties of undefined (reading 'config')
    at loadConfig (/Users/test/user_project/src/config.js:15:20)
    at Object.initialize (/Users/test/user_project/node_modules/lib/loader.js:42:10)
    at run (/Users/test/user_project/src/index.js:5:5)
    at Object.<anonymous> (/Users/test/user_project/node_modules/bin/cli.js:2:3)
"""
    # Create temp files
    with tempfile.TemporaryDirectory() as tmpdir:
        src_dir = os.path.join(tmpdir, "src")
        os.makedirs(src_dir)
        config_path = os.path.join(src_dir, "config.js")
        
        lines = [f"// line {i}" for i in range(1, 25)]
        lines[14] = "    const val = config.property;"
        with open(config_path, "w") as f:
            f.write("\n".join(lines))
            
        # Adjust mock log to point to temp file
        adjusted_log = mock_log.replace("/Users/test/user_project/src/config.js", config_path)
        
        res = parser.process_log(adjusted_log, cwd=tmpdir, context_range=5)
        
        assert res["success"] is True, f"Failed parsing: {res}"
        assert res["language"] == "javascript"
        assert res["error_type"] == "TypeError"
        assert res["error_message"] == "Cannot read properties of undefined (reading 'config')"
        
        # Verify AC4: node_modules filtered out, targets the config.js line 15 (first frame)
        target = res["target_frame"]
        assert target["file_path"] == config_path
        assert target["line_number"] == 15
        assert target["column_number"] == 20
        assert target["function_name"] == "loadConfig"
        
        # Verify context extraction
        context = res["context"]
        assert context is not None
        assert len(context["lines"]) == 11
        assert context["lines"][5]["is_crash_line"] is True
        assert context["lines"][5]["code"] == "    const val = config.property;"
        print("Node.js traceback parsing: PASS")

def test_fallback_handling():
    print("Testing fallback handling...")
    mock_log = "This is a random log line 1\nThis is a random log line 2\nAnother regular log line"
    res = parser.process_log(mock_log, context_range=5)
    
    assert res["success"] is False
    assert "fallback_log_tail" in res
    assert len(res["fallback_log_tail"]) == 3
    assert res["fallback_log_tail"][-1] == "Another regular log line"
    print("Fallback handling: PASS")

if __name__ == "__main__":
    try:
        test_python_traceback()
        test_node_traceback()
        test_fallback_handling()
        print("ALL TESTS PASSED SUCCESSFULLY!")
        sys.exit(0)
    except AssertionError as e:
        print(f"TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
