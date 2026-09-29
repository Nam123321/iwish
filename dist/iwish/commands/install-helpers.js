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
exports.resolveInstallTargets = resolveInstallTargets;
exports.promptGraphToolSelection = promptGraphToolSelection;
exports.promptPlatformIngestion = promptPlatformIngestion;
exports.printInstallationSummary = printInstallationSummary;
const promises_1 = require("node:readline/promises");
const node_process_1 = require("node:process");
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const constants_1 = require("../constants");
const runtime_1 = require("../runtime");
async function resolveInstallTargets(rawTargets) {
    if (rawTargets && rawTargets.length > 0) {
        return (0, runtime_1.normalizeInstallTargets)(rawTargets);
    }
    const rl = (0, promises_1.createInterface)({ input: node_process_1.stdin, output: node_process_1.stdout });
    try {
        console.log(chalk_1.default.blue('Choose one or more install targets for this project.'));
        constants_1.SUPPORTED_INSTALL_TARGETS.forEach((target, index) => {
            console.log(`${index + 1}. ${target}`);
        });
        console.log('Enter one or more target names or numbers separated by commas.');
        const answer = await rl.question('Platform(s) to install for: ');
        const normalizedAnswer = answer.trim();
        if (!normalizedAnswer) {
            return (0, runtime_1.normalizeInstallTargets)([]);
        }
        const commaSeparated = normalizedAnswer.split(',').map((entry) => entry.trim()).filter(Boolean);
        const resolved = commaSeparated.map((entry) => {
            const numeric = Number(entry);
            if (Number.isInteger(numeric) && numeric >= 1 && numeric <= constants_1.SUPPORTED_INSTALL_TARGETS.length) {
                return constants_1.SUPPORTED_INSTALL_TARGETS[numeric - 1];
            }
            return entry;
        });
        if (resolved.length === 1 && constants_1.SUPPORTED_INSTALL_TARGETS.includes(resolved[0])) {
            return (0, runtime_1.normalizeInstallTargets)(resolved);
        }
        return (0, runtime_1.normalizeInstallTargets)(resolved);
    }
    finally {
        rl.close();
    }
}
async function promptGraphToolSelection(projectRoot) {
    const prompts = (0, runtime_1.getToolSetupStatus)(projectRoot);
    const graphPrompt = prompts.find((prompt) => prompt.group === 'graph');
    if (!graphPrompt) {
        return;
    }
    const rl = (0, promises_1.createInterface)({ input: node_process_1.stdin, output: node_process_1.stdout });
    const platform = (0, constants_1.getPlatformMode)();
    const recommendedOverride = platform === 'AG_MAO' ? 'antigravity-memory' : graphPrompt.recommended;
    try {
        console.log('');
        console.log(chalk_1.default.blue('=============================================='));
        console.log(chalk_1.default.yellow('📊 MANDATORY GRAPH SETUP'));
        console.log(chalk_1.default.blue('A graph solution is required for I-Wish execution.'));
        if (platform === 'AG_MAO') {
            console.log(chalk_1.default.green('Google Antigravity 2.0 runtime detected! Recommended: antigravity-memory'));
        }
        console.log(chalk_1.default.blue('=============================================='));
        while (true) {
            graphPrompt.options.forEach((option, index) => {
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
                console.log(chalk_1.default.red('Graph setup is mandatory. Please make a selection to continue.'));
                continue;
            }
            const numeric = Number(answer);
            let selected = '';
            if (Number.isInteger(numeric) && numeric >= 1 && numeric <= graphPrompt.options.length) {
                selected = graphPrompt.options[numeric - 1].id;
            }
            else if (Number.isInteger(numeric) && numeric === graphPrompt.options.length + 1) {
                selected = 'custom-adapter';
            }
            else {
                // Check if matching by id directly
                const matched = graphPrompt.options.find((opt) => opt.id.toLowerCase() === answer.toLowerCase());
                if (matched) {
                    selected = matched.id;
                }
                else if (answer.toLowerCase() === 'custom-adapter') {
                    selected = 'custom-adapter';
                }
            }
            if (selected) {
                await (0, runtime_1.selectToolProfile)(projectRoot, 'graph', selected);
                console.log(chalk_1.default.green(`Selected ${selected} for tool group graph`));
                if (selected === 'custom-adapter') {
                    console.log('Next: define the custom graph adapter contract and usage pack before using graph-backed workflows.');
                }
                break;
            }
            else {
                console.log(chalk_1.default.red('Invalid selection. Please try again.'));
            }
        }
    }
    finally {
        rl.close();
    }
}
async function promptPlatformIngestion(projectRoot, targets) {
    const capabilities = await (0, runtime_1.detectPlatformCapabilities)(projectRoot, targets);
    if (capabilities.length === 0) {
        return [];
    }
    const rl = (0, promises_1.createInterface)({ input: node_process_1.stdin, output: node_process_1.stdout });
    try {
        console.log('');
        console.log(chalk_1.default.blue('=============================================='));
        console.log(chalk_1.default.yellow('🔌 PLATFORM SKILL & MCP INGESTION'));
        console.log('Detected the following platform-native capabilities:');
        capabilities.forEach((cap, index) => {
            console.log(`${index + 1}. [${cap.type.toUpperCase()}] ${cap.name} (ID: ${cap.id})`);
        });
        console.log('----------------------------------------------');
        console.log('Choices:');
        console.log('1. Ingest all detected platform capabilities (recommended)');
        console.log('2. Skip all (Keep I-Wish completely pure)');
        console.log('3. Select specific capabilities to ingest');
        console.log(chalk_1.default.blue('=============================================='));
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
    }
    finally {
        rl.close();
    }
}
async function printInstallationSummary(projectRoot, mode) {
    try {
        const dashboardPath = await (0, runtime_1.compileUserGuideDashboard)(projectRoot);
        const absoluteDashboardUrl = `file://${dashboardPath}`;
        const relativeDashboardPath = path.relative(process.cwd(), dashboardPath);
        console.log('');
        console.log(chalk_1.default.green.bold('======================================================================'));
        console.log(chalk_1.default.green.bold(`🎉 I-WISH RUNTIME ${mode === 'install' ? 'INSTALLATION' : 'UPDATE'} COMPLETED SUCCESSFULLY!`));
        console.log(chalk_1.default.green.bold('======================================================================'));
        console.log('');
        console.log(chalk_1.default.cyan.bold('📁 INTERACTIVE USER GUIDE & DASHBOARD'));
        console.log(`An interactive dashboard has been generated at:`);
        console.log(chalk_1.default.cyan(`👉 ${relativeDashboardPath}`));
        console.log(chalk_1.default.gray(`Absolute URL: ${absoluteDashboardUrl}`));
        console.log('');
        console.log(chalk_1.default.blue('Open this file in any web browser to view:'));
        console.log(`  - 🧭 ${chalk_1.default.bold('Interactive Codebase Knowledge Graph')} for dependencies and impact analysis.`);
        console.log(`  - 📋 ${chalk_1.default.bold('Active Sprint Backlog Kanban')} to track user stories and tasks.`);
        console.log(`  - 🤖 ${chalk_1.default.bold('Multi-Agent Trace logs')} showing orchestrations, agent status, and runs.`);
        console.log(`  - 📖 ${chalk_1.default.bold('Comprehensive Slash Command & Workflow User Guide')} for all I-Wish tools.`);
        console.log('');
        console.log(chalk_1.default.yellow.bold('🚀 CORE CLI COMMANDS'));
        console.log(`  - ${chalk_1.default.cyan('iwish status')}          Show the current I-Wish runtime, tool selections, and active modules.`);
        console.log(`  - ${chalk_1.default.cyan('iwish doctor')}          Run diagnostics to verify runtime environment health.`);
        console.log(`  - ${chalk_1.default.cyan('iwish route "<prompt>"')} Route any request (e.g. iwish route "research on github...")`);
        console.log(`  - ${chalk_1.default.cyan('iwish gen-dashboard')}   Recompile and update the interactive dashboard.`);
        console.log(chalk_1.default.green.bold('======================================================================'));
        console.log('');
    }
    catch (error) {
        console.error(chalk_1.default.red(`Failed to compile User Guide & Dashboard: ${error.message}`));
    }
}
