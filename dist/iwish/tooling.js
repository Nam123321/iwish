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
exports.loadToolRegistry = loadToolRegistry;
exports.getToolRegistryGroup = getToolRegistryGroup;
exports.resolveToolGroup = resolveToolGroup;
exports.buildToolSetupPrompts = buildToolSetupPrompts;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const yaml_1 = __importDefault(require("yaml"));
const constants_1 = require("./constants");
function readYaml(filePath) {
    return yaml_1.default.parse(fs.readFileSync(filePath, 'utf8'));
}
function loadToolRegistry() {
    const filePath = path.join(constants_1.REPO_ROOT, 'templates', 'iwish', 'runtime', 'tools', 'tool-registry.yaml');
    return readYaml(filePath);
}
function getToolRegistryGroup(groupName) {
    return (loadToolRegistry().groups || []).find((group) => group.name === groupName) || null;
}
function resolveToolGroup(input) {
    const registry = loadToolRegistry();
    for (const group of registry.groups || []) {
        if (group.name === input) {
            return { group: group.name, adapterId: null };
        }
        for (const adapter of group.adapters || []) {
            if (adapter.id === input) {
                return { group: group.name, adapterId: adapter.id };
            }
        }
    }
    return null;
}
function buildToolSetupPrompts(requiredInputs, currentSelections) {
    const prompts = [];
    const seen = new Set();
    for (const input of requiredInputs) {
        const resolved = resolveToolGroup(input);
        if (!resolved) {
            continue;
        }
        const groupInfo = getToolRegistryGroup(resolved.group);
        if (!groupInfo || seen.has(resolved.group)) {
            continue;
        }
        const currentSelection = currentSelections[resolved.group] || null;
        const adapterRequired = resolved.adapterId;
        const needsPrompt = currentSelection === null ||
            (adapterRequired !== null && currentSelection !== adapterRequired);
        if (!needsPrompt) {
            continue;
        }
        seen.add(resolved.group);
        prompts.push({
            group: resolved.group,
            reason: adapterRequired && currentSelection && currentSelection !== adapterRequired
                ? `This flow expects adapter '${adapterRequired}', but '${currentSelection}' is currently selected.`
                : adapterRequired
                    ? `This flow expects adapter '${adapterRequired}'.`
                    : `This flow requires a '${resolved.group}' tool selection before execution.`,
            recommended: adapterRequired || groupInfo.recommended || null,
            currentSelection,
            options: (groupInfo.adapters || []).map((adapter) => ({
                id: adapter.id,
                description: adapter.description || '',
                usagePackStatus: adapter.usage_pack_status || null,
            })),
            allowsOther: true,
        });
    }
    return prompts;
}
