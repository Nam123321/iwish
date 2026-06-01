#!/usr/bin/env python3
"""
SQLite and File Lineage Sync script for I-Wish Evolver.
Manages unique skill IDs via sidecar files (.skill_id), creates SQLite tables,
inserts parent-child DAG relations & performance metrics, and queries evolutionary paths.
Includes WAL mode for concurrency and graceful in-memory fallbacks on permission or locking issues.
"""

import os
import sys
import uuid
import sqlite3
import argparse
import json
import logging
import time
import re

# Configure logging to write to stderr so CLI outputs JSON only on stdout
logging.basicConfig(
    level=logging.WARNING,
    format='%(asctime)s [%(levelname)s] %(message)s',
    stream=sys.stderr
)

# Default DB Path (inside the iwish-evolver skill folder)
DEFAULT_DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "iwish.db"
)

# In-Memory Fallbacks for AC4 (directory permission errors or write-lock issues)
IN_MEMORY_SKILL_IDS = {}
IN_MEMORY_LINEAGES = []
IN_MEMORY_METRICS = []


def sanitize_name(name: str) -> str:
    """Sanitizes a skill name for inclusion in the ID."""
    return re.sub(r'[^a-zA-Z0-9_\-]', '', name)


def get_or_create_skill_id(skill_dir: str, skill_name: str = None) -> str:
    """
    Given a skill directory, checks for a '.skill_id' sidecar file.
    If it exists, reads and returns the ID.
    If it does not exist, generates a unique ID ({name}__imp_{uuid}) and
    writes it to '.skill_id'. If writing fails due to permission errors,
    logs a warning and falls back to in-memory tracking.
    """
    skill_dir_abs = os.path.abspath(skill_dir)
    sidecar_path = os.path.join(skill_dir_abs, ".skill_id")

    # 1. Try to read existing sidecar
    if os.path.exists(sidecar_path):
        try:
            with open(sidecar_path, "r", encoding="utf-8") as f:
                skill_id = f.read().strip()
                if skill_id:
                    return skill_id
        except Exception as e:
            logging.warning(f"Failed to read existing sidecar file {sidecar_path}: {e}")

    # 2. Check in-memory mapping first if sidecar read/write failed previously
    if skill_dir_abs in IN_MEMORY_SKILL_IDS:
        return IN_MEMORY_SKILL_IDS[skill_dir_abs]

    # 3. Generate a new skill ID
    name_val = skill_name
    if not name_val:
        # Attempt to read name from SKILL.md frontmatter
        skill_md_path = os.path.join(skill_dir_abs, "SKILL.md")
        if os.path.exists(skill_md_path):
            try:
                with open(skill_md_path, "r", encoding="utf-8") as f:
                    for line in f:
                        if ":" in line:
                            k, v = line.split(":", 1)
                            if k.strip() == "name":
                                name_val = v.strip().strip('"').strip("'")
                                break
            except Exception as e:
                logging.warning(f"Could not parse name from SKILL.md: {e}")
        
        # Fallback to directory name
        if not name_val:
            name_val = os.path.basename(skill_dir_abs)

    clean_name = sanitize_name(name_val) or "unknown_skill"
    generated_id = f"{clean_name}__imp_{uuid.uuid4()}"

    # 4. Attempt to write sidecar file
    try:
        if not os.path.exists(skill_dir_abs):
            os.makedirs(skill_dir_abs, exist_ok=True)
        with open(sidecar_path, "w", encoding="utf-8") as f:
            f.write(generated_id + "\n")
        return generated_id
    except (OSError, PermissionError) as e:
        # AC4: Log warning and fall back gracefully to standard memory logs
        logging.warning(
            f"Permission denied or write failed for sidecar at {sidecar_path}: {e}. "
            f"Falling back to in-memory registration."
        )
        IN_MEMORY_SKILL_IDS[skill_dir_abs] = generated_id
        return generated_id


