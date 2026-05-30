/**
 * conflict-resolver.test.ts — Unit tests for Story 10.6
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import {
  collectPRsByWave,
  sequentialMerge,
  invokeConflictPartyMode,
  applyConflictResolution,
  runSwarmQualityGate,
  generateMergeReport,
  executeConflictResolutionProtocol,
  type SubAgentPR,
  type ConflictDetails,
} from './conflict-resolver';

const TEMP_DIR = path.join(__dirname, '..', '..', '_test-temp-cr');

describe('conflict-resolver', () => {
  beforeEach(() => {
    fs.ensureDirSync(TEMP_DIR);
    fs.ensureDirSync(path.join(TEMP_DIR, '_iwish-output'));
    // Create tsconfig for compilation check
    fs.writeJsonSync(path.join(TEMP_DIR, 'tsconfig.json'), { compilerOptions: {} });
  });

  afterEach(() => {
    fs.removeSync(TEMP_DIR);
  });

  describe('sequentialMerge', () => {
    it('should merge PRs without conflicts (fast path)', () => {
      const prs: SubAgentPR[] = [
        { storyId: 'story-1.1', branch: 'b1', wave: 1, filesChanged: ['src/a.ts'], status: 'COLLECTED' },
        { storyId: 'story-1.2', branch: 'b2', wave: 1, filesChanged: ['src/b.ts'], status: 'COLLECTED' },
      ];

      const { mergedPRs, conflicts } = sequentialMerge(prs, 'integration', TEMP_DIR);

      expect(conflicts).toHaveLength(0);
      expect(mergedPRs.every((pr) => pr.status === 'MERGED')).toBe(true);
    });

    it('should detect same-file conflicts', () => {
      const prs: SubAgentPR[] = [
        { storyId: 'story-1.1', branch: 'b1', wave: 1, filesChanged: ['src/shared.ts'], status: 'COLLECTED' },
        { storyId: 'story-1.2', branch: 'b2', wave: 1, filesChanged: ['src/shared.ts', 'src/b.ts'], status: 'COLLECTED' },
      ];

      const { conflicts } = sequentialMerge(prs, 'integration', TEMP_DIR);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflictFiles).toContain('src/shared.ts');
      expect(conflicts[0].prA.storyId).toBe('story-1.1');
      expect(conflicts[0].prB.storyId).toBe('story-1.2');
    });

    it('should assign correct severity based on conflict count', () => {
      const prs: SubAgentPR[] = [
        { storyId: 's1', branch: 'b1', wave: 1, filesChanged: ['a.ts', 'b.ts', 'c.ts'], status: 'COLLECTED' },
        { storyId: 's2', branch: 'b2', wave: 1, filesChanged: ['a.ts', 'b.ts', 'c.ts'], status: 'COLLECTED' },
      ];

      const { conflicts } = sequentialMerge(prs, 'int', TEMP_DIR);
      expect(conflicts[0].severity).toBe('high'); // 3 overlapping files
    });
  });

  describe('invokeConflictPartyMode', () => {
    it('should reach consensus on medium severity conflicts', () => {
      const conflict: ConflictDetails = {
        prA: { storyId: 's1', branch: 'b1', wave: 1, filesChanged: ['x.ts'], status: 'MERGED' },
        prB: { storyId: 's2', branch: 'b2', wave: 1, filesChanged: ['x.ts'], status: 'CONFLICT' },
        conflictFiles: ['x.ts'],
        conflictType: 'same-file-modification',
        severity: 'medium',
        diffSummary: 'test',
      };

      const resolution = invokeConflictPartyMode(conflict, 2);

      expect(resolution.consensus).toBe(true);
      expect(resolution.strategy).toBe('merge-manual'); // 2/3 votes
      expect(resolution.debateRounds).toBe(1);
      expect(resolution.participants).toHaveLength(3);
      expect(resolution.commitMessage).toContain('ADR');
    });

    it('should handle high severity conflicts', () => {
      const conflict: ConflictDetails = {
        prA: { storyId: 's1', branch: 'b1', wave: 1, filesChanged: ['x.ts'], status: 'MERGED' },
        prB: { storyId: 's2', branch: 'b2', wave: 1, filesChanged: ['x.ts'], status: 'CONFLICT' },
        conflictFiles: ['x.ts'],
        conflictType: 'same-file-modification',
        severity: 'high',
        diffSummary: 'test',
      };

      const resolution = invokeConflictPartyMode(conflict, 2);
      // High severity: all 3 agents participate regardless of consensus outcome
      expect(resolution.participants).toHaveLength(3);
      expect(resolution.participants).toContain('architect-agent');
      expect(resolution.debateRounds).toBeGreaterThanOrEqual(1);
    });
  });

  describe('applyConflictResolution', () => {
    it('should log resolution to ADR file', () => {
      const resolution = {
        strategy: 'merge-manual' as const,
        rationale: 'Test resolution',
        implementedBy: 'test',
        commitMessage: 'fix(conflict): test',
        adrNumber: 99,
        debateRounds: 1,
        consensus: true,
        participants: ['dev-agent'],
      };

      const conflict: ConflictDetails = {
        prA: { storyId: 's1', branch: 'b1', wave: 1, filesChanged: ['x.ts'], status: 'MERGED' },
        prB: { storyId: 's2', branch: 'b2', wave: 1, filesChanged: ['x.ts'], status: 'CONFLICT' },
        conflictFiles: ['x.ts'],
        conflictType: 'same-file-modification',
        severity: 'low',
        diffSummary: 'test',
      };

      applyConflictResolution(resolution, conflict, TEMP_DIR);

      const adrPath = path.join(TEMP_DIR, '_iwish-output', 'adr-decisions.json');
      expect(fs.existsSync(adrPath)).toBe(true);
      const adrs = fs.readJsonSync(adrPath);
      expect(adrs).toHaveLength(1);
      expect(adrs[0].adrNumber).toBe(99);
    });

    it('should not apply user-escalation resolutions', () => {
      const resolution = {
        strategy: 'user-escalation' as const,
        rationale: 'Deadlock',
        implementedBy: 'user',
        commitMessage: '',
        adrNumber: 100,
        debateRounds: 2,
        consensus: false,
        participants: [],
      };

      const conflict: ConflictDetails = {
        prA: { storyId: 's1', branch: 'b1', wave: 1, filesChanged: ['x.ts'], status: 'MERGED' },
        prB: { storyId: 's2', branch: 'b2', wave: 1, filesChanged: ['x.ts'], status: 'CONFLICT' },
        conflictFiles: ['x.ts'],
        conflictType: 'same-file-modification',
        severity: 'low',
        diffSummary: 'test',
      };

      applyConflictResolution(resolution, conflict, TEMP_DIR);

      // No ADR written for user-escalation
      const adrPath = path.join(TEMP_DIR, '_iwish-output', 'adr-decisions.json');
      expect(fs.existsSync(adrPath)).toBe(false);
    });
  });

  describe('runSwarmQualityGate', () => {
    it('should pass when compilation succeeds', () => {
      const prs: SubAgentPR[] = [
        { storyId: 's1', branch: 'b1', wave: 1, filesChanged: ['x.ts'], status: 'MERGED' },
      ];

      const result = runSwarmQualityGate('1', 'integration', prs, TEMP_DIR);

      expect(result.status).toBe('PASSED');
      expect(result.unitTests.failed).toBe(0);
      expect(result.regressionSource).toBeUndefined();
    });

    it('should fail and identify regression when compilation fails', () => {
      // Remove tsconfig to simulate compilation failure
      fs.removeSync(path.join(TEMP_DIR, 'tsconfig.json'));

      const prs: SubAgentPR[] = [
        { storyId: 's1', branch: 'b1', wave: 1, filesChanged: ['x.ts'], status: 'MERGED' },
        { storyId: 's2', branch: 'b2', wave: 2, filesChanged: ['y.ts'], status: 'MERGED' },
      ];

      const result = runSwarmQualityGate('1', 'integration', prs, TEMP_DIR);

      expect(result.status).toBe('FAILED');
      expect(result.regressionSource).toBeDefined();
      expect(result.regressionSource!.responsiblePR.storyId).toBe('s2'); // Last PR blamed
    });
  });

  describe('generateMergeReport', () => {
    it('should create a merge report file', () => {
      const prs: SubAgentPR[] = [
        { storyId: 's1', branch: 'b1', wave: 1, filesChanged: [], status: 'MERGED' },
      ];
      const qg = {
        status: 'PASSED' as const,
        unitTests: { passed: 5, failed: 0, skipped: 0, duration: 1000 },
        integrationTests: { passed: 2, failed: 0, skipped: 0, duration: 2000 },
        e2eTests: { passed: 1, failed: 0, skipped: 0, duration: 3000 },
        sastScan: { issues: 0, critical: 0, high: 0, medium: 0, low: 0 },
        secretsScan: { issues: 0, critical: 0, high: 0, medium: 0, low: 0 },
      };

      const report = generateMergeReport('1', prs, [], [], qg, 'integration', TEMP_DIR, true);

      expect(report.totalPRs).toBe(1);
      expect(report.fastPath).toBe(true);
      expect(report.qualityGate.status).toBe('PASSED');

      const reportPath = path.join(TEMP_DIR, '_iwish-output', 'merge-report-epic-1.json');
      expect(fs.existsSync(reportPath)).toBe(true);
    });
  });

  describe('executeConflictResolutionProtocol', () => {
    it('should complete full pipeline', async () => {
      // Create DAG
      fs.writeJsonSync(path.join(TEMP_DIR, '_iwish-output', 'dependency-map-epic-1.json'), {
        execution_waves: [['story-1.1', 'story-1.2']],
      });

      const report = await executeConflictResolutionProtocol('1', {
        projectRoot: TEMP_DIR,
        skipQualityGate: true,
      });

      expect(report).toBeDefined();
      expect(report.epicId).toBe('1');
    });
  });
});
