const fs = require('fs');
const path = require('path');
const os = require('os');
const { ComplianceScanner, collectFiles } = require('../src/compliance-scanner');

/**
 * Creates a temporary file with the given content for testing.
 *
 * @param {string} content - File content
 * @param {string} [filename='test-file.js'] - Filename to use
 * @returns {string} Absolute path to the created file
 */
function createTempFile(content, filename = 'test-file.js') {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compliance-test-'));
  const filePath = path.join(tmpDir, filename);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

/**
 * Removes a temporary file and its parent directory.
 * @param {string} filePath
 */
function cleanupTempFile(filePath) {
  try {
    fs.unlinkSync(filePath);
    fs.rmdirSync(path.dirname(filePath));
  } catch {
    // best-effort cleanup
  }
}

function runTests() {
  console.log("=== Running Compliance Scanner Tests ===\n");
  const scanner = new ComplianceScanner();

  // ──────────────────────────────────
  // SECRET DETECTION TESTS
  // ──────────────────────────────────

  // Test 1: Detect API key patterns
  console.log("Test 1: Detect API key patterns (api_key = ...)...");
  {
    const file = createTempFile('const config = { api_key: "sk-abc123456789xyz" };');
    try {
      const result = scanner.scanSecrets([file]);
      if (result.findings.length === 0) throw new Error("Expected at least 1 finding for API key");
      if (result.findings[0].type !== 'secret') throw new Error("Expected type 'secret'");
      if (result.findings[0].severity !== 'critical') throw new Error("Expected severity 'critical'");
      if (result.findings[0].line !== 1) throw new Error("Expected line 1");
      console.log("✅ Test 1 Passed.");
    } finally { cleanupTempFile(file); }
  }

  // Test 2: Detect AWS access key patterns
  console.log("Test 2: Detect AWS access key (AKIA...)...");
  {
    const file = createTempFile('const AWS_KEY = "AKIA1234567890ABCDEF";');
    try {
      const result = scanner.scanSecrets([file]);
      const awsFinding = result.findings.find(f => f.description.includes('AWS'));
      if (!awsFinding) throw new Error("Expected AWS key finding");
      if (awsFinding.severity !== 'critical') throw new Error("Expected critical severity for AWS key");
      console.log("✅ Test 2 Passed.");
    } finally { cleanupTempFile(file); }
  }

  // Test 3: Detect private key markers
  console.log("Test 3: Detect private key markers...");
  {
    const file = createTempFile('const key = `-----BEGIN RSA PRIVATE KEY-----\nMIIEp...`;');
    try {
      const result = scanner.scanSecrets([file]);
      const pkFinding = result.findings.find(f => f.description.includes('Private key'));
      if (!pkFinding) throw new Error("Expected private key finding");
      if (pkFinding.severity !== 'critical') throw new Error("Expected critical severity");
      console.log("✅ Test 3 Passed.");
    } finally { cleanupTempFile(file); }
  }

  // Test 4: Detect JWT tokens
  console.log("Test 4: Detect JWT tokens...");
  {
    const file = createTempFile('const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature";');
    try {
      const result = scanner.scanSecrets([file]);
      const jwtFinding = result.findings.find(f => f.description.includes('JWT'));
      if (!jwtFinding) throw new Error("Expected JWT finding");
      if (jwtFinding.severity !== 'critical') throw new Error("Expected critical severity for JWT");
      console.log("✅ Test 4 Passed.");
    } finally { cleanupTempFile(file); }
  }

  // Test 5: Detect password patterns
  console.log("Test 5: Detect password patterns...");
  {
    const file = createTempFile('const password = "mySuperSecret123!";');
    try {
      const result = scanner.scanSecrets([file]);
      const passFinding = result.findings.find(f => f.description.includes('password'));
      if (!passFinding) throw new Error("Expected password finding");
      console.log("✅ Test 5 Passed.");
    } finally { cleanupTempFile(file); }
  }

  // Test 6: Clean file produces no secret findings
  console.log("Test 6: Clean file produces no secret findings...");
  {
    const file = createTempFile('const x = 42;\nconsole.log("hello world");');
    try {
      const result = scanner.scanSecrets([file]);
      if (result.findings.length !== 0) throw new Error(`Expected 0 findings, got ${result.findings.length}`);
      if (result.filesScanned !== 1) throw new Error("Expected 1 file scanned");
      console.log("✅ Test 6 Passed.");
    } finally { cleanupTempFile(file); }
  }

  // ──────────────────────────────────
  // MAGIC NUMBER DETECTION TESTS
  // ──────────────────────────────────

  // Test 7: Detect hardcoded port numbers
  console.log("Test 7: Detect hardcoded port numbers...");
  {
    const file = createTempFile('const port = 5432;\napp.listen(port);');
    try {
      const result = scanner.scanMagicNumbers([file]);
      const portFinding = result.findings.find(f => f.description.includes('port'));
      if (!portFinding) throw new Error("Expected port finding for 5432");
      if (portFinding.severity !== 'warning') throw new Error("Expected warning severity for ports");
      console.log("✅ Test 7 Passed.");
    } finally { cleanupTempFile(file); }
  }

  // Test 8: Allowed ports (80, 443, 3000, 8080) are not flagged
  console.log("Test 8: Common ports (80, 443, 3000, 8080) are NOT flagged...");
  {
    const file = createTempFile(
      'const port = 80;\nconst port2 = 443;\nconst port3 = 3000;\nconst port4 = 8080;'
    );
    try {
      const result = scanner.scanMagicNumbers([file]);
      const portFindings = result.findings.filter(f => f.description.includes('port'));
      if (portFindings.length !== 0) {
        throw new Error(`Expected 0 port findings for allowed ports, got ${portFindings.length}: ${portFindings.map(f => f.match).join(', ')}`);
      }
      console.log("✅ Test 8 Passed.");
    } finally { cleanupTempFile(file); }
  }

  // Test 9: Detect hardcoded IP addresses
  console.log("Test 9: Detect hardcoded IP addresses...");
  {
    const file = createTempFile('const dbHost = "192.168.1.100";');
    try {
      const result = scanner.scanMagicNumbers([file]);
      const ipFinding = result.findings.find(f => f.description.includes('IP address'));
      if (!ipFinding) throw new Error("Expected IP address finding");
      if (ipFinding.severity !== 'warning') throw new Error("Expected warning severity");
      console.log("✅ Test 9 Passed.");
    } finally { cleanupTempFile(file); }
  }

  // Test 10: localhost IP (127.0.0.1) is NOT flagged
  console.log("Test 10: Localhost (127.0.0.1) is NOT flagged...");
  {
    const file = createTempFile('const host = "127.0.0.1";');
    try {
      const result = scanner.scanMagicNumbers([file]);
      const ipFindings = result.findings.filter(f => f.description.includes('IP address'));
      if (ipFindings.length !== 0) throw new Error("Expected 0 IP findings for localhost");
      console.log("✅ Test 10 Passed.");
    } finally { cleanupTempFile(file); }
  }

  // Test 11: Detect URLs with embedded credentials
  console.log("Test 11: Detect URLs with embedded credentials...");
  {
    const file = createTempFile('const dbUrl = "http://admin:password123@db.example.com/mydb";');
    try {
      const result = scanner.scanMagicNumbers([file]);
      const urlFinding = result.findings.find(f => f.description.includes('credentials'));
      if (!urlFinding) throw new Error("Expected credential URL finding");
      if (urlFinding.severity !== 'warning') throw new Error("Expected warning severity");
      console.log("✅ Test 11 Passed.");
    } finally { cleanupTempFile(file); }
  }

  // Test 12: Detect large numeric literals > 100
  console.log("Test 12: Detect large numeric literals > 100...");
  {
    const file = createTempFile('const maxRetries = 5;\nconst timeout = 30000;');
    try {
      const result = scanner.scanMagicNumbers([file]);
      const numFinding = result.findings.find(f => f.description.includes('magic number'));
      if (!numFinding) throw new Error("Expected magic number finding for 30000");
      if (numFinding.severity !== 'info') throw new Error("Expected info severity for magic numbers");
      console.log("✅ Test 12 Passed.");
    } finally { cleanupTempFile(file); }
  }

  // ──────────────────────────────────
  // FULL SCAN & GATE TESTS
  // ──────────────────────────────────

  // Test 13: runFullScan combines both scan results
  console.log("Test 13: runFullScan returns combined findings...");
  {
    const file = createTempFile(
      'const secret = "sk-abcdefghij12345";\nconst port = 5432;'
    );
    try {
      const report = scanner.runFullScan([file]);
      const secretFindings = report.findings.filter(f => f.type === 'secret');
      const magicFindings = report.findings.filter(f => f.type === 'magic');
      if (secretFindings.length === 0) throw new Error("Expected secret findings in full scan");
      if (magicFindings.length === 0) throw new Error("Expected magic findings in full scan");
      if (report.filesScanned !== 1) throw new Error("Expected 1 file scanned");
      console.log("✅ Test 13 Passed.");
    } finally { cleanupTempFile(file); }
  }

  // Test 14: shouldBlockDone returns true when critical findings exist
  console.log("Test 14: shouldBlockDone returns true for critical findings...");
  {
    const report = {
      findings: [
        { type: 'secret', severity: 'critical', file: 'a.js', line: 1, match: 'xxx', description: 'test' },
        { type: 'magic', severity: 'warning', file: 'a.js', line: 2, match: 'yyy', description: 'test' }
      ]
    };
    if (!scanner.shouldBlockDone(report)) throw new Error("Expected shouldBlockDone to return true");
    console.log("✅ Test 14 Passed.");
  }

  // Test 15: shouldBlockDone returns false when only warnings/info
  console.log("Test 15: shouldBlockDone returns false for non-critical findings...");
  {
    const report = {
      findings: [
        { type: 'magic', severity: 'warning', file: 'a.js', line: 1, match: 'port', description: 'test' },
        { type: 'magic', severity: 'info', file: 'a.js', line: 2, match: '30000', description: 'test' }
      ]
    };
    if (scanner.shouldBlockDone(report)) throw new Error("Expected shouldBlockDone to return false");
    console.log("✅ Test 15 Passed.");
  }

  // Test 16: shouldBlockDone returns false for empty findings
  console.log("Test 16: shouldBlockDone returns false for empty report...");
  {
    if (scanner.shouldBlockDone({ findings: [] })) throw new Error("Expected false for empty findings");
    if (scanner.shouldBlockDone(null)) throw new Error("Expected false for null report");
    if (scanner.shouldBlockDone(undefined)) throw new Error("Expected false for undefined report");
    console.log("✅ Test 16 Passed.");
  }

  // ──────────────────────────────────
  // EDGE CASE TESTS
  // ──────────────────────────────────

  // Test 17: Non-existent file is handled gracefully
  console.log("Test 17: Non-existent file handled gracefully...");
  {
    const result = scanner.scanSecrets(['/tmp/this-file-absolutely-does-not-exist-xyz.js']);
    if (result.filesSkipped !== 1) throw new Error("Expected 1 file skipped");
    if (result.warnings.length === 0) throw new Error("Expected a warning for missing file");
    if (result.findings.length !== 0) throw new Error("Expected 0 findings for missing file");
    console.log("✅ Test 17 Passed.");
  }

  // Test 18: Empty file is handled gracefully
  console.log("Test 18: Empty file handled gracefully...");
  {
    const file = createTempFile('', 'empty.js');
    try {
      const result = scanner.scanSecrets([file]);
      if (result.filesSkipped !== 1) throw new Error("Expected 1 file skipped for empty file");
      if (result.findings.length !== 0) throw new Error("Expected 0 findings for empty file");
      console.log("✅ Test 18 Passed.");
    } finally { cleanupTempFile(file); }
  }

  // Test 19: Binary file is handled gracefully
  console.log("Test 19: Binary file handled gracefully...");
  {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compliance-test-'));
    const binFile = path.join(tmpDir, 'binary.dat');
    // Write a buffer with null bytes to simulate a binary file
    fs.writeFileSync(binFile, Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x00, 0x00, 0x01, 0xFF]));
    try {
      const result = scanner.scanSecrets([binFile]);
      if (result.filesSkipped !== 1) throw new Error("Expected 1 file skipped for binary file");
      if (result.findings.length !== 0) throw new Error("Expected 0 findings for binary file");
      console.log("✅ Test 19 Passed.");
    } finally {
      try { fs.unlinkSync(binFile); fs.rmdirSync(tmpDir); } catch {}
    }
  }

  // Test 20: Multiple files scanned in one call
  console.log("Test 20: Multiple files scanned in one call...");
  {
    const file1 = createTempFile('const token = "sk-abcdefghij12345";', 'file1.js');
    const tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'compliance-test-'));
    const file2 = path.join(tmpDir2, 'file2.js');
    fs.writeFileSync(file2, 'const x = AKIA1234567890ABCDEF;', 'utf-8');
    try {
      const result = scanner.scanSecrets([file1, file2]);
      if (result.filesScanned !== 2) throw new Error(`Expected 2 files scanned, got ${result.filesScanned}`);
      if (result.findings.length < 2) throw new Error("Expected at least 2 findings from 2 files");
      console.log("✅ Test 20 Passed.");
    } finally {
      cleanupTempFile(file1);
      try { fs.unlinkSync(file2); fs.rmdirSync(tmpDir2); } catch {}
    }
  }

  // Test 21: Finding object shape is correct
  console.log("Test 21: Finding object has correct shape...");
  {
    const file = createTempFile('const api_key = "sk-verylongsecretkey123";');
    try {
      const result = scanner.scanSecrets([file]);
      const finding = result.findings[0];
      if (!finding) throw new Error("Expected at least 1 finding");

      const requiredKeys = ['type', 'severity', 'file', 'line', 'match', 'description'];
      for (const key of requiredKeys) {
        if (!(key in finding)) throw new Error(`Missing required key '${key}' in finding`);
      }
      if (typeof finding.line !== 'number') throw new Error("finding.line should be a number");
      if (typeof finding.file !== 'string') throw new Error("finding.file should be a string");
      console.log("✅ Test 21 Passed.");
    } finally { cleanupTempFile(file); }
  }

  // Test 22: Secrets in comments are still flagged (defense-in-depth)
  console.log("Test 22: Secrets in comments are still flagged...");
  {
    const file = createTempFile('// api_key = "sk-commentedOutSecret123"');
    try {
      const result = scanner.scanSecrets([file]);
      if (result.findings.length === 0) throw new Error("Expected finding even in comments (defense-in-depth)");
      console.log("✅ Test 22 Passed.");
    } finally { cleanupTempFile(file); }
  }

  // Test 23: EC and DSA private key markers detected
  console.log("Test 23: EC and DSA private key markers detected...");
  {
    const file = createTempFile(
      '-----BEGIN EC PRIVATE KEY-----\nfoo\n-----BEGIN DSA PRIVATE KEY-----'
    );
    try {
      const result = scanner.scanSecrets([file]);
      const pkFindings = result.findings.filter(f => f.description.includes('Private key'));
      if (pkFindings.length < 2) throw new Error(`Expected 2 private key findings, got ${pkFindings.length}`);
      console.log("✅ Test 23 Passed.");
    } finally { cleanupTempFile(file); }
  }

  // Test 24: runFullScan blocked flag is true with secrets present
  console.log("Test 24: runFullScan sets blocked=true when secrets found...");
  {
    const file = createTempFile('const secret = "sk-abcdefghij12345";');
    try {
      const report = scanner.runFullScan([file]);
      if (!report.blocked) throw new Error("Expected blocked=true when critical secrets found");
      console.log("✅ Test 24 Passed.");
    } finally { cleanupTempFile(file); }
  }

  // Test 25: runFullScan blocked flag is false with only magic numbers
  console.log("Test 25: runFullScan sets blocked=false with only magic numbers...");
  {
    const file = createTempFile('const port = 5432;');
    try {
      const report = scanner.runFullScan([file]);
      if (report.blocked) throw new Error("Expected blocked=false when only warnings present");
      console.log("✅ Test 25 Passed.");
    } finally { cleanupTempFile(file); }
  }

  // Test 26: formatReport produces readable output
  console.log("Test 26: formatReport produces structured output...");
  {
    const report = {
      findings: [
        { type: 'secret', severity: 'critical', file: 'test.js', line: 5, match: 'sk-xxx', description: 'API key' }
      ],
      filesScanned: 1,
      filesSkipped: 0,
      warnings: [],
      blocked: true
    };
    const output = ComplianceScanner.formatReport(report);
    if (!output.includes('COMPLIANCE SCAN REPORT')) throw new Error("Missing report header");
    if (!output.includes('BLOCKED')) throw new Error("Missing BLOCKED indicator");
    if (!output.includes('Critical: 1')) throw new Error("Missing critical count");
    console.log("✅ Test 26 Passed.");
  }

  // Test 27: collectFiles utility gathers files recursively
  console.log("Test 27: collectFiles gathers files recursively...");
  {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compliance-test-'));
    const subDir = path.join(tmpDir, 'sub');
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(tmpDir, 'a.js'), 'hello', 'utf-8');
    fs.writeFileSync(path.join(subDir, 'b.js'), 'world', 'utf-8');
    try {
      const files = collectFiles(tmpDir);
      if (files.length !== 2) throw new Error(`Expected 2 files, got ${files.length}`);
      console.log("✅ Test 27 Passed.");
    } finally {
      try {
        fs.unlinkSync(path.join(subDir, 'b.js'));
        fs.rmdirSync(subDir);
        fs.unlinkSync(path.join(tmpDir, 'a.js'));
        fs.rmdirSync(tmpDir);
      } catch {}
    }
  }

  console.log("\n🎉 ALL 27 COMPLIANCE SCANNER TESTS PASSED SUCCESSFULLY! 🎉");
}

try {
  runTests();
  process.exit(0);
} catch (error) {
  console.error("❌ TEST RUN FAILED:", error.message);
  console.error(error.stack);
  process.exit(1);
}
