const fs = require('fs');
const path = require('path');
const { syncWorkspace } = require('../src/workspace-sync');

function runTests() {
  console.log("=== Running Workspace Sync Tests ===");

  const testSandbox = path.join(__dirname, '..', 'scratch', 'test-sync-sandbox');
  const settingsPath = path.join(testSandbox, 'settings.json');
  const cacheDir = path.join(testSandbox, 'global-cache');

  // Setup sandbox
  if (fs.existsSync(testSandbox)) {
    fs.rmSync(testSandbox, { recursive: true, force: true });
  }
  fs.mkdirSync(testSandbox, { recursive: true });

  // Test 1: Sync when plugin is disabled in settings
  console.log("Test 1: Skip sync when plugin is disabled...");
  const settingsDisabled = {
    plugins: {
      'antigravity-awesome-skills': {
        enabled: false,
        active_skills: []
      }
    }
  };
  fs.writeFileSync(settingsPath, JSON.stringify(settingsDisabled, null, 2), 'utf8');

  const res1 = syncWorkspace(settingsPath, { cacheDir });
  if (res1.synced) {
    throw new Error("Test 1 Failed: Expected sync to be skipped for disabled plugins");
  }
  console.log("✅ Test 1 Passed.");

  // Test 2: Successful sync when plugin is enabled (triggers clone)
  console.log("Test 2: Trigger provisioning when plugin is enabled...");
  const settingsEnabled = {
    plugins: {
      'antigravity-awesome-skills': {
        enabled: true,
        active_skills: ['karpathy-coding-guidelines']
      }
    }
  };
  fs.writeFileSync(settingsPath, JSON.stringify(settingsEnabled, null, 2), 'utf8');

  // Sync with actual repo shallow clone (depth 1) into cache folder
  const res2 = syncWorkspace(settingsPath, {
    cacheDir,
    repoUrl: 'https://github.com/sickn33/antigravity-awesome-skills'
  });

  if (!res2.synced) {
    throw new Error(`Test 2 Failed: Sync should have completed. Error: ${res2.error}`);
  }
  if (res2.alreadyCached) {
    throw new Error("Test 2 Failed: expected alreadyCached to be false on first run");
  }
  if (!fs.existsSync(path.join(cacheDir, 'skills'))) {
    throw new Error("Test 2 Failed: global cache files do not exist");
  }
  console.log("✅ Test 2 Passed.");

  // Test 3: Skip sync when cache is already populated (alreadyCached = true)
  console.log("Test 3: Skip clone when cache is already populated...");
  const res3 = syncWorkspace(settingsPath, { cacheDir });
  if (!res3.synced) {
    throw new Error("Test 3 Failed: Sync should be flagged as true");
  }
  if (!res3.alreadyCached) {
    throw new Error("Test 3 Failed: expected alreadyCached to be true on second run");
  }
  console.log("✅ Test 3 Passed.");

  // Test 4: Isolate errors and fallback (using invalid repo URL)
  console.log("Test 4: Isolate download errors and fallback gracefully...");
  // Clear cache first to force a download try
  fs.rmSync(cacheDir, { recursive: true, force: true });
  
  const res4 = syncWorkspace(settingsPath, {
    cacheDir,
    repoUrl: 'https://github.com/sickn33/non-existent-repo-url-9999'
  });

  if (res4.synced) {
    throw new Error("Test 4 Failed: Expected sync flag to be false on failure");
  }
  if (!res4.error || !res4.error.includes("Cache initialization failed")) {
    throw new Error(`Test 4 Failed: Expected cache failure error message. Got: ${res4.error}`);
  }
  // Verify workspace didn't crash and returned cleanly
  console.log("✅ Test 4 Passed.");

  // Cleanup sandbox
  if (fs.existsSync(testSandbox)) {
    fs.rmSync(testSandbox, { recursive: true, force: true });
  }

  console.log("\n🎉 ALL WORKSPACE SYNC TESTS PASSED SUCCESSFULLY! 🎉");
}

try {
  runTests();
  process.exit(0);
} catch (error) {
  console.error("❌ TEST RUN FAILED:", error.message);
  process.exit(1);
}
