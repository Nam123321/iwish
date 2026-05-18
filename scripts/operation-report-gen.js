const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('yaml');

const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(WORKSPACE_ROOT, '_iwish-output', 'operation-report', 'data');
const SPRINT_STATUS_FILE = path.join(WORKSPACE_ROOT, '_iwish-output', 'stories', 'sprint-status.yaml');
const BUG_TRACKER_FILE = path.join(WORKSPACE_ROOT, '_iwish-output', 'bug-tracker.yaml');
const SKILLS_DIR = path.join(WORKSPACE_ROOT, '.agent', 'skills');
const WORKFLOWS_DIR = path.join(WORKSPACE_ROOT, '.agent', 'workflows');
const KNOWLEDGE_DIR = path.join(WORKSPACE_ROOT, '_iwish-output', 'knowledge');

function parseYamlSafely(filePath) {
    if (!fs.existsSync(filePath)) return null;
    try {
        return yaml.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        console.error(`Error parsing YAML file ${filePath}:`, error.message);
        return null;
    }
}

function safeStat(pathname) {
    try {
        return fs.statSync(pathname);
    } catch {
        return null;
    }
}

function listFilesRecursive(dirPath, predicate) {
    if (!fs.existsSync(dirPath)) return [];

    const results = [];

    function walk(currentPath) {
        const stat = safeStat(currentPath);
        if (!stat) return;

        if (stat.isDirectory()) {
            for (const entry of fs.readdirSync(currentPath)) {
                walk(path.join(currentPath, entry));
            }
            return;
        }

        if (!predicate || predicate(currentPath)) {
            results.push(currentPath);
        }
    }

    walk(dirPath);
    return results;
}

function tryExec(command) {
    try {
        return execSync(command, {
            cwd: WORKSPACE_ROOT,
            stdio: ['ignore', 'pipe', 'ignore']
        }).toString().trim();
    } catch {
        return '';
    }
}

function getLocMetrics() {
    const trackedFiles = tryExec("git ls-files '*.js' '*.ts' '*.tsx' '*.md' '*.yaml' '*.yml' '*.html' '*.css'");
    if (!trackedFiles) {
        return { total: 0 };
    }

    const total = trackedFiles
        .split('\n')
        .filter(Boolean)
        .reduce((sum, relativeFile) => {
            const absoluteFile = path.join(WORKSPACE_ROOT, relativeFile);
            try {
                const content = fs.readFileSync(absoluteFile, 'utf8');
                return sum + content.split('\n').length;
            } catch {
                return sum;
            }
        }, 0);

    return { total };
}

function getGitMetrics() {
    try {
        const shortStat = execSync('git log -n 50 --shortstat --format=""', {
            cwd: WORKSPACE_ROOT
        }).toString();

        let insertions = 0;
        let deletions = 0;

        for (const line of shortStat.split('\n')) {
            const insMatch = line.match(/(\d+)\s+insertion/);
            const delMatch = line.match(/(\d+)\s+deletion/);
            if (insMatch) insertions += Number(insMatch[1]);
            if (delMatch) deletions += Number(delMatch[1]);
        }

        const commitCount = Number(tryExec('git rev-list --count HEAD') || 0);
        const lastCommit = tryExec('git log -1 --format="%cs · %s"');

        return {
            insertions,
            deletions,
            net: insertions - deletions,
            commitCount,
            lastCommit
        };
    } catch (error) {
        console.error('Failed to get git metrics:', error.message);
        return {
            insertions: 0,
            deletions: 0,
            net: 0,
            commitCount: 0,
            lastCommit: ''
        };
    }
}

function normalizeStoryStatus(status) {
    return String(status || '').trim().toLowerCase();
}

function flattenStories(sprintData) {
    if (!sprintData || !Array.isArray(sprintData.epics)) return [];

    const stories = [];
    for (const epic of sprintData.epics) {
        for (const story of epic.stories || []) {
            stories.push({
                epicId: epic.id,
                epicTitle: epic.title,
                id: story.id,
                title: story.title,
                status: normalizeStoryStatus(story.status),
                storyFile: story.story_file || ''
            });
        }
    }
    return stories;
}

