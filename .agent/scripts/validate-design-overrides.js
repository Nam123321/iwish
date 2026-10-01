require('./watchmen_core.js').verify_execution(__filename);
import fs from 'fs';
import path from 'path';

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
    } else if (args[i] === '--epic' && args[i + 1]) {
      params.epic = args[i + 1];
      i++;
    }
  }
  return params;
}

function stripNonAlphanumeric(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function main() {
  const params = parseArgs();
  if (!params.spec || !params.design || !params.epic) {
    console.error('Usage: node validate-design-overrides.js --spec <spec-path> --design <design-path> --epic <epic-id>');
    process.exit(1);
  }

  if (!fs.existsSync(params.design)) {
    console.error(`Error: Design file not found: ${params.design}`);
    process.exit(1);
  }

  if (!fs.existsSync(params.spec)) {
    console.error(`Error: Spec file not found: ${params.spec}`);
    process.exit(1);
  }

  const designContent = fs.readFileSync(params.design, 'utf8');
  const specContent = fs.readFileSync(params.spec, 'utf8');

  // Find Section 17
  const section17Regex = /## 17\. Dynamic Epic Overrides & Special Context Rules([\s\S]*)/;
  const section17Match = designContent.match(section17Regex);
  
  if (!section17Match) {
    console.log('✅ [Strict Gate Passed] Section 17 not found in DESIGN.md. Skipping override validation.');
    process.exit(0);
  }

  const section17Text = section17Match[1];
  
  // Find Epic block
  const epicRegex = new RegExp(`### Epic ${params.epic}(?:\\s*-.*?)?\\n([\\s\\S]*?)(?=\\n### Epic |\\n## |$)`);
  const epicMatch = section17Text.match(epicRegex);

  if (!epicMatch || !epicMatch[1].trim()) {
    console.log(`✅ [Strict Gate Passed] No dynamic overrides found for Epic ${params.epic}.`);
    process.exit(0);
  }

  const overrideText = epicMatch[1].trim();
  const strippedOverride = stripNonAlphanumeric(overrideText);
  const strippedSpec = stripNonAlphanumeric(specContent);

  console.log('═══════════════════════════════════════════════');
  console.log('  DYNAMIC EPIC OVERRIDES VALIDATION REPORT');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Target Spec:   ${path.basename(params.spec)}`);
  console.log(`  Design System: ${path.basename(params.design)}`);
  console.log(`  Epic ID:       ${params.epic}`);
  console.log('───────────────────────────────────────────────');

  if (strippedSpec.includes(strippedOverride)) {
    console.log('  ✅ Compliance check PASSED. Epic override verbatim text found in UI Spec.');
    console.log('═══════════════════════════════════════════════');
    process.exit(0);
  } else {
    console.log(`  🚫 Compliance check FAILED. Epic ${params.epic} has strict overrides in DESIGN.md that were not copied into the UI Spec verbatim.`);
    console.log('');
    console.log(`  REQUIRED TEXT TO BE COPIED (from DESIGN.md Section 17):`);
    console.log(`  --------------------------------------------------`);
    console.log(overrideText.split('\n').map(line => `  ${line}`).join('\n'));
    console.log(`  --------------------------------------------------`);
    console.log('  🚫 ACTION REQUIRED: The Agent MUST copy the exact text above into the UI Spec Draft to pass this hard gate.');
    console.log('═══════════════════════════════════════════════');
    process.exit(1);
  }
}

import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
