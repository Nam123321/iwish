const { existsSync, accessSync, constants } = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const gitDir = path.join(repoRoot, '.git');

function canUseGitDir(dir) {
  try {
    if (!existsSync(dir)) {
      return false;
    }
    accessSync(dir, constants.R_OK | constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

if (!canUseGitDir(gitDir)) {
  console.log('[prepare-husky] Skipping husky install because .git is missing or not writable.');
  process.exit(0);
}

const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['husky'], {
  cwd: repoRoot,
  stdio: 'inherit',
});

process.exit(result.status || 0);
