/**
 * interface-lock.test.ts — Unit tests for Story 10.2
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import {
  collectEpicInterfaces,
  generateMockObjects,
  writeLockManifest,
  checkWriteLock,
  verifyLockIntegrity,
  activateInterfaceLockGate,
  type CollectedInterface,
  type LockManifest,
} from './interface-lock';

const TEMP_DIR = path.join(__dirname, '..', '..', '_test-temp-il');

function createTSFile(relPath: string, content: string): void {
  const absPath = path.join(TEMP_DIR, relPath);
  fs.ensureDirSync(path.dirname(absPath));
  fs.writeFileSync(absPath, content, 'utf8');
}

describe('interface-lock', () => {
  beforeEach(() => {
    fs.ensureDirSync(TEMP_DIR);
    fs.ensureDirSync(path.join(TEMP_DIR, 'src'));
  });

  afterEach(() => {
    fs.removeSync(TEMP_DIR);
  });

  describe('collectEpicInterfaces', () => {
    it('should extract TypeScript interfaces', () => {
      createTSFile('src/models.ts', `
export interface User {
  id: string;
  name: string;
  email?: string;
}

export interface Post {
  title: string;
  content: string;
  authorId: string;
}
`);

      const interfaces = collectEpicInterfaces('1', null, TEMP_DIR);
      const tsInterfaces = interfaces.filter((i) => i.kind === 'typescript-interface');

      expect(tsInterfaces.length).toBeGreaterThanOrEqual(2);

      const user = tsInterfaces.find((i) => i.name === 'User');
      expect(user).toBeDefined();
      expect(user!.properties.length).toBeGreaterThanOrEqual(2);
      expect(user!.properties.find((p) => p.name === 'email')?.optional).toBe(true);
    });

    it('should extract Zod schemas', () => {
      createTSFile('src/schemas.ts', `
import { z } from 'zod';
export const UserSchema = z.object({
  name: z.string(),
  age: z.number().optional(),
})
`);

      const interfaces = collectEpicInterfaces('1', null, TEMP_DIR);
      const zodSchemas = interfaces.filter((i) => i.kind === 'zod-schema');

      expect(zodSchemas.length).toBeGreaterThanOrEqual(1);
      expect(zodSchemas[0].name).toBe('UserSchema');
    });

    it('should handle empty src directory', () => {
      const interfaces = collectEpicInterfaces('1', null, TEMP_DIR);
      expect(interfaces).toEqual([]);
    });

    it('should skip node_modules', () => {
      createTSFile('node_modules/lib/index.ts', `
export interface ShouldBeSkipped { x: number; }
`);
      createTSFile('src/app.ts', `
export interface ShouldBeIncluded { y: number; }
`);

      const interfaces = collectEpicInterfaces('1', null, TEMP_DIR);
      expect(interfaces.find((i) => i.name === 'ShouldBeSkipped')).toBeUndefined();
      expect(interfaces.find((i) => i.name === 'ShouldBeIncluded')).toBeDefined();
    });
  });

  describe('generateMockObjects', () => {
    it('should generate mock factories for interfaces', () => {
      const interfaces: CollectedInterface[] = [
        {
          name: 'User',
          kind: 'typescript-interface',
          sourceFile: 'src/models.ts',
          lineNumber: 1,
          sourceCode: 'interface User { id: string; name: string; }',
          properties: [
            { name: 'id', type: 'string', optional: false },
            { name: 'name', type: 'string', optional: false },
          ],
          relevantStories: [],
        },
      ];

      const mocks = generateMockObjects(interfaces);
      expect(mocks).toHaveLength(1);
      expect(mocks[0].interfaceName).toBe('User');
      expect(mocks[0].factoryCode).toContain('createUser');
      expect(mocks[0].factoryCode).toContain('overrides');
    });

    it('should generate correct mock values by property name', () => {
      const interfaces: CollectedInterface[] = [
        {
          name: 'Config',
          kind: 'typescript-interface',
          sourceFile: 'src/config.ts',
          lineNumber: 1,
          sourceCode: '',
          properties: [
            { name: 'email', type: 'string', optional: false },
            { name: 'count', type: 'number', optional: false },
            { name: 'isEnabled', type: 'boolean', optional: false },
          ],
          relevantStories: [],
        },
      ];

      const mocks = generateMockObjects(interfaces);
      expect(mocks[0].factoryCode).toContain('test@example.com');
      expect(mocks[0].factoryCode).toContain('true');
    });
  });

  describe('writeLockManifest', () => {
    it('should create lock directory with all required files', () => {
      const interfaces: CollectedInterface[] = [
        {
          name: 'TestInterface',
          kind: 'typescript-interface',
          sourceFile: 'src/test.ts',
          lineNumber: 1,
          sourceCode: 'interface TestInterface { x: number; }',
          properties: [{ name: 'x', type: 'number', optional: false }],
          relevantStories: [],
        },
      ];
      const mocks = generateMockObjects(interfaces);

      const manifest = writeLockManifest('1', interfaces, mocks, TEMP_DIR);

      // Check files exist
      const lockDir = path.join(TEMP_DIR, '_iwish-output', 'interface-lock-epic-1');
      expect(fs.existsSync(path.join(lockDir, 'contracts.ts'))).toBe(true);
      expect(fs.existsSync(path.join(lockDir, 'mocks.ts'))).toBe(true);
      expect(fs.existsSync(path.join(lockDir, 'migrations.sql'))).toBe(true);
      expect(fs.existsSync(path.join(lockDir, 'lock-manifest.json'))).toBe(true);

      // Check manifest content
      expect(manifest.epicId).toBe('1');
      expect(manifest.totalContracts).toBe(1);
      expect(manifest.totalMocks).toBe(1);
      expect(manifest.manifestHash).toBeTruthy();
      expect(manifest.files.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('checkWriteLock', () => {
    it('should block writes to locked files', () => {
      // Set up lock directory
      const interfaces: CollectedInterface[] = [{
        name: 'Locked', kind: 'typescript-interface', sourceFile: 'src/x.ts',
        lineNumber: 1, sourceCode: '', properties: [], relevantStories: [],
      }];
      const mocks = generateMockObjects(interfaces);
      writeLockManifest('1', interfaces, mocks, TEMP_DIR);

      const result = checkWriteLock(
        '_iwish-output/interface-lock-epic-1/contracts.ts', '1', TEMP_DIR,
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('locked');
    });

    it('should allow writes to unlocked files', () => {
      const interfaces: CollectedInterface[] = [{
        name: 'X', kind: 'typescript-interface', sourceFile: 'src/x.ts',
        lineNumber: 1, sourceCode: '', properties: [], relevantStories: [],
      }];
      writeLockManifest('1', interfaces, [], TEMP_DIR);

      const result = checkWriteLock('src/other-file.ts', '1', TEMP_DIR);
      expect(result.allowed).toBe(true);
    });

    it('should allow all writes when no manifest exists', () => {
      const result = checkWriteLock('anything.ts', '99', TEMP_DIR);
      expect(result.allowed).toBe(true);
    });
  });

  describe('verifyLockIntegrity', () => {
    it('should detect tampered files', () => {
      const interfaces: CollectedInterface[] = [{
        name: 'T', kind: 'typescript-interface', sourceFile: 'src/x.ts',
        lineNumber: 1, sourceCode: '', properties: [], relevantStories: [],
      }];
      writeLockManifest('1', interfaces, [], TEMP_DIR);

      // Tamper with contracts.ts
      const contractsPath = path.join(TEMP_DIR, '_iwish-output', 'interface-lock-epic-1', 'contracts.ts');
      fs.appendFileSync(contractsPath, '\n// tampered!');

      const integrity = verifyLockIntegrity('1', TEMP_DIR);
      expect(integrity.intact).toBe(false);
      expect(integrity.tamperedFiles.length).toBeGreaterThan(0);
    });

    it('should pass when files are intact', () => {
      const interfaces: CollectedInterface[] = [{
        name: 'T', kind: 'typescript-interface', sourceFile: 'src/x.ts',
        lineNumber: 1, sourceCode: '', properties: [], relevantStories: [],
      }];
      writeLockManifest('1', interfaces, [], TEMP_DIR);

      const integrity = verifyLockIntegrity('1', TEMP_DIR);
      expect(integrity.intact).toBe(true);
    });
  });
});
