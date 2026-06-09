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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutingCommands = registerRoutingCommands;
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const routing_1 = require("../routing");
const routing_profile_1 = require("../routing-profile");
function registerRoutingCommands(program, getProjectRoot, addSharedDirectoryOption) {
    addSharedDirectoryOption(program
        .command('route')
        .description('Route a natural-language request or slash command through the Orch routing layer')
        .argument('<request>', 'User request, slash command, or repository URL')
        .option('--json', 'Output raw JSON route decision')
        .action(async (request, options) => {
        const projectRoot = getProjectRoot(options.directory);
        const { checkForRegistryUpdates } = await Promise.resolve().then(() => __importStar(require('../../code-intel/registry-updater')));
        await checkForRegistryUpdates(projectRoot).catch(() => { });
        const decision = await (0, routing_1.routeRequest)(projectRoot, request);
        if (options.json) {
            console.log(JSON.stringify(decision, null, 2));
            return;
        }
        console.log(chalk_1.default.blue(`canonical route: ${decision.canonicalCommand}`));
        console.log(`target agent: ${decision.targetAgent}`);
        console.log(`reason: ${decision.routeReason}`);
        console.log(`graph status: ${decision.graphStatus}`);
        console.log(`requires reconciliation: ${decision.followUp.requiresReconciliation ? 'yes' : 'no'}`);
        console.log(`recommended queue: ${decision.followUp.recommendedQueueType}`);
        console.log(`confidence: ${decision.scoring.confidencePercent}% (${decision.scoring.confidenceBand})`);
        console.log(`score breakdown: thread=${decision.scoring.threadContinuityScore}, artifact-focus=${decision.scoring.artifactFocusScore}, source-truth=${decision.scoring.sourceOfTruthMatchScore}, readiness=${decision.scoring.artifactReadinessScore}, routing-fit=${decision.scoring.routingProfileFitScore}, keywords=${decision.scoring.currentTurnKeywordScore}, ambiguity=-${decision.scoring.ambiguityPenalty}`);
        if (decision.scoring.evidence.length > 0) {
            console.log(chalk_1.default.blue('context evidence'));
            for (const line of decision.scoring.evidence) {
                console.log(`- ${line}`);
            }
        }
        if (decision.toolSetupPrompts.length > 0) {
            console.log(chalk_1.default.yellow('tool setup required'));
            for (const prompt of decision.toolSetupPrompts) {
                const optionsList = prompt.options
                    .map((option) => `${option.id}${option.usagePackStatus ? ` [${option.usagePackStatus}]` : ''}`)
                    .join(', ');
                console.log(`- ${prompt.group}: ${prompt.reason}`);
                console.log(`  recommended: ${prompt.recommended || 'none'}`);
                console.log(`  current: ${prompt.currentSelection || 'none'}`);
                console.log(`  options: ${optionsList}`);
                console.log(`  or choose another option via /create-tool-usage-pack`);
            }
        }
        if (decision.candidateCatalogEntries.length > 0) {
            console.log(chalk_1.default.blue('catalog candidates'));
            for (const entry of decision.candidateCatalogEntries) {
                console.log(`- ${entry.id} (${entry.type}) -> ${entry.canonical} [${entry.source}]`);
            }
        }
        if (decision.recommendations.workflowChain.length > 0 || decision.recommendations.supportiveSkills.length > 0 || decision.recommendations.artifactChain.length > 0) {
            console.log(chalk_1.default.blue('orch execution chain'));
            if (decision.recommendations.workflowChain.length > 0) {
                console.log(`- workflows: ${decision.recommendations.workflowChain.join(' -> ')}`);
            }
            if (decision.recommendations.supportiveSkills.length > 0) {
                console.log(`- supportive skills: ${decision.recommendations.supportiveSkills.join(', ')}`);
            }
            if (decision.recommendations.artifactChain.length > 0) {
                console.log(`- artifacts: ${decision.recommendations.artifactChain.join(' -> ')}`);
            }
        }
        if (decision.canonicalCommand === '/idea-challenge') {
            console.log(chalk_1.default.blue('next artifact scaffold'));
            console.log('run: iwish scaffold-idea-challenge --project-name "<name>"');
        }
        if (decision.canonicalCommand === '/research-solution-sources') {
            console.log(chalk_1.default.blue('next artifact scaffold'));
            console.log('run: iwish scaffold-solution-research --name "<research-name>" --problem "<problem summary>"');
        }
    }));
    addSharedDirectoryOption(program
        .command('routing-profile-status')
        .description('Inspect machine-readable routing-profile coverage used by Orch')
        .option('--format <type>', 'json or markdown', 'json')
        .action((options) => {
        const summary = (0, routing_profile_1.getRoutingProfileSummary)(getProjectRoot(options.directory));
        if (options.format === 'markdown') {
            console.log(`# Routing Profile Status`);
            console.log(`- Total profiles: ${summary.totalProfiles}`);
            console.log(`- By kind: ${Object.entries(summary.byKind).map(([key, value]) => `${key}=${value}`).join(', ') || 'none'}`);
            console.log(`- By role: ${Object.entries(summary.byRole).map(([key, value]) => `${key}=${value}`).join(', ') || 'none'}`);
            console.log(`\
## Profiles\
${summary.profiles.map((profile) => `- ${profile.id}: kind=${profile.kind}, role=${profile.role}, review_pack=${profile.review_pack || 'none'}`).join('\
') || '- none'}`);
            return;
        }
        console.log(JSON.stringify(summary, null, 2));
    }));
    addSharedDirectoryOption(program
        .command('generate-routing-profile')
        .description('Generate a machine-readable routing profile for a skill, workflow, agent, or external module')
        .requiredOption('--name <name>', 'Capability or module display name')
        .requiredOption('--kind <kind>', 'skill, workflow, agent, external-module, or repo-absorption')
        .requiredOption('--shape <shape>', 'Capability shape classification')
        .requiredOption('--role <role>', 'process-primary, supportive, or foundational')
        .requiredOption('--target <path>', 'Output YAML path')
        .option('--review-pack <path>', 'Linked review pack markdown path')
        .option('--source-path <path>', 'Canonical source path for the execution body')
        .option('--phase <value...>', 'Applicable delivery phases', [])
        .option('--stage <value...>', 'Applicable stages/tasks', [])
        .option('--trigger <value...>', 'Trigger phrases', [])
        .option('--anti-trigger <value...>', 'Anti-triggers / exclusions', [])
        .option('--agent <value...>', 'Primary agents', [])
        .option('--workflow <value...>', 'Primary workflows', [])
        .option('--support-skill <value...>', 'Supportive skills', [])
        .option('--tool <value...>', 'Tool dependencies', [])
        .option('--constraint <value...>', 'Constraints', [])
        .option('--story-ref <value...>', 'Story references', [])
        .option('--tag <value...>', 'Extra tags', [])
        .action(async (options) => {
        const projectRoot = getProjectRoot(options.directory);
        const targetPath = path.isAbsolute(options.target)
            ? options.target
            : path.join(projectRoot, options.target);
        const result = await (0, routing_profile_1.generateRoutingProfile)(projectRoot, {
            name: options.name,
            kind: options.kind,
            shape: options.shape,
            role: options.role,
            targetPath,
            reviewPack: options.reviewPack,
            sourcePath: options.sourcePath,
            phases: options.phase,
            stages: options.stage,
            triggers: options.trigger,
            antiTriggers: options.antiTrigger,
            primaryAgents: options.agent,
            primaryWorkflows: options.workflow,
            supportiveSkills: options.supportSkill,
            toolDependencies: options.tool,
            constraints: options.constraint,
            storyRefs: options.storyRef,
            tags: options.tag,
        });
        console.log(chalk_1.default.green(`Generated routing profile for ${options.name}`));
        console.log(`- ${result}`);
    }));
}
