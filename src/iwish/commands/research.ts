import { Command } from 'commander';
import chalk from 'chalk';
import { scaffoldSolutionResearchArtifacts, readSolutionResearchState, advanceSolutionResearchStage, generateIdeaChallengeArtifacts } from '../runtime';
import { runTournament, mergeTournament, abortTournament } from '../tournament-runner';

export function registerResearchCommands(
  program: Command,
  getProjectRoot: (directory?: string) => string,
  addSharedDirectoryOption: (command: Command) => Command
): void {
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
      .command('tournament')
      .description('Run a parallel A/B tournament for multiple plugins/workflows')
      .option('--task <task>', 'Task description to evaluate')
      .option('--candidates <candidates>', 'Comma-separated list of candidate plugins/workflows')
      .option('--merge <candidate>', 'Merge a winning candidate branch and clean up')
      .option('--abort', 'Abort the active tournament and return to baseline')
      .action(
        async (
          options: {
            directory: string;
            task?: string;
            candidates?: string;
            merge?: string;
            abort?: boolean;
          },
        ) => {
          const projectRoot = getProjectRoot(options.directory);
          if (options.abort) {
            await abortTournament(projectRoot);
          } else if (options.merge) {
            await mergeTournament(projectRoot, options.merge);
          } else {
            if (!options.task || !options.candidates) {
              console.error(chalk.red('❌ Error: Either specify --task and --candidates to start a tournament, or --merge / --abort to finish/abort it.'));
              process.exit(1);
            }
            await runTournament(projectRoot, options.task, options.candidates);
          }
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
}
