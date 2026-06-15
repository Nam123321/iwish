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
const schema_validator_1 = require("./schema-validator");
(0, vitest_1.describe)('schema-validator', () => {
    const projectRoot = path.resolve(__dirname, '..', '..');
    (0, vitest_1.describe)('validateOKFDocument', () => {
        (0, vitest_1.it)('should pass for a valid I-Wish Story frontmatter', () => {
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
            (0, vitest_1.expect)(() => (0, schema_validator_1.validateOKFDocument)(content, 'test-story.md', projectRoot)).not.toThrow();
        });
        (0, vitest_1.it)('should throw if YAML frontmatter block is missing', () => {
            const content = `# Story Title
Story body text without frontmatter.`;
            (0, vitest_1.expect)(() => (0, schema_validator_1.validateOKFDocument)(content, 'test-story.md', projectRoot))
                .toThrow('[Schema Validation Error] Missing YAML frontmatter block');
        });
        (0, vitest_1.it)('should throw if YAML is invalid', () => {
            const content = `---
type: I-Wish Story
title: "Invalid YAML
timestamp: "2026-06-15T11:00:00Z"
links_to: []
---
# Story Title`;
            (0, vitest_1.expect)(() => (0, schema_validator_1.validateOKFDocument)(content, 'test-story.md', projectRoot))
                .toThrow('[Schema Validation Error] Failed to parse frontmatter');
        });
        (0, vitest_1.it)('should throw if type is missing', () => {
            const content = `---
title: "Missing Type"
timestamp: "2026-06-15T11:00:00Z"
links_to: []
---
# Story Title`;
            (0, vitest_1.expect)(() => (0, schema_validator_1.validateOKFDocument)(content, 'test-story.md', projectRoot))
                .toThrow("[Schema Validation Error] Missing 'type' field in frontmatter");
        });
        (0, vitest_1.it)('should throw if type is not in the whitelist', () => {
            const content = `---
type: "I-Wish Invalid Type"
title: "Unknown Type"
timestamp: "2026-06-15T11:00:00Z"
links_to: []
---
# Story Title`;
            (0, vitest_1.expect)(() => (0, schema_validator_1.validateOKFDocument)(content, 'test-story.md', projectRoot))
                .toThrow("[Schema Validation Error] Unknown OKF type 'I-Wish Invalid Type'");
        });
        (0, vitest_1.it)('should throw if a required field is missing in common schema', () => {
            // 'timestamp' is required in common/all schemas
            const content = `---
type: I-Wish PRD
title: "Missing Timestamp"
links_to: []
---
# PRD Title`;
            (0, vitest_1.expect)(() => (0, schema_validator_1.validateOKFDocument)(content, 'test-prd.md', projectRoot))
                .toThrow("[Schema Validation Error] Missing required field 'timestamp'");
        });
        (0, vitest_1.it)('should throw if type in schema properties does not match', () => {
            const content = `---
type: I-Wish PRD
title: "Invalid Field Type"
timestamp: "2026-06-15T11:00:00Z"
links_to: "not-an-array"
---
# PRD Title`;
            (0, vitest_1.expect)(() => (0, schema_validator_1.validateOKFDocument)(content, 'test-prd.md', projectRoot))
                .toThrow("[Schema Validation Error] Field 'links_to' must be an array");
        });
        (0, vitest_1.it)('should throw if enum value is invalid', () => {
            const content = `---
type: I-Wish Story
title: "Invalid Enum Value"
timestamp: "2026-06-15T11:00:00Z"
links_to: []
sprintStatus: invalid_status
---
# Story Title`;
            (0, vitest_1.expect)(() => (0, schema_validator_1.validateOKFDocument)(content, 'test-story.md', projectRoot))
                .toThrow("[Schema Validation Error] Invalid value 'invalid_status' for field 'sprintStatus'");
        });
        (0, vitest_1.it)('should fallback to default schema validation if schema file is missing', () => {
            // Let's pass a non-existent projectRoot to force the fallback schema logic
            const content = `---
type: I-Wish PRD
title: "Fallback Test"
timestamp: "2026-06-15T11:00:00Z"
links_to: []
---
# PRD Title`;
            (0, vitest_1.expect)(() => (0, schema_validator_1.validateOKFDocument)(content, 'test-prd.md', '/non-existent-root')).not.toThrow();
        });
        (0, vitest_1.it)('should validate elements in arrays correctly', () => {
            const content = `---
type: I-Wish PRD
title: "Invalid Array Elements"
timestamp: "2026-06-15T11:00:00Z"
links_to: [123]
---
# PRD Title`;
            (0, vitest_1.expect)(() => (0, schema_validator_1.validateOKFDocument)(content, 'test-prd.md', projectRoot))
                .toThrow("Element at index 0 in field 'links_to' must be a string");
        });
    });
});
