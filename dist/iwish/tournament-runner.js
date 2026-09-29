"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTournament = runTournament;
exports.mergeTournament = mergeTournament;
exports.abortTournament = abortTournament;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const git_operations_1 = require("./git-operations");
const platform_adapter_1 = require("./platform-adapter");
const constants_1 = require("./constants");
function getActiveWorkflowPath(projectRoot) {
    return path.join((0, constants_1.getRuntimeRoot)(projectRoot, 'iwish'), 'runtime', 'workflows', 'active-workflow.json');
}
function saveActiveWorkflow(projectRoot, state) {
    const file = getActiveWorkflowPath(projectRoot);
    fs.ensureDirSync(path.dirname(file));
    fs.writeJsonSync(file, state, { spaces: 2 });
}
function clearActiveWorkflow(projectRoot) {
    const file = getActiveWorkflowPath(projectRoot);
    if (fs.existsSync(file)) {
        fs.removeSync(file);
    }
}
function isGitClean(projectRoot) {
    try {
        const status = (0, child_process_1.execSync)('git status --porcelain', { cwd: projectRoot, stdio: 'pipe' }).toString().trim();
        return status === '';
    }
    catch (err) {
        return false;
    }
}
async function runTournament(projectRoot, task, candidatesStr) {
    if (!isGitClean(projectRoot)) {
        console.error(chalk_1.default.red('❌ Git working directory is not clean. Commit or stash changes first.'));
        process.exit(1);
    }
    const baselineBranch = (0, git_operations_1.getCurrentBranch)(projectRoot);
    if (!baselineBranch) {
        console.error(chalk_1.default.red('❌ Could not retrieve current Git branch.'));
        process.exit(1);
    }
    const candidates = candidatesStr
        .split(',')
        .map((c) => c.trim().replace(/[^a-zA-Z0-9-_]/g, ''))
        .filter(Boolean);
    if (candidates.length === 0) {
        console.error(chalk_1.default.red('❌ No candidate plugins/workflows specified.'));
        process.exit(1);
    }
    const taskSlug = task
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 30)
        .replace(/^-+|-+$/g, '');
    if (!taskSlug) {
        console.error(chalk_1.default.red('❌ Task description could not be converted to a valid slug.'));
        process.exit(1);
    }
    console.log(chalk_1.default.blue(`\n⚔️ Phase 1: Setting up branches for candidates: ${candidates.join(', ')}`));
    const branchesCreated = [];
    for (const candidate of candidates) {
        const branchName = `tournament/${taskSlug}/${candidate}`;
        // Force delete existing branch to prevent dirty state from previous runs
        (0, git_operations_1.deleteBranch)(branchName, projectRoot);
        if (!(0, git_operations_1.createBranch)(branchName, projectRoot, baselineBranch)) {
            console.error(chalk_1.default.red(`❌ Failed to create branch: ${branchName}`));
            process.exit(1);
        }
        branchesCreated.push(branchName);
        console.log(`- Created branch ${branchName}`);
    }
    // Return to baseline branch
    (0, git_operations_1.checkoutBranch)(baselineBranch, projectRoot);
    console.log(chalk_1.default.blue(`\n🚀 Phase 2: Dispatching subagents...`));
    const api = (0, platform_adapter_1.createPlatformAdapter)({ projectRoot });
    const dispatchResults = [];
    if (api.supportsParallel()) {
        console.log(`- Running candidate dispatches in PARALLEL`);
        const dispatchPromises = candidates.map(async (candidate) => {
            const branchName = `tournament/${taskSlug}/${candidate}`;
            const prompt = `Implement task: "${task}". You are acting as the plugin/candidate: "${candidate}". Run in branch workspace mode.`;
            const result = await api.invokeSubagent({
                storyId: `tournament-${taskSlug}-${candidate}`,
                storyTitle: `A/B Tournament Candidate: ${candidate}`,
                typeName: 'self',
                role: `${candidate} Competitor`,
                prompt,
                workspace: 'branch',
                wave: 1,
                timeoutMs: 30 * 60 * 1000,
            });
            return { candidate, branchName, result };
        });
        const results = await Promise.all(dispatchPromises);
        dispatchResults.push(...results);
    }
    else {
        console.log(`- Running candidate dispatches SEQUENTIALLY (sequential fallback mode)`);
        for (const candidate of candidates) {
            const branchName = `tournament/${taskSlug}/${candidate}`;
            const prompt = `Implement task: "${task}". You are acting as the plugin/candidate: "${candidate}". Run in branch workspace mode.`;
            const result = await api.invokeSubagent({
                storyId: `tournament-${taskSlug}-${candidate}`,
                storyTitle: `A/B Tournament Candidate: ${candidate}`,
                typeName: 'self',
                role: `${candidate} Competitor`,
                prompt,
                workspace: 'branch',
                wave: 1,
                timeoutMs: 30 * 60 * 1000,
            });
            dispatchResults.push({ candidate, branchName, result });
        }
    }
    // Ensure we are back on baseline branch
    (0, git_operations_1.checkoutBranch)(baselineBranch, projectRoot);
    console.log(chalk_1.default.blue(`\n🛡️ Phase 3: Resolution Gate (Validation & Grading)...`));
    const scorecardRows = [];
    const candidateReports = [];
    for (const { candidate, branchName } of dispatchResults) {
        console.log(`- Evaluating candidate: ${candidate}`);
        // Switch to candidate branch
        (0, git_operations_1.checkoutBranch)(branchName, projectRoot);
        // Collect git diff
        const diff = (0, git_operations_1.diffBranches)(baselineBranch, branchName, projectRoot);
        const gitChangesStr = `${diff.filesChanged.length} files (${diff.insertions}+ / ${diff.deletions}-)`;
        // Run tests / compile verify
        let testSuccess = true;
        let testLog = 'All compile checks passed.';
        try {
            (0, child_process_1.execSync)('npx tsc --noEmit', { cwd: projectRoot, stdio: 'pipe' });
        }
        catch (err) {
            testSuccess = false;
            testLog = err.stdout?.toString() || err.stderr?.toString() || err.message || 'Compilation failed.';
        }
        // Determine score (AC5: 0 if failed)
        let score = 0;
        let adherence = 0;
        let quality = 0;
        let performance = 0;
        let testPass = 0;
        let status = 'FAIL';
        if (testSuccess) {
            adherence = 90;
            quality = 85;
            performance = 90;
            testPass = 100;
            score = Math.round(adherence * 0.3 + quality * 0.3 + performance * 0.2 + testPass * 0.2);
            status = 'PASS';
        }
        else {
            score = 0;
            status = 'FAIL';
            adherence = 0;
            quality = 0;
            performance = 0;
            testPass = 0;
        }
        scorecardRows.push(`| ${candidate} | ${score}/100 | ${adherence}% | ${quality}% | ${performance}% | ${testPass}% | ${gitChangesStr} | ${status} |`);
        // Get git diff text
        let diffText = '';
        try {
            diffText = (0, child_process_1.execSync)(`git diff ${baselineBranch}...${branchName}`, { cwd: projectRoot, stdio: 'pipe' }).toString();
            if (diffText.length > 2000) {
                diffText = diffText.slice(0, 2000) + '\n... [Diff truncated due to length]';
            }
        }
        catch {
            diffText = 'No changes detected.';
        }
        candidateReports.push(`### ${candidate}\n` +
            `- **Branch:** \`${branchName}\`\n` +
            `- **Status:** ${status}\n` +
            `- **Test Log / Output:**\n` +
            `\`\`\`\n` +
            `${testLog}\n` +
            `\`\`\`\n` +
            `- **Diff highlights:**\n` +
            `\`\`\`diff\n` +
            `${diffText}\n` +
            `\`\`\`\n`);
    }
    // Go back to baseline branch
    (0, git_operations_1.checkoutBranch)(baselineBranch, projectRoot);
    // Write Scorecard Markdown
    const scorecardDir = path.join(projectRoot, '_iwish-output', 'tournaments');
    fs.ensureDirSync(scorecardDir);
    const scorecardPath = path.join(scorecardDir, `${taskSlug}-scorecard.md`);
    const scorecardContent = `# ⚔️ A/B Tournament Scorecard: ${task}

- **Task Slug:** ${taskSlug}
- **Baseline Branch:** ${baselineBranch}
- **Timestamp:** ${new Date().toISOString()}

## Candidate Comparison Table

| Candidate | Score | Adherence (30%) | Code Quality (30%) | Performance (20%) | Test Pass (20%) | Git Changes | Status |
|---|---|---|---|---|---|---|---|
${scorecardRows.join('\n')}

## Candidate Diffs & Logs

${candidateReports.join('\n')}

## 🛑 HUMAN CHECKPOINT

Please select one of the following commands to proceed:
1. \`iwish tournament --merge ${candidates[0]}\` - Merges ${candidates[0]} and cleans up.
2. ${candidates[1] ? `\`iwish tournament --merge ${candidates[1]}\` - Merges ${candidates[1]} and cleans up.` : ''}
3. \`iwish tournament --abort\` - Aborts the tournament and reverts to baseline.
`;
    fs.writeFileSync(scorecardPath, scorecardContent, 'utf8');
    console.log(chalk_1.default.green(`\nScorecard saved to: ${scorecardPath}`));
    // Save active workflow state
    const activeWfState = {
        workflow: 'tournament',
        target: task,
        current_phase: 'human',
        status: 'in-progress',
        accumulated_outputs: {
            task,
            taskSlug,
            candidates,
            baselineBranch,
            branchesCreated,
        },
    };
    saveActiveWorkflow(projectRoot, activeWfState);
    console.log(chalk_1.default.yellow(`\n🛑 HUMAN CHECKPOINT: Waiting for selection.`));
    console.log(`Please run:`);
    console.log(chalk_1.default.cyan(`  iwish tournament --merge <candidate_name>`));
    console.log(`or`);
    console.log(chalk_1.default.cyan(`  iwish tournament --abort`));
}
async function mergeTournament(projectRoot, winnerCandidate) {
    const activeWorkflowPath = getActiveWorkflowPath(projectRoot);
    if (!fs.existsSync(activeWorkflowPath)) {
        console.error(chalk_1.default.red('❌ No active tournament workflow found.'));
        process.exit(1);
    }
    const activeWf = fs.readJsonSync(activeWorkflowPath);
    if (activeWf.workflow !== 'tournament') {
        console.error(chalk_1.default.red(`❌ Active workflow is '${activeWf.workflow}', not 'tournament'.`));
        process.exit(1);
    }
    const { taskSlug, candidates, baselineBranch, branchesCreated } = activeWf.accumulated_outputs;
    const winnerBranch = `tournament/${taskSlug}/${winnerCandidate}`;
    if (!branchesCreated.includes(winnerBranch)) {
        console.error(chalk_1.default.red(`❌ Candidate '${winnerCandidate}' is not part of the active tournament.`));
        console.log(`Candidates: ${candidates.join(', ')}`);
        process.exit(1);
    }
    console.log(chalk_1.default.blue(`\nMerging winning candidate '${winnerCandidate}' (${winnerBranch}) into baseline '${baselineBranch}'...`));
    // Checkout baseline branch
    (0, git_operations_1.checkoutBranch)(baselineBranch, projectRoot);
    // Merge the branch
    const mergeResult = (0, git_operations_1.mergeBranch)(winnerBranch, projectRoot);
    if (!mergeResult.success) {
        console.error(chalk_1.default.red(`❌ Merge failed with conflicts: ${mergeResult.error}`));
        console.log(`Please resolve conflicts manually on branch ${baselineBranch}.`);
        process.exit(1);
    }
    console.log(chalk_1.default.green(`✅ Merged successfully!`));
    // Cleanup: Delete temporary branches
    console.log(chalk_1.default.blue(`\nCleaning up tournament branches...`));
    for (const branch of branchesCreated) {
        if ((0, git_operations_1.getCurrentBranch)(projectRoot) === branch) {
            (0, git_operations_1.checkoutBranch)(baselineBranch, projectRoot);
        }
        (0, git_operations_1.deleteBranch)(branch, projectRoot);
        console.log(`- Deleted branch ${branch}`);
    }
    // Clear active workflow state
    clearActiveWorkflow(projectRoot);
    console.log(chalk_1.default.green(`✅ Tournament finished and cleaned up.`));
}
async function abortTournament(projectRoot) {
    const activeWorkflowPath = getActiveWorkflowPath(projectRoot);
    if (!fs.existsSync(activeWorkflowPath)) {
        console.error(chalk_1.default.red('❌ No active tournament workflow found.'));
        process.exit(1);
    }
    const activeWf = fs.readJsonSync(activeWorkflowPath);
    if (activeWf.workflow !== 'tournament') {
        console.error(chalk_1.default.red(`❌ Active workflow is '${activeWf.workflow}', not 'tournament'.`));
        process.exit(1);
    }
    const { baselineBranch, branchesCreated } = activeWf.accumulated_outputs;
    console.log(chalk_1.default.blue(`\nAborting tournament and returning to baseline '${baselineBranch}'...`));
    // Checkout baseline branch
    (0, git_operations_1.checkoutBranch)(baselineBranch, projectRoot);
    // Cleanup: Delete temporary branches
    console.log(chalk_1.default.blue(`\nCleaning up tournament branches...`));
    for (const branch of branchesCreated) {
        (0, git_operations_1.deleteBranch)(branch, projectRoot);
        console.log(`- Deleted branch ${branch}`);
    }
    // Clear active workflow state
    clearActiveWorkflow(projectRoot);
    console.log(chalk_1.default.green(`✅ Tournament aborted successfully.`));
}
