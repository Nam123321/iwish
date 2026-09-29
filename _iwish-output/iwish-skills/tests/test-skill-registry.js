const fs = require('fs');
const path = require('path');
const { registerSkill } = require('../src/skill-registry');

function runTests() {
  console.log("=== Running Skill Registry Integration Tests ===");

  const testSandbox = path.join(__dirname, '..', 'scratch', 'test-registry-sandbox');
  const allowedRoot = path.join(testSandbox, 'project-root');
  const registryPath = path.join(allowedRoot, '.agent', 'skill-graph.yaml');

  // Setup sandbox
  if (fs.existsSync(testSandbox)) {
    fs.rmSync(testSandbox, { recursive: true, force: true });
  }
  fs.mkdirSync(allowedRoot, { recursive: true });

  const validSkillMd = `---
name: my-registered-skill
description: "A skill that will be written to yaml"
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---
# Main Content`;

  // Test 1: Successful registration of valid skill
  console.log("Test 1: Register a valid skill...");
  const draftPath = path.join(allowedRoot, '.agent', 'skills', 'my-registered-skill');
  fs.mkdirSync(draftPath, { recursive: true });
  fs.writeFileSync(path.join(draftPath, 'SKILL.md'), validSkillMd, 'utf8');

  const res1 = registerSkill(draftPath, allowedRoot, registryPath);
  if (!res1.success) {
    throw new Error(`Test 1 Failed: Expected successful registration, got errors: ${res1.errors.join(', ')}`);
  }
  if (!fs.existsSync(draftPath)) {
    throw new Error("Test 1 Failed: Draft directory should still exist after success");
  }
  if (!fs.existsSync(registryPath)) {
    throw new Error("Test 1 Failed: registry file was not created");
  }
  const registryContent = fs.readFileSync(registryPath, 'utf8');
  if (!registryContent.includes('name: "my-registered-skill"') || !registryContent.includes('path: ".agent/skills/my-registered-skill"')) {
    throw new Error(`Test 1 Failed: Registry yaml content mismatch: ${registryContent}`);
  }
  console.log("✅ Test 1 Passed.");

  // Test 2: Rollback on invalid frontmatter
  console.log("Test 2: Rollback on frontmatter errors...");
  const badDraftPath = path.join(allowedRoot, '.agent', 'skills', 'bad-frontmatter-skill');
  fs.mkdirSync(badDraftPath, { recursive: true });
  fs.writeFileSync(path.join(badDraftPath, 'SKILL.md'), `---
name: bad-skill
description: "Missing required lists"
---`, 'utf8');

  const res2 = registerSkill(badDraftPath, allowedRoot, registryPath);
  if (res2.success) {
    throw new Error("Test 2 Failed: Expected registration to fail");
  }
  if (fs.existsSync(badDraftPath)) {
    throw new Error("Test 2 Failed: Draft folder was not deleted / rolled back");
  }
  // Verify registry was not modified with bad skill
  const regContent2 = fs.readFileSync(registryPath, 'utf8');
  if (regContent2.includes('name: "bad-skill"')) {
    throw new Error("Test 2 Failed: Bad skill was erroneously written to registry");
  }
  console.log("✅ Test 2 Passed.");

  // Test 3: Rollback on path traversal attempt
  console.log("Test 3: Rollback on path traversal...");
  const badPathDraft = path.join(allowedRoot, '.agent', 'skills', 'bad-path-skill');
  fs.mkdirSync(badPathDraft, { recursive: true });
  fs.writeFileSync(path.join(badPathDraft, 'SKILL.md'), validSkillMd, 'utf8');

  // Symlink outside sandbox
  const externalFile = path.join(testSandbox, 'external-config.txt');
  fs.writeFileSync(externalFile, "some data", 'utf8');
  const badSymlink = path.join(badPathDraft, 'unsafe-link.txt');
  
  try {
    fs.symlinkSync(externalFile, badSymlink);
  } catch (err) {
    // OS bypass
  }

  if (fs.existsSync(badSymlink)) {
    const res3 = registerSkill(badPathDraft, allowedRoot, registryPath);
    if (res3.success) {
      throw new Error("Test 3 Failed: Expected path traversal registration to fail");
    }
    if (fs.existsSync(badPathDraft)) {
      throw new Error("Test 3 Failed: Traversal draft folder was not deleted");
    }
    console.log("✅ Test 3 Passed.");
  }

  // Cleanup
  if (fs.existsSync(testSandbox)) {
    fs.rmSync(testSandbox, { recursive: true, force: true });
  }

  console.log("\n🎉 ALL SKILL REGISTRY TESTS PASSED SUCCESSFULLY! 🎉");
}

try {
  runTests();
  process.exit(0);
} catch (error) {
  console.error("❌ TEST RUN FAILED:", error.message);
  process.exit(1);
}
