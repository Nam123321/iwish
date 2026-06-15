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
exports.getGraphDBConfig = getGraphDBConfig;
exports.isGraphDBOnline = isGraphDBOnline;
exports.executeCypher = executeCypher;
exports.upsertOKFNodeInDB = upsertOKFNodeInDB;
exports.getDepth2ResourcesFromDB = getDepth2ResourcesFromDB;
exports.scanOKFMarkdownFiles = scanOKFMarkdownFiles;
exports.getDepth2ResourcesStatic = getDepth2ResourcesStatic;
exports.getCompressedContextURIs = getCompressedContextURIs;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const redis_1 = require("redis");
const okf_helper_1 = require("./okf-helper");
const yaml_1 = __importDefault(require("yaml"));
/**
 * Helper to get the active graph DB type and connection details.
 */
function getGraphDBConfig() {
    return {
        type: process.env.GRAPH_DB_TYPE || 'falkordb',
        host: process.env.FALKORDB_HOST || 'localhost',
        port: parseInt(process.env.FALKORDB_PORT || '6379', 10),
        graphName: process.env.GRAPH_NAME || 'featuregraph',
        neo4jUri: process.env.NEO4J_URI || 'http://localhost:7474',
        neo4jAuth: process.env.NEO4J_AUTH || 'neo4j:password',
    };
}
/**
 * Checks if the configured graph database is online.
 */
async function isGraphDBOnline() {
    const config = getGraphDBConfig();
    if (config.type === 'falkordb') {
        try {
            const client = (0, redis_1.createClient)({ url: `redis://${config.host}:${config.port}` });
            // Set short connection timeout to prevent hanging
            client.on('error', () => { });
            await client.connect();
            const ping = await client.ping();
            await client.disconnect();
            return ping === 'PONG';
        }
        catch {
            return false;
        }
    }
    else if (config.type === 'neo4j' || config.type === 'memgraph') {
        try {
            const auth = Buffer.from(config.neo4jAuth).toString('base64');
            const response = await fetch(`${config.neo4jUri}/db/neo4j/tx/commit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${auth}`,
                },
                body: JSON.stringify({ statements: [{ statement: 'RETURN 1' }] }),
                signal: AbortSignal.timeout(1000), // 1s timeout
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    return false;
}
/**
 * Execute Cypher query on active database backend.
 */
async function executeCypher(query) {
    const config = getGraphDBConfig();
    if (config.type === 'falkordb') {
        const client = (0, redis_1.createClient)({ url: `redis://${config.host}:${config.port}` });
        await client.connect();
        try {
            const result = await client.sendCommand(['GRAPH.QUERY', config.graphName, query]);
            return result;
        }
        finally {
            await client.disconnect();
        }
    }
    else if (config.type === 'neo4j' || config.type === 'memgraph') {
        const auth = Buffer.from(config.neo4jAuth).toString('base64');
        const response = await fetch(`${config.neo4jUri}/db/neo4j/tx/commit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`,
            },
            body: JSON.stringify({ statements: [{ statement: query }] }),
        });
        if (!response.ok) {
            throw new Error(`Neo4j/Memgraph query failed: ${response.statusText}`);
        }
        return response.json();
    }
    throw new Error(`Unsupported graph database type: ${config.type}`);
}
/**
 * Upsert OKF Document node and its relationships.
 */
