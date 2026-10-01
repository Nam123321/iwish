import { SyntaxKind } from 'ts-morph';
import { loadSourceFile, hasBypassComment, getAllFiles } from './utils.js';

const TARGET_DIRS = ['apps/api/src', 'src/backend', 'src/worker-node'];

let hasError = false;

for (const dir of TARGET_DIRS) {
  const files = getAllFiles(dir);
  for (const file of files) {
    if (file.includes('.test.ts') || file.includes('.spec.ts')) continue;
    
    const sourceFile = loadSourceFile(file);
    if (!sourceFile) continue;

    // Check for 'as any'
    const asExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.AsExpression);
    for (const expr of asExpressions) {
      if (expr.getTypeNode()?.getText() === 'any') {
        const line = expr.getStartLineNumber();
        if (hasBypassComment(sourceFile, line)) continue;
        console.error(`[TYPE SAFETY] Forbidden 'as any' in ${file}:${line}`);
        hasError = true;
      }
    }

    // Check for @ts-ignore or eslint-disable
    const fullText = sourceFile.getFullText();
    const lines = fullText.split('\n');
    lines.forEach((lineText, index) => {
      const line = index + 1;
      if (hasBypassComment(sourceFile, line)) return;
      if (lineText.includes('@ts-ignore')) {
        console.error(`[TYPE SAFETY] Forbidden @ts-ignore in ${file}:${line}`);
        hasError = true;
      }
      if (lineText.includes('eslint-disable') && lineText.includes('@typescript-eslint/no-explicit-any')) {
        console.error(`[TYPE SAFETY] Forbidden eslint-disable no-explicit-any in ${file}:${line}`);
        hasError = true;
      }
    });
  }
}

if (hasError) process.exit(1);
