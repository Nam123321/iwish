import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

const reportPath = path.join(process.cwd(), 'fake-stories-audit-report.md');
const reportContent = fs.readFileSync(reportPath, 'utf8');

// Parse report to get FAKE stories
const fakeStories = [];
const lines = reportContent.split('\n');
for (const line of lines) {
  if (line.includes('🔴 FAKE')) {
    const match = line.match(/\|\s*\*\*([\d.]+)\*\*/);
    if (match) {
      fakeStories.push(match[1]);
    }
  }
}

console.log(`Found ${fakeStories.length} FAKE stories in report.`);

const searchDir = path.join(process.cwd(), '_iwish-output');

function findStoryFile(id: string): string | null {
  const possiblePaths = [];
  
  function scan(dir: string) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (file === 'story.md' || file === `story-${id}.md`) {
        if (fullPath.includes(`Story-${id}/`) || fullPath.includes(`story-${id}.md`)) {
          possiblePaths.push(fullPath);
        }
      }
    }
  }
  
  scan(searchDir);
  return possiblePaths.length > 0 ? possiblePaths[0] : null;
}

const dateStr = new Date().toISOString().split('T')[0];
const changelogEntry = {
  date: dateStr,
  description: "Automated reset to 'refactored' because the codebase was missing (True Negative FAKE in Audit Report)."
};

let updatedCount = 0;

for (const id of fakeStories) {
  const storyPath = findStoryFile(id);
  if (!storyPath) {
    console.error(`Could not find story.md for Story ${id}`);
    continue;
  }
  
  let content = fs.readFileSync(storyPath, 'utf8');
  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (yamlMatch) {
    const frontmatterStr = yamlMatch[1];
    let parsed: any;
    try {
      parsed = yaml.parse(frontmatterStr);
    } catch (e) {
      console.error(`Failed to parse YAML for ${id}: ${e}`);
      continue;
    }
    
    parsed.status = 'refactored';
    
    if (!parsed.changelog) {
      parsed.changelog = [];
    } else if (!Array.isArray(parsed.changelog)) {
      parsed.changelog = [parsed.changelog];
    }
    
    parsed.changelog.push(changelogEntry);
    
    const newYaml = yaml.stringify(parsed);
    const newContent = content.replace(/^---\n[\s\S]*?\n---/, `---\n${newYaml}---`);
    
    fs.writeFileSync(storyPath, newContent, 'utf8');
    updatedCount++;
    console.log(`Updated Story ${id}`);
  } else {
    console.error(`No YAML frontmatter found in ${storyPath}`);
  }
}

console.log(`\nSuccessfully updated ${updatedCount} out of ${fakeStories.length} FAKE stories.`);
