import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import chalk from 'chalk';
import * as path from 'path';

import { SUPPORTED_INSTALL_TARGETS, getPlatformMode } from '../constants';
import { normalizeInstallTargets, getToolSetupStatus, selectToolProfile, detectPlatformCapabilities, compileUserGuideDashboard } from '../runtime';

export async function resolveInstallTargets(rawTargets?: string[]): Promise<string[]> {
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

export async function promptGraphToolSelection(projectRoot: string): Promise<void> {
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
        const matched = graphPrompt.options.find((opt: any) => opt.id.toLowerCase() === answer.toLowerCase());
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

export async function promptPlatformIngestion(projectRoot: string, targets: string[]): Promise<string[]> {
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
      return capabilities.map((cap) => cap.id);
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
      const indices = selection.split(',').map((entry) => Number(entry.trim()) - 1).filter((idx) => idx >= 0 && idx < capabilities.length);
      return indices.map((idx) => capabilities[idx].id);
    }

    return capabilities.map((cap) => cap.id);
  } finally {
    rl.close();
  }
}

export async function printInstallationSummary(projectRoot: string, mode: 'install' | 'update'): Promise<void> {
  try {
    const dashboardPath = await compileUserGuideDashboard(projectRoot);
    const absoluteDashboardUrl = `file://${dashboardPath}`;
    const relativeDashboardPath = path.relative(process.cwd(), dashboardPath);

    console.log('');
    console.log(chalk.green.bold('======================================================================'));
    console.log(chalk.green.bold(`🎉 I-WISH RUNTIME ${mode === 'install' ? 'INSTALLATION' : 'UPDATE'} COMPLETED SUCCESSFULLY!`));
    console.log(chalk.green.bold('======================================================================'));
    console.log('');
    console.log(chalk.cyan.bold('📁 INTERACTIVE USER GUIDE & DASHBOARD'));
    console.log(`An interactive dashboard has been generated at:`);
    console.log(chalk.cyan(`👉 ${relativeDashboardPath}`));
    console.log(chalk.gray(`Absolute URL: ${absoluteDashboardUrl}`));
    console.log('');
    console.log(chalk.blue('Open this file in any web browser to view:'));
    console.log(`  - 🧭 ${chalk.bold('Interactive Codebase Knowledge Graph')} for dependencies and impact analysis.`);
    console.log(`  - 📋 ${chalk.bold('Active Sprint Backlog Kanban')} to track user stories and tasks.`);
    console.log(`  - 🤖 ${chalk.bold('Multi-Agent Trace logs')} showing orchestrations, agent status, and runs.`);
    console.log(`  - 📖 ${chalk.bold('Comprehensive Slash Command & Workflow User Guide')} for all I-Wish tools.`);
    console.log('');
    console.log(chalk.yellow.bold('🚀 CORE CLI COMMANDS'));
    console.log(`  - ${chalk.cyan('iwish status')}          Show the current I-Wish runtime, tool selections, and active modules.`);
    console.log(`  - ${chalk.cyan('iwish doctor')}          Run diagnostics to verify runtime environment health.`);
    console.log(`  - ${chalk.cyan('iwish route "<prompt>"')} Route any request (e.g. iwish route "research on github...")`);
    console.log(`  - ${chalk.cyan('iwish gen-dashboard')}   Recompile and update the interactive dashboard.`);
    console.log(chalk.green.bold('======================================================================'));
    console.log('');
  } catch (error: any) {
    console.error(chalk.red(`Failed to compile User Guide & Dashboard: ${error.message}`));
  }
}
