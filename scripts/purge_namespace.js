const fs = require('fs');
const path = require('path');

const targetDirs = ['.agent', '_iwish', '_iwish-output', 'scripts', 'src'];
const extensions = ['.md', '.yaml', '.yml', '.xml', '.ts', '.js', '.sh', '.json', '.html', '.py', '.jsonl'];

const replacements = [
    { from: /BMAD_HOME/g, to: 'IWISH_HOME' },
    { from: /bmad_home/g, to: 'iwish_home' },
    { from: /BMAD-DragonBall/g, to: 'I-Wish-DragonBall' },
    { from: /bmad-dragonball/g, to: 'iwish-dragonball' },
    { from: /_bmad-output/g, to: '_iwish-output' },
    { from: /_bmad/g, to: '_iwish' },
    { from: /bmad-/g, to: 'iwish-' },
    { from: /BMAD-/g, to: 'I-Wish-' },
    { from: /bmad/g, to: 'iwish' },
    { from: /BMAD/g, to: 'I-Wish' },
    { from: /Bmad/g, to: 'I-Wish' },
    { from: /BMad/g, to: 'I-Wish' }
];

function processFile(filePath) {
    if (filePath.includes('purge_namespace.js')) return; // skip self
    if (!extensions.includes(path.extname(filePath)) && !filePath.endsWith('.sh') && !filePath.includes('Dockerfile')) {
        return;
    }
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        for (const { from, to } of replacements) {
            newContent = newContent.replace(from, to);
        }
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    } catch (e) {
        console.error(`Error processing ${filePath}:`, e);
    }
}

function traverseDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === '__pycache__') continue;
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else {
            processFile(fullPath);
        }
    }
}

targetDirs.forEach(traverseDir);
console.log('Namespace purge completed.');
