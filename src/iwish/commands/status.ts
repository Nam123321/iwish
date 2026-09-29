import { Command } from 'commander';
import chalk from 'chalk';
import { printStatus, printDoctor, printModules, printTools, printInstallTargets, getToolSetupStatus, selectToolProfile, readToolProfile } from '../runtime';
import { buildPlatformInventory } from '../inventory';

export function registerStatusCommands(
  program: Command,
  getProjectRoot: (directory?: string) => string,
  addSharedDirectoryOption: (command: Command) => Command
): void {
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
          console.log(`\
## Skills\
${inventory.skills.map((item) => `- ${item}`).join('\
')}`);
          console.log(`\
## Routing Profiles\
${inventory.routingProfiles.map((item) => `- ${item}`).join('\
') || '- none'}`);
          console.log(`\
## Canonical Agents\
${inventory.canonicalAgents.map((item) => `- ${item}`).join('\
')}`);
          console.log(`\
## Legacy Persona Agents\
${inventory.legacyPersonaAgents.map((item) => `- ${item}`).join('\
') || '- none'}`);
          console.log(`\
## Transitional Function Agents\
${inventory.transitionalFunctionAgents.map((item) => `- ${item}`).join('\
') || '- none'}`);
          console.log(`\
## Canonical Workflows\
${inventory.canonicalWorkflows.map((item) => `- ${item}`).join('\
')}`);
          console.log(`\
## Legacy Workflow Entrypoints\
${inventory.legacyWorkflowEntrypoints.map((item) => `- ${item}`).join('\
') || '- none'}`);
          console.log(`\
## Active Non-Canonical Workflows\
${inventory.activeNonCanonicalWorkflows.map((item) => `- ${item}`).join('\
') || '- none'}`);
          console.log(`\
## Workflow Step Files\
${inventory.workflowStepFiles.map((item) => `- ${item}`).join('\
') || '- none'}`);
          console.log(`\
## Workflow Templates\
${inventory.workflowTemplates.map((item) => `- ${item}`).join('\
') || '- none'}`);
          console.log(`\
## Workflow Support Assets\
${inventory.workflowSupportAssets.map((item) => `- ${item}`).join('\
') || '- none'}`);
          console.log(`\
## Library Packs\
${inventory.libraryPacks.map((pack) => `- ${pack.name}: skills=${pack.skills.length}, workflows=${pack.workflows.length}, agents=${pack.agents.length}`).join('\
')}`);
          return;
        }

        console.log(JSON.stringify(inventory, null, 2));
      }),
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
}
