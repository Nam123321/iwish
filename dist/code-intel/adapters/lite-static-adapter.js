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
exports.LiteStaticAdapter = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const DEFAULT_IGNORE = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.next',
    '.nuxt',
    '.turbo',
    '__pycache__',
]);
const file_scanner_1 = require("../file-scanner");
class LiteStaticAdapter {
    adapterName = 'lite-static';
    async isAvailable() {
        return true;
    }
    async queryTechnicalGraph(projectRoot) {
        const files = await this.enumerateSourceFilesAsync(projectRoot);
        const nodes = [];
        const edges = [];
        const fileSet = new Set(files);
        await (0, file_scanner_1.limitConcurrency)(files, 30, async (filePath) => {
            const relativePath = path.relative(projectRoot, filePath);
            const nodeId = relativePath;
            nodes.push({
                id: nodeId,
                label: path.basename(filePath),
                path: relativePath,
                type: 'file',
            });
            const content = await this.readFileSafeAsync(filePath);
            if (!content) {
                return;
            }
            const importedPaths = this.parseImports(content);
            for (const importPath of importedPaths) {
                const resolved = this.resolveImportPath(filePath, importPath, projectRoot, fileSet);
                if (resolved) {
                    const targetId = path.relative(projectRoot, resolved);
                    edges.push({
                        from: nodeId,
                        to: targetId,
                        type: 'imports',
                        label: importPath,
                    });
                }
            }
        });
        return { nodes, edges };
    }
    async enumerateSourceFilesAsync(projectRoot) {
        const files = [];
        const visit = async (directory) => {
            let entries;
            try {
                entries = (await fs.readdir(directory, { withFileTypes: true }));
            }
            catch {
                return;
            }
            const promises = entries.map(async (entry) => {
                if (DEFAULT_IGNORE.has(entry.name)) {
                    return;
                }
                const fullPath = path.join(directory, entry.name);
                if (entry.isDirectory()) {
                    await visit(fullPath);
                }
                else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
                    files.push(fullPath);
                }
            });
            await Promise.all(promises);
        };
        await visit(projectRoot);
        return files;
    }
    async readFileSafeAsync(filePath) {
        try {
            return await fs.readFile(filePath, 'utf8');
        }
        catch {
            return null;
        }
    }
    parseImports(content) {
        const results = [];
        // Match: import ... from '...' / import '...'
        const esImportRegex = /(?:import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"])/g;
        let match;
        while ((match = esImportRegex.exec(content)) !== null) {
            if (match[1]) {
                results.push(match[1]);
            }
        }
        // Match: require('...')
        const requireRegex = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
        while ((match = requireRegex.exec(content)) !== null) {
            results.push(match[1]);
        }
        // Match: export ... from '...'
        const reExportRegex = /export\s+(?:\{[^}]*\}|\*)\s+from\s+['"]([^'"]+)['"]/g;
        while ((match = reExportRegex.exec(content)) !== null) {
            results.push(match[1]);
        }
        return results;
    }
    resolveImportPath(sourceFile, importPath, projectRoot, fileSet) {
        // Skip external (node_modules) imports
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
            return null;
        }
        const sourceDir = path.dirname(sourceFile);
        const basePath = path.resolve(sourceDir, importPath);
        // Try exact match
        if (fileSet.has(basePath)) {
            return basePath;
        }
        // Try with extensions
        for (const ext of SOURCE_EXTENSIONS) {
            const withExt = basePath + ext;
            if (fileSet.has(withExt)) {
                return withExt;
            }
        }
        // Try index files
        for (const ext of SOURCE_EXTENSIONS) {
            const indexPath = path.join(basePath, `index${ext}`);
            if (fileSet.has(indexPath)) {
                return indexPath;
            }
        }
        return null;
    }
}
exports.LiteStaticAdapter = LiteStaticAdapter;
