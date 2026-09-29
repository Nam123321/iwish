import { CodeGraphAdapter, TechnicalGraphResult } from './adapter-interface';

export class CypherAdapter implements CodeGraphAdapter {
  public readonly adapterName: string;
  private readonly connectionProfile: string;

  constructor(profile: string) {
    this.connectionProfile = profile;
    this.adapterName = `cypher-${profile}`;
  }

  async isAvailable(): Promise<boolean> {
    // Stub: Cypher-based graph databases are not yet supported.
    // Future implementations will check FalkorDB/Neo4j/Memgraph connectivity.
    return false;
  }

  async queryTechnicalGraph(_projectRoot: string): Promise<TechnicalGraphResult> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error(
        `CypherAdapter (${this.connectionProfile}) is not available. ` +
          'Graph database support is planned for a future release.',
      );
    }

    // Stub: Will execute Cypher queries against the configured graph database.
    return { nodes: [], edges: [] };
  }
}
