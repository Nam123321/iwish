#!/usr/bin/env python3
"""
Unit and integration tests for lineage-sync.py.
Validates all Acceptance Criteria (AC1-AC4).
"""

import os
import sys
import tempfile
import shutil
import unittest
import sqlite3
import time
import logging
import json
import subprocess

# Ensure lineage-sync is importable dynamically since it contains a hyphen
import importlib.util
script_dir = os.path.dirname(os.path.abspath(__file__))
script_path = os.path.join(script_dir, "lineage-sync.py")
spec = importlib.util.spec_from_file_location("lineage_sync", script_path)
lineage_sync = importlib.util.module_from_spec(spec)
sys.modules["lineage_sync"] = lineage_sync
spec.loader.exec_module(lineage_sync)


class TestLineageSync(unittest.TestCase):

    def setUp(self):
        # Clear in-memory fallbacks before each test
        lineage_sync.IN_MEMORY_SKILL_IDS.clear()
        lineage_sync.IN_MEMORY_LINEAGES.clear()
        lineage_sync.IN_MEMORY_METRICS.clear()
        
        # Create a temp directory for tests
        self.test_dir = tempfile.mkdtemp()
        self.temp_db_path = os.path.join(self.test_dir, "test_iwish.db")

    def tearDown(self):
        # Clean up temp directory
        try:
            shutil.rmtree(self.test_dir)
        except Exception:
            pass

    def test_ac1_portable_id_generation(self):
        """
        AC1: Generate a unique ID ({name}__imp_{uuid}) if sidecar file does not exist,
        and read it if it does.
        """
        # Scenario A: No sidecar, no SKILL.md. Falls back to directory name.
        skill_a_dir = os.path.join(self.test_dir, "skill-a")
        os.makedirs(skill_a_dir, exist_ok=True)
        
        id_a = lineage_sync.get_or_create_skill_id(skill_a_dir)
        self.assertTrue(id_a.startswith("skill-a__imp_"))
        
        # Scenario B: Sidecar exists, read it
        id_a_second = lineage_sync.get_or_create_skill_id(skill_a_dir)
        self.assertEqual(id_a, id_a_second)

        # Scenario C: SKILL.md exists, parse name
        skill_b_dir = os.path.join(self.test_dir, "skill-b")
        os.makedirs(skill_b_dir, exist_ok=True)
        with open(os.path.join(skill_b_dir, "SKILL.md"), "w", encoding="utf-8") as f:
            f.write("---\nname: \"custom-skill-name\"\n---")
            
        id_b = lineage_sync.get_or_create_skill_id(skill_b_dir)
        self.assertTrue(id_b.startswith("custom-skill-name__imp_"))

    def test_ac2_sqlite_lineage_logging_and_ac3_dag_querying(self):
        """
        AC2: SQLite database inserts lineage records.
        AC3: Return ancestry tree (DAG) with metrics for each node.
        """
        skill_id = "test-skill__imp_12345"
        
        # 1. Initialize tables
        init_ok = lineage_sync.init_db(self.temp_db_path)
        self.assertTrue(init_ok)
        
        # 2. Record lineage and metrics
        ok1 = lineage_sync.record_lineage(skill_id, None, "hash1", self.temp_db_path)
        ok2 = lineage_sync.record_lineage(skill_id, "hash1", "hash2", self.temp_db_path)
        ok3 = lineage_sync.record_lineage(skill_id, "hash2", "hash3", self.temp_db_path)
        self.assertTrue(ok1)
        self.assertTrue(ok2)
        self.assertTrue(ok3)
        
        m_ok1 = lineage_sync.record_metrics(skill_id, "hash1", 0.5, 0.9, True, self.temp_db_path)
        m_ok2 = lineage_sync.record_metrics(skill_id, "hash2", 0.4, 0.95, True, self.temp_db_path)
        m_ok3 = lineage_sync.record_metrics(skill_id, "hash3", 0.3, 1.0, True, self.temp_db_path)
        self.assertTrue(m_ok1)
        self.assertTrue(m_ok2)
        self.assertTrue(m_ok3)
        
        # 3. Query the entire tree/DAG
        tree = lineage_sync.get_ancestry_tree(skill_id, self.temp_db_path)
        self.assertEqual(tree["skill_id"], skill_id)
        self.assertEqual(len(tree["edges"]), 3)
        self.assertIn("hash1", tree["nodes"])
        self.assertIn("hash2", tree["nodes"])
        self.assertIn("hash3", tree["nodes"])
        
        self.assertEqual(tree["nodes"]["hash1"]["latency"], 0.5)
        self.assertEqual(tree["nodes"]["hash1"]["success_rate"], 0.9)
        self.assertTrue(tree["nodes"]["hash1"]["success"])

        # 4. Query path traversal (backward)
        path = lineage_sync.get_ancestry_path(skill_id, "hash3", self.temp_db_path)
        self.assertEqual(len(path), 3)
        self.assertEqual(path[0]["version_hash"], "hash3")
        self.assertEqual(path[1]["version_hash"], "hash2")
        self.assertEqual(path[2]["version_hash"], "hash1")

    def test_ac4_permission_fallback(self):
        """
        AC4: Directory permission errors fall back gracefully to in-memory logs.
        """
        # Create a read-only directory
        ro_dir = os.path.join(self.test_dir, "ro-dir")
        os.makedirs(ro_dir, exist_ok=True)
        
        # Set permissions to read/execute only (no write)
        os.chmod(ro_dir, 0o500)
        
        try:
            # Writing sidecar should fail, falling back to in-memory log
            skill_id = lineage_sync.get_or_create_skill_id(ro_dir, "ro-skill")
            self.assertTrue(skill_id.startswith("ro-skill__imp_"))
            self.assertIn(os.path.abspath(ro_dir), lineage_sync.IN_MEMORY_SKILL_IDS)
            
            # Verify subsequent calls return the same ID
            skill_id_again = lineage_sync.get_or_create_skill_id(ro_dir, "ro-skill")
            self.assertEqual(skill_id, skill_id_again)
        finally:
            # Restore permissions to allow cleanup
            os.chmod(ro_dir, 0o700)

    def test_ac4_db_lock_fallback(self):
        """
        AC4: SQLite database write-lock issues fall back gracefully to in-memory logs.
        """
        # Initialize the db
        lineage_sync.init_db(self.temp_db_path)
        
        # Open exclusive lock transaction in a separate connection
        lock_conn = sqlite3.connect(self.temp_db_path)
        lock_conn.execute("PRAGMA journal_mode=WAL;")
        lock_conn.execute("BEGIN EXCLUSIVE TRANSACTION;")
        # Execute a write to force acquiring the write lock
        lock_conn.execute("CREATE TABLE IF NOT EXISTS dummy_lock (id INTEGER);")
        
        try:
            skill_id = "locked-skill__imp_999"
            
            # Attempt to record lineage (should fail to write due to lock, then fallback)
            ok = lineage_sync.record_lineage(skill_id, "parent", "child", self.temp_db_path)
            self.assertFalse(ok)  # Returns False indicating fallback was used
            
            # Verify in-memory log has the record
            self.assertEqual(len(lineage_sync.IN_MEMORY_LINEAGES), 1)
            self.assertEqual(lineage_sync.IN_MEMORY_LINEAGES[0]["child_hash"], "child")
            
            # Attempt to record metrics (should fail to write, then fallback)
            mok = lineage_sync.record_metrics(skill_id, "child", 0.2, 0.8, True, self.temp_db_path)
            self.assertFalse(mok)
            
            # Verify in-memory metrics log has the record
            self.assertEqual(len(lineage_sync.IN_MEMORY_METRICS), 1)
            self.assertEqual(lineage_sync.IN_MEMORY_METRICS[0]["version_hash"], "child")
            
            # Query tree should successfully merge the fallback values
            tree = lineage_sync.get_ancestry_tree(skill_id, self.temp_db_path)
            self.assertEqual(len(tree["edges"]), 1)
            self.assertEqual(tree["edges"][0]["parent"], "parent")
            self.assertEqual(tree["edges"][0]["child"], "child")
            self.assertIn("child", tree["nodes"])
            self.assertEqual(tree["nodes"]["child"]["latency"], 0.2)
            
        finally:
            # Release lock
            lock_conn.rollback()
            lock_conn.close()

    def test_cli_commands(self):
        """
        Verify CLI functionality by executing lineage-sync.py via subprocess.
        """
        script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lineage-sync.py")
        
        # 1. init-db
        cmd_init = [sys.executable, script_path, "--db", self.temp_db_path, "init-db"]
        res = subprocess.run(cmd_init, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        self.assertEqual(res.returncode, 0)
        self.assertTrue(json.loads(res.stdout.strip())["success"])
        
        # 2. get-id
        skill_dir = os.path.join(self.test_dir, "cli-skill")
        os.makedirs(skill_dir, exist_ok=True)
        cmd_get_id = [sys.executable, script_path, "get-id", skill_dir, "--name", "cli-skill-test"]
        res = subprocess.run(cmd_get_id, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        self.assertEqual(res.returncode, 0)
        skill_id = json.loads(res.stdout.strip())["skill_id"]
        self.assertTrue(skill_id.startswith("cli-skill-test__imp_"))
        
        # 3. add-relation
        cmd_add_rel = [sys.executable, script_path, "--db", self.temp_db_path, "add-relation", skill_id, "parent123", "child456"]
        res = subprocess.run(cmd_add_rel, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        self.assertEqual(res.returncode, 0)
        self.assertTrue(json.loads(res.stdout.strip())["success"])
        
        # 4. add-metrics
        cmd_add_met = [sys.executable, script_path, "--db", self.temp_db_path, "add-metrics", skill_id, "child456", "0.45", "0.99", "true"]
        res = subprocess.run(cmd_add_met, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        self.assertEqual(res.returncode, 0)
        self.assertTrue(json.loads(res.stdout.strip())["success"])
        
        # 5. query
        cmd_query = [sys.executable, script_path, "--db", self.temp_db_path, "query", skill_id]
        res = subprocess.run(cmd_query, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        self.assertEqual(res.returncode, 0)
        tree = json.loads(res.stdout.strip())
        self.assertEqual(tree["skill_id"], skill_id)
        self.assertEqual(len(tree["edges"]), 1)
        self.assertEqual(tree["edges"][0]["parent"], "parent123")
        self.assertEqual(tree["edges"][0]["child"], "child456")
        self.assertIn("child456", tree["nodes"])
        self.assertEqual(tree["nodes"]["child456"]["latency"], 0.45)
        self.assertEqual(tree["nodes"]["child456"]["success_rate"], 0.99)
        self.assertTrue(tree["nodes"]["child456"]["success"])
        
        # 6. query-path
        cmd_query_path = [sys.executable, script_path, "--db", self.temp_db_path, "query-path", skill_id, "child456"]
        res = subprocess.run(cmd_query_path, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        self.assertEqual(res.returncode, 0)
        path = json.loads(res.stdout.strip())
        self.assertEqual(len(path), 2)
        self.assertEqual(path[0]["version_hash"], "child456")
        self.assertEqual(path[1]["version_hash"], "parent123")


if __name__ == "__main__":
    unittest.main()
