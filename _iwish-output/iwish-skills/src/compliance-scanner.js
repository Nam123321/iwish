const fs = require('fs');
const path = require('path');

/**
 * @typedef {Object} Finding
 * @property {'secret'|'magic'} type - Category of the finding
 * @property {'critical'|'warning'|'info'} severity - Severity level
 * @property {string} file - Absolute or relative path to the file
 * @property {number} line - 1-indexed line number where the finding was detected
 * @property {string} match - The matched text snippet (truncated for display)
 * @property {string} description - Human-readable explanation of the finding
 */

/**
 * @typedef {Object} ScanReport
 * @property {Finding[]} findings - All detected findings
 * @property {number} filesScanned - Number of files successfully scanned
 * @property {number} filesSkipped - Number of files skipped (missing, binary, empty)
 * @property {string[]} warnings - Non-fatal warnings encountered during scanning
 * @property {boolean} blocked - Whether DONE transition should be blocked
 */

/**
 * Secret detection patterns. Each entry defines a regex, its severity,
 * and a human-readable description for the scan report.
 *
 * @type {Array<{pattern: RegExp, severity: 'critical'|'warning'|'info', description: string}>}
 */
const SECRET_PATTERNS = [
  {
    pattern: /(sk-|pk-|api[_-]?key|token|secret|password|passwd)\s*[:=]\s*['"][^'"]{8,}/gi,
    severity: 'critical',
    description: 'Potential API key, token, secret, or password detected'
  },
  {
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical',
    description: 'AWS Access Key ID detected'
  },
  {
    pattern: /-----BEGIN\s+(RSA|EC|DSA|OPENSSH)\s+PRIVATE\s+KEY-----/g,
    severity: 'critical',
    description: 'Private key marker detected'
  },
  {
    pattern: /eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+/g,
    severity: 'critical',
    description: 'JWT token detected'
  }
];

/**
 * Common ports that are NOT flagged as magic numbers.
 * @type {Set<number>}
 */
const ALLOWED_PORTS = new Set([80, 443, 3000, 8080]);

/**
 * ComplianceScanner provides static analysis gates for detecting
 * secrets and magic numbers in source files. It is designed to
 * integrate into the I-Wish self-check workflow step to prevent
 * stories from transitioning to DONE when critical issues exist.
 */
class ComplianceScanner {
  /**
   * Creates a ComplianceScanner instance.
   * @param {Object} [options]
   * @param {boolean} [options.verbose=false] - If true, prints warnings to stderr
   */
  constructor(options = {}) {
    this.verbose = options.verbose || false;
  }

  /**
   * Reads a file and determines if it should be scanned.
   * Returns null for non-existent, binary, or empty files.
   *
   * @param {string} filePath - Path to the file
   * @param {string[]} warnings - Array to push warning messages into
   * @returns {{ content: string, lines: string[] } | null}
   */
  _readFileForScan(filePath, warnings) {
    // Check existence
    if (!fs.existsSync(filePath)) {
      const msg = `File not found, skipping: ${filePath}`;
      warnings.push(msg);
      if (this.verbose) console.warn(`[compliance-scanner] WARN: ${msg}`);
      return null;
    }

    // Read raw buffer for binary detection
    let buffer;
    try {
      buffer = fs.readFileSync(filePath);
    } catch (err) {
      const msg = `Cannot read file ${filePath}: ${err.message}`;
      warnings.push(msg);
      if (this.verbose) console.warn(`[compliance-scanner] WARN: ${msg}`);
      return null;
    }

    // Empty file check
    if (buffer.length === 0) {
      const msg = `Empty file, skipping: ${filePath}`;
      warnings.push(msg);
      if (this.verbose) console.warn(`[compliance-scanner] WARN: ${msg}`);
      return null;
    }

    // Binary detection: check for null bytes in the first 8KB
    const sample = buffer.slice(0, 8192);
    for (let i = 0; i < sample.length; i++) {
      if (sample[i] === 0) {
        const msg = `Binary file detected, skipping: ${filePath}`;
        warnings.push(msg);
        if (this.verbose) console.warn(`[compliance-scanner] WARN: ${msg}`);
        return null;
      }
    }

    const content = buffer.toString('utf-8');
    const lines = content.split('\n');
    return { content, lines };
  }

  /**
   * Scans files for secret patterns (API keys, AWS keys, private keys, JWTs).
   * Returns an array of findings with file, line, match, and severity.
   *
   * @param {string[]} filePaths - Array of file paths to scan
   * @returns {{ findings: Finding[], filesScanned: number, filesSkipped: number, warnings: string[] }}
   */
  scanSecrets(filePaths) {
    /** @type {Finding[]} */
    const findings = [];
    const warnings = [];
    let filesScanned = 0;
    let filesSkipped = 0;

    for (const filePath of filePaths) {
      const fileData = this._readFileForScan(filePath, warnings);
      if (!fileData) {
        filesSkipped++;
        continue;
      }

      filesScanned++;
      const { lines } = fileData;

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const lineContent = lines[lineIndex];

        for (const { pattern, severity, description } of SECRET_PATTERNS) {
          // Reset regex lastIndex for each line since we use /g flag
          pattern.lastIndex = 0;
          let match;
          while ((match = pattern.exec(lineContent)) !== null) {
            findings.push({
              type: 'secret',
              severity,
              file: filePath,
              line: lineIndex + 1,
              match: this._truncateMatch(match[0]),
              description
            });
          }
        }
      }
    }

    return { findings, filesScanned, filesSkipped, warnings };
  }

  /**
   * Scans files for magic numbers: hardcoded ports, IP addresses,
   * URLs with embedded credentials, and large numeric literals.
   *
   * @param {string[]} filePaths - Array of file paths to scan
   * @returns {{ findings: Finding[], filesScanned: number, filesSkipped: number, warnings: string[] }}
   */
  scanMagicNumbers(filePaths) {
    /** @type {Finding[]} */
    const findings = [];
    const warnings = [];
    let filesScanned = 0;
    let filesSkipped = 0;

    for (const filePath of filePaths) {
      const fileData = this._readFileForScan(filePath, warnings);
      if (!fileData) {
        filesSkipped++;
        continue;
      }

      filesScanned++;
      const { lines } = fileData;

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const lineContent = lines[lineIndex];

        // Detect hardcoded port numbers (port/PORT followed by assignment with a number)
        this._detectPorts(lineContent, filePath, lineIndex + 1, findings);

        // Detect hardcoded IP addresses (IPv4)
        this._detectIPs(lineContent, filePath, lineIndex + 1, findings);

        // Detect URLs with embedded credentials (e.g., http://user:pass@host)
        this._detectCredentialURLs(lineContent, filePath, lineIndex + 1, findings);

        // Detect large numeric literals (> 100) in business logic
        this._detectLargeNumbers(lineContent, filePath, lineIndex + 1, findings);
      }
    }

    return { findings, filesScanned, filesSkipped, warnings };
  }

  /**
   * Runs both secret and magic number scans, returning a combined report.
   *
   * @param {string[]} filePaths - Array of file paths to scan
   * @returns {ScanReport}
   */
  runFullScan(filePaths) {
    const secretResult = this.scanSecrets(filePaths);
    const magicResult = this.scanMagicNumbers(filePaths);

    const allFindings = [...secretResult.findings, ...magicResult.findings];
    const allWarnings = [...new Set([...secretResult.warnings, ...magicResult.warnings])];

    // Files may overlap between the two scans — take the max of scanned counts
    // since both scan the same file set
    const filesScanned = Math.max(secretResult.filesScanned, magicResult.filesScanned);
    const filesSkipped = Math.max(secretResult.filesSkipped, magicResult.filesSkipped);

    const blocked = this.shouldBlockDone({ findings: allFindings });

    return {
      findings: allFindings,
      filesScanned,
      filesSkipped,
      warnings: allWarnings,
      blocked
    };
  }

  /**
   * Determines whether a story should be blocked from transitioning to DONE.
   * Returns true if ANY finding has severity 'critical'.
   *
   * @param {{ findings: Finding[] }} scanReport - Report containing findings
   * @returns {boolean}
   */
  shouldBlockDone(scanReport) {
    if (!scanReport || !Array.isArray(scanReport.findings)) {
      return false;
    }
    return scanReport.findings.some(f => f.severity === 'critical');
  }

  // ──────────────────────────────────────────────
  // Private detection helpers
  // ──────────────────────────────────────────────

  /**
   * Detects hardcoded port numbers in a line.
   * Matches patterns like `port = 5432`, `PORT: 9090`, `:5432`.
   * Allows common ports: 80, 443, 3000, 8080.
   *
   * @param {string} line
   * @param {string} file
   * @param {number} lineNum
   * @param {Finding[]} findings
   * @private
   */
  _detectPorts(line, file, lineNum, findings) {
    // Pattern: port/PORT assignment or colon-prefix port notation
    const portPattern = /(?:port|PORT)\s*[:=]\s*(\d+)|:(\d{4,5})(?=[\/\s,;'"\])}]|$)/gi;
    portPattern.lastIndex = 0;
    let match;
    while ((match = portPattern.exec(line)) !== null) {
      const portStr = match[1] || match[2];
      const portNum = parseInt(portStr, 10);
      if (portNum > 0 && portNum <= 65535 && !ALLOWED_PORTS.has(portNum)) {
        findings.push({
          type: 'magic',
          severity: 'warning',
          file,
          line: lineNum,
          match: this._truncateMatch(match[0]),
          description: `Hardcoded port number ${portNum} detected — consider using a configuration variable`
        });
      }
    }
  }

  /**
   * Detects hardcoded IPv4 addresses in a line.
   * Excludes common non-routable patterns like 0.0.0.0 and 127.0.0.1.
   *
   * @param {string} line
   * @param {string} file
   * @param {number} lineNum
   * @param {Finding[]} findings
   * @private
   */
  _detectIPs(line, file, lineNum, findings) {
    const ipPattern = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g;
    ipPattern.lastIndex = 0;
    let match;
    while ((match = ipPattern.exec(line)) !== null) {
      const ip = match[1];
      // Skip localhost and unspecified addresses — these are conventional
      if (ip === '127.0.0.1' || ip === '0.0.0.0') continue;

      // Validate octets are in range
      const octets = ip.split('.').map(Number);
      const isValid = octets.every(o => o >= 0 && o <= 255);
      if (!isValid) continue;

      findings.push({
        type: 'magic',
        severity: 'warning',
        file,
        line: lineNum,
        match: ip,
        description: `Hardcoded IP address ${ip} detected — consider using a configuration variable`
      });
    }
  }

  /**
   * Detects URLs with embedded credentials (e.g., http://user:pass@host).
   *
   * @param {string} line
   * @param {string} file
   * @param {number} lineNum
   * @param {Finding[]} findings
   * @private
   */
  _detectCredentialURLs(line, file, lineNum, findings) {
    const credUrlPattern = /https?:\/\/[^:\/\s]+:[^@\/\s]+@[^\s'"]+/gi;
    credUrlPattern.lastIndex = 0;
    let match;
    while ((match = credUrlPattern.exec(line)) !== null) {
      findings.push({
        type: 'magic',
        severity: 'warning',
        file,
        line: lineNum,
        match: this._truncateMatch(match[0]),
        description: 'URL with embedded credentials detected — credentials should be in environment variables'
      });
    }
  }

  /**
   * Detects large numeric literals (> 100) that may be magic numbers
   * in business logic. Excludes common version-like patterns, array
   * indices, and well-known constants.
   *
   * @param {string} line
   * @param {string} file
   * @param {number} lineNum
   * @param {Finding[]} findings
   * @private
   */
  _detectLargeNumbers(line, file, lineNum, findings) {
    // Skip lines that look like comments, imports, or version strings
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('#')) return;
    if (trimmed.includes('require(') || trimmed.includes('import ')) return;
    if (trimmed.includes('version') || trimmed.includes('VERSION')) return;

    const numPattern = /\b(\d{3,})\b/g;
    numPattern.lastIndex = 0;
    let match;
    while ((match = numPattern.exec(line)) !== null) {
      const num = parseInt(match[1], 10);

      // Skip common well-known values
      if (num === 100 || num === 200 || num === 404 || num === 500) continue;
      // Skip hex-like patterns (0x prefix handled by word boundary)
      // Skip values that look like years (1900-2100)
      if (num >= 1900 && num <= 2100) continue;

      findings.push({
        type: 'magic',
        severity: 'info',
        file,
        line: lineNum,
        match: match[1],
        description: `Numeric literal ${num} may be a magic number — consider extracting to a named constant`
      });
    }
  }

  /**
   * Truncates a matched string for display purposes.
   *
   * @param {string} str
   * @param {number} [maxLen=80]
   * @returns {string}
   * @private
   */
  _truncateMatch(str, maxLen = 80) {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen) + '...';
  }

  /**
   * Formats a scan report as a human-readable string for CLI output.
   *
   * @param {ScanReport} report
   * @returns {string}
   */
  static formatReport(report) {
    const lines = [];
    lines.push('═══════════════════════════════════════════════');
    lines.push('  COMPLIANCE SCAN REPORT');
    lines.push('═══════════════════════════════════════════════');
    lines.push(`  Files scanned:  ${report.filesScanned}`);
    lines.push(`  Files skipped:  ${report.filesSkipped}`);
    lines.push(`  Total findings: ${report.findings.length}`);

    const critical = report.findings.filter(f => f.severity === 'critical').length;
    const warning = report.findings.filter(f => f.severity === 'warning').length;
    const info = report.findings.filter(f => f.severity === 'info').length;

    lines.push(`  Critical: ${critical}  Warning: ${warning}  Info: ${info}`);
    lines.push('───────────────────────────────────────────────');

    if (report.findings.length === 0) {
      lines.push('  ✅ No issues found. All clear!');
    } else {
      for (const f of report.findings) {
        const icon = f.severity === 'critical' ? '🔴' : f.severity === 'warning' ? '🟡' : '🔵';
        lines.push(`  ${icon} [${f.severity.toUpperCase()}] ${f.file}:${f.line}`);
        lines.push(`     ${f.description}`);
        lines.push(`     Match: ${f.match}`);
        lines.push('');
      }
    }

    lines.push('───────────────────────────────────────────────');
    if (report.blocked) {
      lines.push('  🚫 BLOCKED: Critical issues found. Story cannot transition to DONE.');
    } else {
      lines.push('  ✅ PASSED: No critical issues. Story may transition to DONE.');
    }
    lines.push('═══════════════════════════════════════════════');

    if (report.warnings.length > 0) {
      lines.push('');
      lines.push('Warnings:');
      for (const w of report.warnings) {
        lines.push(`  ⚠ ${w}`);
      }
    }

    return lines.join('\n');
  }
}

