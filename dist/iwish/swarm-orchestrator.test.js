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
/**
 * swarm-orchestrator.test.ts — Unit tests for Story 10.3
 */
const vitest_1 = require("vitest");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const swarm_orchestrator_1 = require("./swarm-orchestrator");
const TEMP_DIR = path.join(__dirname, '..', '..', '_test-temp-so');
function createMockDAG() {
    return {
        epicId: '1',
        generatedAt: new Date().toISOString(),
        confidenceThreshold: 0.9,
        nodes: [
            { id: 'story-1.1', title: 'Story A', classification: 'independent', depends_on: [], depended_by: ['story-1.2'], tags: [], estimated_complexity: 'medium' },
            { id: 'story-1.2', title: 'Story B', classification: 'dependent', depends_on: ['story-1.1'], depended_by: [], tags: [], estimated_complexity: 'medium' },
            { id: 'story-1.3', title: 'Story C', classification: 'independent', depends_on: [], depended_by: [], tags: [], estimated_complexity: 'low' },
        ],
        edges: [
            { from: 'story-1.1', to: 'story-1.2', type: 'explicit', confidence: 1.0, evidence: 'depends_on' },
        ],
        execution_waves: [['story-1.1', 'story-1.3'], ['story-1.2']],
        summary: { total_stories: 3, independent: 2, dependent: 1, ambiguous: 0, total_edges: 1, max_parallelism: 2 },
    };
}
function createMockAPI(failStories = []) {
    return {
        supportsParallel: () => true,
        invokeSubagent: async (config) => {
            if (failStories.includes(config.storyId)) {
                return { storyId: config.storyId, conversationId: 'fail-id', status: 'FAIL', duration: 100, error: 'Test failure' };
            }
            return { storyId: config.storyId, conversationId: `mock-${config.storyId}`, status: 'PASS', duration: 100 };
        },
    };
}
(0, vitest_1.describe)('swarm-orchestrator', () => {
    (0, vitest_1.beforeEach)(() => {
        fs.ensureDirSync(TEMP_DIR);
        fs.ensureDirSync(path.join(TEMP_DIR, '_iwish-output'));
    });
    (0, vitest_1.afterEach)(() => {
        fs.removeSync(TEMP_DIR);
    });
    (0, vitest_1.describe)('SwarmStateBoardManager', () => {
        (0, vitest_1.it)('should initialize state from DAG', () => {
            const dag = createMockDAG();
            const board = new swarm_orchestrator_1.SwarmStateBoardManager('1', dag, 'PARALLEL', TEMP_DIR);
            const state = board.getState();
            (0, vitest_1.expect)(state.stories).toHaveLength(3);
            (0, vitest_1.expect)(state.stories.every((s) => s.status === 'PENDING')).toBe(true);
            (0, vitest_1.expect)(state.totalWaves).toBe(2);
            (0, vitest_1.expect)(state.currentWave).toBe(1);
        });
        (0, vitest_1.it)('should track state transitions correctly', () => {
            const dag = createMockDAG();
            const board = new swarm_orchestrator_1.SwarmStateBoardManager('1', dag, 'PARALLEL', TEMP_DIR);
            board.markRunning('story-1.1', 'conv-123', 'branch-1.1');
            (0, vitest_1.expect)(board.getStory('story-1.1')?.status).toBe('RUNNING');
            (0, vitest_1.expect)(board.getStory('story-1.1')?.agentConversationId).toBe('conv-123');
            board.markCompleted('story-1.1', 'PASS');
            (0, vitest_1.expect)(board.getStory('story-1.1')?.status).toBe('PASS');
            (0, vitest_1.expect)(board.getStory('story-1.1')?.endTime).toBeTruthy();
        });
        (0, vitest_1.it)('should identify ready stories based on dependencies', () => {
            const dag = createMockDAG();
            const board = new swarm_orchestrator_1.SwarmStateBoardManager('1', dag, 'PARALLEL', TEMP_DIR);
            // Initially, story-1.2 is not ready (depends on 1.1)
            let ready = board.getReadyStories(dag);
            (0, vitest_1.expect)(ready.map((s) => s.storyId)).toContain('story-1.1');
            (0, vitest_1.expect)(ready.map((s) => s.storyId)).toContain('story-1.3');
            (0, vitest_1.expect)(ready.map((s) => s.storyId)).not.toContain('story-1.2');
            // After 1.1 passes, 1.2 becomes ready
            board.markCompleted('story-1.1', 'PASS');
            ready = board.getReadyStories(dag);
            (0, vitest_1.expect)(ready.map((s) => s.storyId)).toContain('story-1.2');
        });
        (0, vitest_1.it)('should persist state to disk', () => {
            const dag = createMockDAG();
            const board = new swarm_orchestrator_1.SwarmStateBoardManager('1', dag, 'PARALLEL', TEMP_DIR);
            const statusPath = path.join(TEMP_DIR, '_iwish-output', 'swarm-status-epic-1.json');
            (0, vitest_1.expect)(fs.existsSync(statusPath)).toBe(true);
            const persisted = fs.readJsonSync(statusPath);
            (0, vitest_1.expect)(persisted.stories).toHaveLength(3);
        });
    });
    (0, vitest_1.describe)('buildSubagentPrompt', () => {
        (0, vitest_1.it)('should produce a prompt with workflow binding', () => {
            // Create minimal story file
            fs.ensureDirSync(path.join(TEMP_DIR, '_iwish-output', 'stories'));
            fs.writeFileSync(path.join(TEMP_DIR, '_iwish-output', 'stories', 'story-1.1.md'), '# Story 1.1: Test Story\n## AC\n- AC1: Test', 'utf8');
            const config = (0, swarm_orchestrator_1.buildSubagentPrompt)('story-1.1', '1', TEMP_DIR);
            (0, vitest_1.expect)(config.storyId).toBe('story-1.1');
            (0, vitest_1.expect)(config.typeName).toBe('story_developer');
            (0, vitest_1.expect)(config.workspace).toBe('branch');
            (0, vitest_1.expect)(config.prompt).toContain('Workflow Binding');
            (0, vitest_1.expect)(config.prompt).toContain('Write-Lock Rules');
        });
    });
    (0, vitest_1.describe)('validateWritePermission', () => {
        (0, vitest_1.it)('should block writes to locked files', () => {
            // Create lock manifest
            const lockDir = path.join(TEMP_DIR, '_iwish-output', 'interface-lock-epic-1');
            fs.ensureDirSync(lockDir);
            fs.writeJsonSync(path.join(lockDir, 'lock-manifest.json'), {
                files: [{ filePath: '_iwish-output/interface-lock-epic-1/contracts.ts' }],
            });
            const result = (0, swarm_orchestrator_1.validateWritePermission)('story-1.1', '_iwish-output/interface-lock-epic-1/contracts.ts', '1', TEMP_DIR);
            (0, vitest_1.expect)(result.allowed).toBe(false);
        });
    });
    (0, vitest_1.describe)('onStoryComplete', () => {
        (0, vitest_1.it)('should unblock dependent stories on PASS', () => {
            const dag = createMockDAG();
            const board = new swarm_orchestrator_1.SwarmStateBoardManager('1', dag, 'PARALLEL', TEMP_DIR);
            const result = {
                storyId: 'story-1.1', conversationId: 'conv-1', status: 'PASS', duration: 100,
            };
            const newlyReady = (0, swarm_orchestrator_1.onStoryComplete)('story-1.1', result, board, dag);
            (0, vitest_1.expect)(newlyReady).toContain('story-1.2');
        });
        (0, vitest_1.it)('should block dependents on FAIL', () => {
            const dag = createMockDAG();
            const board = new swarm_orchestrator_1.SwarmStateBoardManager('1', dag, 'PARALLEL', TEMP_DIR);
            const result = {
                storyId: 'story-1.1', conversationId: 'conv-1', status: 'FAIL', duration: 100, error: 'crash',
            };
            (0, swarm_orchestrator_1.onStoryComplete)('story-1.1', result, board, dag);
            (0, vitest_1.expect)(board.getStory('story-1.2')?.status).toBe('BLOCKED');
        });
    });
    (0, vitest_1.describe)('executeSwarmOrchestration', () => {
        (0, vitest_1.it)('should execute all waves with mock API', async () => {
            // Write DAG file
            const dag = createMockDAG();
            fs.writeJsonSync(path.join(TEMP_DIR, '_iwish-output', 'dependency-map-epic-1.json'), dag);
            const api = createMockAPI();
            const state = await (0, swarm_orchestrator_1.executeSwarmOrchestration)('1', api, { projectRoot: TEMP_DIR });
            (0, vitest_1.expect)(state.summary.passed).toBe(3);
            (0, vitest_1.expect)(state.summary.failed).toBe(0);
        });
        (0, vitest_1.it)('should handle failures and block dependents', async () => {
            const dag = createMockDAG();
            fs.writeJsonSync(path.join(TEMP_DIR, '_iwish-output', 'dependency-map-epic-1.json'), dag);
            const api = createMockAPI(['story-1.1']);
            const state = await (0, swarm_orchestrator_1.executeSwarmOrchestration)('1', api, { projectRoot: TEMP_DIR });
            (0, vitest_1.expect)(state.summary.failed).toBe(1);
            (0, vitest_1.expect)(state.summary.blocked).toBeGreaterThanOrEqual(1);
        });
        (0, vitest_1.it)('should throw when DAG file is missing', async () => {
            const api = createMockAPI();
            await (0, vitest_1.expect)((0, swarm_orchestrator_1.executeSwarmOrchestration)('99', api, { projectRoot: TEMP_DIR })).rejects.toThrow('No dependency map found');
        });
    });
});
