import * as fs from 'fs-extra';
import * as path from 'path';
import YAML from 'yaml';

import { getRuntimeRoot } from './constants';

export type RoutingProfileRole = 'process-primary' | 'supportive' | 'foundational';
export type RoutingProfileKind = 'skill' | 'workflow' | 'agent' | 'external-module' | 'repo-absorption';

export type RoutingProfile = {
  id: string;
  name: string;
  kind: RoutingProfileKind;
  shape: string;
  role: RoutingProfileRole;
  phases: string[];
  stages: string[];
  triggers: string[];
  anti_triggers: string[];
  primary_agents: string[];
  primary_workflows: string[];
  supportive_skills: string[];
  tool_dependencies: string[];
  constraints: string[];
  review_pack?: string;
  source_path?: string;
  story_refs?: string[];
  tags?: string[];
};

export type RoutingProfileSummary = {
  totalProfiles: number;
  byKind: Record<string, number>;
  byRole: Record<string, number>;
  profiles: RoutingProfile[];
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'routing-profile';
}

function readYaml<T>(filePath: string): T {
  return YAML.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function scanYamlFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath)
    .filter((entry) => entry.endsWith('.yaml') || entry.endsWith('.yml'))
    .map((entry) => path.join(dirPath, entry))
    .sort();
}

function normalizeProfile(raw: Partial<RoutingProfile>, fallback: { id: string; name: string; kind: RoutingProfileKind; sourcePath: string }): RoutingProfile {
  return {
    id: raw.id || fallback.id,
    name: raw.name || fallback.name,
    kind: raw.kind || fallback.kind,
    shape: raw.shape || fallback.kind,
    role: raw.role || 'supportive',
    phases: raw.phases || [],
    stages: raw.stages || [],
    triggers: raw.triggers || [],
    anti_triggers: raw.anti_triggers || [],
    primary_agents: raw.primary_agents || [],
    primary_workflows: raw.primary_workflows || [],
    supportive_skills: raw.supportive_skills || [],
    tool_dependencies: raw.tool_dependencies || [],
    constraints: raw.constraints || [],
    review_pack: raw.review_pack,
    source_path: raw.source_path || fallback.sourcePath,
    story_refs: raw.story_refs || [],
    tags: raw.tags || [],
  };
}

function scanSkillProfiles(projectRoot: string): RoutingProfile[] {
  const skillRoot = path.join(projectRoot, '.agent', 'skills');
  if (!fs.existsSync(skillRoot)) {
    return [];
  }

  const output: RoutingProfile[] = [];
  for (const entry of fs.readdirSync(skillRoot)) {
    const profilePath = path.join(skillRoot, entry, 'routing-profile.yaml');
    if (!fs.existsSync(profilePath)) {
      continue;
    }
    const raw = readYaml<Partial<RoutingProfile>>(profilePath);
    output.push(
      normalizeProfile(raw, {
        id: `skill-${entry}`,
        name: entry,
        kind: 'skill',
        sourcePath: `/.agent/skills/${entry}/routing-profile.yaml`,
      }),
    );
  }
  return output.sort((a, b) => a.id.localeCompare(b.id));
}

function scanWorkflowProfiles(projectRoot: string): RoutingProfile[] {
  const workflowRoot = path.join(projectRoot, '.agent', 'workflows');
  return scanYamlFiles(workflowRoot)
    .filter((filePath) => path.basename(filePath).endsWith('.routing-profile.yaml'))
    .map((filePath) => {
      const basename = path.basename(filePath, '.routing-profile.yaml');
      const raw = readYaml<Partial<RoutingProfile>>(filePath);
      return normalizeProfile(raw, {
        id: `workflow-${basename}`,
        name: basename,
        kind: 'workflow',
        sourcePath: `/.agent/workflows/${path.basename(filePath)}`,
      });
    });
}

