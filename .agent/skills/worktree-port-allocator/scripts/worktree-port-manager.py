#!/usr/bin/env python3
"""
Worktree Port Lifecycle Manager
Zero-Trust Category A script to assign, start, and release Vite/Node dev server ports
for isolated Git Worktree environments.
"""

import os
import sys
import sqlite3
import argparse
import socket
import time
import signal
import subprocess
from datetime import datetime, timezone

try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass

def get_repo_root():
    try:
        root = subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip()
        return root
    except Exception:
        return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))

REPO_ROOT = get_repo_root()
DB_DIR = os.path.join(REPO_ROOT, ".worktrees")
DB_PATH = os.path.join(DB_DIR, "registry.db")
PORT_START = 3100
PORT_END = 3200

def get_connection():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn

def init_db():
    conn = get_connection()
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS worktree_ports (
                story_id TEXT PRIMARY KEY,
                worktree_path TEXT NOT NULL,
                port INTEGER NOT NULL UNIQUE,
                pid INTEGER,
                status TEXT CHECK(status IN ('ALLOCATED', 'RUNNING', 'RELEASED')) DEFAULT 'ALLOCATED',
                allocated_at TEXT NOT NULL,
                last_heartbeat_at TEXT,
                released_at TEXT
            );
        """)
    conn.close()

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def assign_port(story_id, worktree_path):
    init_db()
    conn = get_connection()
    now = datetime.now(timezone.utc).isoformat()
    norm_path = os.path.abspath(worktree_path)
    
    with conn:
        cursor = conn.execute("SELECT port FROM worktree_ports WHERE story_id = ?", (story_id,))
        row = cursor.fetchone()
        if row:
            print(f"Port already assigned for {story_id}: {row['port']}")
            return row['port']
            
        cursor = conn.execute("SELECT port FROM worktree_ports WHERE status != 'RELEASED'")
        used_ports = {row['port'] for row in cursor.fetchall()}
        
        for port in range(PORT_START, PORT_END + 1):
            if port not in used_ports and not is_port_in_use(port):
                try:
                    conn.execute("""
                        INSERT INTO worktree_ports (story_id, worktree_path, port, status, allocated_at)
                        VALUES (?, ?, ?, 'ALLOCATED', ?)
                    """, (story_id, norm_path, port, now))
                    
                    env_file = os.path.join(norm_path, ".env.local")
                    with open(env_file, "a") as f:
                        f.write(f"\n# Auto-injected by worktree-port-manager\n")
                        f.write(f"PORT={port}\n")
                        f.write(f"VITE_PORT={port}\n")
                    
                    print(f"Successfully assigned port {port} for {story_id}")
                    print(f"🚀 Clickable URL: http://localhost:{port}")
                    return port
                except sqlite3.IntegrityError:
                    continue
                    
    print("Error: Port pool exhausted")
    sys.exit(1)

def check_process_match(pid):
    try:
        output = subprocess.check_output(["ps", "-p", str(pid), "-o", "comm="], text=True).strip()
        if "node" in output or "vite" in output or "pnpm" in output or "npm" in output:
            return True
        return False
    except subprocess.CalledProcessError:
        return False

def release_port(story_id):
    init_db()
    conn = get_connection()
    now = datetime.now(timezone.utc).isoformat()
    
    with conn:
        cursor = conn.execute("SELECT port, pid, status FROM worktree_ports WHERE story_id = ?", (story_id,))
        row = cursor.fetchone()
        
        if not row:
            print(f"No port assigned for {story_id}")
            return
            
        if row['status'] == 'RUNNING' and row['pid']:
            pid = row['pid']
            if check_process_match(pid):
                print(f"Killing process group for PID {pid}...")
                try:
                    os.killpg(os.getpgid(pid), signal.SIGTERM)
                    time.sleep(1)
                    if is_port_in_use(row['port']):
                        os.killpg(os.getpgid(pid), signal.SIGKILL)
                except Exception as e:
                    pass
                
        conn.execute("""
            UPDATE worktree_ports 
            SET status = 'RELEASED', released_at = ?, pid = NULL
            WHERE story_id = ?
        """, (now, story_id))
        
    print(f"Successfully released port {row['port']} for {story_id}")

def get_port(story_id):
    conn = get_connection()
    cursor = conn.execute("SELECT port FROM worktree_ports WHERE story_id = ? AND status != 'RELEASED'", (story_id,))
    row = cursor.fetchone()
    if row:
        print(row['port'])
    else:
        sys.exit(1)

def start_server(story_id, cmd):
    # This simulates starting a server and capturing its PID, updating SQLite
    # Typically this would wrap the actual `pnpm dev` process
    pass

def main():
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="action", required=True)
    
    p_assign = subparsers.add_parser("assign")
    p_assign.add_argument("story_id")
    p_assign.add_argument("worktree_path")
    
    p_release = subparsers.add_parser("release")
    p_release.add_argument("story_id")
    
    p_get = subparsers.add_parser("get")
    p_get.add_argument("story_id")
    
    args = parser.parse_args()
    
    if args.action == "assign":
        assign_port(args.story_id, args.worktree_path)
    elif args.action == "release":
        release_port(args.story_id)
    elif args.action == "get":
        get_port(args.story_id)

if __name__ == "__main__":
    main()
