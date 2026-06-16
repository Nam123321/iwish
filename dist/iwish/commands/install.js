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
exports.registerInstallCommands = registerInstallCommands;
const chalk_1 = __importDefault(require("chalk"));
const runtime_1 = require("../runtime");
const llm_setup_1 = require("../llm-setup");
const install_helpers_1 = require("./install-helpers");
function registerInstallCommands(program, getProjectRoot, addSharedDirectoryOption) {
    addSharedDirectoryOption(program
        .command('install')
        .description('Scaffold the canonical I-Wish runtime substrate in a project')
        .option('-p, --platform <target...>', 'Install target(s). If omitted, the CLI will ask you to choose.')
        .option('--skip-tool-setup', 'Skip interactive baseline tool setup prompts after install')
        .option('--skip-platform-ingest', 'Skip interactive platform skill ingestion and run in pure I-Wish mode')
        .action(async (options) => {
        const projectRoot = getProjectRoot(options.directory);
        const { checkForRegistryUpdates } = await Promise.resolve().then(() => __importStar(require('../../code-intel/registry-updater')));
        await checkForRegistryUpdates(projectRoot).catch(() => { });
        const targets = await (0, install_helpers_1.resolveInstallTargets)(options.platform);
        await (0, runtime_1.installRuntime)(projectRoot, targets, 'install');
        await (0, runtime_1.ensureCapabilityPackageTemplates)(projectRoot);
        if (!options.skipToolSetup) {
            await (0, llm_setup_1.promptLLMSetup)(projectRoot);
            await (0, install_helpers_1.promptGraphToolSelection)(projectRoot);
        }
        else {
            console.log(chalk_1.default.yellow('Skipped baseline tool setup.'));
            console.log('Run later: iwish tool-setup-status');
        }
        let selectedIds = [];
        if (options.skipPlatformIngest) {
            console.log(chalk_1.default.yellow('Skipped platform skill ingestion flag detected.'));
        }
        else {
            selectedIds = await (0, install_helpers_1.promptPlatformIngestion)(projectRoot, targets);
        }
        await (0, runtime_1.ingestPlatformSkills)(projectRoot, targets, selectedIds);
        await (0, install_helpers_1.printInstallationSummary)(projectRoot, 'install');
    }));
    addSharedDirectoryOption(program
        .command('update')
        .description('Refresh the I-Wish runtime manifest without overwriting customizations')
        .option('-p, --platform <target...>', 'Install target(s). If omitted, the CLI will ask you to choose.')
        .option('--skip-tool-setup', 'Skip interactive baseline tool setup prompts after update')
        .option('--skip-platform-ingest', 'Skip interactive platform skill ingestion and run in pure I-Wish mode')
        .action(async (options) => {
        const projectRoot = getProjectRoot(options.directory);
        const { checkForRegistryUpdates } = await Promise.resolve().then(() => __importStar(require('../../code-intel/registry-updater')));
        await checkForRegistryUpdates(projectRoot).catch(() => { });
        const targets = await (0, install_helpers_1.resolveInstallTargets)(options.platform);
        await (0, runtime_1.installRuntime)(projectRoot, targets, 'update');
        await (0, runtime_1.ensureCapabilityPackageTemplates)(projectRoot, true);
        if (!options.skipToolSetup) {
            await (0, llm_setup_1.promptLLMSetup)(projectRoot);
            await (0, install_helpers_1.promptGraphToolSelection)(projectRoot);
        }
        else {
            console.log(chalk_1.default.yellow('Skipped baseline tool setup.'));
            console.log('Run later: iwish tool-setup-status');
        }
        let selectedIds = [];
        if (options.skipPlatformIngest) {
            console.log(chalk_1.default.yellow('Skipped platform skill ingestion flag detected.'));
        }
        else {
            selectedIds = await (0, install_helpers_1.promptPlatformIngestion)(projectRoot, targets);
        }
        await (0, runtime_1.ingestPlatformSkills)(projectRoot, targets, selectedIds);
        await (0, install_helpers_1.printInstallationSummary)(projectRoot, 'update');
    }));
    addSharedDirectoryOption(program
        .command('init')
        .description('Compatibility alias for the legacy init command')
        .option('-p, --platform <target...>', 'Install target(s). If omitted, the CLI will ask you to choose.')
        .action(async (options) => {
        console.log(chalk_1.default.yellow('`init` is a compatibility alias. Use `iwish install` moving forward.'));
        const projectRoot = getProjectRoot(options.directory);
        const targets = await (0, install_helpers_1.resolveInstallTargets)(options.platform);
        await (0, runtime_1.installRuntime)(projectRoot, targets, 'install');
        await (0, runtime_1.ensureCapabilityPackageTemplates)(projectRoot);
    }));
}
