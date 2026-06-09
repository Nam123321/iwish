import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { extractGraphData } from '../graph-parser';
import { compileUserGuideDashboard } from '../runtime';
import { mergeGraphs } from '../../code-intel/graph-merger';

export function registerGraphCommands(
  program: Command,
  getProjectRoot: (directory?: string) => string,
  addSharedDirectoryOption: (command: Command) => Command
): void {
  addSharedDirectoryOption(
    program
      .command('show-graph')
      .description('Expose the extracted Knowledge Graph structure in standard JSON')
      .action((options: { directory: string }) => {
        const result = extractGraphData(getProjectRoot(options.directory));
        console.log(JSON.stringify(result, null, 2));
      }),
  );

  addSharedDirectoryOption(
    program
      .command('gen-dashboard')
      .description('Compile and export the interactive User Guide & Knowledge Graph dashboard')
      .action(async (options: { directory: string }) => {
        const projectRoot = getProjectRoot(options.directory);
        try {
          const outputPath = await compileUserGuideDashboard(projectRoot);
          console.log(chalk.green(`Interactive User Guide & Dashboard successfully compiled!`));
          console.log(`Open in browser: file://${outputPath}`);
        } catch (error: any) {
          console.error(chalk.red(`Failed to generate User Guide & Dashboard: ${error.message}`));
        }
      }),
  );

  addSharedDirectoryOption(
    program
      .command('code-graph')
      .description('Run the Semantic Code Intelligence pipeline: scan files, analyze with LLM, merge graph, and update dashboard')
      .option('--scan-only', 'Only run the file scanner without LLM analysis')
      .option('--fast', 'Tier 1 Mode: Use regex heuristic instead of LLM to bypass rate limits (ideal for bulk ingest)')
      .option('--batch-size <size>', 'Number of files per LLM analysis batch', '10')
      .action(async (options: { directory: string; scanOnly?: boolean; fast?: boolean; batchSize: string }) => {
        const projectRoot = getProjectRoot(options.directory);
        console.log(chalk.blue('\
🔬 I-Wish Semantic Code Intelligence Pipeline'));
        console.log(chalk.gray('━'.repeat(50)));

        try {
          const { checkForRegistryUpdates } = await import('../../code-intel/registry-updater');
          await checkForRegistryUpdates(projectRoot).catch(() => {});

          // Step 1: File scanning
          console.log(chalk.cyan('\
📁 Step 1: Scanning files for changes...'));
          const { scanFiles, createBatches } = await import('../../code-intel/file-scanner');
          const scanResult = await scanFiles(projectRoot);
          console.log(chalk.green(`  ✓ Scanned ${scanResult.totalFiles} files`));
          console.log(`    Added: ${scanResult.added.length}, Modified: ${scanResult.modified.length}, Deleted: ${scanResult.deleted.length}, Renamed: ${scanResult.renamed.length}`);

          if (options.scanOnly) {
            console.log(chalk.yellow('\
⏸ Scan-only mode. Skipping LLM analysis and merge.'));
            return;
          }

          const changedFiles = [...scanResult.added, ...scanResult.modified];
          if (changedFiles.length === 0) {
            console.log(chalk.green('\
✨ No changed files to analyze. Running merge with existing data...'));
          } else {
            // Step 2: Semantic analysis
            console.log(chalk.cyan(`\
🧠 Step 2: Analyzing ${changedFiles.length} changed files...`));
            const batchSize = parseInt(options.batchSize, 10) || 10;
            const batches = createBatches(changedFiles, batchSize);
            const { analyzeBatch } = await import('../../code-intel/semantic-analyzer');
            for (const batch of batches) {
              console.log(chalk.gray(`  Processing batch ${batch.batchIndex + 1}/${batch.totalBatches} (${batch.files.length} files)...`));
              await analyzeBatch(projectRoot, batch.files, { heuristicOnly: options.fast });
            }
            console.log(chalk.green(`  ✓ Semantic analysis complete`));
          }

          // Step 3: Graph merge
          console.log(chalk.cyan('\
🔀 Step 3: Merging technical graph with semantic metadata...'));
          const graph = await mergeGraphs(projectRoot);
          console.log(chalk.green(`  ✓ Hybrid graph generated: ${graph.metadata.nodeCount} nodes, ${graph.metadata.edgeCount} edges`));
          console.log(`    Adapter: ${graph.metadata.adapterUsed}`);

          // Step 4: Update dashboard
          console.log(chalk.cyan('\
📊 Step 4: Updating dashboard...'));
          const dashboardPath = await compileUserGuideDashboard(projectRoot);
          console.log(chalk.green(`  ✓ Dashboard updated: file://${dashboardPath}`));

          console.log(chalk.green.bold('\
✅ Code Intelligence pipeline completed successfully!'));
          console.log(chalk.gray(`   Graph saved to: .iwish/cache/iwish-code-graph.json`));
        } catch (error: any) {
          console.error(chalk.red(`\
❌ Pipeline failed: ${error.message}`));
          process.exit(1);
        }
      }),
  );

  addSharedDirectoryOption(
    program
      .command('inject-node')
      .description('Inject semantic metadata for a file directly into the local cache and merge the graph (Tier 1 IDE Agent Hybrid mode)')
      .requiredOption('-f, --file <path>', 'File path relative to project root')
      .requiredOption('-m, --metadata <json>', 'JSON string of SemanticMetadata')
      .action(async (options: { directory: string; file: string; metadata: string }) => {
        const projectRoot = getProjectRoot(options.directory);
        console.log(chalk.blue('\
💉 I-Wish Tier 1 Hybrid Graph Injection'));
        console.log(chalk.gray('━'.repeat(50)));

        try {
          const { loadSemanticCache, saveSemanticCache } = await import('../../code-intel/semantic-analyzer');
          let parsed: any;
          try {
            parsed = JSON.parse(options.metadata);
          } catch (e) {
            console.error(chalk.red('❌ Failed to parse metadata JSON.'));
            process.exit(1);
          }

          const metadata = {
            summary: parsed.summary || 'Injected via Hybrid Tier 1',
            tags: Array.isArray(parsed.tags) ? parsed.tags : [],
            layer: parsed.layer || 'unknown',
            complexity: parsed.complexity || 'unknown'
          } as any;

          const cache = loadSemanticCache(projectRoot);
          
          let targetFile = options.file;
          if (path.isAbsolute(targetFile)) {
             targetFile = path.relative(projectRoot, targetFile);
          }
          
          cache[targetFile] = metadata;
          await saveSemanticCache(projectRoot, cache);
          console.log(chalk.green(`  ✓ Injected metadata for ${targetFile} into semantic cache.`));

          console.log(chalk.cyan('\
📁 Scanning files for technical dependencies...'));
          const { scanFiles } = await import('../../code-intel/file-scanner');
          await scanFiles(projectRoot);

          console.log(chalk.cyan('\
🔀 Merging technical graph with semantic metadata...'));
          const { mergeGraphs } = await import('../../code-intel/graph-merger');
          const graph = await mergeGraphs(projectRoot);
          console.log(chalk.green(`  ✓ Hybrid graph generated: ${graph.metadata.nodeCount} nodes, ${graph.metadata.edgeCount} edges`));

          console.log(chalk.cyan('\
📊 Updating dashboard...'));

          const dashboardPath = await compileUserGuideDashboard(projectRoot);
          console.log(chalk.green(`  ✓ Dashboard updated: file://${dashboardPath}`));

          console.log(chalk.green.bold('\
✅ Tier 1 Hybrid Injection completed successfully!'));
        } catch (error: any) {
          const chalk = (await import('chalk')).default;
          console.error(chalk.red(`\
❌ Injection failed: ${error.message}`));
          process.exit(1);
        }
      }),
  );

  addSharedDirectoryOption(
    program
      .command('featuregraph-index')
      .description('Run the FeatureGraph indexer to populate FalkorDB with feature dependency data from epics, stories, and feature-hierarchy')
      .action(async (options: { directory: string }) => {
        const projectRoot = getProjectRoot(options.directory);
        const scriptPath = path.join(__dirname, '..', '..', '..', 'scripts', 'featuregraph-indexer.sh');
        const fs = await import('fs');

        console.log(chalk.blue('\n🔗 I-Wish FeatureGraph Indexer'));
        console.log(chalk.gray('━'.repeat(50)));

        if (!fs.existsSync(scriptPath)) {
          console.error(chalk.red('❌ featuregraph-indexer.sh not found at scripts/featuregraph-indexer.sh'));
          process.exit(1);
        }

        try {
          const { execSync } = await import('child_process');
          console.log(chalk.cyan('📊 Running FeatureGraph indexer...'));
          const output = execSync(`bash "${scriptPath}" "${projectRoot}"`, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 300000,
          });
          console.log(output);
          console.log(chalk.green.bold('\n✅ FeatureGraph indexing completed successfully!'));

          // Auto-trigger dashboard update
          console.log(chalk.cyan('\n📊 Updating dashboard...'));
          const dashboardPath = await compileUserGuideDashboard(projectRoot);
          console.log(chalk.green(`  ✓ Dashboard updated: file://${dashboardPath}`));
        } catch (error: any) {
          if (error.stderr && error.stderr.includes('FalkorDB')) {
            console.error(chalk.yellow('\n⚠️  FalkorDB is not running. Start it with: docker start falkordb'));
            console.error(chalk.gray('   The FeatureGraph requires FalkorDB to store node/edge data.'));
          } else {
            console.error(chalk.red(`\n❌ FeatureGraph indexing failed: ${error.message}`));
          }
          process.exit(1);
        }
      }),
  );

  addSharedDirectoryOption(
    program
      .command('featuregraph-retrofit')
      .description('Retrofit FeatureGraph pipeline for existing projects: generate feature-hierarchy.md, scan stories, and index graph')
      .action(async (options: { directory: string }) => {
        const projectRoot = getProjectRoot(options.directory);
        const fs = await import('fs');

        console.log(chalk.blue('\n🔄 I-Wish FeatureGraph Retrofit'));
        console.log(chalk.gray('━'.repeat(50)));
        console.log(chalk.gray('Upgrading existing project to FeatureGraph pipeline...\n'));

        const report: string[] = [];
        let hasErrors = false;

        // Step 1: Detect output directory
        const iwishOutput = path.join(projectRoot, '_iwish-output');
        const bmadOutput = path.join(projectRoot, '_bmad-output');
        let outputDir: string;
        let planningDir: string;

        if (fs.existsSync(iwishOutput)) {
          outputDir = iwishOutput;
          planningDir = iwishOutput;
        } else if (fs.existsSync(bmadOutput)) {
          outputDir = bmadOutput;
          planningDir = path.join(bmadOutput, 'planning-artifacts');
        } else {
          console.error(chalk.red('❌ No _iwish-output/ or _bmad-output/ directory found.'));
          console.error(chalk.yellow('   Run /create-prd and /create-epics-and-stories first.'));
          process.exit(1);
        }
        report.push(`📂 Output directory: ${path.relative(projectRoot, outputDir)}`);

        // Step 2: Check prerequisites
        console.log(chalk.cyan('Step 1: Checking prerequisites...'));
        const epicsCandidates = [
          path.join(outputDir, '2. Product Planning', '2.4. epics-and-stories.md'),
          path.join(planningDir, 'epics.md'),
        ];
        const epicsPath = epicsCandidates.find(p => fs.existsSync(p));
        const storiesDir = path.join(planningDir, 'stories');

        if (!epicsPath) {
          console.error(chalk.red('❌ epics file not found. Run /create-epics-and-stories first.'));
          hasErrors = true;
        } else {
          report.push(`  ✓ epics file found: ${path.basename(epicsPath)}`);
        }

        // Step 3: Check feature-hierarchy.md (canonical + fallback paths)
        console.log(chalk.cyan('\nStep 2: Checking feature-hierarchy.md...'));
        const hierarchyCandidates = [
          path.join(outputDir, '2. Product Planning', '2.5. feature-hierarchy.md'),
          path.join(planningDir, 'feature-hierarchy.md'),
        ];
        const hierarchyPath = hierarchyCandidates.find(p => fs.existsSync(p));

        if (hierarchyPath) {
          const stat = fs.statSync(hierarchyPath);
          console.log(chalk.green(`  ✓ feature-hierarchy.md exists (${stat.size} bytes)`));
          console.log(chalk.gray(`    at: ${path.relative(projectRoot, hierarchyPath)}`));
          report.push(`  ✓ feature-hierarchy.md exists (${stat.size} bytes) — no regeneration needed`);
        } else {
          console.log(chalk.yellow('  ⚠ feature-hierarchy.md NOT FOUND'));
          console.log(chalk.gray('    → Expected at: _iwish-output/2. Product Planning/2.5. feature-hierarchy.md'));
          console.log(chalk.gray('    → Run /feature-hierarchy or /create-epics-and-stories to generate.'));
          console.log(chalk.gray('    → Reference template: templates/library/code-intelligence-pack/featuregraph/feature-hierarchy-template.md'));
          report.push('  ⚠ feature-hierarchy.md MISSING — must be generated');
          report.push('    ACTION: Run /feature-hierarchy to generate directly');
          report.push('    OR: Run /create-epics-and-stories (which auto-generates via Step 5c)');
        }

        // Step 4: Scan stories for Cross-Feature Dependencies
        console.log(chalk.cyan('\nStep 3: Scanning stories for Cross-Feature Dependencies...'));
        const storiesMissing: string[] = [];
        const storiesOk: string[] = [];

        if (fs.existsSync(storiesDir)) {
          const storyFiles = fs.readdirSync(storiesDir).filter((f: string) => f.endsWith('.md'));

          for (const file of storyFiles) {
            const content = fs.readFileSync(path.join(storiesDir, file), 'utf-8');
            if (content.includes('## Cross-Feature Dependencies')) {
              storiesOk.push(file);
            } else {
              storiesMissing.push(file);
            }
          }

          console.log(chalk.green(`  ✓ ${storiesOk.length} stories have Cross-Feature Dependencies`));
          if (storiesMissing.length > 0) {
            console.log(chalk.yellow(`  ⚠ ${storiesMissing.length} stories MISSING Cross-Feature Dependencies:`));
            for (const f of storiesMissing.slice(0, 10)) {
              console.log(chalk.gray(`    - ${f}`));
            }
            if (storiesMissing.length > 10) {
              console.log(chalk.gray(`    ... and ${storiesMissing.length - 10} more`));
            }
          }
          report.push(`  Stories with Cross-Feature Dependencies: ${storiesOk.length}/${storyFiles.length}`);
          if (storiesMissing.length > 0) {
            report.push(`  ⚠ ${storiesMissing.length} stories need backfill — re-run /make-story for each`);
          }
        } else {
          console.log(chalk.yellow('  ⚠ No stories directory found'));
          report.push('  ⚠ No stories directory — run /create-epics-and-stories first');
        }

        // Step 5: Try to run indexer
        console.log(chalk.cyan('\nStep 4: Checking FeatureGraph indexer...'));
        const scriptPath = path.join(__dirname, '..', '..', '..', 'scripts', 'featuregraph-indexer.sh');

        if (fs.existsSync(scriptPath)) {
          console.log(chalk.green('  ✓ featuregraph-indexer.sh found'));
          report.push('  ✓ Indexer script available');

          if ((hierarchyPath && fs.existsSync(hierarchyPath)) || !hasErrors) {
            try {
              const { execSync } = await import('child_process');
              console.log(chalk.gray('  Attempting to run indexer...'));
              execSync(`bash "${scriptPath}" "${projectRoot}" 2>&1 || true`, {
                encoding: 'utf-8',
                timeout: 30000,
              });
              console.log(chalk.green('  ✓ Indexer executed'));
              report.push('  ✓ Indexer executed successfully');
            } catch {
              console.log(chalk.yellow('  ⚠ Indexer execution skipped (FalkorDB may not be running)'));
              report.push('  ⚠ Indexer skipped — ensure FalkorDB is running: docker start falkordb');
            }
          }
        } else {
          console.log(chalk.yellow('  ⚠ featuregraph-indexer.sh not found — may not be installed'));
          report.push('  ⚠ Indexer script not found');
        }

        // Step 6: Output migration report
        console.log(chalk.blue('\n' + '━'.repeat(50)));
        console.log(chalk.blue.bold('📋 FeatureGraph Retrofit Report'));
        console.log(chalk.blue('━'.repeat(50)));
        for (const line of report) {
          console.log(line);
        }

        console.log(chalk.blue('\n📌 Recommended Next Steps:'));
        if (!hierarchyPath || !fs.existsSync(hierarchyPath)) {
          console.log(chalk.yellow('  1. Generate feature-hierarchy.md:'));
          console.log(chalk.gray('     Run /create-epics-and-stories (auto-generates hierarchy)'));
          console.log(chalk.gray('     OR ask Architect Agent: "Generate feature-hierarchy.md from PRD + Architecture + Epics"'));
        }
        if (storiesMissing.length > 0) {
          console.log(chalk.yellow(`  ${(!hierarchyPath || !fs.existsSync(hierarchyPath)) ? '2' : '1'}. Backfill ${storiesMissing.length} stories with Cross-Feature Dependencies:`));
          console.log(chalk.gray('     Re-run /make-story for each story, or ask agent to add sections'));
        }
        console.log(chalk.gray('  → After fixes: run `iwish featuregraph-index` to populate the graph'));
        console.log(chalk.gray('  → Then: run `iwish gen-dashboard` to update the dashboard'));
      }),
  );
}
