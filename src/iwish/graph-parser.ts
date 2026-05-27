import * as fs from 'fs-extra';
import * as path from 'path';
import { loadSourceOfTruth } from './source-of-truth';

export type GraphNode = {
  id: string;
  label: string;
  group: 'epic' | 'story' | 'tool' | 'agent' | 'idea';
  status?: string;
};

export type GraphEdge = {
  from: string;
  to: string;
  type: string;
};

export type GraphResult = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export function extractGraphData(projectRoot: string): GraphResult {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const epicsFile = path.join(projectRoot, '_iwish-output', 'epics.md');
  if (!fs.existsSync(epicsFile)) {
    return { nodes, edges };
  }

  try {
    const content = fs.readFileSync(epicsFile, 'utf8');
    const lines = content.split('\n');
    let currentEpicId: string | null = null;

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
  } catch (error) {
    console.warn('Error parsing epics file for graph data:', error);
    return { nodes: [], edges: [] };
  }

  return { nodes, edges };
}

export function extractSprintData(projectRoot: string): any[] {
  try {
    const truth = loadSourceOfTruth(projectRoot);
    return truth.storyRecords.map(record => ({
      id: record.id,
      path: record.path,
      status: record.sprintStatus || record.fileStatus || 'backlog',
      readiness: record.readiness,
      hasAcceptanceCriteria: record.hasAcceptanceCriteria,
      hasTaskBreakdown: record.hasTaskBreakdown
    }));
  } catch (error) {
    console.warn('Error extracting sprint data:', error);
    return [];
  }
}

export function extractAgentTrace(projectRoot: string): any[] {
  const tracePath = path.join(projectRoot, '.iwish', 'runtime', 'workflows', 'agent-trace.json');
  if (fs.existsSync(tracePath)) {
    try {
      return fs.readJsonSync(tracePath);
    } catch (e) {
      console.warn('Error reading agent-trace.json:', e);
    }
  }
  return [];
}