function scanAgentProfiles(projectRoot: string): RoutingProfile[] {
  const agentRoot = path.join(projectRoot, '.agent', 'agents');
  return scanYamlFiles(agentRoot)
    .filter((filePath) => path.basename(filePath).endsWith('.routing-profile.yaml'))
    .map((filePath) => {
      const basename = path.basename(filePath, '.routing-profile.yaml');
      const raw = readYaml<Partial<RoutingProfile>>(filePath);
      return normalizeProfile(raw, {
        id: `agent-${basename}`,
        name: basename,
        kind: 'agent',
        sourcePath: `/.agent/agents/${path.basename(filePath)}`,
      });
    });
}

function scanExternalModuleProfiles(projectRoot: string): RoutingProfile[] {
  const profileRoot = path.join(getRuntimeRoot(projectRoot, 'iwish'), 'catalog', 'routing-profiles');
  return scanYamlFiles(profileRoot).map((filePath) => {
    const basename = path.basename(filePath, path.extname(filePath));
    const raw = readYaml<Partial<RoutingProfile>>(filePath);
    return normalizeProfile(raw, {
      id: `external-module-${basename}`,
      name: basename,
      kind: raw.kind === 'repo-absorption' ? 'repo-absorption' : 'external-module',
      sourcePath: path.relative(projectRoot, filePath),
    });
  });
}

export function loadRoutingProfiles(projectRoot: string): RoutingProfile[] {
  const profiles = [
    ...scanSkillProfiles(projectRoot),
    ...scanWorkflowProfiles(projectRoot),
    ...scanAgentProfiles(projectRoot),
    ...scanExternalModuleProfiles(projectRoot),
  ];

  const seen = new Set<string>();
  return profiles.filter((profile) => {
    if (seen.has(profile.id)) {
      return false;
    }
    seen.add(profile.id);
    return true;
  });
}

export function getRoutingProfileSummary(projectRoot: string): RoutingProfileSummary {
  const profiles = loadRoutingProfiles(projectRoot);
  const byKind: Record<string, number> = {};
  const byRole: Record<string, number> = {};

  for (const profile of profiles) {
    byKind[profile.kind] = (byKind[profile.kind] || 0) + 1;
    byRole[profile.role] = (byRole[profile.role] || 0) + 1;
  }

  return {
    totalProfiles: profiles.length,
    byKind,
    byRole,
    profiles,
  };
}

export async function generateRoutingProfile(
  projectRoot: string,
  input: {
    name: string;
    kind: RoutingProfileKind;
    shape: string;
    role: RoutingProfileRole;
    targetPath: string;
    reviewPack?: string;
    sourcePath?: string;
    phases?: string[];
    stages?: string[];
    triggers?: string[];
    antiTriggers?: string[];
    primaryAgents?: string[];
    primaryWorkflows?: string[];
    supportiveSkills?: string[];
    toolDependencies?: string[];
    constraints?: string[];
    storyRefs?: string[];
    tags?: string[];
  },
): Promise<string> {
  const slug = slugify(input.name);
  const profile: RoutingProfile = {
    id: `${input.kind}-${slug}`,
    name: input.name,
    kind: input.kind,
    shape: input.shape,
    role: input.role,
    phases: input.phases || [],
    stages: input.stages || [],
    triggers: input.triggers || [],
    anti_triggers: input.antiTriggers || [],
    primary_agents: input.primaryAgents || [],
    primary_workflows: input.primaryWorkflows || [],
    supportive_skills: input.supportiveSkills || [],
    tool_dependencies: input.toolDependencies || [],
    constraints: input.constraints || [],
    review_pack: input.reviewPack,
    source_path: input.sourcePath,
    story_refs: input.storyRefs || [],
    tags: input.tags || [],
  };

  await fs.ensureDir(path.dirname(input.targetPath));
  await fs.writeFile(input.targetPath, YAML.stringify(profile), 'utf8');
  return input.targetPath;
}
