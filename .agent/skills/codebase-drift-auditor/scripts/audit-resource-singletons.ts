import { SyntaxKind } from 'ts-morph';
import { loadSourceFile, hasBypassComment, getAllFiles } from './utils.js';

const TARGET_DIRS = ['apps/api/src', 'src/backend', 'src/worker-node'];
const ALLOWED_FILES = ['lib/prisma.ts', 'lib/redis.ts', 'db.ts', 'redis.ts'];

let hasError = false;

for (const dir of TARGET_DIRS) {
  const files = getAllFiles(dir);
  for (const file of files) {
    if (ALLOWED_FILES.some(allowed => file.endsWith(allowed))) continue;

    const sourceFile = loadSourceFile(file);
    if (!sourceFile) continue;

    const newExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.NewExpression);
    for (const expr of newExpressions) {
      const typeName = expr.getExpression().getText();
      
      if (typeName === 'PrismaClient' || typeName === 'Redis') {
        const line = expr.getStartLineNumber();
        if (hasBypassComment(sourceFile, line)) continue;
        console.error(`[RESOURCE SINGLETON] Illegal instantiation of ${typeName} outside of config file in ${file}:${line}`);
        hasError = true;
      }
    }
  }
}

if (hasError) process.exit(1);
