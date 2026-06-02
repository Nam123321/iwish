const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Load config
const CONFIG_PATH = path.join(__dirname, 'guardrail-config.json');
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

const KG_PATH = path.join(process.cwd(), '.agent', 'knowledge-graph.yaml');
const TARGET_DIRS = config.registry.targetDirectories;
const IGNORE_PATTERNS = config.ignorePatterns;

function getRegisteredFiles() {
  try {
    const fileContents = fs.readFileSync(KG_PATH, 'utf8');
    const kg = yaml.parse(fileContents);
    const registered = new Set();
    
    if (kg && kg.nodes) {
      kg.nodes.forEach(node => {
        if (node.path) {
          let p = node.path;
          if (p.startsWith('/')) p = p.substring(1);
          const normalized = path.normalize(p);
          registered.add(normalized);
        }
      });
    }
    // console.log('Registered files count:', registered.size);
    return registered;
  } catch (e) {
    console.error('❌ Failed to read knowledge-graph.yaml:', e.message);
    process.exit(1);
  }
}

const registeredFiles = getRegisteredFiles();
const unregistered = [];

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relativePath = path.relative(process.cwd(), fullPath);

    if (IGNORE_PATTERNS.some(p => relativePath === p || relativePath.startsWith(p + path.sep))) continue;
    if (file === '.DS_Store' || file === 'Thumbs.db') continue;
    if (fs.statSync(fullPath).isDirectory()) {
      // Only descend into target directories or root
      if (dir === process.cwd()) {
        if (TARGET_DIRS.includes(file)) {
          walkDir(fullPath);
        }
      } else {
        walkDir(fullPath);
      }
    } else {
      // Check if file should be registered
      const isRootFile = dir === process.cwd() && config.registry.includeRootFiles;
      const isInTargetDir = TARGET_DIRS.some(td => relativePath.startsWith(td + path.sep));

      if (isRootFile || isInTargetDir) {
        if (!registeredFiles.has(relativePath)) {
          unregistered.push(relativePath);
        }
      }
    }
  }
}

console.log('🛡️  I-Wish Registry Hook: Checking for unregistered source files in core directories...');
walkDir(process.cwd());

if (unregistered.length > 0) {
  console.error('\n⚠️  Unregistered files found:');
  unregistered.forEach(file => console.error(`  [UNREGISTERED] ${file}`));
  console.error(`\n❌ Failed: Found ${unregistered.length} unregistered core files.`);
  console.error('Action: Please add these to .agent/knowledge-graph.yaml or update guardrail-config.json.');
  process.exit(1);
} else {
  console.log('✅ All core files are registered in the Knowledge Graph.');
  process.exit(0);
}
