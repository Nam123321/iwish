import * as fs from 'fs-extra';
import * as path from 'path';
import YAML from 'yaml';

export interface AgentMetadata {
  name: string;
  description?: string;
  inputs: string[];
  outputs: string[];
  mcp_tools_required: string[];
  subagent_triggers: string[];
}

export function validateFrontmatter(content: string, filePath: string): AgentMetadata {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    throw new Error(`[Schema Validation Error] Missing YAML frontmatter block in ${filePath}`);
  }

  let parsed: any;
  try {
    parsed = YAML.parse(match[1]);
  } catch (error: any) {
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

export const OKF_TYPES_WHITELIST = [
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

function getSchemaFilename(type: string): string {
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
export function validateOKFDocument(content: string, filePath: string, projectRoot: string = process.cwd()): void {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    throw new Error(`[Schema Validation Error] Missing YAML frontmatter block in ${filePath}`);
  }

  let parsed: any;
  try {
    parsed = YAML.parse(match[1]);
  } catch (error: any) {
    throw new Error(`[Schema Validation Error] Failed to parse frontmatter in ${filePath}: ${error.message}`);
  }

  if (!parsed) {
    throw new Error(`[Schema Validation Error] Empty frontmatter block in ${filePath}`);
  }

  const type = parsed.type;
  if (!type) {
    throw new Error(`[Schema Validation Error] Missing 'type' field in frontmatter of ${filePath}`);
  }

  if (!OKF_TYPES_WHITELIST.includes(type)) {
    throw new Error(`[Schema Validation Error] Unknown OKF type '${type}' in ${filePath}. Whitelisted types are: ${OKF_TYPES_WHITELIST.join(', ')}`);
  }

  const schemaFilename = getSchemaFilename(type);
  const schemaPath = path.join(projectRoot, '.agent', 'configs', 'schemas', schemaFilename);

  let schema: any;
  if (fs.existsSync(schemaPath)) {
    try {
      schema = fs.readJsonSync(schemaPath);
    } catch (error: any) {
      throw new Error(`[Schema Validation Error] Failed to read schema file ${schemaPath}: ${error.message}`);
    }
  } else {
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
    for (const [key, propSchema] of Object.entries<any>(schema.properties)) {
      const val = parsed[key];
      if (val === undefined || val === null) {
        continue; // Optional field not provided is fine
      }

      // Validate type
      if (propSchema.type === 'string') {
        if (typeof val !== 'string') {
          throw new Error(`[Schema Validation Error] Field '${key}' must be a string in ${filePath}, got ${typeof val}`);
        }
      } else if (propSchema.type === 'array') {
        if (!Array.isArray(val)) {
          throw new Error(`[Schema Validation Error] Field '${key}' must be an array in ${filePath}`);
        }
        if (propSchema.items && propSchema.items.type === 'string') {
          for (let i = 0; i < val.length; i++) {
            if (typeof val[i] !== 'string') {
              throw new Error(`[Schema Validation Error] Element at index ${i} in field '${key}' must be a string in ${filePath}`);
            }
          }
        } else if (propSchema.items && propSchema.items.type === 'number') {
          for (let i = 0; i < val.length; i++) {
            if (typeof val[i] !== 'number') {
              throw new Error(`[Schema Validation Error] Element at index ${i} in field '${key}' must be a number in ${filePath}`);
            }
          }
        }
      } else if (propSchema.type === 'number') {
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
