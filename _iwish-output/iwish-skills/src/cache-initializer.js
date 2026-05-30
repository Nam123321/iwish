const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

/**
 * Resolves home directory shorthand (~) to absolute paths.
 * @param {string} filepath 
 * @returns {string}
 */
function resolvePath(filepath) {
  if (filepath.startsWith('~')) {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return path.resolve(filepath);
}

/**
 * Initializes the global I-Wish skills reference cache by shallow cloning the awesome-skills repository.
 * 
 * @param {Object} options
 * @param {string} [options.cacheDir] - Target cache directory (defaults to ~/.iwish/skills-reference)
 * @param {string} [options.repoUrl] - Git repository URL to clone
 * @returns {Object} Result of the initialization
 */
function initializeCache(options = {}) {
  const rawCacheDir = options.cacheDir || '~/.iwish/skills-reference';
  const repoUrl = options.repoUrl || 'https://github.com/sickn33/antigravity-awesome-skills';
  const targetDir = resolvePath(rawCacheDir);

  // If the directory already exists and contains a .git directory or skills directory, consider it initialized.
  if (fs.existsSync(targetDir)) {
    const gitDir = path.join(targetDir, '.git');
    const skillsDir = path.join(targetDir, 'skills');
    if (fs.existsSync(gitDir) && fs.existsSync(skillsDir)) {
      return {
        success: true,
        alreadyExists: true,
        path: targetDir
      };
    }
  }

  // Ensure parent directories exist
  const parentDir = path.dirname(targetDir);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  // If target directory exists but is dirty/empty/corrupted, delete it before clone
  if (fs.existsSync(targetDir)) {
    try {
      fs.rmSync(targetDir, { recursive: true, force: true });
    } catch (err) {
      throw new Error(`Failed to clean up pre-existing directory ${targetDir}: ${err.message}`);
    }
  }

  try {
    // Perform shallow clone
    // Using execSync since this is a utility run in-process and we need it completed synchronously before next steps.
    // Restricting command strings to prevent injection.
    const safeRepoUrl = repoUrl.replace(/[^a-zA-Z0-9.:/_-]/g, '');
    execSync(`git clone --depth 1 "${safeRepoUrl}" "${targetDir}"`, {
      stdio: ['ignore', 'ignore', 'pipe'] // pipe stderr to catch clean logs on error
    });

    // Integrity Check: Assert essential directories exist
    const skillsDir = path.join(targetDir, 'skills');
    if (!fs.existsSync(skillsDir)) {
      throw new Error("Cloned repository is missing the required 'skills/' directory.");
    }

    return {
      success: true,
      alreadyExists: false,
      path: targetDir
    };
  } catch (error) {
    // Rollback: delete the target directory if clone failed or validation failed
    if (fs.existsSync(targetDir)) {
      try {
        fs.rmSync(targetDir, { recursive: true, force: true });
      } catch (rmError) {
        // Log double failure but throw the original clone error
        console.error(`Rollback cleanup failed for ${targetDir}: ${rmError.message}`);
      }
    }
    throw new Error(`Cache initialization failed: ${error.message}`);
  }
}

module.exports = {
  initializeCache,
  resolvePath
};
