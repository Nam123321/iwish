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
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCli = runCli;
const commander_1 = require("commander");
const path = __importStar(require("path"));
const install_1 = require("./commands/install");
const status_1 = require("./commands/status");
const graph_1 = require("./commands/graph");
const routing_1 = require("./commands/routing");
const reconciliation_1 = require("./commands/reconciliation");
const module_1 = require("./commands/module");
const research_1 = require("./commands/research");
function getInvocationName() {
    return process.argv[1]?.split('/').pop() || 'iwish';
}
function getProjectRoot(directory) {
    return directory ? path.resolve(directory) : process.cwd();
}
function addSharedDirectoryOption(command) {
    return command.option('-d, --directory <path>', 'Project directory to operate on', process.cwd());
}
async function runCli() {
    const invocation = getInvocationName();
    const program = new commander_1.Command();
    program
        .name(invocation === 'bmad-db' ? 'bmad-db' : 'iwish')
        .description('I-Wish open platform CLI with shim-first compatibility for legacy BMAD runtimes')
        .version('1.0.0');
    (0, install_1.registerInstallCommands)(program, getProjectRoot, addSharedDirectoryOption);
    (0, status_1.registerStatusCommands)(program, getProjectRoot, addSharedDirectoryOption);
    (0, graph_1.registerGraphCommands)(program, getProjectRoot, addSharedDirectoryOption);
    (0, routing_1.registerRoutingCommands)(program, getProjectRoot, addSharedDirectoryOption);
    (0, reconciliation_1.registerReconciliationCommands)(program, getProjectRoot, addSharedDirectoryOption);
    (0, module_1.registerModuleCommands)(program, getProjectRoot, addSharedDirectoryOption);
    (0, research_1.registerResearchCommands)(program, getProjectRoot, addSharedDirectoryOption);
    await program.parseAsync(process.argv);
}
