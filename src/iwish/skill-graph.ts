import * as fs from 'fs-extra';
import * as path from 'path';
import YAML from 'yaml';

import { buildPlatformInventory } from './inventory';
import { loadRoutingProfiles } from './routing-profile';

export type SkillGraphNode = {
  id: string;
  kind: 'skill-package' | 'library-skill' | 'workflow-capability';
  path: string;
  tags: string[];
  dependsOn: string[];
  workflowCallers: string[];
  agentCallers: string[];
  inboundDependencies: string[];
  classification: 'orphan' | 'tactical' | 'routable' | 'foundational';
};

export type SkillGraphReport = {
  totalSkills: number;
  routingProfileCount: number;
  indexedSkills: number;
  unindexedSkills: string[];
  unprofiledSkills: string[];
  orphanSkills: string[];
  tacticalSkills: string[];
  routableSkills: string[];
  foundationalSkills: string[];
  libraryPackSkills: string[];
  workflowCapabilities: string[];
  workflowCapabilityCount: number;
  unprofiledWorkflowCapabilities: string[];
  totalCapabilitySurface: number;
  legacyWorkflowCapabilities: string[];
  canonicalWorkflowCapabilities: string[];
  inheritedLifecycleCoverage: {
    analysis: string[];
    planning: string[];
    solutioning: string[];
    implementation: string[];
  };
  nodes: SkillGraphNode[];
};

type KgNode = {
  id: string;
  type?: string;
  path?: string;
  tags?: string[];
  depends_on?: string[];
};

function readKnowledgeGraph(projectRoot: string): KgNode[] {
  const graphPath = path.join(projectRoot, '.agent', 'knowledge-graph.yaml');
  if (!fs.existsSync(graphPath)) {
    return [];
  }

  const doc = YAML.parse(fs.readFileSync(graphPath, 'utf8')) as { nodes?: KgNode[] };
  return doc.nodes || [];
}

function listSkillDirs(projectRoot: string): string[] {
  const dirPath = path.join(projectRoot, '.agent', 'skills');
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath)
    .filter((entry) => fs.statSync(path.join(dirPath, entry)).isDirectory())
    .filter((entry) => fs.existsSync(path.join(dirPath, entry, 'SKILL.md')))
    .sort();
}

function listLibrarySkillFiles(projectRoot: string): string[] {
  const libraryRoot = path.join(projectRoot, 'templates', 'library');
  if (!fs.existsSync(libraryRoot)) {
    return [];
  }

  const output: string[] = [];
  for (const pack of fs.readdirSync(libraryRoot)) {
    const skillRoot = path.join(libraryRoot, pack, 'skills');
    if (!fs.existsSync(skillRoot)) {
      continue;
    }

    for (const entry of fs.readdirSync(skillRoot)) {
      if (!entry.endsWith('.md')) {
        continue;
      }
      output.push(`${pack}:${path.basename(entry, '.md')}`);
    }
  }

  return output.sort();
}

function scanCallers(projectRoot: string, kind: 'workflows' | 'agents'): Array<{ file: string; content: string }> {
  const dirPath = path.join(projectRoot, '.agent', kind);
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath)
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => {
      const file = path.join(dirPath, entry);
      return {
        file: path.basename(entry, '.md'),
        content: fs.readFileSync(file, 'utf8'),
      };
    });
}

