const fs = require('fs');
const path = require('path');
const { parseSettings } = require('../src/settings-parser');

function runTests() {
  console.log("=== Running Settings Parser Tests ===");

  const testSandbox = path.join(__dirname, '..', 'scratch', 'test-settings-sandbox');
  const settingsPath = path.join(testSandbox, 'settings.json');

  // Setup sandbox
  if (fs.existsSync(testSandbox)) {
    fs.rmSync(testSandbox, { recursive: true, force: true });
  }
  fs.mkdirSync(testSandbox, { recursive: true });

  // Test 1: Parse valid settings
  console.log("Test 1: Parse valid settings file...");
  const validJson = {
    plugins: {
      'awesome-skills': {
        enabled: true,
        active_skills: ['karpathy-rules', 'linter-rules']
      }
    }
  };
  fs.writeFileSync(settingsPath, JSON.stringify(validJson, null, 2), 'utf8');

  const config1 = parseSettings(settingsPath);
  if (!config1.plugins['awesome-skills'] || !config1.plugins['awesome-skills'].enabled) {
    throw new Error("Test 1 Failed: 'awesome-skills' plugin should be enabled");
  }
  const skills = config1.plugins['awesome-skills'].active_skills;
  if (skills.length !== 2 || !skills.includes('karpathy-rules')) {
    throw new Error(`Test 1 Failed: active_skills array mismatch: ${JSON.stringify(skills)}`);
  }
  console.log("✅ Test 1 Passed.");

  // Test 2: Missing settings file fallback
  console.log("Test 2: Handle missing settings file...");
  const missingPath = path.join(testSandbox, 'non-existent-settings.json');
  const config2 = parseSettings(missingPath);
  if (!config2 || typeof config2 !== 'object' || Object.keys(config2.plugins).length !== 0) {
    throw new Error("Test 2 Failed: Expected empty plugins object");
  }
  console.log("✅ Test 2 Passed.");

  // Test 3: Malformed JSON syntax fallback
  console.log("Test 3: Handle malformed JSON content...");
  fs.writeFileSync(settingsPath, "{ plugins: { bad-syntax [ } }", 'utf8'); // Broken JSON
  const config3 = parseSettings(settingsPath);
  if (!config3 || typeof config3 !== 'object' || Object.keys(config3.plugins).length !== 0) {
    throw new Error("Test 3 Failed: Expected clean recovery and empty plugins list");
  }
  console.log("✅ Test 3 Passed.");

  // Test 4: Structural sanitization
  console.log("Test 4: Sanitize structural mismatches...");
  const mismatchedJson = {
    plugins: {
      'broken-plugin': {
        enabled: "yes-please", // Not a boolean
        active_skills: "should-be-an-array" // Not an array
      }
    }
  };
  fs.writeFileSync(settingsPath, JSON.stringify(mismatchedJson, null, 2), 'utf8');
  const config4 = parseSettings(settingsPath);
  const bp = config4.plugins['broken-plugin'];
  if (!bp) {
    throw new Error("Test 4 Failed: Expected 'broken-plugin' key to exist");
  }
  if (bp.enabled !== false) {
    throw new Error("Test 4 Failed: Expected 'enabled' to default to false");
  }
  if (!Array.isArray(bp.active_skills) || bp.active_skills.length !== 0) {
    throw new Error("Test 4 Failed: Expected 'active_skills' to be sanitized to an empty array");
  }
  console.log("✅ Test 4 Passed.");

  // Cleanup
  if (fs.existsSync(testSandbox)) {
    fs.rmSync(testSandbox, { recursive: true, force: true });
  }

  console.log("\n🎉 ALL SETTINGS PARSER TESTS PASSED SUCCESSFULLY! 🎉");
}

try {
  runTests();
  process.exit(0);
} catch (error) {
  console.error("❌ TEST RUN FAILED:", error.message);
  process.exit(1);
}
