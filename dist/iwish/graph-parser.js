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
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractGraphData = extractGraphData;
exports.extractSprintData = extractSprintData;
exports.extractAgentTrace = extractAgentTrace;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const source_of_truth_1 = require("./source-of-truth");
function extractGraphData(projectRoot) {
    const nodes = [];
    const edges = [];
    const epicsFile = path.join(projectRoot, '_iwish-output', 'epics.md');
    if (!fs.existsSync(epicsFile)) {
        return { nodes, edges };
    }
    try {
        const content = fs.readFileSync(epicsFile, 'utf8');
        const lines = content.split('\n');
        let currentEpicId = null;
        // Add root Idea node
        nodes.push({
            id: 'root-idea',
            label: 'Core Idea / Product Vision',
            group: 'idea'
        });
        for (const line of lines) {
            // Matches: ## Epic 1: Antigravity 2.0 Adapter & Multi-Platform Shim
            const epicMatch = line.match(/^##\s+Epic\s+(\d+):\s*(.+)$/i);
            if (epicMatch) {
                const num = epicMatch[1];
                const title = epicMatch[2].trim();
                currentEpicId = `epic-${num}`;
                nodes.push({
                    id: currentEpicId,
                    label: `Epic ${num}: ${title}`,
                    group: 'epic'
                });
                edges.push({
                    from: 'root-idea',
                    to: currentEpicId,
                    type: 'spawns'
                });
                continue;
            }
            // Matches: ### Story 1.1: Platform Detection & Context Routing
            const storyMatch = line.match(/^###\s+Story\s+(\d+\.\d+):\s*(.+)$/i);
            if (storyMatch) {
                const num = storyMatch[1];
                const title = storyMatch[2].trim();
                const storyId = `story-${num}`;
                nodes.push({
                    id: storyId,
                    label: `Story ${num}: ${title}`,
                    group: 'story'
                });
                if (currentEpicId) {
                    edges.push({
                        from: currentEpicId,
                        to: storyId,
                        type: 'contains'
                    });
                }
            }
        }
    }
    catch (error) {
        console.warn('Error parsing epics file for graph data:', error);
        return { nodes: [], edges: [] };
    }
    return { nodes, edges };
}
function extractSprintData(projectRoot) {
    try {
        const truth = (0, source_of_truth_1.loadSourceOfTruth)(projectRoot);
        return truth.storyRecords.map(record => ({
            id: record.id,
            path: record.path,
            status: record.sprintStatus || record.fileStatus || 'backlog',
            readiness: record.readiness,
            hasAcceptanceCriteria: record.hasAcceptanceCriteria,
            hasTaskBreakdown: record.hasTaskBreakdown
        }));
    }
    catch (error) {
        console.warn('Error extracting sprint data:', error);
        return [];
    }
}
function extractAgentTrace(projectRoot) {
    const tracePath = path.join(projectRoot, '.iwish', 'runtime', 'workflows', 'agent-trace.json');
    if (fs.existsSync(tracePath)) {
        try {
            return fs.readJsonSync(tracePath);
        }
        catch (e) {
            console.warn('Error reading agent-trace.json:', e);
        }
    }
    return [];
}
