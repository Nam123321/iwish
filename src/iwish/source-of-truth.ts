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
  epicRecords: Array<{
    id: string;
    title: string;
  }>;
  reconciliationScopes: string[];
  storyRecords: Array<{
    id: string;
    epicId: string;
    title: string;
    path: string;
    sprintStatus: string | null;
    fileStatus: string | null;
    readiness: 'low' | 'medium' | 'high';
    headingsCount: number;
    hasAcceptanceCriteria: boolean;
    hasTaskBreakdown: boolean;
    contentLength: number;
    uiSpecContent?: string;
    dataSpecContent?: string;
  }>;
};

function findFileRecursively(dir: string, predicate: (name: string, fullPath: string) => boolean): string | null {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const match = findFileRecursively(fullPath, predicate);
      if (match) return match;
    } else if (predicate(file, fullPath)) {
      return fullPath;
    }
  }
  return null;
}

function readYamlFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return YAML.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function getSprintStatusPaths(projectRoot: string): string[] {
  return [
    path.join(projectRoot, '_bmad-output', 'stories', 'sprint-status.yaml'),
    path.join(projectRoot, '_bmad-output', 'bmad-skills', 'sprint-status.yaml'),
    path.join(projectRoot, '_iwish-output', 'stories', 'sprint-status.yaml'),
    path.join(projectRoot, '_iwish-output', 'bmad-skills', 'sprint-status.yaml'),
    path.join(projectRoot, '_iwish-output', '3. Development', 'sprint-status.yaml'),
  ].filter((filePath) => fs.existsSync(filePath));
}

function collectIdsFromSprintYaml(doc: Record<string, unknown> | null): { 
  epicIds: string[]; 
  storyIds: string[]; 
  epicRecords: Array<{id: string; title: string}>;
} {
  if (!doc) {
    return { epicIds: [], storyIds: [], epicRecords: [] };
  }

  const epics = Array.isArray(doc.epics) ? doc.epics as Array<Record<string, unknown>> : [];
  const epicIds: string[] = [];
  const storyIds: string[] = [];
  const epicRecords: Array<{id: string; title: string}> = [];

  for (const epic of epics) {
    if (typeof epic.id === 'string') {
      epicIds.push(epic.id);
      epicRecords.push({
        id: epic.id,
        title: typeof epic.title === 'string' ? epic.title : epic.id,
      });
    }
    const stories = Array.isArray(epic.stories) ? epic.stories as Array<Record<string, unknown>> : [];
    for (const story of stories) {
      if (typeof story.id === 'string') {
        storyIds.push(story.id);
      }
    }
  }

  return { epicIds, storyIds, epicRecords };
}

