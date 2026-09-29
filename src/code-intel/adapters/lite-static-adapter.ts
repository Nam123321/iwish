import * as fs from 'fs-extra';
import * as path from 'path';
import { CodeGraphAdapter, TechNode, TechEdge, TechnicalGraphResult } from './adapter-interface';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

const DEFAULT_IGNORE = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  '.turbo',
  '__pycache__',
]);

import { limitConcurrency } from '../file-scanner';

export class LiteStaticAdapter implements CodeGraphAdapter {
  public readonly adapterName = 'lite-static';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async queryTechnicalGraph(projectRoot: string): Promise<TechnicalGraphResult> {
    const files = await this.enumerateSourceFilesAsync(projectRoot);
    const nodes: TechNode[] = [];
    const edges: TechEdge[] = [];
    const fileSet = new Set(files);

    await limitConcurrency(files, 30, async (filePath) => {
      const relativePath = path.relative(projectRoot, filePath);
      const nodeId = relativePath;

      nodes.push({
        id: nodeId,
        label: path.basename(filePath),
        path: relativePath,
        type: 'file',
      });

      const content = await this.readFileSafeAsync(filePath);
      if (!content) {
        return;
      }

      const importedPaths = this.parseImports(content);
      for (const importPath of importedPaths) {
        const resolved = this.resolveImportPath(filePath, importPath, projectRoot, fileSet);
        if (resolved) {
          const targetId = path.relative(projectRoot, resolved);
          edges.push({
            from: nodeId,
            to: targetId,
            type: 'imports',
            label: importPath,
          });
        }
      }
    });

    return { nodes, edges };
  }

  private async enumerateSourceFilesAsync(projectRoot: string): Promise<string[]> {
    const files: string[] = [];
    const visit = async (directory: string) => {
      let entries: fs.Dirent[];
      try {
        entries = (await fs.readdir(directory, { withFileTypes: true })) as fs.Dirent[];
      } catch {
        return;
      }
      const promises = entries.map(async (entry) => {
        if (DEFAULT_IGNORE.has(entry.name)) {
          return;
        }
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          await visit(fullPath);
        } else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
          files.push(fullPath);
        }
      });
      await Promise.all(promises);
    };
    await visit(projectRoot);
    return files;
  }

  private async readFileSafeAsync(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch {
      return null;
    }
  }


  private parseImports(content: string): string[] {
    const results: string[] = [];

    // Match: import ... from '...' / import '...'
    const esImportRegex = /(?:import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"])/g;
    let match: RegExpExecArray | null;
    while ((match = esImportRegex.exec(content)) !== null) {
      if (match[1]) {
        results.push(match[1]);
      }
    }

    // Match: require('...')
    const requireRegex = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      results.push(match[1]);
    }

    // Match: export ... from '...'
    const reExportRegex = /export\s+(?:\{[^}]*\}|\*)\s+from\s+['"]([^'"]+)['"]/g;
    while ((match = reExportRegex.exec(content)) !== null) {
      results.push(match[1]);
    }

    return results;
  }

  private resolveImportPath(
    sourceFile: string,
    importPath: string,
    projectRoot: string,
    fileSet: Set<string>,
  ): string | null {
    // Skip external (node_modules) imports
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      return null;
    }

    const sourceDir = path.dirname(sourceFile);
    const basePath = path.resolve(sourceDir, importPath);

    // Try exact match
    if (fileSet.has(basePath)) {
      return basePath;
    }

    // Try with extensions
    for (const ext of SOURCE_EXTENSIONS) {
      const withExt = basePath + ext;
      if (fileSet.has(withExt)) {
        return withExt;
      }
    }

    // Try index files
    for (const ext of SOURCE_EXTENSIONS) {
      const indexPath = path.join(basePath, `index${ext}`);
      if (fileSet.has(indexPath)) {
        return indexPath;
      }
    }

    return null;
  }
}
