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
exports.installRuntime = installRuntime;
exports.getStatus = getStatus;
exports.printStatus = printStatus;
exports.printDoctor = printDoctor;
exports.printModules = printModules;
exports.printTools = printTools;
exports.getInstallTargetCatalog = getInstallTargetCatalog;
exports.printInstallTargets = printInstallTargets;
exports.registerModule = registerModule;
exports.generateCapabilityReviewPack = generateCapabilityReviewPack;
exports.generateIdeaChallengeArtifacts = generateIdeaChallengeArtifacts;
exports.readToolProfile = readToolProfile;
exports.selectToolProfile = selectToolProfile;
exports.scaffoldSolutionResearchArtifacts = scaffoldSolutionResearchArtifacts;
exports.readSolutionResearchState = readSolutionResearchState;
exports.advanceSolutionResearchStage = advanceSolutionResearchStage;
exports.writeGraphProfileSelection = writeGraphProfileSelection;
exports.getToolSetupStatus = getToolSetupStatus;
exports.ensureCapabilityPackageTemplates = ensureCapabilityPackageTemplates;
exports.normalizeInstallTargets = normalizeInstallTargets;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const yaml_1 = __importDefault(require("yaml"));
const constants_1 = require("./constants");
const reconciliation_1 = require("./reconciliation");
const review_pack_1 = require("./review-pack");
const routing_profile_1 = require("./routing-profile");
const tooling_1 = require("./tooling");
function nowIso() {
    return new Date().toISOString();
}
function getManifestPath(projectRoot) {
    return path.join((0, constants_1.getRuntimeRoot)(projectRoot, 'iwish'), 'runtime', 'manifest.json');
}
function getExternalModuleDir(projectRoot) {
    return path.join((0, constants_1.getRuntimeRoot)(projectRoot, 'iwish'), 'catalog', 'external-modules');
}
function getToolProfilePath(projectRoot) {
    return path.join((0, constants_1.getRuntimeRoot)(projectRoot, 'iwish'), 'runtime', 'tool-profile.json');
}
function getRoutingProfileDir(projectRoot) {
    return path.join((0, constants_1.getRuntimeRoot)(projectRoot, 'iwish'), 'catalog', 'routing-profiles');
}
function getGraphProfilePath(projectRoot) {
    return path.join((0, constants_1.getRuntimeRoot)(projectRoot, 'iwish'), 'graphs', 'graph-profile.yaml');
}
function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'external-module';
}
function frontmatterValue(content, key) {
    const match = content.match(new RegExp(`^${key}:\\s*["']?([^"'\n]+)["']?`, 'm'));
    return match ? match[1].trim() : null;
}
function replaceTemplateTokens(template, values) {
    let output = template;
    for (const [key, value] of Object.entries(values)) {
        output = output.replaceAll(`{${key}}`, value);
    }
    return output;
}
function hasUnresolvedTemplateTokens(content) {
    return /\{[a-z0-9_-]+\}/i.test(content);
}
function hasFrontmatterKey(content, key) {
    return new RegExp(`^${key}:`, 'm').test(content);
}
function readFrontmatterValue(content, key) {
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatter) {
        return null;
    }
    const value = frontmatter[1].match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    return value ? value[1].trim() : null;
}
function repairMissingAgentDescription(destinationContent, sourceContent) {
    if (!destinationContent.startsWith('---\n') || readFrontmatterValue(destinationContent, 'description')) {
        return null;
    }
    const description = readFrontmatterValue(sourceContent, 'description');
    if (!description) {
        return null;
    }
    const nameLine = destinationContent.match(/^name:\s*.+$/m);
    if (!nameLine || nameLine.index === undefined) {
        return null;
    }
    const insertAt = nameLine.index + nameLine[0].length;
    return `${destinationContent.slice(0, insertAt)}\ndescription: ${description}${destinationContent.slice(insertAt)}`;
}
function getPlanningArtifactsRoot(projectRoot) {
    return path.join(projectRoot, '_iwish-output', 'planning');
}
function getIdeaChallengeArtifactRoot(projectRoot, projectName) {
    return path.join(getPlanningArtifactsRoot(projectRoot), 'idea-challenges', slugify(projectName));
}
function getSolutionResearchArtifactRoot(projectRoot, researchName) {
    return path.join(getPlanningArtifactsRoot(projectRoot), 'solution-research', slugify(researchName));
}
function resolveIwishPath(projectRoot, targetPath) {
    const runtimeRoot = (0, constants_1.getRuntimeRoot)(projectRoot, 'iwish');
    const customRoot = path.join(runtimeRoot, 'custom');
    // If path is within _iwish but not already in _iwish/custom
    if (targetPath.startsWith(runtimeRoot) && !targetPath.startsWith(customRoot)) {
        const relativePath = path.relative(runtimeRoot, targetPath);
        const customPath = path.join(customRoot, relativePath);
        if (fs.existsSync(customPath) && fs.statSync(customPath).isFile()) {
            return customPath;
        }
    }
    return targetPath;
}
function readYamlFile(filePath) {
    return yaml_1.default.parse(fs.readFileSync(filePath, 'utf8'));
}
function getRuntimeTemplateFiles() {
    return fs
        .readdirSync(constants_1.RUNTIME_TEMPLATE_ROOT, { recursive: true })
        .filter((entry) => typeof entry === 'string')
        .map((entry) => path.join(constants_1.RUNTIME_TEMPLATE_ROOT, entry))
        .filter((entry) => fs.statSync(entry).isFile());
}
function getModuleDescriptors() {
    return fs
        .readdirSync(constants_1.MODULE_TEMPLATE_ROOT)
        .filter((entry) => entry.endsWith('.yaml'))
        .map((entry) => {
        const filePath = path.join(constants_1.MODULE_TEMPLATE_ROOT, entry);
        const raw = readYamlFile(filePath);
        return {
            code: String(raw.code || path.basename(entry, '.yaml')),
            name: String(raw.name || raw.code || entry),
            source: `templates/iwish/modules/${entry}`,
            class: String(raw.class || 'module'),
        };
    });
}
function loadExistingManifest(projectRoot) {
    const manifestPath = resolveIwishPath(projectRoot, getManifestPath(projectRoot));
    if (!fs.existsSync(manifestPath)) {
        return null;
    }
    return fs.readJsonSync(manifestPath);
}
async function writeIfMissing(filePath, content, overwrite = false) {
    if (fs.existsSync(filePath) && !overwrite) {
        return 'kept';
    }
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf8');
    return 'created';
}
async function materializeRuntimeTemplates(projectRoot, overwrite = false) {
    const runtimeRoot = (0, constants_1.getRuntimeRoot)(projectRoot, 'iwish');
    const results = [];
    for (const templateFile of getRuntimeTemplateFiles()) {
        const relative = path.relative(constants_1.RUNTIME_TEMPLATE_ROOT, templateFile);
        const destination = path.join(runtimeRoot, relative);
        const content = await fs.readFile(templateFile, 'utf8');
        const status = await writeIfMissing(destination, content, overwrite);
        results.push({ file: destination, status });
    }
    return results;
}
function getAgentAssetFiles() {
    const agentRoot = path.join(constants_1.REPO_ROOT, '.agent');
    if (!fs.existsSync(agentRoot)) {
        return [];
    }
    const files = [];
    const visit = (directory) => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const entryPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                visit(entryPath);
            }
            else if (entry.isFile()) {
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
async function materializeAgentAssets(projectRoot, overwrite = false) {
    const agentRoot = path.join(constants_1.REPO_ROOT, '.agent');
    const destinationRoot = path.join(projectRoot, '.agent');
    const results = [];
    for (const sourceFile of getAgentAssetFiles()) {
        const relative = path.relative(agentRoot, sourceFile);
        const destination = path.join(destinationRoot, relative);
        const content = await fs.readFile(sourceFile);
        let status = fs.existsSync(destination) && !overwrite ? 'kept' : 'created';
        if (status === 'created') {
            await fs.ensureDir(path.dirname(destination));
            await fs.writeFile(destination, content);
        }
        else if (relative.startsWith('agents/') && relative.endsWith('.md')) {
            const destinationContent = await fs.readFile(destination, 'utf8');
            const sourceContent = content.toString('utf8');
            const repairedContent = repairMissingAgentDescription(destinationContent, sourceContent);
            if (repairedContent) {
                await fs.writeFile(destination, repairedContent, 'utf8');
                status = 'updated';
            }
        }
        results.push({ file: destination, status });
    }
    return results;
}
function buildManifest(projectRoot, installTargets, existing) {
    const runtimeRoot = (0, constants_1.getRuntimeRoot)(projectRoot, 'iwish');
    const legacyRuntimeDetected = fs.existsSync((0, constants_1.getRuntimeRoot)(projectRoot, 'legacy-iwish'));
    const externalModuleDir = getExternalModuleDir(projectRoot);
    const externalModules = fs.existsSync(externalModuleDir)
        ? fs
            .readdirSync(externalModuleDir)
            .filter((entry) => entry.endsWith('.json'))
            .map((entry) => fs.readJsonSync(path.join(externalModuleDir, entry)))
        : [];
    return {
        product: 'I-Wish',
        namespace: 'iwish',
        version: '1.0.0',
        canonicalHome: (0, constants_1.getCanonicalHome)(),
        projectRoot,
        runtimeRoot,
        legacyRuntimeDetected,
        installTargets: installTargets.map((target) => ({
            id: target,
            path: (0, constants_1.getInstallTargetDir)(projectRoot, target),
            status: fs.existsSync((0, constants_1.getInstallTargetDir)(projectRoot, target)) ? 'available' : 'declared',
        })),
        modules: existing?.modules && existing.modules.length > 0 ? existing.modules : getModuleDescriptors(),
        aliases: {
            agentAliases: constants_1.LEGACY_AGENT_ALIASES,
            commandAliases: constants_1.LEGACY_COMMAND_ALIASES,
        },
        externalModules,
        updatedAt: nowIso(),
    };
}
async function writeInstallTargetMarkers(projectRoot, installTargets) {
    const markerRoot = path.join((0, constants_1.getRuntimeRoot)(projectRoot, 'iwish'), 'runtime', 'install-targets');
    await fs.ensureDir(markerRoot);
    for (const target of installTargets) {
        const catalogEntry = constants_1.INSTALL_TARGET_CATALOG.find((entry) => entry.id === target);
        const marker = {
            id: target,
            path: (0, constants_1.getInstallTargetDir)(projectRoot, target),
            generatedAt: nowIso(),
            compatibilityAlias: target === 'claude-code' ? 'claude' : target,
            supportStatus: catalogEntry?.status || 'supported',
            summary: catalogEntry?.summary || 'I-Wish install target',
            adapterStory: catalogEntry?.adapterStory || null,
        };
        await fs.writeJson(path.join(markerRoot, `${target}.json`), marker, { spaces: 2 });
    }
}
async function materializeInstallTargetDirs(projectRoot, installTargets) {
    for (const target of installTargets) {
        const targetDir = (0, constants_1.getInstallTargetDir)(projectRoot, target);
        await fs.ensureDir(targetDir);
        const markerPath = path.join(targetDir, '.iwish-target.json');
        const catalogEntry = constants_1.INSTALL_TARGET_CATALOG.find((entry) => entry.id === target);
        await fs.writeJson(markerPath, {
            id: target,
            installedAt: nowIso(),
            summary: catalogEntry?.summary || 'I-Wish install target',
            runtimeRoot: (0, constants_1.getRuntimeRoot)(projectRoot, 'iwish'),
        }, { spaces: 2 });
    }
}
async function installRuntime(projectRoot, installTargets, mode) {
    const existing = loadExistingManifest(projectRoot);
    const templateResults = await materializeRuntimeTemplates(projectRoot, mode === 'install' ? false : false);
    const agentAssetResults = await materializeAgentAssets(projectRoot, mode === 'install' ? false : false);
    await materializeInstallTargetDirs(projectRoot, installTargets);
    await writeInstallTargetMarkers(projectRoot, installTargets);
    const manifest = buildManifest(projectRoot, installTargets, existing);
    await fs.ensureDir(path.dirname(getManifestPath(projectRoot)));
    await fs.writeJson(getManifestPath(projectRoot), manifest, { spaces: 2 });
    console.log(chalk_1.default.green(`${mode === 'install' ? 'Installed' : 'Updated'} I-Wish runtime in ${(0, constants_1.getRuntimeRoot)(projectRoot, 'iwish')}`));
    const created = templateResults.filter((entry) => entry.status === 'created').length;
    const kept = templateResults.filter((entry) => entry.status === 'kept').length;
    console.log(chalk_1.default.blue(`Runtime scaffold: ${created} created, ${kept} preserved`));
    const createdAgentAssets = agentAssetResults.filter((entry) => entry.status === 'created').length;
    const keptAgentAssets = agentAssetResults.filter((entry) => entry.status === 'kept').length;
    const updatedAgentAssets = agentAssetResults.filter((entry) => entry.status === 'updated').length;
    console.log(chalk_1.default.blue(`Agent assets: ${createdAgentAssets} created, ${updatedAgentAssets} updated, ${keptAgentAssets} preserved`));
    if (manifest.legacyRuntimeDetected) {
        console.log(chalk_1.default.yellow('Legacy _iwish runtime detected. Compatibility shim is active.'));
    }
}
function getStatus(projectRoot) {
    const manifest = loadExistingManifest(projectRoot);
    const runtimeRoot = (0, constants_1.getRuntimeRoot)(projectRoot, 'iwish');
    const legacyRoot = (0, constants_1.getRuntimeRoot)(projectRoot, 'legacy-iwish');
    const customRoot = path.join(runtimeRoot, 'custom');
    const catalogRoot = path.join(runtimeRoot, 'catalog');
    const graphProfile = path.join(runtimeRoot, 'graphs', 'graph-profile.yaml');
    const toolProfile = readToolProfile(projectRoot);
    const toolSetupPrompts = (0, tooling_1.buildToolSetupPrompts)(['graph'], toolProfile?.selections || {});
    const reconciliation = (0, reconciliation_1.getReconciliationStatus)(projectRoot);
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
            agentAliases: constants_1.LEGACY_AGENT_ALIASES,
            commandAliases: constants_1.LEGACY_COMMAND_ALIASES,
        },
    };
}
function printStatus(projectRoot) {
    const status = getStatus(projectRoot);
    console.log(chalk_1.default.blue(`I-Wish runtime root: ${status.runtimeRoot}`));
    console.log(`manifest: ${status.manifestExists ? 'present' : 'missing'}`);
    console.log(`legacy _iwish: ${status.legacyDetected ? 'detected' : 'not found'}`);
    console.log(`custom/: ${status.customExists ? 'present' : 'missing'}`);
    console.log(`catalog/: ${status.catalogExists ? 'present' : 'missing'}`);
    console.log(`graph-profile: ${status.graphProfileExists ? 'present' : 'missing'}`);
    console.log(`modules: ${status.moduleCount}`);
    console.log(`external modules: ${status.externalModuleCount}`);
    console.log(`install targets: ${status.installTargets.map((target) => target.id).join(', ') || 'none'}`);
    console.log(`selected tools: ${Object.entries(status.selectedTools).map(([group, adapter]) => `${group}=${adapter}`).join(', ') || 'none'}`);
    console.log(`pending tool setup: ${status.pendingToolSetupGroups.join(', ') || 'none'}`);
    console.log(`reconciliation queue: ${status.reconciliation.pendingCount} pending / ${status.reconciliation.workItemCount} work items`);
}
function printDoctor(projectRoot) {
    const status = getStatus(projectRoot);
    const checks = [
        ['runtime manifest', status.manifestExists],
        ['graph profile', status.graphProfileExists],
        ['catalog', status.catalogExists],
        ['custom directory', status.customExists],
        ['graph tool selected', Boolean(status.selectedTools.graph)],
    ];
    console.log(chalk_1.default.blue('I-Wish doctor report'));
    for (const [label, ok] of checks) {
        console.log(`${ok ? 'PASS' : 'WARN'} ${label}`);
    }
    if (!status.manifestExists) {
        console.log(chalk_1.default.yellow('Run `iwish install` to scaffold the runtime and choose the target interactively.'));
    }
    if (status.legacyDetected) {
        console.log(chalk_1.default.yellow('Legacy `_iwish` runtime was detected. Keep compatibility shims enabled until migration is complete.'));
    }
}
function printModules() {
    const modules = getModuleDescriptors();
    for (const module of modules) {
        console.log(`${module.code}\t${module.class}\t${module.name}`);
    }
}
function printTools() {
    const toolRegistryPath = path.join(constants_1.RUNTIME_TEMPLATE_ROOT, 'tools', 'tool-registry.yaml');
    const toolRegistry = readYamlFile(toolRegistryPath);
    const groups = toolRegistry.groups;
    for (const group of groups) {
        const groupName = String(group.name);
        console.log(chalk_1.default.blue(groupName));
        const adapters = group.adapters || [];
        for (const adapter of adapters) {
            console.log(`- ${String(adapter.id)}: ${String(adapter.description)}`);
        }
    }
}
function getInstallTargetCatalog() {
    return constants_1.INSTALL_TARGET_CATALOG.map((entry) => ({ ...entry }));
}
function printInstallTargets() {
    const supported = constants_1.INSTALL_TARGET_CATALOG.filter((entry) => entry.status === 'supported');
    const planned = constants_1.INSTALL_TARGET_CATALOG.filter((entry) => entry.status === 'planned');
    console.log(chalk_1.default.bold('Supported install targets'));
    for (const entry of supported) {
        console.log(`- ${entry.id}: ${entry.summary}`);
    }
    if (planned.length > 0) {
        console.log('');
        console.log(chalk_1.default.bold('Planned install adapters'));
        for (const entry of planned) {
            const story = entry.adapterStory ? ` (${entry.adapterStory})` : '';
            console.log(`- ${entry.id}: ${entry.summary}${story}`);
        }
    }
}
async function registerModule(projectRoot, source, displayName, options) {
    const manifest = loadExistingManifest(projectRoot);
    if (!manifest) {
        throw new Error('I-Wish runtime is not installed in this project yet. Run `iwish install` first.');
    }
    const name = displayName || path.basename(source).replace(/\.(git|yaml|yml|json)$/i, '') || 'external-module';
    const slug = slugify(name);
    const moduleRecord = {
        name,
        source,
        registeredAt: nowIso(),
        status: 'registered',
        moduleClass: options?.moduleClass || 'arbitrary-external',
        registrationMode: options?.registrationMode || 'register',
        triggers: options?.triggers || [],
        toolDependencies: options?.toolDependencies || [],
    };
    const reviewPack = await (0, review_pack_1.generateReviewPack)({
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
    await (0, routing_profile_1.generateRoutingProfile)(projectRoot, {
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
    console.log(chalk_1.default.green(`Registered external module '${name}' from ${source}`));
    console.log(chalk_1.default.blue(`Review pack:`));
    console.log(`- ${reviewPack.markdownPath}`);
    console.log(`- ${reviewPack.htmlPath}`);
    console.log(chalk_1.default.blue(`Routing profile:`));
    console.log(`- ${routingProfilePath}`);
}
async function generateCapabilityReviewPack(projectRoot, input) {
    return (0, review_pack_1.generateReviewPack)({
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
async function generateIdeaChallengeArtifacts(projectRoot, input) {
    const projectName = input.projectName.trim();
    const projectSlug = slugify(projectName);
    const artifactRoot = getIdeaChallengeArtifactRoot(projectRoot, projectName);
    const mainArtifactPath = path.join(artifactRoot, `idea-challenge-${projectSlug}.md`);
    const distillatePath = path.join(artifactRoot, `idea-challenge-${projectSlug}-distillate.md`);
    const bizStackPath = input.includeBizStack ? path.join(artifactRoot, 'biz-stack.md') : null;
    const metadataPath = path.join(artifactRoot, 'idea-challenge-meta.json');
    const projectOutputTemplatePath = path.join(projectRoot, '.agent', 'workflows', 'idea-challenge-output-template.md');
    const projectDistillateTemplatePath = path.join(projectRoot, '.agent', 'workflows', 'idea-challenge-distillate-template.md');
    const fallbackOutputTemplatePath = path.join(constants_1.REPO_ROOT, '.agent', 'workflows', 'idea-challenge-output-template.md');
    const fallbackDistillateTemplatePath = path.join(constants_1.REPO_ROOT, '.agent', 'workflows', 'idea-challenge-distillate-template.md');
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
    const shouldRewriteMainArtifact = fs.existsSync(mainArtifactPath) &&
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
    const shouldRewriteDistillate = fs.existsSync(distillatePath) &&
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
    const shouldRewriteBizStack = Boolean(bizStackPath &&
        fs.existsSync(bizStackPath) &&
        (() => {
            const content = fs.readFileSync(bizStackPath, 'utf8');
            return !content.startsWith('---') || !hasFrontmatterKey(content, 'phase');
        })());
    if (bizStackPath && (!fs.existsSync(bizStackPath) || shouldRewriteBizStack)) {
        await fs.writeFile(bizStackPath, renderedBizStack, 'utf8');
    }
    await fs.writeJson(metadataPath, {
        projectName,
        conceptType,
        mode,
        generatedAt: timestamp,
        mainArtifactPath,
        distillatePath,
        bizStackPath,
        resumedFromStage,
        recommendedNextWorkflow: '/plan',
    }, { spaces: 2 });
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
function readToolProfile(projectRoot) {
    const profilePath = resolveIwishPath(projectRoot, getToolProfilePath(projectRoot));
    if (!fs.existsSync(profilePath)) {
        return null;
    }
    return fs.readJsonSync(profilePath);
}
async function selectToolProfile(projectRoot, group, adapter) {
    const current = readToolProfile(projectRoot) || {
        selectedAt: nowIso(),
        selections: {},
    };
    const updated = {
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
function graphSurfaceLayoutFor(adapter) {
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
function getProjectWorkflowPath(projectRoot, fileName) {
    return path.join(projectRoot, '.agent', 'workflows', fileName);
}
function getRepoWorkflowPath(fileName) {
    return path.join(constants_1.REPO_ROOT, '.agent', 'workflows', fileName);
}
function resolveWorkflowTemplatePath(projectRoot, fileName) {
    const projectPath = getProjectWorkflowPath(projectRoot, fileName);
    return fs.existsSync(projectPath) ? projectPath : getRepoWorkflowPath(fileName);
}
function buildInitialSolutionResearchState(input) {
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
function getSolutionResearchStageFile(stage) {
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
function getSolutionResearchStageOrder() {
    return ['discover', 'enrich', 'trust-check', 'deep-dive', 'recommend'];
}
function getSolutionResearchRequiredArtifacts(stage) {
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
function validateSolutionResearchGate(state, nextStage) {
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
async function scaffoldSolutionResearchArtifacts(projectRoot, input) {
    const researchName = input.researchName.trim();
    const artifactRoot = getSolutionResearchArtifactRoot(projectRoot, researchName);
    const briefPath = path.join(artifactRoot, 'research-brief.md');
    const outputTemplatePath = path.join(artifactRoot, 'solution-research-output.md');
    const scorecardPath = path.join(artifactRoot, 'shortlist-scorecard.md');
    const trustTemplatePath = path.join(artifactRoot, 'trust-screening.md');
    const statePath = path.join(artifactRoot, 'research-solution-sources.state.yaml');
    await fs.ensureDir(artifactRoot);
    const resumedFromStage = fs.existsSync(statePath)
        ? (yaml_1.default.parse(await fs.readFile(statePath, 'utf8'))?.current_stage || null)
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
    await fs.writeFile(statePath, yaml_1.default.stringify(state), 'utf8');
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
function readSolutionResearchState(projectRoot, researchName) {
    const artifactRoot = getSolutionResearchArtifactRoot(projectRoot, researchName);
    const statePath = path.join(artifactRoot, 'research-solution-sources.state.yaml');
    if (!fs.existsSync(statePath)) {
        return { artifactRoot, statePath, state: null };
    }
    return {
        artifactRoot,
        statePath,
        state: yaml_1.default.parse(fs.readFileSync(statePath, 'utf8')),
    };
}
async function advanceSolutionResearchStage(projectRoot, input) {
    const current = readSolutionResearchState(projectRoot, input.researchName);
    if (!current.state) {
        throw new Error(`No solution-research state found for ${input.researchName}. Run scaffold-solution-research first.`);
    }
    const producedArtifacts = { ...current.state.produced_artifacts };
    for (const artifact of input.artifactPath || []) {
        const base = path.basename(artifact);
        producedArtifacts[base] = artifact;
    }
    const candidateState = {
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
    const updated = {
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
    await fs.writeFile(current.statePath, yaml_1.default.stringify(updated), 'utf8');
    return {
        artifactRoot: current.artifactRoot,
        statePath: current.statePath,
        state: updated,
    };
}
async function writeGraphProfileSelection(projectRoot, adapter) {
    const readPath = resolveIwishPath(projectRoot, getGraphProfilePath(projectRoot));
    const existing = fs.existsSync(readPath)
        ? readYamlFile(readPath)
        : {};
    const updated = {
        ...existing,
        selection_state: 'selected',
        recommended_profile: 'falkordb-full',
        candidate_profiles: ['falkordb-full', 'neo4j', 'memgraph', 'lite-static', 'custom-adapter'],
        graph_profile: adapter,
        graph_surfaces: graphSurfaceLayoutFor(adapter),
        degraded_mode_rule: existing.degraded_mode_rule ? String(existing.degraded_mode_rule) : 'graph_unavailable_is_not_no_impact',
    };
    await fs.ensureDir(path.dirname(getGraphProfilePath(projectRoot)));
    await fs.writeFile(getGraphProfilePath(projectRoot), yaml_1.default.stringify(updated), 'utf8');
}
function getToolSetupStatus(projectRoot) {
    const selections = readToolProfile(projectRoot)?.selections || {};
    return (0, tooling_1.buildToolSetupPrompts)(['graph'], selections);
}
async function ensureCapabilityPackageTemplates(projectRoot) {
    const destinationRoot = path.join((0, constants_1.getRuntimeRoot)(projectRoot, 'iwish'), 'capability-package');
    const sourceFiles = fs
        .readdirSync(constants_1.CAPABILITY_TEMPLATE_ROOT, { recursive: true })
        .filter((entry) => typeof entry === 'string')
        .map((entry) => path.join(constants_1.CAPABILITY_TEMPLATE_ROOT, entry))
        .filter((entry) => fs.statSync(entry).isFile());
    for (const sourceFile of sourceFiles) {
        const relative = path.relative(constants_1.CAPABILITY_TEMPLATE_ROOT, sourceFile);
        const destination = path.join(destinationRoot, relative);
        const content = await fs.readFile(sourceFile, 'utf8');
        await writeIfMissing(destination, content, false);
    }
}
function normalizeInstallTargets(rawTargets) {
    const targets = rawTargets.length > 0 ? rawTargets : [];
    const normalized = targets.flatMap((entry) => entry.split(',')).map((entry) => entry.trim()).filter(Boolean);
    if (normalized.length === 0) {
        throw new Error(`No install target selected. Supported targets: ${constants_1.SUPPORTED_INSTALL_TARGETS.join(', ')}`);
    }
    const invalid = normalized.filter((entry) => !constants_1.SUPPORTED_INSTALL_TARGETS.includes(entry));
    if (invalid.length > 0) {
        throw new Error(`Unsupported install target(s): ${invalid.join(', ')}. Supported targets: ${constants_1.SUPPORTED_INSTALL_TARGETS.join(', ')}`);
    }
    return Array.from(new Set(normalized));
}
