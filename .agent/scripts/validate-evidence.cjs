const fs = require('fs');
const path = require('path');

function printUsage() {
  console.log('Usage: node validate-evidence.js <path-to-log-file> [path-to-exitcode-file]');
  console.log('Validates the physical existence of a log file, and optionally its exit code.');
}

const logFile = process.argv[2];
const exitCodeFile = process.argv[3];

if (!logFile || logFile === '--help' || logFile === '-h') {
  printUsage();
  process.exit(1);
}

if (!fs.existsSync(logFile)) {
  console.error(`[VALIDATE-EVIDENCE] ❌ FAILED: Evidence log file NOT FOUND at ${logFile}`);
  console.error(`Please ensure you redirect command output to this file (e.g., command > ${logFile} 2>&1).`);
  process.exit(1);
}

const stats = fs.statSync(logFile);
if (stats.size === 0) {
  console.error(`[VALIDATE-EVIDENCE] ❌ FAILED: Evidence log file is EMPTY at ${logFile}`);
  process.exit(1);
}

if (exitCodeFile) {
  if (!fs.existsSync(exitCodeFile)) {
    console.error(`[VALIDATE-EVIDENCE] ❌ FAILED: Exit code file NOT FOUND at ${exitCodeFile}`);
    console.error(`Please ensure you capture the exit code (e.g., echo $? > ${exitCodeFile}).`);
    process.exit(1);
  }
  
  const code = fs.readFileSync(exitCodeFile, 'utf8').trim();
  if (code !== '0') {
    console.error(`[VALIDATE-EVIDENCE] ❌ FAILED: Command exited with non-zero code (${code}).`);
    console.error(`Check the log file for details: ${logFile}`);
    process.exit(1);
  }
}

console.log(`[VALIDATE-EVIDENCE] ✅ PASS: Physical evidence validated successfully.`);
process.exit(0);
