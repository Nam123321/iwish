/**
 * interface-lock.ts — Schema & Interface Lock Gate
 *
 * Story 10.2: Mandatory gate that freezes API Contracts, TypeScript Types,
 * DB Migrations, and Mock Objects before activating parallel execution mode.
 * Ensures all sub-agents share a unified "Communication Contract" and
 * prevents Architectural Drift.
 *
 * Depends on: Story 10.1 (dependency-mapper.ts) for DAG analysis.
 *
 * @module interface-lock
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Type of interface collected from the codebase */
export type InterfaceKind =
  | 'typescript-interface'
  | 'typescript-type'
  | 'zod-schema'
  | 'db-migration'
  | 'jsdoc-inferred'
  | 'component-props';

/** A collected interface descriptor */
export interface CollectedInterface {
  /** Unique name of the interface/type */
  name: string;
  /** Kind of interface */
  kind: InterfaceKind;
  /** Source file path (relative to project root) */
  sourceFile: string;
  /** Line number in source file */
  lineNumber: number;
  /** Full source code of the interface definition */
  sourceCode: string;
  /** List of property names and their types */
  properties: InterfaceProperty[];
  /** Story ID(s) this interface is relevant to */
  relevantStories: string[];
}

/** A single property within an interface */
export interface InterfaceProperty {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
}

/** A generated mock object for an interface */
export interface GeneratedMock {
  /** The interface this mock is for */
  interfaceName: string;
  /** The mock factory function source code */
  factoryCode: string;
  /** Example output from the factory */
  exampleValue: string;
}

/** A single entry in the lock manifest */
export interface LockManifestEntry {
  /** Relative file path from project root */
  filePath: string;
  /** SHA-256 content hash */
  contentHash: string;
  /** Type of locked artifact */
  artifactType: 'contract' | 'mock' | 'migration' | 'manifest';
  /** ISO timestamp when locked */
  lockedAt: string;
  /** Number of interfaces/types in this file */
  interfaceCount: number;
}

/** The complete lock manifest */
export interface LockManifest {
  epicId: string;
  generatedAt: string;
  lockedBy: string;
  totalContracts: number;
  totalMocks: number;
  totalMigrations: number;
  files: LockManifestEntry[];
  /** Hash of the entire manifest for integrity verification */
  manifestHash: string;
}

/** Result of the Interface Lock Gate execution */
export interface LockGateResult {
  epicId: string;
  success: boolean;
  outputDir: string;
  manifest: LockManifest;
  collectStats: {
    tsInterfaces: number;
    zodSchemas: number;
    dbMigrations: number;
    jsdocInferred: number;
    componentProps: number;
    skippedCategories: string[];
  };
  mockStats: {
    generated: number;
    skipped: number;
  };
}

/** Options for the lock gate */
export interface LockGateOptions {
  projectRoot?: string;
  dagJsonPath?: string;
  outputBaseDir?: string;
  /** Skip DB migration collection (for pure frontend epics) */
  skipMigrations?: boolean;
  /** Force re-scan even if lock already exists */
  force?: boolean;
}

