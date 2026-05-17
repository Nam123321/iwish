import * as fs from 'fs-extra';
import * as path from 'path';
import YAML from 'yaml';

import { INSTALL_TARGET_CATALOG, LEGACY_AGENT_ALIASES, REPO_ROOT, SUPPORTED_INSTALL_TARGETS } from './constants';
import { loadRoutingProfiles } from './routing-profile';

export type PlatformInventory = {
  skills: string[];
  routingProfiles: string[];
  agents: string[];
  canonicalAgents: string[];
  legacyPersonaAgents: string[];
  transitionalFunctionAgents: string[];
  workflows: string[];
  canonicalWorkflows: string[];
  legacyWorkflowEntrypoints: string[];
  workflowStepFiles: string[];
  workflowTemplates: string[];
  workflowSupportAssets: string[];
  activeNonCanonicalWorkflows: string[];
  libraryPacks: Array<{
    name: string;
    skills: string[];
    workflows: string[];
    agents: string[];
  }>;
  tools: Array<{
    group: string;
    adapters: string[];
  }>;
  installTargets: string[];
  plannedInstallTargets: string[];
};

type ToolRegistry = {
  groups?: Array<{
    name: string;
    adapters?: Array<{
      id: string;
    }>;
  }>;
};

const CANONICAL_WORKFLOW_NAMES = new Set([
  'code',
  'idea-challenge',
  'make-story',
  'make-ui-spec',
  'review',
  'plan',
  'research',
  'pivot-project',
  'bootstrap-existing-project',
  'retro',
  'status',
  'create-skill',
  'enhance-skill',
  'research-solution-sources',
  'register-skill-pack',
  'absorb-repo',
]);

const TRANSITIONAL_FUNCTION_AGENT_NAMES = new Set(['data-architect', 'data-strategist']);
const LEGACY_PERSONA_WORKFLOW_NAMES = new Set(Object.keys(LEGACY_AGENT_ALIASES));

function isLegacyPersonaAgent(name: string): boolean {
  return !name.endsWith('-agent') && name !== 'orch-agent' && !TRANSITIONAL_FUNCTION_AGENT_NAMES.has(name);
}

function isLegacyWorkflowEntrypoint(name: string): boolean {
  return (
    name.startsWith('bmad-') ||
    name === 'create-capability' ||
    name === 'enhance-capability' ||
    name === 'course-correct' ||
    LEGACY_PERSONA_WORKFLOW_NAMES.has(name)
  );
}

function isWorkflowStepFile(name: string): boolean {
  return name.startsWith('step-');
}

function isWorkflowTemplate(name: string): boolean {
  return name.includes('template') || name.endsWith('.template');
}

function isWorkflowSupportAsset(name: string): boolean {
  return [
    'workflow',
    'workflow-entry',
    'workflow-engine',
    'instructions',
    'checklist',
    'prototype',
    'deep-dive',
    'full-scan',
    'project-types',
    'documentation-requirements',
    'domain-complexity',
  ].some((prefix) => name === prefix || name.startsWith(`${prefix}-`) || name.endsWith(`-${prefix}`));
}

function listBasenames(dirPath: string, matcher: (entry: string) => boolean): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath)
    .filter(matcher)
    .map((entry) => matcher(entry) && entry.endsWith('.md') ? path.basename(entry, '.md') : entry)
    .sort();
}

function listSkillDirs(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath)
    .filter((entry) => fs.statSync(path.join(dirPath, entry)).isDirectory())
    .filter((entry) => fs.existsSync(path.join(dirPath, entry, 'SKILL.md')))
    .sort();
}

export function buildPlatformInventory(projectRoot: string): PlatformInventory {
  const skills = listSkillDirs(path.join(projectRoot, '.agent', 'skills'));
  const routingProfiles = loadRoutingProfiles(projectRoot).map((profile) => profile.id).sort();
  const agents = listBasenames(path.join(projectRoot, '.agent', 'agents'), (entry) => entry.endsWith('.md'));
  const workflows = listBasenames(path.join(projectRoot, '.agent', 'workflows'), (entry) => entry.endsWith('.md'));
  const canonicalAgents = agents.filter((name) => name.endsWith('-agent') || name === 'orch-agent').sort();
  const legacyPersonaAgents = agents.filter((name) => isLegacyPersonaAgent(name)).sort();
  const transitionalFunctionAgents = agents.filter((name) => TRANSITIONAL_FUNCTION_AGENT_NAMES.has(name)).sort();
  const canonicalWorkflows = workflows.filter((name) => CANONICAL_WORKFLOW_NAMES.has(name)).sort();
  const legacyWorkflowEntrypoints = workflows.filter((name) => isLegacyWorkflowEntrypoint(name)).sort();
  const workflowStepFiles = workflows.filter((name) => isWorkflowStepFile(name)).sort();
  const workflowTemplates = workflows.filter((name) => isWorkflowTemplate(name)).sort();
  const workflowSupportAssets = workflows.filter((name) => isWorkflowSupportAsset(name)).sort();
  const activeNonCanonicalWorkflows = workflows
    .filter((name) =>
      !canonicalWorkflows.includes(name) &&
      !legacyWorkflowEntrypoints.includes(name) &&
      !workflowStepFiles.includes(name) &&
      !workflowTemplates.includes(name) &&
      !workflowSupportAssets.includes(name),
    )
    .sort();

  const libraryRoot = path.join(projectRoot, 'templates', 'library');
  const libraryPacks = fs.existsSync(libraryRoot)
    ? fs
        .readdirSync(libraryRoot)
        .filter((entry) => fs.statSync(path.join(libraryRoot, entry)).isDirectory())
        .sort()
        .map((entry) => ({
          name: entry,
          skills: listBasenames(path.join(libraryRoot, entry, 'skills'), (item) => item.endsWith('.md')),
          workflows: listBasenames(path.join(libraryRoot, entry, 'workflows'), (item) => item.endsWith('.md')),
          agents: listBasenames(path.join(libraryRoot, entry, 'agents'), (item) => item.endsWith('.md')),
        }))
    : [];

  const toolRegistryPath = path.join(REPO_ROOT, 'templates', 'iwish', 'runtime', 'tools', 'tool-registry.yaml');
  const toolRegistry = fs.existsSync(toolRegistryPath)
    ? (YAML.parse(fs.readFileSync(toolRegistryPath, 'utf8')) as ToolRegistry)
    : { groups: [] };

  const tools = (toolRegistry.groups || []).map((group) => ({
    group: group.name,
    adapters: (group.adapters || []).map((adapter) => adapter.id),
  }));

  return {
    skills,
    routingProfiles,
    agents,
    canonicalAgents,
    legacyPersonaAgents,
    transitionalFunctionAgents,
    workflows,
    canonicalWorkflows,
    legacyWorkflowEntrypoints,
    workflowStepFiles,
    workflowTemplates,
    workflowSupportAssets,
    activeNonCanonicalWorkflows,
    libraryPacks,
    tools,
    installTargets: [...SUPPORTED_INSTALL_TARGETS],
    plannedInstallTargets: INSTALL_TARGET_CATALOG.filter((entry) => entry.status === 'planned').map((entry) => entry.id),
  };
}
