#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ROOT_DIR = process.cwd();

// 1. Root-Aware Execution (AC1: checks .git, _iwish, or package.json)
function checkRoot() {
  const hasGit = fs.existsSync(path.join(ROOT_DIR, '.git'));
  const hasIwish = fs.existsSync(path.join(ROOT_DIR, '_iwish'));
  const hasPkg = fs.existsSync(path.join(ROOT_DIR, 'package.json'));
  if (!hasGit && !hasIwish && !hasPkg) {
    console.error('❌ Error: This script must be run from the project root (where .git, _iwish, or package.json is located).');
    process.exit(1);
  }
}

// 2. Provision User-Land
function provisionCustomDir() {
  const customDir = path.join(ROOT_DIR, '_iwish', 'custom');
  if (!fs.existsSync(customDir)) {
    fs.mkdirSync(customDir, { recursive: true });
    console.log('✅ Created _iwish/custom directory for user customizations.');
  }

  const sampleFile = path.join(customDir, 'example-override.yaml');
  if (!fs.existsSync(sampleFile)) {
    const sampleContent = `# Example YAML override
# This file demonstrates the Shadowing Mechanism.
# If a file in _iwish/custom/ has the same relative path as one in _iwish/framework/,
# the I-Wish runtime will prioritize this custom file over the framework default.
# Ensure your custom configurations maintain the same structure as the original.
`;
    fs.writeFileSync(sampleFile, sampleContent);
    console.log('✅ Created _iwish/custom/example-override.yaml');
  }
}

// 3. Pointer File Content (F1 fix: use relative path, not literal {project-root})
// (F2 fix: merged duplicate functions into one)
const getPointerFileContent = () => `You are operating within the I-Wish framework.

# CORE CONTEXT ANCHOR
To bootstrap and understand your workflow capabilities, you MUST read the core generic engine:
_iwish/core/tasks/workflow.xml

# SHADOWING MECHANISM
Before reading any configuration file from \`_iwish/framework/\`, you MUST always check if a file with the same relative path exists in \`_iwish/custom/\`. If it does, you MUST use the file in \`_iwish/custom/\` instead.
`;

// 4. Interactive Prompts
function promptIDE() {
  console.log('\n🌟 Welcome to the I-Wish Universal Agent Pack Installer 🌟\n');
  console.log('Which IDEs or AI Assistants do you use? (comma separated numbers)');
  console.log('1. Cursor (.cursorrules)');
  console.log('2. Windsurf (.windsurfrules)');
  console.log('3. VSCode + Cline / Roo Code (.clinerules)');
  console.log('4. GitHub Copilot (.github/copilot-instructions.md)');
  console.log('5. Claude Code (.claude)');
  console.log('6. Google Antigravity / Gemini (.gemini)');
  console.log('7. OpenCode (.opencode)');
  console.log('8. OpenAI Codex (AGENTS.md / .codex)');
  console.log('9. Generic CLI / Other (no specific pointer file needed)');
  
  rl.question('\nEnter your choices (e.g. 1,3,8): ', (answer) => {
    const choices = answer.split(',').map(s => s.trim()).filter(s => /^[1-9]$/.test(s));

    if (choices.length === 0) {
      console.error('❌ Invalid input. Please enter numbers from: 1 to 9 (comma-separated).');
      rl.close();
      process.exit(1);
    }

    const writePointer = (filename) => {
      try {
        const dir = path.dirname(filename);
        if (dir !== '.' && !fs.existsSync(path.join(ROOT_DIR, dir))) {
          fs.mkdirSync(path.join(ROOT_DIR, dir), { recursive: true });
        }
        fs.writeFileSync(path.join(ROOT_DIR, filename), getPointerFileContent());
        console.log(`✅ Generated ${filename}`);
      } catch (err) {
        console.error(`❌ Failed to write ${filename}: ${err.message}`);
        process.exit(1);
      }
    };

    if (choices.includes('1')) writePointer('.cursorrules');
    if (choices.includes('2')) writePointer('.windsurfrules');
    if (choices.includes('3')) writePointer('.clinerules');
    if (choices.includes('4')) writePointer('.github/copilot-instructions.md');
    if (choices.includes('5')) writePointer('.claude');
    if (choices.includes('6')) writePointer('.gemini');
    if (choices.includes('7')) writePointer('.opencode');
    if (choices.includes('8')) {
      writePointer('AGENTS.md');
      writePointer('.codex/rules');
    }
    if (choices.includes('9') && choices.length === 1) {
      console.log('✅ Proceeding with Generic CLI setup.');
    }

    console.log('\n📌 Important Git Policy:');
    console.log('If generated, please commit these pointer files (like .cursorrules, .clinerules, etc.) to version control.');
    console.log('These pointer files are canonical project configurations and ensure all agents and developers share the same context.');

    console.log('\n🎉 Installation complete! You are ready to use I-Wish.');
    rl.close();
  });
}

function run() {
  checkRoot();
  provisionCustomDir();
  promptIDE();
}

run();
