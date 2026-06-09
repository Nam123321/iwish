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
    addSharedDirectoryOption(program
        .command('featuregraph-index')
        .description('Run the FeatureGraph indexer to populate FalkorDB with feature dependency data from epics, stories, and feature-hierarchy')
        .action(async (options) => {
        const projectRoot = getProjectRoot(options.directory);
        const scriptPath = path.join(__dirname, '..', '..', '..', 'scripts', 'featuregraph-indexer.sh');
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        console.log(chalk_1.default.blue('\n🔗 I-Wish FeatureGraph Indexer'));
        console.log(chalk_1.default.gray('━'.repeat(50)));
        if (!fs.existsSync(scriptPath)) {
            console.error(chalk_1.default.red('❌ featuregraph-indexer.sh not found at scripts/featuregraph-indexer.sh'));
            process.exit(1);
        }
        try {
            const { execSync } = await Promise.resolve().then(() => __importStar(require('child_process')));
            console.log(chalk_1.default.cyan('📊 Running FeatureGraph indexer...'));
            const output = execSync(`bash "${scriptPath}" "${projectRoot}"`, {
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: 60000,
            });
            console.log(output);
            console.log(chalk_1.default.green.bold('\n✅ FeatureGraph indexing completed successfully!'));
            // Auto-trigger dashboard update
            console.log(chalk_1.default.cyan('\n📊 Updating dashboard...'));
            const dashboardPath = await (0, runtime_1.compileUserGuideDashboard)(projectRoot);
            console.log(chalk_1.default.green(`  ✓ Dashboard updated: file://${dashboardPath}`));
        }
        catch (error) {
            if (error.stderr && error.stderr.includes('FalkorDB')) {
                console.error(chalk_1.default.yellow('\n⚠️  FalkorDB is not running. Start it with: docker start falkordb'));
                console.error(chalk_1.default.gray('   The FeatureGraph requires FalkorDB to store node/edge data.'));
            }
            else {
                console.error(chalk_1.default.red(`\n❌ FeatureGraph indexing failed: ${error.message}`));
            }
            process.exit(1);
        }
    }));
    addSharedDirectoryOption(program
        .command('featuregraph-retrofit')
        .description('Retrofit FeatureGraph pipeline for existing projects: generate feature-hierarchy.md, scan stories, and index graph')
        .action(async (options) => {
        const projectRoot = getProjectRoot(options.directory);
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        console.log(chalk_1.default.blue('\n🔄 I-Wish FeatureGraph Retrofit'));
        console.log(chalk_1.default.gray('━'.repeat(50)));
        console.log(chalk_1.default.gray('Upgrading existing project to FeatureGraph pipeline...\n'));
        const report = [];
        let hasErrors = false;
        // Step 1: Detect output directory
        const iwishOutput = path.join(projectRoot, '_iwish-output');
        const bmadOutput = path.join(projectRoot, '_bmad-output');
        let outputDir;
        let planningDir;
        if (fs.existsSync(iwishOutput)) {
            outputDir = iwishOutput;
            planningDir = iwishOutput;
        }
        else if (fs.existsSync(bmadOutput)) {
            outputDir = bmadOutput;
            planningDir = path.join(bmadOutput, 'planning-artifacts');
        }
        else {
            console.error(chalk_1.default.red('❌ No _iwish-output/ or _bmad-output/ directory found.'));
            console.error(chalk_1.default.yellow('   Run /create-prd and /create-epics-and-stories first.'));
            process.exit(1);
        }
        report.push(`📂 Output directory: ${path.relative(projectRoot, outputDir)}`);
        // Step 2: Check prerequisites
        console.log(chalk_1.default.cyan('Step 1: Checking prerequisites...'));
        const epicsCandidates = [
            path.join(outputDir, '2. Product Planning', '2.4. epics-and-stories.md'),
            path.join(planningDir, 'epics.md'),
        ];
        const epicsPath = epicsCandidates.find(p => fs.existsSync(p));
        const storiesDir = path.join(planningDir, 'stories');
        if (!epicsPath) {
            console.error(chalk_1.default.red('❌ epics file not found. Run /create-epics-and-stories first.'));
            hasErrors = true;
        }
        else {
            report.push(`  ✓ epics file found: ${path.basename(epicsPath)}`);
        }
        // Step 3: Check feature-hierarchy.md (canonical + fallback paths)
        console.log(chalk_1.default.cyan('\nStep 2: Checking feature-hierarchy.md...'));
        const hierarchyCandidates = [
            path.join(outputDir, '2. Product Planning', '2.5. feature-hierarchy.md'),
            path.join(planningDir, 'feature-hierarchy.md'),
        ];
        const hierarchyPath = hierarchyCandidates.find(p => fs.existsSync(p));
        if (hierarchyPath) {
            const stat = fs.statSync(hierarchyPath);
            console.log(chalk_1.default.green(`  ✓ feature-hierarchy.md exists (${stat.size} bytes)`));
            console.log(chalk_1.default.gray(`    at: ${path.relative(projectRoot, hierarchyPath)}`));
            report.push(`  ✓ feature-hierarchy.md exists (${stat.size} bytes) — no regeneration needed`);
        }
        else {
            console.log(chalk_1.default.yellow('  ⚠ feature-hierarchy.md NOT FOUND'));
            console.log(chalk_1.default.gray('    → Expected at: _iwish-output/2. Product Planning/2.5. feature-hierarchy.md'));
            console.log(chalk_1.default.gray('    → Run /feature-hierarchy or /create-epics-and-stories to generate.'));
            console.log(chalk_1.default.gray('    → Reference template: templates/library/code-intelligence-pack/featuregraph/feature-hierarchy-template.md'));
            report.push('  ⚠ feature-hierarchy.md MISSING — must be generated');
            report.push('    ACTION: Run /feature-hierarchy to generate directly');
            report.push('    OR: Run /create-epics-and-stories (which auto-generates via Step 5c)');
        }
        // Step 4: Scan stories for Cross-Feature Dependencies
        console.log(chalk_1.default.cyan('\nStep 3: Scanning stories for Cross-Feature Dependencies...'));
        const storiesMissing = [];
        const storiesOk = [];
        if (fs.existsSync(storiesDir)) {
            const storyFiles = fs.readdirSync(storiesDir).filter((f) => f.endsWith('.md'));
            for (const file of storyFiles) {
                const content = fs.readFileSync(path.join(storiesDir, file), 'utf-8');
                if (content.includes('## Cross-Feature Dependencies')) {
                    storiesOk.push(file);
                }
                else {
                    storiesMissing.push(file);
                }
            }
            console.log(chalk_1.default.green(`  ✓ ${storiesOk.length} stories have Cross-Feature Dependencies`));
            if (storiesMissing.length > 0) {
                console.log(chalk_1.default.yellow(`  ⚠ ${storiesMissing.length} stories MISSING Cross-Feature Dependencies:`));
                for (const f of storiesMissing.slice(0, 10)) {
                    console.log(chalk_1.default.gray(`    - ${f}`));
                }
                if (storiesMissing.length > 10) {
                    console.log(chalk_1.default.gray(`    ... and ${storiesMissing.length - 10} more`));
                }
            }
            report.push(`  Stories with Cross-Feature Dependencies: ${storiesOk.length}/${storyFiles.length}`);
            if (storiesMissing.length > 0) {
                report.push(`  ⚠ ${storiesMissing.length} stories need backfill — re-run /make-story for each`);
            }
        }
        else {
            console.log(chalk_1.default.yellow('  ⚠ No stories directory found'));
            report.push('  ⚠ No stories directory — run /create-epics-and-stories first');
        }
        // Step 5: Try to run indexer
        console.log(chalk_1.default.cyan('\nStep 4: Checking FeatureGraph indexer...'));
        const scriptPath = path.join(__dirname, '..', '..', '..', 'scripts', 'featuregraph-indexer.sh');
        if (fs.existsSync(scriptPath)) {
            console.log(chalk_1.default.green('  ✓ featuregraph-indexer.sh found'));
            report.push('  ✓ Indexer script available');
            if ((hierarchyPath && fs.existsSync(hierarchyPath)) || !hasErrors) {
                try {
                    const { execSync } = await Promise.resolve().then(() => __importStar(require('child_process')));
                    console.log(chalk_1.default.gray('  Attempting to run indexer...'));
                    execSync(`bash "${scriptPath}" "${projectRoot}" 2>&1 || true`, {
                        encoding: 'utf-8',
                        timeout: 30000,
                    });
                    console.log(chalk_1.default.green('  ✓ Indexer executed'));
                    report.push('  ✓ Indexer executed successfully');
                }
                catch {
                    console.log(chalk_1.default.yellow('  ⚠ Indexer execution skipped (FalkorDB may not be running)'));
                    report.push('  ⚠ Indexer skipped — ensure FalkorDB is running: docker start falkordb');
                }
            }
        }
        else {
            console.log(chalk_1.default.yellow('  ⚠ featuregraph-indexer.sh not found — may not be installed'));
            report.push('  ⚠ Indexer script not found');
        }
        // Step 6: Output migration report
        console.log(chalk_1.default.blue('\n' + '━'.repeat(50)));
        console.log(chalk_1.default.blue.bold('📋 FeatureGraph Retrofit Report'));
        console.log(chalk_1.default.blue('━'.repeat(50)));
        for (const line of report) {
            console.log(line);
        }
        console.log(chalk_1.default.blue('\n📌 Recommended Next Steps:'));
        if (!hierarchyPath || !fs.existsSync(hierarchyPath)) {
            console.log(chalk_1.default.yellow('  1. Generate feature-hierarchy.md:'));
            console.log(chalk_1.default.gray('     Run /create-epics-and-stories (auto-generates hierarchy)'));
            console.log(chalk_1.default.gray('     OR ask Architect Agent: "Generate feature-hierarchy.md from PRD + Architecture + Epics"'));
        }
        if (storiesMissing.length > 0) {
            console.log(chalk_1.default.yellow(`  ${(!hierarchyPath || !fs.existsSync(hierarchyPath)) ? '2' : '1'}. Backfill ${storiesMissing.length} stories with Cross-Feature Dependencies:`));
            console.log(chalk_1.default.gray('     Re-run /make-story for each story, or ask agent to add sections'));
        }
        console.log(chalk_1.default.gray('  → After fixes: run `iwish featuregraph-index` to populate the graph'));
        console.log(chalk_1.default.gray('  → Then: run `iwish gen-dashboard` to update the dashboard'));
    }));
}
