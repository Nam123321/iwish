import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import YAML from 'yaml';
import * as os from 'os';
import { validateFrontmatter, validateOKFDocument } from './schema-validator';

import {
  CAPABILITY_TEMPLATE_ROOT,
  getCanonicalHome,
  getInstallTargetDir,
  getRuntimeRoot,
  INSTALL_TARGET_CATALOG,
  LEGACY_AGENT_ALIASES,
  LEGACY_COMMAND_ALIASES,
  MODULE_TEMPLATE_ROOT,
  REPO_ROOT,
  RUNTIME_TEMPLATE_ROOT,
  RuntimeNamespace,
  SUPPORTED_INSTALL_TARGETS,
  getPlatformMode,
  TEMPLATES_ROOT,
} from './constants';
import { getReconciliationStatus } from './reconciliation';
import { generateReviewPack, ReviewPackKind, ReviewPackRole } from './review-pack';
import { generateRoutingProfile } from './routing-profile';
import { buildToolSetupPrompts, ToolSetupPrompt } from './tooling';
import { extractGraphData, extractSprintData, extractAgentTrace, extractIdeaToPrdData, extractCodeGraphData, extractEvolverData, extractFeatureGraphData, autoRepairSprintStatus } from './graph-parser';

type InstallMode = 'install' | 'update';
type MaterializeStatus = 'created' | 'kept' | 'updated';
type MaterializeResult = { file: string; status: MaterializeStatus };

type ExternalModuleRecord = {
  name: string;
  source: string;
  registeredAt: string;
  status: string;
  moduleClass?: string;
  registrationMode?: string;
  triggers?: string[];
  toolDependencies?: string[];
  reviewPack?: {
    markdownPath: string;
    htmlPath: string;
  };
  routingProfile?: string;
};

export type RuntimeManifest = {
  product: string;
  namespace: string;
  version: string;
  canonicalHome: string;
  projectRoot: string;
  runtimeRoot: string;
  legacyRuntimeDetected: boolean;
  installTargets: Array<{ id: string; path: string; status: string }>;
  modules: Array<{ code: string; name: string; source: string; class: string }>;
  aliases: {
    agentAliases: Record<string, string>;
    commandAliases: Record<string, string>;
  };
  externalModules: ExternalModuleRecord[];
  updatedAt: string;
};

export type ToolProfile = {
  selectedAt: string;
  selections: Record<string, string>;
};

export type IdeaChallengeArtifactResult = {
  projectName: string;
  artifactRoot: string;
  mainArtifactPath: string;
  distillatePath: string;
  bizStackPath: string | null;
  metadataPath: string;
  resumedFromStage: string | null;
};

type SolutionResearchStage = 'discover' | 'enrich' | 'trust-check' | 'deep-dive' | 'recommend';

export type SolutionResearchState = {
  workflow: 'research-solution-sources';
  current_stage: SolutionResearchStage;
  completed_stages: SolutionResearchStage[];
  pending_stages: SolutionResearchStage[];
  produced_artifacts: Record<string, string>;
  requires_user_review: boolean;
  review_checkpoint: SolutionResearchStage | null;
  blocked_reason: string | null;
  resume_from: string;
  external_search_required: boolean;
  internal_only_request: boolean;
  preferred_shape: string | null;
  final_verdict: string | null;
  next_action: string | null;
  notes: string;
};

export type SolutionResearchArtifactResult = {
  researchName: string;
  artifactRoot: string;
  statePath: string;
  briefPath: string;
  outputTemplatePath: string;
  scorecardPath: string;
  trustTemplatePath: string;
  resumedFromStage: string | null;
};

type GraphProfile = {
  selection_state?: string;
  recommended_profile?: string;
  candidate_profiles?: string[];
  graph_profile?: string;
  graph_surfaces?: Record<string, string>;
  degraded_mode_rule?: string;
};

export type InstallTargetCatalogEntry = {
  id: string;
  status: 'supported' | 'planned';
  installPath: string | null;
  summary: string;
  adapterStory: string | null;
};

function nowIso(): string {
  return new Date().toISOString();
}

function getManifestPath(projectRoot: string): string {
  return path.join(getRuntimeRoot(projectRoot, 'iwish'), 'runtime', 'manifest.json');
}

function getExternalModuleDir(projectRoot: string): string {
  return path.join(getRuntimeRoot(projectRoot, 'iwish'), 'catalog', 'external-modules');
}

function getToolProfilePath(projectRoot: string): string {
  return path.join(getRuntimeRoot(projectRoot, 'iwish'), 'runtime', 'tool-profile.json');
}

function getRoutingProfileDir(projectRoot: string): string {
  return path.join(getRuntimeRoot(projectRoot, 'iwish'), 'catalog', 'routing-profiles');
}

function getGraphProfilePath(projectRoot: string): string {
  return path.join(getRuntimeRoot(projectRoot, 'iwish'), 'graphs', 'graph-profile.yaml');
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'external-module';
}

function frontmatterValue(content: string, key: string): string | null {
  const match = content.match(new RegExp(`^${key}:\\s*["']?([^"'\n]+)["']?`, 'm'));
  return match ? match[1].trim() : null;
}

function replaceTemplateTokens(template: string, values: Record<string, string>): string {
  let output = template;
  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(`{${key}}`, value);
  }
  return output;
}

function hasUnresolvedTemplateTokens(content: string): boolean {
  return /\{[a-z0-9_-]+\}/i.test(content);
}

function hasFrontmatterKey(content: string, key: string): boolean {
  return new RegExp(`^${key}:`, 'm').test(content);
}

function readFrontmatterValue(content: string, key: string): string | null {
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) {
    return null;
  }

  const value = frontmatter[1].match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return value ? value[1].trim() : null;
}

function migrateAgentFrontmatter(destinationContent: string, sourceContent: string): string | null {
  const destMatch = destinationContent.match(/^---\n([\s\S]*?)\n---/);
  const srcMatch = sourceContent.match(/^---\n([\s\S]*?)\n---/);

  if (!destMatch || !srcMatch) {
    return null;
  }

  try {
    const destYaml = YAML.parse(destMatch[1]) || {};
    const srcYaml = YAML.parse(srcMatch[1]) || {};

    let modified = false;

    // Migrate description if missing
    if (destYaml.description === undefined && srcYaml.description !== undefined) {
      destYaml.description = srcYaml.description;
      modified = true;
    }

    // Migrate required array fields if missing
    const requiredArrays = ['inputs', 'outputs', 'mcp_tools_required', 'subagent_triggers'];
    for (const field of requiredArrays) {
      if (destYaml[field] === undefined && srcYaml[field] !== undefined) {
        destYaml[field] = srcYaml[field];
        modified = true;
      }
    }

    if (modified) {
      const updatedFrontmatter = YAML.stringify(destYaml).trim();
      const bodyText = destinationContent.substring(destMatch[0].length);
      return `---\n${updatedFrontmatter}\n---${bodyText}`;
    }
  } catch (error) {
    // Fail-safe: if YAML parsing fails, return null to avoid breaking the install process
    return null;
  }

  return null;
}

function getPlanningArtifactsRoot(projectRoot: string): string {
  if (fs.existsSync(path.join(projectRoot, '_iwish-output'))) {
    return path.join(projectRoot, '_iwish-output', '1. Idea Discovery');
  }
  return path.join(projectRoot, '_bmad-output', 'planning');
}

function getIdeaChallengeArtifactRoot(projectRoot: string, projectName: string): string {
  return path.join(getPlanningArtifactsRoot(projectRoot), 'idea-challenges', slugify(projectName));
}

function getSolutionResearchArtifactRoot(projectRoot: string, researchName: string): string {
  return path.join(getPlanningArtifactsRoot(projectRoot), 'solution-research', slugify(researchName));
}

function readYamlFile(filePath: string): Record<string, unknown> {
  return YAML.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
}