/** Write-lock check result */
export interface WriteLockCheckResult {
  allowed: boolean;
  reason: string;
  lockedFile?: string;
  manifestEntry?: LockManifestEntry;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOCK_DIR_PREFIX = 'interface-lock-epic-';
const CONTRACTS_FILE = 'contracts.ts';
const MOCKS_FILE = 'mocks.ts';
const MIGRATIONS_FILE = 'migrations.sql';
const MANIFEST_FILE = 'lock-manifest.json';

// ---------------------------------------------------------------------------
// Task 1: collectEpicInterfaces — Interface Collection Engine (AC1, AC5, AC6)
// ---------------------------------------------------------------------------

/**
 * Scans the codebase for TypeScript interfaces, Zod schemas, and DB migration
 * files relevant to the given Epic, guided by the DAG dependency analysis.
 *
 * Handles edge cases:
 * - AC5: Skips DB mock generation for pure UX/Frontend epics
 * - AC6: Infers types from JSDoc for pure JS projects
 *
 * @param epicId - The epic identifier (e.g., "10")
 * @param dagJson - Parsed DAG result from dependency-mapper (or null to scan all)
 * @param projectRoot - Absolute path to the project root
 * @returns Array of collected interfaces
 */
export function collectEpicInterfaces(
  epicId: string,
  dagJson: { nodes: Array<{ id: string; title: string }> } | null,
  projectRoot: string,
): CollectedInterface[] {
  const collected: CollectedInterface[] = [];
  const storyIds = dagJson
    ? dagJson.nodes.map((n) => n.id)
    : [];

  // Determine relevant source directories to scan
  const srcDir = path.join(projectRoot, 'src');
  const libDir = path.join(projectRoot, 'lib');
  const appDir = path.join(projectRoot, 'app');

  const scanDirs: string[] = [];
  if (fs.existsSync(srcDir)) scanDirs.push(srcDir);
  if (fs.existsSync(libDir)) scanDirs.push(libDir);
  if (fs.existsSync(appDir)) scanDirs.push(appDir);

  // If no scan dirs, check root for files
  if (scanDirs.length === 0) {
    scanDirs.push(projectRoot);
  }

  for (const dir of scanDirs) {
    const files = findFilesRecursive(dir, projectRoot);

    for (const relPath of files) {
      const absPath = path.join(projectRoot, relPath);
      const ext = path.extname(relPath).toLowerCase();

      // TypeScript/TSX files → extract interfaces, types, Zod schemas
      if (ext === '.ts' || ext === '.tsx') {
        const content = safeReadFile(absPath);
        if (!content) continue;

        // Extract TypeScript interfaces
        const tsInterfaces = extractTypeScriptInterfaces(content, relPath, storyIds);
        collected.push(...tsInterfaces);

        // Extract TypeScript type aliases
        const typeAliases = extractTypeAliases(content, relPath, storyIds);
        collected.push(...typeAliases);

        // Extract Zod schemas
        const zodSchemas = extractZodSchemas(content, relPath, storyIds);
        collected.push(...zodSchemas);

        // Extract React component props (AC5: component-only epics)
        const componentProps = extractComponentProps(content, relPath, storyIds);
        collected.push(...componentProps);
      }

      // JavaScript files → infer types from JSDoc (AC6)
      if (ext === '.js' || ext === '.jsx') {
        const content = safeReadFile(absPath);
        if (!content) continue;

        const jsdocTypes = inferTypesFromJSDoc(content, relPath, storyIds);
        collected.push(...jsdocTypes);
      }

      // SQL migration files
      if (ext === '.sql' || relPath.includes('migration')) {
        const content = safeReadFile(absPath);
        if (!content) continue;

        const migrations = extractMigrationSchemas(content, relPath, storyIds);
        collected.push(...migrations);
      }
    }
  }

  return collected;
}

/**
 * Recursively finds all relevant source files in a directory.
 * Excludes node_modules, dist, .git, and other build artifacts.
 */
function findFilesRecursive(dir: string, projectRoot: string): string[] {
  const results: string[] = [];
  const excludeDirs = new Set([
    'node_modules', 'dist', 'build', '.git', '.next',
    '.nuxt', 'coverage', '__pycache__', '.agent',
    '_iwish-output', '.gemini',
  ]);

  function walk(currentDir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (excludeDirs.has(entry.name)) continue;

      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.ts', '.tsx', '.js', '.jsx', '.sql'].includes(ext)) {
          results.push(path.relative(projectRoot, fullPath));
        }
      }
    }
  }

  walk(dir);
  return results;
}

/**
 * Extracts TypeScript interface declarations from file content.
 */
function extractTypeScriptInterfaces(
  content: string,
  filePath: string,
  storyIds: string[],
): CollectedInterface[] {
  const interfaces: CollectedInterface[] = [];
  const interfaceRegex = /^(export\s+)?interface\s+(\w+)(?:\s+extends\s+[\w\s,<>]+)?\s*\{([^}]*)\}/gm;
  let match: RegExpExecArray | null;

  while ((match = interfaceRegex.exec(content)) !== null) {
    const name = match[2];
    const body = match[3];
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const properties = parseInterfaceProperties(body);

    interfaces.push({
      name,
      kind: 'typescript-interface',
      sourceFile: filePath,
      lineNumber,
      sourceCode: match[0],
      properties,
      relevantStories: storyIds,
    });
  }

  return interfaces;
}

/**
 * Extracts TypeScript type alias declarations.
 */
function extractTypeAliases(
  content: string,
  filePath: string,
  storyIds: string[],
): CollectedInterface[] {
  const types: CollectedInterface[] = [];
  // Match type aliases that define object shapes
  const typeRegex = /^(export\s+)?type\s+(\w+)\s*=\s*\{([^}]*)\}/gm;
  let match: RegExpExecArray | null;

  while ((match = typeRegex.exec(content)) !== null) {
    const name = match[2];
    const body = match[3];
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const properties = parseInterfaceProperties(body);

    types.push({
      name,
      kind: 'typescript-type',
      sourceFile: filePath,
      lineNumber,
      sourceCode: match[0],
      properties,
      relevantStories: storyIds,
    });
  }

  return types;
}

/**
 * Extracts Zod schema declarations.
 */
function extractZodSchemas(
  content: string,
  filePath: string,
  storyIds: string[],
): CollectedInterface[] {
  const schemas: CollectedInterface[] = [];
  const zodRegex = /(?:export\s+)?(?:const|let)\s+(\w+Schema)\s*=\s*z\.object\(\{([\s\S]*?)\}\)/gm;
  let match: RegExpExecArray | null;

  while ((match = zodRegex.exec(content)) !== null) {
    const name = match[1];
    const body = match[2];
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const properties = parseZodProperties(body);

    schemas.push({
      name,
      kind: 'zod-schema',
      sourceFile: filePath,
      lineNumber,
      sourceCode: match[0],
      properties,
      relevantStories: storyIds,
    });
  }

  return schemas;
}

