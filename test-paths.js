const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const dir = '_iwish/framework/workflows';
const files = [];

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.name === 'workflow.yaml') {
      const content = fs.readFileSync(fullPath, 'utf8');
      try {
        const doc = yaml.load(content);
        if (doc && doc.source_wrapper) {
           const p = doc.source_wrapper.replace('{project-root}/', '');
           if (!fs.existsSync(p)) {
              console.log('BROKEN PATH in', fullPath, '->', p);
           }
        }
      } catch(e){}
    }
  }
}
walk(dir);
