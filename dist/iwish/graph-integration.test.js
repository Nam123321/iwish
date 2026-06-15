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
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const okf_helper_1 = require("./okf-helper");
const graph_db_1 = require("./graph-db");
// Mock Redis client
const mockSendCommand = vitest_1.vi.fn();
const mockConnect = vitest_1.vi.fn();
const mockDisconnect = vitest_1.vi.fn();
const mockPing = vitest_1.vi.fn();
vitest_1.vi.mock('redis', () => ({
    createClient: () => ({
        connect: mockConnect,
        disconnect: mockDisconnect,
        ping: mockPing,
        sendCommand: mockSendCommand,
        on: vitest_1.vi.fn(),
    }),
}));
(0, vitest_1.describe)('graph-db integration', () => {
    const tempProjectRoot = path.resolve(__dirname, '..', '..', '_test-temp-graph');
    (0, vitest_1.beforeEach)(async () => {
        vitest_1.vi.clearAllMocks();
        await fs.ensureDir(tempProjectRoot);
    });
    (0, vitest_1.afterEach)(async () => {
        await fs.remove(tempProjectRoot);
    });
    (0, vitest_1.describe)('isGraphDBOnline', () => {
        (0, vitest_1.it)('should return true if client ping succeeds', async () => {
            mockPing.mockResolvedValue('PONG');
            const online = await (0, graph_db_1.isGraphDBOnline)();
            (0, vitest_1.expect)(online).toBe(true);
            (0, vitest_1.expect)(mockConnect).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should return false if client ping fails', async () => {
            mockPing.mockRejectedValue(new Error('Connection failed'));
            const online = await (0, graph_db_1.isGraphDBOnline)();
            (0, vitest_1.expect)(online).toBe(false);
        });
    });
    (0, vitest_1.describe)('executeCypher', () => {
        (0, vitest_1.it)('should execute sendCommand with GRAPH.QUERY and graphName', async () => {
            mockSendCommand.mockResolvedValue([['adjacent.resource'], [['file:///docB.md']]]);
            const res = await (0, graph_db_1.executeCypher)('MATCH (n) RETURN n');
            (0, vitest_1.expect)(mockSendCommand).toHaveBeenCalledWith([
                'GRAPH.QUERY',
                'featuregraph',
                'MATCH (n) RETURN n'
            ]);
            (0, vitest_1.expect)(res).toEqual([['adjacent.resource'], [['file:///docB.md']]]);
        });
    });
    (0, vitest_1.describe)('upsertOKFNodeInDB', () => {
        (0, vitest_1.it)('should execute node and link merges', async () => {
            await (0, graph_db_1.upsertOKFNodeInDB)({
                type: 'I-Wish Story',
                title: 'Story 1',
                resource: 'file:///story-1.md',
                timestamp: '2026-06-15',
                links_to: ['file:///prd.md']
            });
            (0, vitest_1.expect)(mockSendCommand).toHaveBeenCalledTimes(3); // 1 for story, 1 for prd target merge, 1 for links_to relation
        });
    });
    (0, vitest_1.describe)('lite-static fallback BFS traversal', () => {
        (0, vitest_1.it)('should correctly build adjacency list and traverse up to depth 2', async () => {
            // Create test files
            const outputDir = path.join(tempProjectRoot, '_iwish-output');
            await fs.ensureDir(outputDir);
            // Doc A
            await fs.writeFile(path.join(outputDir, 'docA.md'), `---
type: I-Wish PRD
title: Document A
resource: file:///mock/project/docA.md
timestamp: 2026-06-15
links_to: [_iwish-output/docB.md]
---
body`, 'utf8');
            // Doc B
            await fs.writeFile(path.join(outputDir, 'docB.md'), `---
type: I-Wish Story
title: Document B
resource: file:///mock/project/docB.md
timestamp: 2026-06-15
links_to: [_iwish-output/docC.md]
---
body`, 'utf8');
            // Doc C
            await fs.writeFile(path.join(outputDir, 'docC.md'), `---
type: I-Wish Bug Report
title: Document C
resource: file:///mock/project/docC.md
timestamp: 2026-06-15
links_to: []
---
body`, 'utf8');
            // Doc D (Unconnected)
            await fs.writeFile(path.join(outputDir, 'docD.md'), `---
type: I-Wish Story
title: Document D
resource: file:///mock/project/docD.md
timestamp: 2026-06-15
links_to: []
---
body`, 'utf8');
            const start = (0, okf_helper_1.formatOKFUri)(path.join(outputDir, 'docA.md'), tempProjectRoot);
            const results = (0, graph_db_1.getDepth2ResourcesStatic)(start, tempProjectRoot);
            const expectedB = (0, okf_helper_1.formatOKFUri)(path.join(outputDir, 'docB.md'), tempProjectRoot);
            const expectedC = (0, okf_helper_1.formatOKFUri)(path.join(outputDir, 'docC.md'), tempProjectRoot);
            const expectedD = (0, okf_helper_1.formatOKFUri)(path.join(outputDir, 'docD.md'), tempProjectRoot);
            // Doc A is connected to B (depth 1) and C (depth 2 via B)
            (0, vitest_1.expect)(results).toContain(expectedB);
            (0, vitest_1.expect)(results).toContain(expectedC);
            // Unconnected Doc D should not be found
            (0, vitest_1.expect)(results).not.toContain(expectedD);
            (0, vitest_1.expect)(results.length).toBe(2);
        });
    });
    (0, vitest_1.describe)('getCompressedContextURIs', () => {
        (0, vitest_1.it)('should fallback to static scanner if database is offline', async () => {
            mockPing.mockRejectedValue(new Error('offline'));
            // Creating docA and docB in temp directory
            const outputDir = path.join(tempProjectRoot, '_iwish-output');
            await fs.ensureDir(outputDir);
            await fs.writeFile(path.join(outputDir, 'docA.md'), `---
type: I-Wish PRD
title: Document A
resource: file:///mock/project/docA.md
timestamp: 2026-06-15
links_to: [_iwish-output/docB.md]
---
`, 'utf8');
            await fs.writeFile(path.join(outputDir, 'docB.md'), `---
type: I-Wish Story
title: Document B
resource: file:///mock/project/docB.md
timestamp: 2026-06-15
links_to: []
---
`, 'utf8');
            const start = (0, okf_helper_1.formatOKFUri)(path.join(outputDir, 'docA.md'), tempProjectRoot);
            const result = await (0, graph_db_1.getCompressedContextURIs)(start, tempProjectRoot);
            const expectedB = (0, okf_helper_1.formatOKFUri)(path.join(outputDir, 'docB.md'), tempProjectRoot);
            (0, vitest_1.expect)(result).toContain(expectedB);
            (0, vitest_1.expect)(result.length).toBe(1);
        });
    });
});
