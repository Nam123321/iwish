const { validateFrontmatter } = require('../src/skill-linter');

function runTests() {
  console.log("=== Running Skill Linter Frontmatter Tests ===");

  // Test 1: Perfect frontmatter
  console.log("Test 1: Validate a complete and correct SKILL.md file...");
  const validContent = `---
name: my-cool-skill
description: "A very cool testing skill"
inputs:
  - param1
  - param2
outputs:
  - output1
mcp_tools_required: [chrome-devtools-mcp/click]
subagent_triggers: []
---
# Main skill content starts here`;

  const res1 = validateFrontmatter(validContent);
  if (!res1.valid) {
    throw new Error(`Test 1 Failed: Expected valid, got errors: ${res1.errors.join(', ')}`);
  }
  console.log("✅ Test 1 Passed.");

  // Test 2: Missing boundary markers
  console.log("Test 2: Validate missing frontmatter boundary...");
  const invalidContent2 = `# No boundaries at all`;
  const res2 = validateFrontmatter(invalidContent2);
  if (res2.valid) {
    throw new Error("Test 2 Failed: Expected invalid status for missing boundaries");
  }
  if (!res2.errors[0].includes("Missing opening YAML frontmatter boundary")) {
    throw new Error(`Test 2 Failed: Unexpected error: ${res2.errors[0]}`);
  }
  console.log("✅ Test 2 Passed.");

  // Test 3: Missing required key
  console.log("Test 3: Validate missing required fields...");
  const invalidContent3 = `---
name: incomplete-skill
description: "Missing arrays"
inputs: []
outputs: []
---`;
  const res3 = validateFrontmatter(invalidContent3);
  if (res3.valid) {
    throw new Error("Test 3 Failed: Expected invalid status for missing keys");
  }
  if (res3.errors.length !== 2) {
    throw new Error(`Test 3 Failed: Expected 2 errors. Got: ${res3.errors.length}`);
  }
  if (!res3.errors.includes("Missing required frontmatter field: 'mcp_tools_required'") ||
      !res3.errors.includes("Missing required frontmatter field: 'subagent_triggers'")) {
    throw new Error(`Test 3 Failed: Missing key check failed. Errors: ${res3.errors.join(', ')}`);
  }
  console.log("✅ Test 3 Passed.");

  // Test 4: Invalid field type
  console.log("Test 4: Validate incorrect field types...");
  const invalidContent4 = `---
name: bad-types-skill
description: []
inputs: "not-an-array"
outputs: []
mcp_tools_required: []
subagent_triggers: []
---`;
  const res4 = validateFrontmatter(invalidContent4);
  if (res4.valid) {
    throw new Error("Test 4 Failed: Expected invalid status for bad types");
  }
  if (!res4.errors.includes("Required field 'description' must be a non-empty string.") ||
      !res4.errors.includes("Required field 'inputs' must be an array/list.")) {
    throw new Error(`Test 4 Failed: Type assertions failed. Errors: ${res4.errors.join(', ')}`);
  }
  console.log("✅ Test 4 Passed.");

  console.log("\n🎉 ALL FRONTMATTER LINTER TESTS PASSED SUCCESSFULLY! 🎉");
}

try {
  runTests();
  process.exit(0);
} catch (error) {
  console.error("❌ TEST RUN FAILED:", error.message);
  process.exit(1);
}
