const fs = require('fs');
const path = require('path');
const { searchIndex, withReferenceContext } = require('../src/rag-searcher');

function runTests() {
  console.log("=== Running RAG Searcher Tests ===");

  // Mock index content
  const mockIndex = {
    skills: [
      {
        id: 'karpathy-guidelines',
        name: 'Andrej Karpathy Coding Guidelines',
        keywords: ['coding', 'simple', 'clean', 'refactor', 'javascript']
      },
      {
        id: 'security-linter-rules',
        name: 'Security Audit Rules',
        keywords: ['security', 'audit', 'sandbox', 'traversal', 'leak']
      }
    ]
  };

  // Test 1: Search matching keywords and rank
  console.log("Test 1: Query matching and ranking...");
  const matched = searchIndex("auditing security vulnerabilities in sandbox environment", mockIndex);
  
  if (matched.length !== 1) {
    throw new Error(`Test 1 Failed: Expected exactly 1 match. Got: ${matched.length}`);
  }
  if (matched[0].id !== 'security-linter-rules') {
    throw new Error(`Test 1 Failed: Matched ID mismatch. Got: ${matched[0].id}`);
  }
  if (matched[0].score < 4) {
    throw new Error(`Test 1 Failed: Expected score >= 4. Got: ${matched[0].score}`);
  }
  console.log("✅ Test 1 Passed.");

  // Test 2: Search with zero matches
  console.log("Test 2: Query with no matches...");
  const noMatches = searchIndex("making a delicious chocolate cake recipe", mockIndex);
  if (noMatches.length !== 0) {
    throw new Error(`Test 2 Failed: Expected 0 matches. Got: ${noMatches.length}`);
  }
  console.log("✅ Test 2 Passed.");

  // Set up mock skills cache directory for context loader integration
  const mockCacheDir = path.join(__dirname, '..', 'scratch', 'mock-rag-cache');
  const skillsRoot = path.join(mockCacheDir, 'skills');

  if (fs.existsSync(mockCacheDir)) {
    fs.rmSync(mockCacheDir, { recursive: true, force: true });
  }
  fs.mkdirSync(skillsRoot, { recursive: true });

  // Provision target reference skill file
  const testSkillId = 'security-linter-rules';
  const skillDir = path.join(skillsRoot, testSkillId);
  fs.mkdirSync(skillDir, { recursive: true });
  const mockContent = "# Security Audit Rules\n- Validate paths.";
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), mockContent, 'utf8');

  // Test 3: Injected context lifecycle (success case)
  console.log("Test 3: Dynamic context wrapper validation (Success case)...");
  const sessionState = { context: [] };
  
  const result = withReferenceContext(
    testSkillId,
    sessionState,
    () => {
      // During execution, context must contain 1 reference skill
      if (sessionState.context.length !== 1) {
        throw new Error("Execution check failed: expected context size 1");
      }
      if (sessionState.context[0].id !== testSkillId) {
        throw new Error("Execution check failed: injected ID mismatch");
      }
      if (sessionState.context[0].content !== mockContent) {
        throw new Error("Execution check failed: content mismatch");
      }
      return "task_completed";
    },
    { cacheDir: mockCacheDir }
  );

  if (result !== "task_completed") {
    throw new Error(`Test 3 Failed: Unexpected task output. Got: ${result}`);
  }
  // After execution, context must be empty
  if (sessionState.context.length !== 0) {
    throw new Error("Post-execution check failed: context array not unloaded");
  }
  console.log("✅ Test 3 Passed.");

  // Test 4: Rollback context on task error (failure case)
  console.log("Test 4: Dynamic context rollback validation (Failure case)...");
  const sessionStateFail = { context: [] };

  try {
    withReferenceContext(
      testSkillId,
      sessionStateFail,
      () => {
        if (sessionStateFail.context.length !== 1) {
          throw new Error("Execution check failed: expected context size 1");
        }
        throw new Error("Simulated task run execution crash");
      },
      { cacheDir: mockCacheDir }
    );
    throw new Error("Test 4 Failed: Expected task execution to crash");
  } catch (err) {
    if (err.message !== "Simulated task run execution crash") {
      throw new Error(`Test 4 Failed: Unexpected error bubbled up: ${err.message}`);
    }
    // Verify context was cleanly unloaded despite the crash
    if (sessionStateFail.context.length !== 0) {
      throw new Error("Test 4 Failed: Context was not rolled back / unloaded on error");
    }
    console.log("✅ Test 4 Passed.");
  }

  // Cleanup mock files
  if (fs.existsSync(mockCacheDir)) {
    fs.rmSync(mockCacheDir, { recursive: true, force: true });
  }

  console.log("\n🎉 ALL RAG SEARCHER TESTS PASSED SUCCESSFULLY! 🎉");
}

try {
  runTests();
  process.exit(0);
} catch (error) {
  console.error("❌ TEST RUN FAILED:", error.message);
  process.exit(1);
}
