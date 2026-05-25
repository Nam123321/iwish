const fs = require('fs');
const path = require('path');

// Load config
const CONFIG_PATH = path.join(__dirname, 'guardrail-config.json');
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

// Hardcoded context patterns (statuses, UUIDs, sensitive keys)
const DATA_PATTERNS = [
  { name: 'UUID', regex: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi },
  { name: 'Hardcoded Status', regex: /status:\s*['"](active|pending|draft|approved|rejected)['"]/gi },
  { name: 'Sensitive Key', regex: /(api_key|secret|password|token)\s*[:=]\s*['"][^'"]{8,}['"]/gi }
];

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
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      DATA_PATTERNS.forEach(pattern => {
        let match;
        while ((match = pattern.regex.exec(content)) !== null) {
          // Allow some obvious false positives (like example types or common strings)
          if (match[0].includes('DEVICE_TYPE_UNSPECIFIED')) continue;

          if (!foundIssues) {
            console.error('\n🛡️  Context-Leak Detector: Found potential hardcoded data context!');
            foundIssues = true;
          }
          const lines = content.substring(0, match.index).split('\n');
          console.error(`  [LEAK] ${relativePath}:${lines.length} -> Found ${pattern.name}: "${match[0]}"`);
        }
      });
    }
  }
}

console.log('🛡️  Context-Leak Detector scanning: ' + process.cwd());
walkDir(process.cwd());

if (foundIssues) {
  console.error('\n❌ Failed: Potential context leaks detected. Move sensitive or dynamic data to environment variables or database.');
  if (config.contextLeak.failOnIssue) {
    process.exit(1);
  }
} else {
  console.log('✅ No significant context leaks detected.');
  process.exit(0);
}
