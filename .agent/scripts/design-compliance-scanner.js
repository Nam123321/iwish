const fs = require('fs');
const path = require('path');

/**
 * Normalizes hex colors to 6-digit lowercase representation
 */
function normalizeHex(hex) {
  let clean = hex.replace('#', '').trim().toLowerCase();
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  return '#' + clean;
}

const ALWAYS_ALLOWED = new Set([
  '#ffffff', '#000000',
  '#fff', '#000',
]);

/**
 * Extracts all hex colors from a text content
 */
function extractHexColors(content) {
  const hexRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
  const matches = content.match(hexRegex) || [];
  return matches.map(normalizeHex);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--spec' && args[i + 1]) {
      params.spec = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === '--design' && args[i + 1]) {
      params.design = path.resolve(args[i + 1]);
      i++;
    }
  }
  return params;
}

function main() {
  const params = parseArgs();

  if (!params.spec || !params.design) {
    console.error('Usage: node design-compliance-scanner.js --spec <spec-path> --design <design-md-path>');
    process.exit(1);
  }

  if (!fs.existsSync(params.design)) {
    console.error(`Error: Design system file not found: ${params.design}`);
    process.exit(1);
  }

  if (!fs.existsSync(params.spec)) {
    console.error(`Error: Target spec file not found: ${params.spec}`);
    process.exit(1);
  }

  const designContent = fs.readFileSync(params.design, 'utf8');
  const specContent = fs.readFileSync(params.spec, 'utf8');

  // Extract allowed colors from DESIGN.md
  const allowedColorsList = extractHexColors(designContent);
  const allowedColors = new Set([...ALWAYS_ALLOWED, ...allowedColorsList]);

  // Extract used colors from the spec/mockup
  const specLines = specContent.split('\n');
  const violations = [];

  for (let i = 0; i < specLines.length; i++) {
    const line = specLines[i];
    const colorsInLine = extractHexColors(line);
    
    for (const color of colorsInLine) {
      if (!allowedColors.has(color)) {
        violations.push({
          line: i + 1,
          content: line.trim(),
          color: color
        });
      }
    }
  }

  console.log('═══════════════════════════════════════════════');
  console.log('  DESIGN COMPLIANCE SCAN REPORT');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Target Spec:   ${path.basename(params.spec)}`);
  console.log(`  Design System: ${path.basename(params.design)}`);
  console.log(`  Allowed Colors: ${Array.from(allowedColors).filter(c => !ALWAYS_ALLOWED.has(c)).join(', ')}`);
  console.log('───────────────────────────────────────────────');

  if (violations.length === 0) {
    console.log('  ✅ Compliance check PASSED. No unauthorized design tokens found.');
    console.log('═══════════════════════════════════════════════');
    process.exit(0);
  } else {
    console.log(`  🚫 Compliance check FAILED. Detected ${violations.length} design token violation(s):`);
    console.log('');
    for (const v of violations) {
      console.log(`  [Line ${v.line}] Color: ${v.color}`);
      console.log(`     Snippet: "${v.content}"`);
    }
    console.log('───────────────────────────────────────────────');
    console.log('  🚫 ACTION REQUIRED: Replace unauthorized colors with those in DESIGN.md.');
    console.log('═══════════════════════════════════════════════');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { normalizeHex, extractHexColors };
