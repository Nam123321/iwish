import * as fs from 'fs-extra';
import * as path from 'path';
import YAML from 'yaml';
import { CodeGraphAdapter } from './adapter-interface';
import { CypherAdapter } from './cypher-adapter';
import { LiteStaticAdapter } from './lite-static-adapter';

type GraphProfile = {
  graph_surfaces?: {
    codebasegraph?: string;
    [key: string]: string | undefined;
  };
  [key: string]: unknown;
};

function getGraphProfilePath(projectRoot: string): string {
  return path.join(projectRoot, '.iwish', 'runtime', 'graph-profile.yaml');
}

function loadGraphProfile(projectRoot: string): GraphProfile | null {
  const profilePath = getGraphProfilePath(projectRoot);
  if (!fs.existsSync(profilePath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(profilePath, 'utf8');
    return YAML.parse(content) as GraphProfile;
  } catch {
    return null;
  }
}

export function resolveAdapter(projectRoot: string): CodeGraphAdapter {
  const profile = loadGraphProfile(projectRoot);

  if (!profile || !profile.graph_surfaces?.codebasegraph) {
    return new LiteStaticAdapter();
  }

  const adapterKey = profile.graph_surfaces.codebasegraph.toLowerCase();

  if (adapterKey === 'cypher' || adapterKey === 'falkordb' || adapterKey === 'neo4j' || adapterKey === 'memgraph') {
    return new CypherAdapter(adapterKey);
  }

  if (adapterKey === 'lite-static' || adapterKey === 'static') {
    return new LiteStaticAdapter();
  }

  // Default fallback
  return new LiteStaticAdapter();
}
