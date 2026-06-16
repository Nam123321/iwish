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
exports.compileUserGuideDashboard = compileUserGuideDashboard;
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
exports.detectPlatformCapabilities = detectPlatformCapabilities;
exports.ingestPlatformSkills = ingestPlatformSkills;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const yaml_1 = __importDefault(require("yaml"));
const os = __importStar(require("os"));
const schema_validator_1 = require("./schema-validator");
const constants_1 = require("./constants");
const reconciliation_1 = require("./reconciliation");
const review_pack_1 = require("./review-pack");
const routing_profile_1 = require("./routing-profile");
const tooling_1 = require("./tooling");
const graph_parser_1 = require("./graph-parser");
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
function migrateAgentFrontmatter(destinationContent, sourceContent) {
    const destMatch = destinationContent.match(/^---\n([\s\S]*?)\n---/);
    const srcMatch = sourceContent.match(/^---\n([\s\S]*?)\n---/);
    if (!destMatch || !srcMatch) {
        return null;
    }
    try {
        const destYaml = yaml_1.default.parse(destMatch[1]) || {};
        const srcYaml = yaml_1.default.parse(srcMatch[1]) || {};
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
            const updatedFrontmatter = yaml_1.default.stringify(destYaml).trim();
            const bodyText = destinationContent.substring(destMatch[0].length);
            return `---\n${updatedFrontmatter}\n---${bodyText}`;
        }
    }
    catch (error) {
        // Fail-safe: if YAML parsing fails, return null to avoid breaking the install process
        return null;
    }
    return null;
}
function getPlanningArtifactsRoot(projectRoot) {
    if (fs.existsSync(path.join(projectRoot, '_iwish-output'))) {
        return path.join(projectRoot, '_iwish-output', '1. Idea Discovery');
    }
    return path.join(projectRoot, '_bmad-output', 'planning');
}
function getIdeaChallengeArtifactRoot(projectRoot, projectName) {
    return path.join(getPlanningArtifactsRoot(projectRoot), 'idea-challenges', slugify(projectName));
}
function getSolutionResearchArtifactRoot(projectRoot, researchName) {
    return path.join(getPlanningArtifactsRoot(projectRoot), 'solution-research', slugify(researchName));
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
    const manifestPath = getManifestPath(projectRoot);
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
        const empty = [];
        return empty;
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
                (0, schema_validator_1.validateFrontmatter)(finalContent, destination);
            }
            catch (err) {
                if (status === 'created' || status === 'updated') {
                    console.error(chalk_1.default.red(`[Schema Error] Agent validation failed for ${relative}: ${err.message}`));
                    throw err;
                }
                else {
                    console.warn(chalk_1.default.yellow(`[Schema Warning] Agent validation failed for ${relative}: ${err.message}`));
                }
            }
        }
        results.push({ file: destination, status });
    }
    return results;
}
function buildManifest(projectRoot, installTargets, existing) {
    const runtimeRoot = (0, constants_1.getRuntimeRoot)(projectRoot, 'iwish');
    const legacyRuntimeDetected = fs.existsSync((0, constants_1.getRuntimeRoot)(projectRoot, 'legacy-bmad'));
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
async function compileUserGuideDashboard(projectRoot) {
    const templatePath = path.join(constants_1.TEMPLATES_ROOT, 'user-guide-dashboard.html');
    const outputPath = path.join(projectRoot, '_iwish-output', 'user-guide-dashboard.html');
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found at ${templatePath}`);
    }
    const templateContent = await fs.readFile(templatePath, 'utf8');
    const graphData = (0, graph_parser_1.extractGraphData)(projectRoot);
    let sprintData = (0, graph_parser_1.extractSprintData)(projectRoot);
    if (!sprintData || sprintData.length === 0) {
        console.log(chalk_1.default.yellow('\n⚠️  Đã phát hiện sprint-status.yaml sai định dạng hoặc trống. Đang tự động sửa chữa (Auto-Repair)...'));
        (0, graph_parser_1.autoRepairSprintStatus)(projectRoot);
        sprintData = (0, graph_parser_1.extractSprintData)(projectRoot);
    }
    const agentTrace = (0, graph_parser_1.extractAgentTrace)(projectRoot);
    const ideaToPrdData = (0, graph_parser_1.extractIdeaToPrdData)(projectRoot);
    const codeGraphData = (0, graph_parser_1.extractCodeGraphData)(projectRoot);
    const featureGraphData = (0, graph_parser_1.extractFeatureGraphData)(projectRoot);
    const evolverData = (0, graph_parser_1.extractEvolverData)(projectRoot);
    // Load locale files
    const localesDir = path.join(constants_1.TEMPLATES_ROOT, 'locales');
    const localesData = {};
    if (fs.existsSync(localesDir)) {
        const files = await fs.readdir(localesDir);
        for (const file of files) {
            if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                const lang = path.basename(file, path.extname(file)); // e.g. "en"
                const content = await fs.readFile(path.join(localesDir, file), 'utf8');
                try {
                    localesData[lang] = yaml_1.default.parse(content);
                }
                catch (e) {
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
async function installRuntime(projectRoot, installTargets, mode) {
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
        console.log(chalk_1.default.cyan(`[User Guide & Dashboard] Generated at: ${path.relative(projectRoot, dashboardPath)}`));
        console.log(chalk_1.default.gray(`- Purpose: Open this file in your browser to view the interactive codebase knowledge graph, track active Sprint backlog Kanbans, inspect multi-agent orchestration traces, and read the developer slash command reference guide.`));
    }
    catch (error) {
        console.warn(chalk_1.default.yellow(`[Warning] Could not compile User Guide & Dashboard: ${error.message}`));
    }
    console.log(chalk_1.default.green(`${mode === 'install' ? 'Installed' : 'Updated'} I-Wish runtime in ${(0, constants_1.getRuntimeRoot)(projectRoot, 'iwish')}`));
    const created = templateResults.filter((entry) => entry.status === 'created').length;
    const kept = templateResults.filter((entry) => entry.status === 'kept').length;
    console.log(chalk_1.default.blue(`Runtime scaffold: ${created} created, ${kept} preserved`));
    const createdAgentAssets = agentAssetResults.filter((entry) => entry.status === 'created').length;
    const keptAgentAssets = agentAssetResults.filter((entry) => entry.status === 'kept').length;
    const updatedAgentAssets = agentAssetResults.filter((entry) => entry.status === 'updated').length;
    console.log(chalk_1.default.blue(`Agent assets: ${createdAgentAssets} created, ${updatedAgentAssets} updated, ${keptAgentAssets} preserved`));
}
function getStatus(projectRoot) {
    const manifest = loadExistingManifest(projectRoot);
    const runtimeRoot = (0, constants_1.getRuntimeRoot)(projectRoot, 'iwish');
    const legacyRoot = (0, constants_1.getRuntimeRoot)(projectRoot, 'legacy-bmad');
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
        platformMode: (0, constants_1.getPlatformMode)(),
    };
}
function printStatus(projectRoot) {
    const status = getStatus(projectRoot);
    console.log(chalk_1.default.blue(`I-Wish runtime root: ${status.runtimeRoot}`));
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
function printDoctor(projectRoot) {
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
    const okfValidationErrors = [];
    let okfFileCount = 0;
    if (fs.existsSync(iwishOutputDir)) {
        const collectAndValidate = (dir) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (entry.name !== 'scratch' && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
                        collectAndValidate(fullPath);
                    }
                }
                else if (entry.name.endsWith('.md') && !entry.name.endsWith('DESIGN.md') && !entry.name.endsWith('user-guide.md')) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        if (content.match(/^---\n([\s\S]*?)\n---/)) {
                            okfFileCount++;
                            (0, schema_validator_1.validateOKFDocument)(content, fullPath, projectRoot);
                        }
                    }
                    catch (error) {
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
    console.log(chalk_1.default.blue('I-Wish doctor report'));
    for (const [label, ok] of checks) {
        console.log(`${ok ? 'PASS' : 'WARN'} ${label}`);
    }
    if (!status.manifestExists) {
        console.log(chalk_1.default.yellow('Run `iwish install` to scaffold the runtime and choose the target interactively.'));
    }
    if (status.legacyDetected) {
        console.log(chalk_1.default.yellow('Legacy `_bmad` runtime was detected. Keep compatibility shims enabled until migration is complete.'));
    }
    if (!featureHierarchyExists) {
        console.log(chalk_1.default.yellow('Feature hierarchy not found. Run `/feature-hierarchy` or `iwish featuregraph-retrofit` to generate it.'));
    }
    if (okfValidationErrors.length > 0) {
        console.log(chalk_1.default.yellow(`\n⚠️  Found ${okfValidationErrors.length} OKF validation errors:`));
        for (const err of okfValidationErrors) {
            console.log(chalk_1.default.yellow(`  - ${err}`));
        }
    }
    else if (okfFileCount > 0) {
        console.log(chalk_1.default.green(`\n✨ Successfully validated ${okfFileCount} OKF documents!`));
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
    const profilePath = getToolProfilePath(projectRoot);
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
    const existing = fs.existsSync(getGraphProfilePath(projectRoot))
        ? readYamlFile(getGraphProfilePath(projectRoot))
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
async function ensureCapabilityPackageTemplates(projectRoot, overwrite = false) {
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
        await writeIfMissing(destination, content, overwrite);
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
async function detectPlatformCapabilities(projectRoot, installTargets) {
    const list = [];
    for (const target of installTargets) {
        if (target === 'google antigravity') {
            list.push({ id: 'teamwork-preview', name: 'Teamwork Preview (Platform Command)', type: 'skill' }, { id: 'grill-me', name: 'Grill-Me (Interactive Design Alignment)', type: 'skill' }, { id: 'browser', name: 'Browser (DevTools / Search Integration)', type: 'skill' }, { id: 'schedule', name: 'Schedule (Cron & Timers)', type: 'skill' });
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
async function ingestPlatformSkills(projectRoot, installTargets, selectedIds) {
    const manifest = loadExistingManifest(projectRoot);
    if (!manifest) {
        return;
    }
    if (selectedIds.length === 0) {
        console.log(chalk_1.default.blue('No platform capabilities selected for ingestion. Kept I-Wish runtime pure.'));
        return;
    }
    console.log(chalk_1.default.blue('Scanning and ingesting platform-native skills and workflows...'));
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
            await fs.writeFile(path.join(profileDir, 'antigravity-teamwork-integration.yaml'), yaml_1.default.stringify(teamworkProfile), 'utf8');
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
            console.log(chalk_1.default.green('- Ingested teamwork-preview and workflow-skill-creator coexistence guide.'));
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
            await fs.writeFile(path.join(profileDir, 'antigravity-grill-me-integration.yaml'), yaml_1.default.stringify(grillProfile), 'utf8');
            console.log(chalk_1.default.green('- Ingested grill-me (interactive alignment).'));
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
            await fs.writeFile(path.join(profileDir, 'antigravity-browser-integration.yaml'), yaml_1.default.stringify(browserProfile), 'utf8');
            console.log(chalk_1.default.green('- Ingested browser-devtools.'));
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
            await fs.writeFile(path.join(profileDir, 'antigravity-schedule-integration.yaml'), yaml_1.default.stringify(scheduleProfile), 'utf8');
            console.log(chalk_1.default.green('- Ingested schedule (cron/timers).'));
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
            await fs.writeFile(path.join(profileDir, `mcp-${mcpName}-adapter.yaml`), yaml_1.default.stringify(mcpProfile), 'utf8');
            console.log(chalk_1.default.green(`- Ingested MCP server adapter: ${mcpName}`));
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