/**
 * Extracts React component props interfaces (AC5: Frontend-only epics).
 */
function extractComponentProps(
  content: string,
  filePath: string,
  storyIds: string[],
): CollectedInterface[] {
  const props: CollectedInterface[] = [];
  // Match Props interfaces for React components
  const propsRegex = /^(export\s+)?(?:interface|type)\s+(\w+Props)\s*(?:=\s*)?\{([^}]*)\}/gm;
  let match: RegExpExecArray | null;

  while ((match = propsRegex.exec(content)) !== null) {
    const name = match[2];
    const body = match[3];
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const properties = parseInterfaceProperties(body);

    props.push({
      name,
      kind: 'component-props',
      sourceFile: filePath,
      lineNumber,
      sourceCode: match[0],
      properties,
      relevantStories: storyIds,
    });
  }

  return props;
}

/**
 * Infers types from JSDoc annotations in JavaScript files (AC6).
 * Handles pure JS projects without TypeScript types.
 */
function inferTypesFromJSDoc(
  content: string,
  filePath: string,
  storyIds: string[],
): CollectedInterface[] {
  const inferred: CollectedInterface[] = [];

  // Match @typedef JSDoc comments
  const typedefRegex = /\/\*\*[\s\S]*?@typedef\s+\{Object\}\s+(\w+)([\s\S]*?)\*\//g;
  let match: RegExpExecArray | null;

  while ((match = typedefRegex.exec(content)) !== null) {
    const name = match[1];
    const body = match[2];
    const lineNumber = content.substring(0, match.index).split('\n').length;

    // Parse @property annotations
    const properties: InterfaceProperty[] = [];
    const propRegex = /@property\s+\{(\w+)\}\s+(?:\[)?(\w+)(?:\])?\s*-?\s*(.*)/g;
    let propMatch: RegExpExecArray | null;
    while ((propMatch = propRegex.exec(body)) !== null) {
      properties.push({
        name: propMatch[2],
        type: propMatch[1],
        optional: propMatch[0].includes('['),
      });
    }

    inferred.push({
      name,
      kind: 'jsdoc-inferred',
      sourceFile: filePath,
      lineNumber,
      sourceCode: match[0],
      properties,
      relevantStories: storyIds,
    });
  }

  // Also infer from @param/@returns on exported functions
  const funcJsdocRegex = /\/\*\*[\s\S]*?@param\s+\{([^}]+)\}\s+(\w+)([\s\S]*?)\*\/\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
  while ((match = funcJsdocRegex.exec(content)) !== null) {
    const funcName = match[4];
    const paramType = match[1];
    const paramName = match[2];
    const lineNumber = content.substring(0, match.index).split('\n').length;

    // Create a stub interface for complex parameter types
    if (paramType === 'Object' || paramType.includes('{')) {
      inferred.push({
        name: `${funcName}Params`,
        kind: 'jsdoc-inferred',
        sourceFile: filePath,
        lineNumber,
        sourceCode: `// Inferred from JSDoc @param of function ${funcName}`,
        properties: [{
          name: paramName,
          type: paramType,
          optional: false,
        }],
        relevantStories: storyIds,
      });
    }
  }

  return inferred;
}

/**
 * Extracts schema information from SQL migration files.
 */
function extractMigrationSchemas(
  content: string,
  filePath: string,
  storyIds: string[],
): CollectedInterface[] {
  const schemas: CollectedInterface[] = [];

  // Match CREATE TABLE statements
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`)?(\w+)(?:`)?\s*\(([^)]+)\)/gi;
  let match: RegExpExecArray | null;

  while ((match = createTableRegex.exec(content)) !== null) {
    const tableName = match[1];
    const columns = match[2];
    const lineNumber = content.substring(0, match.index).split('\n').length;

    const properties: InterfaceProperty[] = [];
    const columnRegex = /(?:`)?(\w+)(?:`)?\s+([\w()]+)/g;
    let colMatch: RegExpExecArray | null;
    while ((colMatch = columnRegex.exec(columns)) !== null) {
      const colName = colMatch[1];
      // Skip SQL keywords that aren't column names
      if (['PRIMARY', 'FOREIGN', 'UNIQUE', 'INDEX', 'CONSTRAINT', 'KEY', 'CHECK'].includes(colName.toUpperCase())) {
        continue;
      }
      properties.push({
        name: colName,
        type: sqlTypeToTsType(colMatch[2]),
        optional: !columns.includes(`${colName}`) || columns.includes('NULL'),
      });
    }

    schemas.push({
      name: `${tableName}Table`,
      kind: 'db-migration',
      sourceFile: filePath,
      lineNumber,
      sourceCode: match[0],
      properties,
      relevantStories: storyIds,
    });
  }

  return schemas;
}

