"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const okf_helper_1 = require("./okf-helper");
const yaml_1 = __importDefault(require("yaml"));
(0, vitest_1.describe)('okf-helper', () => {
    const mockProjectRoot = '/mock/project/root';
    (0, vitest_1.describe)('formatOKFUri', () => {
        (0, vitest_1.it)('should return empty string if empty path provided', () => {
            (0, vitest_1.expect)((0, okf_helper_1.formatOKFUri)('')).toBe('');
        });
        (0, vitest_1.it)('should return unchanged if already a URI or URL', () => {
            (0, vitest_1.expect)((0, okf_helper_1.formatOKFUri)('file:///path/to/file.md')).toBe('file:///path/to/file.md');
            (0, vitest_1.expect)((0, okf_helper_1.formatOKFUri)('https://example.com/docs.md')).toBe('https://example.com/docs.md');
        });
        (0, vitest_1.it)('should format a relative path to a file URL', () => {
            const result = (0, okf_helper_1.formatOKFUri)('subfolder/file.md', '/mock/project/root');
            (0, vitest_1.expect)(result).toBe('file:///mock/project/root/subfolder/file.md');
        });
        (0, vitest_1.it)('should format an absolute path to a file URL', () => {
            const result = (0, okf_helper_1.formatOKFUri)('/some/absolute/path/file.md', '/mock/project/root');
            (0, vitest_1.expect)(result).toBe('file:///some/absolute/path/file.md');
        });
        (0, vitest_1.it)('should handle special characters and spaces correctly', () => {
            const result = (0, okf_helper_1.formatOKFUri)('my folder/file name.md', '/mock/project');
            (0, vitest_1.expect)(result).toBe('file:///mock/project/my%20folder/file%20name.md');
        });
    });
    (0, vitest_1.describe)('generateOKFHeader', () => {
        (0, vitest_1.it)('should generate a standard OKF header with fallback values', () => {
            const header = (0, okf_helper_1.generateOKFHeader)({
                title: 'Test Title',
            }, '/mock/project');
            const match = header.match(/^---\n([\s\S]*?)\n---/);
            (0, vitest_1.expect)(match).not.toBeNull();
            const parsed = yaml_1.default.parse(match[1]);
            (0, vitest_1.expect)(parsed.type).toBe('I-Wish Concept');
            (0, vitest_1.expect)(parsed.title).toBe('Test Title');
            (0, vitest_1.expect)(parsed.tags).toEqual([]);
            (0, vitest_1.expect)(parsed.links_to).toEqual([]);
            (0, vitest_1.expect)(parsed.timestamp).toBeDefined();
        });
        (0, vitest_1.it)('should generate a full OKF header with all fields provided', () => {
            const now = new Date().toISOString();
            const header = (0, okf_helper_1.generateOKFHeader)({
                type: 'I-Wish Story',
                title: 'Implements OKF',
                description: 'Goal to standardize metadata',
                resource: 'stories/story-15.1.md',
                tags: ['story', 'okf'],
                timestamp: now,
                links_to: ['prd/okf-prd.md'],
            }, '/mock/project');
            const match = header.match(/^---\n([\s\S]*?)\n---/);
            (0, vitest_1.expect)(match).not.toBeNull();
            const parsed = yaml_1.default.parse(match[1]);
            (0, vitest_1.expect)(parsed.type).toBe('I-Wish Story');
            (0, vitest_1.expect)(parsed.title).toBe('Implements OKF');
            (0, vitest_1.expect)(parsed.description).toBe('Goal to standardize metadata');
            (0, vitest_1.expect)(parsed.resource).toBe('file:///mock/project/stories/story-15.1.md');
            (0, vitest_1.expect)(parsed.tags).toEqual(['story', 'okf']);
            (0, vitest_1.expect)(parsed.timestamp).toBe(now);
            (0, vitest_1.expect)(parsed.links_to).toEqual(['file:///mock/project/prd/okf-prd.md']);
        });
    });
});
