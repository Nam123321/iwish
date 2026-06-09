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
exports.registerGraphCommands = registerGraphCommands;
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const graph_parser_1 = require("../graph-parser");
const runtime_1 = require("../runtime");
const graph_merger_1 = require("../../code-intel/graph-merger");
function registerGraphCommands(program, getProjectRoot, addSharedDirectoryOption) {
    addSharedDirectoryOption(program
        .command('show-graph')
        .description('Expose the extracted Knowledge Graph structure in standard JSON')
        .action((options) => {
        const result = (0, graph_parser_1.extractGraphData)(getProjectRoot(options.directory));
        console.log(JSON.stringify(result, null, 2));
    }));
    addSharedDirectoryOption(program
        .command('gen-dashboard')
        .description('Compile and export the interactive User Guide & Knowledge Graph dashboard')
        .action(async (options) => {
        const projectRoot = getProjectRoot(options.directory);
        try {
            const outputPath = await (0, runtime_1.compileUserGuideDashboard)(projectRoot);
            console.log(chalk_1.default.green(`Interactive User Guide & Dashboard successfully compiled!`));
            console.log(`Open in browser: file://${outputPath}`);
        }
        catch (error) {
            console.error(chalk_1.default.red(`Failed to generate User Guide & Dashboard: ${error.message}`));
        }
    }));
    addSharedDirectoryOption(program
        .command('code-graph')
        .description('Run the Semantic Code Intelligence pipeline: scan files, analyze with LLM, merge graph, and update dashboard')
        .option('--scan-only', 'Only run the file scanner without LLM analysis')
        .option('--fast', 'Tier 1 Mode: Use regex heuristic instead of LLM to bypass rate limits (ideal for bulk ingest)')
        .option('--batch-size <size>', 'Number of files per LLM analysis batch', '10')
        .action(async (options) => {
        const projectRoot = getProjectRoot(options.directory);
        console.log(chalk_1.default.blue('\
🔬 I-Wish Semantic Code Intelligence Pipeline'));
        console.log(chalk_1.default.gray('━'.repeat(50)));
        try {
            const { checkForRegistryUpdates } = await Promise.resolve().then(() => __importStar(require('../../code-intel/registry-updater')));
            await checkForRegistryUpdates(projectRoot).catch(() => { });
            // Step 1: File scanning
            console.log(chalk_1.default.cyan('\
📁 Step 1: Scanning files for changes...'));
            const { scanFiles, createBatches } = await Promise.resolve().then(() => __importStar(require('../../code-intel/file-scanner')));
            const scanResult = await scanFiles(projectRoot);
            console.log(chalk_1.default.green(`  ✓ Scanned ${scanResult.totalFiles} files`));
            console.log(`    Added: ${scanResult.added.length}, Modified: ${scanResult.modified.length}, Deleted: ${scanResult.deleted.length}, Renamed: ${scanResult.renamed.length}`);
            if (options.scanOnly) {
                console.log(chalk_1.default.yellow('\
⏸ Scan-only mode. Skipping LLM analysis and merge.'));
                return;
            }
            const changedFiles = [...scanResult.added, ...scanResult.modified];
            if (changedFiles.length === 0) {
                console.log(chalk_1.default.green('\
✨ No changed files to analyze. Running merge with existing data...'));
            }
            else {
                // Step 2: Semantic analysis
                console.log(chalk_1.default.cyan(`\
🧠 Step 2: Analyzing ${changedFiles.length} changed files...`));
                const batchSize = parseInt(options.batchSize, 10) || 10;
                const batches = createBatches(changedFiles, batchSize);
                const { analyzeBatch } = await Promise.resolve().then(() => __importStar(require('../../code-intel/semantic-analyzer')));
                for (const batch of batches) {
                    console.log(chalk_1.default.gray(`  Processing batch ${batch.batchIndex + 1}/${batch.totalBatches} (${batch.files.length} files)...`));
                    await analyzeBatch(projectRoot, batch.files, { heuristicOnly: options.fast });
                }
                console.log(chalk_1.default.green(`  ✓ Semantic analysis complete`));
            }
            // Step 3: Graph merge
            console.log(chalk_1.default.cyan('\
🔀 Step 3: Merging technical graph with semantic metadata...'));
            const graph = await (0, graph_merger_1.mergeGraphs)(projectRoot);
            console.log(chalk_1.default.green(`  ✓ Hybrid graph generated: ${graph.metadata.nodeCount} nodes, ${graph.metadata.edgeCount} edges`));
            console.log(`    Adapter: ${graph.metadata.adapterUsed}`);
            // Step 4: Update dashboard
            console.log(chalk_1.default.cyan('\
📊 Step 4: Updating dashboard...'));
            const dashboardPath = await (0, runtime_1.compileUserGuideDashboard)(projectRoot);
            console.log(chalk_1.default.green(`  ✓ Dashboard updated: file://${dashboardPath}`));
            console.log(chalk_1.default.green.bold('\
✅ Code Intelligence pipeline completed successfully!'));
            console.log(chalk_1.default.gray(`   Graph saved to: .iwish/cache/iwish-code-graph.json`));
        }
        catch (error) {
            console.error(chalk_1.default.red(`\
❌ Pipeline failed: ${error.message}`));
            process.exit(1);
        }
    }));
    addSharedDirectoryOption(program
        .command('inject-node')
        .description('Inject semantic metadata for a file directly into the local cache and merge the graph (Tier 1 IDE Agent Hybrid mode)')
        .requiredOption('-f, --file <path>', 'File path relative to project root')
        .requiredOption('-m, --metadata <json>', 'JSON string of SemanticMetadata')
        .action(async (options) => {
        const projectRoot = getProjectRoot(options.directory);
        console.log(chalk_1.default.blue('\
💉 I-Wish Tier 1 Hybrid Graph Injection'));
        console.log(chalk_1.default.gray('━'.repeat(50)));
        try {
            const { loadSemanticCache, saveSemanticCache } = await Promise.resolve().then(() => __importStar(require('../../code-intel/semantic-analyzer')));
            let parsed;
            try {
                parsed = JSON.parse(options.metadata);
            }
            catch (e) {
                console.error(chalk_1.default.red('❌ Failed to parse metadata JSON.'));
                process.exit(1);
            }
            const metadata = {
                summary: parsed.summary || 'Injected via Hybrid Tier 1',
                tags: Array.isArray(parsed.tags) ? parsed.tags : [],
                layer: parsed.layer || 'unknown',
                complexity: parsed.complexity || 'unknown'
            };
            const cache = loadSemanticCache(projectRoot);
            let targetFile = options.file;
            if (path.isAbsolute(targetFile)) {
                targetFile = path.relative(projectRoot, targetFile);
            }
            cache[targetFile] = metadata;
            await saveSemanticCache(projectRoot, cache);
            console.log(chalk_1.default.green(`  ✓ Injected metadata for ${targetFile} into semantic cache.`));
            console.log(chalk_1.default.cyan('\
📁 Scanning files for technical dependencies...'));
            const { scanFiles } = await Promise.resolve().then(() => __importStar(require('../../code-intel/file-scanner')));
            await scanFiles(projectRoot);
            console.log(chalk_1.default.cyan('\
🔀 Merging technical graph with semantic metadata...'));
            const { mergeGraphs } = await Promise.resolve().then(() => __importStar(require('../../code-intel/graph-merger')));
            const graph = await mergeGraphs(projectRoot);
            console.log(chalk_1.default.green(`  ✓ Hybrid graph generated: ${graph.metadata.nodeCount} nodes, ${graph.metadata.edgeCount} edges`));
            console.log(chalk_1.default.cyan('\
📊 Updating dashboard...'));
            const dashboardPath = await (0, runtime_1.compileUserGuideDashboard)(projectRoot);
            console.log(chalk_1.default.green(`  ✓ Dashboard updated: file://${dashboardPath}`));
            console.log(chalk_1.default.green.bold('\
✅ Tier 1 Hybrid Injection completed successfully!'));
        }
        catch (error) {
            const chalk = (await Promise.resolve().then(() => __importStar(require('chalk')))).default;
            console.error(chalk.red(`\
❌ Injection failed: ${error.message}`));
            process.exit(1);
        }
    }));
}
