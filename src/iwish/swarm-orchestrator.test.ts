/**
 * swarm-orchestrator.test.ts — Unit tests for Story 10.3
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import {
  SwarmStateBoardManager,
  buildSubagentPrompt,
  validateWritePermission,
  onStoryComplete,
  spawnWave,
  executeSwarmOrchestration,
  type SubAgentAPI,
  type SubAgentResult,
  type SubAgentSpawnConfig,
} from './swarm-orchestrator';
import type { DAGResult } from './dependency-mapper';

const TEMP_DIR = path.join(__dirname, '..', '..', '_test-temp-so');

function createMockDAG(): DAGResult {
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

function createMockAPI(failStories: string[] = []): SubAgentAPI {
  return {
    supportsParallel: () => true,
    invokeSubagent: async (config: SubAgentSpawnConfig): Promise<SubAgentResult> => {
      if (failStories.includes(config.storyId)) {
        return { storyId: config.storyId, conversationId: 'fail-id', status: 'FAIL', duration: 100, error: 'Test failure' };
      }
      return { storyId: config.storyId, conversationId: `mock-${config.storyId}`, status: 'PASS', duration: 100 };
    },
  };
}

describe('swarm-orchestrator', () => {
  beforeEach(() => {
    fs.ensureDirSync(TEMP_DIR);
    fs.ensureDirSync(path.join(TEMP_DIR, '_iwish-output'));
  });

  afterEach(() => {
    fs.removeSync(TEMP_DIR);
  });

  describe('SwarmStateBoardManager', () => {
    it('should initialize state from DAG', () => {
      const dag = createMockDAG();
      const board = new SwarmStateBoardManager('1', dag, 'PARALLEL', TEMP_DIR);
      const state = board.getState();

      expect(state.stories).toHaveLength(3);
      expect(state.stories.every((s) => s.status === 'PENDING')).toBe(true);
      expect(state.totalWaves).toBe(2);
      expect(state.currentWave).toBe(1);
    });

    it('should track state transitions correctly', () => {
      const dag = createMockDAG();
      const board = new SwarmStateBoardManager('1', dag, 'PARALLEL', TEMP_DIR);

      board.markRunning('story-1.1', 'conv-123', 'branch-1.1');
      expect(board.getStory('story-1.1')?.status).toBe('RUNNING');
      expect(board.getStory('story-1.1')?.agentConversationId).toBe('conv-123');

      board.markCompleted('story-1.1', 'PASS');
      expect(board.getStory('story-1.1')?.status).toBe('PASS');
      expect(board.getStory('story-1.1')?.endTime).toBeTruthy();
    });

    it('should identify ready stories based on dependencies', () => {
      const dag = createMockDAG();
      const board = new SwarmStateBoardManager('1', dag, 'PARALLEL', TEMP_DIR);

      // Initially, story-1.2 is not ready (depends on 1.1)
      let ready = board.getReadyStories(dag);
      expect(ready.map((s) => s.storyId)).toContain('story-1.1');
      expect(ready.map((s) => s.storyId)).toContain('story-1.3');
      expect(ready.map((s) => s.storyId)).not.toContain('story-1.2');

      // After 1.1 passes, 1.2 becomes ready
      board.markCompleted('story-1.1', 'PASS');
      ready = board.getReadyStories(dag);
      expect(ready.map((s) => s.storyId)).toContain('story-1.2');
    });

    it('should persist state to disk', () => {
      const dag = createMockDAG();
      const board = new SwarmStateBoardManager('1', dag, 'PARALLEL', TEMP_DIR);

      const statusPath = path.join(TEMP_DIR, '_iwish-output', 'swarm-status-epic-1.json');
      expect(fs.existsSync(statusPath)).toBe(true);

      const persisted = fs.readJsonSync(statusPath);
      expect(persisted.stories).toHaveLength(3);
    });
  });

  describe('buildSubagentPrompt', () => {
    it('should produce a prompt with workflow binding', async () => {
      // Create minimal story file
      fs.ensureDirSync(path.join(TEMP_DIR, '_iwish-output', 'stories'));
      fs.writeFileSync(
        path.join(TEMP_DIR, '_iwish-output', 'stories', 'story-1.1.md'),
        '# Story 1.1: Test Story\n## AC\n- AC1: Test',
        'utf8',
      );

      const config = await buildSubagentPrompt('story-1.1', '1', TEMP_DIR);

      expect(config.storyId).toBe('story-1.1');
      expect(config.typeName).toBe('story_developer');
      expect(config.workspace).toBe('branch');
      expect(config.prompt).toContain('Workflow Binding');
      expect(config.prompt).toContain('Write-Lock Rules');
    });
  });

  describe('validateWritePermission', () => {
    it('should block writes to locked files', () => {
      // Create lock manifest
      const lockDir = path.join(TEMP_DIR, '_iwish-output', 'interface-lock-epic-1');
      fs.ensureDirSync(lockDir);
      fs.writeJsonSync(path.join(lockDir, 'lock-manifest.json'), {
        files: [{ filePath: '_iwish-output/interface-lock-epic-1/contracts.ts' }],
      });

      const result = validateWritePermission(
        'story-1.1', '_iwish-output/interface-lock-epic-1/contracts.ts', '1', TEMP_DIR,
      );
      expect(result.allowed).toBe(false);
    });
  });

  describe('onStoryComplete', () => {
    it('should unblock dependent stories on PASS', () => {
      const dag = createMockDAG();
      const board = new SwarmStateBoardManager('1', dag, 'PARALLEL', TEMP_DIR);

      const result: SubAgentResult = {
        storyId: 'story-1.1', conversationId: 'conv-1', status: 'PASS', duration: 100,
      };

      const newlyReady = onStoryComplete('story-1.1', result, board, dag);
      expect(newlyReady).toContain('story-1.2');
    });

    it('should block dependents on FAIL', () => {
      const dag = createMockDAG();
      const board = new SwarmStateBoardManager('1', dag, 'PARALLEL', TEMP_DIR);

      const result: SubAgentResult = {
        storyId: 'story-1.1', conversationId: 'conv-1', status: 'FAIL', duration: 100, error: 'crash',
      };

      onStoryComplete('story-1.1', result, board, dag);
      expect(board.getStory('story-1.2')?.status).toBe('BLOCKED');
    });
  });

  describe('executeSwarmOrchestration', () => {
    it('should execute all waves with mock API', async () => {
      // Write DAG file
      const dag = createMockDAG();
      fs.writeJsonSync(
        path.join(TEMP_DIR, '_iwish-output', 'dependency-map-epic-1.json'),
        dag,
      );

      const api = createMockAPI();
      const state = await executeSwarmOrchestration('1', api, { projectRoot: TEMP_DIR });

      expect(state.summary.passed).toBe(3);
      expect(state.summary.failed).toBe(0);
    });

    it('should handle failures and block dependents', async () => {
      const dag = createMockDAG();
      fs.writeJsonSync(
        path.join(TEMP_DIR, '_iwish-output', 'dependency-map-epic-1.json'),
        dag,
      );

      const api = createMockAPI(['story-1.1']);
      const state = await executeSwarmOrchestration('1', api, { projectRoot: TEMP_DIR });

      expect(state.summary.failed).toBe(1);
      expect(state.summary.blocked).toBeGreaterThanOrEqual(1);
    });

    it('should throw when DAG file is missing', async () => {
      const api = createMockAPI();
      await expect(
        executeSwarmOrchestration('99', api, { projectRoot: TEMP_DIR }),
      ).rejects.toThrow('No dependency map found');
    });
  });
});
