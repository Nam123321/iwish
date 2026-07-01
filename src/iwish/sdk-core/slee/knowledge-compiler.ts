import { ExecutionLog, Learning, ISleeDataStore } from './types';
import * as crypto from 'crypto';

export class KnowledgeCompiler {
  private readonly store: ISleeDataStore;

  constructor(store: ISleeDataStore) {
    this.store = store;
  }

  public async compile(log: ExecutionLog): Promise<Learning | null> {
    console.log(`[KnowledgeCompiler] Compiling log ${log.id}...`);
    
    // Deduplication Hash
    const hashInput = `${log.error_message}||${this.truncateStack(log.stack_trace)}`;
    const hash = crypto.createHash('md5').update(hashInput).digest('hex');

    const existing = await this.store.findLearningByHash(hash);
    if (existing) {
      console.log(`[KnowledgeCompiler] Duplicate detected (hash: ${hash}). Skipping.`);
      await this.store.updateLogStatus(log.id, 'IGNORED');
      return null;
    }

    // Simulate async LLM compilation of Root Cause
    // In reality, this would also be a real LLM call like LLMEnricherService
    const learning: Learning = {
      id: crypto.randomUUID(),
      execution_log_id: log.id,
      root_cause_analysis: `Analyzed root cause for: ${log.error_message}`,
      resolution_strategy: `Proposed fix based on stack trace hash ${hash}`,
      tags: [`hash:${hash}`, 'auto-compiled'],
      created_at: new Date().toISOString()
    };

    await this.store.saveLearning(learning);
    await this.store.updateLogStatus(log.id, 'PROCESSED');
    
    console.log(`[KnowledgeCompiler] Generated Learning ${learning.id}`);
    return learning;
  }

  private truncateStack(stack: string): string {
    // Edge Case Guardian: Prevent OOM on giant stack traces
    if (!stack) return '';
    return stack.length > 500 ? stack.substring(0, 500) : stack;
  }
}
