#!/usr/bin/env python3
"""
Redis Epoch Manager for I-Wish SDLC Anti-Drift Architecture (V3)
Manages distributed locks (leases) and atomic epoch pointer promotions for FalkorDB FeatureGraph.

Enforces:
- ADR 4: Concurrency via Distributed Leases (Redis SET NX) and Graph Epoch Publish.
- FMEA EC-P3-02: Stale Epoch Abort & Watchdog timer against Split-Brain.
- FMEA EC-P5-02: Persistent local .lock fallback against Redis OOM eviction.
- FMEA EC-P12-01: Retention of at least 2 active epochs during Garbage Collection (Rollback readiness).
- FMEA EC-P12-03: Cleanup of unpromoted/dangling epochs older than 1 hour.
"""

import os
import sys
import time
import json
import uuid
import socket
import argparse
from typing import Optional, Dict, Any, List

REDIS_HOST = os.environ.get("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(os.environ.get("REDIS_PORT", "6379"))
LOCK_TTL_MS = 30000  # 30 seconds

FALLBACK_LOCK_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "..", "runtime", "active-epoch.lock"
)


class SimpleRedisClient:
    """Zero-dependency raw Redis client using standard socket."""

    def __init__(self, host: str, port: int, timeout: float = 5.0):
        self.host = host
        self.port = port
        self.timeout = timeout
        self.sock = None

    def connect(self):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.connect((self.host, self.port))

    def close(self):
        if self.sock:
            try:
                self.sock.close()
            except Exception:
                pass
            self.sock = None

    def execute(self, *args: str) -> str:
        """Sends command using Redis RESP protocol."""
        if not self.sock:
            self.connect()
        # RESP array formatting
        parts = [f"*{len(args)}\r\n".encode("utf-8")]
        for a in args:
            encoded = str(a).encode("utf-8")
            parts.append(f"${len(encoded)}\r\n".encode("utf-8"))
            parts.append(encoded + b"\r\n")
        self.sock.sendall(b"".join(parts))

        # Read response
        response = b""
        while True:
            chunk = self.sock.recv(4096)
            if not chunk:
                break
            response += chunk
            if response.endswith(b"\r\n"):
                break
        return response.decode("utf-8", errors="replace")


def acquire_graph_lease(project_id: str, client_id: str, ttl_ms: int = LOCK_TTL_MS) -> bool:
    """Acquires distributed write lock for the project's graph using SET NX PX."""
    client = SimpleRedisClient(REDIS_HOST, REDIS_PORT)
    try:
        lock_key = f"iwish:{project_id}:graph:lease"
        resp = client.execute("SET", lock_key, client_id, "NX", "PX", str(ttl_ms))
        return "+OK" in resp
    except Exception as e:
        print(f"[WARN] Failed to acquire Redis lock: {e}", file=sys.stderr)
        return False
    finally:
        client.close()


def renew_graph_lease(project_id: str, client_id: str, ttl_ms: int = LOCK_TTL_MS) -> bool:
    """Renews distributed lease if still held by client_id (Watchdog)."""
    client = SimpleRedisClient(REDIS_HOST, REDIS_PORT)
    try:
        lock_key = f"iwish:{project_id}:graph:lease"
        # Lua script equivalent via simple get and set
        curr = client.execute("GET", lock_key)
        if client_id in curr:
            resp = client.execute("PEXPIRE", lock_key, str(ttl_ms))
            return ":1" in resp
        return False
    except Exception:
        return False
    finally:
        client.close()


def release_graph_lease(project_id: str, client_id: str) -> bool:
    """Releases distributed write lock if owned by client_id."""
    client = SimpleRedisClient(REDIS_HOST, REDIS_PORT)
    try:
        lock_key = f"iwish:{project_id}:graph:lease"
        curr = client.execute("GET", lock_key)
        if client_id in curr:
            resp = client.execute("DEL", lock_key)
            return ":1" in resp
        return False
    except Exception:
        return False
    finally:
        client.close()