// ──────────────────────────────────────────────
// CLI Entrypoint
// ──────────────────────────────────────────────

/**
 * Recursively collects all files under a directory path.
 *
 * @param {string} dirPath
 * @returns {string[]}
 */
function collectFiles(dirPath) {
  const results = [];
  if (!fs.existsSync(dirPath)) return results;

  const stat = fs.statSync(dirPath);
  if (stat.isFile()) return [dirPath];

  if (stat.isDirectory()) {
    const entries = fs.readdirSync(dirPath);
    for (const entry of entries) {
      // Skip hidden directories and node_modules
      if (entry.startsWith('.') || entry === 'node_modules') continue;
      const fullPath = path.join(dirPath, entry);
      results.push(...collectFiles(fullPath));
    }
  }

  return results;
}

/**
 * CLI handler. Invoked when this module is run directly:
 *   node compliance-scanner.js scan <path> [--secrets-only] [--magic-only]
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Usage: node compliance-scanner.js scan <path> [options]

Options:
  --secrets-only   Run only secret detection scan
  --magic-only     Run only magic number detection scan
  --verbose        Print warnings for skipped files
  --help, -h       Show this help message

Examples:
  node compliance-scanner.js scan ./src
  node compliance-scanner.js scan ./src --secrets-only
  node compliance-scanner.js scan ./config.js --magic-only --verbose
`);
    process.exit(0);
  }

  if (args[0] !== 'scan') {
    console.error(`Unknown command: ${args[0]}. Use "scan <path>".`);
    process.exit(1);
  }

  if (args.length < 2) {
    console.error('Error: Missing <path> argument. Usage: node compliance-scanner.js scan <path>');
    process.exit(1);
  }

  const targetPath = path.resolve(args[1]);
  const secretsOnly = args.includes('--secrets-only');
  const magicOnly = args.includes('--magic-only');
  const verbose = args.includes('--verbose');

  if (secretsOnly && magicOnly) {
    console.error('Error: Cannot use --secrets-only and --magic-only together.');
    process.exit(1);
  }

  const filePaths = collectFiles(targetPath);

  if (filePaths.length === 0) {
    console.log('No files found to scan.');
    process.exit(0);
  }

  const scanner = new ComplianceScanner({ verbose });

  let report;
  if (secretsOnly) {
    const result = scanner.scanSecrets(filePaths);
    report = {
      ...result,
      blocked: scanner.shouldBlockDone(result)
    };
  } else if (magicOnly) {
    const result = scanner.scanMagicNumbers(filePaths);
    report = {
      ...result,
      blocked: scanner.shouldBlockDone(result)
    };
  } else {
    report = scanner.runFullScan(filePaths);
  }

  console.log(ComplianceScanner.formatReport(report));

  process.exit(report.blocked ? 1 : 0);
}

// Run CLI if invoked directly
if (require.main === module) {
  main();
}

module.exports = { ComplianceScanner, collectFiles };
