import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  ISleeDataStore, 
  ExecutionLog, 
  Learning, 
  LinterRule,
  ExecutionStatus
} from './types';

export class FileSystemSleeStore implements ISleeDataStore {
  private readonly dataDir: string;
  private readonly logsFile: string;
  private readonly learningsFile: string;
  private readonly rulesFile: string;

  constructor(baseDir: string = './_iwish-output/slee-data') {
    this.dataDir = baseDir;
    this.logsFile = path.join(this.dataDir, 'execution_logs.json');
    this.learningsFile = path.join(this.dataDir, 'learnings.json');
    this.rulesFile = path.join(this.dataDir, 'linter_rules.json');
  }

  public async init(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    await this.ensureFile(this.logsFile);
    await this.ensureFile(this.learningsFile);
    await this.ensureFile(this.rulesFile);
  }

  private async ensureFile(filePath: string): Promise<void> {
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, '[]', 'utf-8');
    }
  }

  private async readCollection<T>(filePath: string): Promise<T[]> {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as T[];
    } catch (error) {
      console.error(`Failed to read collection from ${filePath}`, error);
      return [];
    }
  }

  private async writeCollection<T>(filePath: string, collection: T[]): Promise<void> {
    // In a real DB, this is handled by locks/transactions. 
    // Here we just write the whole array back safely.
    await fs.writeFile(filePath, JSON.stringify(collection, null, 2), 'utf-8');
  }

  public async saveExecutionLog(log: ExecutionLog): Promise<void> {
    const logs = await this.readCollection<ExecutionLog>(this.logsFile);
    const existingIndex = logs.findIndex(l => l.id === log.id);
    if (existingIndex >= 0) {
      logs[existingIndex] = log;
    } else {
      logs.push(log);
    }
    await this.writeCollection(this.logsFile, logs);
  }

  public async saveLearning(learning: Learning): Promise<void> {
    const learnings = await this.readCollection<Learning>(this.learningsFile);
    learnings.push(learning);
    await this.writeCollection(this.learningsFile, learnings);
  }

  public async saveLinterRule(rule: LinterRule): Promise<void> {
    const rules = await this.readCollection<LinterRule>(this.rulesFile);
    rules.push(rule);
    await this.writeCollection(this.rulesFile, rules);
  }

  public async findLearningByHash(hash: string): Promise<Learning | null> {
    // For simplicity, we assume 'hash' is stored in a tag or we can match the execution log.
    // In our actual implementation, the hash could be the learning's ID or stored in tags.
    const learnings = await this.readCollection<Learning>(this.learningsFile);
    const found = learnings.find(l => l.tags.includes(`hash:${hash}`));
    return found || null;
  }

  public async findUnprocessedLogs(): Promise<ExecutionLog[]> {
    const logs = await this.readCollection<ExecutionLog>(this.logsFile);
    return logs.filter(log => log.status === 'UNPROCESSED');
  }

  public async updateLogStatus(id: string, status: ExecutionStatus): Promise<void> {
    const logs = await this.readCollection<ExecutionLog>(this.logsFile);
    const log = logs.find(l => l.id === id);
    if (log) {
      log.status = status;
      await this.writeCollection(this.logsFile, logs);
    }
  }
}
