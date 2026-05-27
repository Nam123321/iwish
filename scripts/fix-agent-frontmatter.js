const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const AGENTS_DIR = path.join(__dirname, '../.agent/agents');

function fixAgentFiles() {
  if (!fs.existsSync(AGENTS_DIR)) {
    console.error(`Agents directory not found: ${AGENTS_DIR}`);
    return;
  }

  const files = fs.readdirSync(AGENTS_DIR).filter(file => file.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(AGENTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
      console.warn(`No frontmatter in ${file}`);
      continue;
    }

    const frontmatterText = match[1];
    let parsed;
    try {
      parsed = YAML.parse(frontmatterText);
    } catch (err) {
      console.error(`Failed to parse frontmatter in ${file}: ${err.message}`);
      continue;
    }

    if (!parsed) {
      console.warn(`Empty frontmatter in ${file}`);
      continue;
    }

    let modified = false;
    const requiredArrays = ['inputs', 'outputs', 'mcp_tools_required', 'subagent_triggers'];
    for (const field of requiredArrays) {
      if (parsed[field] === undefined) {
        parsed[field] = [];
        modified = true;
      }
    }

    if (modified) {
      // Re-serialize frontmatter
      const newFrontmatterText = YAML.stringify(parsed);
      const newContent = content.replace(/^---\n[\s\S]*?\n---/, `---\n${newFrontmatterText.trim()}\n---`);
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated frontmatter for ${file}`);
    } else {
      console.log(`No changes needed for ${file}`);
    }
  }
}

fixAgentFiles();
console.log('Done!');
