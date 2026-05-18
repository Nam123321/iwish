#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ARGS = process.argv.slice(2);
const FIXTURE_NAME = ARGS[0];
const SKIP_DARWINIAN = ARGS.includes('--skip-darwinian');

if (!FIXTURE_NAME || FIXTURE_NAME === '--skip-darwinian') {
    console.error('Usage: node evolution-lab-runner.js <fixture-name> [--skip-darwinian]');
    process.exit(1);
}

const AGENT_DIR = path.join(__dirname, '..');
const FIXTURE_DIR = path.join(AGENT_DIR, 'evolution-lab', 'fixtures', FIXTURE_NAME);
const TRIALS_DIR = path.join(AGENT_DIR, 'evolution-lab', 'trials');
const CANDIDATES_DIR = path.join(TRIALS_DIR, 'candidates');

const CONFIG_PATH = path.join(AGENT_DIR, 'evolution-lab-config.yaml');

// Ensure directories exist
if (!fs.existsSync(TRIALS_DIR)) fs.mkdirSync(TRIALS_DIR, { recursive: true });
if (!fs.existsSync(CANDIDATES_DIR)) fs.mkdirSync(CANDIDATES_DIR, { recursive: true });

function loadConfig() {
    let dualRunEnabled = false;
    if (fs.existsSync(CONFIG_PATH)) {
        const configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
        if (configContent.includes('dual_run_enabled: true')) {
            dualRunEnabled = true;
        }
    }
    return dualRunEnabled;
}

