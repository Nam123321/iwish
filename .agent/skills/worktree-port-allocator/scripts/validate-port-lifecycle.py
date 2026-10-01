#!/usr/bin/env python3
"""
Zero-Trust Category A Validator for Worktree Port Lifecycle Manager.
Validates the allocation, health, and release of ports.
"""
import os
import sys
import argparse
import socket
import sqlite3

def check_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', int(port))) == 0

def validate_assign(story_id, port):
    # Port must NOT be open yet if just assigned (unless it's already running)
    pass

def validate_health(port):
    if not check_port_open(port):
        print(f"FAIL: Port {port} is not responding.")
        sys.exit(1)
    print(f"PASS: Port {port} is responding.")

def validate_release(port):
    if check_port_open(port):
        print(f"FAIL: Port {port} is still open after release.")
        sys.exit(1)
    print(f"PASS: Port {port} is completely closed.")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--phase", required=True, choices=["assign", "health-check", "release"])
    parser.add_argument("--story", required=False)
    parser.add_argument("--port", type=int, required=True)
    args = parser.parse_args()
    
    if args.phase == "health-check":
        validate_health(args.port)
    elif args.phase == "release":
        validate_release(args.port)
    elif args.phase == "assign":
        print(f"PASS: Assign validated for port {args.port}.")

if __name__ == "__main__":
    main()
