import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import {
  advanceSolutionResearchStage,
  ensureCapabilityPackageTemplates,
  generateIdeaChallengeArtifacts,
  generateCapabilityReviewPack,
  getToolSetupStatus,
  installRuntime,
  normalizeInstallTargets,
  printDoctor,
  printInstallTargets,
  printModules,
  printStatus,
  printTools,
  readSolutionResearchState,
  readToolProfile,
  registerModule,
  scaffoldSolutionResearchArtifacts,
  selectToolProfile,
  ingestPlatformSkills,
  detectPlatformCapabilities,
  compileUserGuideDashboard,
} from './runtime';
import { SUPPORTED_INSTALL_TARGETS, getPlatformMode, PlatformMode } from './constants';
import { routeRequest } from './routing';
import { extractGraphData, extractSprintData, extractAgentTrace } from './graph-parser';
import { getReconciliationStatus, queueReconciliation } from './reconciliation';
import { loadSourceOfTruth } from './source-of-truth';
import { buildPlatformInventory } from './inventory';
import { buildSkillGraphReport } from './skill-graph';
import { generateRoutingProfile, getRoutingProfileSummary } from './routing-profile';

function getInvocationName(): string {
  return process.argv[1]?.split('/').pop() || 'iwish';
}

function getProjectRoot(directory?: string): string {
  return directory ? path.resolve(directory) : process.cwd();
}

function addSharedDirectoryOption(command: Command): Command {
  return command.option('-d, --directory <path>', 'Project directory to operate on', process.cwd());
}

async function resolveInstallTargets(rawTargets?: string[]): Promise<string[]> {
  if (rawTargets && rawTargets.length > 0) {
    return normalizeInstallTargets(rawTargets);
  }

  const rl = createInterface({ input, output });
  try {
    console.log(chalk.blue('Choose one or more install targets for this project.'));
    SUPPORTED_INSTALL_TARGETS.forEach((target, index) => {
      console.log(`${index + 1}. ${target}`);
    });
    console.log('Enter one or more target names or numbers separated by commas.');
    const answer = await rl.question('Platform(s) to install for: ');
    const normalizedAnswer = answer.trim();
    if (!normalizedAnswer) {
      return normalizeInstallTargets([]);
    }

    const commaSeparated = normalizedAnswer.split(',').map((entry) => entry.trim()).filter(Boolean);
    const resolved = commaSeparated.map((entry) => {
      const numeric = Number(entry);
      if (Number.isInteger(numeric) && numeric >= 1 && numeric <= SUPPORTED_INSTALL_TARGETS.length) {
        return SUPPORTED_INSTALL_TARGETS[numeric - 1];
      }
      return entry;
    });

    if (resolved.length === 1 && SUPPORTED_INSTALL_TARGETS.includes(resolved[0])) {
      return normalizeInstallTargets(resolved);
    }

    return normalizeInstallTargets(resolved);
  } finally {
    rl.close();
  }
}

async function promptGraphToolSelection(projectRoot: string): Promise<void> {
  const prompts = getToolSetupStatus(projectRoot);
  const graphPrompt = prompts.find((prompt) => prompt.group === 'graph');
  if (!graphPrompt) {
    return;
  }

  const rl = createInterface({ input, output });
  const platform = getPlatformMode();
  const recommendedOverride = platform === 'AG_MAO' ? 'antigravity-memory' : graphPrompt.recommended;

  try {
    console.log('');
    console.log(chalk.blue('=============================================='));
    console.log(chalk.yellow('📊 MANDATORY GRAPH SETUP'));
    console.log(chalk.blue('A graph solution is required for I-Wish execution.'));
    if (platform === 'AG_MAO') {
      console.log(chalk.green('Google Antigravity 2.0 runtime detected! Recommended: antigravity-memory'));
    }
    console.log(chalk.blue('=============================================='));

    while (true) {
      graphPrompt.options.forEach((option: { id: string; description: string }, index: number) => {
        const recommended = option.id === recommendedOverride ? ' (recommended)' : '';
        console.log(`${index + 1}. ${option.id}${recommended}`);
        if (option.description) {
          console.log(`   ${option.description}`);
        }
      });
      console.log(`${graphPrompt.options.length + 1}. other / custom (custom-adapter)`);
      console.log('----------------------------------------------');

      const answer = (await rl.question('Select a graph solution (enter number or name): ')).trim();
      if (!answer) {
        console.log(chalk.red('Graph setup is mandatory. Please make a selection to continue.'));
        continue;
      }

      const numeric = Number(answer);
      let selected = '';
      if (Number.isInteger(numeric) && numeric >= 1 && numeric <= graphPrompt.options.length) {
        selected = graphPrompt.options[numeric - 1].id;
      } else if (Number.isInteger(numeric) && numeric === graphPrompt.options.length + 1) {
        selected = 'custom-adapter';
      } else {
        // Check if matching by id directly
        const matched = graphPrompt.options.find((opt) => opt.id.toLowerCase() === answer.toLowerCase());
        if (matched) {
          selected = matched.id;
        } else if (answer.toLowerCase() === 'custom-adapter') {
          selected = 'custom-adapter';
        }
      }

      if (selected) {
        await selectToolProfile(projectRoot, 'graph', selected);
        console.log(chalk.green(`Selected ${selected} for tool group graph`));
        if (selected === 'custom-adapter') {
          console.log('Next: define the custom graph adapter contract and usage pack before using graph-backed workflows.');
        }
        break;
      } else {
        console.log(chalk.red('Invalid selection. Please try again.'));
      }
    }
  } finally {
    rl.close();
  }
}

