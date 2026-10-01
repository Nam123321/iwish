import { SyntaxKind } from 'ts-morph';
import { loadSourceFile, hasBypassComment, getAllFiles } from './utils.js';
import * as path from 'path';

const TARGET_DIRS = ['apps/api/src', 'src/worker-node', 'packages/backend/src'];

let hasError = false;

for (const dir of TARGET_DIRS) {
  const files = getAllFiles(dir);
  for (const file of files) {
    const sourceFile = loadSourceFile(file);
    if (!sourceFile) continue;

    const imports = sourceFile.getDescendantsOfKind(SyntaxKind.ImportDeclaration);
    for (const imp of imports) {
      const moduleSpecifier = imp.getModuleSpecifierValue();
      if (!moduleSpecifier.startsWith('.')) continue; // Not a relative import

      const line = imp.getStartLineNumber();
      if (hasBypassComment(sourceFile, line)) continue;

      // Check if relative import escapes the package's root 'src' directory
      const absoluteImportPath = path.resolve(path.dirname(file), moduleSpecifier);
      const packageRootSrc = path.resolve(process.cwd(), dir.split('/src')[0] + '/src');
      
      if (!absoluteImportPath.startsWith(packageRootSrc)) {
        console.error(`[MONOREPO BOUNDARY] Cross-boundary import detected in ${file}:${line} -> ${moduleSpecifier}`);
        hasError = true;
      }
    }
  }
}

if (hasError) process.exit(1);
