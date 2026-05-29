const fs = require('fs');
const path = require('path');

/**
 * Automates the Phase 7c Spec-Sync and Graph-Refresh process.
 * Usage: node auto-sync-sbrp.js <storyId> <bugId> <resolvedEdgeCaseText>
 */

const projectRoot = path.resolve(__dirname, '../../');
const storiesDir = path.join(projectRoot, '_iwish-output/stories');
const epicsFile = path.join(projectRoot, '_iwish-output/epics.md');

const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: node auto-sync-sbrp.js <storyId> <bugId> <resolvedEdgeCaseText>');
  process.exit(1);
}

const [storyId, bugId, edgeCaseText] = args;

// 1. Locate and update the story file
function syncStorySpec() {
  console.log(`Searching for story file for ID: ${storyId}...`);
  const files = fs.readdirSync(storiesDir);
  const targetFile = files.find(f => f.includes(`story-${storyId}`));
  
  if (!targetFile) {
    console.error(`⚠️ Story file story-${storyId}.md not found in ${storiesDir}`);
    return;
  }

  const filePath = path.join(storiesDir, targetFile);
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if edge case is already added
  if (content.includes(bugId)) {
    console.log(`ℹ️ Edge case for ${bugId} already exists in ${targetFile}`);
    return;
  }

  // Find the Acceptance Criteria section
  const acMatch = content.match(/(## 📝 2\. Acceptance Criteria \(AC\)|## Acceptance Criteria:)/);
  if (!acMatch) {
    console.error('⚠️ Could not find Acceptance Criteria section in story file.');
    return;
  }

  const insertionIndex = content.indexOf(acMatch[0]) + acMatch[0].length;
  const newAcLine = `\n- **[EDGE-CASE]** **Given** the system is in active state, **When** executing, **Then** it must handle: ${edgeCaseText} [${bugId}]`;
  
  content = content.slice(0, insertionIndex) + newAcLine + content.slice(insertionIndex);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Appended new AC to story file: ${targetFile}`);
}

// 2. Increment progress counts in epics.md
function syncEpics() {
  if (!fs.existsSync(epicsFile)) {
    console.error('⚠️ epics.md file not found.');
    return;
  }

  let content = fs.readFileSync(epicsFile, 'utf8');
  
  // Find story reference inside epics.md and annotate it
  const regex = new RegExp(`(### Story ${storyId}:[\\s\\S]*?Acceptance Criteria:[\\s\\S]*?)(---|\n\n##|\n\n###|$)`, 'i');
  const match = content.match(regex);
  
  if (match) {
    const section = match[1];
    if (section.includes(bugId)) {
      console.log(`ℹ️ Edge case for ${bugId} already synced in epics.md`);
      return;
    }
    
    // Append the edge case under the story's AC block in epics.md
    const targetText = '- [EDGE-CASE]';
    const lastAcIndex = section.lastIndexOf('- ');
    if (lastAcIndex !== -1) {
      const splitIndex = match.index + lastAcIndex;
      const endOfLineIndex = content.indexOf('\n', splitIndex);
      const newAcLine = `\n- **[EDGE-CASE]** ${edgeCaseText} [${bugId}]`;
      
      content = content.slice(0, endOfLineIndex) + newAcLine + content.slice(endOfLineIndex);
      fs.writeFileSync(epicsFile, content, 'utf8');
      console.log(`✅ Synced edge case to epics.md`);
    }
  } else {
    console.log(`⚠️ Story ${storyId} section not parsed cleanly in epics.md`);
  }
}

try {
  syncStorySpec();
  syncEpics();
  console.log('🎉 Auto-Sync completed successfully!');
} catch (err) {
  console.error('❌ Failed to run auto-sync:', err);
}
