require('./watchmen_core.js').verify_execution(__filename);
#!/usr/bin/env node
const fs = require("fs");
const { execSync } = require("child_process");
const args = process.argv.slice(2);
const componentName = args[args.indexOf("--component") + 1];
if (!componentName) process.exit(1);
console.log(`[Validator] Checking artifact eligibility for ${componentName}...`);
try {
    const htmlFind = execSync(`find . -type f -name "*${componentName}*.html" | head -n 1`).toString().trim();
    const mdFind = execSync(`find . -type f -name "*${componentName}*.md" | head -n 1`).toString().trim();
    if (!htmlFind || !mdFind) {
        console.error(`[Validator] FAIL: Missing HTML or UX Pattern MD for ${componentName}.`);
        process.exit(1);
    }
    console.log(`[Validator] SUCCESS: Artifacts found.`);
    process.exit(0);
} catch (e) { process.exit(1); }
