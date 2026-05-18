#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const args = process.argv.slice(2);
const force = args.includes('--force');
const trialId = args.filter(a => a !== '--force')[0];

if (!trialId) {
    console.error('Usage: node rollback-trial.js <TRIAL_ID> [--force]');
    process.exit(1);
}

const AGENT_DIR = path.join(__dirname, '..');
const TRIALS_DIR = path.join(AGENT_DIR, 'evolution-lab', 'trials');
const BACKUPS_DIR = path.join(AGENT_DIR, 'evolution-lab', 'backups');

function isPathInside(child, parent) {
    const relative = path.relative(parent, child);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

const manifestPath = path.join(TRIALS_DIR, `trial-manifest-${trialId}.yaml`);

if (!fs.existsSync(manifestPath)) {
    console.error(`Error: Manifest not found for trial ${trialId} at ${manifestPath}`);
    process.exit(1);
}

const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
let manifest;
try {
    manifest = yaml.parse(manifestContent);
} catch (e) {
    console.error(`Error parsing YAML manifest: ${e.message}`);
    process.exit(1);
}

const fixtureName = manifest.fixture;

if (typeof fixtureName !== 'string' || fixtureName.includes('/') || fixtureName.includes('\\') || fixtureName.includes('..')) {
    console.error(`Security Error: Fixture name '${fixtureName}' contains invalid path characters.`);
    process.exit(1);
}

const possibleCanonicalPaths = [
    path.join(AGENT_DIR, 'skills', fixtureName, 'SKILL.md'),
    path.join(AGENT_DIR, 'workflows', `${fixtureName}.md`),
    path.join(AGENT_DIR, 'workflows', `iwish-${fixtureName}.md`),
    path.join(AGENT_DIR, 'workflows', `iwish-agent-bmm-${fixtureName}.md`),
    path.join(AGENT_DIR, 'agents', `${fixtureName}.md`),
    path.join(AGENT_DIR, 'agents', `iwish-agent-bmm-${fixtureName}.md`),
    path.join(AGENT_DIR, 'fragments', `${fixtureName}.md`)
];

let canonicalPath = null;
for (const p of possibleCanonicalPaths) {
    if (fs.existsSync(p)) {
        canonicalPath = p;
        break;
    }
}

if (!canonicalPath) {
    console.error(`Error: Could not determine canonical path for fixture '${fixtureName}'.`);
    process.exit(1);
}

if (!isPathInside(path.resolve(canonicalPath), path.resolve(AGENT_DIR))) {
    console.error(`Security Error: Canonical path ${canonicalPath} resolves outside of Agent directory.`);
    process.exit(1);
}

const originalName = path.basename(canonicalPath);
const backupPath = path.join(BACKUPS_DIR, `${trialId}-${originalName}.bak`);

if (!fs.existsSync(backupPath)) {
    console.error(`Error: Backup file not found for rollback at ${backupPath}`);
    process.exit(1);
}

// Check mtime
if (fs.existsSync(canonicalPath)) {
    const canonicalStat = fs.statSync(canonicalPath);
    const backupStat = fs.statSync(backupPath);
    
    // Allow a small margin (1000ms)
    if (canonicalStat.mtimeMs > backupStat.mtimeMs + 1000 && !force) {
        console.error(`Warning: The canonical file has been modified since it was backed up!`);
        console.error(`Run with --force to overwrite these newer changes.`);
        process.exit(1);
    }
}

// Restore canonical from backup
fs.copyFileSync(backupPath, canonicalPath);
console.log(`[Rollback] Successfully restored canonical file from backup.`);
console.log(`[Lineage] Restored to: ${canonicalPath}`);