function classifyWorkflowLifecycle(name: string): keyof SkillGraphReport['inheritedLifecycleCoverage'] | null {
  if (
    [
      'bmad-brainstorming',
      'bmad-bmm-market-research',
      'bmad-bmm-domain-research',
      'bmad-bmm-technical-research',
      'bmad-bmm-generate-project-context',
      'bmad-bmm-document-project',
      'research',
      'analyze-codebase',
      'research-project-modules',
    ].includes(name)
  ) {
    return 'analysis';
  }

  if (
    [
      'bmad-bmm-create-product-brief',
      'bmad-bmm-create-prd',
      'bmad-bmm-edit-prd',
      'bmad-bmm-validate-prd',
      'plan',
      'make-story',
      'prd-purpose',
    ].includes(name)
  ) {
    return 'planning';
  }

  if (
    [
      'bmad-bmm-create-architecture',
      'bmad-bmm-create-epics-and-stories',
      'bmad-bmm-create-ui-spec',
      'bmad-bmm-create-ux-design',
      'bmad-bmm-check-implementation-readiness',
      'make-ui-spec',
    ].includes(name)
  ) {
    return 'solutioning';
  }

  if (
    [
      'bmad-bmm-dev-story',
      'bmad-bmm-code-review',
      'bmad-bmm-correct-course',
      'bmad-bmm-qa-automate',
      'bmad-bmm-quick-dev',
      'bmad-bmm-quick-spec',
      'bmad-bmm-sync-stitch-design',
      'bmad-bmm-check-registry',
      'fix-bug',
      'code',
      'absorb-repo',
    ].includes(name)
  ) {
    return 'implementation';
  }

  return null;
}

function buildWorkflowCapabilityNodes(projectRoot: string): SkillGraphNode[] {
  const inventory = buildPlatformInventory(projectRoot);
  const capabilityNames = [
    ...inventory.canonicalWorkflows,
    ...inventory.activeNonCanonicalWorkflows,
    ...inventory.legacyWorkflowEntrypoints,
  ].sort();
  const workflowFiles = scanCallers(projectRoot, 'workflows');
  const agentFiles = scanCallers(projectRoot, 'agents');

  return capabilityNames.map((name) => {
    const workflowCallers = workflowFiles
      .filter((file) => file.file !== name && (file.content.includes(`/${name}.md`) || file.content.includes(name)))
      .map((file) => file.file);
    const agentCallers = agentFiles
      .filter((file) => file.content.includes(`/${name}.md`) || file.content.includes(name))
      .map((file) => file.file);

    let classification: SkillGraphNode['classification'] = 'routable';
    if (inventory.canonicalWorkflows.includes(name)) {
      classification = 'routable';
    } else if (inventory.activeNonCanonicalWorkflows.includes(name)) {
      classification = 'tactical';
    } else if (inventory.legacyWorkflowEntrypoints.includes(name)) {
      classification = 'foundational';
    }

    return {
      id: `workflow-${name}`,
      kind: 'workflow-capability',
      path: path.join('/.agent/workflows', `${name}.md`),
      tags: ['workflow-capability'],
      dependsOn: [],
      workflowCallers,
      agentCallers,
      inboundDependencies: [],
      classification,
    };
  });
}

