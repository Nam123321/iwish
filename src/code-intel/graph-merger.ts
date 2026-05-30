import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { resolveAdapter } from './adapters/adapter-router';
import { LiteStaticAdapter } from './adapters/lite-static-adapter';
import { loadSemanticCache, saveSemanticCache } from './semantic-analyzer';

import { TechNode, TechEdge } from './adapters/adapter-interface';

export type HybridNode = {
  id: string;
  label: string;
  group: string;
  layer: string;
  summary: string | null;
  complexity: string;
  tags: string[];
};

export type HybridEdge = {
  from: string;
  to: string;
  type: string;
  label: string;
};

export type HybridGraph = {
  nodes: HybridNode[];
  edges: HybridEdge[];
  metadata: {
    generatedAt: string;
    adapterUsed: string;
    nodeCount: number;
    edgeCount: number;
  };
};

function deriveGroup(filePath: string): string {
  const segments = filePath.split(path.sep);
  if (segments.length >= 2) {
    return segments[segments.length - 2];
  }
  return 'root';
}

function buildHybridNode(
  techNode: TechNode,
  semanticCache: Record<string, { summary: string; tags: string[]; layer: string; complexity: string }>,
): HybridNode {
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

function buildHybridEdge(techEdge: TechEdge): HybridEdge {
  return {
    from: techEdge.from,
    to: techEdge.to,
    type: techEdge.type,
    label: techEdge.label || techEdge.type,
  };
}

function getOutputPath(projectRoot: string): string {
  return path.join(projectRoot, '.iwish', 'cache', 'iwish-code-graph.json');
}

export async function mergeGraphs(projectRoot: string): Promise<HybridGraph> {
  // Resolve adapter and check availability, fallback to lite-static
  let adapter = resolveAdapter(projectRoot);
  const adapterAvailable = await adapter.isAvailable();

  if (!adapterAvailable) {
    console.warn(
      chalk.yellow(`[graph-merger] Adapter '${adapter.adapterName}' is not available. Falling back to lite-static.`),
    );
    adapter = new LiteStaticAdapter();
  }

  // Query technical graph
  const technicalGraph = await adapter.queryTechnicalGraph(projectRoot);

  // Load semantic cache
  const semanticCache = loadSemanticCache(projectRoot);

  // Build hybrid nodes
  const nodeIds = new Set<string>();
  const hybridNodes: HybridNode[] = [];
  for (const techNode of technicalGraph.nodes) {
    hybridNodes.push(buildHybridNode(techNode, semanticCache));
    nodeIds.add(techNode.path);
  }

  // Build hybrid edges
  const hybridEdges: HybridEdge[] = technicalGraph.edges.map(buildHybridEdge);

  // Garbage collection: remove orphaned semantic keys not present in current graph
  const updatedCache: Record<string, (typeof semanticCache)[string]> = {};
  let orphanCount = 0;
  for (const [key, value] of Object.entries(semanticCache)) {
    if (nodeIds.has(key)) {
      updatedCache[key] = value;
    } else {
      orphanCount++;
    }
  }
  if (orphanCount > 0) {
    console.log(chalk.gray(`[graph-merger] Garbage-collected ${orphanCount} orphaned semantic cache entries.`));
    await saveSemanticCache(projectRoot, updatedCache);
  }

  const graph: HybridGraph = {
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
