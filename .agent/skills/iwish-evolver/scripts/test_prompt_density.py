#!/usr/bin/env python3
"""
Test Suite for prompt-density-calculator.py
"""

import os
import sys
import unittest
import json
import tempfile
import shutil
from importlib.machinery import SourceFileLoader

# Load the prompt-density-calculator module dynamically to import its functions
# since it doesn't reside in a standard package structure.
SCRIPT_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "prompt-density-calculator.py"
)
prompt_density = SourceFileLoader("prompt_density", SCRIPT_PATH).load_module()


class TestPromptDensityCalculator(unittest.TestCase):

    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()
        
    def tearDown(self):
        shutil.rmtree(self.tmpdir)

    def test_compute_shannon_entropy(self):
        # Empty string
        self.assertEqual(prompt_density.compute_shannon_entropy(""), 0.0)
        
        # Single repeating character
        self.assertEqual(prompt_density.compute_shannon_entropy("aaaaa"), 0.0)
        
        # 4 unique characters, equally distributed (probability = 0.25 each)
        # H(X) = -4 * (0.25 * log2(0.25)) = -4 * (0.25 * -2) = 2.0
        self.assertAlmostEqual(prompt_density.compute_shannon_entropy("abcd"), 2.0, places=5)
        
        # standard text entropy check
        text = "hello world"
        # counts: h:1, e:1, l:3, o:2, ' ':1, w:1, r:1, d:1. Total = 11.
        # Check that it runs and returns a valid value.
        self.assertTrue(0.0 < prompt_density.compute_shannon_entropy(text) < 4.0)

    def test_extract_token_stats(self):
        # OpenAI style
        openai_log = {
            "id": "chatcmpl-123",
            "usage": {
                "prompt_tokens": 120,
                "completion_tokens": 45,
                "prompt_tokens_details": {
                    "cached_tokens": 30
                }
            }
        }
        stats = prompt_density.extract_token_stats(openai_log)
        self.assertEqual(stats['prompt_tokens'], 120)
        self.assertEqual(stats['completion_tokens'], 45)
        self.assertEqual(stats['cached_tokens'], 30)

        # Anthropic style
        anthropic_log = {
            "type": "message",
            "usage": {
                "input_tokens": 150,
                "output_tokens": 75
            }
        }
        stats2 = prompt_density.extract_token_stats(anthropic_log)
        self.assertEqual(stats2['prompt_tokens'], 150)
        self.assertEqual(stats2['completion_tokens'], 75)
        self.assertEqual(stats2['cached_tokens'], 0)

        # Gemini style
        gemini_log = {
            "usage_metadata": {
                "prompt_token_count": 210,
                "candidates_token_count": 90,
                "cached_content_token_count": 60
            }
        }
        stats3 = prompt_density.extract_token_stats(gemini_log)
        self.assertEqual(stats3['prompt_tokens'], 210)
        self.assertEqual(stats3['completion_tokens'], 90)
        self.assertEqual(stats3['cached_tokens'], 60)

        # Empty/None handling
        self.assertEqual(prompt_density.extract_token_stats({}), {
            'prompt_tokens': 0,
            'completion_tokens': 0,
            'cached_tokens': 0
        })

    def test_check_bloat(self):
        # Baseline is 0
        status, approved = prompt_density.check_bloat(0, 100, 0.8, 0.8)
        self.assertEqual(status, "OK")
        self.assertTrue(approved)

        # Current is exactly equal to baseline (0% increase)
        status, approved = prompt_density.check_bloat(100, 100, 0.8, 0.8)
        self.assertEqual(status, "OK")
        self.assertTrue(approved)

        # Current is 19% increase (no success change)
        status, approved = prompt_density.check_bloat(100, 119, 0.8, 0.8)
        self.assertEqual(status, "OK")
        self.assertTrue(approved)

        # Current is 21% increase (no success change) -> BLOATED & Rejected
        status, approved = prompt_density.check_bloat(100, 121, 0.8, 0.8)
        self.assertEqual(status, "BLOATED")
        self.assertFalse(approved)

        # Current is 21% increase BUT success rate increases -> Approved
        status, approved = prompt_density.check_bloat(100, 121, 0.8, 0.85)
        self.assertEqual(status, "OK")
        self.assertTrue(approved)

        # Current is 21% increase and success rate is equal -> Rejected
        status, approved = prompt_density.check_bloat(100, 121, 0.8, 0.8)
        self.assertEqual(status, "BLOATED")
        self.assertFalse(approved)

    def test_log_telemetry_tsv(self):
        tsv_path = os.path.join(self.tmpdir, "test_metrics.tsv")
        
        # First write (should write headers + row)
        prompt_density.log_telemetry_tsv(
            tsv_path=tsv_path,
            prompt_file="test_prompt.md",
            entropy=1.23456,
            prompt_tokens=100,
            completion_tokens=50,
            cached_tokens=10,
            size_bytes=500,
            status="OK",
            approved=True
        )
        
        # Second write (should append row only)
        prompt_density.log_telemetry_tsv(
            tsv_path=tsv_path,
            prompt_file="test_prompt_v2.md",
            entropy=2.34567,
            prompt_tokens=120,
            completion_tokens=60,
            cached_tokens=0,
            size_bytes=620,
            status="BLOATED",
            approved=False
        )
        
        # Read and check rows
        with open(tsv_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        self.assertEqual(len(lines), 3) # 1 header line + 2 data rows
        
        # Check header columns
        headers = lines[0].strip().split('\t')
        expected_headers = [
            "timestamp", "prompt_file", "entropy", 
            "prompt_tokens", "completion_tokens", "cached_tokens", 
            "size_bytes", "status", "approved"
        ]
        self.assertEqual(headers, expected_headers)
        
        # Check data fields
        row1 = lines[1].strip().split('\t')
        self.assertEqual(row1[1], "test_prompt.md")
        self.assertEqual(row1[2], "1.2346") # rounded to 4 decimals
        self.assertEqual(row1[3], "100")
        self.assertEqual(row1[4], "50")
        self.assertEqual(row1[5], "10")
        self.assertEqual(row1[6], "500")
        self.assertEqual(row1[7], "OK")
        self.assertEqual(row1[8], "TRUE")

        row2 = lines[2].strip().split('\t')
        self.assertEqual(row2[1], "test_prompt_v2.md")
        self.assertEqual(row2[2], "2.3457")
        self.assertEqual(row2[3], "120")
        self.assertEqual(row2[4], "60")
        self.assertEqual(row2[5], "0")
        self.assertEqual(row2[6], "620")
        self.assertEqual(row2[7], "BLOATED")
        self.assertEqual(row2[8], "FALSE")


if __name__ == '__main__':
    unittest.main()
