"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFrontmatter = validateFrontmatter;
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
