import { SyntaxKind, CallExpression } from 'ts-morph';
import { loadSourceFile, hasBypassComment, getAllFiles } from './utils.js';

const TARGET_DIRS = ['apps/api/src', 'src/backend/plugins', 'src/backend/routes'];

let hasError = false;

for (const dir of TARGET_DIRS) {
  const files = getAllFiles(dir);
  for (const file of files) {
    if (file.includes('.test.ts') || file.includes('.spec.ts')) continue;
    
    const sourceFile = loadSourceFile(file);
    if (!sourceFile) continue;

    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const callExpr of callExpressions) {
      const expression = callExpr.getExpression();
      const text = expression.getText();
      
      // Look for fastify.get, fastify.post, etc.
      if (text.match(/fastify\.(get|post|put|patch|delete)/) || text.match(/server\.(get|post|put|patch|delete)/)) {
        const line = callExpr.getStartLineNumber();
        if (hasBypassComment(sourceFile, line)) continue;

        // Check arguments for schema
        let hasSchema = false;
        const args = callExpr.getArguments();
        for (const arg of args) {
          if (arg.getKind() === SyntaxKind.ObjectLiteralExpression) {
            const properties = arg.getDescendantsOfKind(SyntaxKind.PropertyAssignment);
            for (const prop of properties) {
              if (prop.getName() === 'schema') {
                hasSchema = true;
                break;
              }
            }
          }
        }

        if (!hasSchema) {
          console.error(`[API CONTRACT] Missing Fastify schema in ${file}:${line}`);
          hasError = true;
        }
      }
    }
  }
}

if (hasError) process.exit(1);