function getRuntimeTemplateFiles(): string[] {
  return fs
    .readdirSync(RUNTIME_TEMPLATE_ROOT, { recursive: true })
    .filter((entry) => typeof entry === 'string')
    .map((entry) => path.join(RUNTIME_TEMPLATE_ROOT, entry))
    .filter((entry) => fs.statSync(entry).isFile());
}

function getModuleDescriptors() {
  return fs
    .readdirSync(MODULE_TEMPLATE_ROOT)
    .filter((entry) => entry.endsWith('.yaml'))
    .map((entry) => {
      const filePath = path.join(MODULE_TEMPLATE_ROOT, entry);
      const raw = readYamlFile(filePath);
      return {
        code: String(raw.code || path.basename(entry, '.yaml')),
        name: String(raw.name || raw.code || entry),
        source: `templates/iwish/modules/${entry}`,
        class: String(raw.class || 'module'),
      };
    });
}

function loadExistingManifest(projectRoot: string): RuntimeManifest | null {
  const manifestPath = getManifestPath(projectRoot);
  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  return fs.readJsonSync(manifestPath) as RuntimeManifest;
}

async function writeIfMissing(filePath: string, content: string, overwrite = false): Promise<'created' | 'kept'> {
  if (fs.existsSync(filePath) && !overwrite) {
    return 'kept';
  }

  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
  return 'created';
}

async function materializeRuntimeTemplates(projectRoot: string, overwrite = false): Promise<Array<{ file: string; status: string }>> {
  const runtimeRoot = getRuntimeRoot(projectRoot, 'iwish');
  const results: Array<{ file: string; status: string }> = [];

  for (const templateFile of getRuntimeTemplateFiles()) {
    const relative = path.relative(RUNTIME_TEMPLATE_ROOT, templateFile);
    const destination = path.join(runtimeRoot, relative);
    const content = await fs.readFile(templateFile, 'utf8');
    const status = await writeIfMissing(destination, content, overwrite);
    results.push({ file: destination, status });
  }

  return results;
}

function getAgentAssetFiles(): string[] {
  const agentRoot = path.join(REPO_ROOT, '.agent');
  if (!fs.existsSync(agentRoot)) {
    const empty: string[] = [];
    return empty;
  }

  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (entry.isFile()) {
        files.push(entryPath);
      }
    }
  };
  visit(agentRoot);

  return files.filter((filePath) => {
    const relative = path.relative(agentRoot, filePath);
    return !relative.includes('__pycache__') && !relative.endsWith('.pyc') && path.basename(relative) !== '.DS_Store';
  });
}

async function materializeAgentAssets(projectRoot: string, overwrite = false): Promise<MaterializeResult[]> {
  const agentRoot = path.join(REPO_ROOT, '.agent');
  const destinationRoot = path.join(projectRoot, '.agent');
  const results: MaterializeResult[] = [];

  for (const sourceFile of getAgentAssetFiles()) {
    const relative = path.relative(agentRoot, sourceFile);
    const destination = path.join(destinationRoot, relative);
    const content = await fs.readFile(sourceFile);
    let status: MaterializeStatus = fs.existsSync(destination) && !overwrite ? 'kept' : 'created';
    if (status === 'created') {
      await fs.ensureDir(path.dirname(destination));
      await fs.writeFile(destination, content);
    } else if (relative.startsWith('agents/') && relative.endsWith('.md')) {
      const destinationContent = await fs.readFile(destination, 'utf8');
      const sourceContent = content.toString('utf8');
      const repairedContent = migrateAgentFrontmatter(destinationContent, sourceContent);
      if (repairedContent) {
        await fs.writeFile(destination, repairedContent, 'utf8');
        status = 'updated';
      }
    }
    
    // Story 3.1: Enforce frontmatter validation checks on materialization
    if (relative.startsWith('agents/') && relative.endsWith('.md')) {
      try {
        const finalContent = await fs.readFile(destination, 'utf8');
        validateFrontmatter(finalContent, destination);
      } catch (err: any) {
        if (status === 'created' || status === 'updated') {
          console.error(chalk.red(`[Schema Error] Agent validation failed for ${relative}: ${err.message}`));
          throw err;
        } else {
          console.warn(chalk.yellow(`[Schema Warning] Agent validation failed for ${relative}: ${err.message}`));
        }
      }
    }

    results.push({ file: destination, status });
  }

  return results;
}

function buildManifest(projectRoot: string, installTargets: string[], existing: RuntimeManifest | null): RuntimeManifest {
  const runtimeRoot = getRuntimeRoot(projectRoot, 'iwish');
  const legacyRuntimeDetected = fs.existsSync(getRuntimeRoot(projectRoot, 'legacy-bmad'));
  const externalModuleDir = getExternalModuleDir(projectRoot);
  const externalModules = fs.existsSync(externalModuleDir)
    ? fs
        .readdirSync(externalModuleDir)
        .filter((entry) => entry.endsWith('.json'))
        .map((entry) => fs.readJsonSync(path.join(externalModuleDir, entry)) as RuntimeManifest['externalModules'][number])
    : [];

  return {
    product: 'I-Wish',
    namespace: 'iwish',
    version: '1.0.0',
    canonicalHome: getCanonicalHome(),
    projectRoot,
    runtimeRoot,
    legacyRuntimeDetected,
    installTargets: installTargets.map((target) => ({
      id: target,
      path: getInstallTargetDir(projectRoot, target),
      status: fs.existsSync(getInstallTargetDir(projectRoot, target)) ? 'available' : 'declared',
    })),
    modules: existing?.modules && existing.modules.length > 0 ? existing.modules : getModuleDescriptors(),
    aliases: {
      agentAliases: LEGACY_AGENT_ALIASES,
      commandAliases: LEGACY_COMMAND_ALIASES,
    },
    externalModules,
    updatedAt: nowIso(),
  };
}

async function writeInstallTargetMarkers(projectRoot: string, installTargets: string[]): Promise<void> {
  const markerRoot = path.join(getRuntimeRoot(projectRoot, 'iwish'), 'runtime', 'install-targets');
  await fs.ensureDir(markerRoot);

  for (const target of installTargets) {
    const catalogEntry = INSTALL_TARGET_CATALOG.find((entry) => entry.id === target);
    const marker = {
      id: target,
      path: getInstallTargetDir(projectRoot, target),
      generatedAt: nowIso(),
      compatibilityAlias: target === 'claude-code' ? 'claude' : target,
      supportStatus: catalogEntry?.status || 'supported',
      summary: catalogEntry?.summary || 'I-Wish install target',
      adapterStory: catalogEntry?.adapterStory || null,
    };
    await fs.writeJson(path.join(markerRoot, `${target}.json`), marker, { spaces: 2 });
  }
}

async function materializeInstallTargetDirs(projectRoot: string, installTargets: string[]): Promise<void> {
  for (const target of installTargets) {
    const targetDir = getInstallTargetDir(projectRoot, target);
    await fs.ensureDir(targetDir);
    const markerPath = path.join(targetDir, '.iwish-target.json');
    const catalogEntry = INSTALL_TARGET_CATALOG.find((entry) => entry.id === target);
    await fs.writeJson(
      markerPath,
      {
        id: target,
        installedAt: nowIso(),
        summary: catalogEntry?.summary || 'I-Wish install target',
        runtimeRoot: getRuntimeRoot(projectRoot, 'iwish'),
      },
      { spaces: 2 },
    );
  }
}

