"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReconciliationCommands = registerReconciliationCommands;
const chalk_1 = __importDefault(require("chalk"));
const reconciliation_1 = require("../reconciliation");
const source_of_truth_1 = require("../source-of-truth");
function registerReconciliationCommands(program, getProjectRoot, addSharedDirectoryOption) {
    addSharedDirectoryOption(program
        .command('reconcile-change')
        .description('Queue a reverse-waterfall reconciliation record for ad-hoc code, bug, design, or repo changes')
        .requiredOption('--type <type>', 'bugfix, code-change, feature-tweak, design-tweak, repo-absorption')
        .requiredOption('--summary <summary>', 'Short summary of the change')
        .option('--story <storyId>', 'Related story id')
        .option('--epic <epicId>', 'Related epic id')
        .option('--file <path...>', 'Touched file path(s)', [])
        .option('--graph-status <status>', 'available, degraded, or unavailable', 'degraded')
        .option('--note <text>', 'Additional operator note')
        .action(async (options) => {
        const record = await (0, reconciliation_1.queueReconciliation)(getProjectRoot(options.directory), {
            type: options.type,
            summary: options.summary,
            storyId: options.story || null,
            epicId: options.epic || null,
            touchedFiles: options.file || [],
            graphStatus: options.graphStatus,
            requiredUpdates: ['story_spec', 'epic_linkage', 'featuregraph', 'knowledge_summary'],
            notes: options.note,
        });
        console.log(chalk_1.default.green(`Queued reconciliation record ${record.type} at ${record.timestamp}`));
    }));
    addSharedDirectoryOption(program
        .command('reconcile-status')
        .description('Show pending reverse-sync reconciliation status and source-of-truth artifacts')
        .action((options) => {
        const status = (0, reconciliation_1.getReconciliationStatus)(getProjectRoot(options.directory));
        console.log(chalk_1.default.blue('reconciliation status'));
        console.log(`pending queue records: ${status.pendingCount}`);
        console.log(`work items: ${status.workItemCount}`);
        console.log(`source-of-truth artifacts: ${status.sourceOfTruthArtifactCount}`);
        console.log(`latest record: ${status.latestRecord || 'none'}`);
    }));
    addSharedDirectoryOption(program
        .command('truth-status')
        .description('Show the current source-of-truth surfaces used by Orch routing')
        .action((options) => {
        const truth = (0, source_of_truth_1.loadSourceOfTruth)(getProjectRoot(options.directory));
        console.log(chalk_1.default.blue('source-of-truth status'));
        console.log(`sprint status files: ${truth.sprintStatuses.length}`);
        for (const sprint of truth.sprintStatuses) {
            console.log(`- ${sprint.path}: status=${sprint.status || 'unknown'}, sprint=${sprint.currentSprint || 'n/a'}, epics=${sprint.epicCount}, stories=${sprint.storyCount}`);
        }
        console.log(`story ids indexed: ${truth.storyIds.length}`);
        console.log(`epic ids indexed: ${truth.epicIds.length}`);
        console.log(`reconciliation scopes: ${truth.reconciliationScopes.length}`);
    }));
}
