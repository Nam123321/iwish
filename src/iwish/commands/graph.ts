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
}
