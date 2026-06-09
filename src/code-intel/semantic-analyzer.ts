import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { LLMFactory } from './llm/llm-factory';

export type SemanticMetadata = {
  summary: string;
  tags: string[];
  layer: 'presentation' | 'business' | 'data' | 'infrastructure' | 'config' | 'unknown';
  complexity: 'low' | 'medium' | 'high' | 'unknown';
};

export type AnalysisResult = {
  path: string;
  metadata: SemanticMetadata;
  status: 'success' | 'failed' | 'skipped';
};

const PROMPT_TEMPLATE_PATH = path.join(__dirname, 'prompts', 'file-analysis.md');

const LAYER_HINTS: Record<string, SemanticMetadata['layer']> = {
  'component': 'presentation',
  'components': 'presentation',
  'view': 'presentation',
  'views': 'presentation',
  'pages': 'presentation',
  'page': 'presentation',
  'ui': 'presentation',
  'styles': 'presentation',
  'service': 'business',
  'services': 'business',
  'logic': 'business',
  'domain': 'business',
  'use-case': 'business',
  'usecases': 'business',
  'model': 'data',
  'models': 'data',
  'schema': 'data',
  'schemas': 'data',
  'migration': 'data',
  'migrations': 'data',
  'repository': 'data',
  'repositories': 'data',
  'prisma': 'data',
  'infra': 'infrastructure',
  'infrastructure': 'infrastructure',
  'deploy': 'infrastructure',
  'ci': 'infrastructure',
  'docker': 'infrastructure',
  'scripts': 'infrastructure',
  'config': 'config',
  'configs': 'config',
  'constants': 'config',
  'env': 'config',
};

const EXTENSION_TAGS: Record<string, string[]> = {
  '.ts': ['typescript'],
  '.tsx': ['typescript', 'react'],
  '.js': ['javascript'],
  '.jsx': ['javascript', 'react'],
  '.css': ['styles'],
  '.scss': ['styles', 'sass'],
  '.html': ['markup'],
  '.json': ['config', 'data'],
  '.yaml': ['config'],
  '.yml': ['config'],
  '.md': ['documentation'],
  '.sql': ['database'],
  '.prisma': ['database', 'orm'],
};

function inferLayer(filePath: string): SemanticMetadata['layer'] {
  const segments = filePath.split(path.sep).map((s) => s.toLowerCase());
  for (const segment of segments) {
    if (LAYER_HINTS[segment]) {
      return LAYER_HINTS[segment];
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  if (['.css', '.scss', '.less', '.html'].includes(ext)) {
    return 'presentation';
  }
  if (['.json', '.yaml', '.yml', '.env', '.toml'].includes(ext)) {
    return 'config';
  }
  if (['.sql', '.prisma'].includes(ext)) {
    return 'data';
  }
  if (['Dockerfile', 'Makefile'].includes(path.basename(filePath))) {
    return 'infrastructure';
  }

  return 'unknown';
}

function inferComplexity(content: string): SemanticMetadata['complexity'] {
  const lines = content.split('\n').length;
  if (lines < 30) {
    return 'low';
  }
  if (lines < 150) {
    return 'medium';
  }
  return 'high';
}

function inferTags(filePath: string): string[] {
  const ext = path.extname(filePath).toLowerCase();
  const tags = EXTENSION_TAGS[ext] ? [...EXTENSION_TAGS[ext]] : [];

  const basename = path.basename(filePath, ext).toLowerCase();
  if (basename.includes('test') || basename.includes('spec')) {
    tags.push('test');
  }
  if (basename.includes('util') || basename.includes('helper')) {
    tags.push('utility');
  }
  if (basename.includes('index')) {
    tags.push('barrel');
  }

  return tags;
}

function generateStubMetadata(filePath: string, content: string): SemanticMetadata {
  const basename = path.basename(filePath);
  const layer = inferLayer(filePath);
  const complexity = inferComplexity(content);
  const tags = inferTags(filePath);

  return {
    summary: `Source file: ${basename}`,
    tags,
    layer,
    complexity,
  };
}

export function extractFileContext(filePath: string, content: string): { imports: string[]; exports: string[] } {
  const imports: string[] = [];
  const exports: string[] = [];

  const importRegex = /^(?:import\s+(?:(?:[\w*{}\s,]+)\s+from\s+)?['"]([^'"]+)['"]|(?:const|let|var)\s+\w+\s*=\s*require\(['"]([^'"]+)['"]\))/gm;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1] || match[2]);
  }

  const exportRegex = /^export\s+(?:default\s+)?(?:function|class|const|let|var|type|interface|enum)\s+(\w+)/gm;
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }

  const reExportRegex = /^export\s+(?:\{[^}]*\}|\*)\s+from\s+['"]([^'"]+)['"]/gm;
  while ((match = reExportRegex.exec(content)) !== null) {
    exports.push(`re-export:${match[1]}`);
  }

  return { imports, exports };
}