/**
 * Parses interface body text into structured properties.
 */
function parseInterfaceProperties(body: string): InterfaceProperty[] {
  const properties: InterfaceProperty[] = [];
  const lines = body.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

    // Match: propertyName: Type or propertyName?: Type
    const propMatch = trimmed.match(/^(\w+)(\?)?\s*:\s*(.+?)(?:;|\s*$)/);
    if (propMatch) {
      properties.push({
        name: propMatch[1],
        type: propMatch[3].trim().replace(/;$/, ''),
        optional: propMatch[2] === '?',
      });
    }
  }

  return properties;
}

/**
 * Parses Zod schema body into structured properties.
 */
function parseZodProperties(body: string): InterfaceProperty[] {
  const properties: InterfaceProperty[] = [];
  const lines = body.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;

    // Match: propertyName: z.string(), z.number().optional(), etc.
    const propMatch = trimmed.match(/(\w+)\s*:\s*z\.(\w+)\(\)(.*)$/);
    if (propMatch) {
      const isOptional = propMatch[3].includes('.optional()') || propMatch[3].includes('.nullable()');
      properties.push({
        name: propMatch[1],
        type: zodTypeToTsType(propMatch[2]),
        optional: isOptional,
      });
    }
  }

  return properties;
}

/**
 * Converts SQL types to TypeScript types.
 */
function sqlTypeToTsType(sqlType: string): string {
  const upper = sqlType.toUpperCase();
  if (['INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC'].some((t) => upper.startsWith(t))) {
    return 'number';
  }
  if (['VARCHAR', 'TEXT', 'CHAR', 'NVARCHAR', 'NTEXT', 'UUID'].some((t) => upper.startsWith(t))) {
    return 'string';
  }
  if (['BOOLEAN', 'BOOL', 'BIT'].some((t) => upper.startsWith(t))) {
    return 'boolean';
  }
  if (['TIMESTAMP', 'DATETIME', 'DATE'].some((t) => upper.startsWith(t))) {
    return 'Date';
  }
  if (upper.startsWith('JSON')) return 'Record<string, unknown>';
  return 'unknown';
}

/**
 * Converts Zod type names to TypeScript types.
 */
function zodTypeToTsType(zodType: string): string {
  const map: Record<string, string> = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    date: 'Date',
    bigint: 'bigint',
    undefined: 'undefined',
    null: 'null',
    any: 'any',
    unknown: 'unknown',
    void: 'void',
    array: 'unknown[]',
    object: 'Record<string, unknown>',
    enum: 'string',
    literal: 'string',
    union: 'unknown',
    intersection: 'unknown',
    record: 'Record<string, unknown>',
    map: 'Map<string, unknown>',
    set: 'Set<unknown>',
    tuple: 'unknown[]',
  };
  return map[zodType] || 'unknown';
}

/**
 * Safely reads a file, returning null on error.
 */
function safeReadFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Task 2: generateMockObjects — Mock Factory Generator (AC2)
// ---------------------------------------------------------------------------

/**
 * Generates Mock Objects for each collected interface using faker/factory patterns.
 * Creates typed factory functions that produce valid test doubles for parallel
 * development.
 *
 * @param interfaces - Array of collected interfaces
 * @returns Array of generated mock objects with factory code
 */
export function generateMockObjects(interfaces: CollectedInterface[]): GeneratedMock[] {
  const mocks: GeneratedMock[] = [];

  for (const iface of interfaces) {
    // Skip migration schemas from mock generation if they have no useful properties
    if (iface.kind === 'db-migration' && iface.properties.length === 0) continue;

    const factoryCode = generateFactoryFunction(iface);
    const exampleValue = generateExampleValue(iface);

    mocks.push({
      interfaceName: iface.name,
      factoryCode,
      exampleValue,
    });
  }

  return mocks;
}

/**
 * Generates a factory function for creating mock instances of an interface.
 */
function generateFactoryFunction(iface: CollectedInterface): string {
  const props = iface.properties
    .map((p) => {
      const mockValue = getMockValueForType(p.type, p.name);
      if (p.optional) {
        return `    ${p.name}: overrides?.${p.name} ?? ${mockValue},`;
      }
      return `    ${p.name}: overrides?.${p.name} ?? ${mockValue},`;
    })
    .join('\n');

  return `/**
 * Factory function to create mock ${iface.name} objects.
 * Source: ${iface.sourceFile}:${iface.lineNumber}
 * Kind: ${iface.kind}
 */
export function create${iface.name}(overrides?: Partial<${iface.name}>): ${iface.name} {
  return {
${props}
    ...overrides,
  };
}`;
}

/**
 * Generates an example value showing what the factory produces.
 */
