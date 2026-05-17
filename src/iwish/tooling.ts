import * as fs from 'fs-extra';
import * as path from 'path';
import YAML from 'yaml';

import { REPO_ROOT } from './constants';

export type ToolRegistryAdapter = {
  id: string;
  description?: string;
  usage_pack_status?: string;
};

export type ToolRegistryGroup = {
  name: string;
  recommended?: string;
  adapters?: ToolRegistryAdapter[];
};

export type ToolRegistry = {
  groups?: ToolRegistryGroup[];
};

export type ToolSetupPrompt = {
  group: string;
  reason: string;
  recommended: string | null;
  currentSelection: string | null;
  options: Array<{
    id: string;
    description: string;
    usagePackStatus: string | null;
  }>;
  allowsOther: boolean;
};

function readYaml<T>(filePath: string): T {
  return YAML.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export function loadToolRegistry(): ToolRegistry {
  const filePath = path.join(REPO_ROOT, 'templates', 'iwish', 'runtime', 'tools', 'tool-registry.yaml');
  return readYaml<ToolRegistry>(filePath);
}

export function getToolRegistryGroup(groupName: string): ToolRegistryGroup | null {
  return (loadToolRegistry().groups || []).find((group) => group.name === groupName) || null;
}

export function resolveToolGroup(input: string): { group: string; adapterId: string | null } | null {
  const registry = loadToolRegistry();
  for (const group of registry.groups || []) {
    if (group.name === input) {
      return { group: group.name, adapterId: null };
    }
    for (const adapter of group.adapters || []) {
      if (adapter.id === input) {
        return { group: group.name, adapterId: adapter.id };
      }
    }
  }
  return null;
}

export function buildToolSetupPrompts(requiredInputs: string[], currentSelections: Record<string, string>): ToolSetupPrompt[] {
  const prompts: ToolSetupPrompt[] = [];
  const seen = new Set<string>();

  for (const input of requiredInputs) {
    const resolved = resolveToolGroup(input);
    if (!resolved) {
      continue;
    }
    const groupInfo = getToolRegistryGroup(resolved.group);
    if (!groupInfo || seen.has(resolved.group)) {
      continue;
    }

    const currentSelection = currentSelections[resolved.group] || null;
    const adapterRequired = resolved.adapterId;
    const needsPrompt =
      currentSelection === null ||
      (adapterRequired !== null && currentSelection !== adapterRequired);

    if (!needsPrompt) {
      continue;
    }

    seen.add(resolved.group);
    prompts.push({
      group: resolved.group,
      reason:
        adapterRequired && currentSelection && currentSelection !== adapterRequired
          ? `This flow expects adapter '${adapterRequired}', but '${currentSelection}' is currently selected.`
          : adapterRequired
            ? `This flow expects adapter '${adapterRequired}'.`
            : `This flow requires a '${resolved.group}' tool selection before execution.`,
      recommended: adapterRequired || groupInfo.recommended || null,
      currentSelection,
      options: (groupInfo.adapters || []).map((adapter) => ({
        id: adapter.id,
        description: adapter.description || '',
        usagePackStatus: adapter.usage_pack_status || null,
      })),
      allowsOther: true,
    });
  }

  return prompts;
}
