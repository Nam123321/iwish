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
 * conflict-resolver.test.ts — Unit tests for Story 10.6
 */
const vitest_1 = require("vitest");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const conflict_resolver_1 = require("./conflict-resolver");
const TEMP_DIR = path.join(__dirname, '..', '..', '_test-temp-cr');
(0, vitest_1.describe)('conflict-resolver', () => {
    (0, vitest_1.beforeEach)(() => {
        fs.ensureDirSync(TEMP_DIR);
        fs.ensureDirSync(path.join(TEMP_DIR, '_iwish-output'));
        // Create tsconfig for compilation check
        fs.writeJsonSync(path.join(TEMP_DIR, 'tsconfig.json'), { compilerOptions: {} });
    });
    (0, vitest_1.afterEach)(() => {
        fs.removeSync(TEMP_DIR);
    });
    (0, vitest_1.describe)('sequentialMerge', () => {
        (0, vitest_1.it)('should merge PRs without conflicts (fast path)', () => {
            const prs = [
                { storyId: 'story-1.1', branch: 'b1', wave: 1, filesChanged: ['src/a.ts'], status: 'COLLECTED' },
                { storyId: 'story-1.2', branch: 'b2', wave: 1, filesChanged: ['src/b.ts'], status: 'COLLECTED' },
            ];
            const { mergedPRs, conflicts } = (0, conflict_resolver_1.sequentialMerge)(prs, 'integration', TEMP_DIR);
            (0, vitest_1.expect)(conflicts).toHaveLength(0);
            (0, vitest_1.expect)(mergedPRs.every((pr) => pr.status === 'MERGED')).toBe(true);
        });
        (0, vitest_1.it)('should detect same-file conflicts', () => {
            const prs = [
                { storyId: 'story-1.1', branch: 'b1', wave: 1, filesChanged: ['src/shared.ts'], status: 'COLLECTED' },
                { storyId: 'story-1.2', branch: 'b2', wave: 1, filesChanged: ['src/shared.ts', 'src/b.ts'], status: 'COLLECTED' },
            ];
            const { conflicts } = (0, conflict_resolver_1.sequentialMerge)(prs, 'integration', TEMP_DIR);
            (0, vitest_1.expect)(conflicts).toHaveLength(1);
            (0, vitest_1.expect)(conflicts[0].conflictFiles).toContain('src/shared.ts');
            (0, vitest_1.expect)(conflicts[0].prA.storyId).toBe('story-1.1');
            (0, vitest_1.expect)(conflicts[0].prB.storyId).toBe('story-1.2');
        });
        (0, vitest_1.it)('should assign correct severity based on conflict count', () => {
            const prs = [
                { storyId: 's1', branch: 'b1', wave: 1, filesChanged: ['a.ts', 'b.ts', 'c.ts'], status: 'COLLECTED' },
                { storyId: 's2', branch: 'b2', wave: 1, filesChanged: ['a.ts', 'b.ts', 'c.ts'], status: 'COLLECTED' },
            ];
            const { conflicts } = (0, conflict_resolver_1.sequentialMerge)(prs, 'int', TEMP_DIR);
            (0, vitest_1.expect)(conflicts[0].severity).toBe('high'); // 3 overlapping files
        });
    });
    (0, vitest_1.describe)('invokeConflictPartyMode', () => {
        (0, vitest_1.it)('should reach consensus on medium severity conflicts', () => {
            const conflict = {
                prA: { storyId: 's1', branch: 'b1', wave: 1, filesChanged: ['x.ts'], status: 'MERGED' },
                prB: { storyId: 's2', branch: 'b2', wave: 1, filesChanged: ['x.ts'], status: 'CONFLICT' },
                conflictFiles: ['x.ts'],
                conflictType: 'same-file-modification',
                severity: 'medium',
                diffSummary: 'test',
            };
            const resolution = (0, conflict_resolver_1.invokeConflictPartyMode)(conflict, 2);
            (0, vitest_1.expect)(resolution.consensus).toBe(true);
            (0, vitest_1.expect)(resolution.strategy).toBe('merge-manual'); // 2/3 votes
            (0, vitest_1.expect)(resolution.debateRounds).toBe(1);
            (0, vitest_1.expect)(resolution.participants).toHaveLength(3);
            (0, vitest_1.expect)(resolution.commitMessage).toContain('ADR');
        });
        (0, vitest_1.it)('should handle high severity conflicts', () => {
            const conflict = {
                prA: { storyId: 's1', branch: 'b1', wave: 1, filesChanged: ['x.ts'], status: 'MERGED' },
                prB: { storyId: 's2', branch: 'b2', wave: 1, filesChanged: ['x.ts'], status: 'CONFLICT' },
                conflictFiles: ['x.ts'],
                conflictType: 'same-file-modification',
                severity: 'high',
                diffSummary: 'test',
            };
            const resolution = (0, conflict_resolver_1.invokeConflictPartyMode)(conflict, 2);
            // High severity: all 3 agents participate regardless of consensus outcome
            (0, vitest_1.expect)(resolution.participants).toHaveLength(3);
            (0, vitest_1.expect)(resolution.participants).toContain('architect-agent');
            (0, vitest_1.expect)(resolution.debateRounds).toBeGreaterThanOrEqual(1);
        });
    });
    (0, vitest_1.describe)('applyConflictResolution', () => {
        (0, vitest_1.it)('should log resolution to ADR file', () => {
            const resolution = {
                strategy: 'merge-manual',
                rationale: 'Test resolution',
                implementedBy: 'test',
                commitMessage: 'fix(conflict): test',
                adrNumber: 99,
                debateRounds: 1,
                consensus: true,
                participants: ['dev-agent'],
            };
            const conflict = {
                prA: { storyId: 's1', branch: 'b1', wave: 1, filesChanged: ['x.ts'], status: 'MERGED' },
                prB: { storyId: 's2', branch: 'b2', wave: 1, filesChanged: ['x.ts'], status: 'CONFLICT' },
                conflictFiles: ['x.ts'],
                conflictType: 'same-file-modification',
                severity: 'low',
                diffSummary: 'test',
            };
            (0, conflict_resolver_1.applyConflictResolution)(resolution, conflict, TEMP_DIR);
            const adrPath = path.join(TEMP_DIR, '_iwish-output', 'adr-decisions.json');
            (0, vitest_1.expect)(fs.existsSync(adrPath)).toBe(true);
            const adrs = fs.readJsonSync(adrPath);
            (0, vitest_1.expect)(adrs).toHaveLength(1);
            (0, vitest_1.expect)(adrs[0].adrNumber).toBe(99);
        });
        (0, vitest_1.it)('should not apply user-escalation resolutions', () => {
            const resolution = {
                strategy: 'user-escalation',
                rationale: 'Deadlock',
                implementedBy: 'user',
                commitMessage: '',
                adrNumber: 100,
                debateRounds: 2,
                consensus: false,
                participants: [],
            };
            const conflict = {
                prA: { storyId: 's1', branch: 'b1', wave: 1, filesChanged: ['x.ts'], status: 'MERGED' },
                prB: { storyId: 's2', branch: 'b2', wave: 1, filesChanged: ['x.ts'], status: 'CONFLICT' },
                conflictFiles: ['x.ts'],
                conflictType: 'same-file-modification',
                severity: 'low',
                diffSummary: 'test',
            };
            (0, conflict_resolver_1.applyConflictResolution)(resolution, conflict, TEMP_DIR);
            // No ADR written for user-escalation
            const adrPath = path.join(TEMP_DIR, '_iwish-output', 'adr-decisions.json');
            (0, vitest_1.expect)(fs.existsSync(adrPath)).toBe(false);
        });
    });
    (0, vitest_1.describe)('runSwarmQualityGate', () => {
        (0, vitest_1.it)('should pass when compilation succeeds', () => {
            const prs = [
                { storyId: 's1', branch: 'b1', wave: 1, filesChanged: ['x.ts'], status: 'MERGED' },
            ];
            const result = (0, conflict_resolver_1.runSwarmQualityGate)('1', 'integration', prs, TEMP_DIR);
            (0, vitest_1.expect)(result.status).toBe('PASSED');
            (0, vitest_1.expect)(result.unitTests.failed).toBe(0);
            (0, vitest_1.expect)(result.regressionSource).toBeUndefined();
        });
        (0, vitest_1.it)('should fail and identify regression when compilation fails', () => {
            // Remove tsconfig to simulate compilation failure
            fs.removeSync(path.join(TEMP_DIR, 'tsconfig.json'));
            const prs = [
                { storyId: 's1', branch: 'b1', wave: 1, filesChanged: ['x.ts'], status: 'MERGED' },
                { storyId: 's2', branch: 'b2', wave: 2, filesChanged: ['y.ts'], status: 'MERGED' },
            ];
            const result = (0, conflict_resolver_1.runSwarmQualityGate)('1', 'integration', prs, TEMP_DIR);
            (0, vitest_1.expect)(result.status).toBe('FAILED');
            (0, vitest_1.expect)(result.regressionSource).toBeDefined();
            (0, vitest_1.expect)(result.regressionSource.responsiblePR.storyId).toBe('s2'); // Last PR blamed
        });
    });
    (0, vitest_1.describe)('generateMergeReport', () => {
        (0, vitest_1.it)('should create a merge report file', () => {
            const prs = [
                { storyId: 's1', branch: 'b1', wave: 1, filesChanged: [], status: 'MERGED' },
            ];
            const qg = {
                status: 'PASSED',
                unitTests: { passed: 5, failed: 0, skipped: 0, duration: 1000 },
                integrationTests: { passed: 2, failed: 0, skipped: 0, duration: 2000 },
                e2eTests: { passed: 1, failed: 0, skipped: 0, duration: 3000 },
                sastScan: { issues: 0, critical: 0, high: 0, medium: 0, low: 0 },
                secretsScan: { issues: 0, critical: 0, high: 0, medium: 0, low: 0 },
            };
            const report = (0, conflict_resolver_1.generateMergeReport)('1', prs, [], [], qg, 'integration', TEMP_DIR, true);
            (0, vitest_1.expect)(report.totalPRs).toBe(1);
            (0, vitest_1.expect)(report.fastPath).toBe(true);
            (0, vitest_1.expect)(report.qualityGate.status).toBe('PASSED');
            const reportPath = path.join(TEMP_DIR, '_iwish-output', 'merge-report-epic-1.json');
            (0, vitest_1.expect)(fs.existsSync(reportPath)).toBe(true);
        });
    });
    (0, vitest_1.describe)('executeConflictResolutionProtocol', () => {
        (0, vitest_1.it)('should complete full pipeline', async () => {
            // Create DAG
            fs.writeJsonSync(path.join(TEMP_DIR, '_iwish-output', 'dependency-map-epic-1.json'), {
                execution_waves: [['story-1.1', 'story-1.2']],
            });
            const report = await (0, conflict_resolver_1.executeConflictResolutionProtocol)('1', {
                projectRoot: TEMP_DIR,
                skipQualityGate: true,
            });
            (0, vitest_1.expect)(report).toBeDefined();
            (0, vitest_1.expect)(report.epicId).toBe('1');
        });
    });
});
