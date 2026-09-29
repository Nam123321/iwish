"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * interface-lock.test.ts — Unit tests for Story 10.2
 */
const vitest_1 = require("vitest");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const interface_lock_1 = require("./interface-lock");
const TEMP_DIR = path.join(__dirname, '..', '..', '_test-temp-il');
function createTSFile(relPath, content) {
    const absPath = path.join(TEMP_DIR, relPath);
    fs.ensureDirSync(path.dirname(absPath));
    fs.writeFileSync(absPath, content, 'utf8');
}
(0, vitest_1.describe)('interface-lock', () => {
    (0, vitest_1.beforeEach)(() => {
        fs.ensureDirSync(TEMP_DIR);
        fs.ensureDirSync(path.join(TEMP_DIR, 'src'));
    });
    (0, vitest_1.afterEach)(() => {
        fs.removeSync(TEMP_DIR);
    });
    (0, vitest_1.describe)('collectEpicInterfaces', () => {
        (0, vitest_1.it)('should extract TypeScript interfaces', () => {
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
            const interfaces = (0, interface_lock_1.collectEpicInterfaces)('1', null, TEMP_DIR);
            const tsInterfaces = interfaces.filter((i) => i.kind === 'typescript-interface');
            (0, vitest_1.expect)(tsInterfaces.length).toBeGreaterThanOrEqual(2);
            const user = tsInterfaces.find((i) => i.name === 'User');
            (0, vitest_1.expect)(user).toBeDefined();
            (0, vitest_1.expect)(user.properties.length).toBeGreaterThanOrEqual(2);
            (0, vitest_1.expect)(user.properties.find((p) => p.name === 'email')?.optional).toBe(true);
        });
        (0, vitest_1.it)('should extract Zod schemas', () => {
            createTSFile('src/schemas.ts', `
import { z } from 'zod';
export const UserSchema = z.object({
  name: z.string(),
  age: z.number().optional(),
})
`);
            const interfaces = (0, interface_lock_1.collectEpicInterfaces)('1', null, TEMP_DIR);
            const zodSchemas = interfaces.filter((i) => i.kind === 'zod-schema');
            (0, vitest_1.expect)(zodSchemas.length).toBeGreaterThanOrEqual(1);
            (0, vitest_1.expect)(zodSchemas[0].name).toBe('UserSchema');
        });
        (0, vitest_1.it)('should handle empty src directory', () => {
            const interfaces = (0, interface_lock_1.collectEpicInterfaces)('1', null, TEMP_DIR);
            (0, vitest_1.expect)(interfaces).toEqual([]);
        });
        (0, vitest_1.it)('should skip node_modules', () => {
            createTSFile('node_modules/lib/index.ts', `
export interface ShouldBeSkipped { x: number; }
`);
            createTSFile('src/app.ts', `
export interface ShouldBeIncluded { y: number; }
`);
            const interfaces = (0, interface_lock_1.collectEpicInterfaces)('1', null, TEMP_DIR);
            (0, vitest_1.expect)(interfaces.find((i) => i.name === 'ShouldBeSkipped')).toBeUndefined();
            (0, vitest_1.expect)(interfaces.find((i) => i.name === 'ShouldBeIncluded')).toBeDefined();
        });
    });
    (0, vitest_1.describe)('generateMockObjects', () => {
        (0, vitest_1.it)('should generate mock factories for interfaces', () => {
            const interfaces = [
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
            const mocks = (0, interface_lock_1.generateMockObjects)(interfaces);
            (0, vitest_1.expect)(mocks).toHaveLength(1);
            (0, vitest_1.expect)(mocks[0].interfaceName).toBe('User');
            (0, vitest_1.expect)(mocks[0].factoryCode).toContain('createUser');
            (0, vitest_1.expect)(mocks[0].factoryCode).toContain('overrides');
        });
        (0, vitest_1.it)('should generate correct mock values by property name', () => {
            const interfaces = [
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
            const mocks = (0, interface_lock_1.generateMockObjects)(interfaces);
            (0, vitest_1.expect)(mocks[0].factoryCode).toContain('test@example.com');
            (0, vitest_1.expect)(mocks[0].factoryCode).toContain('true');
        });
    });
    (0, vitest_1.describe)('writeLockManifest', () => {
        (0, vitest_1.it)('should create lock directory with all required files', () => {
            const interfaces = [
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
            const mocks = (0, interface_lock_1.generateMockObjects)(interfaces);
            const manifest = (0, interface_lock_1.writeLockManifest)('1', interfaces, mocks, TEMP_DIR);
            // Check files exist
            const lockDir = path.join(TEMP_DIR, '_iwish-output', 'interface-lock-epic-1');
            (0, vitest_1.expect)(fs.existsSync(path.join(lockDir, 'contracts.ts'))).toBe(true);
            (0, vitest_1.expect)(fs.existsSync(path.join(lockDir, 'mocks.ts'))).toBe(true);
            (0, vitest_1.expect)(fs.existsSync(path.join(lockDir, 'migrations.sql'))).toBe(true);
            (0, vitest_1.expect)(fs.existsSync(path.join(lockDir, 'lock-manifest.json'))).toBe(true);
            // Check manifest content
            (0, vitest_1.expect)(manifest.epicId).toBe('1');
            (0, vitest_1.expect)(manifest.totalContracts).toBe(1);
            (0, vitest_1.expect)(manifest.totalMocks).toBe(1);
            (0, vitest_1.expect)(manifest.manifestHash).toBeTruthy();
            (0, vitest_1.expect)(manifest.files.length).toBeGreaterThanOrEqual(3);
        });
    });
    (0, vitest_1.describe)('checkWriteLock', () => {
        (0, vitest_1.it)('should block writes to locked files', () => {
            // Set up lock directory
            const interfaces = [{
                    name: 'Locked', kind: 'typescript-interface', sourceFile: 'src/x.ts',
                    lineNumber: 1, sourceCode: '', properties: [], relevantStories: [],
                }];
            const mocks = (0, interface_lock_1.generateMockObjects)(interfaces);
            (0, interface_lock_1.writeLockManifest)('1', interfaces, mocks, TEMP_DIR);
            const result = (0, interface_lock_1.checkWriteLock)('_iwish-output/interface-lock-epic-1/contracts.ts', '1', TEMP_DIR);
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('locked');
        });
        (0, vitest_1.it)('should allow writes to unlocked files', () => {
            const interfaces = [{
                    name: 'X', kind: 'typescript-interface', sourceFile: 'src/x.ts',
                    lineNumber: 1, sourceCode: '', properties: [], relevantStories: [],
                }];
            (0, interface_lock_1.writeLockManifest)('1', interfaces, [], TEMP_DIR);
            const result = (0, interface_lock_1.checkWriteLock)('src/other-file.ts', '1', TEMP_DIR);
            (0, vitest_1.expect)(result.allowed).toBe(true);
        });
        (0, vitest_1.it)('should allow all writes when no manifest exists', () => {
            const result = (0, interface_lock_1.checkWriteLock)('anything.ts', '99', TEMP_DIR);
            (0, vitest_1.expect)(result.allowed).toBe(true);
        });
    });
    (0, vitest_1.describe)('verifyLockIntegrity', () => {
        (0, vitest_1.it)('should detect tampered files', () => {
            const interfaces = [{
                    name: 'T', kind: 'typescript-interface', sourceFile: 'src/x.ts',
                    lineNumber: 1, sourceCode: '', properties: [], relevantStories: [],
                }];
            (0, interface_lock_1.writeLockManifest)('1', interfaces, [], TEMP_DIR);
            // Tamper with contracts.ts
            const contractsPath = path.join(TEMP_DIR, '_iwish-output', 'interface-lock-epic-1', 'contracts.ts');
            fs.appendFileSync(contractsPath, '\n// tampered!');
            const integrity = (0, interface_lock_1.verifyLockIntegrity)('1', TEMP_DIR);
            (0, vitest_1.expect)(integrity.intact).toBe(false);
            (0, vitest_1.expect)(integrity.tamperedFiles.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should pass when files are intact', () => {
            const interfaces = [{
                    name: 'T', kind: 'typescript-interface', sourceFile: 'src/x.ts',
                    lineNumber: 1, sourceCode: '', properties: [], relevantStories: [],
                }];
            (0, interface_lock_1.writeLockManifest)('1', interfaces, [], TEMP_DIR);
            const integrity = (0, interface_lock_1.verifyLockIntegrity)('1', TEMP_DIR);
            (0, vitest_1.expect)(integrity.intact).toBe(true);
        });
    });
});