export function buildSkillGraphReport(projectRoot: string): SkillGraphReport {
  const kgNodes = readKnowledgeGraph(projectRoot);
  const skillDirs = listSkillDirs(projectRoot);
  const libraryPackSkills = listLibrarySkillFiles(projectRoot);
  const routingProfiles = loadRoutingProfiles(projectRoot);
  const workflowFiles = scanCallers(projectRoot, 'workflows');
  const agentFiles = scanCallers(projectRoot, 'agents');

  const skillNodes = kgNodes.filter((node) => node.type === 'skill');
  const inboundMap = new Map<string, string[]>();
  for (const node of skillNodes) {
    for (const dep of node.depends_on || []) {
      const current = inboundMap.get(dep) || [];
      current.push(node.id);
      inboundMap.set(dep, current);
    }
  }

  const packageSkillNodes: SkillGraphNode[] = skillNodes.map((node) => {
    const skillName = node.path?.split('/').slice(-2, -1)[0] || node.id.replace(/^skill-/, '');
    const workflowCallers = workflowFiles
      .filter((file) => file.content.includes(`/.agent/skills/${skillName}/`) || file.content.includes(node.id) || file.content.includes(`${skillName}/SKILL.md`))
      .map((file) => file.file);
    const agentCallers = agentFiles
      .filter((file) => file.content.includes(`/.agent/skills/${skillName}/`) || file.content.includes(node.id) || file.content.includes(`${skillName}/SKILL.md`))
      .map((file) => file.file);
    const inboundDependencies = inboundMap.get(node.id) || [];

    let classification: SkillGraphNode['classification'] = 'routable';
    if (workflowCallers.length === 0 && agentCallers.length === 0 && inboundDependencies.length === 0) {
      classification = 'orphan';
    } else if (workflowCallers.length + agentCallers.length > 0 && !skillName.includes('repo-absorption') && !skillName.includes('security-guardian')) {
      classification = 'tactical';
    }
    if ((node.depends_on || []).length > 0 || inboundDependencies.length > 1) {
      classification = 'foundational';
    }
    if (skillName === 'repo-absorption' || skillName === 'security-guardian' || skillName === 'github-deep-research') {
      classification = 'routable';
    }

    return {
      id: node.id,
      kind: 'skill-package',
      path: node.path || '',
      tags: node.tags || [],
      dependsOn: node.depends_on || [],
      workflowCallers,
      agentCallers,
      inboundDependencies,
      classification,
    };
  });

  const workflowCapabilityNodes = buildWorkflowCapabilityNodes(projectRoot);
  const nodes = [...packageSkillNodes, ...workflowCapabilityNodes];

  const indexedSkillNames = new Set(packageSkillNodes.map((node) => node.path.split('/').slice(-2, -1)[0]).filter(Boolean));
  const unindexedSkills = skillDirs.filter((skill) => !indexedSkillNames.has(skill));
  const skillProfileNames = new Set(
    routingProfiles
      .filter((profile) => profile.kind === 'skill')
      .map((profile) => profile.name),
  );
  const workflowProfileNames = new Set(
    routingProfiles
      .filter((profile) => profile.kind === 'workflow')
      .map((profile) => profile.name),
  );
  const unprofiledSkills = skillDirs.filter((skill) => !skillProfileNames.has(skill));
  const workflowCapabilities = workflowCapabilityNodes.map((node) => node.id.replace(/^workflow-/, ''));
  const unprofiledWorkflowCapabilities = workflowCapabilities.filter((name) => !workflowProfileNames.has(name));
  const inventory = buildPlatformInventory(projectRoot);
  const inheritedLifecycleCoverage: SkillGraphReport['inheritedLifecycleCoverage'] = {
    analysis: workflowCapabilities.filter((name) => classifyWorkflowLifecycle(name) === 'analysis'),
    planning: workflowCapabilities.filter((name) => classifyWorkflowLifecycle(name) === 'planning'),
    solutioning: workflowCapabilities.filter((name) => classifyWorkflowLifecycle(name) === 'solutioning'),
    implementation: workflowCapabilities.filter((name) => classifyWorkflowLifecycle(name) === 'implementation'),
  };

  return {
    totalSkills: skillDirs.length,
    routingProfileCount: routingProfiles.length,
    indexedSkills: packageSkillNodes.length,
    unindexedSkills,
    unprofiledSkills,
    orphanSkills: packageSkillNodes.filter((node) => node.classification === 'orphan').map((node) => node.id),
    tacticalSkills: packageSkillNodes.filter((node) => node.classification === 'tactical').map((node) => node.id),
    routableSkills: packageSkillNodes.filter((node) => node.classification === 'routable').map((node) => node.id),
    foundationalSkills: packageSkillNodes.filter((node) => node.classification === 'foundational').map((node) => node.id),
    libraryPackSkills,
    workflowCapabilities,
    workflowCapabilityCount: workflowCapabilities.length,
    unprofiledWorkflowCapabilities,
    totalCapabilitySurface: skillDirs.length + libraryPackSkills.length + workflowCapabilities.length,
    legacyWorkflowCapabilities: inventory.legacyWorkflowEntrypoints,
    canonicalWorkflowCapabilities: inventory.canonicalWorkflows,
    inheritedLifecycleCoverage,
    nodes,
  };
}
