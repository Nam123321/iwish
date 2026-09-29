#!/usr/bin/env python3
"""
Unit and integration tests for recommendation-generator.py.
Validates all Acceptance Criteria (AC1-AC4).
"""

import os
import sys
import tempfile
import shutil
import unittest
import subprocess
import yaml
from unittest.mock import patch

# Dynamically import the recommendation-generator.py script
import importlib.util
script_dir = os.path.dirname(os.path.abspath(__file__))
script_path = os.path.join(script_dir, "recommendation-generator.py")
spec = importlib.util.spec_from_file_location("recommendation_generator", script_path)
recommendation_generator = importlib.util.module_from_spec(spec)
sys.modules["recommendation_generator"] = recommendation_generator
spec.loader.exec_module(recommendation_generator)

class TestRecommendationGenerator(unittest.TestCase):

    def setUp(self):
        # Create a temp directory to simulate the workspace
        self.temp_workspace = tempfile.mkdtemp()
        
        # Initialize a git repo inside the temp workspace
        subprocess.run(['git', 'init'], cwd=self.temp_workspace, capture_output=True, check=True)
        subprocess.run(['git', 'config', 'user.name', 'Evolver Test'], cwd=self.temp_workspace, capture_output=True, check=True)
        subprocess.run(['git', 'config', 'user.email', 'test@evolver.local'], cwd=self.temp_workspace, capture_output=True, check=True)
        
        # Create initial empty commit
        subprocess.run(['git', 'commit', '--allow-empty', '-m', 'Initial commit'], cwd=self.temp_workspace, capture_output=True, check=True)
        
        # Determine the default branch name (e.g. master or main)
        res = subprocess.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], cwd=self.temp_workspace, capture_output=True, text=True, check=True)
        self.default_branch = res.stdout.strip()
        
        # Mock recommendation_generator.get_workspace_root to return our temp workspace
        self.workspace_root_patcher = patch('recommendation_generator.get_workspace_root', return_value=self.temp_workspace)
        self.mock_workspace_root = self.workspace_root_patcher.start()
        
        # Setup directories in mock workspace
        self.skills_dir = os.path.join(self.temp_workspace, ".agent", "skills")
        os.makedirs(self.skills_dir, exist_ok=True)
        
    def tearDown(self):
        # Stop mock patches
        self.workspace_root_patcher.stop()
        
        # Clean up temp directory
        try:
            shutil.rmtree(self.temp_workspace)
        except Exception:
            pass

    def create_mock_skill(self, name, description="A mock skill", frontmatter_extra=None):
        skill_dir = os.path.join(self.skills_dir, name)
        os.makedirs(skill_dir, exist_ok=True)
        
        # Write .skill_id
        skill_id = f"{name}__imp_mock-uuid-12345"
        with open(os.path.join(skill_dir, ".skill_id"), "w", encoding="utf-8") as f:
            f.write(skill_id + "\n")
            
        # Write SKILL.md
        frontmatter = {
            "name": name,
            "description": description,
            "tags": ["test", name],
            "depends_on": []
        }
        if frontmatter_extra:
            frontmatter.update(frontmatter_extra)
            
        frontmatter_str = yaml.dump(frontmatter)
        skill_md_content = f"---\n{frontmatter_str}---\n# Mock Skill Body\n"
        with open(os.path.join(skill_dir, "SKILL.md"), "w", encoding="utf-8") as f:
            f.write(skill_md_content)
            
        # Write a dummy script file to test recursion/copying
        os.makedirs(os.path.join(skill_dir, "scripts"), exist_ok=True)
        with open(os.path.join(skill_dir, "scripts", "dummy.py"), "w", encoding="utf-8") as f:
            f.write("# Dummy Script\n")
            
        # Add and commit the mock skill in git
        subprocess.run(['git', 'add', '-A'], cwd=self.temp_workspace, capture_output=True, check=True)
        subprocess.run(['git', 'commit', '-m', f"Add mock skill {name}"], cwd=self.temp_workspace, capture_output=True, check=True)
        return skill_dir, skill_id

    def test_ac1_and_ac2_generate(self):
        """
        AC1: Generates recommendation YAML contract conforming to Hermes schema.
        AC2: Sets approval_required: true, target_path under generated-skills, and promotion_target under .agent/skills.
        """
        skill_name = "test-skill-gen"
        self.create_mock_skill(skill_name)
        
        # Define arguments for generate command
        import argparse
        args_payload = argparse.Namespace(
            command="generate",
            name=skill_name,
            disposition="patch",
            sandbox_branch="evolve/test-skill-gen-sandbox",
            source_dir=None,
            confidence=8,
            risk_level="low"
        )
            
        # Execute generate command
        recommendation_generator.do_generate(args_payload)
        
        # Verify recommendation contract exists and has correct fields
        rec_file = os.path.join(self.temp_workspace, "_iwish-output", "iwish-skills", f"recommendation-{skill_name}.yaml")
        self.assertTrue(os.path.exists(rec_file))
        
        with open(rec_file, 'r', encoding='utf-8') as f:
            rec = yaml.safe_load(f)
            
        self.assertEqual(rec["target_type"], "skill")
        self.assertEqual(rec["disposition"], "patch")
        self.assertEqual(rec["confidence"], 8)
        self.assertEqual(rec["risk_level"], "low")
        self.assertTrue(rec["approval_required"])
        self.assertEqual(rec["target_path"], f"_iwish-output/generated-skills/{skill_name}/")
        self.assertEqual(rec["promotion_target"], f".agent/skills/{skill_name}/")
        self.assertEqual(rec["sandbox_branch"], "evolve/test-skill-gen-sandbox")
        
        # Verify draft directory exists and contains metadata.yaml
        draft_dir = os.path.join(self.temp_workspace, "_iwish-output", "generated-skills", skill_name)
        self.assertTrue(os.path.exists(draft_dir))
        self.assertTrue(os.path.exists(os.path.join(draft_dir, "SKILL.md")))
        self.assertTrue(os.path.exists(os.path.join(draft_dir, "scripts", "dummy.py")))
        
        metadata_path = os.path.join(draft_dir, "metadata.yaml")
        self.assertTrue(os.path.exists(metadata_path))
        with open(metadata_path, 'r', encoding='utf-8') as f:
            meta = yaml.safe_load(f)
        self.assertEqual(meta["status"], "draft")
        self.assertEqual(meta["origin"], "iwish-evolver")
        self.assertEqual(meta["promotion_target"], f".agent/skills/{skill_name}/")

    def test_ac3_promote(self):
        """
        AC3: Copies files to canonical .agent/ folder, updates knowledge-graph.yaml,
        and removes temporary sandbox git branch.
        """
        skill_name = "test-skill-promote"
        sandbox_branch = "evolve/test-skill-promote-sandbox"
        
        # Create skill on main branch first
        self.create_mock_skill(skill_name)
        
        # Checkout a sandbox branch
        subprocess.run(['git', 'checkout', '-b', sandbox_branch], cwd=self.temp_workspace, capture_output=True, check=True)
        
        # Make a modification in the sandbox branch
        skill_dir = os.path.join(self.skills_dir, skill_name)
        with open(os.path.join(skill_dir, "SKILL.md"), "a", encoding="utf-8") as f:
            f.write("\n## Sandbox Added Section\n")
        subprocess.run(['git', 'add', '-A'], cwd=self.temp_workspace, capture_output=True, check=True)
        subprocess.run(['git', 'commit', '-m', "Evolved skill in sandbox"], cwd=self.temp_workspace, capture_output=True, check=True)
        
        # Write mock state file
        state_file = os.path.join(self.temp_workspace, ".git", f"iwish-sandbox-{skill_name}")
        with open(state_file, 'w', encoding='utf-8') as f:
            f.write(f'ORIG_BRANCH="{self.default_branch}"\nSTASHED="false"\n')
            
        # Create a mock knowledge graph
        kg_path = os.path.join(self.temp_workspace, ".agent", "knowledge-graph.yaml")
        kg_initial = {
            "nodes": [
                {
                    "id": "skill-other",
                    "type": "skill",
                    "path": "/.agent/skills/other/SKILL.md",
                    "description": "Other skill",
                    "tags": ["other"],
                    "depends_on": []
                }
            ]
        }
        with open(kg_path, 'w', encoding='utf-8') as f:
            yaml.dump(kg_initial, f)
            
        # Generate the recommendation first
        import argparse
        gen_args = argparse.Namespace(
            command="generate",
            name=skill_name,
            disposition="patch",
            sandbox_branch=sandbox_branch,
            source_dir=None,
            confidence=9,
            risk_level="low"
        )
        recommendation_generator.do_generate(gen_args)
        
        # Verify generated recommendation contract exists
        rec_file = os.path.join(self.temp_workspace, "_iwish-output", "iwish-skills", f"recommendation-{skill_name}.yaml")
        self.assertTrue(os.path.exists(rec_file))
        
        # Run promote command
        promote_args = argparse.Namespace(
            command="promote",
            name=skill_name
        )
        recommendation_generator.do_promote(promote_args)
        
        # Verify files are copied to the canonical folder
        promoted_skill_md = os.path.join(self.skills_dir, skill_name, "SKILL.md")
        self.assertTrue(os.path.exists(promoted_skill_md))
        with open(promoted_skill_md, 'r', encoding='utf-8') as f:
            content = f.read()
        self.assertIn("Sandbox Added Section", content)
        
        # Verify that parent_uuid and commit_sha are appended to frontmatter
        frontmatter = recommendation_generator.parse_frontmatter(promoted_skill_md)
        self.assertIn("parent_uuid", frontmatter)
        self.assertIn("commit_sha", frontmatter)
        self.assertEqual(frontmatter["parent_uuid"], f"{skill_name}__imp_mock-uuid-12345")
        self.assertNotEqual(frontmatter["commit_sha"], "unknown_sha")
        
        # Verify knowledge-graph.yaml is updated
        with open(kg_path, 'r', encoding='utf-8') as f:
            kg = yaml.safe_load(f)
        node_ids = [node["id"] for node in kg["nodes"]]
        self.assertIn(f"skill-{skill_name}", node_ids)
        
        # Verify sandbox branch was deleted and state file removed
        branches = subprocess.run(['git', 'branch'], cwd=self.temp_workspace, capture_output=True, text=True).stdout
        self.assertNotIn(sandbox_branch, branches)
        self.assertFalse(os.path.exists(state_file))
        
        # Verify draft and recommendation are cleaned up
        self.assertFalse(os.path.exists(rec_file))
        self.assertFalse(os.path.exists(os.path.join(self.temp_workspace, "_iwish-output", "generated-skills", skill_name)))

    def test_ac4_reject(self):
        """
        AC4: Archives the draft recovery plan safely under _iwish-output/scratch/
        and drops the sandbox changes without modifying any canonical .agent/ files.
        """
        skill_name = "test-skill-reject"
        sandbox_branch = "evolve/test-skill-reject-sandbox"
        
        # Create skill on main branch first
        self.create_mock_skill(skill_name)
        
        # Checkout sandbox branch
        subprocess.run(['git', 'checkout', '-b', sandbox_branch], cwd=self.temp_workspace, capture_output=True, check=True)
        
        # Make a modification in sandbox branch
        skill_dir = os.path.join(self.skills_dir, skill_name)
        with open(os.path.join(skill_dir, "SKILL.md"), "a", encoding="utf-8") as f:
            f.write("\n## Sandbox Added Section\n")
        subprocess.run(['git', 'add', '-A'], cwd=self.temp_workspace, capture_output=True, check=True)
        subprocess.run(['git', 'commit', '-m', "Evolved skill in sandbox"], cwd=self.temp_workspace, capture_output=True, check=True)
        
        # Write state file
        state_file = os.path.join(self.temp_workspace, ".git", f"iwish-sandbox-{skill_name}")
        with open(state_file, 'w', encoding='utf-8') as f:
            f.write(f'ORIG_BRANCH="{self.default_branch}"\nSTASHED="false"\n')
            
        # Generate the recommendation recommendation
        import argparse
        gen_args = argparse.Namespace(
            command="generate",
            name=skill_name,
            disposition="patch",
            sandbox_branch=sandbox_branch,
            source_dir=None,
            confidence=9,
            risk_level="low"
        )
        recommendation_generator.do_generate(gen_args)
        
        # Verify recommendation contract exists
        rec_file = os.path.join(self.temp_workspace, "_iwish-output", "iwish-skills", f"recommendation-{skill_name}.yaml")
        self.assertTrue(os.path.exists(rec_file))
        
        # Run reject command
        reject_args = argparse.Namespace(
            command="reject",
            name=skill_name
        )
        recommendation_generator.do_reject(reject_args)
        
        # Verify sandbox branch was deleted and state file removed
        branches = subprocess.run(['git', 'branch'], cwd=self.temp_workspace, capture_output=True, text=True).stdout
        self.assertNotIn(sandbox_branch, branches)
        self.assertFalse(os.path.exists(state_file))
        
        # Verify main branch skill file did NOT get updated
        subprocess.run(['git', 'checkout', self.default_branch], cwd=self.temp_workspace, capture_output=True, check=True)
        promoted_skill_md = os.path.join(self.skills_dir, skill_name, "SKILL.md")
        with open(promoted_skill_md, 'r', encoding='utf-8') as f:
            content = f.read()
        self.assertNotIn("Sandbox Added Section", content)
        
        # Verify files are archived under _iwish-output/scratch/
        scratch_dir = os.path.join(self.temp_workspace, "_iwish-output", "scratch")
        self.assertTrue(os.path.exists(scratch_dir))
        
        # Find archived folder starting with rejected-test-skill-reject
        archived_folders = [f for f in os.listdir(scratch_dir) if f.startswith(f"rejected-{skill_name}-")]
        self.assertEqual(len(archived_folders), 1)
        
        archived_path = os.path.join(scratch_dir, archived_folders[0])
        self.assertTrue(os.path.exists(os.path.join(archived_path, skill_name, "SKILL.md")))
        self.assertTrue(os.path.exists(os.path.join(archived_path, f"recommendation-{skill_name}.yaml")))
        
        # Verify generated-skills and iwish-skills files are removed from original location
        self.assertFalse(os.path.exists(rec_file))
        self.assertFalse(os.path.exists(os.path.join(self.temp_workspace, "_iwish-output", "generated-skills", skill_name)))

if __name__ == "__main__":
    unittest.main()
