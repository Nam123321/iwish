import * as fs from 'fs-extra';
import * as path from 'path';

const SRC_DIR = path.join(__dirname, '../../');
const DEST_DIR = path.join(__dirname, '../templates');

const NAME_MAP = [
  { old: 'bmad-master', new: 'Grand-Priest' },
  { old: 'pm', new: 'King-Kai' },
  { old: 'analyst', new: 'Bulma' },
  { old: 'architect', new: 'Piccolo' },
  { old: 'dev', new: 'Vegeta' },
  { old: 'qa', new: 'Tien-Shinhan' },
  { old: 'sm', new: 'Trunks' },
  { old: 'tech-writer', new: 'Master-Roshi' },
  { old: 'ux-designer', new: 'Android-18' },
  { old: 'data-architect', new: 'Shenron' },
  { old: 'creative-intelligence', new: 'Gotenks' },
  { old: 'edge-case-guardian', new: 'Hit' },
  { old: 'mkt-content-creator', new: 'Hercule' },
  { old: 'mkt-ops-executor', new: 'Majin-Buu' }
];

const PACKS = {
  'songoku': 'library/ai-pack',
  'songoku-ai-review': 'library/ai-pack',
  'songoku-ai-spec': 'library/ai-pack',
  'songoku-cost-audit': 'library/ai-pack',
  'songoku-eval': 'library/ai-pack',
  'ai-cost-optimizer': 'library/ai-pack',
  'mkt-execute': 'library/marketing-pack',
  'mkt-sync': 'library/marketing-pack',
  'stitch-first-dev': 'library/frontend-pack',
  'stitch-to-code': 'library/frontend-pack',
  'browser-visual-verification': 'library/frontend-pack',
  'ui-ux-pro-max': 'library/frontend-pack',
  'page-agent-qa': 'library/frontend-pack',
  'validate-schema': 'library/backend-pack',
  'seed-data-audit': 'library/backend-pack',
  'data-integrity-guardian': 'library/backend-pack',
  'api-contract-guardian': 'library/backend-pack',
  'optimize-docker': 'library/devops-pack',
  'optimize-all-docker': 'library/devops-pack',
  'docker-optimizer-slim': 'library/devops-pack',
  'prompt-engineering-guardian': 'library/prompt-engineering-pack'
};

function processContent(content: string): string {
  let newContent = content;
  for (const { old, new: replacement } of NAME_MAP) {
    const regex = new RegExp(`\\b${old}\\b`, 'gi');
    newContent = newContent.replace(regex, replacement);
  }
  return newContent;
}

async function scanAndCopy(relPath: string) {
  const fullPath = path.join(SRC_DIR, relPath);
  if (!fs.existsSync(fullPath)) return;
  
  const files = await fs.readdir(fullPath, { withFileTypes: true });
  for (const file of files) {
    const srcFile = path.join(fullPath, file.name);
    if (file.isDirectory() && file.name !== '.DS_Store') {
      await scanAndCopy(path.join(relPath, file.name));
    } else if (file.isFile() && (file.name.endsWith('.md') || file.name.endsWith('.xml') || file.name.endsWith('.yaml'))) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      
      // Determine destination
      let targetFolder = 'core';
      let targetName = file.name;
      
      // Check if it belongs to a library pack
      for (const [key, pack] of Object.entries(PACKS)) {
        if (nameWithoutExt.includes(key) || relPath.includes(key)) {
          targetFolder = pack;
          break;
        }
      }
      
      // Also apply name replacement to the filename itself
      for (const { old, new: replacement } of NAME_MAP) {
        if (targetName.includes(old)) {
          targetName = targetName.replace(old, replacement.toLowerCase());
        }
      }

      // Preserve agent/workflow subdirs
      const subType = relPath.includes('agents') ? 'agents' : (relPath.includes('workflows') ? 'workflows' : (relPath.includes('skills') ? 'skills' : 'misc'));
      const destPath = path.join(DEST_DIR, targetFolder, subType, targetName);
      
      await fs.ensureDir(path.dirname(destPath));
      
      const content = await fs.readFile(srcFile, 'utf-8');
      const processed = processContent(content);
      await fs.writeFile(destPath, processed);
      console.log(`Copied & Mapped: ${file.name} -> ${destPath.replace(DEST_DIR, '')}`);
    }
  }
}

async function main() {
  await fs.ensureDir(DEST_DIR);
  console.log('Migrating agents...');
  await scanAndCopy('_bmad/bmm/agents');
  await scanAndCopy('_bmad/core/agents');
  
  console.log('Migrating workflows...');
  await scanAndCopy('_bmad/bmm/workflows');
  await scanAndCopy('.agent/workflows');
  
  console.log('Migrating skills...');
  await scanAndCopy('.agent/skills');
  
  console.log('Migration complete!');
}

main().catch(console.error);
