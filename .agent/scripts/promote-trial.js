#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const args = process.argv.slice(2);
const trialId = args[0];

if (!trialId) {
    console.error('Usage: node promote-trial.js <TRIAL_ID>');
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
const scorecardPath = path.join(TRIALS_DIR, `scorecard-${trialId}.md`);

if (!fs.existsSync(manifestPath)) {
    console.error(`Error: Manifest not found for trial ${trialId} at ${manifestPath}`);
    process.exit(1);
}
if (!fs.existsSync(scorecardPath)) {
    console.error(`Error: Scorecard not found for trial ${trialId} at ${scorecardPath}`);
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

const CONFIG_PATH = path.join(AGENT_DIR, 'evolution-lab-config.yaml');
let validStatuses = ['PENDING', 'REFINING', 'REJECTED', 'APPROVED'];

if (fs.existsSync(CONFIG_PATH)) {
    try {
        const configStr = fs.readFileSync(CONFIG_PATH, 'utf-8');
        const config = yaml.parse(configStr);
        if (config && config.trial_statuses && Array.isArray(config.trial_statuses)) {
            validStatuses = config.trial_statuses.map(s => s.toUpperCase());
        }
    } catch (e) {
        console.warn(`[Warning] Could not parse evolution-lab-config.yaml: ${e.message}`);
    }
}

const rawDecision = manifest.decision || 'UNKNOWN';
const decision = typeof rawDecision === 'string' ? rawDecision.trim().toUpperCase() : 'UNKNOWN';

if (!validStatuses.includes(decision)) {
    console.error(`Error: Invalid decision '${rawDecision}'. Valid statuses are: ${validStatuses.join(', ')}`);
    process.exit(1);
}

if (decision !== 'APPROVED') {
    console.error(`Promotion aborted: Trial decision is '${rawDecision}', expected 'APPROVED'.`);
    process.exit(1);
}

// Parse Scorecard to find the winner and check fatal degradations
const scorecardContent = fs.readFileSync(scorecardPath, 'utf-8');
const lines = scorecardContent.split('\n');
let parsingTable = false;
const engines = [];
for (const line of lines) {
    if (line.trim().startsWith('| Engine')) { parsingTable = true; continue; }
    if (parsingTable && line.trim().startsWith('|---')) { continue; }
    if (parsingTable && line.trim().startsWith('|')) {
        const parts = line.split('|').map(p => p.trim()).filter(Boolean);
        if (parts.length >= 6) {
            const engineName = parts[0].replace(/\*\*/g, '').trim();
            const score = parseInt(parts[1], 10);
            const fatal = parts[5].trim();
            engines.push({ name: engineName, score, fatal });
        }
    }
}

if (engines.length === 0) {
    console.error(`Error: Could not parse evaluation results from scorecard.`);
    process.exit(1);
}

// Sort engines by score descending. If tie, prefer darwinian over bmad-native.
engines.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.name === 'darwinian') return 1;
    return -1;
});

const winner = engines[0];

const isFatal = winner.fatal && winner.fatal.toString().trim().toLowerCase() !== 'none' && winner.fatal.toString().trim() !== '0';
if (isFatal) {
    console.error(`Promotion aborted: Winning engine '${winner.name}' has fatal degradations: ${winner.fatal}`);
    process.exit(1);
}

const winnerCandidateInfo = manifest.candidates.find(c => c.source_engine === winner.name);
if (!winnerCandidateInfo) {
    console.error(`Error: Winning engine '${winner.name}' not found in manifest candidates.`);
    process.exit(1);
}

const actualCandidatePath = path.join(TRIALS_DIR, winnerCandidateInfo.path);

if (!fs.existsSync(actualCandidatePath)) {
    console.error(`Error: Winning candidate file not found at ${actualCandidatePath}`);
    process.exit(1);
}

const fixtureName = manifest.fixture;

if (typeof fixtureName !== 'string' || fixtureName.includes('/') || fixtureName.includes('\\') || fixtureName.includes('..')) {
    console.error(`Security Error: Fixture name '${fixtureName}' contains invalid path characters.`);
    process.exit(1);
}

if (!isPathInside(path.resolve(actualCandidatePath), path.resolve(TRIALS_DIR))) {
    console.error(`Security Error: Candidate path ${actualCandidatePath} resolves outside of Trials directory.`);
    process.exit(1);
}

const possibleCanonicalPaths = [
    path.join(AGENT_DIR, 'skills', fixtureName, 'SKILL.md'),
    path.join(AGENT_DIR, 'workflows', `${fixtureName}.md`),
    path.join(AGENT_DIR, 'workflows', `bmad-${fixtureName}.md`),
    path.join(AGENT_DIR, 'workflows', `bmad-agent-bmm-${fixtureName}.md`),
    path.join(AGENT_DIR, 'agents', `${fixtureName}.md`),
    path.join(AGENT_DIR, 'agents', `bmad-agent-bmm-${fixtureName}.md`),
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

// Backup canonical
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

const originalName = path.basename(canonicalPath);
const backupPath = path.join(BACKUPS_DIR, `${trialId}-${originalName}.bak`);

fs.copyFileSync(canonicalPath, backupPath);
console.log(`[Backup] Canonical file backed up to ${backupPath}`);

// Overwrite canonical
const newContent = fs.readFileSync(actualCandidatePath, 'utf-8');
fs.writeFileSync(canonicalPath, newContent);
console.log(`[Promotion] Successfully promoted candidate from engine '${winner.name}' to ${canonicalPath}`);
console.log(`[Lineage] Source: ${actualCandidatePath}`);
