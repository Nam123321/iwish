#!/usr/bin/env python3
"""
Worktree Registry Database Manager (SQLite WAL Mode)
Provides zero-trust concurrency control, transactional integrity,
session heartbeats, and audit trails for Git Worktree lifecycles.
"""

import os
import sys
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
import sqlite3
import argparse
import json
from datetime import datetime, timezone

def get_repo_root():
    import subprocess
    try:
        root = subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip()
        return root
    except Exception:
        return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

REPO_ROOT = get_repo_root()
DB_DIR = os.path.join(REPO_ROOT, ".worktrees")
DB_PATH = os.path.join(DB_DIR, "registry.db")

def get_connection():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    # Configure WAL mode and busy timeout for concurrent multi-process access
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn

def init_db():
    conn = get_connection()
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS worktrees (
                path TEXT PRIMARY KEY,
                branch TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_active_at TEXT,
                session_id TEXT,
                ttl_hours INTEGER DEFAULT 48,
                locked BOOLEAN DEFAULT 0
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                action TEXT NOT NULL,
                path TEXT,
                branch TEXT,
                actor TEXT,
                details TEXT
            );
        """)
    conn.close()

def register_worktree(path, branch, session_id=None, ttl_hours=48):
    init_db()
    conn = get_connection()
    now = datetime.now(timezone.utc).isoformat()
    norm_path = os.path.abspath(path)
    with conn:
        conn.execute("""
            INSERT INTO worktrees (path, branch, created_at, last_active_at, session_id, ttl_hours, locked)
            VALUES (?, ?, ?, ?, ?, ?, 0)
            ON CONFLICT(path) DO UPDATE SET
                branch = excluded.branch,
                last_active_at = excluded.last_active_at,
                session_id = COALESCE(excluded.session_id, worktrees.session_id),
                ttl_hours = excluded.ttl_hours;
        """, (norm_path, branch, now, now, session_id, ttl_hours))
        
        conn.execute("""
            INSERT INTO audit_log (timestamp, action, path, branch, actor, details)
            VALUES (?, 'REGISTER', ?, ?, ?, ?)
        """, (now, norm_path, branch, session_id or 'agent', json.dumps({"ttl_hours": ttl_hours})))
    conn.close()

def unregister_worktree(path, actor='agent', reason=''):
    init_db()
    conn = get_connection()
    now = datetime.now(timezone.utc).isoformat()
    norm_path = os.path.abspath(path)
    with conn:
        cursor = conn.execute("SELECT branch FROM worktrees WHERE path = ?", (norm_path,))
        row = cursor.fetchone()
        branch = row['branch'] if row else 'unknown'
        
        conn.execute("DELETE FROM worktrees WHERE path = ?", (norm_path,))
        conn.execute("""
            INSERT INTO audit_log (timestamp, action, path, branch, actor, details)
            VALUES (?, 'UNREGISTER', ?, ?, ?, ?)
        """, (now, norm_path, branch, actor, json.dumps({"reason": reason})))
    conn.close()

def update_heartbeat(path):
    init_db()
    conn = get_connection()
    now = datetime.now(timezone.utc).isoformat()
    norm_path = os.path.abspath(path)
    with conn:
        cursor = conn.execute("UPDATE worktrees SET last_active_at = ? WHERE path = ?", (now, norm_path))
        if cursor.rowcount == 0:
            # Fallback if path not found
            pass
    conn.close()

def set_lock_status(path, locked: bool):
    init_db()
    conn = get_connection()
    norm_path = os.path.abspath(path)
    with conn:
        conn.execute("UPDATE worktrees SET locked = ? WHERE path = ?", (1 if locked else 0, norm_path))
    conn.close()

def list_worktrees():
    init_db()
    conn = get_connection()
    cursor = conn.execute("SELECT * FROM worktrees ORDER BY created_at DESC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def get_worktree(path):
    init_db()
    conn = get_connection()
    norm_path = os.path.abspath(path)
    cursor = conn.execute("SELECT * FROM worktrees WHERE path = ?", (norm_path,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_audit_logs(limit=50):
    init_db()
    conn = get_connection()
    cursor = conn.execute("SELECT * FROM audit_log ORDER BY id DESC LIMIT ?", (limit,))
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def main():
    parser = argparse.ArgumentParser(description="Worktree Registry CLI")
    subparsers = parser.add_subparsers(dest="command")

    # init
    subparsers.add_parser("init")

    # register
    reg_parser = subparsers.add_parser("register")
    reg_parser.add_argument("--path", required=True)
    reg_parser.add_argument("--branch", required=True)
    reg_parser.add_argument("--session-id", default=None)
    reg_parser.add_argument("--ttl-hours", type=int, default=48)

    # unregister
    unreg_parser = subparsers.add_parser("unregister")
    unreg_parser.add_argument("--path", required=True)
    unreg_parser.add_argument("--actor", default="agent")
    unreg_parser.add_argument("--reason", default="")

    # heartbeat
    hb_parser = subparsers.add_parser("heartbeat")
    hb_parser.add_argument("--path", required=True)

    # lock / unlock
    lock_parser = subparsers.add_parser("lock")
    lock_parser.add_argument("--path", required=True)
    unlock_parser = subparsers.add_parser("unlock")
    unlock_parser.add_argument("--path", required=True)

    # list
    list_parser = subparsers.add_parser("list")
    list_parser.add_argument("--json", action="store_true")

    # get
    get_parser = subparsers.add_parser("get")
    get_parser.add_argument("--path", required=True)

    # audit
    audit_parser = subparsers.add_parser("audit")
    audit_parser.add_argument("--limit", type=int, default=20)

    args = parser.parse_args()

    if args.command == "init":
        init_db()
        print("✅ Registry SQLite database initialized at", DB_PATH)
    elif args.command == "register":
        register_worktree(args.path, args.branch, args.session_id, args.ttl_hours)
        print(f"✅ Registered worktree: {args.path} -> {args.branch}")
    elif args.command == "unregister":
        unregister_worktree(args.path, args.actor, args.reason)
        print(f"✅ Unregistered worktree: {args.path}")
    elif args.command == "heartbeat":
        update_heartbeat(args.path)
        print(f"💓 Heartbeat updated for: {args.path}")
    elif args.command == "lock":
        set_lock_status(args.path, True)
        print(f"🔒 Locked worktree: {args.path}")
    elif args.command == "unlock":
        set_lock_status(args.path, False)
        print(f"🔓 Unlocked worktree: {args.path}")
    elif args.command == "list":
        rows = list_worktrees()
        if args.json:
            print(json.dumps(rows, indent=2))
        else:
            if not rows:
                print("No active worktrees registered.")
            else:
                print(f"{'Path':<45} | {'Branch':<25} | {'Active (UTC)':<20} | {'TTL':<5} | {'Locked'}")
                print("-" * 110)
                for r in rows:
                    last_act = r['last_active_at'][:19] if r['last_active_at'] else 'N/A'
                    print(f"{r['path']:<45} | {r['branch']:<25} | {last_act:<20} | {r['ttl_hours']:<5} | {r['locked']}")
    elif args.command == "get":
        wt = get_worktree(args.path)
        print(json.dumps(wt, indent=2) if wt else "null")
    elif args.command == "audit":
        logs = get_audit_logs(args.limit)
        print(json.dumps(logs, indent=2))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