function checkDarwinian() {
    try {
        execSync('command -v darwinian', { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false;
    }
}

function runDarwinian(baselinePath) {
    try {
        console.log(`[Engine] Running Darwinian Evolver CLI on ${path.basename(baselinePath)}...`);
        // Darwinian execution boundary
        const output = execSync(`darwinian mutate "${baselinePath}"`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        return output;
    } catch (e) {
        console.error(`[Engine] Darwinian runtime error: ${e.message}`);
        return null;
    }
}

function runEngineMock(engineName, fixtureDir, isCode = false) {
    console.log(`[Engine] Running mutation via ${engineName}...`);
    
    if (isCode) {
        const baselineJsPath = path.join(fixtureDir, 'baseline.js');
        let code = fs.readFileSync(baselineJsPath, 'utf-8');
        // Native engine heuristic: standard naive fix
        return code.replace(/price \* discountRate|discountRate \* price/g, 'Math.floor(price * discountRate)');
    } else {
        const betaPath = path.join(fixtureDir, 'fix-bug-beta.md');
        if (fs.existsSync(betaPath)) {
            return fs.readFileSync(betaPath, 'utf-8');
        }
        // Fallback if no beta file exists
        return `<!-- Mutated by ${engineName} -->\nFallback content.`;
    }
}

function runEvaluatorMock(engineName, content, isCode = false) {
    console.log(`[Evaluator] Running evaluator for ${engineName} candidate...`);
    
    let constraint_retention = 7;
    let novelty = 5;
    let brevity = 6;
    
    if (isCode) {
        if (content.includes('BigInt')) {
            constraint_retention += 3; // Better adherence to financial rules
            novelty += 4; // Using robust modern JS features
        } else if (content.includes('Math.floor')) {
            constraint_retention -= 2; // Naive fix, loses precision on large numbers
            novelty -= 1;
        }
    } else {
        if (content.includes('DUAL-RUN A/B TESTING') || content.includes('EVOLUTION LAB')) {
            novelty += 3;
        }
        
        if (content.includes('DARWINIAN INJECTION')) {
            novelty += 1;
            constraint_retention -= 1; // Injecting randomly might reduce constraints
        } else if (content.includes('Phase 8b: DUAL-RUN')) {
            constraint_retention += 2; // Well-structured native insertion
            brevity += 1;
        }
    }
    
    const total_score = constraint_retention + novelty + brevity;
    
    return {
        axes: {
            constraint_retention,
            novelty,
            brevity
        },
        total_score,
        fatal_degradations: []
    };
}

function main() {
    console.log(`Starting Evolution Lab Trial for fixture: ${FIXTURE_NAME}`);

    if (!fs.existsSync(FIXTURE_DIR)) {
        console.error(`Error: Fixture ${FIXTURE_NAME} not found at ${FIXTURE_DIR}`);
        process.exit(1);
    }

    let isCode = false;
    let baselinePath = path.join(FIXTURE_DIR, 'baseline.md');
    
    // Check if there is a baseline.js instead for real bug testing
    if (fs.existsSync(path.join(FIXTURE_DIR, 'baseline.js'))) {
        baselinePath = path.join(FIXTURE_DIR, 'baseline.js');
        isCode = true;
    } else if (!fs.existsSync(baselinePath)) {
        console.error(`Error: baseline.md or baseline.js not found in ${FIXTURE_DIR}`);
        process.exit(1);
    }

    const fileExt = isCode ? '.js' : '.md';
    
    let isDualRun = loadConfig();
    
    if (isDualRun && SKIP_DARWINIAN) {
        console.log("[Notice] User explicitly opted out of Darwinian execution.");
        isDualRun = false;
    }

    if (isDualRun && !checkDarwinian()) {
        console.error("\n[I-Wish-ERROR: DEPENDENCY_MISSING]");
        console.error("The 'darwinian' CLI tool is required for Dual-Run A/B Testing.");
        process.exit(2);
    }

    console.log(`State: ${isDualRun ? 'FULL_DUAL_RUN' : 'DEGRADED_NATIVE_ONLY'}`);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const trialId = `TRIAL-${timestamp}`;
    
    const candidates = [];
    const evaluationResults = {};

    // 1. Native Engine
    const nativeCandidate = runEngineMock('iwish-native', FIXTURE_DIR, isCode);
    const nativePath = path.join(CANDIDATES_DIR, `${trialId}-native${fileExt}`);
    fs.writeFileSync(nativePath, nativeCandidate);
    candidates.push({
        path: `candidates/${trialId}-native${fileExt}`,
        source_engine: 'iwish-native',
        engine_version: 'internal'
    });
    evaluationResults['iwish-native'] = runEvaluatorMock('iwish-native', nativeCandidate, isCode);

    // 2. Darwinian Engine (if enabled)
    if (isDualRun) {
        const darwinianCandidate = runDarwinian(baselinePath);
        if (darwinianCandidate) {
            const darwinianPath = path.join(CANDIDATES_DIR, `${trialId}-darwinian${fileExt}`);
            fs.writeFileSync(darwinianPath, darwinianCandidate);
            candidates.push({
                path: `candidates/${trialId}-darwinian${fileExt}`,
                source_engine: 'darwinian',
                engine_version: 'latest'
            });
            evaluationResults['darwinian'] = runEvaluatorMock('darwinian', darwinianCandidate, isCode);
        } else {
            console.warn("\n[I-Wish-WARNING: RUNTIME_ERROR]");
            console.warn("Darwinian execution failed or returned no result.");
        }
    }

    // 3. Write Manifest
    const manifestPath = path.join(TRIALS_DIR, `trial-manifest-${trialId}.yaml`);
    let manifestYaml = `trial_id: "${trialId}"\n`;
    manifestYaml += `timestamp: "${new Date().toISOString()}"\n`;
    manifestYaml += `fixture: "${FIXTURE_NAME}"\n`;
    manifestYaml += `is_code_eval: ${isCode}\n`;
    manifestYaml += `decision: "PENDING"\n`;
    manifestYaml += `candidates:\n`;
    for (const c of candidates) {
        manifestYaml += `  - path: "${c.path}"\n`;
        manifestYaml += `    source_engine: "${c.source_engine}"\n`;
        manifestYaml += `    engine_version: "${c.engine_version}"\n`;
    }
    fs.writeFileSync(manifestPath, manifestYaml);
    console.log(`[Output] Wrote manifest to ${manifestPath}`);

    // 4. Generate Scorecard
    const scorecardPath = path.join(TRIALS_DIR, `scorecard-${trialId}.md`);
    let scorecardMd = `# Evolution Lab Scorecard: ${FIXTURE_NAME}\n\n`;
    scorecardMd += `**Trial ID:** ${trialId}\n`;
    scorecardMd += `**Date:** ${new Date().toUTCString()}\n`;
    scorecardMd += `**Mode:** ${isDualRun ? 'FULL_DUAL_RUN' : 'DEGRADED_NATIVE_ONLY'}\n`;
    scorecardMd += `**Target Type:** ${isCode ? 'Source Code (.js/.ts)' : 'Workflow Document (.md)'}\n\n`;

    scorecardMd += `## Evaluation Results\n\n`;
    scorecardMd += `| Engine | Total Score | Constraint Retention | Novelty | Brevity | Fatal Degradations |\n`;
    scorecardMd += `|---|---|---|---|---|---|\n`;

    let bestScore = -1;
    let bestEngine = null;

    for (const engine of Object.keys(evaluationResults)) {
        const res = evaluationResults[engine];
        const fatalStr = res.fatal_degradations.length > 0 ? res.fatal_degradations.join(', ') : 'None';
        scorecardMd += `| **${engine}** | **${res.total_score}** | ${res.axes.constraint_retention} | ${res.axes.novelty} | ${res.axes.brevity} | ${fatalStr} |\n`;
        
        if (res.total_score > bestScore) {
            bestScore = res.total_score;
            bestEngine = engine;
        }
    }
    
    scorecardMd += `\n## Final Decision\n\n`;
    scorecardMd += `**Winner:** ${bestEngine} (${bestScore} points)\n`;
    
    fs.writeFileSync(scorecardPath, scorecardMd);
    console.log(`[Output] Wrote scorecard to ${scorecardPath}`);
    console.log('Trial completed successfully.');
}

main();
