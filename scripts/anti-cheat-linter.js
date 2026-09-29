import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Anti-Cheat Linter
 * Scans git diff and modified files for:
 *   1. High commented-out code ratios (> 25% of new lines)
 *   2. Mock stubs (empty returns, TODO exceptions)
 *   3. Missing tests for new source files
 */

const COMMENT_RATIO_THRESHOLD = 0.25;

function runCmd(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (err) {
    // If command fails, return empty string (e.g. no diff)
    return '';
  }
}

function getTestDirs() {
  const defaultDirs = ['tests', join('_iwish-output', 'iwish-skills', 'tests')];
  try {
    if (existsSync('.iwishrc')) {
      const config = JSON.parse(readFileSync('.iwishrc', 'utf8'));
      if (config.testDirs && Array.isArray(config.testDirs)) {
        return config.testDirs;
      }
    }
  } catch (err) {
    // Ignore error, fallback to defaults
  }
  return defaultDirs;
}

function scanForMockStubs(filePath, content) {
  const issues = [];
  
  // Pattern 1: Empty object returns
  const emptyObjectRegex = new RegExp('return\\s*\\{\\s*\\}', 'g');
  let match;
  while ((match = emptyObjectRegex.exec(content)) !== null) {
    // Find line number
    const lineNum = content.substring(0, match.index).split('\n').length;
    issues.push({
      file: filePath,
      line: lineNum,
      type: 'MOCK_STUB',
      pattern: 'return ' + '{}',
      message: 'Empty object mock return detected. Implement actual business logic.'
    });
  }

  // Pattern 2: Empty array returns in business functions
  const emptyArrayRegex = new RegExp('return\\s*\\[\\s*\\]', 'g');
  while ((match = emptyArrayRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    // Only flag if it looks like a lazy stub (heuristic)
    issues.push({
      file: filePath,
      line: lineNum,
      type: 'MOCK_STUB',
      pattern: 'return ' + '[]',
      message: 'Empty array mock return detected. Verify if this is a lazy stub.'
    });
  }

  // Pattern 3: TODO throws or comments in critical paths
  const todoThrowRegex = new RegExp('throw\\s*new\\s*Error\\(\\s*[\'"](TODO|todo|implement|not implemented)[\'"]\\s*\\)', 'gi');
  while ((match = todoThrowRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    issues.push({
      file: filePath,
      line: lineNum,
      type: 'TODO_THROW',
      pattern: match[0],
      message: 'Unimplemented placeholder error thrown.'
    });
  }

  // Pattern 4: Skipped test cases
  const skippedTestRegex = /(describe|it|test)\.skip/g;
  while ((match = skippedTestRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    issues.push({
      file: filePath,
      line: lineNum,
      type: 'SKIPPED_TEST',
      pattern: match[0],
      message: 'Skipped test case detected. All tests must execute successfully.'
    });
  }

  return issues;
}

function analyzeGitDiff() {
  const issues = [];
  
  // 1. Get list of modified/added JS and TS files
  const statusOutput = runCmd('git status --porcelain');
  const modifiedFiles = [];
  
  if (statusOutput) {
    const lines = statusOutput.split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const status = parts[0];
        const filePath = parts[1];
        if (
          (filePath.endsWith('.js') || filePath.endsWith('.ts') || filePath.endsWith('.tsx')) &&
          !filePath.includes('node_modules') &&
          !filePath.includes('dist') &&
          !filePath.includes('tests/') &&
          !filePath.includes('test-')
        ) {
          modifiedFiles.push({ filePath, isNew: status === 'A' || status === '??' });
        }
      }
    }
  }

  if (modifiedFiles.length === 0) {
    console.log('✅ No source files modified or added. Anti-cheat checks passed.');
    return { passed: true, issues: [] };
  }

  console.log(`🔍 Anti-Cheat Linter: Scanning ${modifiedFiles.length} modified source file(s)...`);

  // 2. Check for missing tests
  for (const file of modifiedFiles) {
    if (file.isNew) {
      // Look for a corresponding test file
      const fileName = file.filePath.split('/').pop();
      const baseName = fileName.replace(/\.(js|ts|tsx)$/, '');
      const testDirs = getTestDirs();
      const potentialTestPaths = [
        join(file.filePath.replace(fileName, ''), 'tests', `test-${baseName}.js`),
        join(file.filePath.replace(fileName, ''), `test-${baseName}.js`)
      ];
      
      for (const dir of testDirs) {
        potentialTestPaths.push(join(dir, `test-${baseName}.js`));
        potentialTestPaths.push(join(dir, `test-${baseName}.ts`));
      }
      
      let testExists = false;
      for (const testPath of potentialTestPaths) {
        if (existsSync(testPath)) {
          testExists = true;
          break;
        }
      }

      if (!testExists) {
        issues.push({
          file: file.filePath,
          line: 1,
          type: 'MISSING_TEST',
          message: `New source file added but no corresponding test file found (e.g. test-${baseName}.js).`
        });
      }
    }

    // 3. Scan file content for mock stubs
    try {
      const content = readFileSync(file.filePath, 'utf8');
      const fileIssues = scanForMockStubs(file.filePath, content);
      issues.push(...fileIssues);
    } catch (err) {
      console.warn(`⚠️ Could not read file content for ${file.filePath}: ${err.message}`);
    }
  }

  // 4. Check Comment-Out code ratio on Git Diff
  // Compare number of added comment lines vs total added lines
  const diffOutput = runCmd('git diff -U0 HEAD');
  if (diffOutput) {
    let totalAddedLines = 0;
    let addedCommentLines = 0;
    
    const diffLines = diffOutput.split('\n');
    for (const line of diffLines) {
      // Only check added lines
      if (line.startsWith('+') && !line.startsWith('+++')) {
        const content = line.substring(1).trim();
        if (content.length === 0) continue;
        
        totalAddedLines++;
        
        // Match standard single-line comment or block comment starts/lines
        if (content.startsWith('//') || content.startsWith('*') || content.startsWith('/*')) {
          addedCommentLines++;
        }
      }
    }

    if (totalAddedLines > 10) {
      const ratio = addedCommentLines / totalAddedLines;
      if (ratio > COMMENT_RATIO_THRESHOLD) {
        issues.push({
          file: 'git-diff',
          line: 0,
          type: 'HIGH_COMMENT_RATIO',
          message: `High commented-out code ratio detected (${(ratio * 100).toFixed(1)}% of new lines are comments, threshold is ${(COMMENT_RATIO_THRESHOLD * 100).toFixed(0)}%). Avoid disabling code to bypass checks.`
        });
      }
    }
  }

  const passed = issues.length === 0;
  return { passed, issues };
}

function main() {
  const result = analyzeGitDiff();
  
  if (!result.passed) {
    console.error('\n🛑 ANTI-CHEAT AUDIT FAILED! Potential phantom implementation detected:\n');
    for (const issue of result.issues) {
      const location = issue.line > 0 ? `${issue.file}:${issue.line}` : issue.file;
      console.error(`  [${issue.type}] at ${location}`);
      console.error(`    Description: ${issue.message}`);
      if (issue.pattern) {
        console.error(`    Pattern:    "${issue.pattern}"`);
      }
      console.error('');
    }
    process.exit(1);
  } else {
    console.log('✅ Anti-cheat audit passed successfully. No cheat patterns detected.');
    process.exit(0);
  }
}

// Check if run directly
const currentFileUrl = import.meta.url;
const executedFileUrl = process.argv[1]
  ? new URL(`file://${process.argv[1]}`).href
  : '';

if (currentFileUrl === executedFileUrl) {
  main();
}
