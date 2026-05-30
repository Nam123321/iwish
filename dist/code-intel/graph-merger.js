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
exports.mergeGraphs = mergeGraphs;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const adapter_router_1 = require("./adapters/adapter-router");
const lite_static_adapter_1 = require("./adapters/lite-static-adapter");
const semantic_analyzer_1 = require("./semantic-analyzer");
function deriveGroup(filePath) {
    const segments = filePath.split(path.sep);
    if (segments.length >= 2) {
        return segments[segments.length - 2];
    }
    return 'root';
}
function buildHybridNode(techNode, semanticCache) {
    const semantic = semanticCache[techNode.path] || null;
    return {
        id: techNode.id,
        label: techNode.label,
        group: deriveGroup(techNode.path),
        layer: semantic?.layer || 'unknown',
        summary: semantic?.summary || null,
        complexity: semantic?.complexity || 'unknown',
        tags: semantic?.tags || [],
    };
}
function buildHybridEdge(techEdge) {
    return {
        from: techEdge.from,
        to: techEdge.to,
        type: techEdge.type,
        label: techEdge.label || techEdge.type,
    };
}
function getOutputPath(projectRoot) {
    return path.join(projectRoot, '.iwish', 'cache', 'iwish-code-graph.json');
}
async function mergeGraphs(projectRoot) {
    // Resolve adapter and check availability, fallback to lite-static
    let adapter = (0, adapter_router_1.resolveAdapter)(projectRoot);
    const adapterAvailable = await adapter.isAvailable();
    if (!adapterAvailable) {
        console.warn(chalk_1.default.yellow(`[graph-merger] Adapter '${adapter.adapterName}' is not available. Falling back to lite-static.`));
        adapter = new lite_static_adapter_1.LiteStaticAdapter();
    }
    // Query technical graph
    const technicalGraph = await adapter.queryTechnicalGraph(projectRoot);
    // Load semantic cache
    const semanticCache = (0, semantic_analyzer_1.loadSemanticCache)(projectRoot);
    // Build hybrid nodes
    const nodeIds = new Set();
    const hybridNodes = [];
    for (const techNode of technicalGraph.nodes) {
        hybridNodes.push(buildHybridNode(techNode, semanticCache));
        nodeIds.add(techNode.path);
    }
    // Build hybrid edges
    const hybridEdges = technicalGraph.edges.map(buildHybridEdge);
    // Garbage collection: remove orphaned semantic keys not present in current graph
    const updatedCache = {};
    let orphanCount = 0;
    for (const [key, value] of Object.entries(semanticCache)) {
        if (nodeIds.has(key)) {
            updatedCache[key] = value;
        }
        else {
            orphanCount++;
        }
    }
    if (orphanCount > 0) {
        console.log(chalk_1.default.gray(`[graph-merger] Garbage-collected ${orphanCount} orphaned semantic cache entries.`));
        await (0, semantic_analyzer_1.saveSemanticCache)(projectRoot, updatedCache);
    }
    const graph = {
        nodes: hybridNodes,
        edges: hybridEdges,
        metadata: {
            generatedAt: new Date().toISOString(),
            adapterUsed: adapter.adapterName,
            nodeCount: hybridNodes.length,
            edgeCount: hybridEdges.length,
        },
    };
    // Write output
    const outputPath = getOutputPath(projectRoot);
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeJson(outputPath, graph, { spaces: 2 });
    return graph;
}
