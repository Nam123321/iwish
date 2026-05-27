const fs = require('fs');
const path = require('path');

const AGENT_MAPPINGS = {
  'grand-priest': 'orch-agent',
  'whis': 'capability-agent',
  'vegeta': 'dev-agent',
  'piccolo': 'architect-agent',
  'android-18': 'ux-agent',
  'tien-shinhan': 'qa-agent',
  'hit': 'review-agent',
  'king-kai': 'pm-agent',
  'trunks': 'delivery-manager-agent',
  'bulma': 'analyst-agent',
  'shenron': 'data-architect-agent',
  'data-piccolo': 'data-architect-agent',
  'gotenks': 'creative-agent',
  'master-roshi': 'research-agent',
  'songoku': 'ai-engineer-agent',
  'cell': 'absorber-agent',
  'data-strategist': 'data-strategist-agent',
  'edge-guardian': 'edge-guardian-agent',
  'quick-flow-solo-vegeta': 'quick-flow-dev-agent',
  'hit-core': 'hit-core-agent'
};

const TEXT_REPLACEMENTS = [
  // Agents (handling both explicit names and tags)
  ...Object.entries(AGENT_MAPPINGS).flatMap(([oldName, newName]) => [
    { from: new RegExp(`\\b${oldName}\\b`, 'gi'), to: newName },
    { from: new RegExp(`@${oldName}\\b`, 'gi'), to: `@${newName}` },
  ]),
  // Prefixes inside texts
  { from: /\bbmad-bmm-/g, to: 'iwish-feature-' },
  { from: /\biwish-bmm-/g, to: 'iwish-feature-' },
  { from: /\bbmad-agent-bmm-/g, to: 'iwish-agent-feature-' },
  { from: /\biwish-agent-bmm-/g, to: 'iwish-agent-feature-' },
  // Standalone BMAD
  { from: /\bBMAD-DragonBall\b/g, to: 'I-Wish' },
  { from: /\bBMAD\b/g, to: 'I-Wish' },
  // File names inside markdown
  { from: /bmad-bmm-/g, to: 'iwish-feature-' },
  { from: /iwish-bmm-/g, to: 'iwish-feature-' }
];

function getNewFilename(oldName) {
  let newName = oldName;

  // Is it an agent file?
  const agentMatch = Object.keys(AGENT_MAPPINGS).find(key => newName.includes(key) && (newName.includes('agent') || newName.includes(key)));
  if (agentMatch) {
    // Standardize agent file names to `<role>-agent.md`
    const mapped = AGENT_MAPPINGS[agentMatch];
    return `${mapped}.md`;
  }

  // Not an agent, just apply prefix replacements
  newName = newName.replace(/^bmad-bmm-/, 'iwish-feature-');
  newName = newName.replace(/^iwish-bmm-/, 'iwish-feature-');
  newName = newName.replace(/^bmad-/, 'iwish-');
  // special case for scripts or other files
  newName = newName.replace(/bmm-/g, 'feature-');

  return newName;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.md') || file.endsWith('.ts') || file.endsWith('.sh') || file.endsWith('.yaml')) {
      // 1. Rename the file
      const newFileName = getNewFilename(file);
      let targetPath = path.join(dir, newFileName);
      
      let finalPath = fullPath;

      if (newFileName !== file) {
        if (fs.existsSync(targetPath)) {
          // If we are moving a 'bmad-' file to a target that already exists (which was probably from 'iwish-')
          // we should OVERWRITE the target, because the 'bmad-' one is the newer copy.
          if (file.startsWith('bmad')) {
            console.log(`Overwriting ${targetPath} with newer ${file}`);
            fs.renameSync(fullPath, targetPath);
            finalPath = targetPath;
          } else {
            // If the current file is not 'bmad' and target exists, it means we have a collision.
            // Let's delete the current one if the target exists and current is 'iwish-bmm'.
            console.log(`Deleting duplicate legacy file ${file}`);
            fs.unlinkSync(fullPath);
            continue; // Skip text replacement for deleted file
          }
        } else {
          console.log(`Renaming ${file} to ${newFileName}`);
          fs.renameSync(fullPath, targetPath);
          finalPath = targetPath;
        }
      }

      // 2. Text Replacement
      let content = fs.readFileSync(finalPath, 'utf8');
      let changed = false;

      // Special exemption for constants.ts and similar files where 'legacy-bmad' is used
      if (finalPath.endsWith('constants.ts') || finalPath.endsWith('runtime.ts') || finalPath.endsWith('routing.ts')) {
        // Skip some deep replacements if needed, but we'll try to just apply safely.
        // Actually, let's just do targeted replacements in code.
      }

      for (const rule of TEXT_REPLACEMENTS) {
        if (content.match(rule.from)) {
          content = content.replace(rule.from, rule.to);
          changed = true;
        }
      }
      
      // Fix double replacements like orch-agent-agent
      if (content.includes('-agent-agent')) {
        content = content.replace(/-agent-agent/g, '-agent');
        changed = true;
      }
      if (content.includes('I-Wish-I-Wish')) {
        content = content.replace(/I-Wish-I-Wish/g, 'I-Wish');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(finalPath, content, 'utf8');
        console.log(`Updated contents in ${finalPath}`);
      }
    }
  }
}

const targetDirs = [
  path.join(__dirname, '..', 'templates', 'core', 'workflows'),
  path.join(__dirname, '..', 'templates', 'core', 'skills'),
  path.join(__dirname, '..', '.agent', 'workflows'),
  path.join(__dirname, '..', '.agent', 'skills')
];

for (const dir of targetDirs) {
  if (fs.existsSync(dir)) {
    console.log(`Processing directory: ${dir}`);
    processDirectory(dir);
  } else {
    console.log(`Skipping ${dir}, does not exist.`);
  }
}
