import * as fs from 'fs-extra';
import * as path from 'path';
import { createClient } from 'redis';
import { formatOKFUri } from './okf-helper';
import YAML from 'yaml';

export interface OKFNode {
  type: string;
  title: string;
  resource: string;
  timestamp: string;
  links_to?: string[];
}

/**
 * Helper to get the active graph DB type and connection details.
 */
export function getGraphDBConfig() {
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
export async function isGraphDBOnline(): Promise<boolean> {
  const config = getGraphDBConfig();
  if (config.type === 'falkordb') {
    try {
      const client = createClient({ url: `redis://${config.host}:${config.port}` });
      // Set short connection timeout to prevent hanging
      client.on('error', () => {});
      await client.connect();
      const ping = await client.ping();
      await client.disconnect();
      return ping === 'PONG';
    } catch {
      return false;
    }
  } else if (config.type === 'neo4j' || config.type === 'memgraph') {
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
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Execute Cypher query on active database backend.
 */
export async function executeCypher(query: string): Promise<any> {
  const config = getGraphDBConfig();
  if (config.type === 'falkordb') {
    const client = createClient({ url: `redis://${config.host}:${config.port}` });
    await client.connect();
    try {
      const result = await client.sendCommand(['GRAPH.QUERY', config.graphName, query]);
      return result;
    } finally {
      await client.disconnect();
    }
  } else if (config.type === 'neo4j' || config.type === 'memgraph') {
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
export async function upsertOKFNodeInDB(node: OKFNode): Promise<void> {
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
export async function getDepth2ResourcesFromDB(startResource: string): Promise<string[]> {
  const sanitizedStart = startResource.replace(/'/g, "\\'");
  const query = `MATCH (start:OKFDocument {resource: '${sanitizedStart}'})-[*1..2]-(adjacent:OKFDocument) ` +
    `RETURN DISTINCT adjacent.resource`;
  const result = await executeCypher(query);

  const resources: string[] = [];

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
  } else if (config.type === 'neo4j' || config.type === 'memgraph') {
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
export function scanOKFMarkdownFiles(dir: string, projectRoot: string): OKFNode[] {
  const okfNodes: OKFNode[] = [];
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
    } else if (entry.name.endsWith('.md') && !entry.name.endsWith('DESIGN.md') && !entry.name.endsWith('user-guide.md')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        if (match) {
          const parsed = YAML.parse(match[1]);
          if (parsed && parsed.type && parsed.title) {
            okfNodes.push({
              type: String(parsed.type),
              title: String(parsed.title),
              resource: formatOKFUri(fullPath, projectRoot),
              timestamp: parsed.timestamp ? String(parsed.timestamp) : new Date().toISOString(),
              links_to: Array.isArray(parsed.links_to) ? parsed.links_to.map((l: string) => formatOKFUri(l, projectRoot)) : [],
            });
          }
        }
      } catch {
        // Skip malformed markdown/yaml files in scan
      }
    }
  }

  return okfNodes;
}

/**
 * Dynamic in-memory BFS depth-2 traversal search query (lite-static fallback).
 */
export function getDepth2ResourcesStatic(startResource: string, projectRoot: string): string[] {
  const iwishOutputDir = path.join(projectRoot, '_iwish-output');
  const allNodes = scanOKFMarkdownFiles(iwishOutputDir, projectRoot);

  // Build undirected adjacency list
  const adj = new Map<string, Set<string>>();
  for (const node of allNodes) {
    if (!adj.has(node.resource)) adj.set(node.resource, new Set());
    if (node.links_to) {
      for (const link of node.links_to) {
        if (!adj.has(link)) adj.set(link, new Set());
        adj.get(node.resource)!.add(link);
        adj.get(link)!.add(node.resource);
      }
    }
  }

  // BFS depth-2 traversal
  const visited = new Set<string>();
  visited.add(startResource);

  const result: string[] = [];
  const queue: Array<{ res: string; depth: number }> = [{ res: startResource, depth: 0 }];

  while (queue.length > 0) {
    const { res, depth } = queue.shift()!;
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
export async function getCompressedContextURIs(startResource: string, projectRoot: string): Promise<string[]> {
  const online = await isGraphDBOnline();
  if (online) {
    try {
      return await getDepth2ResourcesFromDB(startResource);
    } catch (error) {
      console.warn(`[Graph DB] Query failed, falling back to static scan: ${(error as Error).message}`);
    }
  }
  return getDepth2ResourcesStatic(startResource, projectRoot);
}
