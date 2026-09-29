const fs = require('fs');
const path = require('path');
const { resolvePath } = require('./cache-initializer');

/**
 * Loads and reads the SKILL.md file of a reference skill from the global cache on-demand.
 * Includes strict input sanitization and path traversal detection.
 * 
 * @param {string} skillId - The alphanumeric ID of the skill to read
 * @param {Object} [options]
 * @param {string} [options.cacheDir] - Global cache directory (defaults to ~/.iwish/skills-reference)
 * @returns {string} The markdown content of the SKILL.md file
 */
function readReferenceSkill(skillId, options = {}) {
  // 1. Input Sanitization: Skill ID must be alphanumeric (including hyphens and underscores)
  if (!skillId || typeof skillId !== 'string') {
    throw new Error("Invalid skill ID: must be a non-empty string.");
  }
  
  const safeIdRegex = /^[a-zA-Z0-9_-]+$/;
  if (!safeIdRegex.test(skillId)) {
    throw new Error("Security Exception: Invalid skill ID format.");
  }

  const rawCacheDir = options.cacheDir || '~/.iwish/skills-reference';
  const resolvedCacheDir = resolvePath(rawCacheDir);
  const skillsRoot = path.join(resolvedCacheDir, 'skills');

  // 2. Build target path
  const targetSkillDir = path.join(skillsRoot, skillId);
  const targetFile = path.join(targetSkillDir, 'SKILL.md');

  // 3. Check existence of directory
  if (!fs.existsSync(targetSkillDir) || !fs.existsSync(targetFile)) {
    throw new Error(`Skill not found: '${skillId}'`);
  }

  // 4. Path Traversal Guard: Resolve real paths of both target file and skills root
  const realSkillsRoot = fs.realpathSync(skillsRoot);
  const realTargetFile = fs.realpathSync(targetFile);

  // Assert that the real path of the file resides strictly within the real skills root directory
  if (!realTargetFile.startsWith(realSkillsRoot)) {
    throw new Error("Security Exception: Path traversal attempt detected.");
  }

  // 5. Read and return the file content
  try {
    return fs.readFileSync(realTargetFile, 'utf8');
  } catch (err) {
    throw new Error(`Failed to read skill file: ${err.message}`);
  }
}

module.exports = {
  readReferenceSkill
};
