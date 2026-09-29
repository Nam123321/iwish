import { execSync } from 'node:child_process';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

/**
 * Git Worktree Provisioner & SQLite Isolation Helper
 * Usage:
 *   node scripts/worktree-provisioner.js provision <storyId>
 *   node scripts/worktree-provisioner.js cleanup <storyId>
 */

function runCmd(cmd, cwd = process.cwd()) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8' }).trim();
  } catch (err) {
    throw new Error(`Failed to run command [${cmd}]: ${err.stderr || err.message}`);
  }
}

/**
 * Creates an isolated Git Worktree for a subagent story.
 *
 * @param {string} storyId - The identifier of the story (e.g., 'story-3.10')
 */
export function provision(storyId) {
  if (!storyId) {
    console.error('Error: storyId is required.');
    process.exit(1);
  }

  const cleanId = storyId.replace(/[^a-zA-Z0-9-_]/g, '');
  const branchName = `iwish-wt-${cleanId}`;
  const worktreePath = resolve(join('_iwish-output', 'worktrees', cleanId));

  console.log(`[WorktreeProvisioner] Provisioning environment for story: ${storyId}`);
  console.log(`  Path: ${worktreePath}`);
  console.log(`  Branch: ${branchName}`);

  // 1. Ensure worktrees parent directory exists
  const parentDir = join(process.cwd(), '_iwish-output', 'worktrees');
  if (!existsSync(parentDir)) {
    mkdirSync(parentDir, { recursive: true });
  }

  if (existsSync(worktreePath)) {
    console.log(`  ⚠️  Worktree path already exists. Attempting to clean up first...`);
    try {
      cleanup(storyId);
    } catch (err) {
      console.warn(`  Failed cleanup attempt: ${err.message}. Proceeding anyway.`);
    }
  }

  // 2. Add git worktree branching from current HEAD
  try {
    runCmd(`git worktree add -b ${branchName} "${worktreePath}"`);
    console.log(`  ✅ Git worktree added successfully.`);
  } catch (err) {
    // If the branch already exists, try adding without -b (checking out existing branch)
    if (err.message.includes('already exists')) {
      console.log(`  ⚠️  Branch ${branchName} already exists. checking out existing branch...`);
      runCmd(`git worktree add "${worktreePath}" ${branchName}`);
    } else {
      throw err;
    }
  }

  // 3. Write isolated SQLite .env file to the worktree
  const envPath = join(worktreePath, '.env');
  const sqliteDbPath = `file:./dev-test-${cleanId}.db`;
  const envContent = [
    `# Isolated environment for ${storyId}`,
    `DATABASE_URL="${sqliteDbPath}"`,
    `NODE_ENV="test"`,
    `PORT=0`, // dynamic random port assignment
  ].join('\n');

  try {
    writeFileSync(envPath, envContent, 'utf8');
    console.log(`  ✅ Wrote isolated SQLite config to: ${envPath}`);
  } catch (err) {
    throw new Error(`Failed to write isolated env file: ${err.message}`);
  }

  // 4. Initialize Database schema inside the worktree
  // We check if prisma schema exists in the worktree
  const schemaPath = join(worktreePath, 'prisma', 'schema.prisma');
  if (existsSync(schemaPath)) {
    console.log(`  🔄 Initializing SQLite database schema...`);
    try {
      // Run prisma db push to sync schema to SQLite file
      // Use --accept-data-loss since it's a throwaway isolated test DB
      runCmd('npx prisma db push --accept-data-loss', worktreePath);
      console.log(`  ✅ SQLite test DB initialized at ${sqliteDbPath}`);
    } catch (err) {
      console.warn(`  ⚠️  Prisma db push failed: ${err.message}. Agent must run migration manually.`);
    }
  } else {
    console.log(`  ℹ️  No prisma schema found in worktree. Skipping DB initialization.`);
  }

  console.log(`[WorktreeProvisioner] Provisioning completed successfully. Environment is ready!`);
}

/**
 * Cleans up and removes an isolated Git Worktree for a subagent story.
 *
 * @param {string} storyId - The identifier of the story
 */
export function cleanup(storyId) {
  if (!storyId) {
    console.error('Error: storyId is required.');
    process.exit(1);
  }

  const cleanId = storyId.replace(/[^a-zA-Z0-9-_]/g, '');
  const branchName = `iwish-wt-${cleanId}`;
  const worktreePath = resolve(join('_iwish-output', 'worktrees', cleanId));

  console.log(`[WorktreeProvisioner] Cleaning up environment for story: ${storyId}`);

  // 1. Remove Git Worktree
  if (existsSync(worktreePath)) {
    try {
      runCmd(`git worktree remove --force "${worktreePath}"`);
      console.log(`  ✅ Removed git worktree directory.`);
    } catch (err) {
      console.warn(`  ⚠️  Failed to remove git worktree directory: ${err.message}`);
    }
  }

  // 2. Delete branch
  try {
    const branchExists = runCmd(`git branch --list ${branchName}`);
    if (branchExists) {
      runCmd(`git branch -D ${branchName}`);
      console.log(`  ✅ Deleted branch ${branchName}.`);
    } else {
      console.log(`  ℹ️  Branch ${branchName} does not exist. Skipping delete.`);
    }
  } catch (err) {
    console.warn(`  ⚠️  Failed to delete branch ${branchName}: ${err.message}`);
  }

  console.log(`[WorktreeProvisioner] Cleanup completed successfully.`);
}

// CLI handler
function main() {
  const args = process.argv.slice(2);
  const action = args[0];
  const storyId = args[1];

  if (!action || !storyId) {
    console.log(`
Git Worktree Provisioner
Usage:
  node scripts/worktree-provisioner.js provision <storyId>
  node scripts/worktree-provisioner.js cleanup <storyId>
`);
    process.exit(0);
  }

  try {
    if (action === 'provision') {
      provision(storyId);
    } else if (action === 'cleanup') {
      cleanup(storyId);
    } else {
      console.error(`Unknown action: ${action}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ Operation failed: ${err.message}`);
    process.exit(1);
  }
}

// Check if run directly
const currentFileUrl = import.meta.url;
const executedFileUrl = process.argv[1]
  ? new URL(`file://${process.argv[1]}`).href
  : '';

if (currentFileUrl === executedFileUrl) {
  main();
}
