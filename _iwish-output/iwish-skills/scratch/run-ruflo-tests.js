import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const RUFLO_TESTS = [
  { name: 'Story 1.1: Booster Engine Core', file: 'tests/test-booster-engine.js' },
  { name: 'Story 1.2: Booster Dev-Agent Integration', file: 'tests/test-booster-integration.js' },
  { name: 'Story 2.1: Rollback Task Stack Manager', file: 'tests/test-rollback-manager.js' },
  { name: 'Story 2.2: Rollback Integrator Hook', file: 'tests/test-rollback-integrator.js' },
  { name: 'Story 3.1: Model Stats Tracker', file: 'tests/test-stats-tracker.js' },
  { name: 'Story 3.2: Thompson Sampling Router', file: 'tests/test-thompson-selector.js' },
  { name: 'Story 4.2: Double-Lock TDD Fragment', file: 'tests/test-double-lock-classifier.js' },
  { name: 'Story 5.1: Compliance Self-Check Gates', file: 'tests/test-compliance-scanner.js' },
  { name: 'Story 6.1: Git Worktree Purge Hook', file: 'tests/test-worktree-purge.js' }
];

console.log('================================================================');
console.log('     RUNNING SECOND-PASS EPIC REVIEW: RUFLO INTEGRATION         ');
console.log('================================================================\n');

let totalPassed = 0;
let totalFailed = 0;
let suiteResults = [];

for (const t of RUFLO_TESTS) {
  console.log(`Running: ${t.name} (${t.file})...`);
  try {
    const stdout = execSync(`node ${t.file}`, {
      cwd: resolve('/Users/hatrang20061988/Desktop/AI Project/iwish/_iwish-output/iwish-skills'),
      encoding: 'utf8',
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    
    // Parse test counts from output
    // Looking for strings like "Passed: X", "X passed", "Total: Y" etc.
    let passed = 0;
    let failed = 0;
    
    if (stdout.includes('passed') || stdout.includes('Passed')) {
      const match1 = stdout.match(/Passed:\s*(\d+)/i) || 
                     stdout.match(/(\d+)\s+passed/i) ||
                     stdout.match(/Results:\s*(\d+)\s*passed/i);
      if (match1) passed = parseInt(match1[1], 10);
      
      const match2 = stdout.match(/Failed:\s*(\d+)/i) || 
                     stdout.match(/(\d+)\s+failed/i) ||
                     stdout.match(/(\d+)\s*failed/i);
      if (match2) failed = parseInt(match2[1], 10);
    }
    
    // Custom parsers for specific test suites if regex didn't catch it
    if (t.file.includes('test-booster-engine')) {
      // "Total: 39 | Passed: 39 | Failed: 0"
      const match = stdout.match(/Passed:\s*(\d+)\s*\|\s*Failed:\s*(\d+)/);
      if (match) {
        passed = parseInt(match[1], 10);
        failed = parseInt(match[2], 10);
      }
    }
    
    if (passed === 0 && failed === 0) {
      // Fallback: check exit status, assume standard count if output doesn't match
      passed = 1; // Just mark as 1 pass
    }

    totalPassed += passed;
    totalFailed += failed;

    console.log(`  ✅ Passed: ${passed}, Failed: ${failed}\n`);
    suiteResults.push({ name: t.name, status: 'PASS', passed, failed });
  } catch (err) {
    console.error(`  ❌ Failed running test suite: ${err.message}`);
    if (err.stdout) {
      console.error(err.stdout);
    }
    totalFailed++;
    suiteResults.push({ name: t.name, status: 'FAIL', passed: 0, failed: 1, error: err.message });
  }
}

console.log('================================================================');
console.log('                  EPIC REVIEW SUMMARY RESULTS                  ');
console.log('================================================================');
console.log(`Total Passed Tests: ${totalPassed}`);
console.log(`Total Failed Tests: ${totalFailed}`);
console.log('----------------------------------------------------------------');
for (const r of suiteResults) {
  const statusStr = r.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
  console.log(`${statusStr.padEnd(8)} | ${r.name.padEnd(45)} | Passed: ${r.passed}, Failed: ${r.failed}`);
}
console.log('================================================================');

if (totalFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
