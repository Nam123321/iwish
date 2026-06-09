import { createClient, RedisClientType } from 'redis';
import { CodeGraphAdapter, TechnicalGraphResult, TechNode, TechEdge } from './adapter-interface';
import chalk from 'chalk';

export class FalkorDBAdapter implements CodeGraphAdapter {
  public readonly adapterName: string = 'falkordb';
  private readonly connectionUrl: string;

  constructor() {
    const port = process.env.FALKORDB_PORT || '6379';
    const host = process.env.FALKORDB_HOST || '127.0.0.1';
    this.connectionUrl = `redis://${host}:${port}`;
  }

  private async getClient(): Promise<RedisClientType> {
    const client = createClient({ url: this.connectionUrl });
    client.on('error', (err) => console.error(chalk.red('[FalkorDB] Redis Client Error:'), err));
    await client.connect();
    return client as RedisClientType;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const client = await this.getClient();
      await client.ping();
      await client.disconnect();
      return true;
    } catch {
      return false;
    }
  }

  async queryTechnicalGraph(projectRoot: string): Promise<TechnicalGraphResult> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error(`FalkorDB is not reachable at ${this.connectionUrl}`);
    }

    const client = await this.getClient();
    const graphName = process.env.IWISH_GRAPH_NAME || 'codegraph';

    const result: TechnicalGraphResult = { nodes: [], edges: [] };

    try {
      // Due to the complex response format of GRAPH.QUERY in raw Redis,
      // and without a dedicated FalkorDB node SDK, we use GRAPH.RO_QUERY
      // or GRAPH.QUERY and parse the arrays.
      // Wait, we need to execute raw commands
      
      // Query Nodes
      const nodesResponse = await client.sendCommand([
        'GRAPH.RO_QUERY', 
        graphName, 
        'MATCH (n) RETURN ID(n), labels(n)[0], n.path, n.type'
      ]) as any;

      if (nodesResponse && nodesResponse[1]) {
        const rows = nodesResponse[1];
        for (const row of rows) {
          result.nodes.push({
            id: String(row[0]),
            label: String(row[1]),
            path: String(row[2]),
            type: String(row[3]) as TechNode['type']
          });
        }
      }

      // Query Edges
      const edgesResponse = await client.sendCommand([
        'GRAPH.RO_QUERY', 
        graphName, 
        'MATCH (a)-[r]->(b) RETURN ID(a), ID(b), type(r)'
      ]) as any;

      if (edgesResponse && edgesResponse[1]) {
        const rows = edgesResponse[1];
        for (const row of rows) {
          result.edges.push({
            from: String(row[0]),
            to: String(row[1]),
            type: String(row[2]) as TechEdge['type'],
            label: String(row[2])
          });
        }
      }
    } catch (err) {
      console.warn(chalk.yellow(`[FalkorDB] Query warning: ${err instanceof Error ? err.message : String(err)}`));
    } finally {
      await client.disconnect();
    }

    return result;
  }
}