function generateExampleValue(iface: CollectedInterface): string {
  const obj: Record<string, unknown> = {};
  for (const prop of iface.properties) {
    obj[prop.name] = getExampleValueForType(prop.type, prop.name);
  }
  return JSON.stringify(obj, null, 2);
}

/**
 * Returns a mock value expression for a given TypeScript type.
 */
function getMockValueForType(type: string, name: string): string {
  // Name-based heuristics (higher priority)
  const nameLower = name.toLowerCase();
  if (nameLower.includes('id') && !nameLower.includes('valid')) return `'mock-${name}-' + Date.now()`;
  if (nameLower.includes('email')) return `'test@example.com'`;
  if (nameLower.includes('url') || nameLower.includes('link')) return `'https://example.com/mock'`;
  if (nameLower.includes('name')) return `'Mock ${name}'`;
  if (nameLower.includes('date') || nameLower.includes('at') || nameLower.includes('timestamp')) return `new Date().toISOString()`;
  if (nameLower.includes('count') || nameLower.includes('total') || nameLower.includes('amount')) return `0`;
  if (nameLower.includes('enabled') || nameLower.includes('active') || nameLower.includes('is')) return `true`;
  if (nameLower.includes('path') || nameLower.includes('file')) return `'/mock/path/${name}'`;

  // Type-based fallback
  const cleanType = type.replace(/\s/g, '');
  if (cleanType === 'string') return `'mock-${name}'`;
  if (cleanType === 'number') return `0`;
  if (cleanType === 'boolean') return `false`;
  if (cleanType === 'Date') return `new Date()`;
  if (cleanType.endsWith('[]')) return `[]`;
  if (cleanType.startsWith('Record<')) return `{}`;
  if (cleanType.startsWith('Map<')) return `new Map()`;
  if (cleanType.startsWith('Set<')) return `new Set()`;
  if (cleanType === 'unknown' || cleanType === 'any') return `null`;

  return `{} as any`;
}

/**
 * Returns a plain example value for type (for JSON serialization).
 */
function getExampleValueForType(type: string, name: string): unknown {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('id')) return `mock-${name}-1`;
  if (nameLower.includes('email')) return 'test@example.com';
  if (nameLower.includes('name')) return `Mock ${name}`;
  if (nameLower.includes('count') || nameLower.includes('total')) return 0;
  if (nameLower.includes('enabled') || nameLower.includes('active')) return true;

  const cleanType = type.replace(/\s/g, '');
  if (cleanType === 'string') return `mock-${name}`;
  if (cleanType === 'number') return 0;
  if (cleanType === 'boolean') return false;
  if (cleanType === 'Date') return new Date().toISOString();
  if (cleanType.endsWith('[]')) return [];
  if (cleanType.startsWith('Record<')) return {};
  return null;
}

// ---------------------------------------------------------------------------
// Task 3: writeLockManifest — Lock File Storage (AC3)
// ---------------------------------------------------------------------------

/**
 * Creates the interface-lock directory structure and writes all lock artifacts:
 * - contracts.ts — All collected interfaces consolidated
 * - mocks.ts — Generated mock factories
 * - migrations.sql — Collected migration schemas
 * - lock-manifest.json — File inventory with content hashes
 *
 * @param epicId - The epic identifier
 * @param interfaces - Collected interfaces
 * @param mocks - Generated mock objects
 * @param projectRoot - Project root path
 * @param outputBaseDir - Base directory for output (default: _iwish-output)
 * @returns The lock manifest
 */
