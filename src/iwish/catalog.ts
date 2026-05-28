import * as fs from 'fs-extra';
import * as path from 'path';
import YAML from 'yaml';

import { REPO_ROOT, getRuntimeRoot } from './constants';
import { buildPlatformInventory } from './inventory';
import { loadRoutingProfiles } from './routing-profile';

export type KnowledgeNode = {
  id: string;
  type?: string;
  path?: string;
  description?: string;
  tags?: string[];
  depends_on?: string[];
};

export type CatalogEntry = {
  id: string;
  type: 'command' | 'agent' | 'skill' | 'workflow' | 'module' | 'tool' | 'alias';
  canonical: string;
  aliases: string[];
  description: string;
  tags: string[];
  source: string;
};

type AliasRegistry = {
  agents?: Record<string, string>;
  commands?: Record<string, string>;
};

type ExternalModuleRecord = {
  name: string;
  source: string;
  registeredAt: string;
  status: string;
  moduleClass?: string;
  registrationMode?: string;
  triggers?: string[];
  toolDependencies?: string[];
};

type ToolRegistry = {
  groups?: Array<{
    name: string;
    adapters?: Array<{
      id: string;
      description?: string;
    }>;
  }>;
};

const CANONICAL_COMMANDS: Array<{ command: string; description: string; tags: string[] }> = [
  { command: '/code', description: 'Implementation, bugfix, patch, and code change flow', tags: ['command', 'dev'] },
  { command: '/idea-challenge', description: 'Discover-phase concept challenge and Working Backwards flow', tags: ['command', 'discover', 'strategy', 'idea'] },
  { command: '/plan', description: 'Product planning, PRD, roadmap, and strategy flow', tags: ['command', 'planning', 'product'] },
  { command: '/make-story', description: 'Story and spec creation flow', tags: ['command', 'planning'] },
  { command: '/make-ui-spec', description: 'UI and design specification flow', tags: ['command', 'design'] },
  { command: '/review', description: 'Review and audit flow', tags: ['command', 'review'] },
  { command: '/research', description: 'Research flow', tags: ['command', 'research'] },
  { command: '/pivot-project', description: 'Mid-flight pivot and change-navigation flow', tags: ['command', 'pivot', 'change-navigation'] },
  { command: '/bootstrap-existing-project', description: 'Brownfield and existing-project bootstrap flow', tags: ['command', 'brownfield', 'bootstrap'] },
  { command: '/retro', description: 'Retrospective flow', tags: ['command', 'process'] },
  { command: '/status', description: 'Orchestration help and runtime status', tags: ['command', 'orchestration'] },
  { command: '/create-skill', description: 'Create a new skill, workflow, or agent package', tags: ['command', 'capability'] },
  { command: '/enhance-skill', description: 'Evolve or patch an existing skill, workflow, or agent package', tags: ['command', 'capability'] },
  { command: '/research-solution-sources', description: 'Research internal and external solution sources before create/enhance decisions', tags: ['command', 'research', 'capability'] },
  { command: '/register-skill-pack', description: 'Register an external skill pack, workflow pack, or open customization module', tags: ['command', 'capability', 'open-module'] },
  { command: '/absorb-repo', description: 'Open-module ingestion and repository absorption flow', tags: ['command', 'absorption'] },
  { command: '/canary', description: 'Canary deployment protocol and traffic gating flow', tags: ['command', 'deploy', 'release'] },
  { command: '/unique-advantage-evaluator', description: 'Evaluate competitive advantage, business moats, and strategic defensibility', tags: ['command', 'strategy', 'business'] },
  { command: '/make-data-spec', description: 'Database and data-schema specification flow', tags: ['command', 'data'] },
  { command: '/simulate-user', description: 'Simulate business persona user behavior and UX flows', tags: ['command', 'ux', 'testing'] },
  { command: '/fix-bug', description: '8-step hotfix and bug resolution process', tags: ['command', 'dev', 'maintenance'] },
  { command: '/codebase-health', description: 'Scan codebase structure for complexity, duplicates, and nops', tags: ['command', 'architecture', 'refactor'] },
];

