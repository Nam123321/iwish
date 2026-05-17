const fs = require('fs');
const path = require('path');

// Load config
const CONFIG_PATH = path.join(__dirname, 'guardrail-config.json');
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

const MAGIC_NUMBER_REGEX = /: ([\d.]+(px|rem|em|%|vh|vw|pt))(?![^;]*var\(--)/g;
const IGNORE_DIRS = config.ignorePatterns;

let foundIssues = false;

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relativePath = path.relative(process.cwd(), fullPath);

    if (IGNORE_DIRS.some(p => relativePath === p || relativePath.startsWith(p + path.sep))) continue;

    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.css') || fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      let match;
      while ((match = MAGIC_NUMBER_REGEX.exec(content)) !== null) {
        // Skip common safe values like 0, 1px (thin border), 100%
        if (['0', '1px', '100%', '0%'].includes(match[1])) continue;

        if (!foundIssues) {
          console.error('\n🛡️  Magic Number Hunter: Found hardcoded CSS values! Please use Design Tokens.');
          foundIssues = true;
        }
        
        const lines = content.substring(0, match.index).split('\n');
        console.error(`  [ISSUE] ${relativePath}:${lines.length} -> Found "${match[1]}"`);
      }
    }
  }
}

console.log('🛡️  Magic Number Hunter scanning: ' + process.cwd());
walkDir(process.cwd());

if (foundIssues) {
  console.error('\n❌ Failed: Magic numbers detected. Use Stitch or your selected design system tokens.');
  if (config.magicNumbers.failOnIssue) {
    process.exit(1);
  }
} else {
  console.log('✅ No magic numbers detected.');
  process.exit(0);
}
