import { Command } from 'commander';
import chalk from 'chalk';
import { registerModule, generateCapabilityReviewPack } from '../runtime';
import { buildSkillGraphReport } from '../skill-graph';

export function registerModuleCommands(
  program: Command,
  getProjectRoot: (directory?: string) => string,
  addSharedDirectoryOption: (command: Command) => Command
): void {
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
          console.log(`\
## Canonical Workflow Capabilities\
${report.canonicalWorkflowCapabilities.map((item) => `- ${item}`).join('\
') || '- none'}`);
          console.log(`\
## Legacy Workflow Capabilities\
${report.legacyWorkflowCapabilities.map((item) => `- ${item}`).join('\
') || '- none'}`);
          console.log(`\
## Library-Pack Skills\
${report.libraryPackSkills.map((item) => `- ${item}`).join('\
') || '- none'}`);
          console.log(`\
## Unprofiled Root Skills\
${report.unprofiledSkills.map((item) => `- ${item}`).join('\
') || '- none'}`);
          console.log(`\
## Unprofiled Workflow Capabilities\
${report.unprofiledWorkflowCapabilities.map((item) => `- ${item}`).join('\
') || '- none'}`);
          console.log(`\
## Unindexed Skills\
${report.unindexedSkills.map((item) => `- ${item}`).join('\
') || '- none'}`);
          console.log(`\
## Orphan Skills\
${report.orphanSkills.map((item) => `- ${item}`).join('\
') || '- none'}`);
          console.log(`\
## Tactical Skills\
${report.tacticalSkills.map((item) => `- ${item}`).join('\
') || '- none'}`);
          return;
        }
        console.log(JSON.stringify(report, null, 2));
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
}