function readYaml<T>(filePath: string): T {
  return YAML.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export function loadAliasRegistry(projectRoot: string): AliasRegistry {
  const runtimePath = path.join(getRuntimeRoot(projectRoot, 'iwish'), 'catalog', 'alias-registry.yaml');
  const templatePath = path.join(REPO_ROOT, 'templates', 'iwish', 'runtime', 'catalog', 'alias-registry.yaml');
  const chosen = fs.existsSync(runtimePath) ? runtimePath : templatePath;
  return readYaml<AliasRegistry>(chosen);
}

export function loadKnowledgeNodes(): KnowledgeNode[] {
  const graphPath = path.join(REPO_ROOT, '.agent', 'knowledge-graph.yaml');
  if (!fs.existsSync(graphPath)) {
    return [];
  }

  const doc = readYaml<{ nodes?: KnowledgeNode[] }>(graphPath);
  return doc.nodes || [];
}

export function buildCatalog(projectRoot: string): CatalogEntry[] {
  const aliases = loadAliasRegistry(projectRoot);
  const nodes = loadKnowledgeNodes();
  const inventory = buildPlatformInventory(projectRoot);
  const routingProfiles = loadRoutingProfiles(projectRoot);
  const entries: CatalogEntry[] = [];
  const externalModuleDir = path.join(getRuntimeRoot(projectRoot, 'iwish'), 'catalog', 'external-modules');
  const toolRegistryPath = path.join(REPO_ROOT, 'templates', 'iwish', 'runtime', 'tools', 'tool-registry.yaml');

  for (const [legacy, canonical] of Object.entries(aliases.agents || {})) {
    entries.push({
      id: `agent-alias:${legacy}`,
      type: 'agent',
      canonical,
      aliases: [legacy],
      description: `Legacy agent alias for ${canonical}`,
      tags: ['alias', 'agent'],
      source: 'alias-registry',
    });
  }

  for (const [legacy, canonical] of Object.entries(aliases.commands || {})) {
    entries.push({
      id: `command-alias:${legacy}`,
      type: 'command',
      canonical,
      aliases: [legacy],
      description: `Legacy command alias for ${canonical}`,
      tags: ['alias', 'command'],
      source: 'alias-registry',
    });
  }

  for (const command of CANONICAL_COMMANDS) {
    entries.push({
      id: `command:${command.command}`,
      type: 'command',
      canonical: command.command,
      aliases: [],
      description: command.description,
      tags: command.tags,
      source: 'canonical-command-registry',
    });
  }

  for (const agent of inventory.canonicalAgents) {
    entries.push({
      id: `canonical-agent:${agent}`,
      type: 'agent',
      canonical: agent,
      aliases: [],
      description: `Canonical I-Wish agent ${agent}`,
      tags: ['canonical', 'agent'],
      source: `/.agent/agents/${agent}.md`,
    });
  }

  for (const workflow of [...inventory.canonicalWorkflows, ...inventory.activeNonCanonicalWorkflows, ...inventory.legacyWorkflowEntrypoints]) {
    const tags = inventory.canonicalWorkflows.includes(workflow)
      ? ['workflow', 'canonical']
      : inventory.legacyWorkflowEntrypoints.includes(workflow)
        ? ['workflow', 'legacy']
        : ['workflow', 'active-non-canonical'];
    entries.push({
      id: `workflow:${workflow}`,
      type: 'workflow',
      canonical: workflow,
      aliases: [],
      description: `Workflow capability ${workflow}`,
      tags,
      source: `/.agent/workflows/${workflow}.md`,
    });
  }

  for (const skill of inventory.skills) {
    entries.push({
      id: `skill-package:${skill}`,
      type: 'skill',
      canonical: skill,
      aliases: [],
      description: `Skill package ${skill}`,
      tags: ['skill-package'],
      source: `/.agent/skills/${skill}/SKILL.md`,
    });
  }

  for (const pack of inventory.libraryPacks) {
    for (const skill of pack.skills) {
      entries.push({
        id: `library-skill:${pack.name}:${skill}`,
        type: 'skill',
        canonical: `${pack.name}:${skill}`,
        aliases: [],
        description: `Library-pack skill ${skill} from ${pack.name}`,
        tags: ['library-pack', pack.name],
        source: `/templates/library/${pack.name}/skills/${skill}.md`,
      });
    }
  }

  for (const node of nodes) {
    const nodeType = node.type === 'skill' ? 'skill' : node.type === 'context' ? 'workflow' : 'skill';
    entries.push({
      id: node.id,
      type: nodeType,
      canonical: node.id,
      aliases: [],
      description: node.description || '',
      tags: node.tags || [],
      source: node.path || 'knowledge-graph',
    });
  }

  if (fs.existsSync(externalModuleDir)) {
    const moduleFiles = fs.readdirSync(externalModuleDir).filter((entry) => entry.endsWith('.json'));
    for (const file of moduleFiles) {
      const record = fs.readJsonSync(path.join(externalModuleDir, file)) as ExternalModuleRecord;
      entries.push({
        id: `external-module:${path.basename(file, '.json')}`,
        type: 'module',
        canonical: record.name,
        aliases: [],
        description: `External module from ${record.source}`,
        tags: [record.moduleClass || 'external-module', record.registrationMode || 'register', ...(record.triggers || []), ...(record.toolDependencies || [])],
        source: record.source,
      });
    }
  }

  if (fs.existsSync(toolRegistryPath)) {
    const registry = readYaml<ToolRegistry>(toolRegistryPath);
    for (const group of registry.groups || []) {
      for (const adapter of group.adapters || []) {
        entries.push({
          id: `tool:${group.name}:${adapter.id}`,
          type: 'tool',
          canonical: adapter.id,
          aliases: [],
          description: adapter.description || `${adapter.id} adapter for ${group.name}`,
          tags: ['tool', group.name],
          source: 'tool-registry',
        });
      }
    }
  }

  const profileByCanonical = new Map<string, ReturnType<typeof loadRoutingProfiles>[number]>();
  for (const profile of routingProfiles) {
    profileByCanonical.set(profile.name, profile);
  }

  return entries.map((entry) => {
    const profile = profileByCanonical.get(entry.canonical);
    if (!profile) {
      return entry;
    }

    return {
      ...entry,
      description: profile.review_pack
        ? `${entry.description} [profiled via ${profile.review_pack}]`
        : entry.description,
      tags: Array.from(
        new Set([
          ...entry.tags,
          profile.role,
          profile.kind,
          profile.shape,
          ...profile.phases,
          ...profile.stages,
          ...profile.triggers,
          ...(profile.tags || []),
        ]),
      ),
      source: profile.source_path || entry.source,
    };
  });
}

export function searchCatalog(projectRoot: string, query: string): CatalogEntry[] {
  const normalized = query.toLowerCase();
  const words = normalized.split(/[^\p{L}\p{N}-]+/u).filter(Boolean);

  return buildCatalog(projectRoot)
    .map((entry) => {
      const haystack = [entry.canonical, entry.description, ...entry.tags, ...entry.aliases].join(' ').toLowerCase();
      const score = words.reduce((acc, word) => acc + (haystack.includes(word) ? 1 : 0), 0);
      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((item) => item.entry);
}
