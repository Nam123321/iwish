import * as fs from 'fs-extra';
import * as path from 'path';
import YAML from 'yaml';

export type SourceOfTruthSummary = {
  sprintStatuses: Array<{
    path: string;
    status: string | null;
    currentSprint: string | null;
    epicCount: number;
    storyCount: number;
  }>;
  storyIds: string[];
  epicIds: string[];
  reconciliationScopes: string[];
  storyRecords: Array<{
    id: string;
    path: string;
    sprintStatus: string | null;
    fileStatus: string | null;
    readiness: 'low' | 'medium' | 'high';
    headingsCount: number;
    hasAcceptanceCriteria: boolean;
    hasTaskBreakdown: boolean;
    contentLength: number;
  }>;
};

function readYamlFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return YAML.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function getSprintStatusPaths(projectRoot: string): string[] {
  return [
    path.join(projectRoot, '_iwish-output', 'stories', 'sprint-status.yaml'),
    path.join(projectRoot, '_iwish-output', 'iwish-skills', 'sprint-status.yaml'),
  ].filter((filePath) => fs.existsSync(filePath));
}

function collectIdsFromSprintYaml(doc: Record<string, unknown> | null): { epicIds: string[]; storyIds: string[] } {
  if (!doc) {
    return { epicIds: [], storyIds: [] };
  }

  const epics = Array.isArray(doc.epics) ? doc.epics as Array<Record<string, unknown>> : [];
  const epicIds: string[] = [];
  const storyIds: string[] = [];

  for (const epic of epics) {
    if (typeof epic.id === 'string') {
      epicIds.push(epic.id);
    }
    const stories = Array.isArray(epic.stories) ? epic.stories as Array<Record<string, unknown>> : [];
    for (const story of stories) {
      if (typeof story.id === 'string') {
        storyIds.push(story.id);
      }
    }
  }

  return { epicIds, storyIds };
}

