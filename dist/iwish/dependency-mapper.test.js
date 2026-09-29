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
 * dependency-mapper.test.ts — Unit tests for Story 10.1
 */
const vitest_1 = require("vitest");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const dependency_mapper_1 = require("./dependency-mapper");
// ---------------------------------------------------------------------------
// Helper: create a temp project with story files
// ---------------------------------------------------------------------------
const TEMP_DIR = path.join(__dirname, '..', '..', '_test-temp-dm');
function createStoryFile(storyId, content) {
    const dir = path.join(TEMP_DIR, '_iwish-output', 'stories');
    fs.ensureDirSync(dir);
    fs.writeFileSync(path.join(dir, `${storyId}.md`), content, 'utf8');
}
(0, vitest_1.describe)('dependency-mapper', () => {
    (0, vitest_1.beforeEach)(() => {
        fs.ensureDirSync(TEMP_DIR);
        fs.ensureDirSync(path.join(TEMP_DIR, '_iwish-output', 'stories'));
    });
    (0, vitest_1.afterEach)(() => {
        fs.removeSync(TEMP_DIR);
    });
    (0, vitest_1.describe)('analyzeDependencies', () => {
        (0, vitest_1.it)('should produce a valid DAG for independent stories', async () => {
            createStoryFile('story-1.1', `# Story 1.1: Feature A
## depends_on: []
## AC
- AC1: Build feature A
`);
            createStoryFile('story-1.2', `# Story 1.2: Feature B
## depends_on: []
## AC
- AC1: Build feature B
`);
            const result = await (0, dependency_mapper_1.analyzeDependencies)('1', {
                projectRoot: TEMP_DIR,
                confidenceThreshold: 0.9,
            });
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.nodes).toHaveLength(2);
            (0, vitest_1.expect)(result.execution_waves).toHaveLength(1);
            (0, vitest_1.expect)(result.execution_waves[0]).toHaveLength(2);
            (0, vitest_1.expect)(result.summary.independent).toBe(2);
            (0, vitest_1.expect)(result.summary.dependent).toBe(0);
        });
        (0, vitest_1.it)('should detect explicit dependencies', async () => {
            createStoryFile('story-2.1', `# Story 2.1: Base Module
## depends_on: []
`);
            createStoryFile('story-2.2', `# Story 2.2: Dependent Module
## depends_on:
- story-2.1
## AC
- AC1: Given Story 2.1 đã hoàn tất, build feature
`);
            const result = await (0, dependency_mapper_1.analyzeDependencies)('2', {
                projectRoot: TEMP_DIR,
                confidenceThreshold: 0.9,
            });
            (0, vitest_1.expect)(result.nodes).toHaveLength(2);
            (0, vitest_1.expect)(result.execution_waves).toHaveLength(2);
            (0, vitest_1.expect)(result.execution_waves[0]).toContain('story-2.1');
            (0, vitest_1.expect)(result.execution_waves[1]).toContain('story-2.2');
            const depNode = result.nodes.find((n) => n.id === 'story-2.2');
            (0, vitest_1.expect)(depNode?.classification).toBe('dependent');
            (0, vitest_1.expect)(depNode?.depends_on).toContain('story-2.1');
        });
        (0, vitest_1.it)('should produce correct wave ordering for a chain A→B→C', async () => {
            createStoryFile('story-3.1', '# Story 3.1\n## depends_on: []\n## AC\n- AC1: Build base\n');
            createStoryFile('story-3.2', '# Story 3.2\n## depends_on:\n  - story-3.1\n## AC\n- AC1: Given Story 3.1 đã hoàn tất, build layer 2\n');
            createStoryFile('story-3.3', '# Story 3.3\n## depends_on:\n  - story-3.2\n## AC\n- AC1: Given Story 3.2 đã hoàn tất, build layer 3\n');
            const result = await (0, dependency_mapper_1.analyzeDependencies)('3', {
                projectRoot: TEMP_DIR,
                confidenceThreshold: 0.9,
            });
            (0, vitest_1.expect)(result.execution_waves.length).toBeGreaterThanOrEqual(2);
            // story-3.1 should be in wave 1, story-3.3 should be in the last wave
            (0, vitest_1.expect)(result.execution_waves[0]).toContain('story-3.1');
            const lastWave = result.execution_waves[result.execution_waves.length - 1];
            (0, vitest_1.expect)(lastWave).toContain('story-3.3');
        });
        (0, vitest_1.it)('should throw for empty epic', async () => {
            await (0, vitest_1.expect)((0, dependency_mapper_1.analyzeDependencies)('99', { projectRoot: TEMP_DIR })).rejects.toThrow();
        });
    });
});
