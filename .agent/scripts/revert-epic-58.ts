import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

const epic58Stories = ['58.1', '58.3', '58.4', '58.5', '58.6', '58.7', '58.8', '58.9', '58.10'];

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

let updatedCount = 0;

for (const id of epic58Stories) {
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
    
    parsed.status = 'completed'; // Revert back to completed
    
    // Remove the changelog entry added by bulk script
    if (parsed.changelog && Array.isArray(parsed.changelog)) {
      parsed.changelog = parsed.changelog.filter((entry: any) => 
        !entry.description || !entry.description.includes("True Negative FAKE in Audit Report")
      );
      if (parsed.changelog.length === 0) {
        delete parsed.changelog;
      }
    }
    
    const newYaml = yaml.stringify(parsed);
    const newContent = content.replace(/^---\n[\s\S]*?\n---/, `---\n${newYaml}---`);
    
    fs.writeFileSync(storyPath, newContent, 'utf8');
    updatedCount++;
    console.log(`Reverted Story ${id} back to completed`);
  } else {
    console.error(`No YAML frontmatter found in ${storyPath}`);
  }
}

console.log(`\nSuccessfully reverted ${updatedCount} Epic 58 stories.`);