function getSprintMetrics() {
    const data = parseYamlSafely(SPRINT_STATUS_FILE);
    const stories = flattenStories(data);

    if (!data || !Array.isArray(data.epics)) {
        return {
            totalEpics: 0,
            completedEpics: 0,
            totalStories: 0,
            completedStories: 0,
            progressPct: 0,
            sprintGoal: '',
            status: 'unknown',
            backlogStories: 0,
            inFlightStories: 0,
            completedEpicsList: []
        };
    }

    const totalEpics = data.epics.length;
    const completedEpics = data.epics.filter((epic) => {
        const status = normalizeStoryStatus(epic.status);
        return status === 'done' || status === 'completed';
    }).length;

    const completedStories = stories.filter((story) => ['done', 'completed'].includes(story.status)).length;
    const backlogStories = stories.filter((story) => ['todo', 'backlog', 'planning'].includes(story.status)).length;
    const inFlightStories = stories.filter((story) => ['active', 'in-progress', 'ready', 'review'].includes(story.status)).length;
    const progressPct = stories.length === 0 ? 0 : Math.round((completedStories / stories.length) * 100);

    const completedEpicsList = data.epics
        .filter((epic) => ['done', 'completed'].includes(normalizeStoryStatus(epic.status)))
        .slice(0, 5)
        .map((epic) => epic.title);

    return {
        totalEpics,
        completedEpics,
        totalStories: stories.length,
        completedStories,
        progressPct,
        sprintGoal: data.sprint_goal || '',
        status: data.status || 'unknown',
        backlogStories,
        inFlightStories,
        completedEpicsList
    };
}

function deriveModuleName(filePath) {
    const parts = String(filePath || '').split('/').filter(Boolean);
    if (parts.length >= 3 && parts[0] === 'apps') {
        return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }
    if (parts.length >= 2) {
        return `${parts[0]}/${parts[1]}`;
    }
    return parts[0] || 'unknown';
}