export function buildPrompt(fileName: string, content: string, context: { imports: string[]; exports: string[] }): string {
  let template: string;
  try {
    template = fs.readFileSync(PROMPT_TEMPLATE_PATH, 'utf8');
  } catch {
    // Fallback inline prompt if template file is missing
    template = [
      'Analyze the file {{FILE_NAME}}.',
      '```\n{{FILE_CONTENT}}\n```',
      'Imports: {{IMPORTS}}',
      'Exports: {{EXPORTS}}',
      'Return JSON with: summary, tags, layer, complexity.',
    ].join('\n\n');
  }

  return template
    .replace('{{FILE_NAME}}', fileName)
    .replace('{{FILE_CONTENT}}', content)
    .replace('{{IMPORTS}}', context.imports.length > 0 ? context.imports.join(', ') : 'None detected')
    .replace('{{EXPORTS}}', context.exports.length > 0 ? context.exports.join(', ') : 'None detected');
}

function getSemanticCachePath(projectRoot: string): string {
  return path.join(projectRoot, '.iwish', 'cache', 'semantic-metadata.json');
}

export function loadSemanticCache(projectRoot: string): Record<string, SemanticMetadata> {
  const cachePath = getSemanticCachePath(projectRoot);
  if (!fs.existsSync(cachePath)) {
    return {};
  }
  try {
    return fs.readJsonSync(cachePath) as Record<string, SemanticMetadata>;
  } catch {
    return {};
  }
}

export async function saveSemanticCache(projectRoot: string, cache: Record<string, SemanticMetadata>): Promise<void> {
  const cachePath = getSemanticCachePath(projectRoot);
  await fs.ensureDir(path.dirname(cachePath));
  await fs.writeJson(cachePath, cache, { spaces: 2 });
}

export async function analyzeBatch(projectRoot: string, files: string[]): Promise<AnalysisResult[]> {
  const cache = loadSemanticCache(projectRoot);
  const results: AnalysisResult[] = [];

  let provider;
  try {
    provider = LLMFactory.getProvider(projectRoot);
  } catch (e: any) {
    console.warn(chalk.yellow(`[semantic-analyzer] ${e.message}. Falling back to STUB metadata.`));
    provider = null;
  }

  const BATCH_SIZE = 5;
  const DELAY_MS = 2000;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batchFiles = files.slice(i, i + BATCH_SIZE);

    const batchPromises = batchFiles.map(async (filePath) => {
      const fullPath = path.resolve(projectRoot, filePath);

      if (!fs.existsSync(fullPath)) {
        return {
          path: filePath,
          metadata: { summary: '', tags: [], layer: 'unknown', complexity: 'unknown' } as SemanticMetadata,
          status: 'skipped' as const,
        };
      }

      try {
        const content = await fs.readFile(fullPath, 'utf8');
        const context = extractFileContext(filePath, content);
        const prompt = buildPrompt(path.basename(filePath), content, context);

        let metadata: SemanticMetadata;
        if (provider) {
          try {
            metadata = await provider.analyzeSemantic(prompt);
          } catch (llmErr) {
            console.warn(chalk.yellow(`[semantic-analyzer] LLM Error on ${filePath}: ${llmErr instanceof Error ? llmErr.message : String(llmErr)}`));
            metadata = generateStubMetadata(filePath, content);
          }
        } else {
          metadata = generateStubMetadata(filePath, content);
        }

        cache[filePath] = metadata;
        // Save immediately to avoid losing results if it crashes midway
        await saveSemanticCache(projectRoot, cache);

        return { path: filePath, metadata, status: 'success' as const };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(chalk.yellow(`[semantic-analyzer] Failed to analyze ${filePath}: ${message}`));
        return {
          path: filePath,
          metadata: { summary: '', tags: [], layer: 'unknown', complexity: 'unknown' } as SemanticMetadata,
          status: 'failed' as const,
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Apply delay between batches if using LLM
    if (provider && i + BATCH_SIZE < files.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  return results;
}