function frontmatterValue(content: string, key: string): string | null {
  const match = content.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?`, 'm'));
  if (match) {
    return match[1].trim();
  }
  if (key === 'status') {
    const statusMatch = content.match(/\*\*Status:\*\*\s*`?([A-Za-z0-9_-]+)`?/i);
    if (statusMatch) {
      return statusMatch[1].trim();
    }
  }
  return null;
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

function collectStoryPathsFromSprintYaml(doc: Record<string, unknown> | null): Array<{ id: string; epicId: string; title: string; path: string; sprintStatus: string | null }> {
  if (!doc) {
    return [];
  }

  const epics = Array.isArray(doc.epics) ? doc.epics as Array<Record<string, unknown>> : [];
  const records: Array<{ id: string; epicId: string; title: string; path: string; sprintStatus: string | null }> = [];

  for (const epic of epics) {
    const epicId = typeof epic.id === 'string' ? epic.id : 'unknown-epic';
    const stories = Array.isArray(epic.stories) ? epic.stories as Array<Record<string, unknown>> : [];
    for (const story of stories) {
      if (typeof story.id === 'string') {
        records.push({
          id: story.id,
          epicId,
          title: typeof story.title === 'string' ? story.title : story.id,
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
    path.join(projectRoot, '_bmad-output', 'stories'),
    path.join(projectRoot, '_bmad-output', 'bmad-skills', 'stories'),
    path.join(projectRoot, '_iwish-output', 'stories'),
    path.join(projectRoot, '_iwish-output', 'bmad-skills', 'stories'),
    path.join(projectRoot, '_iwish-output', '3. Development', '1. Epic & Story')
  ];

  for (const dir of candidateDirs) {
    if (!fs.existsSync(dir)) continue;

    // First try exact matches at the root of the directory
    const exact = path.join(dir, `${id}.md`);
    if (fs.existsSync(exact)) return exact;

    // Then try recursive search for this ID
    const match = findFileRecursively(dir, (name, fullPath) => {
      if (name === `${id}.md` || (name.endsWith('.md') && name.startsWith(`${id}-`))) return true;
      if (name === 'story.md') {
        const dirName = path.basename(path.dirname(fullPath));
        if (dirName.toLowerCase().replace(/-/g, '.') === id.toLowerCase().replace(/-/g, '.')) return true;
        if (dirName.toLowerCase() === id.toLowerCase()) return true;
      }
      return false;
    });
    if (match) return match;
  }

  return null;
}

export function loadSourceOfTruth(projectRoot: string): SourceOfTruthSummary {
  const devSprintPath = path.join(projectRoot, '_iwish-output', '3. Development', 'sprint-status.yaml');
  const storiesSprintPath = path.join(projectRoot, '_bmad-output', 'stories', 'sprint-status.yaml');
  const skillsSprintPath = path.join(projectRoot, '_bmad-output', 'bmad-skills', 'sprint-status.yaml');
  const iwishStoriesSprintPath = path.join(projectRoot, '_iwish-output', 'stories', 'sprint-status.yaml');
  const iwishSkillsSprintPath = path.join(projectRoot, '_iwish-output', 'bmad-skills', 'sprint-status.yaml');

  const storiesSprintDoc =
    readYamlFile<Record<string, unknown>>(devSprintPath) ||
    readYamlFile<Record<string, unknown>>(storiesSprintPath) ||
    readYamlFile<Record<string, unknown>>(iwishStoriesSprintPath);
  const skillsSprintDoc = readYamlFile<Record<string, unknown>>(skillsSprintPath) || readYamlFile<Record<string, unknown>>(iwishSkillsSprintPath);
  const storiesSprintIds = collectIdsFromSprintYaml(storiesSprintDoc);
  const skillsSprintIds = collectIdsFromSprintYaml(skillsSprintDoc);
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

  const devStoryDir = path.join(projectRoot, '_iwish-output', '3. Development', '1. Epic & Story');
  const devStoryIds: string[] = [];
  if (fs.existsSync(devStoryDir)) {
    const collectStoryFiles = (dir: string) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          collectStoryFiles(fullPath);
        } else if (file === 'story.md') {
          const dirName = path.basename(dir);
          const parts = dirName.match(/^Story-(\d+)-(\d+)$/i);
          if (parts) {
            devStoryIds.push(`story-${parts[1]}.${parts[2]}`);
          } else {
            devStoryIds.push(dirName.toLowerCase());
          }
        } else if (file.endsWith('.md') && !file.includes('spec') && !file.startsWith('review')) {
          devStoryIds.push(path.basename(file, '.md'));
        }
      }
    };
    try {
      collectStoryFiles(devStoryDir);
    } catch(e) {}
  }

  const storyIds = Array.from(
    new Set([
      ...storiesSprintIds.storyIds,
      ...skillsSprintIds.storyIds,
      ...collectIdsFromFilenames(path.join(projectRoot, '_bmad-output', 'stories')),
      ...collectIdsFromFilenames(path.join(projectRoot, '_bmad-output', 'bmad-skills', 'stories')),
      ...collectIdsFromFilenames(path.join(projectRoot, '_iwish-output', 'stories')),
      ...collectIdsFromFilenames(path.join(projectRoot, '_iwish-output', 'bmad-skills', 'stories')),
      ...devStoryIds,
    ]),
  );

  const epicIds = Array.from(
    new Set([
      ...storiesSprintIds.epicIds,
      ...skillsSprintIds.epicIds,
      ...collectIdsFromFilenames(path.join(projectRoot, '_bmad-output', 'epics')),
      ...collectIdsFromFilenames(path.join(projectRoot, '_bmad-output', 'bmad-skills', 'epics')),
      ...collectIdsFromFilenames(path.join(projectRoot, '_iwish-output', 'epics')),
      ...collectIdsFromFilenames(path.join(projectRoot, '_iwish-output', 'bmad-skills', 'epics')),
      ...collectIdsFromFilenames(path.join(projectRoot, '_iwish-output', '2. Product Planning')),
    ]),
  );

  const epicRecords = [...storiesSprintIds.epicRecords, ...skillsSprintIds.epicRecords];

  const reconciliationDir = path.join(projectRoot, '_bmad-output', 'reconciliation');
  const iwishReconciliationDir = path.join(projectRoot, '_iwish-output', 'reconciliation');
  const reconciliationDirToUse = fs.existsSync(iwishReconciliationDir) ? iwishReconciliationDir : reconciliationDir;
  const reconciliationScopes = fs.existsSync(reconciliationDirToUse)
    ? fs.readdirSync(reconciliationDirToUse).filter((entry) => entry.endsWith('.md')).map((entry) => path.basename(entry, '.md'))
    : [];

  const sprintStoryRecords = [
    ...collectStoryPathsFromSprintYaml(storiesSprintDoc),
    ...collectStoryPathsFromSprintYaml(skillsSprintDoc),
  ];

  const storyRecordMap = new Map<string, SourceOfTruthSummary['storyRecords'][number]>();

  const processStory = (id: string, epicId: string, title: string, providedPath: string, sprintStatus: string | null) => {
    const absolutePath = providedPath ? path.join(projectRoot, providedPath) : null;
    const resolvedPath = absolutePath && fs.existsSync(absolutePath)
      ? absolutePath
      : findStoryFileById(projectRoot, id) || '';

    const content = resolvedPath ? fs.readFileSync(resolvedPath, 'utf8') : '';
    const fileStatus = content ? frontmatterValue(content, 'status') : null;
    const readinessInfo = content
      ? getStoryReadiness(content)
      : { readiness: 'low' as const, headingsCount: 0, hasAcceptanceCriteria: false, hasTaskBreakdown: false, contentLength: 0 };
    
    // Attempt to extract UI Spec and Data Spec contents if they exist alongside the story
    let uiSpecContent = '';
    let dataSpecContent = '';
    if (resolvedPath) {
      const storyDir = path.dirname(resolvedPath);
      const uiSpecMatch = findFileRecursively(storyDir, (name) => name === 'ui-spec.md' || name === 'uiux-spec.md' || name === 'ui-ux-spec.md');
      if (uiSpecMatch) uiSpecContent = fs.readFileSync(uiSpecMatch, 'utf8');

      const dataSpecMatch = findFileRecursively(storyDir, (name) => name === 'data-spec.md' || name === 'database-spec.md');
      if (dataSpecMatch) dataSpecContent = fs.readFileSync(dataSpecMatch, 'utf8');
    }

    storyRecordMap.set(id, {
      id,
      epicId,
      title,
      path: resolvedPath ? path.relative(projectRoot, resolvedPath) : providedPath,
      sprintStatus,
      fileStatus,
      uiSpecContent,
      dataSpecContent,
      ...readinessInfo,
    });
  };

  for (const record of sprintStoryRecords) {
    processStory(record.id, record.epicId, record.title, record.path, record.sprintStatus);
  }

  for (const id of storyIds) {
    if (!storyRecordMap.has(id)) {
      processStory(id, 'unknown-epic', id, '', null);
    }
  }

  return {
    sprintStatuses,
    storyIds,
    epicIds,
    epicRecords,
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