function mapBugToStory(filesChanged, stories) {
    const loweredPaths = filesChanged.map((file) => String(file).toLowerCase());
    const ranked = stories
        .map((story) => {
            const storyFile = String(story.storyFile || '').toLowerCase();
            const storyTitle = String(story.title || '').toLowerCase();
            let score = 0;

            for (const file of loweredPaths) {
                const segments = file.split('/').filter(Boolean);
                for (const segment of segments) {
                    if (segment.length < 4) continue;
                    if (storyFile.includes(segment)) score += 3;
                    if (storyTitle.includes(segment.replace(/[-_]/g, ' '))) score += 2;
                }
            }

            return { story, score };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score);

    return ranked.length > 0 ? ranked[0].story : null;
}

function getDefectMetrics(stories) {
    const data = parseYamlSafely(BUG_TRACKER_FILE);
    const bugs = data ? (Array.isArray(data) ? data : data.bugs || []) : [];

    const modulesMap = new Map();
    const storyMap = new Map();
    const bugDetails = [];

    for (const bug of bugs) {
        const files = Array.isArray(bug.filesChanged) ? [...bug.filesChanged] : [];

        if (Array.isArray(bug.fixAttempts)) {
            for (const attempt of bug.fixAttempts) {
                if (Array.isArray(attempt.filesChanged)) {
                    files.push(...attempt.filesChanged);
                }
            }
        }

        const uniqueFiles = [...new Set(files)];
        const moduleName = uniqueFiles[0] ? deriveModuleName(uniqueFiles[0]) : 'unknown';
        modulesMap.set(moduleName, (modulesMap.get(moduleName) || 0) + 1);

        const mappedStory = mapBugToStory(uniqueFiles, stories);
        if (mappedStory) {
            storyMap.set(mappedStory.title, {
                storyId: mappedStory.id,
                storyTitle: mappedStory.title,
                count: (storyMap.get(mappedStory.title)?.count || 0) + 1
            });
        }

        bugDetails.push({
            id: bug.id || 'unknown',
            title: bug.title || 'Untitled bug',
            module: moduleName,
            files: uniqueFiles,
            mappedStory: mappedStory
                ? { id: mappedStory.id, title: mappedStory.title }
                : null,
            lessonLearned: bug.lessonLearned || '',
            rca: bug.rca || ''
        });
    }

    return {
        totalBugs: bugs.length,
        defectDensityByModule: [...modulesMap.entries()]
            .map(([module, count]) => ({ module, count }))
            .sort((a, b) => b.count - a.count),
        defectDensityByStory: [...storyMap.values()].sort((a, b) => b.count - a.count),
        bugDetails
    };
}

function getEvolutionMetrics() {
    const skillDirs = fs.existsSync(SKILLS_DIR)
        ? fs.readdirSync(SKILLS_DIR).filter((name) => safeStat(path.join(SKILLS_DIR, name))?.isDirectory())
        : [];

    const workflowFiles = fs.existsSync(WORKFLOWS_DIR)
        ? fs.readdirSync(WORKFLOWS_DIR).filter((name) => name.endsWith('.md') || name.endsWith('.yaml'))
        : [];

    const knowledgeFiles = listFilesRecursive(KNOWLEDGE_DIR, (filePath) => filePath.endsWith('.md'));

    return {
        skills: skillDirs.length,
        workflows: workflowFiles.length,
        knowledge: knowledgeFiles.length,
        totalCapabilities: skillDirs.length + workflowFiles.length + knowledgeFiles.length,
        newestKnowledgeItems: knowledgeFiles
            .map((filePath) => ({
                file: path.relative(WORKSPACE_ROOT, filePath),
                mtimeMs: safeStat(filePath)?.mtimeMs || 0
            }))
            .sort((a, b) => b.mtimeMs - a.mtimeMs)
            .slice(0, 5)
            .map((item) => item.file)
    };
}

function buildInsights(reportData) {
    const insights = [];

    insights.push({
        title: 'Sprint Momentum',
        icon: reportData.sprint.progressPct >= 70 ? '🚀' : '🧭',
        body: `${reportData.sprint.completedStories}/${reportData.sprint.totalStories} stories are complete, with ${reportData.sprint.inFlightStories} currently in flight.`
    });

    if (reportData.defects.defectDensityByModule[0]) {
        const topModule = reportData.defects.defectDensityByModule[0];
        insights.push({
            title: 'Primary Hotspot',
            icon: '🔥',
            body: `${topModule.module} currently carries the highest defect concentration with ${topModule.count} recorded bug events.`
        });
    }

    insights.push({
        title: 'HTML-First Reporting Direction',
        icon: '🧩',
        body: 'Report contract now supports KPI cards, hotspot tables, and insight blocks so the output can evolve toward html-anything-style narrative dashboards.'
    });

    return insights;
}

function generateReport() {
    console.log('Generating Operation Report & Health Dashboard Data...');

    const sprintData = parseYamlSafely(SPRINT_STATUS_FILE);
    const stories = flattenStories(sprintData);
    const gitMetrics = getGitMetrics();
    const locMetrics = getLocMetrics();
    const sprintMetrics = getSprintMetrics();
    const defectMetrics = getDefectMetrics(stories);
    const evolutionMetrics = getEvolutionMetrics();

    const reportData = {
        generatedAt: new Date().toISOString(),
        meta: {
            source: 'I-Wish Operation Report Generator',
            formatVersion: 2,
            absorbedPatterns: [
                'html-anything/data-report',
                'html-anything/flowai-team-dashboard'
            ]
        },
        sprint: sprintMetrics,
        codebase: {
            ...gitMetrics,
            loc: locMetrics
        },
        defects: defectMetrics,
        evolution: evolutionMetrics,
        health: {
            metrics: [
                { label: 'Sprint Progress', value: sprintMetrics.progressPct, suffix: '%', tone: 'mint' },
                { label: 'Net Lines Changed', value: gitMetrics.net, suffix: '', tone: 'indigo' },
                { label: 'Open Bug Events', value: defectMetrics.totalBugs, suffix: '', tone: 'orange' },
                { label: 'Capability Surface', value: evolutionMetrics.totalCapabilities, suffix: '', tone: 'mint' }
            ]
        }
    };

    reportData.insights = buildInsights(reportData);

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const outputPath = path.join(OUTPUT_DIR, 'operation-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(reportData, null, 2));

    console.log(`Report data successfully generated at: ${outputPath}`);
}

generateReport();
