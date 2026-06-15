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
                timeout: 300000,
            });
            console.log(output);
            console.log(chalk_1.default.green.bold('\n✅ FeatureGraph indexing completed successfully!'));
            // Index OKF frontmatter files to DB if online
            const { isGraphDBOnline, scanOKFMarkdownFiles, upsertOKFNodeInDB } = await Promise.resolve().then(() => __importStar(require('../graph-db')));
            const online = await isGraphDBOnline();
            if (online) {
                console.log(chalk_1.default.cyan('\n🔍 Indexing OKF frontmatter to Graph Database...'));
                const iwishOutputDir = path.join(projectRoot, '_iwish-output');
                const okfNodes = scanOKFMarkdownFiles(iwishOutputDir, projectRoot);
                let indexedCount = 0;
                for (const node of okfNodes) {
                    try {
                        await upsertOKFNodeInDB(node);
                        indexedCount++;
                    }
                    catch (e) {
                        console.warn(chalk_1.default.yellow(`  ⚠️  Failed to index OKF node ${node.title}: ${e.message}`));
                    }
                }
                console.log(chalk_1.default.green(`  ✓ Indexed ${indexedCount} OKF nodes and relationships in database.`));
            }
            else {
                console.log(chalk_1.default.yellow('\n⚠️  Graph Database is offline. Skipping OKF database indexing.'));
            }
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
        // Helper to find a file matching pattern recursively in a dir (excluding node_modules, .git, drafts, archive, etc.)
        const findFile = (dir, pattern) => {
            if (!fs.existsSync(dir))
                return null;
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (entry.name !== 'node_modules' &&
                        !entry.name.startsWith('.') &&
                        entry.name !== 'scratch' &&
                        entry.name !== 'archive' &&
                        entry.name !== 'templates' &&
                        entry.name !== 'drafts') {
                        const found = findFile(fullPath, pattern);
                        if (found)
                            return found;
                    }
                }
                else if (entry.name.endsWith('.md') && pattern.test(entry.name)) {
                    return fullPath;
                }
            }
            return null;
        };
        // Stories directory finder
        const findStoriesDir = (base) => {
            // Standard candidates first
            const standard = path.join(base, 'stories');
            if (fs.existsSync(standard))
                return standard;
            const deepPath = path.join(base, '3. Development', '1. Epic & Story');
            if (fs.existsSync(deepPath))
                return deepPath;
            // Helper to find directory
            const findDir = (dir) => {
                if (!fs.existsSync(dir))
                    return null;
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        if (entry.name === 'stories' || entry.name === 'Epic & Story') {
                            return fullPath;
                        }
                        if (entry.name !== 'node_modules' &&
                            !entry.name.startsWith('.') &&
                            entry.name !== 'scratch' &&
                            entry.name !== 'archive' &&
                            entry.name !== 'templates' &&
                            entry.name !== 'drafts') {
                            const found = findDir(fullPath);
                            if (found)
                                return found;
                        }
                    }
                }
                return null;
            };
            return findDir(base) || base; // Fallback to base
        };
        const epicsCandidates = [
            path.join(outputDir, '2. Product Planning', '2.4. epics-and-stories.md'),
            path.join(planningDir, 'epics.md'),
        ];
        let epicsPath = epicsCandidates.find(p => fs.existsSync(p));
        if (!epicsPath) {
            epicsPath = findFile(outputDir, /^epics(-and-stories|-list)?\.md$/i) ||
                findFile(outputDir, /epics.*\.md$/i) || undefined;
        }
        const storiesDir = findStoriesDir(outputDir);
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
            path.join(outputDir, '2. Product Planning', '2.8. feature-hierarchy.md'),
            path.join(planningDir, 'feature-hierarchy.md'),
        ];
        let hierarchyPath = hierarchyCandidates.find(p => fs.existsSync(p));
        if (!hierarchyPath) {
            hierarchyPath = findFile(outputDir, /^feature-hierarchy\.md$/i) ||
                findFile(outputDir, /hierarchy\.md$/i) || undefined;
        }
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
    addSharedDirectoryOption(program
        .command('validate-okf')
        .description('Validate one or more OKF files against their corresponding JSON Schemas')
        .option('-f, --file <path>', 'Path to a specific file or folder to validate')
        .action(async (options) => {
        const projectRoot = getProjectRoot(options.directory);
        const { validateOKFDocument } = await Promise.resolve().then(() => __importStar(require('../schema-validator')));
        const fs = await Promise.resolve().then(() => __importStar(require('fs-extra')));
        let filesToValidate = [];
        if (options.file) {
            const targetPath = path.isAbsolute(options.file) ? options.file : path.resolve(projectRoot, options.file);
            if (!fs.existsSync(targetPath)) {
                console.error(chalk_1.default.red(`❌ File or directory not found: ${options.file}`));
                process.exit(1);
            }
            const stat = fs.statSync(targetPath);
            if (stat.isFile()) {
                filesToValidate.push(targetPath);
            }
            else {
                const collectFiles = (dir) => {
                    const entries = fs.readdirSync(dir, { withFileTypes: true });
                    for (const entry of entries) {
                        const fullPath = path.join(dir, entry.name);
                        if (entry.isDirectory()) {
                            if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
                                collectFiles(fullPath);
                            }
                        }
                        else if (entry.name.endsWith('.md')) {
                            filesToValidate.push(fullPath);
                        }
                    }
                };
                collectFiles(targetPath);
            }
        }
        else {
            const iwishOutputDir = path.join(projectRoot, '_iwish-output');
            if (fs.existsSync(iwishOutputDir)) {
                const collectFiles = (dir) => {
                    const entries = fs.readdirSync(dir, { withFileTypes: true });
                    for (const entry of entries) {
                        const fullPath = path.join(dir, entry.name);
                        if (entry.isDirectory()) {
                            if (entry.name !== 'scratch' && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
                                collectFiles(fullPath);
                            }
                        }
                        else if (entry.name.endsWith('.md') && !entry.name.endsWith('DESIGN.md') && !entry.name.endsWith('user-guide.md')) {
                            filesToValidate.push(fullPath);
                        }
                    }
                };
                collectFiles(iwishOutputDir);
            }
            else {
                console.log(chalk_1.default.yellow('  _iwish-output directory does not exist yet. Nothing to validate.'));
                return;
            }
        }
        if (filesToValidate.length === 0) {
            console.log(chalk_1.default.yellow('  No markdown files found to validate.'));
            return;
        }
        console.log(chalk_1.default.cyan(`🔍 Validating ${filesToValidate.length} OKF files...`));
        let errorCount = 0;
        for (const file of filesToValidate) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                if (content.match(/^---\n([\s\S]*?)\n---/)) {
                    validateOKFDocument(content, file, projectRoot);
                    console.log(chalk_1.default.green(`  ✓ ${path.relative(projectRoot, file)} is valid`));
                }
                else {
                    console.log(chalk_1.default.gray(`  - ${path.relative(projectRoot, file)} skipped (no frontmatter)`));
                }
            }
            catch (error) {
                console.error(chalk_1.default.red(`  ✗ ${path.relative(projectRoot, file)}: ${error.message}`));
                errorCount++;
            }
        }
        if (errorCount > 0) {
            console.error(chalk_1.default.red.bold(`\n❌ Validation failed: ${errorCount} errors found.`));
            process.exit(1);
        }
        else {
            console.log(chalk_1.default.green.bold('\n✅ All OKF files are valid!'));
        }
    }));
    addSharedDirectoryOption(program
        .command('update-knowledge-formatter')
        .description('Automatically upgrade legacy documentation files to standard OKF frontmatter, validate, index, and update dashboard')
        .action(async (options) => {
        const projectRoot = getProjectRoot(options.directory);
        const { validateOKFDocument } = await Promise.resolve().then(() => __importStar(require('../schema-validator')));
        const { formatOKFUri, generateOKFHeader } = await Promise.resolve().then(() => __importStar(require('../okf-helper')));
        const fs = await Promise.resolve().then(() => __importStar(require('fs-extra')));
        console.log(chalk_1.default.blue('\n🔄 I-Wish Knowledge Formatter Retrofit'));
        console.log(chalk_1.default.gray('━'.repeat(50)));
        const iwishOutputDir = path.join(projectRoot, '_iwish-output');
        const bmadOutputDir = path.join(projectRoot, '_bmad-output');
        let outputDir = iwishOutputDir;
        if (!fs.existsSync(iwishOutputDir)) {
            if (fs.existsSync(bmadOutputDir)) {
                outputDir = bmadOutputDir;
            }
            else {
                console.error(chalk_1.default.red('❌ No _iwish-output/ or _bmad-output/ directory found.'));
                process.exit(1);
            }
        }
        console.log(chalk_1.default.cyan(`📁 Scanning folder: ${path.relative(projectRoot, outputDir)}`));
        const markdownFiles = [];
        const collectFiles = (dir) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (entry.name !== 'node_modules' && entry.name !== 'scratch' && !entry.name.startsWith('.')) {
                        collectFiles(fullPath);
                    }
                }
                else if (entry.name.endsWith('.md') && !entry.name.endsWith('DESIGN.md') && !entry.name.endsWith('user-guide.md')) {
                    markdownFiles.push(fullPath);
                }
            }
        };
        collectFiles(outputDir);
        if (markdownFiles.length === 0) {
            console.log(chalk_1.default.yellow('No markdown files found to format.'));
            return;
        }
        let updatedCount = 0;
        let alreadyCompliantCount = 0;
        let failCount = 0;
        for (const file of markdownFiles) {
            const relativePath = path.relative(projectRoot, file);
            try {
                const content = fs.readFileSync(file, 'utf8');
                const hasFrontmatter = content.match(/^---\n([\s\S]*?)\n---/);
                let needsUpdate = false;
                let existingMeta = {};
                if (hasFrontmatter) {
                    try {
                        const YAML = await Promise.resolve().then(() => __importStar(require('yaml')));
                        existingMeta = YAML.parse(hasFrontmatter[1]) || {};
                        // Check if it is missing any of the 4 required OKF fields
                        if (!existingMeta.type || !existingMeta.title || !existingMeta.timestamp || !existingMeta.links_to) {
                            needsUpdate = true;
                        }
                    }
                    catch {
                        needsUpdate = true; // Malformed frontmatter
                    }
                }
                else {
                    needsUpdate = true; // No frontmatter
                }
                if (!needsUpdate) {
                    alreadyCompliantCount++;
                    continue;
                }
                // Infer type
                let inferredType = 'I-Wish Concept';
                const normalizedPath = relativePath.replace(/\\/g, '/');
                if (normalizedPath.includes('/stories/') || path.basename(file).startsWith('story-')) {
                    inferredType = 'I-Wish Story';
                }
                else if (normalizedPath.includes('/Product Planning/2.1.') || normalizedPath.includes('/prd') || normalizedPath.includes('product-brief')) {
                    inferredType = 'I-Wish PRD';
                }
                else if (normalizedPath.includes('/Functional Design/3.2. ui') || normalizedPath.includes('ui-spec')) {
                    inferredType = 'I-Wish UI Spec';
                }
                else if (normalizedPath.includes('/Functional Design/3.3. data') || normalizedPath.includes('data-spec')) {
                    inferredType = 'I-Wish Data Spec';
                }
                else if (normalizedPath.includes('/Functional Design/3.1. architecture') || normalizedPath.includes('architecture-spec')) {
                    inferredType = 'I-Wish Architecture Spec';
                }
                else if (normalizedPath.includes('/bug-reports/') || path.basename(file).startsWith('bug-')) {
                    inferredType = 'I-Wish Bug Report';
                }
                else if (normalizedPath.includes('/reconciliation/') || normalizedPath.includes('reconciliation')) {
                    inferredType = 'I-Wish Reconciliation Work Item';
                }
                else if (normalizedPath.includes('/reviews/') || normalizedPath.includes('review')) {
                    inferredType = 'I-Wish Concept';
                }
                // Extract H1 title
                let title = existingMeta.title;
                if (!title) {
                    const h1Match = content.match(/^#\s+(.+)$/m);
                    title = h1Match ? h1Match[1].trim() : path.basename(file, '.md');
                }
                // Extract description
                let description = existingMeta.description;
                if (!description) {
                    // Get first non-empty line after title
                    const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('---') && !l.startsWith('*'));
                    if (lines.length > 0) {
                        description = lines[0].slice(0, 150);
                    }
                }
                const links_to = Array.isArray(existingMeta.links_to) ? existingMeta.links_to : [];
                const tags = Array.isArray(existingMeta.tags) ? existingMeta.tags : [];
                const timestamp = existingMeta.timestamp || new Date().toISOString();
                const header = generateOKFHeader({
                    type: existingMeta.type || inferredType,
                    title,
                    description,
                    resource: existingMeta.resource || relativePath,
                    tags,
                    timestamp,
                    links_to,
                }, projectRoot);
                // Replace or insert frontmatter
                let newContent = '';
                if (hasFrontmatter) {
                    newContent = content.replace(/^---\n([\s\S]*?)\n---/, header);
                }
                else {
                    newContent = `${header}\n\n${content}`;
                }
                // Clean double blank lines at top if any
                newContent = newContent.replace(/^\n+/, '');
                // Validate using schema validator
                validateOKFDocument(newContent, file, projectRoot);
                // Write back to disk
                fs.writeFileSync(file, newContent, 'utf8');
                console.log(chalk_1.default.green(`  ✓ Retrofitted & validated: ${relativePath} (${inferredType})`));
                updatedCount++;
            }
            catch (e) {
                console.error(chalk_1.default.red(`  ✗ Failed to retrofit ${relativePath}: ${e.message}`));
                failCount++;
            }
        }
        console.log(chalk_1.default.cyan('\n📊 Retrofit Summary:'));
        console.log(`  - Updated: ${updatedCount}`);
        console.log(`  - Already compliant: ${alreadyCompliantCount}`);
        console.log(`  - Failures: ${failCount}`);
        if (failCount > 0) {
            console.error(chalk_1.default.red.bold('\n❌ Retrofit completed with errors.'));
            process.exit(1);
        }
        // Trigger indexing
        console.log(chalk_1.default.cyan('\n🔗 Running FeatureGraph indexing...'));
        const { isGraphDBOnline, scanOKFMarkdownFiles, upsertOKFNodeInDB } = await Promise.resolve().then(() => __importStar(require('../graph-db')));
        const online = await isGraphDBOnline();
        if (online) {
            const okfNodes = scanOKFMarkdownFiles(outputDir, projectRoot);
            let indexedCount = 0;
            for (const node of okfNodes) {
                try {
                    await upsertOKFNodeInDB(node);
                    indexedCount++;
                }
                catch (e) {
                    console.warn(chalk_1.default.yellow(`  ⚠️  Failed to index OKF node ${node.title}: ${e.message}`));
                }
            }
            console.log(chalk_1.default.green(`  ✓ Indexed ${indexedCount} OKF nodes in database.`));
        }
        else {
            console.log(chalk_1.default.yellow('  ⚠️  Graph Database is offline. Skipping database indexing.'));
        }
        // Refresh dashboard
        console.log(chalk_1.default.cyan('\n📊 Updating dashboard...'));
        try {
            const { compileUserGuideDashboard } = await Promise.resolve().then(() => __importStar(require('../runtime')));
            const dashboardPath = await compileUserGuideDashboard(projectRoot);
            console.log(chalk_1.default.green(`  ✓ Dashboard updated: file://${dashboardPath}`));
        }
        catch (error) {
            console.error(chalk_1.default.red(`  Failed to refresh dashboard: ${error.message}`));
        }
        console.log(chalk_1.default.green.bold('\n✅ Knowledge Formatter Upgrade completed successfully!'));
    }));
}
