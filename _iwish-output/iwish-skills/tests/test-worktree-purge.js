const assert = require('node:assert/strict');
const path = require('path');
const { WorktreePurge, shortBranchName, isProtectedBranch, PROTECTED_BRANCHES } = require('../src/worktree-purge');

// ─── Test Fixtures ──────────────────────────────────────────────────────────

/** Simulated porcelain output from `git worktree list --porcelain` */
const SAMPLE_PORCELAIN = [
  'worktree /home/user/project',
  'HEAD abc1234567890abcdef1234567890abcdef123456',
  'branch refs/heads/main',
  '',
  'worktree /home/user/project-feature-x',
  'HEAD def4567890abcdef1234567890abcdef12345678',
  'branch refs/heads/feature-x',
  '',
  'worktree /home/user/project-bugfix-y',
  'HEAD 789abcdef1234567890abcdef1234567890abcdef',
  'branch refs/heads/bugfix-y',
  ''
].join('\n');

/** Porcelain with bare and detached entries */
const PORCELAIN_WITH_SPECIAL = [
  'worktree /home/user/project',
  'HEAD abc1234567890abcdef1234567890abcdef123456',
  'branch refs/heads/main',
  '',
  'worktree /home/user/project-bare',
  'HEAD 000000000000000000000000000000000000000000',
  'bare',
  '',
  'worktree /home/user/project-detached',
  'HEAD fff1234567890abcdef1234567890abcdef123456',
  'detached',
  '',
  'worktree /home/user/project-story-42',
  'HEAD aaa1234567890abcdef1234567890abcdef123456',
  'branch refs/heads/story-42',
  ''
].join('\n');

/** Create a mock exec function that returns predefined output */
function createMockExec(outputMap = {}) {
  return function mockExec(cmd, opts) {
    for (const [pattern, output] of Object.entries(outputMap)) {
      if (cmd.includes(pattern)) {
        if (output instanceof Error) throw output;
        return output;
      }
    }
    return '';
  };
}

// ─── Test Runner ────────────────────────────────────────────────────────────

