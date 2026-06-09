"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FalkorDBAdapter = void 0;
const redis_1 = require("redis");
const chalk_1 = __importDefault(require("chalk"));
class FalkorDBAdapter {
    adapterName = 'falkordb';
    connectionUrl;
    constructor() {
        const port = process.env.FALKORDB_PORT || '6379';
        const host = process.env.FALKORDB_HOST || '127.0.0.1';
        this.connectionUrl = `redis://${host}:${port}`;
    }
    async getClient() {
        const client = (0, redis_1.createClient)({ url: this.connectionUrl });
        client.on('error', (err) => console.error(chalk_1.default.red('[FalkorDB] Redis Client Error:'), err));
        await client.connect();
        return client;
    }
    async isAvailable() {
        try {
            const client = await this.getClient();
            await client.ping();
            await client.disconnect();
            return true;
        }
        catch {
            return false;
        }
    }
    async queryTechnicalGraph(projectRoot) {
        const available = await this.isAvailable();
        if (!available) {
            throw new Error(`FalkorDB is not reachable at ${this.connectionUrl}`);
        }
        const client = await this.getClient();
        const graphName = process.env.IWISH_GRAPH_NAME || 'codegraph';
        const result = { nodes: [], edges: [] };
        try {
            // Due to the complex response format of GRAPH.QUERY in raw Redis,
            // and without a dedicated FalkorDB node SDK, we use GRAPH.RO_QUERY
            // or GRAPH.QUERY and parse the arrays.
            // Wait, we need to execute raw commands
            // Query Nodes
            const nodesResponse = await client.sendCommand([
                'GRAPH.RO_QUERY',
                graphName,
                'MATCH (n) RETURN n.id, labels(n)[0], n.path, n.type'
            ]);
            if (nodesResponse && nodesResponse[1]) {
                const rows = nodesResponse[1];
                for (const row of rows) {
                    result.nodes.push({
                        id: String(row[0]),
                        label: String(row[1]),
                        path: String(row[2]),
                        type: String(row[3])
                    });
                }
            }
            // Query Edges
            const edgesResponse = await client.sendCommand([
                'GRAPH.RO_QUERY',
                graphName,
                'MATCH (a)-[r]->(b) RETURN a.id, b.id, type(r)'
            ]);
            if (edgesResponse && edgesResponse[1]) {
                const rows = edgesResponse[1];
                for (const row of rows) {
                    result.edges.push({
                        from: String(row[0]),
                        to: String(row[1]),
                        type: String(row[2]),
                        label: String(row[2])
                    });
                }
            }
        }
        catch (err) {
            console.warn(chalk_1.default.yellow(`[FalkorDB] Query warning: ${err instanceof Error ? err.message : String(err)}`));
        }
        finally {
            await client.disconnect();
        }
        return result;
    }
}
exports.FalkorDBAdapter = FalkorDBAdapter;
