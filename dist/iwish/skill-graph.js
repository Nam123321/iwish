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
exports.buildSkillGraphReport = buildSkillGraphReport;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const yaml_1 = __importDefault(require("yaml"));
const inventory_1 = require("./inventory");
const routing_profile_1 = require("./routing-profile");
function readKnowledgeGraph(projectRoot) {
    const graphPath = path.join(projectRoot, '.agent', 'knowledge-graph.yaml');
    if (!fs.existsSync(graphPath)) {
        return [];
    }
    const doc = yaml_1.default.parse(fs.readFileSync(graphPath, 'utf8'));
    return doc.nodes || [];
}
function listSkillDirs(projectRoot) {
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
function listLibrarySkillFiles(projectRoot) {
    const libraryRoot = path.join(projectRoot, 'templates', 'library');
    if (!fs.existsSync(libraryRoot)) {
        return [];
    }
    const output = [];
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
function scanCallers(projectRoot, kind) {
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
function classifyWorkflowLifecycle(name) {
    if ([
        'bmad-brainstorming',
        'bmad-bmm-market-research',
        'bmad-bmm-domain-research',
        'bmad-bmm-technical-research',
        'bmad-bmm-generate-project-context',
        'bmad-bmm-document-project',
        'research',
        'analyze-codebase',
        'research-project-modules',
    ].includes(name)) {
        return 'analysis';
    }
    if ([
        'bmad-bmm-create-product-brief',
        'bmad-bmm-create-prd',
        'bmad-bmm-edit-prd',
        'bmad-bmm-validate-prd',
        'plan',
        'make-story',
        'prd-purpose',
    ].includes(name)) {
        return 'planning';
    }
    if ([
        'bmad-bmm-create-architecture',
        'bmad-bmm-create-epics-and-stories',
        'bmad-bmm-create-ui-spec',
        'bmad-bmm-create-ux-design',
        'bmad-bmm-check-implementation-readiness',
        'make-ui-spec',
    ].includes(name)) {
        return 'solutioning';
    }
    if ([
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
    ].includes(name)) {
        return 'implementation';
    }
    return null;
}
function buildWorkflowCapabilityNodes(projectRoot) {
    const inventory = (0, inventory_1.buildPlatformInventory)(projectRoot);
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
        let classification = 'routable';
        if (inventory.canonicalWorkflows.includes(name)) {
            classification = 'routable';
        }
        else if (inventory.activeNonCanonicalWorkflows.includes(name)) {
            classification = 'tactical';
        }
        else if (inventory.legacyWorkflowEntrypoints.includes(name)) {
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
function buildSkillGraphReport(projectRoot) {
    const kgNodes = readKnowledgeGraph(projectRoot);
    const skillDirs = listSkillDirs(projectRoot);
    const libraryPackSkills = listLibrarySkillFiles(projectRoot);
    const routingProfiles = (0, routing_profile_1.loadRoutingProfiles)(projectRoot);
    const workflowFiles = scanCallers(projectRoot, 'workflows');
    const agentFiles = scanCallers(projectRoot, 'agents');
    const skillNodes = kgNodes.filter((node) => node.type === 'skill');
    const inboundMap = new Map();
    for (const node of skillNodes) {
        for (const dep of node.depends_on || []) {
            const current = inboundMap.get(dep) || [];
            current.push(node.id);
            inboundMap.set(dep, current);
        }
    }
    const packageSkillNodes = skillNodes.map((node) => {
        const skillName = node.path?.split('/').slice(-2, -1)[0] || node.id.replace(/^skill-/, '');
        const workflowCallers = workflowFiles
            .filter((file) => file.content.includes(`/.agent/skills/${skillName}/`) || file.content.includes(node.id) || file.content.includes(`${skillName}/SKILL.md`))
            .map((file) => file.file);
        const agentCallers = agentFiles
            .filter((file) => file.content.includes(`/.agent/skills/${skillName}/`) || file.content.includes(node.id) || file.content.includes(`${skillName}/SKILL.md`))
            .map((file) => file.file);
        const inboundDependencies = inboundMap.get(node.id) || [];
        let classification = 'routable';
        if (workflowCallers.length === 0 && agentCallers.length === 0 && inboundDependencies.length === 0) {
            classification = 'orphan';
        }
        else if (workflowCallers.length + agentCallers.length > 0 && !skillName.includes('repo-absorption') && !skillName.includes('security-guardian')) {
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
    const skillProfileNames = new Set(routingProfiles
        .filter((profile) => profile.kind === 'skill')
        .map((profile) => profile.name));
    const workflowProfileNames = new Set(routingProfiles
        .filter((profile) => profile.kind === 'workflow')
        .map((profile) => profile.name));
    const unprofiledSkills = skillDirs.filter((skill) => !skillProfileNames.has(skill));
    const workflowCapabilities = workflowCapabilityNodes.map((node) => node.id.replace(/^workflow-/, ''));
    const unprofiledWorkflowCapabilities = workflowCapabilities.filter((name) => !workflowProfileNames.has(name));
    const inventory = (0, inventory_1.buildPlatformInventory)(projectRoot);
    const inheritedLifecycleCoverage = {
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
