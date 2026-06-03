import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';

// Mock git-operations module
vi.mock('./git-operations', () => ({
  getCurrentBranch: vi.fn(() => 'main'),
  createBranch: vi.fn(() => true),
  checkoutBranch: vi.fn(() => true),
  deleteBranch: vi.fn(() => true),
  mergeBranch: vi.fn(() => ({ success: true, conflictFiles: [], mergedFiles: ['src/a.ts'] })),
  diffBranches: vi.fn(() => ({ filesChanged: ['src/a.ts'], insertions: 10, deletions: 5, renames: [] })),
}));

// Mock child_process execSync
vi.mock('child_process', () => ({
  execSync: vi.fn((cmd) => {
    if (cmd.includes('status --porcelain')) return ''; // clean status
    if (cmd.includes('tsc --noEmit')) return ''; // compile ok
    if (cmd.includes('diff')) return '+++ b/src/a.ts\n+ console.log("hello");';
    return '';
  }),
}));

// Mock platform adapter
vi.mock('./platform-adapter', () => ({
  createPlatformAdapter: vi.fn(() => ({
    supportsParallel: () => true,
    invokeSubagent: vi.fn(async (config) => ({
      storyId: config.storyId,
      conversationId: `conv-${config.storyId}`,
      status: 'PASS',
      duration: 100,
    })),
  })),
}));

// Mock constants to return a temporary runtime root
const TEMP_DIR = path.join(__dirname, '..', '..', '_test-temp-tournament');
vi.mock('./constants', async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    ...original,
    getRuntimeRoot: vi.fn(() => path.join(TEMP_DIR, '.iwish')),
  };
});

import { runTournament, mergeTournament, abortTournament } from './tournament-runner';

describe('A/B Tournament Integration Tests', () => {
  beforeEach(() => {
    fs.ensureDirSync(TEMP_DIR);
    fs.ensureDirSync(path.join(TEMP_DIR, '.iwish', 'runtime', 'workflows'));
    fs.ensureDirSync(path.join(TEMP_DIR, '_iwish-output', 'tournaments'));
  });

  afterEach(() => {
    fs.removeSync(TEMP_DIR);
    vi.restoreAllMocks();
  });

  it('should initialize and execute runTournament successfully', async () => {
    await runTournament(TEMP_DIR, 'Fix parsing bug in CLI', 'superpower, native');

    // Verify active workflow is saved
    const activeWorkflowPath = path.join(TEMP_DIR, '.iwish', 'runtime', 'workflows', 'active-workflow.json');
    expect(fs.existsSync(activeWorkflowPath)).toBe(true);

    const state = fs.readJsonSync(activeWorkflowPath);
    expect(state.workflow).toBe('tournament');
    expect(state.current_phase).toBe('human');
    expect(state.status).toBe('in-progress');
    expect(state.accumulated_outputs.candidates).toContain('superpower');
    expect(state.accumulated_outputs.candidates).toContain('native');
    expect(state.accumulated_outputs.taskSlug).toBe('fix-parsing-bug-in-cli');

    // Verify scorecard is generated
    const scorecardPath = path.join(TEMP_DIR, '_iwish-output', 'tournaments', 'fix-parsing-bug-in-cli-scorecard.md');
    expect(fs.existsSync(scorecardPath)).toBe(true);

    const scorecardContent = fs.readFileSync(scorecardPath, 'utf8');
    expect(scorecardContent).toContain('# ⚔️ A/B Tournament Scorecard');
    expect(scorecardContent).toContain('superpower');
    expect(scorecardContent).toContain('native');
    expect(scorecardContent).toContain('HUMAN CHECKPOINT');
  });

  it('should merge tournament winner and clear workflow state', async () => {
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

    await mergeTournament(TEMP_DIR, 'superpower');

    // Check workflow state is cleared
    expect(fs.existsSync(activeWorkflowPath)).toBe(false);
  });

  it('should abort tournament and clean up workflow state', async () => {
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

    await abortTournament(TEMP_DIR);

    // Check workflow state is cleared
    expect(fs.existsSync(activeWorkflowPath)).toBe(false);
  });
});
