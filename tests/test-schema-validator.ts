import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { validateOKFDocument, OKF_TYPES_WHITELIST } from '../src/iwish/schema-validator';

describe('schema-validator', () => {
  const projectRoot = path.resolve(__dirname, '..');

  describe('validateOKFDocument', () => {
    it('should pass for a valid I-Wish Story frontmatter', () => {
      const content = `---
type: I-Wish Story
title: "Strict Schema Validation"
description: "Verify schemas"
resource: "file:///Users/hatrang20061988/Desktop/AI Project/iwish/stories/story-15.2.md"
tags: ["validation", "schemas"]
timestamp: "2026-06-15T11:00:00Z"
links_to: []
sprintStatus: in_progress
---
# Story Title
Story body text.`;

      expect(() => validateOKFDocument(content, 'test-story.md', projectRoot)).not.toThrow();
    });

    it('should throw if YAML frontmatter block is missing', () => {
      const content = `# Story Title
Story body text without frontmatter.`;

      expect(() => validateOKFDocument(content, 'test-story.md', projectRoot))
        .toThrow('[Schema Validation Error] Missing YAML frontmatter block');
    });

    it('should throw if YAML is invalid', () => {
      const content = `---
type: I-Wish Story
title: "Invalid YAML
timestamp: "2026-06-15T11:00:00Z"
links_to: []
---
# Story Title`;

      expect(() => validateOKFDocument(content, 'test-story.md', projectRoot))
        .toThrow('[Schema Validation Error] Failed to parse frontmatter');
    });

    it('should throw if type is missing', () => {
      const content = `---
title: "Missing Type"
timestamp: "2026-06-15T11:00:00Z"
links_to: []
---
# Story Title`;

      expect(() => validateOKFDocument(content, 'test-story.md', projectRoot))
        .toThrow("[Schema Validation Error] Missing 'type' field in frontmatter");
    });

    it('should throw if type is not in the whitelist', () => {
      const content = `---
type: "I-Wish Invalid Type"
title: "Unknown Type"
timestamp: "2026-06-15T11:00:00Z"
links_to: []
---
# Story Title`;

      expect(() => validateOKFDocument(content, 'test-story.md', projectRoot))
        .toThrow("[Schema Validation Error] Unknown OKF type 'I-Wish Invalid Type'");
    });

    it('should throw if a required field is missing in common schema', () => {
      // 'timestamp' is required in common/all schemas
      const content = `---
type: I-Wish PRD
title: "Missing Timestamp"
links_to: []
---
# PRD Title`;

      expect(() => validateOKFDocument(content, 'test-prd.md', projectRoot))
        .toThrow("[Schema Validation Error] Missing required field 'timestamp'");
    });

    it('should throw if type in schema properties does not match', () => {
      const content = `---
type: I-Wish PRD
title: "Invalid Field Type"
timestamp: "2026-06-15T11:00:00Z"
links_to: "not-an-array"
---
# PRD Title`;

      expect(() => validateOKFDocument(content, 'test-prd.md', projectRoot))
        .toThrow("[Schema Validation Error] Field 'links_to' must be an array");
    });

    it('should throw if enum value is invalid', () => {
      const content = `---
type: I-Wish Story
title: "Invalid Enum Value"
timestamp: "2026-06-15T11:00:00Z"
links_to: []
sprintStatus: invalid_status
---
# Story Title`;

      expect(() => validateOKFDocument(content, 'test-story.md', projectRoot))
        .toThrow("[Schema Validation Error] Invalid value 'invalid_status' for field 'sprintStatus'");
    });

    it('should fallback to default schema validation if schema file is missing', () => {
      // Let's pass a non-existent projectRoot to force the fallback schema logic
      const content = `---
type: I-Wish PRD
title: "Fallback Test"
timestamp: "2026-06-15T11:00:00Z"
links_to: []
---
# PRD Title`;

      expect(() => validateOKFDocument(content, 'test-prd.md', '/non-existent-root')).not.toThrow();
    });

    it('should validate elements in arrays correctly', () => {
      const content = `---
type: I-Wish PRD
title: "Invalid Array Elements"
timestamp: "2026-06-15T11:00:00Z"
links_to: [123]
---
# PRD Title`;

      expect(() => validateOKFDocument(content, 'test-prd.md', projectRoot))
        .toThrow("Element at index 0 in field 'links_to' must be a string");
    });
  });
});