export async function compileUserGuideDashboard(projectRoot: string): Promise<string> {
  const templatePath = path.join(TEMPLATES_ROOT, 'user-guide-dashboard.html');
  const outputPath = path.join(projectRoot, '_iwish-output', 'user-guide-dashboard.html');

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file not found at ${templatePath}`);
  }

  const templateContent = await fs.readFile(templatePath, 'utf8');
  const graphData = extractGraphData(projectRoot);
  let sprintData = extractSprintData(projectRoot);
  
  if (!sprintData || sprintData.length === 0) {
    console.log(chalk.yellow('\n⚠️  Đã phát hiện sprint-status.yaml sai định dạng hoặc trống. Đang tự động sửa chữa (Auto-Repair)...'));
    autoRepairSprintStatus(projectRoot);
    sprintData = extractSprintData(projectRoot);
  }
  const agentTrace = extractAgentTrace(projectRoot);
  const ideaToPrdData = extractIdeaToPrdData(projectRoot);
  const codeGraphData = extractCodeGraphData(projectRoot);
  const featureGraphData = extractFeatureGraphData(projectRoot);
  const evolverData = extractEvolverData(projectRoot);

  // Load locale files
  const localesDir = path.join(TEMPLATES_ROOT, 'locales');
  const localesData: Record<string, any> = {};
  if (fs.existsSync(localesDir)) {
    const files = await fs.readdir(localesDir);
    for (const file of files) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        const lang = path.basename(file, path.extname(file)); // e.g. "en"
        const content = await fs.readFile(path.join(localesDir, file), 'utf8');
        try {
          localesData[lang] = YAML.parse(content);
        } catch (e: any) {
          console.warn(`[Warning] Failed to parse locale file ${file}: ${e.message}`);
        }
      }
    }
  }

  const finalHtml = templateContent
    .replace('/*PROJECT_ROOT*/ ""', JSON.stringify(projectRoot).replace(/<\/script>/ig, '<\\/script>'))
    .replace('/*NODES_EDGES*/ {}', JSON.stringify(graphData).replace(/<\/script>/ig, '<\\/script>'))
    .replace('{NODES_EDGES_PLACEHOLDER}', JSON.stringify(graphData).replace(/<\/script>/ig, '<\\/script>'))
    .replace('/*SPRINT_DATA*/ {}', JSON.stringify(sprintData).replace(/<\/script>/ig, '<\\/script>'))
    .replace('{SPRINT_DATA_PLACEHOLDER}', JSON.stringify(sprintData).replace(/<\/script>/ig, '<\\/script>'))
    .replace('/*ORCHESTRATION_DATA*/ {}', JSON.stringify(agentTrace).replace(/<\/script>/ig, '<\\/script>'))
    .replace('{ORCHESTRATION_DATA_PLACEHOLDER}', JSON.stringify(agentTrace).replace(/<\/script>/ig, '<\\/script>'))
    .replace('/*IDEA_TO_PRD_DATA*/ {}', JSON.stringify(ideaToPrdData).replace(/<\/script>/ig, '<\\/script>'))
    .replace('{IDEA_TO_PRD_DATA_PLACEHOLDER}', JSON.stringify(ideaToPrdData).replace(/<\/script>/ig, '<\\/script>'))
    .replace('/*EVOLVER_DATA*/ {}', JSON.stringify(evolverData).replace(/<\/script>/ig, '<\\/script>'))
    .replace('{EVOLVER_DATA_PLACEHOLDER}', JSON.stringify(evolverData).replace(/<\/script>/ig, '<\\/script>'))
    .replace('/*LOCALES_DATA*/ {}', JSON.stringify(localesData).replace(/<\/script>/ig, '<\\/script>'))
    .replace('{LOCALES_DATA_PLACEHOLDER}', JSON.stringify(localesData).replace(/<\/script>/ig, '<\\/script>'))
    .replace('/*CODE_GRAPH_DATA*/ null', codeGraphData ? JSON.stringify(codeGraphData).replace(/<\/script>/ig, '<\\/script>') : 'null')
    .replace('/*FEATURE_GRAPH_DATA*/ null', featureGraphData && featureGraphData.nodes.length > 0 ? JSON.stringify(featureGraphData).replace(/<\/script>/ig, '<\\/script>') : 'null');

  await fs.ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, finalHtml, 'utf8');
  return outputPath;
}

export async function installRuntime(projectRoot: string, installTargets: string[], mode: InstallMode): Promise<void> {
  const existing = loadExistingManifest(projectRoot);
  const templateResults = await materializeRuntimeTemplates(projectRoot, true);
  const agentAssetResults = await materializeAgentAssets(projectRoot, true);
  await materializeInstallTargetDirs(projectRoot, installTargets);
  await writeInstallTargetMarkers(projectRoot, installTargets);

  const manifest = buildManifest(projectRoot, installTargets, existing);
  await fs.ensureDir(path.dirname(getManifestPath(projectRoot)));
  await fs.writeJson(getManifestPath(projectRoot), manifest, { spaces: 2 });

  try {
    const dashboardPath = await compileUserGuideDashboard(projectRoot);
    console.log(chalk.cyan(`[User Guide & Dashboard] Generated at: ${path.relative(projectRoot, dashboardPath)}`));
    console.log(chalk.gray(`- Purpose: Open this file in your browser to view the interactive codebase knowledge graph, track active Sprint backlog Kanbans, inspect multi-agent orchestration traces, and read the developer slash command reference guide.`));
  } catch (error: any) {
    console.warn(chalk.yellow(`[Warning] Could not compile User Guide & Dashboard: ${error.message}`));
  }

  console.log(chalk.green(`${mode === 'install' ? 'Installed' : 'Updated'} I-Wish runtime in ${getRuntimeRoot(projectRoot, 'iwish')}`));
  const created = templateResults.filter((entry) => entry.status === 'created').length;
  const kept = templateResults.filter((entry) => entry.status === 'kept').length;
  console.log(chalk.blue(`Runtime scaffold: ${created} created, ${kept} preserved`));
  const createdAgentAssets = agentAssetResults.filter((entry) => entry.status === 'created').length;
  const keptAgentAssets = agentAssetResults.filter((entry) => entry.status === 'kept').length;
  const updatedAgentAssets = agentAssetResults.filter((entry) => entry.status === 'updated').length;
  console.log(chalk.blue(`Agent assets: ${createdAgentAssets} created, ${updatedAgentAssets} updated, ${keptAgentAssets} preserved`));

}

export function getStatus(projectRoot: string) {
  const manifest = loadExistingManifest(projectRoot);
  const runtimeRoot = getRuntimeRoot(projectRoot, 'iwish');
  const legacyRoot = getRuntimeRoot(projectRoot, 'legacy-bmad');
  const customRoot = path.join(runtimeRoot, 'custom');
  const catalogRoot = path.join(runtimeRoot, 'catalog');
  const graphProfile = path.join(runtimeRoot, 'graphs', 'graph-profile.yaml');
  const toolProfile = readToolProfile(projectRoot);
  const toolSetupPrompts = buildToolSetupPrompts(['graph'], toolProfile?.selections || {});
  const reconciliation = getReconciliationStatus(projectRoot);

  return {
    runtimeRoot,
    legacyRoot,
    manifestExists: Boolean(manifest),
    legacyDetected: fs.existsSync(legacyRoot),
    customExists: fs.existsSync(customRoot),
    catalogExists: fs.existsSync(catalogRoot),
    graphProfileExists: fs.existsSync(graphProfile),
    installTargets: manifest?.installTargets || [],
    moduleCount: manifest?.modules.length || 0,
    externalModuleCount: manifest?.externalModules.length || 0,
    selectedTools: toolProfile?.selections || {},
    pendingToolSetupGroups: toolSetupPrompts.map((prompt) => prompt.group),
    reconciliation,
    aliases: manifest?.aliases || {
      agentAliases: LEGACY_AGENT_ALIASES,
      commandAliases: LEGACY_COMMAND_ALIASES,
    },
    platformMode: getPlatformMode(),
  };
}

export function printStatus(projectRoot: string): void {
  const status = getStatus(projectRoot);

  console.log(chalk.blue(`I-Wish runtime root: ${status.runtimeRoot}`));
  console.log(`manifest: ${status.manifestExists ? 'present' : 'missing'}`);
  console.log(`legacy _bmad: ${status.legacyDetected ? 'detected' : 'not found'}`);
  console.log(`custom/: ${status.customExists ? 'present' : 'missing'}`);
  console.log(`catalog/: ${status.catalogExists ? 'present' : 'missing'}`);
  console.log(`graph-profile: ${status.graphProfileExists ? 'present' : 'missing'}`);
  console.log(`modules: ${status.moduleCount}`);
  console.log(`external modules: ${status.externalModuleCount}`);
  console.log(`install targets: ${status.installTargets.map((target) => target.id).join(', ') || 'none'}`);
  console.log(`selected tools: ${Object.entries(status.selectedTools).map(([group, adapter]) => `${group}=${adapter}`).join(', ') || 'none'}`);
  console.log(`pending tool setup: ${status.pendingToolSetupGroups.join(', ') || 'none'}`);
  console.log(`platform mode: ${status.platformMode}`);
  console.log(`reconciliation queue: ${status.reconciliation.pendingCount} pending / ${status.reconciliation.workItemCount} work items`);
}

export function printDoctor(projectRoot: string): void {
  const status = getStatus(projectRoot);
  // Feature hierarchy canonical path: _iwish-output/2. Product Planning/2.5. feature-hierarchy.md
  // Fallback: _iwish-output/feature-hierarchy.md (pre-S14.1) or _bmad-output/planning-artifacts/feature-hierarchy.md (legacy)
  const featureHierarchyExists = [
    path.join(projectRoot, '_iwish-output', '2. Product Planning', '2.5. feature-hierarchy.md'),
    path.join(projectRoot, '_iwish-output', 'feature-hierarchy.md'),
    path.join(projectRoot, '_bmad-output', 'planning-artifacts', 'feature-hierarchy.md'),
  ].some(p => fs.existsSync(p));

  // Perform OKF schema validation on output directory files
  const iwishOutputDir = path.join(projectRoot, '_iwish-output');
  const okfValidationErrors: string[] = [];
  let okfFileCount = 0;
  if (fs.existsSync(iwishOutputDir)) {
    const collectAndValidate = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== 'scratch' && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
            collectAndValidate(fullPath);
          }
        } else if (entry.name.endsWith('.md') && !entry.name.endsWith('DESIGN.md') && !entry.name.endsWith('user-guide.md')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.match(/^---\n([\s\S]*?)\n---/)) {
              okfFileCount++;
              validateOKFDocument(content, fullPath, projectRoot);
            }
          } catch (error: any) {
            okfValidationErrors.push(`${path.relative(projectRoot, fullPath)}: ${error.message}`);
          }
        }
      }
    };
    collectAndValidate(iwishOutputDir);
  }

  const checks = [
    ['runtime manifest', status.manifestExists],
    ['graph profile', status.graphProfileExists],
    ['catalog', status.catalogExists],
    ['custom directory', status.customExists],
    ['graph tool selected', Boolean(status.selectedTools.graph)],
    ['feature hierarchy', featureHierarchyExists],
    ['OKF validation', okfValidationErrors.length === 0],
  ];

  console.log(chalk.blue('I-Wish doctor report'));
  for (const [label, ok] of checks) {
    console.log(`${ok ? 'PASS' : 'WARN'} ${label}`);
  }

  if (!status.manifestExists) {
    console.log(chalk.yellow('Run `iwish install` to scaffold the runtime and choose the target interactively.'));
  }

  if (status.legacyDetected) {
    console.log(chalk.yellow('Legacy `_bmad` runtime was detected. Keep compatibility shims enabled until migration is complete.'));
  }

  if (!featureHierarchyExists) {
    console.log(chalk.yellow('Feature hierarchy not found. Run `/feature-hierarchy` or `iwish featuregraph-retrofit` to generate it.'));
  }

  if (okfValidationErrors.length > 0) {
    console.log(chalk.yellow(`\n⚠️  Found ${okfValidationErrors.length} OKF validation errors:`));
    for (const err of okfValidationErrors) {
      console.log(chalk.yellow(`  - ${err}`));
    }
  } else if (okfFileCount > 0) {
    console.log(chalk.green(`\n✨ Successfully validated ${okfFileCount} OKF documents!`));
  }
}

export function printModules(): void {
  const modules = getModuleDescriptors();
  for (const module of modules) {
    console.log(`${module.code}\t${module.class}\t${module.name}`);
  }
}

export function printTools(): void {
  const toolRegistryPath = path.join(RUNTIME_TEMPLATE_ROOT, 'tools', 'tool-registry.yaml');
  const toolRegistry = readYamlFile(toolRegistryPath);
  const groups = toolRegistry.groups as Array<Record<string, unknown>>;

  for (const group of groups) {
    const groupName = String(group.name);
    console.log(chalk.blue(groupName));
    const adapters = (group.adapters as Array<Record<string, unknown>>) || [];
    for (const adapter of adapters) {
      console.log(`- ${String(adapter.id)}: ${String(adapter.description)}`);
    }
  }
}

export function getInstallTargetCatalog(): InstallTargetCatalogEntry[] {
  return INSTALL_TARGET_CATALOG.map((entry) => ({ ...entry }));
}

export function printInstallTargets(): void {
  const supported = INSTALL_TARGET_CATALOG.filter((entry) => entry.status === 'supported');
  const planned = INSTALL_TARGET_CATALOG.filter((entry) => entry.status === 'planned');

  console.log(chalk.bold('Supported install targets'));
  for (const entry of supported) {
    console.log(`- ${entry.id}: ${entry.summary}`);
  }

  if (planned.length > 0) {
    console.log('');
    console.log(chalk.bold('Planned install adapters'));
    for (const entry of planned) {
      const story = entry.adapterStory ? ` (${entry.adapterStory})` : '';
      console.log(`- ${entry.id}: ${entry.summary}${story}`);
    }
  }
}

export async function registerModule(
  projectRoot: string,
  source: string,
  displayName?: string,
  options?: {
    moduleClass?: string;
    registrationMode?: string;
    triggers?: string[];
    toolDependencies?: string[];
  },
): Promise<void> {
  const manifest = loadExistingManifest(projectRoot);
  if (!manifest) {
    throw new Error('I-Wish runtime is not installed in this project yet. Run `iwish install` first.');
  }

  const name = displayName || path.basename(source).replace(/\.(git|yaml|yml|json)$/i, '') || 'external-module';
  const slug = slugify(name);
  const moduleRecord: ExternalModuleRecord = {
    name,
    source,
    registeredAt: nowIso(),
    status: 'registered',
    moduleClass: options?.moduleClass || 'arbitrary-external',
    registrationMode: options?.registrationMode || 'register',
    triggers: options?.triggers || [],
    toolDependencies: options?.toolDependencies || [],
  };

  const reviewPack = await generateReviewPack({
    projectRoot,
    name,
    source,
    kind: options?.registrationMode === 'absorb' ? 'repo-absorption' : 'external-module',
    shape: options?.moduleClass || 'external-module',
    role: 'supportive',
    registrationState: 'registered',
    moduleClass: options?.moduleClass || 'arbitrary-external',
    triggers: options?.triggers || [],
    toolDependencies: options?.toolDependencies || [],
    primaryAgents: ['orch-agent', 'capability-agent'],
    primaryWorkflows: ['register-skill-pack', 'absorb-repo'],
    supportiveSkills: ['reviewed during orchestration with parent workflow context'],
  });
  moduleRecord.reviewPack = reviewPack;
  const routingProfilePath = path.join(getRoutingProfileDir(projectRoot), `${slug}.yaml`);
  await generateRoutingProfile(projectRoot, {
    name,
    kind: options?.registrationMode === 'absorb' ? 'repo-absorption' : 'external-module',
    shape: options?.moduleClass || 'external-module',
    role: 'supportive',
    targetPath: routingProfilePath,
    reviewPack: path.relative(projectRoot, reviewPack.markdownPath),
    sourcePath: source,
    phases: ['operate-learn', 'supporting-multiple-phases'],
    stages: ['intake', 'assessment', 'integration-planning'],
    triggers: options?.triggers || [],
    primaryAgents: ['orch-agent', 'capability-agent'],
    primaryWorkflows: ['register-skill-pack', 'absorb-repo'],
    supportiveSkills: [],
    toolDependencies: options?.toolDependencies || [],
    constraints: ['Treat as reviewed external support until explicitly promoted.'],
    tags: [options?.moduleClass || 'external-module', options?.registrationMode || 'register'],
  });
  moduleRecord.routingProfile = path.relative(projectRoot, routingProfilePath);

  await fs.ensureDir(getExternalModuleDir(projectRoot));
  await fs.writeJson(path.join(getExternalModuleDir(projectRoot), `${slug}.json`), moduleRecord, { spaces: 2 });

  const updatedManifest = buildManifest(projectRoot, manifest.installTargets.map((target) => target.id), manifest);
  await fs.writeJson(getManifestPath(projectRoot), updatedManifest, { spaces: 2 });

  console.log(chalk.green(`Registered external module '${name}' from ${source}`));
  console.log(chalk.blue(`Review pack:`));
  console.log(`- ${reviewPack.markdownPath}`);
  console.log(`- ${reviewPack.htmlPath}`);
  console.log(chalk.blue(`Routing profile:`));
  console.log(`- ${routingProfilePath}`);
}

export async function generateCapabilityReviewPack(
  projectRoot: string,
  input: {
    name: string;
    source: string;
    kind: ReviewPackKind;
    shape: string;
    role: ReviewPackRole;
    registrationState?: string;
    targetDir?: string;
    moduleClass?: string;
    triggers?: string[];
    toolDependencies?: string[];
    primaryAgents?: string[];
    primaryWorkflows?: string[];
    supportiveSkills?: string[];
    phases?: string[];
    stages?: string[];
    coreUseCases?: string[];
    adjacentUseCases?: string[];
    doNotUseCases?: string[];
    edgeCases?: string[];
    stressCases?: string[];
    constraints?: string[];
    orchHints?: string[];
    reviewQuestions?: string[];
    examples?: string[];
  },
) {
  return generateReviewPack({
    projectRoot,
    name: input.name,
    source: input.source,
    kind: input.kind,
    shape: input.shape,
    role: input.role,
    registrationState: input.registrationState || 'draft',
    targetDir: input.targetDir,
    moduleClass: input.moduleClass,
    triggers: input.triggers,
    toolDependencies: input.toolDependencies,
    primaryAgents: input.primaryAgents,
    primaryWorkflows: input.primaryWorkflows,
    supportiveSkills: input.supportiveSkills,
    phases: input.phases,
    stages: input.stages,
    coreUseCases: input.coreUseCases,
    adjacentUseCases: input.adjacentUseCases,
    doNotUseCases: input.doNotUseCases,
    edgeCases: input.edgeCases,
    stressCases: input.stressCases,
    constraints: input.constraints,
    orchHints: input.orchHints,
    reviewQuestions: input.reviewQuestions,
    examples: input.examples,
  });
}

export async function generateIdeaChallengeArtifacts(
  projectRoot: string,
  input: {
    projectName: string;
    conceptType?: 'commercial-product' | 'internal-tool' | 'open-source-project' | 'community-nonprofit';
    mode?: 'interactive' | 'draft-first' | 'research-grounded';
    includeBizStack?: boolean;
  },
): Promise<IdeaChallengeArtifactResult> {
  const projectName = input.projectName.trim();
  const projectSlug = slugify(projectName);
  const artifactRoot = getIdeaChallengeArtifactRoot(projectRoot, projectName);
  const mainArtifactPath = path.join(artifactRoot, `idea-challenge-${projectSlug}.md`);
  const distillatePath = path.join(artifactRoot, `idea-challenge-${projectSlug}-distillate.md`);
  const bizStackPath = input.includeBizStack ? path.join(artifactRoot, 'biz-stack.md') : null;
  const metadataPath = path.join(artifactRoot, 'idea-challenge-meta.json');

  const projectOutputTemplatePath = path.join(projectRoot, '.agent', 'workflows', 'idea-challenge-output-template.md');
  const projectDistillateTemplatePath = path.join(projectRoot, '.agent', 'workflows', 'idea-challenge-distillate-template.md');
  const fallbackOutputTemplatePath = path.join(REPO_ROOT, '.agent', 'workflows', 'idea-challenge-output-template.md');
  const fallbackDistillateTemplatePath = path.join(REPO_ROOT, '.agent', 'workflows', 'idea-challenge-distillate-template.md');

  const outputTemplatePath = fs.existsSync(projectOutputTemplatePath) ? projectOutputTemplatePath : fallbackOutputTemplatePath;
  const distillateTemplatePath = fs.existsSync(projectDistillateTemplatePath) ? projectDistillateTemplatePath : fallbackDistillateTemplatePath;

  const outputTemplate = await fs.readFile(outputTemplatePath, 'utf8');
  const distillateTemplate = await fs.readFile(distillateTemplatePath, 'utf8');

  const conceptType = input.conceptType || 'commercial-product';
  const mode = input.mode || 'interactive';
  const timestamp = nowIso();

  await fs.ensureDir(artifactRoot);

  const resumedFromStage = fs.existsSync(mainArtifactPath)
    ? frontmatterValue(await fs.readFile(mainArtifactPath, 'utf8'), 'stage')
    : null;

  const shouldRewriteMainArtifact =
    fs.existsSync(mainArtifactPath) &&
    (() => {
      const content = fs.readFileSync(mainArtifactPath, 'utf8');
      return hasUnresolvedTemplateTokens(content) || !hasFrontmatterKey(content, 'phase');
    })();

  if (!fs.existsSync(mainArtifactPath) || shouldRewriteMainArtifact) {
    const renderedMain = replaceTemplateTokens(outputTemplate, {
      project_name: projectName,
      concept_type: conceptType,
      mode,
      timestamp,
    });
    await fs.writeFile(mainArtifactPath, renderedMain, 'utf8');
  }

  const shouldRewriteDistillate =
    fs.existsSync(distillatePath) &&
    (() => {
      const content = fs.readFileSync(distillatePath, 'utf8');
      return hasUnresolvedTemplateTokens(content) || !hasFrontmatterKey(content, 'phase') || !hasFrontmatterKey(content, 'source');
    })();

  if (!fs.existsSync(distillatePath) || shouldRewriteDistillate) {
    const renderedDistillate = replaceTemplateTokens(distillateTemplate, {
      project_name: projectName,
      timestamp,
      source_file: `idea-challenge-${projectSlug}.md`,
    });
    await fs.writeFile(distillatePath, renderedDistillate, 'utf8');
  }

  const renderedBizStack = `---
title: "Biz Stack: ${projectName}"
type: biz-stack
phase: deep_dive
refs: ["idea-challenge-${projectSlug}.md", "idea-challenge-${projectSlug}-distillate.md"]
created: "${timestamp}"
---

# Biz Stack: ${projectName}

## Core Advantage Source

## Business Model

## Pricing Logic

## Distribution Wedge

## Retention / Lock-In

## Trust / Data / Ecosystem Reinforcement

## Risks That Could Erode The Advantage
`;

  const shouldRewriteBizStack =
    Boolean(
      bizStackPath &&
        fs.existsSync(bizStackPath) &&
        (() => {
          const content = fs.readFileSync(bizStackPath, 'utf8');
          return !content.startsWith('---') || !hasFrontmatterKey(content, 'phase');
        })(),
    );

  if (bizStackPath && (!fs.existsSync(bizStackPath) || shouldRewriteBizStack)) {
    await fs.writeFile(bizStackPath, renderedBizStack, 'utf8');
  }

  await fs.writeJson(
    metadataPath,
    {
      projectName,
      conceptType,
      mode,
      generatedAt: timestamp,
      mainArtifactPath,
      distillatePath,
      bizStackPath,
      resumedFromStage,
      recommendedNextWorkflow: '/plan',
    },
    { spaces: 2 },
  );

  return {
    projectName,
    artifactRoot,
    mainArtifactPath,
    distillatePath,
    bizStackPath,
    metadataPath,
    resumedFromStage,
  };
}

export function readToolProfile(projectRoot: string): ToolProfile | null {
  const profilePath = getToolProfilePath(projectRoot);
  if (!fs.existsSync(profilePath)) {
    return null;
  }

  return fs.readJsonSync(profilePath) as ToolProfile;
}

export async function selectToolProfile(projectRoot: string, group: string, adapter: string): Promise<ToolProfile> {
  const current = readToolProfile(projectRoot) || {
    selectedAt: nowIso(),
    selections: {},
  };

  const updated: ToolProfile = {
    selectedAt: nowIso(),
    selections: {
      ...current.selections,
      [group]: adapter,
    },
  };

  await fs.ensureDir(path.dirname(getToolProfilePath(projectRoot)));
  await fs.writeJson(getToolProfilePath(projectRoot), updated, { spaces: 2 });
  if (group === 'graph') {
    await writeGraphProfileSelection(projectRoot, adapter);
  }
  return updated;
}

function graphSurfaceLayoutFor(adapter: string): Record<string, string> {
  switch (adapter) {
    case 'falkordb-full':
      return {
        codebasegraph: 'falkordb-full',
        featuregraph: 'falkordb-full',
        knowledgegraph: 'lite-static',
        skillgraph: 'lite-static',
        memorygraph: 'lite-static',
      };
    case 'neo4j':
    case 'memgraph':
    case 'lite-static':
    case 'custom-adapter':
      return {
        codebasegraph: adapter,
        featuregraph: adapter,
        knowledgegraph: adapter,
        skillgraph: adapter,
        memorygraph: adapter,
      };
    default:
      return {
        codebasegraph: adapter,
        featuregraph: adapter,
        knowledgegraph: adapter,
        skillgraph: adapter,
        memorygraph: adapter,
      };
  }
}

function getProjectWorkflowPath(projectRoot: string, fileName: string): string {
  return path.join(projectRoot, '.agent', 'workflows', fileName);
}

function getRepoWorkflowPath(fileName: string): string {
  return path.join(REPO_ROOT, '.agent', 'workflows', fileName);
}

function resolveWorkflowTemplatePath(projectRoot: string, fileName: string): string {
  const projectPath = getProjectWorkflowPath(projectRoot, fileName);
  return fs.existsSync(projectPath) ? projectPath : getRepoWorkflowPath(fileName);
}

function buildInitialSolutionResearchState(input: {
  externalSearchRequired: boolean;
  internalOnlyRequest: boolean;
  preferredShape?: string;
}): SolutionResearchState {
  return {
    workflow: 'research-solution-sources',
    current_stage: 'discover',
    completed_stages: [],
    pending_stages: ['discover', 'enrich', 'trust-check', 'deep-dive', 'recommend'],
    produced_artifacts: {},
    requires_user_review: false,
    review_checkpoint: null,
    blocked_reason: null,
    resume_from: 'step-rss-01-discover.md',
    external_search_required: input.externalSearchRequired,
    internal_only_request: input.internalOnlyRequest,
    preferred_shape: input.preferredShape || null,
    final_verdict: null,
    next_action: null,
    notes: '',
  };
}

function getSolutionResearchStageFile(stage: SolutionResearchStage): string {
  switch (stage) {
    case 'discover':
      return 'step-rss-01-discover.md';
    case 'enrich':
      return 'step-rss-02-enrich.md';
    case 'trust-check':
      return 'step-rss-03-trust-check.md';
    case 'deep-dive':
      return 'step-rss-04-deep-dive.md';
    case 'recommend':
      return 'step-rss-05-recommend.md';
  }
}

function getSolutionResearchStageOrder(): SolutionResearchStage[] {
  return ['discover', 'enrich', 'trust-check', 'deep-dive', 'recommend'];
}

function getSolutionResearchRequiredArtifacts(stage: SolutionResearchStage): string[] {
  switch (stage) {
    case 'discover':
      return ['candidate-pool.md', 'candidate-pool.json', 'query-log.md'];
    case 'enrich':
      return ['candidate-enrichment-table.md', 'candidate-enrichment.json'];
    case 'trust-check':
      return ['trust-screening.md', 'risk-flags.yaml'];
    case 'deep-dive':
      return ['finalist-deep-dive.md', 'rejection-reasons.md'];
    case 'recommend':
      return ['solution-research-verdict.md', 'shortlist-scorecard.md'];
  }
}

function validateSolutionResearchGate(state: SolutionResearchState, nextStage: SolutionResearchStage): string | null {
  const order = getSolutionResearchStageOrder();
  const currentIndex = order.indexOf(state.current_stage);
  const nextIndex = order.indexOf(nextStage);
  if (nextIndex !== currentIndex + 1) {
    return `Stage transition must be sequential: ${state.current_stage} -> ${order[currentIndex + 1] || 'none'}.`;
  }

  const requiredArtifacts = getSolutionResearchRequiredArtifacts(state.current_stage);
  const missing = requiredArtifacts.filter((artifact) => !state.produced_artifacts[artifact]);
  if (missing.length > 0) {
    return `Missing required artifacts for ${state.current_stage}: ${missing.join(', ')}.`;
  }

  if (state.current_stage === 'discover' && state.requires_user_review && state.review_checkpoint === 'discover') {
    return 'Discover checkpoint still requires user review before continuing.';
  }

  if (state.current_stage === 'deep-dive' && state.external_search_required) {
    if (!state.produced_artifacts['finalist-deep-dive.md']) {
      return 'Shortlisted external candidates require deep-dive evidence before recommend.';
    }
  }

  return null;
}

export async function scaffoldSolutionResearchArtifacts(
  projectRoot: string,
  input: {
    researchName: string;
    problemSummary: string;
    preferredShape?: string;
    externalSearchRequired?: boolean;
    internalOnlyRequest?: boolean;
  },
): Promise<SolutionResearchArtifactResult> {
  const researchName = input.researchName.trim();
  const artifactRoot = getSolutionResearchArtifactRoot(projectRoot, researchName);
  const briefPath = path.join(artifactRoot, 'research-brief.md');
  const outputTemplatePath = path.join(artifactRoot, 'solution-research-output.md');
  const scorecardPath = path.join(artifactRoot, 'shortlist-scorecard.md');
  const trustTemplatePath = path.join(artifactRoot, 'trust-screening.md');
  const statePath = path.join(artifactRoot, 'research-solution-sources.state.yaml');

  await fs.ensureDir(artifactRoot);

  const resumedFromStage = fs.existsSync(statePath)
    ? ((YAML.parse(await fs.readFile(statePath, 'utf8')) as Partial<SolutionResearchState>)?.current_stage || null)
    : null;

  const outputTemplate = await fs.readFile(resolveWorkflowTemplatePath(projectRoot, 'research-solution-sources-output-template.md'), 'utf8');
  const scorecardTemplate = await fs.readFile(resolveWorkflowTemplatePath(projectRoot, 'research-solution-sources-scorecard-template.md'), 'utf8');
  const trustTemplate = await fs.readFile(resolveWorkflowTemplatePath(projectRoot, 'research-solution-sources-trust-template.md'), 'utf8');

  const state = buildInitialSolutionResearchState({
    externalSearchRequired: Boolean(input.externalSearchRequired),
    internalOnlyRequest: Boolean(input.internalOnlyRequest),
    preferredShape: input.preferredShape,
  });

  const brief = `---
title: "Solution Research Brief: ${researchName}"
type: solution-research-brief
workflow: research-solution-sources
created: "${nowIso()}"
preferred_shape: "${input.preferredShape || 'unspecified'}"
external_search_required: ${Boolean(input.externalSearchRequired)}
internal_only_request: ${Boolean(input.internalOnlyRequest)}
---

# Problem Summary

${input.problemSummary}

## Desired Outcome

## Constraints

## Candidate Shapes

- ${input.preferredShape || 'unspecified'}

## Notes
`;

  await fs.writeFile(briefPath, brief, 'utf8');
  await fs.writeFile(outputTemplatePath, outputTemplate, 'utf8');
  await fs.writeFile(scorecardPath, scorecardTemplate, 'utf8');
  await fs.writeFile(trustTemplatePath, trustTemplate, 'utf8');
  await fs.writeFile(statePath, YAML.stringify(state), 'utf8');

  return {
    researchName,
    artifactRoot,
    statePath,
    briefPath,
    outputTemplatePath,
    scorecardPath,
    trustTemplatePath,
    resumedFromStage,
  };
}

export function readSolutionResearchState(projectRoot: string, researchName: string): {
  artifactRoot: string;
  statePath: string;
  state: SolutionResearchState | null;
} {
  const artifactRoot = getSolutionResearchArtifactRoot(projectRoot, researchName);
  const statePath = path.join(artifactRoot, 'research-solution-sources.state.yaml');
  if (!fs.existsSync(statePath)) {
    return { artifactRoot, statePath, state: null };
  }

  return {
    artifactRoot,
    statePath,
    state: YAML.parse(fs.readFileSync(statePath, 'utf8')) as SolutionResearchState,
  };
}

export async function advanceSolutionResearchStage(
  projectRoot: string,
  input: {
    researchName: string;
    nextStage: SolutionResearchStage;
    artifactPath?: string[];
    requiresUserReview?: boolean;
    reviewCheckpoint?: SolutionResearchStage | null;
    blockedReason?: string | null;
    finalVerdict?: string | null;
    nextAction?: string | null;
    notes?: string;
  },
): Promise<{ artifactRoot: string; statePath: string; state: SolutionResearchState }> {
  const current = readSolutionResearchState(projectRoot, input.researchName);
  if (!current.state) {
    throw new Error(`No solution-research state found for ${input.researchName}. Run scaffold-solution-research first.`);
  }

  const producedArtifacts = { ...current.state.produced_artifacts };
  for (const artifact of input.artifactPath || []) {
    const base = path.basename(artifact);
    producedArtifacts[base] = artifact;
  }

  const candidateState: SolutionResearchState = {
    ...current.state,
    produced_artifacts: producedArtifacts,
  };

  const gateError = validateSolutionResearchGate(candidateState, input.nextStage);
  if (gateError) {
    throw new Error(gateError);
  }

  const order = getSolutionResearchStageOrder();
  const completedStages = Array.from(new Set([...current.state.completed_stages, current.state.current_stage]));
  const pendingStages = order.filter((stage) => !completedStages.includes(stage));

  const updated: SolutionResearchState = {
    ...current.state,
    current_stage: input.nextStage,
    completed_stages: completedStages,
    pending_stages: pendingStages,
    produced_artifacts: producedArtifacts,
    requires_user_review: Boolean(input.requiresUserReview),
    review_checkpoint: input.reviewCheckpoint ?? null,
    blocked_reason: input.blockedReason ?? null,
    resume_from: getSolutionResearchStageFile(input.nextStage),
    final_verdict: input.finalVerdict ?? current.state.final_verdict,
    next_action: input.nextAction ?? current.state.next_action,
    notes: input.notes ?? current.state.notes,
  };

  await fs.writeFile(current.statePath, YAML.stringify(updated), 'utf8');
  return {
    artifactRoot: current.artifactRoot,
    statePath: current.statePath,
    state: updated,
  };
}

export async function writeGraphProfileSelection(projectRoot: string, adapter: string): Promise<void> {
  const existing = fs.existsSync(getGraphProfilePath(projectRoot))
    ? (readYamlFile(getGraphProfilePath(projectRoot)) as GraphProfile)
    : {};
  const updated: GraphProfile = {
    ...existing,
    selection_state: 'selected',
    recommended_profile: 'falkordb-full',
    candidate_profiles: ['falkordb-full', 'neo4j', 'memgraph', 'lite-static', 'custom-adapter'],
    graph_profile: adapter,
    graph_surfaces: graphSurfaceLayoutFor(adapter),
    degraded_mode_rule: existing.degraded_mode_rule ? String(existing.degraded_mode_rule) : 'graph_unavailable_is_not_no_impact',
  };
  await fs.ensureDir(path.dirname(getGraphProfilePath(projectRoot)));
  await fs.writeFile(getGraphProfilePath(projectRoot), YAML.stringify(updated), 'utf8');
}

export function getToolSetupStatus(projectRoot: string): ToolSetupPrompt[] {
  const selections = readToolProfile(projectRoot)?.selections || {};
  return buildToolSetupPrompts(['graph'], selections);
}

export async function ensureCapabilityPackageTemplates(projectRoot: string, overwrite = false): Promise<void> {
  const destinationRoot = path.join(getRuntimeRoot(projectRoot, 'iwish'), 'capability-package');
  const sourceFiles = fs
    .readdirSync(CAPABILITY_TEMPLATE_ROOT, { recursive: true })
    .filter((entry) => typeof entry === 'string')
    .map((entry) => path.join(CAPABILITY_TEMPLATE_ROOT, entry))
    .filter((entry) => fs.statSync(entry).isFile());

  for (const sourceFile of sourceFiles) {
    const relative = path.relative(CAPABILITY_TEMPLATE_ROOT, sourceFile);
    const destination = path.join(destinationRoot, relative);
    const content = await fs.readFile(sourceFile, 'utf8');
    await writeIfMissing(destination, content, overwrite);
  }
}

export function normalizeInstallTargets(rawTargets: string[]): string[] {
  const targets = rawTargets.length > 0 ? rawTargets : [];
  const normalized = targets.flatMap((entry) => entry.split(',')).map((entry) => entry.trim()).filter(Boolean);
  if (normalized.length === 0) {
    throw new Error(`No install target selected. Supported targets: ${SUPPORTED_INSTALL_TARGETS.join(', ')}`);
  }
  const invalid = normalized.filter((entry) => !SUPPORTED_INSTALL_TARGETS.includes(entry as (typeof SUPPORTED_INSTALL_TARGETS)[number]));
  if (invalid.length > 0) {
    throw new Error(`Unsupported install target(s): ${invalid.join(', ')}. Supported targets: ${SUPPORTED_INSTALL_TARGETS.join(', ')}`);
  }
  return Array.from(new Set(normalized));
}

export async function detectPlatformCapabilities(
  projectRoot: string,
  installTargets: string[]
): Promise<Array<{ id: string; name: string; type: 'skill' | 'mcp' }>> {
  const list: Array<{ id: string; name: string; type: 'skill' | 'mcp' }> = [];

  for (const target of installTargets) {
    if (target === 'google antigravity') {
      list.push(
        { id: 'teamwork-preview', name: 'Teamwork Preview (Platform Command)', type: 'skill' },
        { id: 'grill-me', name: 'Grill-Me (Interactive Design Alignment)', type: 'skill' },
        { id: 'browser', name: 'Browser (DevTools / Search Integration)', type: 'skill' },
        { id: 'schedule', name: 'Schedule (Cron & Timers)', type: 'skill' }
      );

      const mcpDir = path.join(os.homedir(), '.gemini', 'antigravity', 'mcp');
      if (await fs.exists(mcpDir)) {
        const dirs = await fs.readdir(mcpDir);
        for (const dir of dirs) {
          const fullPath = path.join(mcpDir, dir);
          if ((await fs.stat(fullPath)).isDirectory()) {
            list.push({
              id: `mcp:${dir}`,
              name: `${dir} (MCP Server)`,
              type: 'mcp'
            });
          }
        }
      }
    }
  }

  return list;
}

export async function ingestPlatformSkills(
  projectRoot: string,
  installTargets: string[],
  selectedIds: string[]
): Promise<void> {
  const manifest = loadExistingManifest(projectRoot);
  if (!manifest) {
    return;
  }

  if (selectedIds.length === 0) {
    console.log(chalk.blue('No platform capabilities selected for ingestion. Kept I-Wish runtime pure.'));
    return;
  }

  console.log(chalk.blue('Scanning and ingesting platform-native skills and workflows...'));
  const profileDir = getRoutingProfileDir(projectRoot);
  await fs.ensureDir(profileDir);

  const guidesDir = path.join(profileDir, 'coexistence-guides');
  await fs.ensureDir(guidesDir);

  for (const id of selectedIds) {
    if (id === 'teamwork-preview') {
      // 1. teamwork-preview profile
      const teamworkProfile = {
        id: 'skill-antigravity-teamwork-integration',
        name: 'antigravity-teamwork-integration',
        kind: 'skill',
        shape: 'skill',
        role: 'supportive',
        phases: ['solution', 'implement'],
        stages: ['sprint-planning', 'dev-story', 'execution-delegation'],
        triggers: ['chạy teamwork', 'teamwork-preview', 'multi-agent code', 'chạy song song sprint', 'chạy đa agent'],
        anti_triggers: ['fix bug đơn lẻ', 'sửa lỗi nhỏ'],
        primary_agents: ['orch-agent', 'delivery-manager-agent'],
        primary_workflows: ['plan', 'make-story'],
        supportive_skills: ['antigravity-teamwork-integration'],
        tool_dependencies: ['google-antigravity'],
        constraints: [
          'Chỉ kích hoạt khi có tệp prompt_draft.md được biên soạn đầy đủ và được User phê duyệt.',
          'Không chạy song song với các sửa đổi trực tiếp (direct code edits) của dev-agent trên cùng một component.'
        ],
        review_pack: '_iwish/catalog/routing-profiles/coexistence-guides/workflow-skill-creator-coexistence.md',
        tags: ['platform-bridge', 'multi-agent-execution']
      };
      await fs.writeFile(path.join(profileDir, 'antigravity-teamwork-integration.yaml'), YAML.stringify(teamworkProfile), 'utf8');

      // 1b. coexistence guide
      const guideContent = `# Coexistence Guide: workflow-skill-creator vs /create-skill

## 1. Operating Mechanism
* **workflow-skill-creator**: Reactive transcript distiller. Extracts files, tools, and actions that succeeded in the active session and formats them as a raw instruction guide.
* **create-skill**: Proactive governance pipeline. Creates design contracts, lineage graphs, metadata, and promotes from draft to canonical.

## 2. Pros & Cons
* **workflow-skill-creator**:
  - Pros: High empirical accuracy.
  - Cons: Rigid, no degraded modes, no schema validation.
* **create-skill**:
  - Pros: Clean routing profile, architectural compliance.
  - Cons: Requires manual transcript distillation.

## 3. Coexistence Strategy
Use platform skill-creator as the empirical engine to extract steps, then feed into /create-skill to add schema, metadata, and validation gates.
`;
      await fs.writeFile(path.join(guidesDir, 'workflow-skill-creator-coexistence.md'), guideContent, 'utf8');
      console.log(chalk.green('- Ingested teamwork-preview and workflow-skill-creator coexistence guide.'));
    }

    if (id === 'grill-me') {
      const grillProfile = {
        id: 'skill-antigravity-grill-me-integration',
        name: 'antigravity-grill-me-integration',
        kind: 'skill',
        shape: 'skill',
        role: 'supportive',
        phases: ['discover', 'plan'],
        stages: ['alignment', 'concept-challenge'],
        triggers: ['phỏng vấn thiết kế', 'grill-me', 'grill me', 'phỏng vấn ý tưởng'],
        anti_triggers: [],
        primary_agents: ['orch-agent', 'pm-agent'],
        primary_workflows: ['idea-challenge', 'plan'],
        supportive_skills: ['antigravity-grill-me-integration'],
        tool_dependencies: ['google-antigravity'],
        constraints: ['Sử dụng công cụ ask_question để hiển thị trắc nghiệm nhanh cho người dùng.'],
        tags: ['platform-bridge', 'interactive-alignment']
      };
      await fs.writeFile(path.join(profileDir, 'antigravity-grill-me-integration.yaml'), YAML.stringify(grillProfile), 'utf8');
      console.log(chalk.green('- Ingested grill-me (interactive alignment).'));
    }

    if (id === 'browser') {
      const browserProfile = {
        id: 'skill-antigravity-browser-integration',
        name: 'antigravity-browser-integration',
        kind: 'skill',
        shape: 'skill',
        role: 'supportive',
        phases: ['implement', 'review'],
        stages: ['ui-verification', 'browser-automation'],
        triggers: ['mở trình duyệt', 'chạy browser', 'browser', 'chụp screenshot', 'chạy devtools'],
        anti_triggers: [],
        primary_agents: ['orch-agent', 'dev-agent', 'review-agent', 'ux-agent'],
        primary_workflows: ['make-ui-spec', 'review', 'code'],
        supportive_skills: ['antigravity-browser-integration'],
        tool_dependencies: ['chrome-devtools-mcp'],
        constraints: ['Ưu tiên sử dụng chrome-devtools-mcp của nền tảng hơn tự chạy Puppeteer cục bộ.'],
        tags: ['platform-bridge', 'browser-automation']
      };
      await fs.writeFile(path.join(profileDir, 'antigravity-browser-integration.yaml'), YAML.stringify(browserProfile), 'utf8');
      console.log(chalk.green('- Ingested browser-devtools.'));
    }

    if (id === 'schedule') {
      const scheduleProfile = {
        id: 'skill-antigravity-schedule-integration',
        name: 'antigravity-schedule-integration',
        kind: 'skill',
        shape: 'skill',
        role: 'supportive',
        phases: ['implement', 'review'],
        stages: ['background-checks'],
        triggers: ['lập lịch', 'schedule'],
        anti_triggers: [],
        primary_agents: ['orch-agent', 'dev-agent'],
        primary_workflows: ['code'],
        supportive_skills: ['antigravity-schedule-integration'],
        tool_dependencies: ['google-antigravity'],
        constraints: ['Sử dụng timers thay thế lệnh sleep của Bash.'],
        tags: ['platform-bridge', 'timers']
      };
      await fs.writeFile(path.join(profileDir, 'antigravity-schedule-integration.yaml'), YAML.stringify(scheduleProfile), 'utf8');
      console.log(chalk.green('- Ingested schedule (cron/timers).'));
    }

    if (id.startsWith('mcp:')) {
      const mcpName = id.replace('mcp:', '');
      const mcpProfile = {
        id: `tool-mcp-${mcpName}`,
        name: `${mcpName}-mcp-adapter`,
        kind: 'tool',
        shape: 'mcp',
        role: 'supportive',
        phases: ['implement', 'review'],
        stages: ['tool-usage'],
        triggers: [`chạy ${mcpName}`, `mcp ${mcpName}`, `${mcpName} tool`],
        anti_triggers: [],
        primary_agents: ['orch-agent', 'dev-agent'],
        primary_workflows: ['code'],
        supportive_skills: [],
        tool_dependencies: [mcpName],
        constraints: [`Gọi trực tiếp thông qua MCP client của host platform.`],
        tags: ['mcp-server', 'tool-adapter']
      };
      await fs.writeFile(path.join(profileDir, `mcp-${mcpName}-adapter.yaml`), YAML.stringify(mcpProfile), 'utf8');
      console.log(chalk.green(`- Ingested MCP server adapter: ${mcpName}`));
    }
  }

  // Write the fix-bug-coexistence guide
  const fixBugGuideContent = `# Coexistence Guide: Platform Troubleshooting vs /fix-bug

## 1. Operating Mechanism
* **Platform Troubleshooting**: Auto-inspects node error logs and runs live debugger loops.
* **/fix-bug**: Coordinates the complete 7-phase bug lifecycle (Reproduction, RCA, Design, Implementation, Validation, Lesson Extraction).

## 2. Coexistence Strategy
Platform troubleshooting handles Phase 1-2 (Reproduction & RCA), I-Wish coordinates the safety guards, Git checkouts, and lesson extraction in Phase 7.
`;
  await fs.writeFile(path.join(guidesDir, 'fix-bug-coexistence.md'), fixBugGuideContent, 'utf8');

  // Reload manifest and update manifest.json with ingested profiles
  const updatedManifest = buildManifest(projectRoot, installTargets, manifest);
  await fs.writeJson(getManifestPath(projectRoot), updatedManifest, { spaces: 2 });
}
