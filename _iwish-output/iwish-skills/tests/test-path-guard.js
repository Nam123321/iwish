const fs = require('fs');
const path = require('path');
const { validatePaths } = require('../src/skill-linter');

function runTests() {
  console.log("=== Running Path Traversal Symlink Guard Tests ===");

  const testSandbox = path.join(__dirname, '..', 'scratch', 'test-linter-sandbox');
  const allowedDir = path.join(testSandbox, 'allowed-project');
  const outsideDir = path.join(testSandbox, 'outside-project');

  // Fresh environment setup
  if (fs.existsSync(testSandbox)) {
    fs.rmSync(testSandbox, { recursive: true, force: true });
  }
  fs.mkdirSync(allowedDir, { recursive: true });
  fs.mkdirSync(outsideDir, { recursive: true });

  // Populate safe files
  const safeFile = path.join(allowedDir, 'hello.txt');
  fs.writeFileSync(safeFile, "hello workspace", 'utf8');

  const subDir = path.join(allowedDir, 'nested');
  fs.mkdirSync(subDir, { recursive: true });
  fs.writeFileSync(path.join(subDir, 'inner.txt'), "nested content", 'utf8');

  // Populate outside file
  const externalFile = path.join(outsideDir, 'secret-hosts.txt');
  fs.writeFileSync(externalFile, "127.0.0.1 hack.com", 'utf8');

  // Test 1: Safe directory traversal (no symlinks)
  console.log("Test 1: Traverse clean and safe directories...");
  const res1 = validatePaths(allowedDir, allowedDir);
  if (!res1.valid) {
    throw new Error(`Test 1 Failed: Expected valid, got errors: ${res1.errors.join(', ')}`);
  }
  console.log("✅ Test 1 Passed.");

  // Test 2: Safe symlink (resolves inside sandbox)
  console.log("Test 2: Symlink resolving inside sandbox...");
  const safeSymlink = path.join(subDir, 'linked-hello.txt');
  try {
    fs.symlinkSync(safeFile, safeSymlink);
  } catch (err) {
    console.log("⚠️ Symlinks unsupported in this process/OS. Bypassing symlink checks.");
  }

  if (fs.existsSync(safeSymlink)) {
    const res2 = validatePaths(allowedDir, allowedDir);
    if (!res2.valid) {
      throw new Error(`Test 2 Failed: Expected valid for safe symlink. Errors: ${res2.errors.join(', ')}`);
    }
    console.log("✅ Test 2 Passed.");
  }

  // Test 3: Unsafe symlink (resolves outside sandbox)
  console.log("Test 3: Symlink resolving outside sandbox...");
  const unsafeSymlink = path.join(allowedDir, 'malicious-link.txt');
  try {
    fs.symlinkSync(externalFile, unsafeSymlink);
  } catch (err) {
    // Already handled notice in Test 2
  }

  if (fs.existsSync(unsafeSymlink)) {
    const res3 = validatePaths(allowedDir, allowedDir);
    if (res3.valid) {
      throw new Error("Test 3 Failed: Malicious out-of-sandbox symlink was not blocked!");
    }
    if (!res3.errors[0].includes("Security Exception: Path traversal attempt detected")) {
      throw new Error(`Test 3 Failed: Unexpected error mapping: ${res3.errors[0]}`);
    }
    console.log("✅ Test 3 Passed.");
  }

  // Test 4: Cyclic symlink prevention (should not crash with stack overflow)
  console.log("Test 4: Loop protection in cyclic symlinks...");
  const linkA = path.join(allowedDir, 'linkA');
  const linkB = path.join(allowedDir, 'linkB');
  
  try {
    // Create cross reference loop linkA -> linkB -> linkA
    fs.symlinkSync(linkB, linkA);
    fs.symlinkSync(linkA, linkB);
  } catch (err) {
    // Supported notice
  }

  // Execute without crashing
  try {
    const res4 = validatePaths(allowedDir, allowedDir);
    // Since linkA or linkB might be broken or cyclic depending on platform resolution,
    // as long as the walk completes without throwing a RangeError stack overflow, the test passes.
    console.log(`✅ Test 4 Passed. Walk status: ${res4.valid ? "Clean" : "Blocked cyclic link (Expected)"}`);
  } catch (err) {
    if (err instanceof RangeError) {
      throw new Error("Test 4 Failed: Infinite recursion detected, Stack Overflow crash!");
    }
    throw err;
  }

  // Cleanup
  if (fs.existsSync(testSandbox)) {
    fs.rmSync(testSandbox, { recursive: true, force: true });
  }

  console.log("\n🎉 ALL PATH TRAVERSAL GUARD TESTS PASSED SUCCESSFULLY! 🎉");
}

try {
  runTests();
  process.exit(0);
} catch (error) {
  console.error("❌ TEST RUN FAILED:", error.message);
  process.exit(1);
}
