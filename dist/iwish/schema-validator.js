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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OKF_TYPES_WHITELIST = void 0;
exports.validateFrontmatter = validateFrontmatter;
exports.validateOKFDocument = validateOKFDocument;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const yaml_1 = __importDefault(require("yaml"));
function validateFrontmatter(content, filePath) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
        throw new Error(`[Schema Validation Error] Missing YAML frontmatter block in ${filePath}`);
    }
    let parsed;
    try {
        parsed = yaml_1.default.parse(match[1]);
    }
    catch (error) {
        throw new Error(`[Schema Validation Error] Failed to parse frontmatter in ${filePath}: ${error.message}`);
    }
    if (!parsed) {
        throw new Error(`[Schema Validation Error] Empty frontmatter block in ${filePath}`);
    }
    const requiredArrays = ['inputs', 'outputs', 'mcp_tools_required', 'subagent_triggers'];
    for (const field of requiredArrays) {
        if (parsed[field] === undefined) {
            throw new Error(`[Schema Validation Error] Missing required field '${field}' in ${filePath}`);
        }
        if (!Array.isArray(parsed[field])) {
            throw new Error(`[Schema Validation Error] Field '${field}' must be an array in ${filePath}`);
        }
    }
    return {
        name: String(parsed.name || ''),
        description: parsed.description ? String(parsed.description) : undefined,
        inputs: parsed.inputs.map(String),
        outputs: parsed.outputs.map(String),
        mcp_tools_required: parsed.mcp_tools_required.map(String),
        subagent_triggers: parsed.subagent_triggers.map(String)
    };
}
exports.OKF_TYPES_WHITELIST = [
    'I-Wish Idea',
    'I-Wish Research Report',
    'I-Wish PRD',
    'I-Wish UI Spec',
    'I-Wish Data Spec',
    'I-Wish Architecture Spec',
    'I-Wish Story',
    'I-Wish Skill Package',
    'I-Wish Workflow',
    'I-Wish Component',
    'I-Wish Bug Report',
    'I-Wish Pivot Log',
    'I-Wish Project Expansion Report',
    'I-Wish Release Walkthrough',
    'I-Wish Retrospective',
    'I-Wish Product Strategy',
    'I-Wish Epic Breakdown',
    'I-Wish Reconciliation Work Item'
];
function getSchemaFilename(type) {
    switch (type) {
        case 'I-Wish PRD':
            return 'prd-schema.json';
        case 'I-Wish Story':
            return 'story-schema.json';
        case 'I-Wish Bug Report':
            return 'bug-schema.json';
        case 'I-Wish Pivot Log':
            return 'pivot-schema.json';
        case 'I-Wish Project Expansion Report':
            return 'per-schema.json';
        case 'I-Wish Reconciliation Work Item':
            return 'reconciliation-schema.json';
        case 'I-Wish Component':
            return 'component-schema.json';
        default:
            return 'common-schema.json';
    }
}
/**
 * Validates an OKF Markdown file's frontmatter against its matching JSON Schema.
 */
function validateOKFDocument(content, filePath, projectRoot = process.cwd()) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
        throw new Error(`[Schema Validation Error] Missing YAML frontmatter block in ${filePath}`);
    }
    let parsed;
    try {
        parsed = yaml_1.default.parse(match[1]);
    }
    catch (error) {
        throw new Error(`[Schema Validation Error] Failed to parse frontmatter in ${filePath}: ${error.message}`);
    }
    if (!parsed) {
        throw new Error(`[Schema Validation Error] Empty frontmatter block in ${filePath}`);
    }
    const type = parsed.type;
    if (!type) {
        throw new Error(`[Schema Validation Error] Missing 'type' field in frontmatter of ${filePath}`);
    }
    if (!exports.OKF_TYPES_WHITELIST.includes(type)) {
        throw new Error(`[Schema Validation Error] Unknown OKF type '${type}' in ${filePath}. Whitelisted types are: ${exports.OKF_TYPES_WHITELIST.join(', ')}`);
    }
    const schemaFilename = getSchemaFilename(type);
    const schemaPath = path.join(projectRoot, '.agent', 'configs', 'schemas', schemaFilename);
    let schema;
    if (fs.existsSync(schemaPath)) {
        try {
            schema = fs.readJsonSync(schemaPath);
        }
        catch (error) {
            throw new Error(`[Schema Validation Error] Failed to read schema file ${schemaPath}: ${error.message}`);
        }
    }
    else {
        // Zero-dependency fallback if schema file is missing
        schema = {
            type: 'object',
            properties: {
                type: { type: 'string' },
                title: { type: 'string' },
                timestamp: { type: 'string' },
                links_to: { type: 'array', items: { type: 'string' } }
            },
            required: ['type', 'title', 'timestamp', 'links_to']
        };
    }
    // Validate required fields
    if (Array.isArray(schema.required)) {
        for (const requiredField of schema.required) {
            if (parsed[requiredField] === undefined || parsed[requiredField] === null) {
                throw new Error(`[Schema Validation Error] Missing required field '${requiredField}' in ${filePath}`);
            }
        }
    }
    // Validate properties
    if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
            const val = parsed[key];
            if (val === undefined || val === null) {
                continue; // Optional field not provided is fine
            }
            // Validate type
            if (propSchema.type === 'string') {
                if (typeof val !== 'string') {
                    throw new Error(`[Schema Validation Error] Field '${key}' must be a string in ${filePath}, got ${typeof val}`);
                }
            }
            else if (propSchema.type === 'array') {
                if (!Array.isArray(val)) {
                    throw new Error(`[Schema Validation Error] Field '${key}' must be an array in ${filePath}`);
                }
                if (propSchema.items && propSchema.items.type === 'string') {
                    for (let i = 0; i < val.length; i++) {
                        if (typeof val[i] !== 'string') {
                            throw new Error(`[Schema Validation Error] Element at index ${i} in field '${key}' must be a string in ${filePath}`);
                        }
                    }
                }
                else if (propSchema.items && propSchema.items.type === 'number') {
                    for (let i = 0; i < val.length; i++) {
                        if (typeof val[i] !== 'number') {
                            throw new Error(`[Schema Validation Error] Element at index ${i} in field '${key}' must be a number in ${filePath}`);
                        }
                    }
                }
            }
            else if (propSchema.type === 'number') {
                if (typeof val !== 'number') {
                    throw new Error(`[Schema Validation Error] Field '${key}' must be a number in ${filePath}`);
                }
            }
            // Validate enum
            if (Array.isArray(propSchema.enum)) {
                if (!propSchema.enum.includes(val)) {
                    throw new Error(`[Schema Validation Error] Invalid value '${val}' for field '${key}' in ${filePath}. Allowed values are: ${propSchema.enum.join(', ')}`);
                }
            }
        }
    }
}
