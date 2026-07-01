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
exports.FileSystemSleeStore = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class FileSystemSleeStore {
    dataDir;
    logsFile;
    learningsFile;
    rulesFile;
    constructor(baseDir = './_iwish-output/slee-data') {
        this.dataDir = baseDir;
        this.logsFile = path.join(this.dataDir, 'execution_logs.json');
        this.learningsFile = path.join(this.dataDir, 'learnings.json');
        this.rulesFile = path.join(this.dataDir, 'linter_rules.json');
    }
    async init() {
        await fs.mkdir(this.dataDir, { recursive: true });
        await this.ensureFile(this.logsFile);
        await this.ensureFile(this.learningsFile);
        await this.ensureFile(this.rulesFile);
    }
    async ensureFile(filePath) {
        try {
            await fs.access(filePath);
        }
        catch {
            await fs.writeFile(filePath, '[]', 'utf-8');
        }
    }
    async readCollection(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error(`Failed to read collection from ${filePath}`, error);
            return [];
        }
    }
    async writeCollection(filePath, collection) {
        // In a real DB, this is handled by locks/transactions. 
        // Here we just write the whole array back safely.
        await fs.writeFile(filePath, JSON.stringify(collection, null, 2), 'utf-8');
    }
    async saveExecutionLog(log) {
        const logs = await this.readCollection(this.logsFile);
        const existingIndex = logs.findIndex(l => l.id === log.id);
        if (existingIndex >= 0) {
            logs[existingIndex] = log;
        }
        else {
            logs.push(log);
        }
        await this.writeCollection(this.logsFile, logs);
    }
    async saveLearning(learning) {
        const learnings = await this.readCollection(this.learningsFile);
        learnings.push(learning);
        await this.writeCollection(this.learningsFile, learnings);
    }
    async saveLinterRule(rule) {
        const rules = await this.readCollection(this.rulesFile);
        rules.push(rule);
        await this.writeCollection(this.rulesFile, rules);
    }
    async findLearningByHash(hash) {
        // For simplicity, we assume 'hash' is stored in a tag or we can match the execution log.
        // In our actual implementation, the hash could be the learning's ID or stored in tags.
        const learnings = await this.readCollection(this.learningsFile);
        const found = learnings.find(l => l.tags.includes(`hash:${hash}`));
        return found || null;
    }
    async findUnprocessedLogs() {
        const logs = await this.readCollection(this.logsFile);
        return logs.filter(log => log.status === 'UNPROCESSED');
    }
    async updateLogStatus(id, status) {
        const logs = await this.readCollection(this.logsFile);
        const log = logs.find(l => l.id === id);
        if (log) {
            log.status = status;
            await this.writeCollection(this.logsFile, logs);
        }
    }
}
exports.FileSystemSleeStore = FileSystemSleeStore;