function frontmatterValue(content: string, key: string): string | null {
  const match = content.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?`, 'm'));
  return match ? match[1].trim() : null;
}

function getStoryReadiness(content: string): {
  readiness: 'low' | 'medium' | 'high';
  headingsCount: number;
  hasAcceptanceCriteria: boolean;
  hasTaskBreakdown: boolean;
  contentLength: number;
} {
  const headingsCount = (content.match(/^##\s+/gm) || []).length;
  const hasAcceptanceCriteria = /acceptance criteria|##\s*\d+\.?\s*acceptance criteria|##\s*acceptance criteria/i.test(content);
  const hasTaskBreakdown = /task breakdown|traceability|ac-task/i.test(content);
  const contentLength = content.length;

  let score = 0;
  if (headingsCount >= 5) score += 1;
  if (hasAcceptanceCriteria) score += 1;
  if (hasTaskBreakdown) score += 1;
  if (contentLength >= 1200) score += 1;

  const readiness = score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low';
  return { readiness, headingsCount, hasAcceptanceCriteria, hasTaskBreakdown, contentLength };
}

function collectStoryPathsFromSprintYaml(doc: Record<string, unknown> | null): Array<{ id: string; path: string; sprintStatus: string | null }> {
  if (!doc) {
    return [];
  }

  const epics = Array.isArray(doc.epics) ? doc.epics as Array<Record<string, unknown>> : [];
  const records: Array<{ id: string; path: string; sprintStatus: string | null }> = [];

  for (const epic of epics) {
    const stories = Array.isArray(epic.stories) ? epic.stories as Array<Record<string, unknown>> : [];
    for (const story of stories) {
      if (typeof story.id === 'string') {
        records.push({
          id: story.id,
          path: typeof story.story_file === 'string' ? story.story_file : '',
          sprintStatus: typeof story.status === 'string' ? story.status : null,
        });
      }
    }
  }

  return records;
}

function collectIdsFromFilenames(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath)
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => path.basename(entry, '.md'));
}

function findStoryFileById(projectRoot: string, id: string): string | null {
  const candidateDirs = [
    path.join(projectRoot, '_iwish-output', 'stories'),
    path.join(projectRoot, '_iwish-output', 'iwish-skills', 'stories'),
  ];

  for (const dir of candidateDirs) {
    if (!fs.existsSync(dir)) {
      continue;
    }
    const exact = path.join(dir, `${id}.md`);
    if (fs.existsSync(exact)) {
      return exact;
    }
    const prefixed = fs
      .readdirSync(dir)
      .filter((entry) => entry.endsWith('.md') && entry.startsWith(`${id}-`))
      .sort()[0];
    if (prefixed) {
      return path.join(dir, prefixed);
    }
  }

  return null;
}

export function loadSourceOfTruth(projectRoot: string): SourceOfTruthSummary {
  const storiesSprintPath = path.join(projectRoot, '_iwish-output', 'stories', 'sprint-status.yaml');
  const skillsSprintPath = path.join(projectRoot, '_iwish-output', 'iwish-skills', 'sprint-status.yaml');
  const storiesSprintDoc = readYamlFile<Record<string, unknown>>(storiesSprintPath);
  const skillsSprintDoc = readYamlFile<Record<string, unknown>>(skillsSprintPath);
  const sprintStatuses = getSprintStatusPaths(projectRoot).map((filePath) => {
    const doc = readYamlFile<Record<string, unknown>>(filePath);
    const ids = collectIdsFromSprintYaml(doc);
    return {
      path: path.relative(projectRoot, filePath),
      status: typeof doc?.status === 'string' ? doc.status : null,
      currentSprint: typeof doc?.current_sprint === 'string'
        ? doc.current_sprint
        : typeof doc?.sprint_goal === 'string'
          ? doc.sprint_goal
          : null,
      epicCount: ids.epicIds.length,
      storyCount: ids.storyIds.length,
    };
  });

  const storyIds = Array.from(
    new Set([
      ...collectIdsFromSprintYaml(storiesSprintDoc).storyIds,
      ...collectIdsFromSprintYaml(skillsSprintDoc).storyIds,
      ...collectIdsFromFilenames(path.join(projectRoot, '_iwish-output', 'stories')),
      ...collectIdsFromFilenames(path.join(projectRoot, '_iwish-output', 'iwish-skills', 'stories')),
    ]),
  );

  const epicIds = Array.from(
    new Set([
      ...collectIdsFromSprintYaml(storiesSprintDoc).epicIds,
      ...collectIdsFromSprintYaml(skillsSprintDoc).epicIds,
      ...collectIdsFromFilenames(path.join(projectRoot, '_iwish-output', 'epics')),
      ...collectIdsFromFilenames(path.join(projectRoot, '_iwish-output', 'iwish-skills', 'epics')),
    ]),
  );

  const reconciliationDir = path.join(projectRoot, '_iwish-output', 'reconciliation');
  const reconciliationScopes = fs.existsSync(reconciliationDir)
    ? fs.readdirSync(reconciliationDir).filter((entry) => entry.endsWith('.md')).map((entry) => path.basename(entry, '.md'))
    : [];

  const sprintStoryRecords = [
    ...collectStoryPathsFromSprintYaml(storiesSprintDoc),
    ...collectStoryPathsFromSprintYaml(skillsSprintDoc),
  ];

  const storyRecordMap = new Map<string, SourceOfTruthSummary['storyRecords'][number]>();

  for (const record of sprintStoryRecords) {
    const absolutePath = record.path ? path.join(projectRoot, record.path) : null;
    const resolvedPath = absolutePath && fs.existsSync(absolutePath)
      ? absolutePath
      : findStoryFileById(projectRoot, record.id) || '';

    const content = resolvedPath ? fs.readFileSync(resolvedPath, 'utf8') : '';
    const fileStatus = content ? frontmatterValue(content, 'status') : null;
    const readinessInfo = content
      ? getStoryReadiness(content)
      : { readiness: 'low' as const, headingsCount: 0, hasAcceptanceCriteria: false, hasTaskBreakdown: false, contentLength: 0 };

    storyRecordMap.set(record.id, {
      id: record.id,
      path: resolvedPath ? path.relative(projectRoot, resolvedPath) : record.path,
      sprintStatus: record.sprintStatus,
      fileStatus,
      ...readinessInfo,
    });
  }

  for (const id of storyIds) {
    if (storyRecordMap.has(id)) {
      continue;
    }
    const fallbackPath = findStoryFileById(projectRoot, id);
    const content = fallbackPath ? fs.readFileSync(fallbackPath, 'utf8') : '';
    const fileStatus = content ? frontmatterValue(content, 'status') : null;
    const readinessInfo = content
      ? getStoryReadiness(content)
      : { readiness: 'low' as const, headingsCount: 0, hasAcceptanceCriteria: false, hasTaskBreakdown: false, contentLength: 0 };
    storyRecordMap.set(id, {
      id,
      path: fallbackPath ? path.relative(projectRoot, fallbackPath) : '',
      sprintStatus: null,
      fileStatus,
      ...readinessInfo,
    });
  }

  return {
    sprintStatuses,
    storyIds,
    epicIds,
    reconciliationScopes,
    storyRecords: Array.from(storyRecordMap.values()).sort((a, b) => a.id.localeCompare(b.id)),
  };
}

export function findSourceOfTruthMatches(projectRoot: string, request: string): {
  stories: string[];
  epics: string[];
  reconciliationScopes: string[];
} {
  const truth = loadSourceOfTruth(projectRoot);
  const normalized = request.toLowerCase();
  const normalizedLoose = normalized.replace(/[^a-z0-9]+/g, '');
  const matchesId = (id: string) => {
    const lower = id.toLowerCase();
    const loose = lower.replace(/[^a-z0-9]+/g, '');
    return normalized.includes(lower) || normalizedLoose.includes(loose);
  };

  return {
    stories: truth.storyIds.filter((id) => matchesId(id)).slice(0, 8),
    epics: truth.epicIds.filter((id) => matchesId(id)).slice(0, 8),
    reconciliationScopes: truth.reconciliationScopes.filter((id) => matchesId(id)).slice(0, 8),
  };
}
