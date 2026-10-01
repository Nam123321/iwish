import { Project, ScriptKind, SourceFile } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

// Memory efficient project without type checking
const project = new Project({ skipAddingFilesFromTsConfig: true });

export function loadSourceFile(filePath: string): SourceFile | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return project.createSourceFile(filePath, content, { overwrite: true, scriptKind: ScriptKind.TS });
  } catch (err) {
    return null;
  }
}

export function hasBypassComment(sourceFile: SourceFile, lineNumber: number): boolean {
  const lines = sourceFile.getFullText().split('\n');
  const targetLine = lines[lineNumber - 1] || '';
  const previousLine = lines[lineNumber - 2] || '';
  return targetLine.includes('@iwish-disable-audit') || previousLine.includes('@iwish-disable-audit');
}

export function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  
  const files = fs.readdirSync(dirPath);

  files.forEach(function (file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}