function runTests() {
  console.log('=== Running Worktree Purge Tests ===\n');

  // ─── Helper Function Tests ──────────────────────────────

  console.log('--- shortBranchName() ---');

  console.log('T-H1: Extracts short name from full ref...');
  assert.equal(shortBranchName('refs/heads/feature-x'), 'feature-x');
  assert.equal(shortBranchName('refs/heads/main'), 'main');
  assert.equal(shortBranchName('refs/heads/story/42-login'), 'story/42-login');
  console.log('✅ T-H1 Passed.');

  console.log('T-H2: Returns input unchanged if no prefix...');
  assert.equal(shortBranchName('feature-x'), 'feature-x');
  assert.equal(shortBranchName('main'), 'main');
  console.log('✅ T-H2 Passed.');

  console.log('T-H3: Handles empty/null/undefined input...');
  assert.equal(shortBranchName(''), '');
  assert.equal(shortBranchName(null), '');
  assert.equal(shortBranchName(undefined), '');
  console.log('✅ T-H3 Passed.');

  console.log('T-H4: isProtectedBranch identifies main/master...');
  assert.equal(isProtectedBranch('main'), true);
  assert.equal(isProtectedBranch('master'), true);
  assert.equal(isProtectedBranch('refs/heads/main'), true);
  assert.equal(isProtectedBranch('refs/heads/master'), true);
  assert.equal(isProtectedBranch('feature-x'), false);
  assert.equal(isProtectedBranch('develop'), false);
  assert.equal(isProtectedBranch(''), false);
  console.log('✅ T-H4 Passed.');

  // ─── parsePorcelainOutput() Tests ───────────────────────

  console.log('\n--- parsePorcelainOutput() ---');

  console.log('T1: Parses valid porcelain output into structured objects...');
  const parsed = WorktreePurge.parsePorcelainOutput(SAMPLE_PORCELAIN);
  assert.equal(parsed.length, 3);

  assert.equal(parsed[0].path, '/home/user/project');
  assert.equal(parsed[0].head, 'abc1234567890abcdef1234567890abcdef123456');
  assert.equal(parsed[0].branch, 'refs/heads/main');
  assert.equal(parsed[0].bare, false);
  assert.equal(parsed[0].detached, false);

  assert.equal(parsed[1].path, '/home/user/project-feature-x');
  assert.equal(parsed[1].branch, 'refs/heads/feature-x');

  assert.equal(parsed[2].path, '/home/user/project-bugfix-y');
  assert.equal(parsed[2].branch, 'refs/heads/bugfix-y');
  console.log('✅ T1 Passed.');

  console.log('T2: Returns empty array for empty/null/undefined input...');
  assert.deepEqual(WorktreePurge.parsePorcelainOutput(''), []);
  assert.deepEqual(WorktreePurge.parsePorcelainOutput(null), []);
  assert.deepEqual(WorktreePurge.parsePorcelainOutput(undefined), []);
  assert.deepEqual(WorktreePurge.parsePorcelainOutput('   '), []);
  console.log('✅ T2 Passed.');

  console.log('T2b: Parses bare and detached entries correctly...');
  const specialParsed = WorktreePurge.parsePorcelainOutput(PORCELAIN_WITH_SPECIAL);
  assert.equal(specialParsed.length, 4);
  assert.equal(specialParsed[1].bare, true);
  assert.equal(specialParsed[2].detached, true);
  assert.equal(specialParsed[3].branch, 'refs/heads/story-42');
  console.log('✅ T2b Passed.');

  // ─── listWorktrees() Tests ──────────────────────────────

  console.log('\n--- listWorktrees() ---');

  console.log('T-L1: listWorktrees delegates to execFn and parses output...');
  const mockExec = createMockExec({
    'worktree list': SAMPLE_PORCELAIN
  });
  const purger = new WorktreePurge({ execFn: mockExec });
  const listed = purger.listWorktrees();
  assert.equal(listed.length, 3);
  assert.equal(listed[0].branch, 'refs/heads/main');
  console.log('✅ T-L1 Passed.');

  console.log('T-L2: listWorktrees throws on git failure...');
  const failExec = createMockExec({
    'worktree list': new Error('fatal: not a git repository')
  });
  const failPurger = new WorktreePurge({ execFn: failExec });
  assert.throws(
    () => failPurger.listWorktrees(),
    { message: /Failed to list worktrees/ }
  );
  console.log('✅ T-L2 Passed.');

  // ─── identifyStale() Tests ─────────────────────────────

  console.log('\n--- identifyStale() ---');

  console.log('T3: Identifies stale worktrees from merged branches...');
  const allWorktrees = WorktreePurge.parsePorcelainOutput(SAMPLE_PORCELAIN);
  const mergedBranches = ['feature-x', 'bugfix-y'];
  const stale = purger.identifyStale(allWorktrees, mergedBranches);
  assert.equal(stale.length, 2);
  assert.equal(shortBranchName(stale[0].branch), 'feature-x');
  assert.equal(shortBranchName(stale[1].branch), 'bugfix-y');
  console.log('✅ T3 Passed.');

  console.log('T4: Excludes main/master from stale results...');
  const mergedWithMain = ['main', 'feature-x', 'master'];
  const staleNoMain = purger.identifyStale(allWorktrees, mergedWithMain);
  // Only feature-x should be stale (main is protected, master has no worktree)
  assert.equal(staleNoMain.length, 1);
  assert.equal(shortBranchName(staleNoMain[0].branch), 'feature-x');
  console.log('✅ T4 Passed.');

  console.log('T4b: Excludes bare and detached worktrees from stale...');
  const specialWorktrees = WorktreePurge.parsePorcelainOutput(PORCELAIN_WITH_SPECIAL);
  const mergedSpecial = ['main', 'story-42'];
  const staleSpecial = purger.identifyStale(specialWorktrees, mergedSpecial);
  assert.equal(staleSpecial.length, 1);
  assert.equal(shortBranchName(staleSpecial[0].branch), 'story-42');
  console.log('✅ T4b Passed.');

  console.log('T5: Returns empty array when no merged branches...');
  const staleEmpty = purger.identifyStale(allWorktrees, []);
  assert.equal(staleEmpty.length, 0);
  console.log('✅ T5 Passed.');

  console.log('T5b: Returns empty array for null/undefined inputs...');
  assert.deepEqual(purger.identifyStale(null, ['feature-x']), []);
  assert.deepEqual(purger.identifyStale(allWorktrees, null), []);
  assert.deepEqual(purger.identifyStale(null, null), []);
  console.log('✅ T5b Passed.');

  console.log('T5c: Handles full-ref merged branches...');
  const mergedFullRef = ['refs/heads/feature-x'];
  const staleFullRef = purger.identifyStale(allWorktrees, mergedFullRef);
  assert.equal(staleFullRef.length, 1);
  assert.equal(shortBranchName(staleFullRef[0].branch), 'feature-x');
  console.log('✅ T5c Passed.');

  // ─── purge() Tests ─────────────────────────────────────

  console.log('\n--- purge() ---');

  console.log('T6: Purge returns success for valid removal...');
  let removedCmd = null;
  const trackingExec = (cmd, opts) => {
    removedCmd = cmd;
    return '';
  };
  const trackPurger = new WorktreePurge({ execFn: trackingExec });
  // Use __dirname as a path that definitely exists
  const existingPath = __dirname;
  const result6 = trackPurger.purge(existingPath, {}, 'refs/heads/feature-x');
  assert.equal(result6.success, true);
  assert.equal(result6.skipped, false);
  assert.equal(result6.error, null);
  assert.equal(result6.branch, 'feature-x');
  assert.ok(removedCmd.includes('git worktree remove'));
  assert.ok(removedCmd.includes(existingPath));
  assert.ok(!removedCmd.includes('--force'));
  console.log('✅ T6 Passed.');

  console.log('T6b: Purge with --force appends force flag...');
  removedCmd = null;
  const result6b = trackPurger.purge(existingPath, { force: true }, 'refs/heads/feature-x');
  assert.equal(result6b.success, true);
  assert.ok(removedCmd.includes('--force'));
  assert.equal(result6b.reason, 'Removed (forced)');
  console.log('✅ T6b Passed.');

  console.log('T7: Purge returns error for non-existent path...');
  const noPathResult = trackPurger.purge('/no/such/path/xyz', {}, 'refs/heads/feature-x');
  assert.equal(noPathResult.success, false);
  assert.equal(noPathResult.skipped, false);
  assert.ok(noPathResult.error.includes('does not exist'));
  assert.equal(noPathResult.reason, 'Path not found on disk');
  console.log('✅ T7 Passed.');

  console.log('T8: Purge refuses to remove main/master worktree...');
  const mainResult = trackPurger.purge(existingPath, {}, 'refs/heads/main');
  assert.equal(mainResult.success, false);
  assert.equal(mainResult.skipped, true);
  assert.ok(mainResult.reason.includes('Protected branch'));
  console.log('✅ T8 Passed.');

  console.log('T8b: Purge refuses to remove master worktree...');
  const masterResult = trackPurger.purge(existingPath, {}, 'refs/heads/master');
  assert.equal(masterResult.success, false);
  assert.equal(masterResult.skipped, true);
  assert.ok(masterResult.reason.includes('Protected branch'));
  console.log('✅ T8b Passed.');

  console.log('T9: Dry-run mode skips actual removal...');
  let dryRunCmdCalled = false;
  const dryRunExec = () => { dryRunCmdCalled = true; return ''; };
  const dryRunPurger = new WorktreePurge({ execFn: dryRunExec });
  const dryResult = dryRunPurger.purge(existingPath, { dryRun: true }, 'refs/heads/feature-x');
  assert.equal(dryResult.success, true);
  assert.equal(dryResult.skipped, true);
  assert.ok(dryResult.reason.includes('Dry-run'));
  assert.equal(dryRunCmdCalled, false, 'exec should NOT have been called in dry-run mode');
  console.log('✅ T9 Passed.');

  console.log('T9b: Purge handles git error gracefully...');
  const errExec = createMockExec({
    'worktree remove': new Error('fatal: worktree is dirty, use --force to delete')
  });
  const errPurger = new WorktreePurge({ execFn: errExec });
  const errResult = errPurger.purge(existingPath, {}, 'refs/heads/feature-x');
  assert.equal(errResult.success, false);
  assert.equal(errResult.skipped, false);
  assert.ok(errResult.error.includes('dirty'));
  assert.equal(errResult.reason, 'git worktree remove failed');
  console.log('✅ T9b Passed.');

  // ─── purgeAll() Tests ───────────────────────────────────

  console.log('\n--- purgeAll() ---');

  console.log('T10: purgeAll processes multiple worktrees and collects results...');
  const multiWorktrees = [
    { path: existingPath, head: 'aaa', branch: 'refs/heads/feature-a', bare: false, detached: false },
    { path: existingPath, head: 'bbb', branch: 'refs/heads/feature-b', bare: false, detached: false }
  ];
  const multiResults = trackPurger.purgeAll(multiWorktrees, { dryRun: true });
  assert.equal(multiResults.length, 2);
  assert.equal(multiResults[0].branch, 'feature-a');
  assert.equal(multiResults[1].branch, 'feature-b');
  assert.equal(multiResults[0].success, true);
  assert.equal(multiResults[1].success, true);
  console.log('✅ T10 Passed.');

  console.log('T10b: purgeAll returns empty array for empty input...');
  const emptyResults = trackPurger.purgeAll([]);
  assert.deepEqual(emptyResults, []);
  console.log('✅ T10b Passed.');

  console.log('T10c: purgeAll stores results for getLastResults()...');
  trackPurger.purgeAll(multiWorktrees, { dryRun: true });
  const lastResults = trackPurger.getLastResults();
  assert.equal(lastResults.length, 2);
  console.log('✅ T10c Passed.');

  console.log('T10d: purgeAll handles null input gracefully...');
  const nullResults = trackPurger.purgeAll(null);
  assert.deepEqual(nullResults, []);
  console.log('✅ T10d Passed.');

  // ─── generateReport() Tests ─────────────────────────────

  console.log('\n--- generateReport() ---');

  console.log('T11: generateReport produces valid markdown with table...');
  const sampleResults = [
    { path: '/tmp/project-feature', branch: 'feature-x', success: true, skipped: false, error: null, reason: 'Removed' },
    { path: '/tmp/project-bugfix', branch: 'bugfix-y', success: false, skipped: false, error: 'worktree is dirty', reason: 'git worktree remove failed' },
    { path: '/tmp/project-main', branch: 'main', success: false, skipped: true, error: null, reason: 'Protected branch (main/master) — purge refused' }
  ];
  const report = trackPurger.generateReport(sampleResults);

  // Verify report structure
  assert.ok(report.includes('## 🧹 Git Worktree Cleanup Report'), 'Should have header');
  assert.ok(report.includes('Generated:'), 'Should have timestamp');
  assert.ok(report.includes('**Total processed:** 3'), 'Should show total');
  assert.ok(report.includes('**Removed:** 1'), 'Should show succeeded count');
  assert.ok(report.includes('**Failed:** 1'), 'Should show failed count');
  assert.ok(report.includes('**Skipped:** 1'), 'Should show skipped count');
  assert.ok(report.includes('| Path |'), 'Should have table header');
  assert.ok(report.includes('feature-x'), 'Should include branch name');
  assert.ok(report.includes('✅ Removed'), 'Should show success status');
  assert.ok(report.includes('❌ Failed'), 'Should show failed status');
  assert.ok(report.includes('🛡️ Protected'), 'Should show protected status');
  assert.ok(report.includes('worktree is dirty'), 'Should include error message');
  console.log('✅ T11 Passed.');

  console.log('T12: generateReport handles empty results...');
  const emptyReport = trackPurger.generateReport([]);
  assert.ok(emptyReport.includes('No worktrees were processed'), 'Should indicate no work');
  assert.ok(emptyReport.includes('workspace is clean'), 'Should indicate clean state');
  console.log('✅ T12 Passed.');

  console.log('T12b: generateReport handles null/undefined input...');
  const nullReport = trackPurger.generateReport(null);
  assert.ok(nullReport.includes('No worktrees were processed'));
  const undefinedReport = trackPurger.generateReport(undefined);
  assert.ok(undefinedReport.includes('No worktrees were processed'));
  console.log('✅ T12b Passed.');

  console.log('T12c: generateReport shows dry-run skipped items correctly...');
  const dryResults = [
    { path: '/tmp/project-feature', branch: 'feature-x', success: true, skipped: true, error: null, reason: 'Dry-run: would remove this worktree' }
  ];
  const dryReport = trackPurger.generateReport(dryResults);
  assert.ok(dryReport.includes('⏭️ Skipped'), 'Should show skip status for dry-run');
  assert.ok(dryReport.includes('**Skipped:** 1'));
  assert.ok(dryReport.includes('**Removed:** 0'));
  console.log('✅ T12c Passed.');

  // ─── getMergedBranches() Tests ──────────────────────────

  console.log('\n--- getMergedBranches() ---');

  console.log('T-M1: getMergedBranches parses branch list correctly...');
  const branchExec = createMockExec({
    'branch --merged': '  feature-x\n* main\n  bugfix-y\n  develop\n'
  });
  const branchPurger = new WorktreePurge({ execFn: branchExec });
  const mergedResult = branchPurger.getMergedBranches();
  assert.ok(Array.isArray(mergedResult));
  assert.ok(mergedResult.includes('feature-x'));
  assert.ok(mergedResult.includes('bugfix-y'));
  assert.ok(mergedResult.includes('develop'));
  // Current branch (marked with *) should be excluded
  assert.ok(!mergedResult.includes('main'));
  assert.ok(!mergedResult.includes('* main'));
  console.log('✅ T-M1 Passed.');

  console.log('T-M2: getMergedBranches returns empty array on failure...');
  const failBranchExec = createMockExec({
    'branch --merged': new Error('fatal: not a git repository')
  });
  const failBranchPurger = new WorktreePurge({ execFn: failBranchExec });
  const failBranches = failBranchPurger.getMergedBranches();
  assert.deepEqual(failBranches, []);
  console.log('✅ T-M2 Passed.');

  // ─── Integration-style Tests ────────────────────────────

  console.log('\n--- Integration Tests ---');

  console.log('T-I1: Full pipeline: list → identify → purge (dry-run) → report...');
  const integrationExec = createMockExec({
    'worktree list': SAMPLE_PORCELAIN,
    'branch --merged': '  feature-x\n* main\n'
  });
  const intPurger = new WorktreePurge({ execFn: integrationExec });

  // Step 1: List
  const intWorktrees = intPurger.listWorktrees();
  assert.equal(intWorktrees.length, 3);

  // Step 2: Get merged branches
  const intMerged = intPurger.getMergedBranches();
  assert.ok(intMerged.includes('feature-x'));

  // Step 3: Identify stale
  const intStale = intPurger.identifyStale(intWorktrees, intMerged);
  assert.equal(intStale.length, 1);
  assert.equal(shortBranchName(intStale[0].branch), 'feature-x');

  // Step 4: Purge (dry-run)
  const intResults = intPurger.purgeAll(intStale, { dryRun: true });
  assert.equal(intResults.length, 1);
  assert.equal(intResults[0].success, true);
  assert.equal(intResults[0].skipped, true);

  // Step 5: Generate report
  const intReport = intPurger.generateReport(intResults);
  assert.ok(intReport.includes('Git Worktree Cleanup Report'));
  assert.ok(intReport.includes('feature-x'));
  assert.ok(intReport.includes('⏭️ Skipped'));
  console.log('✅ T-I1 Passed.');

  console.log('T-I2: Constructor defaults work correctly...');
  const defaultPurger = new WorktreePurge();
  assert.equal(defaultPurger.cwd, process.cwd());
  assert.equal(typeof defaultPurger.execFn, 'function');
  assert.deepEqual(defaultPurger.getLastResults(), []);
  console.log('✅ T-I2 Passed.');

  console.log('\n🎉 ALL WORKTREE PURGE TESTS PASSED SUCCESSFULLY! 🎉');
}

// ─── Run ────────────────────────────────────────────────────────────────────

try {
  runTests();
  process.exit(0);
} catch (error) {
  console.error('\n❌ TEST RUN FAILED:', error.message);
  console.error(error.stack);
  process.exit(1);
}