def get_db_connection(db_path: str = None) -> sqlite3.Connection:
    """
    Opens connection to the SQLite database and configures WAL mode & busy timeout.
    Returns None if connection/initialization fails.
    """
    if not db_path:
        db_path = os.environ.get("IWISH_DB_PATH", DEFAULT_DB_PATH)
    try:
        db_dir = os.path.dirname(os.path.abspath(db_path))
        if not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
        
        # Connect with timeout to handle locking
        conn = sqlite3.connect(db_path, timeout=1.0)
        conn.row_factory = sqlite3.Row
        # Enable Write-Ahead Logging (WAL) for safe concurrent reads/writes
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA busy_timeout = 1000;")
        return conn
    except (sqlite3.Error, OSError) as e:
        logging.warning(f"Failed to connect/initialize database at {db_path}: {e}")
        return None


def init_db(db_path: str = None) -> bool:
    """
    Initializes database tables if they do not exist.
    Returns True if initialization is successful, False otherwise.
    """
    conn = get_db_connection(db_path)
    if conn is None:
        return False
    try:
        with conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS lineages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    skill_id TEXT NOT NULL,
                    parent_hash TEXT,
                    child_hash TEXT NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(skill_id, parent_hash, child_hash)
                );
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    skill_id TEXT NOT NULL,
                    version_hash TEXT NOT NULL,
                    latency REAL,
                    success_rate REAL,
                    success INTEGER,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(skill_id, version_hash)
                );
            """)
        return True
    except (sqlite3.Error, OSError) as e:
        logging.warning(f"Failed to initialize database tables: {e}")
        return False
    finally:
        conn.close()
def trigger_dashboard_update():
    """
    Triggers generation of the interactive dashboard to ensure
    it contains the latest lineage and metrics.
    """
    try:
        import subprocess
        # Find project root
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(script_dir, "..", "..", "..", ".."))
        cli_path = os.path.join(project_root, "dist", "index.js")
        
        # If compiled CLI exists, run it, otherwise fall back to npx
        if os.path.exists(cli_path):
            cmd = ["node", cli_path, "gen-dashboard", "--directory", project_root]
        else:
            cmd = ["npx", "iwish", "gen-dashboard", "--directory", project_root]
            
        logging.info(f"Triggering dashboard update via: {' '.join(cmd)}")
        subprocess.run(
            cmd,
            cwd=project_root,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=10.0
        )
    except Exception as e:
        logging.warning(f"Could not trigger automatic dashboard update: {e}")


def record_lineage(skill_id: str, parent_hash: str, child_hash: str, db_path: str = None) -> bool:
    """
    Inserts a lineage record connecting parent version hash to new child version hash.
    Falls back gracefully to in-memory log if DB write fails.
    """
    # Normalize empty string parent_hash to None
    p_hash = parent_hash if parent_hash else None
    c_hash = child_hash.strip() if child_hash else None

    if not c_hash:
        logging.warning("Cannot record lineage with empty child_hash.")
        return False

    if init_db(db_path):
        conn = get_db_connection(db_path)
        if conn is not None:
            try:
                with conn:
                    conn.execute(
                        "INSERT OR IGNORE INTO lineages (skill_id, parent_hash, child_hash) VALUES (?, ?, ?)",
                        (skill_id, p_hash, c_hash)
                      )
                trigger_dashboard_update()
                return True
            except (sqlite3.Error, OSError) as e:
                logging.warning(f"Database write failed for record_lineage: {e}. Falling back to in-memory.")
            finally:
                conn.close()

    # Fallback to in-memory logging
    IN_MEMORY_LINEAGES.append({
        "skill_id": skill_id,
        "parent_hash": p_hash,
        "child_hash": c_hash,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    })
    return False


def record_metrics(skill_id: str, version_hash: str, latency: float, success_rate: float, success: bool, db_path: str = None) -> bool:
    """
    Inserts or replaces a metrics record.
    Falls back gracefully to in-memory log if DB write fails.
    """
    v_hash = version_hash.strip() if version_hash else None
    if not v_hash:
        logging.warning("Cannot record metrics with empty version_hash.")
        return False

    success_int = 1 if success else 0

    if init_db(db_path):
        conn = get_db_connection(db_path)
        if conn is not None:
            try:
                with conn:
                    conn.execute(
                        "INSERT OR REPLACE INTO metrics (skill_id, version_hash, latency, success_rate, success) VALUES (?, ?, ?, ?, ?)",
                        (skill_id, v_hash, latency, success_rate, success_int)
                    )
                trigger_dashboard_update()
                return True
            except (sqlite3.Error, OSError) as e:
                logging.warning(f"Database write failed for record_metrics: {e}. Falling back to in-memory.")
            finally:
                conn.close()

    # Fallback to in-memory logging
    IN_MEMORY_METRICS.append({
        "skill_id": skill_id,
        "version_hash": v_hash,
        "latency": latency,
        "success_rate": success_rate,
        "success": success_int,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    })
    return False


def get_ancestry_tree(skill_id: str, db_path: str = None) -> dict:
    """
    Queries ancestry tree (DAG) and returns all nodes and edges with metrics.
    Merges SQLite database records and in-memory logs.
    """
    edges = []
    nodes = {}

    # 1. Fetch from database if available
    conn = get_db_connection(db_path)
    if conn is not None:
        try:
            # Query lineages
            cursor = conn.execute(
                "SELECT parent_hash, child_hash FROM lineages WHERE skill_id = ?",
                (skill_id,)
            )
            for row in cursor.fetchall():
                edges.append({
                    "parent": row["parent_hash"],
                    "child": row["child_hash"]
                })

            # Query metrics
            cursor = conn.execute(
                "SELECT version_hash, latency, success_rate, success, created_at FROM metrics WHERE skill_id = ?",
                (skill_id,)
            )
            for row in cursor.fetchall():
                nodes[row["version_hash"]] = {
                    "latency": row["latency"],
                    "success_rate": row["success_rate"],
                    "success": bool(row["success"]) if row["success"] is not None else None,
                    "created_at": row["created_at"]
                }
        except (sqlite3.Error, OSError) as e:
            logging.warning(f"Database read failed in get_ancestry_tree: {e}.")
        finally:
            conn.close()

    # 2. Merge in-memory logs
    for lineage in IN_MEMORY_LINEAGES:
        if lineage["skill_id"] == skill_id:
            edge = {
                "parent": lineage["parent_hash"],
                "child": lineage["child_hash"]
            }
            if edge not in edges:
                edges.append(edge)

    for metric in IN_MEMORY_METRICS:
        if metric["skill_id"] == skill_id:
            nodes[metric["version_hash"]] = {
                "latency": metric["latency"],
                "success_rate": metric["success_rate"],
                "success": bool(metric["success"]) if metric["success"] is not None else None,
                "created_at": metric["created_at"]
            }

    # 3. Ensure all hashes referenced in edges exist in nodes dictionary
    for edge in edges:
        p = edge["parent"]
        c = edge["child"]
        if p and p not in nodes:
            nodes[p] = {
                "latency": None,
                "success_rate": None,
                "success": None,
                "created_at": None
            }
        if c and c not in nodes:
            nodes[c] = {
                "latency": None,
                "success_rate": None,
                "success": None,
                "created_at": None
            }

    return {
        "skill_id": skill_id,
        "nodes": nodes,
        "edges": edges
    }


def get_ancestry_path(skill_id: str, start_hash: str, db_path: str = None) -> list:
    """
    Reconstructs ancestry path by traversing backwards from start_hash to its ancestors.
    Uses DFS/BFS on the combined (DB + in-memory) DAG structure.
    Returns list of dicts: [{'version_hash': ..., 'metrics': ...}, ...]
    """
    tree = get_ancestry_tree(skill_id, db_path)
    edges = tree["edges"]
    nodes = tree["nodes"]

    # Build mapping: child_hash -> list of parent_hashes
    child_to_parents = {}
    for edge in edges:
        p = edge["parent"]
        c = edge["child"]
        if c not in child_to_parents:
            child_to_parents[c] = []
        if p:
            child_to_parents[c].append(p)

    visited = set()
    queue = [start_hash]
    path = []

    while queue:
        curr = queue.pop(0)
        if curr not in visited:
            visited.add(curr)
            path.append({
                "version_hash": curr,
                "metrics": nodes.get(curr, {
                    "latency": None,
                    "success_rate": None,
                    "success": None,
                    "created_at": None
                })
            })
            parents = child_to_parents.get(curr, [])
            for parent in parents:
                if parent not in visited:
                    queue.append(parent)

    return path


def get_all_data(db_path: str = None) -> dict:
    """
    Queries distinct skill IDs and returns ancestry trees for all of them.
    """
    result = {}
    if init_db(db_path):
        conn = get_db_connection(db_path)
        if conn is not None:
            try:
                cursor = conn.execute(
                    "SELECT DISTINCT skill_id FROM lineages UNION SELECT DISTINCT skill_id FROM metrics"
                )
                skill_ids = [row["skill_id"] for row in cursor.fetchall()]
                for s_id in skill_ids:
                    result[s_id] = get_ancestry_tree(s_id, db_path)
            except (sqlite3.Error, OSError) as e:
                logging.warning(f"Database read failed in get_all_data: {e}.")
            finally:
                conn.close()
    return result


def parse_bool(val) -> bool:
    if isinstance(val, bool):
        return val
    val_str = str(val).lower().strip()
    return val_str in ("true", "1", "yes", "y", "t")


def main():
    parser = argparse.ArgumentParser(
        description="Lineage tracking SQLite and sidecar sync tool for skill evolver."
    )
    parser.add_argument("--db", type=str, default=None, help="Path to SQLite database file.")
    subparsers = parser.add_subparsers(dest="command")

    # Command: init-db
    subparsers.add_parser("init-db", help="Initialize SQLite tables.")

    # Command: get-id
    get_id_parser = subparsers.add_parser("get-id", help="Get or create skill ID sidecar.")
    get_id_parser.add_argument("skill_dir", type=str, help="Path to the skill directory.")
    get_id_parser.add_argument("--name", type=str, default=None, help="Optional name of the skill.")

    # Command: add-relation
    add_rel_parser = subparsers.add_parser("add-relation", help="Record parent-child lineage.")
    add_rel_parser.add_argument("skill_id", type=str, help="Unique skill identifier.")
    add_rel_parser.add_argument("parent_hash", type=str, nargs="?", default="", help="Parent version hash (empty/none for root).")
    add_rel_parser.add_argument("child_hash", type=str, help="Child version hash.")

    # Command: add-metrics
    add_met_parser = subparsers.add_parser("add-metrics", help="Record version metrics.")
    add_met_parser.add_argument("skill_id", type=str, help="Unique skill identifier.")
    add_met_parser.add_argument("version_hash", type=str, help="Version hash being evaluated.")
    add_met_parser.add_argument("latency", type=float, help="Evaluation latency in seconds.")
    add_met_parser.add_argument("success_rate", type=float, help="Evaluation success rate/score.")
    add_met_parser.add_argument("success", type=str, help="Success boolean flag (true/false/1/0).")

    # Command: query
    query_parser = subparsers.add_parser("query", help="Query full lineage DAG.")
    query_parser.add_argument("skill_id", type=str, help="Unique skill identifier.")

    # Command: query-path
    query_path_parser = subparsers.add_parser("query-path", help="Query ancestry path from a version.")
    query_path_parser.add_argument("skill_id", type=str, help="Unique skill identifier.")
    query_path_parser.add_argument("version_hash", type=str, help="Starting version hash.")

    # Command: query-all
    subparsers.add_parser("query-all", help="Query lineage and metrics for all skill IDs.")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    db_path = args.db

    if args.command == "init-db":
        success = init_db(db_path)
        print(json.dumps({"success": success}))
        sys.exit(0 if success else 1)

    elif args.command == "get-id":
        skill_id = get_or_create_skill_id(args.skill_dir, args.name)
        print(json.dumps({"skill_id": skill_id}))
        sys.exit(0)

    elif args.command == "add-relation":
        success = record_lineage(args.skill_id, args.parent_hash, args.child_hash, db_path)
        print(json.dumps({"success": success}))
        sys.exit(0 if success else 1)

    elif args.command == "add-metrics":
        is_success = parse_bool(args.success)
        success = record_metrics(
            args.skill_id, args.version_hash, args.latency, args.success_rate, is_success, db_path
        )
        print(json.dumps({"success": success}))
        sys.exit(0 if success else 1)

    elif args.command == "query":
        tree = get_ancestry_tree(args.skill_id, db_path)
        print(json.dumps(tree, indent=2))
        sys.exit(0)

    elif args.command == "query-path":
        path = get_ancestry_path(args.skill_id, args.version_hash, db_path)
        print(json.dumps(path, indent=2))
        sys.exit(0)

    elif args.command == "query-all":
        data = get_all_data(db_path)
        print(json.dumps(data, indent=2))
        sys.exit(0)


if __name__ == "__main__":
    main()
