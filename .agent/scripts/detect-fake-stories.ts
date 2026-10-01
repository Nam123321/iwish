import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import * as yaml from 'yaml';

interface Story {
  id: string;
  epicId: string;
  status: string;
  filePath: string;
}

function findCompletedStories(): Story[] {
  const stories: Story[] = [];
  const searchDir = path.join(process.cwd(), '_iwish-output');

  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (file === 'story.md' || file.startsWith('story-')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const matchId = fullPath.match(/Story-([0-9.]+)\/story\.md/i) || fullPath.match(/story-([0-9.]+)\.md/i) || content.match(/Story\s*([0-9.]+)/i);
        const matchStatus = content.match(/status:\s*([a-zA-Z-]+)/i);
        
        if (matchId && matchStatus && matchStatus[1].toLowerCase() === 'completed') {
          // extract epic ID from story ID (e.g. 45.1 -> 45)
          const epicId = matchId[1].split('.')[0];
          stories.push({
            id: matchId[1],
            epicId,
            status: matchStatus[1].toLowerCase(),
            filePath: fullPath
          });
        }
      }
    }
  }

  scanDir(searchDir);
  
  // Deduplicate by ID
  const uniqueStories = new Map<string, Story>();
  for (const s of stories) {
    uniqueStories.set(s.id, s);
  }
  return Array.from(uniqueStories.values());
}

function hasExecutableLogic(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  
  const sourceCode = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  let executableStatementsCount = 0;

  function visit(node: ts.Node) {
    if (
      ts.isExpressionStatement(node) ||
      ts.isVariableStatement(node) ||
      ts.isReturnStatement(node) ||
      ts.isIfStatement(node) ||
      ts.isForStatement(node) ||
      ts.isForOfStatement(node) ||
      ts.isForInStatement(node) ||
      ts.isWhileStatement(node) ||
      ts.isSwitchStatement(node) ||
      ts.isThrowStatement(node)
    ) {
      executableStatementsCount++;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return executableStatementsCount > 0;
}

function runAudit() {
  console.log('Scanning for completed stories...');
  const stories = findCompletedStories();
  console.log(`Found ${stories.length} completed stories.`);

  const reportLines: string[] = [
    '# Fake Stories Audit Report',
    '',
    '| Story ID | Status | Verdict | Reason |',
    '|---|---|---|---|'
  ];

  let fakeCount = 0;

  for (const story of stories) {
    // UADRG Evidence Graph Check (Solution 1)
    const storyDir = path.dirname(story.filePath);
    if (fs.existsSync(path.join(storyDir, 'pipeline-evidence-graph.json')) || 
        fs.existsSync(path.join(storyDir, 'pipeline-evidence-delivery.json'))) {
      reportLines.push(`| **${story.id}** | ${story.status} | ✅ VALID | Validated via UADRG Evidence Graph. |`);
      continue;
    }

    // Escape dot
    const escapedId = story.id.replace(/\./g, '\\.');
    // Run git log with PCRE negative lookarounds
    let gitOutput = '';
    try {
      gitOutput = execSync(`git log --name-only --all -P --grep="(?<![\\d.])${escapedId}(?![\\d.])"`, { encoding: 'utf8' }).toString();
    } catch (e) {
      // If git fails or no commits, gitOutput is empty
    }

    if (!gitOutput.trim()) {
      reportLines.push(`| **${story.id}** | ${story.status} | 🔴 FAKE | 0 commits found for this story ID. |`);
      fakeCount++;
      continue;
    }

    // Extract changed files
    const lines = gitOutput.split('\n');
    const changedFiles = lines.filter(l => l.trim() && !l.startsWith('commit ') && !l.startsWith('Author:') && !l.startsWith('Date:') && !l.startsWith(' '));
    
    // Deduplicate files
    const uniqueFiles = Array.from(new Set(changedFiles));
    
    const isDocOnly = uniqueFiles.every(f => f.endsWith('.md') || f.endsWith('.json') || f.endsWith('.yaml') || f.endsWith('.yml'));
    
    if (isDocOnly) {
      reportLines.push(`| **${story.id}** | ${story.status} | 🔴 FAKE | Commits only contain documentation/config files. |`);
      fakeCount++;
      continue;
    }

    // Check for polyglot AST evasion
    const nonTsFunctionalFiles = uniqueFiles.filter(f => !f.endsWith('.ts') && !f.endsWith('.tsx') && !f.endsWith('.js') && !f.endsWith('.jsx') && !f.endsWith('.md') && !f.endsWith('.json') && !f.endsWith('.yaml') && !f.endsWith('.yml'));
    if (nonTsFunctionalFiles.length > 0) {
      reportLines.push(`| **${story.id}** | ${story.status} | 🟡 REVIEW | Polyglot files modified (${nonTsFunctionalFiles[0]}). Requires manual AST review. |`);
      continue;
    }

    // Parse TS/JS files
    const tsFiles = uniqueFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'));
    let hasLogic = false;
    for (const f of tsFiles) {
      const fullPath = path.join(process.cwd(), f);
      if (hasExecutableLogic(fullPath)) {
        hasLogic = true;
        break;
      }
    }

    if (!hasLogic && tsFiles.length > 0) {
      reportLines.push(`| **${story.id}** | ${story.status} | 🔴 FAKE | TS files modified but contain 0 lines of executable logic (Mock Code). |`);
      fakeCount++;
    } else {
      reportLines.push(`| **${story.id}** | ${story.status} | ✅ VALID | Valid functional code found. |`);
    }
  }

  const reportPath = path.join(process.cwd(), 'fake-stories-audit-report.md');
  fs.writeFileSync(reportPath, reportLines.join('\n'), 'utf8');
  console.log(`\nAudit complete. Found ${fakeCount} fake stories.`);
  console.log(`Report saved to: ${reportPath}`);
}

runAudit();