async function promptPlatformIngestion(projectRoot: string, targets: string[]): Promise<string[]> {
  const capabilities = await detectPlatformCapabilities(projectRoot, targets);
  if (capabilities.length === 0) {
    return [];
  }

  const rl = createInterface({ input, output });
  try {
    console.log('');
    console.log(chalk.blue('=============================================='));
    console.log(chalk.yellow('🔌 PLATFORM SKILL & MCP INGESTION'));
    console.log('Detected the following platform-native capabilities:');
    capabilities.forEach((cap, index) => {
      console.log(`${index + 1}. [${cap.type.toUpperCase()}] ${cap.name} (ID: ${cap.id})`);
    });
    console.log('----------------------------------------------');
    console.log('Choices:');
    console.log('1. Ingest all detected platform capabilities (recommended)');
    console.log('2. Skip all (Keep I-Wish completely pure)');
    console.log('3. Select specific capabilities to ingest');
    console.log(chalk.blue('=============================================='));

    const choice = (await rl.question('Select an option (1/2/3, default: 1): ')).trim();
    if (choice === '' || choice === '1') {
      return capabilities.map(cap => cap.id);
    }
    if (choice === '2') {
      return [];
    }
    if (choice === '3') {
      console.log('');
      console.log('Enter numbers of the capabilities to ingest, separated by commas (e.g. 1,3,4):');
      const selection = (await rl.question('Selection: ')).trim();
      if (!selection) {
        return [];
      }
      const indices = selection.split(',').map(entry => Number(entry.trim()) - 1).filter(idx => idx >= 0 && idx < capabilities.length);
      return indices.map(idx => capabilities[idx].id);
    }

    return capabilities.map(cap => cap.id);
  } finally {
    rl.close();
  }
}

