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
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
// Mock git-operations module
vitest_1.vi.mock('./git-operations', () => ({
    getCurrentBranch: vitest_1.vi.fn(() => 'main'),
    createBranch: vitest_1.vi.fn(() => true),
    checkoutBranch: vitest_1.vi.fn(() => true),
    deleteBranch: vitest_1.vi.fn(() => true),
    mergeBranch: vitest_1.vi.fn(() => ({ success: true, conflictFiles: [], mergedFiles: ['src/a.ts'] })),
    diffBranches: vitest_1.vi.fn(() => ({ filesChanged: ['src/a.ts'], insertions: 10, deletions: 5, renames: [] })),
}));
// Mock child_process execSync
vitest_1.vi.mock('child_process', () => ({
    execSync: vitest_1.vi.fn((cmd) => {
        if (cmd.includes('status --porcelain'))
            return ''; // clean status
        if (cmd.includes('tsc --noEmit'))
            return ''; // compile ok
        if (cmd.includes('diff'))
            return '+++ b/src/a.ts\n+ console.log("hello");';
        return '';
    }),
}));
// Mock platform adapter
vitest_1.vi.mock('./platform-adapter', () => ({
    createPlatformAdapter: vitest_1.vi.fn(() => ({
        supportsParallel: () => true,
        invokeSubagent: vitest_1.vi.fn(async (config) => ({
            storyId: config.storyId,
            conversationId: `conv-${config.storyId}`,
            status: 'PASS',
            duration: 100,
        })),
    })),
}));
// Mock constants to return a temporary runtime root
const TEMP_DIR = path.join(__dirname, '..', '..', '_test-temp-tournament');
vitest_1.vi.mock('./constants', async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        getRuntimeRoot: vitest_1.vi.fn(() => path.join(TEMP_DIR, '.iwish')),
    };
});
const tournament_runner_1 = require("./tournament-runner");
(0, vitest_1.describe)('A/B Tournament Integration Tests', () => {
    (0, vitest_1.beforeEach)(() => {
        fs.ensureDirSync(TEMP_DIR);
        fs.ensureDirSync(path.join(TEMP_DIR, '.iwish', 'runtime', 'workflows'));
        fs.ensureDirSync(path.join(TEMP_DIR, '_iwish-output', 'tournaments'));
    });
    (0, vitest_1.afterEach)(() => {
        fs.removeSync(TEMP_DIR);
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)('should initialize and execute runTournament successfully', async () => {
        await (0, tournament_runner_1.runTournament)(TEMP_DIR, 'Fix parsing bug in CLI', 'superpower, native');
        // Verify active workflow is saved
        const activeWorkflowPath = path.join(TEMP_DIR, '.iwish', 'runtime', 'workflows', 'active-workflow.json');
        (0, vitest_1.expect)(fs.existsSync(activeWorkflowPath)).toBe(true);
        const state = fs.readJsonSync(activeWorkflowPath);
        (0, vitest_1.expect)(state.workflow).toBe('tournament');
        (0, vitest_1.expect)(state.current_phase).toBe('human');
        (0, vitest_1.expect)(state.status).toBe('in-progress');
        (0, vitest_1.expect)(state.accumulated_outputs.candidates).toContain('superpower');
        (0, vitest_1.expect)(state.accumulated_outputs.candidates).toContain('native');
        (0, vitest_1.expect)(state.accumulated_outputs.taskSlug).toBe('fix-parsing-bug-in-cli');
        // Verify scorecard is generated
        const scorecardPath = path.join(TEMP_DIR, '_iwish-output', 'tournaments', 'fix-parsing-bug-in-cli-scorecard.md');
        (0, vitest_1.expect)(fs.existsSync(scorecardPath)).toBe(true);
        const scorecardContent = fs.readFileSync(scorecardPath, 'utf8');
        (0, vitest_1.expect)(scorecardContent).toContain('# ⚔️ A/B Tournament Scorecard');
        (0, vitest_1.expect)(scorecardContent).toContain('superpower');
        (0, vitest_1.expect)(scorecardContent).toContain('native');
        (0, vitest_1.expect)(scorecardContent).toContain('HUMAN CHECKPOINT');
    });
    (0, vitest_1.it)('should merge tournament winner and clear workflow state', async () => {
        // Scaffold active workflow state first
        const activeWorkflowPath = path.join(TEMP_DIR, '.iwish', 'runtime', 'workflows', 'active-workflow.json');
        fs.writeJsonSync(activeWorkflowPath, {
            workflow: 'tournament',
            target: 'Fix parsing bug in CLI',
            current_phase: 'human',
            status: 'in-progress',
            accumulated_outputs: {
                task: 'Fix parsing bug in CLI',
                taskSlug: 'fix-parsing-bug-in-cli',
                candidates: ['superpower', 'native'],
                baselineBranch: 'main',
                branchesCreated: ['tournament/fix-parsing-bug-in-cli/superpower', 'tournament/fix-parsing-bug-in-cli/native'],
            },
        });
        await (0, tournament_runner_1.mergeTournament)(TEMP_DIR, 'superpower');
        // Check workflow state is cleared
        (0, vitest_1.expect)(fs.existsSync(activeWorkflowPath)).toBe(false);
    });
    (0, vitest_1.it)('should abort tournament and clean up workflow state', async () => {
        // Scaffold active workflow state
        const activeWorkflowPath = path.join(TEMP_DIR, '.iwish', 'runtime', 'workflows', 'active-workflow.json');
        fs.writeJsonSync(activeWorkflowPath, {
            workflow: 'tournament',
            target: 'Fix parsing bug in CLI',
            current_phase: 'human',
            status: 'in-progress',
            accumulated_outputs: {
                task: 'Fix parsing bug in CLI',
                taskSlug: 'fix-parsing-bug-in-cli',
                candidates: ['superpower', 'native'],
                baselineBranch: 'main',
                branchesCreated: ['tournament/fix-parsing-bug-in-cli/superpower', 'tournament/fix-parsing-bug-in-cli/native'],
            },
        });
        await (0, tournament_runner_1.abortTournament)(TEMP_DIR);
        // Check workflow state is cleared
        (0, vitest_1.expect)(fs.existsSync(activeWorkflowPath)).toBe(false);
    });
});
