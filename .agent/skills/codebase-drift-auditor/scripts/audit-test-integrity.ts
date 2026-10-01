import { SyntaxKind, CallExpression } from 'ts-morph';
import { loadSourceFile, hasBypassComment, getAllFiles } from './utils.js';

const TARGET_DIRS = ['apps/api/src', 'src/backend', 'src/worker-node'];

let hasError = false;

for (const dir of TARGET_DIRS) {
  const files = getAllFiles(dir);
  for (const file of files) {
    if (!file.includes('.test.ts') && !file.includes('.spec.ts')) continue;

    const sourceFile = loadSourceFile(file);
    if (!sourceFile) continue;

    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const callExpr of callExpressions) {
      const exprText = callExpr.getExpression().getText();
      
      if (exprText === 'it' || exprText === 'test') {
        const line = callExpr.getStartLineNumber();
        if (hasBypassComment(sourceFile, line)) continue;

        // Check if there's any 'expect' inside the test block
        let hasExpect = false;
        let hasDummyExpect = false;
        
        const testBlockCallExprs = callExpr.getDescendantsOfKind(SyntaxKind.CallExpression);
        for (const innerCall of testBlockCallExprs) {
          if (innerCall.getExpression().getText() === 'expect') {
            hasExpect = true;
            if (innerCall.getText().startsWith('expect(true)')) {
              hasDummyExpect = true;
            }
          }
        }

        if (!hasExpect) {
          console.error(`[TEST INTEGRITY] Test block has no 'expect' assertions in ${file}:${line}`);
          hasError = true;
        } else if (hasDummyExpect) {
          console.error(`[TEST INTEGRITY] Test block has dummy 'expect(true)' assertion in ${file}:${line}`);
          hasError = true;
        }
      }
    }
  }
}

if (hasError) process.exit(1);
