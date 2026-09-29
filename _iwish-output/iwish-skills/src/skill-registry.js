const fs = require('fs');
const path = require('path');
const { validateFrontmatter, validatePaths, parseFrontmatterYaml } = require('./skill-linter');

/**
 * Registers a new skill into the skill-graph.yaml registry after running validation checks.
 * If validation fails, deletes the draft folder to maintain workspace cleanliness.
 * 
 * @param {string} draftPath - Path to the draft skill folder
 * @param {string} allowedRoot - Permitted sandbox root path
 * @param {string} registryPath - Path to the skill-graph.yaml file
 * @returns {Object} Result of the registration { success: boolean, errors: Array<string> }
 */
function registerSkill(draftPath, allowedRoot, registryPath) {
  const errors = [];

  // 1. Verify draft contains SKILL.md
  const skillFile = path.join(draftPath, 'SKILL.md');
  if (!fs.existsSync(draftPath) || !fs.existsSync(skillFile)) {
    return {
      success: false,
      errors: [`Draft folder is missing required 'SKILL.md' file at: ${skillFile}`]
    };
  }

  // 2. Read content and run linter checks
  let fileContent;
  try {
    fileContent = fs.readFileSync(skillFile, 'utf8');
  } catch (err) {
    return {
      success: false,
      errors: [`Failed to read SKILL.md: ${err.message}`]
    };
  }

  // Frontmatter check
  const fmRes = validateFrontmatter(fileContent);
  if (!fmRes.valid) {
    errors.push(...fmRes.errors);
  }

  // Paths and Symlink traversal check
  const pathRes = validatePaths(draftPath, allowedRoot);
  if (!pathRes.valid) {
    errors.push(...pathRes.errors);
  }

  // 3. Rollback on failure
  if (errors.length > 0) {
    if (fs.existsSync(draftPath)) {
      try {
        fs.rmSync(draftPath, { recursive: true, force: true });
      } catch (rmErr) {
        console.error(`Registry rollback: failed to delete draft directory ${draftPath}: ${rmErr.message}`);
      }
    }
    return {
      success: false,
      errors: errors
    };
  }

  // 4. Extract metadata to register
  const parts = fileContent.split('---');
  const frontmatterContent = parts[1];
  const metadata = parseFrontmatterYaml(frontmatterContent);
  const skillName = metadata.name;
  const skillDescription = metadata.description;

  // Calculate path relative to allowedRoot for registry portability
  const relativeSkillPath = path.relative(allowedRoot, draftPath);

  // 5. Update skill-graph.yaml
  try {
    let registryContent = '';
    let registryData = { skills: [] };

    if (fs.existsSync(registryPath)) {
      registryContent = fs.readFileSync(registryPath, 'utf8');
      // Simple custom parser for skill-graph.yaml list to keep zero dependencies
      const lines = registryContent.split('\n');
      let currentSkill = null;
      for (const line of lines) {
        if (line.trim().startsWith('-')) {
          if (currentSkill) registryData.skills.push(currentSkill);
          currentSkill = {};
        }
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1 && currentSkill) {
          const key = line.slice(0, colonIndex).trim().replace(/^-/, '').trim();
          const val = line.slice(colonIndex + 1).trim().replace(/^['"]|['"]$/g, '');
          currentSkill[key] = val;
        }
      }
      if (currentSkill) {
        registryData.skills.push(currentSkill);
      }
    }

    // Check if skill already registered
    const exists = registryData.skills.some(s => s.name === skillName);
    if (!exists) {
      registryData.skills.push({
        name: skillName,
        path: relativeSkillPath,
        description: skillDescription
      });
    }

    // Serialize back to YAML
    let outputYaml = 'skills:\n';
    for (const s of registryData.skills) {
      outputYaml += `  - name: "${s.name}"\n`;
      outputYaml += `    path: "${s.path}"\n`;
      outputYaml += `    description: "${s.description}"\n`;
    }

    // Create registry directory if needed
    const regDir = path.dirname(registryPath);
    if (!fs.existsSync(regDir)) {
      fs.mkdirSync(regDir, { recursive: true });
    }

    fs.writeFileSync(registryPath, outputYaml, 'utf8');

    return {
      success: true,
      errors: []
    };
  } catch (err) {
    // Rollback draft directory on write error
    if (fs.existsSync(draftPath)) {
      try {
        fs.rmSync(draftPath, { recursive: true, force: true });
      } catch (rmErr) {
        // Log error
      }
    }
    return {
      success: false,
      errors: [`Failed to write to skill-graph.yaml: ${err.message}`]
    };
  }
}

module.exports = {
  registerSkill
};