export async function runCli(): Promise<void> {
  const invocation = getInvocationName();
  const program = new Command();

  program
    .name(invocation === 'bmad-db' ? 'bmad-db' : 'iwish')
    .description('I-Wish open platform CLI with shim-first compatibility for legacy BMAD runtimes')
    .version('1.0.0');

  addSharedDirectoryOption(
    program
      .command('install')
      .description('Scaffold the canonical I-Wish runtime substrate in a project')
      .option('-p, --platform <target...>', 'Install target(s). If omitted, the CLI will ask you to choose.')
      .option('--skip-tool-setup', 'Skip interactive baseline tool setup prompts after install')
      .option('--skip-platform-ingest', 'Skip interactive platform skill ingestion and run in pure I-Wish mode')
      .action(async (options: { directory: string; platform: string[]; skipToolSetup?: boolean; skipPlatformIngest?: boolean }) => {
        const projectRoot = getProjectRoot(options.directory);
        const targets = await resolveInstallTargets(options.platform);
        await installRuntime(projectRoot, targets, 'install');
        await ensureCapabilityPackageTemplates(projectRoot);
        if (!options.skipToolSetup) {
          await promptGraphToolSelection(projectRoot);
        } else {
          console.log(chalk.yellow('Skipped baseline tool setup.'));
          console.log('Run later: iwish tool-setup-status');
        }

        let selectedIds: string[] = [];
        if (options.skipPlatformIngest) {
          console.log(chalk.yellow('Skipped platform skill ingestion flag detected.'));
        } else {
          selectedIds = await promptPlatformIngestion(projectRoot, targets);
        }
        await ingestPlatformSkills(projectRoot, targets, selectedIds);
      }),
  );

  addSharedDirectoryOption(
    program
      .command('update')
      .description('Refresh the I-Wish runtime manifest without overwriting customizations')
      .option('-p, --platform <target...>', 'Install target(s). If omitted, the CLI will ask you to choose.')
      .option('--skip-tool-setup', 'Skip interactive baseline tool setup prompts after update')
      .option('--skip-platform-ingest', 'Skip interactive platform skill ingestion and run in pure I-Wish mode')
      .action(async (options: { directory: string; platform: string[]; skipToolSetup?: boolean; skipPlatformIngest?: boolean }) => {
        const projectRoot = getProjectRoot(options.directory);
        const targets = await resolveInstallTargets(options.platform);
        await installRuntime(projectRoot, targets, 'update');
        await ensureCapabilityPackageTemplates(projectRoot);
        if (!options.skipToolSetup) {
          await promptGraphToolSelection(projectRoot);
        } else {
          console.log(chalk.yellow('Skipped baseline tool setup.'));
          console.log('Run later: iwish tool-setup-status');
        }

        let selectedIds: string[] = [];
        if (options.skipPlatformIngest) {
          console.log(chalk.yellow('Skipped platform skill ingestion flag detected.'));
        } else {
          selectedIds = await promptPlatformIngestion(projectRoot, targets);
        }
        await ingestPlatformSkills(projectRoot, targets, selectedIds);
      }),
  );

  addSharedDirectoryOption(
    program
      .command('status')
      .description('Show the current I-Wish runtime and compatibility state')
      .action((options: { directory: string }) => {
        printStatus(getProjectRoot(options.directory));
      }),
  );

  addSharedDirectoryOption(
    program
      .command('doctor')
      .description('Run a lightweight diagnostic pass for I-Wish runtime health')
      .action((options: { directory: string }) => {
        printDoctor(getProjectRoot(options.directory));
      }),
  );

  program.command('list-modules').description('List built-in I-Wish module descriptors').action(() => {
    printModules();
  });

  program.command('list-tools').description('List built-in I-Wish tool adapter groups').action(() => {
    printTools();
  });

  program.command('list-install-targets').description('List supported and planned install targets').action(() => {
    printInstallTargets();
  });

  addSharedDirectoryOption(
    program
      .command('register-module')
      .description('Register an external module or absorbed repository into the project catalog')
      .argument('<source>', 'Git URL, local path, or registry identifier')
      .option('-n, --name <name>', 'Display name for the registered module')
      .option('--class <type>', 'Module class', 'arbitrary-external')
      .option('--mode <mode>', 'Registration mode', 'register')
      .option('--trigger <value...>', 'Routing trigger hints', [])
      .option('--tool <value...>', 'Required tool adapters', [])
      .action(
        async (
          source: string,
          options: {
            directory: string;
            name?: string;
            class: string;
            mode: string;
            trigger: string[];
            tool: string[];
          },
        ) => {
          await registerModule(getProjectRoot(options.directory), source, options.name, {
            moduleClass: options.class,
            registrationMode: options.mode,
            triggers: options.trigger,
            toolDependencies: options.tool,
          });
        },
      ),
  );

  addSharedDirectoryOption(
    program
      .command('generate-review-pack')
      .description('Generate the standard I-Wish adoption review pack (.md + .html) for a repo, skill, workflow, agent, or external module')
      .requiredOption('--name <name>', 'Capability or module display name')
      .requiredOption('--source <source>', 'Source URL, local path, or logical origin label')
      .option('--kind <kind>', 'external-module, repo-absorption, skill, workflow, or agent', 'skill')
      .option('--shape <shape>', 'Capability shape classification', 'skill')
      .option('--role <role>', 'process-primary, supportive, or foundational', 'supportive')
      .option('--state <state>', 'draft, registered, promoted, or absorbed', 'draft')
      .option('--target-dir <path>', 'Optional explicit output directory')
      .option('--module-class <type>', 'Optional module class label')
      .option('--trigger <value...>', 'Routing trigger hints', [])
      .option('--tool <value...>', 'Required tool adapters', [])
      .option('--agent <value...>', 'Canonical agents that should coordinate this capability', [])
      .option('--workflow <value...>', 'Primary workflows that should call this capability', [])
      .option('--support-skill <value...>', 'Supportive skills that pair with this capability', [])
      .action(
        async (
          options: {
            directory: string;
            name: string;
            source: string;
            kind: 'external-module' | 'repo-absorption' | 'skill' | 'workflow' | 'agent';
            shape: string;
            role: 'process-primary' | 'supportive' | 'foundational';
            state: string;
            targetDir?: string;
            moduleClass?: string;
            trigger: string[];
            tool: string[];
            agent: string[];
            workflow: string[];
            supportSkill: string[];
          },
        ) => {
          const result = await generateCapabilityReviewPack(getProjectRoot(options.directory), {
            name: options.name,
            source: options.source,
            kind: options.kind,
            shape: options.shape,
            role: options.role,
            registrationState: options.state,
            targetDir: options.targetDir,
            moduleClass: options.moduleClass,
            triggers: options.trigger,
            toolDependencies: options.tool,
            primaryAgents: options.agent,
            primaryWorkflows: options.workflow,
            supportiveSkills: options.supportSkill,
          });

          console.log(chalk.green(`Generated review pack for ${options.name}`));
          console.log(`- ${result.markdownPath}`);
          console.log(`- ${result.htmlPath}`);
        },
      ),
  );

  addSharedDirectoryOption(
    program
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
      .action(
        async (
          options: {
            directory: string;
            name: string;
            kind: 'skill' | 'workflow' | 'agent' | 'external-module' | 'repo-absorption';
            shape: string;
            role: 'process-primary' | 'supportive' | 'foundational';
            target: string;
            reviewPack?: string;
            sourcePath?: string;
            phase: string[];
            stage: string[];
            trigger: string[];
            antiTrigger: string[];
            agent: string[];
            workflow: string[];
            supportSkill: string[];
            tool: string[];
            constraint: string[];
            storyRef: string[];
            tag: string[];
          },
        ) => {
          const projectRoot = getProjectRoot(options.directory);
          const targetPath = path.isAbsolute(options.target)
            ? options.target
            : path.join(projectRoot, options.target);
          const result = await generateRoutingProfile(projectRoot, {
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
          console.log(chalk.green(`Generated routing profile for ${options.name}`));
          console.log(`- ${result}`);
        },
      ),
  );

  addSharedDirectoryOption(
    program
      .command('routing-profile-status')
      .description('Inspect machine-readable routing-profile coverage used by Orch')
      .option('--format <type>', 'json or markdown', 'json')
      .action((options: { directory: string; format: 'json' | 'markdown' }) => {
        const summary = getRoutingProfileSummary(getProjectRoot(options.directory));
        if (options.format === 'markdown') {
          console.log(`# Routing Profile Status`);
          console.log(`- Total profiles: ${summary.totalProfiles}`);
          console.log(`- By kind: ${Object.entries(summary.byKind).map(([key, value]) => `${key}=${value}`).join(', ') || 'none'}`);
          console.log(`- By role: ${Object.entries(summary.byRole).map(([key, value]) => `${key}=${value}`).join(', ') || 'none'}`);
          console.log(`\n## Profiles\n${summary.profiles.map((profile) => `- ${profile.id}: kind=${profile.kind}, role=${profile.role}, review_pack=${profile.review_pack || 'none'}`).join('\n') || '- none'}`);
          return;
        }
        console.log(JSON.stringify(summary, null, 2));
      }),
  );

  addSharedDirectoryOption(
    program
      .command('route')
      .description('Route a natural-language request or slash command through the Orch routing layer')
      .argument('<request>', 'User request, slash command, or repository URL')
      .option('--json', 'Output raw JSON route decision')
      .action(async (request: string, options: { directory: string; json?: boolean }) => {
        const decision = await routeRequest(getProjectRoot(options.directory), request);
        if (options.json) {
          console.log(JSON.stringify(decision, null, 2));
          return;
        }
        console.log(chalk.blue(`canonical route: ${decision.canonicalCommand}`));
        console.log(`target agent: ${decision.targetAgent}`);
        console.log(`reason: ${decision.routeReason}`);
        console.log(`graph status: ${decision.graphStatus}`);
        console.log(`requires reconciliation: ${decision.followUp.requiresReconciliation ? 'yes' : 'no'}`);
        console.log(`recommended queue: ${decision.followUp.recommendedQueueType}`);
        console.log(`confidence: ${decision.scoring.confidencePercent}% (${decision.scoring.confidenceBand})`);
        console.log(`score breakdown: thread=${decision.scoring.threadContinuityScore}, artifact-focus=${decision.scoring.artifactFocusScore}, source-truth=${decision.scoring.sourceOfTruthMatchScore}, readiness=${decision.scoring.artifactReadinessScore}, routing-fit=${decision.scoring.routingProfileFitScore}, keywords=${decision.scoring.currentTurnKeywordScore}, ambiguity=-${decision.scoring.ambiguityPenalty}`);
        if (decision.scoring.evidence.length > 0) {
          console.log(chalk.blue('context evidence'));
          for (const line of decision.scoring.evidence) {
            console.log(`- ${line}`);
          }
        }
        if (decision.toolSetupPrompts.length > 0) {
          console.log(chalk.yellow('tool setup required'));
          for (const prompt of decision.toolSetupPrompts) {
            const optionsList = prompt.options
              .map((option: { id: string; usagePackStatus: string | null }) => `${option.id}${option.usagePackStatus ? ` [${option.usagePackStatus}]` : ''}`)
              .join(', ');
            console.log(`- ${prompt.group}: ${prompt.reason}`);
            console.log(`  recommended: ${prompt.recommended || 'none'}`);
            console.log(`  current: ${prompt.currentSelection || 'none'}`);
            console.log(`  options: ${optionsList}`);
            console.log(`  or choose another option via /create-tool-usage-pack`);
          }
        }
        if (decision.candidateCatalogEntries.length > 0) {
          console.log(chalk.blue('catalog candidates'));
          for (const entry of decision.candidateCatalogEntries) {
            console.log(`- ${entry.id} (${entry.type}) -> ${entry.canonical} [${entry.source}]`);
          }
        }
        if (decision.recommendations.workflowChain.length > 0 || decision.recommendations.supportiveSkills.length > 0 || decision.recommendations.artifactChain.length > 0) {
          console.log(chalk.blue('orch execution chain'));
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
          console.log(chalk.blue('next artifact scaffold'));
          console.log('run: iwish scaffold-idea-challenge --project-name "<name>"');
        }
        if (decision.canonicalCommand === '/research-solution-sources') {
          console.log(chalk.blue('next artifact scaffold'));
          console.log('run: iwish scaffold-solution-research --name "<research-name>" --problem "<problem summary>"');
        }
      }),
  );

  addSharedDirectoryOption(
    program
      .command('show-graph')
      .description('Expose the extracted Knowledge Graph structure in standard JSON')
      .action((options: { directory: string }) => {
        const result = extractGraphData(getProjectRoot(options.directory));
        console.log(JSON.stringify(result, null, 2));
      }),
  );

  addSharedDirectoryOption(
    program
      .command('gen-dashboard')
      .description('Compile and export the interactive User Guide & Knowledge Graph dashboard')
      .action(async (options: { directory: string }) => {
        const projectRoot = getProjectRoot(options.directory);
        try {
          const outputPath = await compileUserGuideDashboard(projectRoot);
          console.log(chalk.green(`Interactive User Guide & Dashboard successfully compiled!`));
          console.log(`Open in browser: file://${outputPath}`);
        } catch (error: any) {
          console.error(chalk.red(`Failed to generate User Guide & Dashboard: ${error.message}`));
        }
      }),
  );

  addSharedDirectoryOption(
    program
      .command('scaffold-solution-research')
      .description('Create or resume the runtime artifacts for the research-solution-sources workflow')
      .requiredOption('--name <name>', 'Research run name')
      .requiredOption('--problem <summary>', 'Problem summary for the research brief')
      .option('--shape <shape>', 'Preferred solution shape')
      .option('--external-required', 'Mark external/GitHub search as mandatory')
      .option('--internal-only', 'Mark this as an internal-only overlap check')
      .action(
        async (
          options: {
            directory: string;
            name: string;
            problem: string;
            shape?: string;
            externalRequired?: boolean;
            internalOnly?: boolean;
          },
        ) => {
          const result = await scaffoldSolutionResearchArtifacts(getProjectRoot(options.directory), {
            researchName: options.name,
            problemSummary: options.problem,
            preferredShape: options.shape,
            externalSearchRequired: Boolean(options.externalRequired),
            internalOnlyRequest: Boolean(options.internalOnly),
          });

          console.log(chalk.green(`Prepared solution-research artifacts for ${result.researchName}`));
          console.log(`- root: ${result.artifactRoot}`);
          console.log(`- brief: ${result.briefPath}`);
          console.log(`- state: ${result.statePath}`);
          console.log(`- output template: ${result.outputTemplatePath}`);
          console.log(`- scorecard: ${result.scorecardPath}`);
          console.log(`- trust template: ${result.trustTemplatePath}`);
          console.log(`- resume stage: ${result.resumedFromStage || 'new run'}`);
        },
      ),
  );

  addSharedDirectoryOption(
    program
      .command('solution-research-status')
      .description('Show the current state manifest for a research-solution-sources run')
      .requiredOption('--name <name>', 'Research run name')
      .action((options: { directory: string; name: string }) => {
        const result = readSolutionResearchState(getProjectRoot(options.directory), options.name);
        if (!result.state) {
          console.log(chalk.yellow(`No solution-research state found for ${options.name}.`));
          return;
        }
        console.log(chalk.blue(`solution research root: ${result.artifactRoot}`));
        console.log(`state: ${result.statePath}`);
        console.log(`current stage: ${result.state.current_stage}`);
        console.log(`completed stages: ${result.state.completed_stages.join(', ') || 'none'}`);
        console.log(`pending stages: ${result.state.pending_stages.join(', ') || 'none'}`);
        console.log(`requires user review: ${result.state.requires_user_review ? 'yes' : 'no'}`);
        console.log(`review checkpoint: ${result.state.review_checkpoint || 'none'}`);
        console.log(`blocked reason: ${result.state.blocked_reason || 'none'}`);
        console.log(`external search required: ${result.state.external_search_required ? 'yes' : 'no'}`);
        console.log(`internal only request: ${result.state.internal_only_request ? 'yes' : 'no'}`);
        console.log(`preferred shape: ${result.state.preferred_shape || 'none'}`);
        console.log(`final verdict: ${result.state.final_verdict || 'none'}`);
        console.log(`next action: ${result.state.next_action || 'none'}`);
        console.log(`artifacts: ${Object.keys(result.state.produced_artifacts).length}`);
        for (const [name, artifactPath] of Object.entries(result.state.produced_artifacts)) {
          console.log(`- ${name}: ${artifactPath}`);
        }
      }),
  );

  addSharedDirectoryOption(
    program
      .command('advance-solution-research')
      .description('Advance a research-solution-sources run to the next stage with gate validation')
      .requiredOption('--name <name>', 'Research run name')
      .requiredOption('--next-stage <stage>', 'Next stage: enrich, trust-check, deep-dive, recommend')
      .option('--artifact <path...>', 'Artifact path(s) produced by the current stage', [])
      .option('--review-required', 'Mark that user review is required before continuing')
      .option('--review-checkpoint <stage>', 'Checkpoint stage that requires review')
      .option('--blocked-reason <text>', 'Explain why progress is blocked or provisional')
      .option('--final-verdict <text>', 'Final verdict when advancing into or through recommend')
      .option('--next-action <text>', 'Explicit next canonical action')
      .option('--notes <text>', 'State notes')
      .action(
        async (
          options: {
            directory: string;
            name: string;
            nextStage: 'discover' | 'enrich' | 'trust-check' | 'deep-dive' | 'recommend';
            artifact: string[];
            reviewRequired?: boolean;
            reviewCheckpoint?: 'discover' | 'enrich' | 'trust-check' | 'deep-dive' | 'recommend';
            blockedReason?: string;
            finalVerdict?: string;
            nextAction?: string;
            notes?: string;
          },
        ) => {
          const result = await advanceSolutionResearchStage(getProjectRoot(options.directory), {
            researchName: options.name,
            nextStage: options.nextStage,
            artifactPath: options.artifact,
            requiresUserReview: Boolean(options.reviewRequired),
            reviewCheckpoint: options.reviewCheckpoint || null,
            blockedReason: options.blockedReason || null,
            finalVerdict: options.finalVerdict || null,
            nextAction: options.nextAction || null,
            notes: options.notes,
          });
          console.log(chalk.green(`Advanced solution-research '${options.name}' to ${result.state.current_stage}`));
          console.log(`state: ${result.statePath}`);
        },
      ),
  );

  addSharedDirectoryOption(
    program
      .command('scaffold-idea-challenge')
      .description('Create or resume the working artifacts for the full idea-challenge workflow')
      .requiredOption('--project-name <name>', 'Project or concept name')
      .option('--concept-type <type>', 'commercial-product, internal-tool, open-source-project, community-nonprofit', 'commercial-product')
      .option('--mode <mode>', 'interactive, draft-first, research-grounded', 'interactive')
      .option('--with-biz-stack', 'Also scaffold biz-stack.md')
      .action(
        async (
          options: {
            directory: string;
            projectName: string;
            conceptType: 'commercial-product' | 'internal-tool' | 'open-source-project' | 'community-nonprofit';
            mode: 'interactive' | 'draft-first' | 'research-grounded';
            withBizStack?: boolean;
          },
        ) => {
          const result = await generateIdeaChallengeArtifacts(getProjectRoot(options.directory), {
            projectName: options.projectName,
            conceptType: options.conceptType,
            mode: options.mode,
            includeBizStack: Boolean(options.withBizStack),
          });

          console.log(chalk.green(`Prepared idea-challenge artifacts for ${result.projectName}`));
          console.log(`- main: ${result.mainArtifactPath}`);
          console.log(`- distillate: ${result.distillatePath}`);
          if (result.bizStackPath) {
            console.log(`- biz stack: ${result.bizStackPath}`);
          }
          console.log(`- metadata: ${result.metadataPath}`);
          console.log(`- resume stage: ${result.resumedFromStage || 'new run'}`);
        },
      ),
  );

  addSharedDirectoryOption(
    program
      .command('tool-setup-status')
      .description('Show pending tool setup questions and default options for the current project')
      .action((options: { directory: string }) => {
        const prompts = getToolSetupStatus(getProjectRoot(options.directory));
        if (prompts.length === 0) {
          console.log(chalk.green('All currently required baseline tool groups are configured.'));
          return;
        }
        console.log(chalk.blue('tool setup prompts'));
        for (const prompt of prompts) {
          console.log(`- ${prompt.group}: ${prompt.reason}`);
          console.log(`  recommended: ${prompt.recommended || 'none'}`);
          console.log(`  current: ${prompt.currentSelection || 'none'}`);
          console.log(
            `  options: ${prompt.options
              .map((option: { id: string; usagePackStatus: string | null }) => `${option.id}${option.usagePackStatus ? ` [${option.usagePackStatus}]` : ''}`)
              .join(', ')}`,
          );
          console.log(`  or choose another option via /create-tool-usage-pack`);
        }
      }),
  );

  addSharedDirectoryOption(
    program
      .command('reconcile-change')
      .description('Queue a reverse-waterfall reconciliation record for ad-hoc code, bug, design, or repo changes')
      .requiredOption('--type <type>', 'bugfix, code-change, feature-tweak, design-tweak, repo-absorption')
      .requiredOption('--summary <summary>', 'Short summary of the change')
      .option('--story <storyId>', 'Related story id')
      .option('--epic <epicId>', 'Related epic id')
      .option('--file <path...>', 'Touched file path(s)', [])
      .option('--graph-status <status>', 'available, degraded, or unavailable', 'degraded')
      .option('--note <text>', 'Additional operator note')
      .action(
        async (
          options: {
            directory: string;
            type: 'bugfix' | 'code-change' | 'feature-tweak' | 'design-tweak' | 'repo-absorption';
            summary: string;
            story?: string;
            epic?: string;
            file: string[];
            graphStatus: 'available' | 'degraded' | 'unavailable';
            note?: string;
          },
        ) => {
          const record = await queueReconciliation(getProjectRoot(options.directory), {
            type: options.type,
            summary: options.summary,
            storyId: options.story || null,
            epicId: options.epic || null,
            touchedFiles: options.file || [],
            graphStatus: options.graphStatus,
            requiredUpdates: ['story_spec', 'epic_linkage', 'featuregraph', 'knowledge_summary'],
            notes: options.note,
          });

          console.log(chalk.green(`Queued reconciliation record ${record.type} at ${record.timestamp}`));
        },
      ),
  );

  addSharedDirectoryOption(
    program
      .command('reconcile-status')
      .description('Show pending reverse-sync reconciliation status and source-of-truth artifacts')
      .action((options: { directory: string }) => {
        const status = getReconciliationStatus(getProjectRoot(options.directory));
        console.log(chalk.blue('reconciliation status'));
        console.log(`pending queue records: ${status.pendingCount}`);
        console.log(`work items: ${status.workItemCount}`);
        console.log(`source-of-truth artifacts: ${status.sourceOfTruthArtifactCount}`);
        console.log(`latest record: ${status.latestRecord || 'none'}`);
      }),
  );

  addSharedDirectoryOption(
    program
      .command('truth-status')
      .description('Show the current source-of-truth surfaces used by Orch routing')
      .action((options: { directory: string }) => {
        const truth = loadSourceOfTruth(getProjectRoot(options.directory));
        console.log(chalk.blue('source-of-truth status'));
        console.log(`sprint status files: ${truth.sprintStatuses.length}`);
        for (const sprint of truth.sprintStatuses) {
          console.log(`- ${sprint.path}: status=${sprint.status || 'unknown'}, sprint=${sprint.currentSprint || 'n/a'}, epics=${sprint.epicCount}, stories=${sprint.storyCount}`);
        }
        console.log(`story ids indexed: ${truth.storyIds.length}`);
        console.log(`epic ids indexed: ${truth.epicIds.length}`);
        console.log(`reconciliation scopes: ${truth.reconciliationScopes.length}`);
      }),
  );

  addSharedDirectoryOption(
    program
      .command('inventory')
      .description('List the current I-Wish/BMAD-DragonBall skills, agents, workflows, packs, and tool adapters')
      .option('--format <type>', 'json or markdown', 'json')
      .action((options: { directory: string; format: 'json' | 'markdown' }) => {
        const inventory = buildPlatformInventory(getProjectRoot(options.directory));
        if (options.format === 'markdown') {
          console.log(`# Platform Inventory`);
          console.log(`- Skills: ${inventory.skills.length}`);
          console.log(`- Routing profiles: ${inventory.routingProfiles.length}`);
          console.log(`- Agents: ${inventory.agents.length} total (${inventory.canonicalAgents.length} canonical, ${inventory.legacyPersonaAgents.length} legacy persona, ${inventory.transitionalFunctionAgents.length} transitional function)`);
          console.log(`- Workflows: ${inventory.workflows.length} total (${inventory.canonicalWorkflows.length} canonical, ${inventory.legacyWorkflowEntrypoints.length} legacy entrypoints, ${inventory.workflowStepFiles.length} step files, ${inventory.workflowTemplates.length} templates, ${inventory.workflowSupportAssets.length} support assets, ${inventory.activeNonCanonicalWorkflows.length} active non-canonical)`);
          console.log(`- Install targets: ${inventory.installTargets.join(', ')}`);
          console.log(`- Planned install targets: ${inventory.plannedInstallTargets.join(', ') || 'none'}`);
          console.log(`- Tool groups: ${inventory.tools.map((tool) => `${tool.group}(${tool.adapters.length})`).join(', ')}`);
          console.log(`\n## Skills\n${inventory.skills.map((item) => `- ${item}`).join('\n')}`);
          console.log(`\n## Routing Profiles\n${inventory.routingProfiles.map((item) => `- ${item}`).join('\n') || '- none'}`);
          console.log(`\n## Canonical Agents\n${inventory.canonicalAgents.map((item) => `- ${item}`).join('\n')}`);
          console.log(`\n## Legacy Persona Agents\n${inventory.legacyPersonaAgents.map((item) => `- ${item}`).join('\n') || '- none'}`);
          console.log(`\n## Transitional Function Agents\n${inventory.transitionalFunctionAgents.map((item) => `- ${item}`).join('\n') || '- none'}`);
          console.log(`\n## Canonical Workflows\n${inventory.canonicalWorkflows.map((item) => `- ${item}`).join('\n')}`);
          console.log(`\n## Legacy Workflow Entrypoints\n${inventory.legacyWorkflowEntrypoints.map((item) => `- ${item}`).join('\n') || '- none'}`);
          console.log(`\n## Active Non-Canonical Workflows\n${inventory.activeNonCanonicalWorkflows.map((item) => `- ${item}`).join('\n') || '- none'}`);
          console.log(`\n## Workflow Step Files\n${inventory.workflowStepFiles.map((item) => `- ${item}`).join('\n') || '- none'}`);
          console.log(`\n## Workflow Templates\n${inventory.workflowTemplates.map((item) => `- ${item}`).join('\n') || '- none'}`);
          console.log(`\n## Workflow Support Assets\n${inventory.workflowSupportAssets.map((item) => `- ${item}`).join('\n') || '- none'}`);
          console.log(`\n## Library Packs\n${inventory.libraryPacks.map((pack) => `- ${pack.name}: skills=${pack.skills.length}, workflows=${pack.workflows.length}, agents=${pack.agents.length}`).join('\n')}`);
          return;
        }

        console.log(JSON.stringify(inventory, null, 2));
      }),
  );

  addSharedDirectoryOption(
    program
      .command('skill-graph-status')
      .description('Inspect how skills are indexed, referenced, and classified for Orch routing')
      .option('--format <type>', 'json or markdown', 'json')
      .action((options: { directory: string; format: 'json' | 'markdown' }) => {
        const report = buildSkillGraphReport(getProjectRoot(options.directory));
        if (options.format === 'markdown') {
          console.log(`# Skill Graph Status`);
          console.log(`- Total skill packages: ${report.totalSkills}`);
          console.log(`- Routing profiles: ${report.routingProfileCount}`);
          console.log(`- Indexed in KG: ${report.indexedSkills}`);
          console.log(`- Library-pack skills: ${report.libraryPackSkills.length}`);
          console.log(`- Workflow capabilities: ${report.workflowCapabilityCount}`);
          console.log(`- Total capability surface: ${report.totalCapabilitySurface}`);
          console.log(`- Unindexed skills: ${report.unindexedSkills.length}`);
          console.log(`- Orphan skills: ${report.orphanSkills.length}`);
          console.log(`- Tactical skills: ${report.tacticalSkills.length}`);
          console.log(`- Routable skills: ${report.routableSkills.length}`);
          console.log(`- Foundational skills: ${report.foundationalSkills.length}`);
          console.log(`\n## Canonical Workflow Capabilities\n${report.canonicalWorkflowCapabilities.map((item) => `- ${item}`).join('\n') || '- none'}`);
          console.log(`\n## Legacy Workflow Capabilities\n${report.legacyWorkflowCapabilities.map((item) => `- ${item}`).join('\n') || '- none'}`);
          console.log(`\n## Library-Pack Skills\n${report.libraryPackSkills.map((item) => `- ${item}`).join('\n') || '- none'}`);
          console.log(`\n## Unprofiled Root Skills\n${report.unprofiledSkills.map((item) => `- ${item}`).join('\n') || '- none'}`);
          console.log(`\n## Unprofiled Workflow Capabilities\n${report.unprofiledWorkflowCapabilities.map((item) => `- ${item}`).join('\n') || '- none'}`);
          console.log(`\n## Unindexed Skills\n${report.unindexedSkills.map((item) => `- ${item}`).join('\n') || '- none'}`);
          console.log(`\n## Orphan Skills\n${report.orphanSkills.map((item) => `- ${item}`).join('\n') || '- none'}`);
          console.log(`\n## Tactical Skills\n${report.tacticalSkills.map((item) => `- ${item}`).join('\n') || '- none'}`);
          return;
        }
        console.log(JSON.stringify(report, null, 2));
      }),
  );

  addSharedDirectoryOption(
    program
      .command('select-tool')
      .description('Select the active tool adapter for a runtime tool group')
      .argument('<group>', 'Tool group such as browser, design, or graph')
      .argument('<adapter>', 'Adapter id such as playwright, stitch, or falkordb-full')
      .action(async (group: string, adapter: string, options: { directory: string }) => {
        const profile = await selectToolProfile(getProjectRoot(options.directory), group, adapter);
        console.log(chalk.green(`Selected ${adapter} for tool group ${group}`));
        console.log(JSON.stringify(profile, null, 2));
      }),
  );

  addSharedDirectoryOption(
    program
      .command('show-tool-profile')
      .description('Show the currently selected runtime tool adapters')
      .action((options: { directory: string }) => {
        const profile = readToolProfile(getProjectRoot(options.directory));
        if (!profile) {
          console.log(chalk.yellow('No active tool profile found.'));
          return;
        }
        console.log(JSON.stringify(profile, null, 2));
      }),
  );

  addSharedDirectoryOption(
    program
      .command('init')
      .description('Compatibility alias for the legacy init command')
      .option('-p, --platform <target...>', 'Install target(s). If omitted, the CLI will ask you to choose.')
      .action(async (options: { directory: string; platform: string[] }) => {
        console.log(chalk.yellow('`init` is a compatibility alias. Use `iwish install` moving forward.'));
        const projectRoot = getProjectRoot(options.directory);
        const targets = await resolveInstallTargets(options.platform);
        await installRuntime(projectRoot, targets, 'install');
        await ensureCapabilityPackageTemplates(projectRoot);
      }),
  );

  addSharedDirectoryOption(
    program
      .command('add')
      .description('Compatibility alias that registers a built-in or external module')
      .argument('<module>', 'Module code, Git URL, or local path')
      .option('-n, --name <name>', 'Display name for the registered module')
      .action(async (moduleSource: string, options: { directory: string; name?: string }) => {
        console.log(chalk.yellow('`add` is a compatibility alias. Use `iwish register-module` moving forward.'));
        await registerModule(getProjectRoot(options.directory), moduleSource, options.name);
      }),
  );

  await program.parseAsync(process.argv);
}
