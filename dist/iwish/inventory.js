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
exports.buildPlatformInventory = buildPlatformInventory;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const yaml_1 = __importDefault(require("yaml"));
const constants_1 = require("./constants");
const routing_profile_1 = require("./routing-profile");
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
const LEGACY_PERSONA_WORKFLOW_NAMES = new Set(Object.keys(constants_1.LEGACY_AGENT_ALIASES));
function isLegacyPersonaAgent(name) {
    return !name.endsWith('-agent') && name !== 'orch-agent' && !TRANSITIONAL_FUNCTION_AGENT_NAMES.has(name);
}
function isLegacyWorkflowEntrypoint(name) {
    return (name.startsWith('iwish-') ||
        name === 'create-capability' ||
        name === 'enhance-capability' ||
        name === 'course-correct' ||
        LEGACY_PERSONA_WORKFLOW_NAMES.has(name));
}
function isWorkflowStepFile(name) {
    return name.startsWith('step-');
}
function isWorkflowTemplate(name) {
    return name.includes('template') || name.endsWith('.template');
}
function isWorkflowSupportAsset(name) {
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
function listBasenames(dirPath, matcher) {
    if (!fs.existsSync(dirPath)) {
        return [];
    }
    return fs
        .readdirSync(dirPath)
        .filter(matcher)
        .map((entry) => matcher(entry) && entry.endsWith('.md') ? path.basename(entry, '.md') : entry)
        .sort();
}
function listSkillDirs(dirPath) {
    if (!fs.existsSync(dirPath)) {
        return [];
    }
    return fs
        .readdirSync(dirPath)
        .filter((entry) => fs.statSync(path.join(dirPath, entry)).isDirectory())
        .filter((entry) => fs.existsSync(path.join(dirPath, entry, 'SKILL.md')))
        .sort();
}
function buildPlatformInventory(projectRoot) {
    const skills = listSkillDirs(path.join(projectRoot, '.agent', 'skills'));
    const routingProfiles = (0, routing_profile_1.loadRoutingProfiles)(projectRoot).map((profile) => profile.id).sort();
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
        .filter((name) => !canonicalWorkflows.includes(name) &&
        !legacyWorkflowEntrypoints.includes(name) &&
        !workflowStepFiles.includes(name) &&
        !workflowTemplates.includes(name) &&
        !workflowSupportAssets.includes(name))
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
    const toolRegistryPath = path.join(constants_1.REPO_ROOT, 'templates', 'iwish', 'runtime', 'tools', 'tool-registry.yaml');
    const toolRegistry = fs.existsSync(toolRegistryPath)
        ? yaml_1.default.parse(fs.readFileSync(toolRegistryPath, 'utf8'))
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
        installTargets: [...constants_1.SUPPORTED_INSTALL_TARGETS],
        plannedInstallTargets: constants_1.INSTALL_TARGET_CATALOG.filter((entry) => entry.status === 'planned').map((entry) => entry.id),
    };
}
