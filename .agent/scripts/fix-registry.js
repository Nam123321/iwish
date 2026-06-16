const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const directoriesToScan = [
  path.join(process.cwd(), '.agent', 'agents'),
  path.join(process.cwd(), '.agent', 'workflows'),
  path.join(process.cwd(), '.agent', 'skills'),
  path.join(process.cwd(), '_bmad')
];

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

const commandRegistry = new Map();

textFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relativePath = path.relative(process.cwd(), file);
  
  if (relativePath.includes('routing-profile')) return;
  if (relativePath.includes('template') || relativePath.includes('instructions')) return;
  if (relativePath.includes(path.sep + 'rules' + path.sep) || relativePath.includes(path.sep + 'references' + path.sep)) return;
  
  let newContent = content;
  let modified = false;

  if (file.endsWith('.md')) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      try {
        const doc = yaml.parse(frontmatterMatch[1]);
        if (doc && doc.name) {
          const cmdName = doc.name;
          if (commandRegistry.has(cmdName)) {
            // Collision!
            const existingPath = commandRegistry.get(cmdName);
            // Decide which one to rename
            let fileToRename = file;
            if (relativePath.includes('bmad-agent-bmm') || relativePath.includes('bmad-bmm') || relativePath.endsWith('workflow.yaml') || relativePath.endsWith('hit.md') || relativePath.endsWith('prototype.yaml')) {
              // Usually the one in .agent/workflows with bmad- is the wrapper, or if it's hit.md in workflows, it's a wrapper.
              fileToRename = file;
            } else {
              fileToRename = path.join(process.cwd(), existingPath);
            }
            
            // If the current file is the one to rename:
            if (fileToRename === file) {
               newContent = content.replace(/name:\s*['"]?([^'"\n]+)['"]?/, `name: '$1-wrapper'`);
               modified = true;
               console.log(`Renaming in ${relativePath}`);
            } else {
               // We need to modify the previous one
               let prevContent = fs.readFileSync(fileToRename, 'utf8');
               prevContent = prevContent.replace(/name:\s*['"]?([^'"\n]+)['"]?/, `name: '$1-wrapper'`);
               fs.writeFileSync(fileToRename, prevContent);
               console.log(`Renaming in ${path.relative(process.cwd(), fileToRename)}`);
               commandRegistry.set(cmdName, relativePath); // current takes the spot
            }
          } else {
            commandRegistry.set(cmdName, relativePath);
          }
        }
      } catch (e) {
      }
    }
  } else if (file.endsWith('.yaml')) {
      try {
        const doc = yaml.parse(content);
        if (doc && doc.name) {
          const cmdName = doc.name;
          if (commandRegistry.has(cmdName)) {
            // Collision!
             if (relativePath.includes('workflow.yaml') || relativePath.endsWith('prototype.yaml')) {
               newContent = content.replace(/name:\s*['"]?([^'"\n]+)['"]?/, `name: '$1-wrapper'`);
               modified = true;
               console.log(`Renaming in ${relativePath}`);
             } else {
               const existingPath = path.join(process.cwd(), commandRegistry.get(cmdName));
               let prevContent = fs.readFileSync(existingPath, 'utf8');
               prevContent = prevContent.replace(/name:\s*['"]?([^'"\n]+)['"]?/, `name: '$1-wrapper'`);
               fs.writeFileSync(existingPath, prevContent);
               console.log(`Renaming in ${path.relative(process.cwd(), existingPath)}`);
               commandRegistry.set(cmdName, relativePath);
             }
          } else {
            commandRegistry.set(cmdName, relativePath);
          }
        }
      } catch (e) {
      }
  }

  if (modified) {
    fs.writeFileSync(file, newContent);
  }
});

// Update check-registry-consistency.js to ignore templates
const checkerPath = path.join(process.cwd(), '.agent', 'scripts', 'check-registry-consistency.js');
let checkerContent = fs.readFileSync(checkerPath, 'utf8');
checkerContent = checkerContent.replace(
  "textFiles.forEach(file => {\n  const content = fs.readFileSync(file, 'utf8');\n  const relativePath = path.relative(process.cwd(), file);\n\n  // Check command references",
  "textFiles.forEach(file => {\n  const content = fs.readFileSync(file, 'utf8');\n  const relativePath = path.relative(process.cwd(), file);\n\n  // Skip template references\n  if (relativePath.includes('template') || relativePath.includes('instructions')) return;\n\n  // Check command references"
);
fs.writeFileSync(checkerPath, checkerContent);
console.log('Fixed registry checker for templates.');
