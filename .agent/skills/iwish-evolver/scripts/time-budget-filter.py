#!/usr/bin/env python3
"""
Warm-up Overhead Filtering & Time-Budget Enforcement script for I-Wish Evolver.
Wraps command runs, measures perf counter timings, discards the first run (cold run)
to filter out warm-up overhead, averages subsequent warm runs, and enforces strict
wall-clock time budget limits (killing subprocess child groups cleanly if duration exceeds budget).
"""

import sys
import os
import argparse
import time
import subprocess
import signal
import json

def run_iteration(cmd_args, timeout, use_shell=False):
    """
    Runs a single command iteration in a new process group.
    Enforces the timeout and cleans up the process group on timeout.
    Returns a dict with execution details.
    """
    start_time = time.perf_counter()
    proc = None
    stdout, stderr = "", ""
    status = "success"
    exit_code = None

    try:
        if use_shell:
            # For shell=True, we join the cmd_args list into a single string
            cmd = " ".join(cmd_args) if isinstance(cmd_args, list) else cmd_args
            proc = subprocess.Popen(
                cmd,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                start_new_session=True
            )
        else:
            proc = subprocess.Popen(
                cmd_args,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                start_new_session=True
            )

        stdout, stderr = proc.communicate(timeout=timeout)
        exit_code = proc.returncode
        if exit_code != 0:
            status = "error"
    except subprocess.TimeoutExpired:
        status = "timeout"
        if proc:
            # Kill the entire process group
            try:
                pgid = os.getpgid(proc.pid)
                os.killpg(pgid, signal.SIGKILL)
            except OSError:
                pass
            
            # Reap the process and try to collect remaining output
            try:
                stdout, stderr = proc.communicate(timeout=2.0)
            except subprocess.TimeoutExpired:
                # Force close pipes if still hung
                if proc.stdout:
                    try:
                        proc.stdout.close()
                    except Exception:
                        pass
                if proc.stderr:
                    try:
                        proc.stderr.close()
                    except Exception:
                        pass
                stdout, stderr = "", ""
    except Exception as e:
        status = "exception"
        stderr = str(e)
        if proc:
            try:
                pgid = os.getpgid(proc.pid)
                os.killpg(pgid, signal.SIGKILL)
            except OSError:
                pass
            try:
                proc.communicate(timeout=1.0)
            except Exception:
                pass

    duration = time.perf_counter() - start_time
    return {
        "duration_seconds": duration,
        "exit_code": exit_code,
        "status": status,
        "stdout": stdout,
        "stderr": stderr
    }

def main():
    parser = argparse.ArgumentParser(
        description="Warm-up Overhead Filtering & Time-Budget Enforcement script."
    )
    parser.add_argument(
        "-i", "--iterations",
        type=int,
        default=3,
        help="Number of iterations to run (default: 3)"
    )
    parser.add_argument(
        "-b", "--budget",
        type=float,
        default=30.0,
        help="Timeout budget in seconds for each iteration (default: 30.0)"
    )
    parser.add_argument(
        "-s", "--shell",
        action="store_true",
        help="Execute the command using the shell"
    )
    parser.add_argument(
        "command",
        nargs=argparse.REMAINDER,
        help="Command and arguments to run"
    )

    args = parser.parse_args()

    # If -- was used, argparse might leave it in command, or we need to strip it
    cmd_args = args.command
    if cmd_args and cmd_args[0] == "--":
        cmd_args = cmd_args[1:]

    if not cmd_args:
        print("Error: No command specified to run.", file=sys.stderr)
        parser.print_help(sys.stderr)
        sys.exit(2)

    if args.iterations < 1:
        print("Error: Iterations must be >= 1.", file=sys.stderr)
        sys.exit(2)

    runs = []
    overall_status = "SUCCESS"
    error_message = None

    for idx in range(1, args.iterations + 1):
        print(f"Running iteration {idx}/{args.iterations} (budget: {args.budget}s)...", file=sys.stderr)
        run_res = run_iteration(cmd_args, args.budget, use_shell=args.shell)
        
        # Log to stderr for feedback
        print(f"Iteration {idx} finished with status '{run_res['status']}' in {run_res['duration_seconds']:.4f}s", file=sys.stderr)
        if run_res['stdout'] and len(run_res['stdout'].strip()) > 0:
            print(f"--- Stdout ---\n{run_res['stdout'].strip()}\n--------------", file=sys.stderr)
        if run_res['stderr'] and len(run_res['stderr'].strip()) > 0:
            print(f"--- Stderr ---\n{run_res['stderr'].strip()}\n--------------", file=sys.stderr)

        runs.append({
            "iteration": idx,
            "duration_seconds": run_res["duration_seconds"],
            "exit_code": run_res["exit_code"],
            "status": run_res["status"]
        })

        if run_res["status"] == "timeout":
            overall_status = "TIMEOUT"
            error_message = f"Command timed out on iteration {idx} (exceeded {args.budget}s)"
            break
        elif run_res["status"] in ("error", "exception"):
            overall_status = "ERROR"
            error_message = f"Command failed on iteration {idx} with exit code {run_res['exit_code']} or exception"
            break

    # Calculate statistics
    cold_run_seconds = None
    warm_runs_seconds = []
    average_warm_duration_seconds = None

    if runs:
        cold_run_seconds = runs[0]["duration_seconds"]
        # Warm runs are subsequent iterations that finished successfully
        warm_runs_seconds = [r["duration_seconds"] for r in runs[1:] if r["status"] == "success"]
        if warm_runs_seconds:
            average_warm_duration_seconds = sum(warm_runs_seconds) / len(warm_runs_seconds)

    report = {
        "status": overall_status,
        "iterations": runs,
        "cold_run_seconds": cold_run_seconds,
        "warm_runs_seconds": warm_runs_seconds,
        "average_warm_duration_seconds": average_warm_duration_seconds,
        "error": error_message
    }

    # Print JSON report to stdout
    print(json.dumps(report, indent=2))

    if overall_status != "SUCCESS":
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
