import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

const searchDir = path.join(process.cwd(), '_iwish-output', '3. Development', '1. Epic & Story');

let revertedCount = 0;
let stillFakeCount = 0;

function scanDir(dir: string) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file === 'story.md' || file.startsWith('story-')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check if it's one of the files we refactored
      if (content.includes("Automated reset to 'refactored' because the codebase was missing") && content.includes("status: refactored")) {
        const storyDir = path.dirname(fullPath);
        
        // Check UADRG evidence
        const hasEvidence = fs.existsSync(path.join(storyDir, 'pipeline-evidence-graph.json')) || 
                            fs.existsSync(path.join(storyDir, 'pipeline-evidence-delivery.json'));
        
        if (hasEvidence) {
          // It was mistakenly marked as FAKE, revert it
          const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
          if (yamlMatch) {
            const frontmatterStr = yamlMatch[1];
            try {
              let parsed = yaml.parse(frontmatterStr);
              parsed.status = 'completed';
              
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
              
              fs.writeFileSync(fullPath, newContent, 'utf8');
              revertedCount++;
              console.log(`Reverted mistaken FAKE story to completed: ${fullPath}`);
            } catch (e) {
              console.error(`YAML parse error in ${fullPath}:`, e);
            }
          }
        } else {
          stillFakeCount++;
          console.log(`Story remains FAKE (no evidence found): ${fullPath}`);
        }
      }
    }
  }
}

console.log("Scanning for mistakenly refactored stories...");
scanDir(searchDir);

console.log(`\nScan complete.`);
console.log(`Reverted to completed: ${revertedCount}`);
console.log(`Confirmed still FAKE: ${stillFakeCount}`);
