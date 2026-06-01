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
exports.loadAliasRegistry = loadAliasRegistry;
exports.loadKnowledgeNodes = loadKnowledgeNodes;
exports.buildCatalog = buildCatalog;
exports.searchCatalog = searchCatalog;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const yaml_1 = __importDefault(require("yaml"));
const constants_1 = require("./constants");
const inventory_1 = require("./inventory");
const routing_profile_1 = require("./routing-profile");
const CANONICAL_COMMANDS = [
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
    { command: '/gen-dashboard', description: 'Synchronize the Idea Navigator and generate HTML user guide/dashboard', tags: ['command', 'tool', 'dashboard'] },
    { command: '/project-expansion-review', description: 'Evaluate impact of new features or project expansions during development', tags: ['command', 'planning', 'review', 'change-navigation'] },
];
function readYaml(filePath) {
    return yaml_1.default.parse(fs.readFileSync(filePath, 'utf8'));
}
function loadAliasRegistry(projectRoot) {
    const runtimePath = path.join((0, constants_1.getRuntimeRoot)(projectRoot, 'iwish'), 'catalog', 'alias-registry.yaml');
    const templatePath = path.join(constants_1.REPO_ROOT, 'templates', 'iwish', 'runtime', 'catalog', 'alias-registry.yaml');
    const chosen = fs.existsSync(runtimePath) ? runtimePath : templatePath;
    return readYaml(chosen);
}
function loadKnowledgeNodes() {
    const graphPath = path.join(constants_1.REPO_ROOT, '.agent', 'knowledge-graph.yaml');
    if (!fs.existsSync(graphPath)) {
        return [];
    }
    const doc = readYaml(graphPath);
    return doc.nodes || [];
}
function buildCatalog(projectRoot) {
    const aliases = loadAliasRegistry(projectRoot);
    const nodes = loadKnowledgeNodes();
    const inventory = (0, inventory_1.buildPlatformInventory)(projectRoot);
    const routingProfiles = (0, routing_profile_1.loadRoutingProfiles)(projectRoot);
    const entries = [];
    const externalModuleDir = path.join((0, constants_1.getRuntimeRoot)(projectRoot, 'iwish'), 'catalog', 'external-modules');
    const toolRegistryPath = path.join(constants_1.REPO_ROOT, 'templates', 'iwish', 'runtime', 'tools', 'tool-registry.yaml');
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
            const record = fs.readJsonSync(path.join(externalModuleDir, file));
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
        const registry = readYaml(toolRegistryPath);
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
    const profileByCanonical = new Map();
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
            tags: Array.from(new Set([
                ...entry.tags,
                profile.role,
                profile.kind,
                profile.shape,
                ...profile.phases,
                ...profile.stages,
                ...profile.triggers,
                ...(profile.tags || []),
            ])),
            source: profile.source_path || entry.source,
        };
    });
}
function searchCatalog(projectRoot, query) {
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