export function writeLockManifest(
  epicId: string,
  interfaces: CollectedInterface[],
  mocks: GeneratedMock[],
  projectRoot: string,
  outputBaseDir?: string,
): LockManifest {
  const baseDir = outputBaseDir || path.join(projectRoot, '_iwish-output');
  const lockDir = path.join(baseDir, `${LOCK_DIR_PREFIX}${epicId}`);

  // Ensure clean directory
  fs.ensureDirSync(lockDir);

  // --- Write contracts.ts ---
  const contractsContent = generateContractsFile(interfaces, epicId);
  const contractsPath = path.join(lockDir, CONTRACTS_FILE);
  fs.writeFileSync(contractsPath, contractsContent, 'utf8');

  // --- Write mocks.ts ---
  const mocksContent = generateMocksFile(mocks, epicId);
  const mocksPath = path.join(lockDir, MOCKS_FILE);
  fs.writeFileSync(mocksPath, mocksContent, 'utf8');

  // --- Write migrations.sql ---
  const migrationInterfaces = interfaces.filter((i) => i.kind === 'db-migration');
  const migrationsContent = generateMigrationsFile(migrationInterfaces, epicId);
  const migrationsPath = path.join(lockDir, MIGRATIONS_FILE);
  fs.writeFileSync(migrationsPath, migrationsContent, 'utf8');

  // --- Build lock manifest ---
  const now = new Date().toISOString();
  const files: LockManifestEntry[] = [
    {
      filePath: path.relative(projectRoot, contractsPath),
      contentHash: computeHash(contractsContent),
      artifactType: 'contract',
      lockedAt: now,
      interfaceCount: interfaces.filter((i) => i.kind !== 'db-migration').length,
    },
    {
      filePath: path.relative(projectRoot, mocksPath),
      contentHash: computeHash(mocksContent),
      artifactType: 'mock',
      lockedAt: now,
      interfaceCount: mocks.length,
    },
    {
      filePath: path.relative(projectRoot, migrationsPath),
      contentHash: computeHash(migrationsContent),
      artifactType: 'migration',
      lockedAt: now,
      interfaceCount: migrationInterfaces.length,
    },
  ];

  const manifest: LockManifest = {
    epicId,
    generatedAt: now,
    lockedBy: 'interface-lock-gate',
    totalContracts: interfaces.filter((i) => i.kind !== 'db-migration').length,
    totalMocks: mocks.length,
    totalMigrations: migrationInterfaces.length,
    files,
    manifestHash: '', // Will be computed after assembly
  };

  // Compute manifest hash (excluding the hash field itself)
  manifest.manifestHash = computeHash(JSON.stringify({ ...manifest, manifestHash: '' }));

  // Add manifest entry
  const manifestContent = JSON.stringify(manifest, null, 2);
  const manifestPath = path.join(lockDir, MANIFEST_FILE);
  fs.writeFileSync(manifestPath, manifestContent, 'utf8');

  files.push({
    filePath: path.relative(projectRoot, manifestPath),
    contentHash: computeHash(manifestContent),
    artifactType: 'manifest',
    lockedAt: now,
    interfaceCount: 0,
  });

  return manifest;
}

/**
 * Generates the consolidated contracts.ts file.
 */
function generateContractsFile(interfaces: CollectedInterface[], epicId: string): string {
  const nonMigrationInterfaces = interfaces.filter((i) => i.kind !== 'db-migration');

  const header = `/**
 * contracts.ts — Frozen Interface Contracts for Epic ${epicId}
 *
 * ⚠️  LOCKED FILE — Do NOT modify without orch-agent approval.
 * Any changes require passing through the Interface Lock Gate.
 *
 * Generated at: ${new Date().toISOString()}
 * Total contracts: ${nonMigrationInterfaces.length}
 */

`;

  const body = nonMigrationInterfaces
    .map((iface) => {
      const propsStr = iface.properties
        .map((p) => `  ${p.name}${p.optional ? '?' : ''}: ${p.type};`)
        .join('\n');

      return `/** Source: ${iface.sourceFile}:${iface.lineNumber} (${iface.kind}) */
export interface ${iface.name} {
${propsStr}
}`;
    })
    .join('\n\n');

  return header + body + '\n';
}

/**
 * Generates the mocks.ts file with factory functions.
 */
function generateMocksFile(mocks: GeneratedMock[], epicId: string): string {
  const header = `/**
 * mocks.ts — Mock Factories for Epic ${epicId}
 *
 * ⚠️  LOCKED FILE — Do NOT modify without orch-agent approval.
 * Use these factories in tests and parallel story development.
 *
 * Generated at: ${new Date().toISOString()}
 * Total mock factories: ${mocks.length}
 */

import type * as Contracts from './contracts';

`;

  const body = mocks.map((m) => m.factoryCode).join('\n\n');

  return header + body + '\n';
}

/**
 * Generates the migrations.sql file with collected schemas.
 */
function generateMigrationsFile(migrations: CollectedInterface[], epicId: string): string {
  const header = `-- migrations.sql — Frozen DB Schemas for Epic ${epicId}
--
-- ⚠️  LOCKED FILE — Do NOT modify without orch-agent approval.
--
-- Generated at: ${new Date().toISOString()}
-- Total tables: ${migrations.length}

`;

  if (migrations.length === 0) {
    return header + '-- No DB migrations found for this epic.\n';
  }

  const body = migrations
    .map((m) => `-- Source: ${m.sourceFile}:${m.lineNumber}\n${m.sourceCode}`)
    .join('\n\n');

  return header + body + '\n';
}

/**
 * Computes SHA-256 hash of content.
 */
