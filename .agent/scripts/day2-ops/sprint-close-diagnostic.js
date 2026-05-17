const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

/**
 * Sprint Close Diagnostic Script
 * Aggregates logs from turn-exits.jsonl and bug-tracker.yaml
 * to generate a self-evolution recommendation report.
 */

const BMAD_HOME = process.cwd();
const BUG_TRACKER_PATH = path.join(BMAD_HOME, '_bmad-output', 'bug-tracker.yaml');
const TURN_EXITS_PATH = path.join(BMAD_HOME, '.agent', 'memory', 'turn-exits.jsonl');
const REPORT_DIR = path.join(BMAD_HOME, '_bmad-output', 'health-reports', new Date().toISOString().split('T')[0]);
const REPORT_PATH = path.join(REPORT_DIR, 'sprint-evolution-report.md');

async function run() {
    console.log('--- BMAD Sprint Close Diagnostic ---');

    // 1. Ensure Report Dir exists
    if (!fs.existsSync(REPORT_DIR)) {
        fs.mkdirSync(REPORT_DIR, { recursive: true });
    }

    const data = {
        bugs: [],
        exits: [],
        hotspots: {},
        exitReasons: {}
    };

    // 2. Parse Bug Tracker
    if (fs.existsSync(BUG_TRACKER_PATH)) {
        try {
            const content = fs.readFileSync(BUG_TRACKER_PATH, 'utf8');
            const bugData = yaml.parse(content);
            if (bugData && bugData.bugs) {
                data.bugs = bugData.bugs;
                bugData.bugs.forEach(bug => {
                    if (bug.filesChanged) {
                        bug.filesChanged.forEach(f => {
                            data.hotspots[f] = (data.hotspots[f] || 0) + 1;
                        });
                    }
                });
            }
        } catch (e) {
            console.error('Error parsing bug-tracker.yaml:', e.message);
        }
    }

    // 3. Parse Turn Exits
    if (fs.existsSync(TURN_EXITS_PATH)) {
        try {
            const lines = fs.readFileSync(TURN_EXITS_PATH, 'utf8').split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    const entry = JSON.parse(line);
                    data.exits.push(entry);
                    const reason = entry.exitReason || 'unknown';
                    data.exitReasons[reason] = (data.exitReasons[reason] || 0) + 1;
                }
            });
        } catch (e) {
            console.error('Error parsing turn-exits.jsonl:', e.message);
        }
    }

    // 4. Generate Report
    let report = `# Sprint Evolution Report (${new Date().toLocaleDateString()})\n\n`;
    
    report += `## 1. System Health Overview\n`;
    report += `- **Total Bugs Fixed**: ${data.bugs.length}\n`;
    report += `- **Total Workflow Executions**: ${data.exits.length}\n`;
    
    report += `\n## 2. Top File Hotspots (Auto-Immune Alert)\n`;
    const sortedHotspots = Object.entries(data.hotspots).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (sortedHotspots.length > 0) {
        report += `| File Path | Bug Count | Risk Level |\n`;
        report += `| :--- | :--- | :--- |\n`;
        sortedHotspots.forEach(([file, count]) => {
            const risk = count > 3 ? '🔴 CRITICAL' : (count > 1 ? '🟡 ELEVATED' : '🟢 NORMAL');
            report += `| \`${file}\` | ${count} | ${risk} |\n`;
        });
    } else {
        report += `No hotspots detected.\n`;
    }

    report += `\n## 3. Workflow Exit Analysis\n`;
    if (Object.keys(data.exitReasons).length > 0) {
        report += `| Exit Reason | Count | Improvement Action |\n`;
        report += `| :--- | :--- | :--- |\n`;
        Object.entries(data.exitReasons).forEach(([reason, count]) => {
            let action = 'Monitor';
            if (reason.toLowerCase().includes('failure')) action = 'Hardening Required';
            if (reason.toLowerCase().includes('timeout')) action = 'Optimize Performance';
            report += `| ${reason} | ${count} | ${action} |\n`;
        });
    } else {
        report += `No execution logs found.\n`;
    }

    report += `\n## 4. Self-Evolution Recommendations\n`;
    if (sortedHotspots.length > 0) {
        report += `> [!IMPORTANT]\n`;
        report += `> The following files are prone to regressions. Update **Pivot Guardian** to enforce manual approval before editing: \`${sortedHotspots[0][0]}\`.\n\n`;
    }
    
    const recentLessons = data.bugs.slice(-3).map(b => b.lessonLearned).filter(Boolean);
    if (recentLessons.length > 0) {
        report += `### Lessons to Materialize into Skills:\n`;
        recentLessons.forEach(lesson => {
            report += `- [ ] ${lesson}\n`;
        });
    }

    fs.writeFileSync(REPORT_PATH, report);
    console.log(`Report generated at: ${REPORT_PATH}`);
}

run();
