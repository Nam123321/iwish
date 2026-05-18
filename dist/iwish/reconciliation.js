"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueReconciliation = queueReconciliation;
exports.getReconciliationStatus = getReconciliationStatus;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const constants_1 = require("./constants");
function nowIso() {
    return new Date().toISOString();
}
function getQueueDir(projectRoot) {
    return path.join((0, constants_1.getRuntimeRoot)(projectRoot, 'iwish'), 'runtime', 'reconciliation-queue');
}
function getWorkItemDir(projectRoot) {
    return path.join((0, constants_1.getRuntimeRoot)(projectRoot, 'iwish'), 'runtime', 'reconciliation-workitems');
}
function getSourceOfTruthDir(projectRoot) {
    return path.join(projectRoot, '_iwish-output', 'reconciliation');
}
function buildWorkItemMarkdown(record) {
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
async function queueReconciliation(projectRoot, input) {
    const record = {
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
function getReconciliationStatus(projectRoot) {
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
