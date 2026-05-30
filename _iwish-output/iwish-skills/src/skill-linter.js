const fs = require('fs');
const path = require('path');

/**
 * Parses a simple YAML frontmatter block into a JavaScript object.
 * Avoids external dependencies by using a custom regex-based parser for typical frontmatter keys and arrays.
 * 
 * @param {string} yamlBlock 
 * @returns {Object} Parsed key-value pairs
 */
function parseFrontmatterYaml(yamlBlock) {
  const result = {};
  const lines = yamlBlock.split('\n');
  let currentKey = null;

  for (let line of lines) {
    // Clean comments and whitespace
    line = line.split('#')[0].trimEnd();
    if (!line.trim()) continue;

    // Check for list item
    if (line.trim().startsWith('-')) {
      if (currentKey && Array.isArray(result[currentKey])) {
        const val = line.trim().slice(1).trim().replace(/^['"]|['"]$/g, '');
        result[currentKey].push(val);
      }
      continue;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      const val = line.slice(colonIndex + 1).trim();

      // Check if value indicates start of array (like empty value or [ ... ])
      if (val === '' || val === '[]') {
        result[key] = [];
        currentKey = key;
      } else if (val.startsWith('[') && val.endsWith(']')) {
        result[key] = val.slice(1, -1).split(',').map(v => v.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
        currentKey = key;
      } else {
        // String value (strip outer quotes)
        result[key] = val.replace(/^['"]|['"]$/g, '');
        currentKey = key;
      }
    }
  }

  return result;
}

/**
 * Validates the file content of a SKILL.md file for frontmatter compliance.
 * 
 * @param {string} fileContent - The text contents of SKILL.md
 * @returns {Object} Validation result { valid: boolean, errors: Array<string> }
 */
function validateFrontmatter(fileContent) {
  const errors = [];
  
  if (!fileContent || typeof fileContent !== 'string') {
    return { valid: false, errors: ["SKILL.md file is empty or invalid."] };
  }

  const normalized = fileContent.replace(/\r\n/g, '\n');
  
  // Frontmatter must start at the very beginning of the file
  if (!normalized.startsWith('---')) {
    return { valid: false, errors: ["Missing opening YAML frontmatter boundary '---' at start of file."] };
  }

  const parts = normalized.split('---');
  // Expected structure: ['', frontmatterContent, markdownBody...]
  if (parts.length < 3) {
    return { valid: false, errors: ["Missing closing YAML frontmatter boundary '---'."] };
  }

  const frontmatterContent = parts[1];
  let metadata = {};
  
  try {
    metadata = parseFrontmatterYaml(frontmatterContent);
  } catch (err) {
    return { valid: false, errors: [`Failed to parse YAML frontmatter: ${err.message}`] };
  }

  const requiredFields = [
    { name: 'name', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'inputs', type: 'array' },
    { name: 'outputs', type: 'array' },
    { name: 'mcp_tools_required', type: 'array' },
    { name: 'subagent_triggers', type: 'array' }
  ];

  for (const field of requiredFields) {
    const val = metadata[field.name];
    if (val === undefined) {
      errors.push(`Missing required frontmatter field: '${field.name}'`);
      continue;
    }

    if (field.type === 'string') {
      if (typeof val !== 'string' || val.trim() === '') {
        errors.push(`Required field '${field.name}' must be a non-empty string.`);
      }
    } else if (field.type === 'array') {
      if (!Array.isArray(val)) {
        errors.push(`Required field '${field.name}' must be an array/list.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Recursively walks a directory and validates all target files and resolved symlinks.
 * Ensures no target resolves outside of the allowed root directory.
 * 
 * @param {string} dirPath - Directory to walk
 * @param {string} allowedRoot - Permitted root path (sandbox)
 * @param {Set<string>} [visited] - Tracks visited realpaths to prevent infinite symlink loops
 * @returns {Object} Validation result { valid: boolean, errors: Array<string> }
 */
function validatePaths(dirPath, allowedRoot, visited = new Set()) {
  const errors = [];
  
  if (!fs.existsSync(dirPath)) {
    return { valid: true, errors: [] }; // Nothing to validate
  }

  let realAllowedRoot;
  try {
    realAllowedRoot = fs.realpathSync(allowedRoot);
  } catch (err) {
    return { valid: false, errors: [`Failed to resolve allowed root path ${allowedRoot}: ${err.message}`] };
  }

  let files = [];
  try {
    files = fs.readdirSync(dirPath);
  } catch (err) {
    return { valid: false, errors: [`Failed to read directory ${dirPath}: ${err.message}`] };
  }

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    
    let realFilePath;
    try {
      // fs.realpathSync resolves all symlinks recursively
      realFilePath = fs.realpathSync(filePath);
    } catch (err) {
      // If we cannot resolve real path (e.g. broken symlink), flag as invalid
      errors.push(`Broken path or invalid link detected at ${filePath}: ${err.message}`);
      continue;
    }

    // Path traversal check
    if (!realFilePath.startsWith(realAllowedRoot)) {
      errors.push(`Security Exception: Path traversal attempt detected at ${filePath}. Resolves outside sandbox: ${realFilePath}`);
      continue;
    }

    // Avoid infinite recursion on cyclic symlinks
    if (visited.has(realFilePath)) {
      continue;
    }
    visited.add(realFilePath);

    // Recursively check directories
    let stat;
    try {
      stat = fs.statSync(realFilePath);
    } catch (err) {
      errors.push(`Failed to stat file at ${realFilePath}: ${err.message}`);
      continue;
    }

    if (stat.isDirectory()) {
      const subResult = validatePaths(realFilePath, allowedRoot, visited);
      if (!subResult.valid) {
        errors.push(...subResult.errors);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

module.exports = {
  validateFrontmatter,
  parseFrontmatterYaml,
  validatePaths
};
