import { Command } from 'commander';
import * as path from 'path';

import { registerInstallCommands } from './commands/install';
import { registerStatusCommands } from './commands/status';
import { registerGraphCommands } from './commands/graph';
import { registerRoutingCommands } from './commands/routing';
import { registerReconciliationCommands } from './commands/reconciliation';
import { registerModuleCommands } from './commands/module';
import { registerResearchCommands } from './commands/research';

function getInvocationName(): string {
  return process.argv[1]?.split('/').pop() || 'iwish';
}

function getProjectRoot(directory?: string): string {
  return directory ? path.resolve(directory) : process.cwd();
}

function addSharedDirectoryOption(command: Command): Command {
  return command.option('-d, --directory <path>', 'Project directory to operate on', process.cwd());
}

export async function runCli(): Promise<void> {
  const invocation = getInvocationName();
  const program = new Command();

  program
    .name(invocation === 'bmad-db' ? 'bmad-db' : 'iwish')
    .description('I-Wish open platform CLI with shim-first compatibility for legacy BMAD runtimes')
    .version('1.0.0');

  registerInstallCommands(program, getProjectRoot, addSharedDirectoryOption);
  registerStatusCommands(program, getProjectRoot, addSharedDirectoryOption);
  registerGraphCommands(program, getProjectRoot, addSharedDirectoryOption);
  registerRoutingCommands(program, getProjectRoot, addSharedDirectoryOption);
  registerReconciliationCommands(program, getProjectRoot, addSharedDirectoryOption);
  registerModuleCommands(program, getProjectRoot, addSharedDirectoryOption);
  registerResearchCommands(program, getProjectRoot, addSharedDirectoryOption);

  await program.parseAsync(process.argv);
}
