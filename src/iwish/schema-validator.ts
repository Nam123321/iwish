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
