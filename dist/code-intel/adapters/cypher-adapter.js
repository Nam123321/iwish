"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CypherAdapter = void 0;
class CypherAdapter {
    adapterName;
    connectionProfile;
    constructor(profile) {
        this.connectionProfile = profile;
        this.adapterName = `cypher-${profile}`;
    }
    async isAvailable() {
        // Stub: Cypher-based graph databases are not yet supported.
        // Future implementations will check FalkorDB/Neo4j/Memgraph connectivity.
        return false;
    }
    async queryTechnicalGraph(_projectRoot) {
        const available = await this.isAvailable();
        if (!available) {
            throw new Error(`CypherAdapter (${this.connectionProfile}) is not available. ` +
                'Graph database support is planned for a future release.');
        }
        // Stub: Will execute Cypher queries against the configured graph database.
        return { nodes: [], edges: [] };
    }
}
exports.CypherAdapter = CypherAdapter;
