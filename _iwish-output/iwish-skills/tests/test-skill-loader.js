const fs = require('fs');
const path = require('path');
const { readReferenceSkill } = require('../src/skill-loader');

function runTests() {
  console.log("=== Running Skill Loader Tests ===");

  const mockCacheDir = path.join(__dirname, '..', 'scratch', 'mock-skills-cache');
  const skillsRoot = path.join(mockCacheDir, 'skills');

  // Setup mock skills cache structure
  if (fs.existsSync(mockCacheDir)) {
    fs.rmSync(mockCacheDir, { recursive: true, force: true });
  }
  fs.mkdirSync(skillsRoot, { recursive: true });

  // Create valid skill mock
  const validSkillId = 'karpathy-coding-guidelines';
  const validSkillDir = path.join(skillsRoot, validSkillId);
  fs.mkdirSync(validSkillDir, { recursive: true });
  const mockContent = "# Karpathy Coding Guidelines\n- Write clean code.\n- Keep it simple.";
  fs.writeFileSync(path.join(validSkillDir, 'SKILL.md'), mockContent, 'utf8');

  // Test 1: Load valid skill
  console.log("Test 1: Load valid skill content...");
  const content = readReferenceSkill(validSkillId, { cacheDir: mockCacheDir });
  if (content !== mockContent) {
    throw new Error(`Test 1 Failed: Loaded content mismatch. Got: ${content}`);
  }
  console.log("✅ Test 1 Passed.");

  // Test 2: Load missing skill
  console.log("Test 2: Load missing skill...");
  try {
    readReferenceSkill('non-existent-skill', { cacheDir: mockCacheDir });
    throw new Error("Test 2 Failed: Expected missing skill to throw an error");
  } catch (err) {
    if (!err.message.includes("Skill not found")) {
      throw new Error(`Test 2 Failed: Unexpected error message: ${err.message}`);
    }
    console.log("✅ Test 2 Passed.");
  }

  // Test 3: ID Sanitization Regex check
  console.log("Test 3: Reject invalid skill ID formats...");
  const invalidIds = ['skill..dir', 'skill/sub', 'skill;rm', 'skill$id', '../test'];
  for (const badId of invalidIds) {
    try {
      readReferenceSkill(badId, { cacheDir: mockCacheDir });
      throw new Error(`Test 3 Failed: ID '${badId}' should have been rejected by regex`);
    } catch (err) {
      if (!err.message.includes("Security Exception: Invalid skill ID format")) {
        throw new Error(`Test 3 Failed for '${badId}': Unexpected error: ${err.message}`);
      }
    }
  }
  console.log("✅ Test 3 Passed.");

  // Test 4: Path Traversal Attack with Symlink
  console.log("Test 4: Reject traversal attempt resolving outside skills root...");
  // Create an external file outside the mock cache
  const secretFile = path.join(mockCacheDir, 'external-secret.md');
  fs.writeFileSync(secretFile, "secret data", 'utf8');

  // Create a bad skill folder that has a symlinked SKILL.md pointing to the external file
  const badSkillId = 'traversal-attack';
  const badSkillDir = path.join(skillsRoot, badSkillId);
  fs.mkdirSync(badSkillDir, { recursive: true });
  
  const badSkillFile = path.join(badSkillDir, 'SKILL.md');
  try {
    fs.symlinkSync(secretFile, badSkillFile);
  } catch (symErr) {
    // Fallback: If OS doesn't support symlinks easily without admin/developer mode, skip symlink test but print notice
    console.log("⚠️ Symlink creation unsupported on this system/process. Skipping symlink traversal test.");
  }

  if (fs.existsSync(badSkillFile)) {
    try {
      readReferenceSkill(badSkillId, { cacheDir: mockCacheDir });
      throw new Error("Test 4 Failed: Traversal attack symlink should have been blocked");
    } catch (err) {
      if (!err.message.includes("Security Exception: Path traversal attempt detected")) {
        throw new Error(`Test 4 Failed: Unexpected error for path traversal: ${err.message}`);
      }
      console.log("✅ Test 4 Passed.");
    }
  }

  // Cleanup
  if (fs.existsSync(mockCacheDir)) {
    fs.rmSync(mockCacheDir, { recursive: true, force: true });
  }

  console.log("\n🎉 ALL SKILL LOADER TESTS PASSED SUCCESSFULLY! 🎉");
}

try {
  runTests();
  process.exit(0);
} catch (error) {
  console.error("❌ TEST RUN FAILED:", error.message);
  process.exit(1);
}
