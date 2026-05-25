import * as fs from 'fs-extra';
import * as path from 'path';

import { getRuntimeRoot } from './constants';

export type ReconciliationRecord = {
  timestamp: string;
  type: 'bugfix' | 'code-change' | 'feature-tweak' | 'design-tweak' | 'repo-absorption';
  summary: string;
  storyId: string | null;
  epicId: string | null;
  touchedFiles: string[];
  graphStatus: 'available' | 'degraded' | 'unavailable';
  requiredUpdates: string[];
  notes?: string;
};

export type ReconciliationStatus = {
  pendingCount: number;
  workItemCount: number;
  sourceOfTruthArtifactCount: number;
  latestRecord: string | null;
};

function nowIso(): string {
  return new Date().toISOString();
}

function getQueueDir(projectRoot: string): string {
  return path.join(getRuntimeRoot(projectRoot, 'iwish'), 'runtime', 'reconciliation-queue');
}

function getWorkItemDir(projectRoot: string): string {
  return path.join(getRuntimeRoot(projectRoot, 'iwish'), 'runtime', 'reconciliation-workitems');
}

function getSourceOfTruthDir(projectRoot: string): string {
  return path.join(projectRoot, '_bmad-output', 'reconciliation');
}

function buildWorkItemMarkdown(record: ReconciliationRecord): string {
  const touchedFiles = record.touchedFiles.length > 0 ? record.touchedFiles.map((file) => `- ${file}`).join('\n') : '- None provided';
  const requiredUpdates = record.requiredUpdates.map((item) => `- ${item}`).join('\n');
  const links = [
    record.storyId ? `- Story: ${record.storyId}` : null,
    record.epicId ? `- Epic: ${record.epicId}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `# Reconciliation Work Item\n\n## Summary\n- Timestamp: ${record.timestamp}\n- Type: ${record.type}\n- Graph Status: ${record.graphStatus}\n- Summary: ${record.summary}\n\n## Linked Scope\n${links || '- No story or epic linked'}\n\n## Touched Files\n${touchedFiles}\n\n## Required Updates\n${requiredUpdates}\n\n## Notes\n${record.notes || 'None'}\n`;
}

export async function queueReconciliation(projectRoot: string, input: Omit<ReconciliationRecord, 'timestamp'>): Promise<ReconciliationRecord> {
  const record: ReconciliationRecord = {
    timestamp: nowIso(),
    ...input,
  };

  const queueDir = getQueueDir(projectRoot);
  const workItemDir = getWorkItemDir(projectRoot);
  const sourceOfTruthDir = getSourceOfTruthDir(projectRoot);
  await fs.ensureDir(queueDir);
  await fs.ensureDir(workItemDir);
  await fs.ensureDir(sourceOfTruthDir);
  const filename = `${record.timestamp.replace(/[:.]/g, '-')}-${record.type}.json`;
  const basename = filename.replace(/\.json$/, '');
  await fs.writeJson(path.join(queueDir, filename), record, { spaces: 2 });
  await fs.writeFile(path.join(workItemDir, `${basename}.md`), buildWorkItemMarkdown(record), 'utf8');

  const scopeName = record.storyId || record.epicId || 'general';
  const sourceOfTruthPath = path.join(sourceOfTruthDir, `${scopeName}.md`);
  if (!fs.existsSync(sourceOfTruthPath)) {
    await fs.writeFile(sourceOfTruthPath, `# Source-of-Truth Reconciliation: ${scopeName}\n`, 'utf8');
  }
  const syncEntry = `\n## ${record.timestamp} — ${record.type}\n- Summary: ${record.summary}\n- Graph Status: ${record.graphStatus}\n- Required Updates: ${record.requiredUpdates.join(', ')}\n- Touched Files: ${record.touchedFiles.join(', ') || 'None provided'}\n- Notes: ${record.notes || 'None'}\n`;
  await fs.appendFile(sourceOfTruthPath, syncEntry, 'utf8');

  return record;
}

export function getReconciliationStatus(projectRoot: string): ReconciliationStatus {
  const queueDir = getQueueDir(projectRoot);
  const workItemDir = getWorkItemDir(projectRoot);
  const sourceOfTruthDir = getSourceOfTruthDir(projectRoot);
  const queueFiles = fs.existsSync(queueDir) ? fs.readdirSync(queueDir).filter((entry) => entry.endsWith('.json')).sort() : [];
  const workItemFiles = fs.existsSync(workItemDir) ? fs.readdirSync(workItemDir).filter((entry) => entry.endsWith('.md')) : [];
  const sourceFiles = fs.existsSync(sourceOfTruthDir) ? fs.readdirSync(sourceOfTruthDir).filter((entry) => entry.endsWith('.md')) : [];

  return {
    pendingCount: queueFiles.length,
    workItemCount: workItemFiles.length,
    sourceOfTruthArtifactCount: sourceFiles.length,
    latestRecord: queueFiles.length > 0 ? queueFiles[queueFiles.length - 1] : null,
  };
}
