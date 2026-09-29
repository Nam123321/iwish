"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerStatusCommands = registerStatusCommands;
const chalk_1 = __importDefault(require("chalk"));
const runtime_1 = require("../runtime");
const inventory_1 = require("../inventory");
function registerStatusCommands(program, getProjectRoot, addSharedDirectoryOption) {
    addSharedDirectoryOption(program
        .command('status')
        .description('Show the current I-Wish runtime and compatibility state')
        .action((options) => {
        (0, runtime_1.printStatus)(getProjectRoot(options.directory));
    }));
    addSharedDirectoryOption(program
        .command('doctor')
        .description('Run a lightweight diagnostic pass for I-Wish runtime health')
        .action((options) => {
        (0, runtime_1.printDoctor)(getProjectRoot(options.directory));
    }));
    program.command('list-modules').description('List built-in I-Wish module descriptors').action(() => {
        (0, runtime_1.printModules)();
    });
    program.command('list-tools').description('List built-in I-Wish tool adapter groups').action(() => {
        (0, runtime_1.printTools)();
    });
    program.command('list-install-targets').description('List supported and planned install targets').action(() => {
        (0, runtime_1.printInstallTargets)();
    });
    addSharedDirectoryOption(program
        .command('inventory')
        .description('List the current I-Wish/BMAD-DragonBall skills, agents, workflows, packs, and tool adapters')
        .option('--format <type>', 'json or markdown', 'json')
        .action((options) => {
        const inventory = (0, inventory_1.buildPlatformInventory)(getProjectRoot(options.directory));
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
    }));
    addSharedDirectoryOption(program
        .command('tool-setup-status')
        .description('Show pending tool setup questions and default options for the current project')
        .action((options) => {
        const prompts = (0, runtime_1.getToolSetupStatus)(getProjectRoot(options.directory));
        if (prompts.length === 0) {
            console.log(chalk_1.default.green('All currently required baseline tool groups are configured.'));
            return;
        }
        console.log(chalk_1.default.blue('tool setup prompts'));
        for (const prompt of prompts) {
            console.log(`- ${prompt.group}: ${prompt.reason}`);
            console.log(`  recommended: ${prompt.recommended || 'none'}`);
            console.log(`  current: ${prompt.currentSelection || 'none'}`);
            console.log(`  options: ${prompt.options
                .map((option) => `${option.id}${option.usagePackStatus ? ` [${option.usagePackStatus}]` : ''}`)
                .join(', ')}`);
            console.log(`  or choose another option via /create-tool-usage-pack`);
        }
    }));
    addSharedDirectoryOption(program
        .command('select-tool')
        .description('Select the active tool adapter for a runtime tool group')
        .argument('<group>', 'Tool group such as browser, design, or graph')
        .argument('<adapter>', 'Adapter id such as playwright, stitch, or falkordb-full')
        .action(async (group, adapter, options) => {
        const profile = await (0, runtime_1.selectToolProfile)(getProjectRoot(options.directory), group, adapter);
        console.log(chalk_1.default.green(`Selected ${adapter} for tool group ${group}`));
        console.log(JSON.stringify(profile, null, 2));
    }));
    addSharedDirectoryOption(program
        .command('show-tool-profile')
        .description('Show the currently selected runtime tool adapters')
        .action((options) => {
        const profile = (0, runtime_1.readToolProfile)(getProjectRoot(options.directory));
        if (!profile) {
            console.log(chalk_1.default.yellow('No active tool profile found.'));
            return;
        }
        console.log(JSON.stringify(profile, null, 2));
    }));
}
