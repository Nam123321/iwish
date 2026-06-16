import { Command } from 'commander';
import chalk from 'chalk';
import { ensureCapabilityPackageTemplates, installRuntime, ingestPlatformSkills } from '../runtime';
import { promptLLMSetup } from '../llm-setup';
import { resolveInstallTargets, promptGraphToolSelection, promptPlatformIngestion, printInstallationSummary } from './install-helpers';

export function registerInstallCommands(
  program: Command,
  getProjectRoot: (directory?: string) => string,
  addSharedDirectoryOption: (command: Command) => Command
): void {
  addSharedDirectoryOption(
    program
      .command('install')
      .description('Scaffold the canonical I-Wish runtime substrate in a project')
      .option('-p, --platform <target...>', 'Install target(s). If omitted, the CLI will ask you to choose.')
      .option('--skip-tool-setup', 'Skip interactive baseline tool setup prompts after install')
      .option('--skip-platform-ingest', 'Skip interactive platform skill ingestion and run in pure I-Wish mode')
      .action(async (options: { directory: string; platform: string[]; skipToolSetup?: boolean; skipPlatformIngest?: boolean }) => {
        const projectRoot = getProjectRoot(options.directory);
        const { checkForRegistryUpdates } = await import('../../code-intel/registry-updater');
        await checkForRegistryUpdates(projectRoot).catch(() => {});
        const targets = await resolveInstallTargets(options.platform);
        await installRuntime(projectRoot, targets, 'install');
        await ensureCapabilityPackageTemplates(projectRoot, true);
        if (!options.skipToolSetup) {
          await promptLLMSetup(projectRoot);
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
        await printInstallationSummary(projectRoot, 'install');
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
        const { checkForRegistryUpdates } = await import('../../code-intel/registry-updater');
        await checkForRegistryUpdates(projectRoot).catch(() => {});
        const targets = await resolveInstallTargets(options.platform);
        await installRuntime(projectRoot, targets, 'update');
        await ensureCapabilityPackageTemplates(projectRoot, true);
        if (!options.skipToolSetup) {
          await promptLLMSetup(projectRoot);
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
        await printInstallationSummary(projectRoot, 'update');
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
        await ensureCapabilityPackageTemplates(projectRoot, true);
      }),
  );
}
