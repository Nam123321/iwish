import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { provision, cleanup } from '../../../scripts/worktree-provisioner.js';

function runCmd(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (err) {
    return '';
  }
}

async function runTests() {
  console.log('=== Running Git Worktree Provisioner Tests ===\n');

  const testStoryId = 'story-test-provisioner-run';
  const cleanId = 'story-test-provisioner-run';
  const expectedPath = join('_iwish-output', 'worktrees', cleanId);
  const expectedBranch = `iwish-wt-${cleanId}`;

  // Ensure clean starting point
  try { cleanup(testStoryId); } catch {}

  // Test 1: Provisioning worktree
  console.log('Test 1: Provisioning a new worktree...');
  {
    provision(testStoryId);
    
    // Check if worktree directory exists
    if (!existsSync(expectedPath)) {
      throw new Error(`Test 1 Failed: Expected worktree directory at ${expectedPath}`);
    }

    // Check if branch was created
    const branches = runCmd('git branch');
    if (!branches.includes(expectedBranch)) {
      throw new Error(`Test 1 Failed: Expected branch ${expectedBranch} to be created`);
    }

    // Check if .env file exists and contains correct SQLite string
    const envPath = join(expectedPath, '.env');
    if (!existsSync(envPath)) {
      throw new Error(`Test 1 Failed: Expected .env file at ${envPath}`);
    }
    
    const envContent = readFileSync(envPath, 'utf8');
    if (!envContent.includes('DATABASE_URL="file:./dev-test-story-test-provisioner-run.db"')) {
      throw new Error(`Test 1 Failed: .env file does not contain correct SQLite DB URL`);
    }
    
    console.log('  Worktree and .env successfully verified.');
    console.log('✅ Test 1 Passed.');
  }

  // Test 2: Cleanup worktree
  console.log('Test 2: Cleaning up the provisioned worktree...');
  {
    cleanup(testStoryId);

    // Check if worktree directory is gone
    if (existsSync(expectedPath)) {
      throw new Error(`Test 2 Failed: Expected worktree directory to be removed at ${expectedPath}`);
    }

    // Check if branch is deleted
    const branches = runCmd('git branch');
    if (branches.includes(expectedBranch)) {
      throw new Error(`Test 2 Failed: Expected branch ${expectedBranch} to be deleted`);
    }

    console.log('✅ Test 2 Passed.');
  }

  console.log('\n🎉 ALL WORKTREE PROVISIONER TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch(err => {
  try { cleanup('story-test-provisioner-run'); } catch {}
  console.error('❌ Test execution failed:', err.message);
  process.exit(1);
});
