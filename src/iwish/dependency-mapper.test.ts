/**
 * dependency-mapper.test.ts — Unit tests for Story 10.1
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import {
  collectEpicInterfaces,
} from './interface-lock';
import {
  analyzeDependencies,
  type DAGResult,
} from './dependency-mapper';

// ---------------------------------------------------------------------------
// Helper: create a temp project with story files
// ---------------------------------------------------------------------------
const TEMP_DIR = path.join(__dirname, '..', '..', '_test-temp-dm');

function createStoryFile(storyId: string, content: string): void {
  const dir = path.join(TEMP_DIR, '_iwish-output', 'stories');
  fs.ensureDirSync(dir);
  fs.writeFileSync(path.join(dir, `${storyId}.md`), content, 'utf8');
}

describe('dependency-mapper', () => {
  beforeEach(() => {
    fs.ensureDirSync(TEMP_DIR);
    fs.ensureDirSync(path.join(TEMP_DIR, '_iwish-output', 'stories'));
  });

  afterEach(() => {
    fs.removeSync(TEMP_DIR);
  });

  describe('analyzeDependencies', () => {
    it('should produce a valid DAG for independent stories', async () => {
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

      const result = await analyzeDependencies('1', {
        projectRoot: TEMP_DIR,
        confidenceThreshold: 0.9,
      });

      expect(result).toBeDefined();
      expect(result.nodes).toHaveLength(2);
      expect(result.execution_waves).toHaveLength(1);
      expect(result.execution_waves[0]).toHaveLength(2);
      expect(result.summary.independent).toBe(2);
      expect(result.summary.dependent).toBe(0);
    });

    it('should detect explicit dependencies', async () => {
      createStoryFile('story-2.1', `# Story 2.1: Base Module
## depends_on: []
`);
      createStoryFile('story-2.2', `# Story 2.2: Dependent Module
## depends_on:
- story-2.1
## AC
- AC1: Given Story 2.1 đã hoàn tất, build feature
`);

      const result = await analyzeDependencies('2', {
        projectRoot: TEMP_DIR,
        confidenceThreshold: 0.9,
      });

      expect(result.nodes).toHaveLength(2);
      expect(result.execution_waves).toHaveLength(2);
      expect(result.execution_waves[0]).toContain('story-2.1');
      expect(result.execution_waves[1]).toContain('story-2.2');

      const depNode = result.nodes.find((n) => n.id === 'story-2.2');
      expect(depNode?.classification).toBe('dependent');
      expect(depNode?.depends_on).toContain('story-2.1');
    });

    it('should produce correct wave ordering for a chain A→B→C', async () => {
      createStoryFile('story-3.1', '# Story 3.1\n## depends_on: []\n## AC\n- AC1: Build base\n');
      createStoryFile('story-3.2', '# Story 3.2\n## depends_on:\n  - story-3.1\n## AC\n- AC1: Given Story 3.1 đã hoàn tất, build layer 2\n');
      createStoryFile('story-3.3', '# Story 3.3\n## depends_on:\n  - story-3.2\n## AC\n- AC1: Given Story 3.2 đã hoàn tất, build layer 3\n');

      const result = await analyzeDependencies('3', {
        projectRoot: TEMP_DIR,
        confidenceThreshold: 0.9,
      });

      expect(result.execution_waves.length).toBeGreaterThanOrEqual(2);
      // story-3.1 should be in wave 1, story-3.3 should be in the last wave
      expect(result.execution_waves[0]).toContain('story-3.1');
      const lastWave = result.execution_waves[result.execution_waves.length - 1];
      expect(lastWave).toContain('story-3.3');
    });

    it('should throw for empty epic', async () => {
      await expect(
        analyzeDependencies('99', { projectRoot: TEMP_DIR }),
      ).rejects.toThrow();
    });
  });
});