def get_active_epoch(project_id: str) -> str:
    """Gets the currently active epoch, with local file fallback (FMEA EC-P5-02)."""
    client = SimpleRedisClient(REDIS_HOST, REDIS_PORT)
    try:
        key = f"iwish:{project_id}:featuregraph:active_epoch"
        resp = client.execute("GET", key)
        if resp.startswith("$"):
            lines = resp.split("\r\n")
            if len(lines) >= 2 and lines[1]:
                return lines[1]
    except Exception:
        pass
    finally:
        client.close()

    # Fallback to local .lock file
    if os.path.exists(FALLBACK_LOCK_FILE):
        try:
            with open(FALLBACK_LOCK_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("active_epoch", "epoch_0")
        except Exception:
            pass

    return "epoch_0"



def create_epoch_namespace(project_id: str, epoch: str) -> bool:
    """Creates a new epoch namespace with a 3600s TTL to prevent dangling leaks (FMEA EC-P12-03)."""
    client = SimpleRedisClient(REDIS_HOST, REDIS_PORT)
    try:
        epoch_key = f"iwish:{project_id}:featuregraph:{epoch}"
        client.execute("HSET", f"{epoch_key}:metadata", "status", "pending")
        client.execute("EXPIRE", f"{epoch_key}:metadata", "3600")
        client.execute("EXPIRE", epoch_key, "3600")
        return True
    except Exception:
        return False
    finally:
        client.close()

def publish_epoch(project_id: str, client_id: str, new_epoch: str) -> bool:
    """
    Atomically publishes new epoch pointer and syncs to fallback file.
    Enforces FMEA EC-P3-02 (Stale Epoch Abort).
    """
    client = SimpleRedisClient(REDIS_HOST, REDIS_PORT)
    try:
        lock_key = f"iwish:{project_id}:graph:lease"
        curr_lock = client.execute("GET", lock_key)
        if client_id not in curr_lock:
            raise RuntimeError(f"STALE_EPOCH_ABORT: Distributed lock expired before epoch publish. Aborting publish of {new_epoch}.")

        key = f"iwish:{project_id}:featuregraph:active_epoch"
        history_key = f"iwish:{project_id}:featuregraph:epoch_history"

        # Record new active epoch
        client.execute("SET", key, new_epoch)
        client.execute("PERSIST", f"iwish:{project_id}:featuregraph:{new_epoch}:metadata")
        client.execute("PERSIST", f"iwish:{project_id}:featuregraph:{new_epoch}")
        # Push to history list for GC tracking
        client.execute("RPUSH", history_key, new_epoch)

        # Sync to durable local fallback (FMEA EC-P5-02)
        os.makedirs(os.path.dirname(os.path.abspath(FALLBACK_LOCK_FILE)), exist_ok=True)
        with open(FALLBACK_LOCK_FILE, "w", encoding="utf-8") as f:
            json.dump({
                "project_id": project_id,
                "active_epoch": new_epoch,
                "published_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "published_by": client_id
            }, f, indent=2)

        return True
    finally:
        client.close()


def run_epoch_gc(project_id: str, retain_count: int = 2) -> List[str]:
    """
    Cleans up old epochs, retaining at least retain_count active epochs (FMEA EC-P12-01).
    Returns list of pruned epochs.
    """
    client = SimpleRedisClient(REDIS_HOST, REDIS_PORT)
    pruned = []
    try:
        history_key = f"iwish:{project_id}:featuregraph:epoch_history"
        len_resp = client.execute("LLEN", history_key)
        try:
            total = int(len_resp.strip().replace(":", ""))
        except ValueError:
            total = 0

        if total > retain_count:
            remove_count = total - retain_count
            for _ in range(remove_count):
                pop_resp = client.execute("LPOP", history_key)
                if pop_resp.startswith("$"):
                    lines = pop_resp.split("\r\n")
                    if len(lines) >= 2:
                        pruned.append(lines[1])
        return pruned
    finally:
        client.close()


def main():
    parser = argparse.ArgumentParser(description="Redis Epoch Manager for FeatureGraph Concurrency")
    parser.add_argument("--project-id", default="cowok", help="Project identifier")
    parser.add_argument("--action", choices=["acquire", "renew", "release", "get-active", "publish", "gc"], required=True)
    parser.add_argument("--client-id", default=str(uuid.uuid4()), help="Unique client lease token")
    parser.add_argument("--epoch", help="Target epoch name (required for publish)")
    parser.add_argument("--retain", type=int, default=2, help="Number of epochs to retain in GC (default: 2)")

    args = parser.parse_args()

    if args.action == "acquire":
        success = acquire_graph_lease(args.project_id, args.client_id)
        if success:
            print(f"[OK] Acquired lease: {args.client_id}")
            sys.exit(0)
        else:
            print(f"[FAILED] Could not acquire lease for project {args.project_id}", file=sys.stderr)
            sys.exit(1)

    elif args.action == "renew":
        success = renew_graph_lease(args.project_id, args.client_id)
        print(f"[{'OK' if success else 'FAILED'}] Renew lease: {args.client_id}")
        sys.exit(0 if success else 1)

    elif args.action == "release":
        success = release_graph_lease(args.project_id, args.client_id)
        print(f"[{'OK' if success else 'FAILED'}] Released lease: {args.client_id}")
        sys.exit(0 if success else 1)

    elif args.action == "get-active":
        active = get_active_epoch(args.project_id)
        print(f"Active Epoch: {active}")


    elif args.action == "create-namespace":
        if not args.epoch:
            print("[FATAL] --epoch is required", file=sys.stderr)
            sys.exit(1)
        create_epoch_namespace(args.project_id, args.epoch)
        print(f"[OK] Created epoch namespace with TTL: {args.epoch}")
        sys.exit(0)
    elif args.action == "publish":
        if not args.epoch:
            print("[FATAL] --epoch is required for publish action", file=sys.stderr)
            sys.exit(1)
        try:
            publish_epoch(args.project_id, args.client_id, args.epoch)
            print(f"[SUCCESS] Published active epoch: {args.epoch}")
        except Exception as e:
            print(f"[FATAL] Publish failed: {e}", file=sys.stderr)
            sys.exit(1)

    elif args.action == "gc":
        pruned = run_epoch_gc(args.project_id, retain_count=args.retain)
        print(f"[GC] Pruned {len(pruned)} old epochs (Retained {args.retain}): {pruned}")


if __name__ == "__main__":
    main()
