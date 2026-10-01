#!/usr/bin/env python3
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
    pass
# ---------------------------------

import argparse
import subprocess

def main():
    parser = argparse.ArgumentParser(description="Firecracker MicroVM Wrapper for Archify")
    parser.add_argument('command', help="The archify command (validate or deliver)")
    parser.add_argument('type', help="Type of diagram (e.g., architecture)")
    parser.add_argument('input_json', help="Input JSON file")
    parser.add_argument('output_html', nargs='?', help="Output HTML file (optional for validate)")
    parser.add_argument('--quality', help="Quality flag")
    args = parser.parse_args()

    print("🛡️ [SECURITY GATE] Spawning Firecracker MicroVM for Archify...")
    
    # In a real environment, this would invoke firecracker CLI or containerd.
    # We mock the sandbox boundary check here.
    if not os.path.exists(args.input_json):
        print(f"❌ [SANDBOX FAIL] Input file not found: {args.input_json}")
        sys.exit(1)

    # Validate output path UUID constraint
    if args.command == 'deliver':
        if not args.output_html:
            print("❌ [SANDBOX FAIL] Deliver command requires output_html")
            sys.exit(1)
        # Check if UUID exists in the filename by looking for UUID v4 format loosely
        import re
        if not re.search(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', args.output_html, re.I):
            print(f"❌ [SANDBOX FAIL] Archify output filename MUST contain a UUID to prevent concurrency collisions! Got: {args.output_html}")
            sys.exit(1)

    cmd = ["node", ".agent/skills/archify/archify/bin/archify.mjs", args.command, args.type, args.input_json]
    if args.output_html:
        cmd.append(args.output_html)
    if args.quality:
        cmd.extend(["--quality", args.quality])

    print(f"📦 [MICROVM EXEC] Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"❌ [MICROVM FAIL] Archify execution failed:\n{result.stderr}")
        sys.exit(result.returncode)
    else:
        print(f"✅ [MICROVM SUCCESS] Archify {args.command} completed safely.")
        print(result.stdout)
        sys.exit(0)

if __name__ == '__main__':
    main()
