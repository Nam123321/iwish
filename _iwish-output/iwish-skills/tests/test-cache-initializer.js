const fs = require('fs');
const path = require('path');
const os = require('os');
const { initializeCache, resolvePath } = require('../src/cache-initializer');

function runTests() {
  console.log("=== Running Cache Initializer Tests ===");
  const testDir = path.join(__dirname, '..', 'scratch', 'test-reference-cache');

  // Ensure fresh start
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  // Test 1: Resolve Path helper
  console.log("Test 1: Path Resolution...");
  const resolvedHome = resolvePath('~/.iwish');
  if (!resolvedHome.includes(os.homedir())) {
    throw new Error(`Test 1 Failed: path resolution did not map to home directory. Got: ${resolvedHome}`);
  }
  console.log("✅ Test 1 Passed.");

  // Test 2: Successful clone into temp directory
  console.log("Test 2: Successful Clone (using shallow clone to temp sandbox)...");
  // We'll clone a lightweight public repository or the actual one. To make the test faster,
  // we can use a very small repo or the actual awesome-skills repository.
  // Let's use the actual awesome-skills repo but depth 1 so it's super lightweight.
  try {
    const result = initializeCache({
      cacheDir: testDir,
      repoUrl: 'https://github.com/sickn33/antigravity-awesome-skills'
    });

    if (!result.success) {
      throw new Error("Test 2 Failed: Success flag not set to true");
    }
    if (result.alreadyExists) {
      throw new Error("Test 2 Failed: alreadyExists should be false on first run");
    }
    if (!fs.existsSync(testDir) || !fs.existsSync(path.join(testDir, 'skills'))) {
      throw new Error("Test 2 Failed: Target directories do not exist");
    }
    console.log("✅ Test 2 Passed.");
  } catch (err) {
    throw new Error(`Test 2 Failed: Exception thrown: ${err.message}`);
  }

  // Test 3: Re-runs do not re-clone (alreadyExists check)
  console.log("Test 3: Skip clone if cache already exists...");
  try {
    const result = initializeCache({
      cacheDir: testDir
    });

    if (!result.success) {
      throw new Error("Test 3 Failed: Success flag not set to true");
    }
    if (!result.alreadyExists) {
      throw new Error("Test 3 Failed: alreadyExists should be true on second run");
    }
    console.log("✅ Test 3 Passed.");
  } catch (err) {
    throw new Error(`Test 3 Failed: Exception thrown: ${err.message}`);
  }

  // Test 4: Rollback on failure (invalid repo URL)
  console.log("Test 4: Rollback on invalid repo URL...");
  const failDir = path.join(__dirname, '..', 'scratch', 'test-failed-cache');
  if (fs.existsSync(failDir)) {
    fs.rmSync(failDir, { recursive: true, force: true });
  }

  try {
    initializeCache({
      cacheDir: failDir,
      repoUrl: 'https://github.com/sickn33/this-repo-does-not-exist-123456789'
    });
    throw new Error("Test 4 Failed: Expected init to throw an error for invalid URL");
  } catch (err) {
    if (!err.message.includes("Cache initialization failed")) {
      throw new Error(`Test 4 Failed: Unexpected error message: ${err.message}`);
    }
    if (fs.existsSync(failDir)) {
      throw new Error("Test 4 Failed: failDir was not cleaned up / rolled back");
    }
    console.log("✅ Test 4 Passed.");
  }

  // Clean up
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉");
}

try {
  runTests();
  process.exit(0);
} catch (error) {
  console.error("❌ TEST RUN FAILED:", error.message);
  process.exit(1);
}
