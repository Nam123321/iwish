const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '../templates');

// Broken word replacements that need to be reversed inside file CONTENT
// These happen when short agent names (pm, sm, dev, qa) match parts of English words
const CONTENT_FIXES = [
  // 'architect' -> 'piccolo' replacements inside words
  { broken: /\bpiccoloure\b/gi, fixed: 'architecture' },
  { broken: /\bpiccoloural\b/gi, fixed: 'architectural' },
  { broken: /\bPiccoloure\b/g, fixed: 'Architecture' },
  { broken: /\bPiccoloural\b/g, fixed: 'Architectural' },
  // 'sm' -> 'Trunks' inside words
  { broken: /asseTrunksent/gi, fixed: 'assessment' },
  { broken: /assesstrunksent/gi, fixed: 'assessment' },
  { broken: /Trunksart\b/gi, fixed: 'smart' },
  { broken: /trunksart\b/gi, fixed: 'smart' },
  { broken: /Trunksall\b/gi, fixed: 'small' },
  { broken: /trunksall\b/gi, fixed: 'small' },
  { broken: /Trunksmith\b/gi, fixed: 'smith' },
  { broken: /trunksmith\b/gi, fixed: 'smith' },
  // 'dev' -> 'Vegeta' inside words
  { broken: /Vegetaelopment/gi, fixed: 'development' },
  { broken: /vegetaelopment/gi, fixed: 'development' },
  { broken: /Vegetaeloper/gi, fixed: 'developer' },
  { broken: /vegetaeloper/gi, fixed: 'developer' },
  { broken: /Vegetaelop\b/gi, fixed: 'develop' },
  { broken: /vegetaelop\b/gi, fixed: 'develop' },
  { broken: /Vegetaice\b/gi, fixed: 'device' },
  { broken: /vegetaice\b/gi, fixed: 'device' },
  { broken: /Vegetaiation\b/gi, fixed: 'deviation' },
  { broken: /vegetaiation\b/gi, fixed: 'deviation' },
  // 'qa' -> 'Tien-Shinhan' inside words (less common but check)
  { broken: /Tien-Shinhan\.md/gi, fixed: 'qa.md' }, // Only fix if it's a reference, not the agent itself
  // 'pm' -> 'King-Kai' inside words
  { broken: /King-Kaij/gi, fixed: 'pmj' }, // unlikely but safe
  // 'analyst' -> 'Bulma' (usually safe, 'analyst' is full word)
];

// Filename renames needed
const FILENAME_FIXES = [
  { from: 'bmad-bmm-create-piccoloure.md', to: 'bmad-bmm-create-architecture.md' },
  { from: 'bmad-bmm-quick-vegeta.md', to: 'bmad-bmm-quick-dev.md' },
  { from: 'bmad-bmm-tien-shinhan-automate.md', to: 'bmad-bmm-qa-automate.md' },
  { from: 'bmad-bmm-vegeta-story.md', to: 'bmad-bmm-dev-story.md' },
  { from: 'bmad-agent-bmm-bulma.md', to: 'bmad-agent-bmm-bulma.md' },  // this one is fine
  { from: 'bmad-agent-bmm-data-piccolo.md', to: 'bmad-agent-bmm-shenron.md' },
  { from: 'piccoloure-decision-template.md', to: 'architecture-decision-template.md' },
  { from: 'step-04-piccoloural-patterns.md', to: 'step-04-architectural-patterns.md' },
  { from: 'step-06-final-assestrunksent.md', to: 'step-06-final-assessment.md' },
  { from: 'step-v-10-trunksart-validation.md', to: 'step-v-10-smart-validation.md' },
  { from: 'stitch-first-vegeta.md', to: 'stitch-first-dev.md' },
];

function fixContent(content) {
  let fixed = content;
  for (const { broken, fixed: replacement } of CONTENT_FIXES) {
    fixed = fixed.replace(broken, replacement);
  }
  return fixed;
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.xml') || entry.name.endsWith('.yaml'))) {
      // Fix content
      const content = fs.readFileSync(fullPath, 'utf-8');
      const fixedContent = fixContent(content);
      if (content !== fixedContent) {
        fs.writeFileSync(fullPath, fixedContent);
        console.log(`  [CONTENT FIXED] ${fullPath.replace(TEMPLATES_DIR, '')}`);
      }
      
      // Fix filename
      for (const { from, to } of FILENAME_FIXES) {
        if (entry.name === from && from !== to) {
          const newPath = path.join(dir, to);
          fs.renameSync(fullPath, newPath);
          console.log(`  [RENAMED] ${from} -> ${to}`);
          break;
        }
      }
    }
  }
}

console.log('Fixing broken regex replacements...\n');
walkDir(TEMPLATES_DIR);
console.log('\nAll fixes applied!');
