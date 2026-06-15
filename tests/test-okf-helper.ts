import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { formatOKFUri, generateOKFHeader } from '../src/iwish/okf-helper';
import YAML from 'yaml';

describe('okf-helper', () => {
  const mockProjectRoot = '/mock/project/root';

  describe('formatOKFUri', () => {
    it('should return empty string if empty path provided', () => {
      expect(formatOKFUri('')).toBe('');
    });

    it('should return unchanged if already a URI or URL', () => {
      expect(formatOKFUri('file:///path/to/file.md')).toBe('file:///path/to/file.md');
      expect(formatOKFUri('https://example.com/docs.md')).toBe('https://example.com/docs.md');
    });

    it('should format a relative path to a file URL', () => {
      const result = formatOKFUri('subfolder/file.md', '/mock/project/root');
      expect(result).toBe('file:///mock/project/root/subfolder/file.md');
    });

    it('should format an absolute path to a file URL', () => {
      const result = formatOKFUri('/some/absolute/path/file.md', '/mock/project/root');
      expect(result).toBe('file:///some/absolute/path/file.md');
    });

    it('should handle special characters and spaces correctly', () => {
      const result = formatOKFUri('my folder/file name.md', '/mock/project');
      expect(result).toBe('file:///mock/project/my%20folder/file%20name.md');
    });
  });

  describe('generateOKFHeader', () => {
    it('should generate a standard OKF header with fallback values', () => {
      const header = generateOKFHeader({
        title: 'Test Title',
      }, '/mock/project');

      const match = header.match(/^---\n([\s\S]*?)\n---/);
      expect(match).not.toBeNull();

      const parsed = YAML.parse(match![1]);
      expect(parsed.type).toBe('I-Wish Concept');
      expect(parsed.title).toBe('Test Title');
      expect(parsed.tags).toEqual([]);
      expect(parsed.links_to).toEqual([]);
      expect(parsed.timestamp).toBeDefined();
    });

    it('should generate a full OKF header with all fields provided', () => {
      const now = new Date().toISOString();
      const header = generateOKFHeader({
        type: 'I-Wish Story',
        title: 'Implements OKF',
        description: 'Goal to standardize metadata',
        resource: 'stories/story-15.1.md',
        tags: ['story', 'okf'],
        timestamp: now,
        links_to: ['prd/okf-prd.md'],
      }, '/mock/project');

      const match = header.match(/^---\n([\s\S]*?)\n---/);
      expect(match).not.toBeNull();

      const parsed = YAML.parse(match![1]);
      expect(parsed.type).toBe('I-Wish Story');
      expect(parsed.title).toBe('Implements OKF');
      expect(parsed.description).toBe('Goal to standardize metadata');
      expect(parsed.resource).toBe('file:///mock/project/stories/story-15.1.md');
      expect(parsed.tags).toEqual(['story', 'okf']);
      expect(parsed.timestamp).toBe(now);
      expect(parsed.links_to).toEqual(['file:///mock/project/prd/okf-prd.md']);
    });
  });
});
