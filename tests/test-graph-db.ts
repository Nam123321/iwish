import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs-extra';
import { formatOKFUri } from '../src/iwish/okf-helper';
import {
  getGraphDBConfig,
  isGraphDBOnline,
  executeCypher,
  upsertOKFNodeInDB,
  getDepth2ResourcesStatic,
  scanOKFMarkdownFiles,
  getCompressedContextURIs
} from '../src/iwish/graph-db';

// Mock Redis client
const mockSendCommand = vi.fn();
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockPing = vi.fn();

vi.mock('redis', () => ({
  createClient: () => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    ping: mockPing,
    sendCommand: mockSendCommand,
    on: vi.fn(),
  }),
}));

describe('graph-db integration', () => {
  const tempProjectRoot = path.resolve(__dirname, '..', '..', '_test-temp-graph');

  beforeEach(async () => {
    vi.clearAllMocks();
    await fs.ensureDir(tempProjectRoot);
  });

  afterEach(async () => {
    await fs.remove(tempProjectRoot);
  });

  describe('isGraphDBOnline', () => {
    it('should return true if client ping succeeds', async () => {
      mockPing.mockResolvedValue('PONG');
      const online = await isGraphDBOnline();
      expect(online).toBe(true);
      expect(mockConnect).toHaveBeenCalled();
    });

    it('should return false if client ping fails', async () => {
      mockPing.mockRejectedValue(new Error('Connection failed'));
      const online = await isGraphDBOnline();
      expect(online).toBe(false);
    });
  });

  describe('executeCypher', () => {
    it('should execute sendCommand with GRAPH.QUERY and graphName', async () => {
      mockSendCommand.mockResolvedValue([['adjacent.resource'], [['file:///docB.md']]]);
      const res = await executeCypher('MATCH (n) RETURN n');
      expect(mockSendCommand).toHaveBeenCalledWith([
        'GRAPH.QUERY',
        'featuregraph',
        'MATCH (n) RETURN n'
      ]);
      expect(res).toEqual([['adjacent.resource'], [['file:///docB.md']]]);
    });
  });

  describe('upsertOKFNodeInDB', () => {
    it('should execute node and link merges', async () => {
      await upsertOKFNodeInDB({
        type: 'I-Wish Story',
        title: 'Story 1',
        resource: 'file:///story-1.md',
        timestamp: '2026-06-15',
        links_to: ['file:///prd.md']
      });

      expect(mockSendCommand).toHaveBeenCalledTimes(3); // 1 for story, 1 for prd target merge, 1 for links_to relation
    });
  });

  describe('lite-static fallback BFS traversal', () => {
    it('should correctly build adjacency list and traverse up to depth 2', async () => {
      // Create test files
      const outputDir = path.join(tempProjectRoot, '_iwish-output');
      await fs.ensureDir(outputDir);

      // Doc A
      await fs.writeFile(
        path.join(outputDir, 'docA.md'),
        `---
type: I-Wish PRD
title: Document A
resource: file:///mock/project/docA.md
timestamp: 2026-06-15
links_to: [_iwish-output/docB.md]
---
body`,
        'utf8'
      );

      // Doc B
      await fs.writeFile(
        path.join(outputDir, 'docB.md'),
        `---
type: I-Wish Story
title: Document B
resource: file:///mock/project/docB.md
timestamp: 2026-06-15
links_to: [_iwish-output/docC.md]
---
body`,
        'utf8'
      );

      // Doc C
      await fs.writeFile(
        path.join(outputDir, 'docC.md'),
        `---
type: I-Wish Bug Report
title: Document C
resource: file:///mock/project/docC.md
timestamp: 2026-06-15
links_to: []
---
body`,
        'utf8'
      );

      // Doc D (Unconnected)
      await fs.writeFile(
        path.join(outputDir, 'docD.md'),
        `---
type: I-Wish Story
title: Document D
resource: file:///mock/project/docD.md
timestamp: 2026-06-15
links_to: []
---
body`,
        'utf8'
      );

      const start = formatOKFUri(path.join(outputDir, 'docA.md'), tempProjectRoot);
      const results = getDepth2ResourcesStatic(start, tempProjectRoot);

      const expectedB = formatOKFUri(path.join(outputDir, 'docB.md'), tempProjectRoot);
      const expectedC = formatOKFUri(path.join(outputDir, 'docC.md'), tempProjectRoot);
      const expectedD = formatOKFUri(path.join(outputDir, 'docD.md'), tempProjectRoot);

      // Doc A is connected to B (depth 1) and C (depth 2 via B)
      expect(results).toContain(expectedB);
      expect(results).toContain(expectedC);

      // Unconnected Doc D should not be found
      expect(results).not.toContain(expectedD);
      expect(results.length).toBe(2);
    });
  });

  describe('getCompressedContextURIs', () => {
    it('should fallback to static scanner if database is offline', async () => {
      mockPing.mockRejectedValue(new Error('offline'));
      // Creating docA and docB in temp directory
      const outputDir = path.join(tempProjectRoot, '_iwish-output');
      await fs.ensureDir(outputDir);
      await fs.writeFile(
        path.join(outputDir, 'docA.md'),
        `---
type: I-Wish PRD
title: Document A
resource: file:///mock/project/docA.md
timestamp: 2026-06-15
links_to: [_iwish-output/docB.md]
---
`,
        'utf8'
      );
      await fs.writeFile(
        path.join(outputDir, 'docB.md'),
        `---
type: I-Wish Story
title: Document B
resource: file:///mock/project/docB.md
timestamp: 2026-06-15
links_to: []
---
`,
        'utf8'
      );

      const start = formatOKFUri(path.join(outputDir, 'docA.md'), tempProjectRoot);
      const result = await getCompressedContextURIs(start, tempProjectRoot);
      const expectedB = formatOKFUri(path.join(outputDir, 'docB.md'), tempProjectRoot);
      expect(result).toContain(expectedB);
      expect(result.length).toBe(1);
    });
  });
});
