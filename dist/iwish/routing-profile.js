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
exports.loadRoutingProfiles = loadRoutingProfiles;
exports.getRoutingProfileSummary = getRoutingProfileSummary;
exports.generateRoutingProfile = generateRoutingProfile;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const yaml_1 = __importDefault(require("yaml"));
const constants_1 = require("./constants");
function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'routing-profile';
}
function readYaml(filePath) {
    return yaml_1.default.parse(fs.readFileSync(filePath, 'utf8'));
}
function scanYamlFiles(dirPath) {
    if (!fs.existsSync(dirPath)) {
        return [];
    }
    return fs
        .readdirSync(dirPath)
        .filter((entry) => entry.endsWith('.yaml') || entry.endsWith('.yml'))
        .map((entry) => path.join(dirPath, entry))
        .sort();
}
function normalizeProfile(raw, fallback) {
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
function scanSkillProfiles(projectRoot) {
    const skillRoot = path.join(projectRoot, '.agent', 'skills');
    if (!fs.existsSync(skillRoot)) {
        return [];
    }
    const output = [];
    for (const entry of fs.readdirSync(skillRoot)) {
        const profilePath = path.join(skillRoot, entry, 'routing-profile.yaml');
        if (!fs.existsSync(profilePath)) {
            continue;
        }
        const raw = readYaml(profilePath);
        output.push(normalizeProfile(raw, {
            id: `skill-${entry}`,
            name: entry,
            kind: 'skill',
            sourcePath: `/.agent/skills/${entry}/routing-profile.yaml`,
        }));
    }
    return output.sort((a, b) => a.id.localeCompare(b.id));
}
function scanWorkflowProfiles(projectRoot) {
    const workflowRoot = path.join(projectRoot, '.agent', 'workflows');
    return scanYamlFiles(workflowRoot)
        .filter((filePath) => path.basename(filePath).endsWith('.routing-profile.yaml'))
        .map((filePath) => {
        const basename = path.basename(filePath, '.routing-profile.yaml');
        const raw = readYaml(filePath);
        return normalizeProfile(raw, {
            id: `workflow-${basename}`,
            name: basename,
            kind: 'workflow',
            sourcePath: `/.agent/workflows/${path.basename(filePath)}`,
        });
    });
}
function scanAgentProfiles(projectRoot) {
    const agentRoot = path.join(projectRoot, '.agent', 'agents');
    return scanYamlFiles(agentRoot)
        .filter((filePath) => path.basename(filePath).endsWith('.routing-profile.yaml'))
        .map((filePath) => {
        const basename = path.basename(filePath, '.routing-profile.yaml');
        const raw = readYaml(filePath);
        return normalizeProfile(raw, {
            id: `agent-${basename}`,
            name: basename,
            kind: 'agent',
            sourcePath: `/.agent/agents/${path.basename(filePath)}`,
        });
    });
}
function scanExternalModuleProfiles(projectRoot) {
    const profileRoot = path.join((0, constants_1.getRuntimeRoot)(projectRoot, 'iwish'), 'catalog', 'routing-profiles');
    return scanYamlFiles(profileRoot).map((filePath) => {
        const basename = path.basename(filePath, path.extname(filePath));
        const raw = readYaml(filePath);
        return normalizeProfile(raw, {
            id: `external-module-${basename}`,
            name: basename,
            kind: raw.kind === 'repo-absorption' ? 'repo-absorption' : 'external-module',
            sourcePath: path.relative(projectRoot, filePath),
        });
    });
}
function loadRoutingProfiles(projectRoot) {
    const profiles = [
        ...scanSkillProfiles(projectRoot),
        ...scanWorkflowProfiles(projectRoot),
        ...scanAgentProfiles(projectRoot),
        ...scanExternalModuleProfiles(projectRoot),
    ];
    const seen = new Set();
    return profiles.filter((profile) => {
        if (seen.has(profile.id)) {
            return false;
        }
        seen.add(profile.id);
        return true;
    });
}
function getRoutingProfileSummary(projectRoot) {
    const profiles = loadRoutingProfiles(projectRoot);
    const byKind = {};
    const byRole = {};
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
async function generateRoutingProfile(projectRoot, input) {
    const slug = slugify(input.name);
    const profile = {
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
    await fs.writeFile(input.targetPath, yaml_1.default.stringify(profile), 'utf8');
    return input.targetPath;
}