async function upsertOKFNodeInDB(node) {
    // Sanitize values for Cypher statement
    const resource = node.resource.replace(/'/g, "\\'");
    const type = node.type.replace(/'/g, "\\'");
    const title = node.title.replace(/'/g, "\\'");
    const timestamp = node.timestamp.replace(/'/g, "\\'");
    // MERGE node
    const mergeNodeQuery = `MERGE (d:OKFDocument {resource: '${resource}'}) ` +
        `SET d.type = '${type}', d.title = '${title}', d.timestamp = '${timestamp}'`;
    await executeCypher(mergeNodeQuery);
    // MERGE links_to edges
    if (node.links_to && node.links_to.length > 0) {
        for (const link of node.links_to) {
            const sanitizedLink = link.replace(/'/g, "\\'");
            // Ensure target node exists (even as stub) so relationship can be formed
            const mergeTargetQuery = `MERGE (t:OKFDocument {resource: '${sanitizedLink}'})`;
            await executeCypher(mergeTargetQuery);
            const relationQuery = `MATCH (src:OKFDocument {resource: '${resource}'}), (dest:OKFDocument {resource: '${sanitizedLink}'}) ` +
                `MERGE (src)-[:LINKS_TO]->(dest)`;
            await executeCypher(relationQuery);
        }
    }
}
/**
 * Perform depth-2 query traversal to get adjacent resources.
 */
async function getDepth2ResourcesFromDB(startResource) {
    const sanitizedStart = startResource.replace(/'/g, "\\'");
    const query = `MATCH (start:OKFDocument {resource: '${sanitizedStart}'})-[*1..2]-(adjacent:OKFDocument) ` +
        `RETURN DISTINCT adjacent.resource`;
    const result = await executeCypher(query);
    const resources = [];
    // Parse result based on database type format
    const config = getGraphDBConfig();
    if (config.type === 'falkordb') {
        // FalkorDB returns Graph response array where columns are headers and rows are data
        // Result format is [ [ 'adjacent.resource' ], [ [ 'val1' ], [ 'val2' ] ], [ ...stats ] ]
        if (Array.isArray(result) && result.length >= 2) {
            const rows = result[1];
            if (Array.isArray(rows)) {
                for (const row of rows) {
                    if (Array.isArray(row) && row.length > 0) {
                        resources.push(String(row[0]));
                    }
                }
            }
        }
    }
    else if (config.type === 'neo4j' || config.type === 'memgraph') {
        // Neo4j Transaction Response format: { results: [ { columns: [...], data: [ { row: [val] } ] } ] }
        if (result && Array.isArray(result.results) && result.results.length > 0) {
            const data = result.results[0].data;
            if (Array.isArray(data)) {
                for (const item of data) {
                    if (item && Array.isArray(item.row) && item.row.length > 0) {
                        resources.push(String(item.row[0]));
                    }
                }
            }
        }
    }
    return resources;
}
/**
 * Recursively scans _iwish-output/ for OKF markdown files.
 */
function scanOKFMarkdownFiles(dir, projectRoot) {
    const okfNodes = [];
    if (!fs.existsSync(dir)) {
        return okfNodes;
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== 'scratch' && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
                okfNodes.push(...scanOKFMarkdownFiles(fullPath, projectRoot));
            }
        }
        else if (entry.name.endsWith('.md') && !entry.name.endsWith('DESIGN.md') && !entry.name.endsWith('user-guide.md')) {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const match = content.match(/^---\n([\s\S]*?)\n---/);
                if (match) {
                    const parsed = yaml_1.default.parse(match[1]);
                    if (parsed && parsed.type && parsed.title) {
                        okfNodes.push({
                            type: String(parsed.type),
                            title: String(parsed.title),
                            resource: (0, okf_helper_1.formatOKFUri)(fullPath, projectRoot),
                            timestamp: parsed.timestamp ? String(parsed.timestamp) : new Date().toISOString(),
                            links_to: Array.isArray(parsed.links_to) ? parsed.links_to.map((l) => (0, okf_helper_1.formatOKFUri)(l, projectRoot)) : [],
                        });
                    }
                }
            }
            catch {
                // Skip malformed markdown/yaml files in scan
            }
        }
    }
    return okfNodes;
}
/**
 * Dynamic in-memory BFS depth-2 traversal search query (lite-static fallback).
 */
function getDepth2ResourcesStatic(startResource, projectRoot) {
    const iwishOutputDir = path.join(projectRoot, '_iwish-output');
    const allNodes = scanOKFMarkdownFiles(iwishOutputDir, projectRoot);
    // Build undirected adjacency list
    const adj = new Map();
    for (const node of allNodes) {
        if (!adj.has(node.resource))
            adj.set(node.resource, new Set());
        if (node.links_to) {
            for (const link of node.links_to) {
                if (!adj.has(link))
                    adj.set(link, new Set());
                adj.get(node.resource).add(link);
                adj.get(link).add(node.resource);
            }
        }
    }
    // BFS depth-2 traversal
    const visited = new Set();
    visited.add(startResource);
    const result = [];
    const queue = [{ res: startResource, depth: 0 }];
    while (queue.length > 0) {
        const { res, depth } = queue.shift();
        if (depth >= 2) {
            continue;
        }
        const neighbors = adj.get(res);
        if (neighbors) {
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    result.push(neighbor);
                    queue.push({ res: neighbor, depth: depth + 1 });
                }
            }
        }
    }
    return result;
}
/**
 * Consolidated entrypoint for retrieving depth-2 traversal context files.
 */
async function getCompressedContextURIs(startResource, projectRoot) {
    const online = await isGraphDBOnline();
    if (online) {
        try {
            return await getDepth2ResourcesFromDB(startResource);
        }
        catch (error) {
            console.warn(`[Graph DB] Query failed, falling back to static scan: ${error.message}`);
        }
    }
    return getDepth2ResourcesStatic(startResource, projectRoot);
}