function computeHash(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

// ---------------------------------------------------------------------------
// Task 4: checkWriteLock — Write Protection Enforcement (AC4)
// ---------------------------------------------------------------------------

/**
 * Checks if a file path is protected by the Interface Lock Gate.
 * Used by Swarm Orchestrator (Story 10.3) to prevent unauthorized
 * modifications to locked contracts during parallel execution.
 *
 * @param targetFilePath - The file path a sub-agent wants to write to (relative to project root)
 * @param epicId - The epic being executed
 * @param projectRoot - Project root path
 * @returns WriteLockCheckResult indicating whether the write is allowed
 */
export function checkWriteLock(
  targetFilePath: string,
  epicId: string,
  projectRoot: string,
): WriteLockCheckResult {
  const manifestPath = path.join(
    projectRoot, '_iwish-output',
    `${LOCK_DIR_PREFIX}${epicId}`,
    MANIFEST_FILE,
  );

  // If no manifest exists, the lock gate hasn't been run → allow all writes
  if (!fs.existsSync(manifestPath)) {
    return {
      allowed: true,
      reason: `No lock manifest found for Epic ${epicId}. Interface Lock Gate has not been executed.`,
    };
  }

  let manifest: LockManifest;
  try {
    manifest = fs.readJsonSync(manifestPath) as LockManifest;
  } catch (err) {
    return {
      allowed: true,
      reason: `Failed to read lock manifest: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Normalize the target path for comparison
  const normalizedTarget = targetFilePath.replace(/\\/g, '/');

  // Check if the target file is in the locked files list
  for (const entry of manifest.files) {
    const normalizedLocked = entry.filePath.replace(/\\/g, '/');

    if (normalizedTarget === normalizedLocked ||
        normalizedTarget.endsWith(normalizedLocked) ||
        normalizedLocked.endsWith(normalizedTarget)) {
      return {
        allowed: false,
        reason: `File "${targetFilePath}" is locked by Interface Lock Gate for Epic ${epicId}. ` +
                `Modification requires sequential approval from orch-agent. ` +
                `Locked at: ${entry.lockedAt}, Hash: ${entry.contentHash.substring(0, 12)}...`,
        lockedFile: entry.filePath,
        manifestEntry: entry,
      };
    }
  }

  // Check if the target is within the lock directory itself
  const lockDirPath = `_iwish-output/${LOCK_DIR_PREFIX}${epicId}/`;
  if (normalizedTarget.includes(lockDirPath)) {
    return {
      allowed: false,
      reason: `File "${targetFilePath}" is within the Interface Lock directory for Epic ${epicId}. ` +
              `All files in this directory are write-protected during parallel execution.`,
    };
  }

  // Also check if target matches any source files referenced in the contracts
  // (preventing modification of original interface sources during parallel execution)
  return {
    allowed: true,
    reason: 'File is not in the locked interface set.',
  };
}

/**
 * Verifies the integrity of a lock manifest by recomputing hashes.
 *
 * @param epicId - The epic identifier
 * @param projectRoot - Project root path
 * @returns Object indicating whether the manifest is intact or which files were tampered with
 */
export function verifyLockIntegrity(
  epicId: string,
  projectRoot: string,
): { intact: boolean; tamperedFiles: string[] } {
  const manifestPath = path.join(
    projectRoot, '_iwish-output',
    `${LOCK_DIR_PREFIX}${epicId}`,
    MANIFEST_FILE,
  );

  if (!fs.existsSync(manifestPath)) {
    return { intact: true, tamperedFiles: [] };
  }

  const manifest = fs.readJsonSync(manifestPath) as LockManifest;
  const tamperedFiles: string[] = [];

  for (const entry of manifest.files) {
    if (entry.artifactType === 'manifest') continue; // Skip self-check

    const filePath = path.join(projectRoot, entry.filePath);
    if (!fs.existsSync(filePath)) {
      tamperedFiles.push(`${entry.filePath} (MISSING)`);
      continue;
    }

    const currentContent = fs.readFileSync(filePath, 'utf8');
    const currentHash = computeHash(currentContent);

    if (currentHash !== entry.contentHash) {
      tamperedFiles.push(`${entry.filePath} (MODIFIED: expected ${entry.contentHash.substring(0, 12)}, got ${currentHash.substring(0, 12)})`);
    }
  }

  return {
    intact: tamperedFiles.length === 0,
    tamperedFiles,
  };
}

// ---------------------------------------------------------------------------
// Main Entry Point — activateInterfaceLockGate
// ---------------------------------------------------------------------------

/**
 * Main entry point: Executes the full Interface Lock Gate pipeline.
 *
 * 1. Loads DAG from dependency-mapper output (Story 10.1)
 * 2. Collects all interfaces from the codebase
 * 3. Generates mock objects
 * 4. Writes lock manifest with content hashes
 *
 * @param epicId - The epic identifier (e.g., "10")
 * @param options - Configuration options
 * @returns LockGateResult with full pipeline outcome
 */
export async function activateInterfaceLockGate(
  epicId: string,
  options: LockGateOptions = {},
): Promise<LockGateResult> {
  const projectRoot = options.projectRoot
    ? path.resolve(options.projectRoot)
    : process.cwd();

  // Step 1: Load DAG from dependency-mapper output
  const dagJsonPath = options.dagJsonPath ||
    path.join(projectRoot, '_iwish-output', `dependency-map-epic-${epicId}.json`);

  let dagJson: { nodes: Array<{ id: string; title: string }> } | null = null;
  if (fs.existsSync(dagJsonPath)) {
    try {
      dagJson = fs.readJsonSync(dagJsonPath);
      console.log(`📋 Loaded DAG for Epic ${epicId}: ${dagJson!.nodes.length} stories`);
    } catch (err) {
      console.warn(`⚠️  Could not parse DAG file: ${dagJsonPath}`);
    }
  } else {
    console.warn(`⚠️  No DAG file found at ${dagJsonPath}. Scanning full codebase.`);
  }

  // Check if lock already exists
  const lockDir = path.join(
    options.outputBaseDir || path.join(projectRoot, '_iwish-output'),
    `${LOCK_DIR_PREFIX}${epicId}`,
  );

  if (fs.existsSync(lockDir) && !options.force) {
    console.log(`🔒 Lock directory already exists: ${lockDir}`);
    console.log(`   Use --force to re-scan and regenerate.`);
    const existingManifest = fs.readJsonSync(
      path.join(lockDir, MANIFEST_FILE),
    ) as LockManifest;
    return {
      epicId,
      success: true,
      outputDir: lockDir,
      manifest: existingManifest,
      collectStats: {
        tsInterfaces: existingManifest.totalContracts,
        zodSchemas: 0,
        dbMigrations: existingManifest.totalMigrations,
        jsdocInferred: 0,
        componentProps: 0,
        skippedCategories: [],
      },
      mockStats: {
        generated: existingManifest.totalMocks,
        skipped: 0,
      },
    };
  }

  // Step 2: Collect interfaces
  console.log(`🔍 Scanning codebase for interfaces...`);
  const interfaces = collectEpicInterfaces(epicId, dagJson, projectRoot);

  // Categorize for stats
  const stats = {
    tsInterfaces: interfaces.filter((i) => i.kind === 'typescript-interface').length,
    zodSchemas: interfaces.filter((i) => i.kind === 'zod-schema').length,
    dbMigrations: interfaces.filter((i) => i.kind === 'db-migration').length,
    jsdocInferred: interfaces.filter((i) => i.kind === 'jsdoc-inferred').length,
    componentProps: interfaces.filter((i) => i.kind === 'component-props').length,
    skippedCategories: [] as string[],
  };

  // AC5: Check for non-API epic
  if (stats.dbMigrations === 0) {
    stats.skippedCategories.push('db-migrations');
    console.log(`ℹ️  No DB migrations found — skipping mock DB generation (AC5: pure frontend epic).`);
  }

  // AC6: Report JSDoc inferences
  if (stats.jsdocInferred > 0) {
    console.log(`📝 Inferred ${stats.jsdocInferred} types from JSDoc annotations (AC6: JS project support).`);
  }

  console.log(`📊 Found: ${stats.tsInterfaces} TS interfaces, ${stats.zodSchemas} Zod schemas, ` +
    `${stats.dbMigrations} DB migrations, ${stats.componentProps} component props`);

  // Step 3: Generate mocks
  console.log(`🏭 Generating mock objects...`);
  const interfacesToMock = options.skipMigrations
    ? interfaces.filter((i) => i.kind !== 'db-migration')
    : interfaces;
  const mocks = generateMockObjects(interfacesToMock);
  console.log(`✅ Generated ${mocks.length} mock factories.`);

  // Step 4: Write lock manifest
  console.log(`📁 Writing lock manifest...`);
  const manifest = writeLockManifest(
    epicId, interfaces, mocks, projectRoot,
    options.outputBaseDir,
  );

  const outputDir = path.join(
    options.outputBaseDir || path.join(projectRoot, '_iwish-output'),
    `${LOCK_DIR_PREFIX}${epicId}`,
  );

  console.log(`\n🔒 Interface Lock Gate activated for Epic ${epicId}:`);
  console.log(`   📂 Output: ${outputDir}`);
  console.log(`   📄 Contracts: ${manifest.totalContracts}`);
  console.log(`   🏭 Mocks: ${manifest.totalMocks}`);
  console.log(`   🗄️  Migrations: ${manifest.totalMigrations}`);
  console.log(`   🔐 Files locked: ${manifest.files.length}`);

  return {
    epicId,
    success: true,
    outputDir,
    manifest,
    collectStats: stats,
    mockStats: {
      generated: mocks.length,
      skipped: interfaces.length - interfacesToMock.length,
    },
  };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (require.main === module) {
  const epicId = process.argv[2];
  if (!epicId) {
    console.error('Usage: interface-lock <epicId> [projectRoot] [--force]');
    process.exit(1);
  }

  const projectRoot = process.argv[3] || process.cwd();
  const force = process.argv.includes('--force');

  activateInterfaceLockGate(epicId, { projectRoot, force })
    .then(() => {
      process.exit(0);
    })
    .catch((err: Error) => {
      console.error(`\n❌ Interface Lock Gate failed: ${err.message}`);
      process.exit(1);
    });
}
