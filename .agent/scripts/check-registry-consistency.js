const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const directoriesToScan = [
  path.join(process.cwd(), '.agent', 'agents'),
  path.join(process.cwd(), '.agent', 'workflows'),
  path.join(process.cwd(), '.agent', 'skills'),
  path.join(process.cwd(), '_iwish')
];

let hasErrors = false;

function getAllFiles(dirPath, arrayOfFiles) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, file));
    }
  });

  return arrayOfFiles;
}

const allFiles = [];
directoriesToScan.forEach(dir => {
  getAllFiles(dir, allFiles);
});

const textFiles = allFiles.filter(f => f.endsWith('.md') || f.endsWith('.yaml'));

const commandRegistry = new Map(); // name -> filePath

console.log('--- I-Wish Registry Consistency Check ---');

// Phase 1: Collect registered commands
textFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relativePath = path.relative(process.cwd(), file);
  
  if (file.endsWith('.md')) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      try {
        const doc = yaml.parse(frontmatterMatch[1]);
        if (doc && doc.name) {
          const cmdName = doc.name;
          if (commandRegistry.has(cmdName)) {
            console.error(`[ERROR] Duplicate command name '${cmdName}' found in:`);
            console.error(`  - ${commandRegistry.get(cmdName)}`);
            console.error(`  - ${relativePath}`);
            hasErrors = true;
          } else {
            commandRegistry.set(cmdName, relativePath);
          }
        }
      } catch (e) {
        // Ignore YAML parsing errors here as some frontmatters might not be strict YAML
      }
    }
  } else if (file.endsWith('.yaml')) {
      try {
        const doc = yaml.parse(content);
        if (doc && doc.name) {
          const cmdName = doc.name;
          if (commandRegistry.has(cmdName)) {
            console.error(`[ERROR] Duplicate command name '${cmdName}' found in:`);
            console.error(`  - ${commandRegistry.get(cmdName)}`);
            console.error(`  - ${relativePath}`);
            hasErrors = true;
          } else {
            commandRegistry.set(cmdName, relativePath);
          }
        }
      } catch (e) {
        // Ignore
      }
  }
});

console.log(`[OK] Found ${commandRegistry.size} unique commands registered.`);

// Phase 2: Check references
// Check for @[/commandName] style references in Markdown and YAML files
const commandRefRegex = /@\[\/([^\]]+)\]/g;
// Check for explicit path references like [link](path)
const fileRefRegex = /\]\(([^)]+)\)/g;

textFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relativePath = path.relative(process.cwd(), file);

  // Skip template references
  if (relativePath.includes('template') || relativePath.includes('instructions')) return;

  // Check command references
  let match;
  while ((match = commandRefRegex.exec(content)) !== null) {
    let cmdName = match[1];
    // Sometimes the reference might contain extra characters if poorly formatted, but we assume it's exact.
    if (!commandRegistry.has(cmdName)) {
      console.error(`[ERROR] Unknown command reference '@[/${cmdName}]' in ${relativePath}`);
      hasErrors = true;
    }
  }

  // Check explicit file references
  while ((match = fileRefRegex.exec(content)) !== null) {
    let referencedPath = match[1].trim();
    // Ignore external URLs
    if (referencedPath.startsWith('http://') || referencedPath.startsWith('https://') || referencedPath.startsWith('mailto:')) continue;
    
    // Ignore variables or placeholders in paths like @{project-root} or {planning_artifacts}
    if (referencedPath.includes('{') || referencedPath.includes('}')) continue;

    // Remove hash links if present
    if (referencedPath.includes('#')) {
      referencedPath = referencedPath.split('#')[0];
    }
    
    if (referencedPath === '') continue;

    // Resolve path
    let fullPath;
    if (referencedPath.startsWith('/')) {
        // Absolute paths are tricky. We assume they refer to the workspace root if it doesn't look like a real absolute path
        if (referencedPath.startsWith('/Users')) continue; // Ignore true system absolute paths for safety
        fullPath = path.join(process.cwd(), referencedPath);
    } else {
        fullPath = path.join(path.dirname(file), referencedPath);
    }

    if (!fs.existsSync(fullPath)) {
      console.error(`[ERROR] Broken file reference '${match[1]}' in ${relativePath}`);
      hasErrors = true;
    }
  }
});

if (hasErrors) {
  console.log('--- Result: [FAIL] Inconsistencies Found ---');
  process.exit(1);
} else {
  console.log('--- Result: [OK] Registry is Consistent ---');
  process.exit(0);
}
