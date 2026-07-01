import { IEventDispatcher } from '../types/event-dispatcher';
import { ISleeDataStore, ExecutionLog } from './types';
import { KnowledgeCompiler } from './knowledge-compiler';
import { LLMEnricherService } from './llm-enricher-service';
import * as crypto from 'crypto';

export class SleeOrchestrator {
  private readonly dispatcher: IEventDispatcher;
  private readonly store: ISleeDataStore;
  private readonly compiler: KnowledgeCompiler;
  private readonly enricher: LLMEnricherService;

  constructor(dispatcher: IEventDispatcher, store: ISleeDataStore) {
    this.dispatcher = dispatcher;
    this.store = store;
    this.compiler = new KnowledgeCompiler(store);
    this.enricher = new LLMEnricherService();

    this.registerListeners();
  }

  private registerListeners() {
    this.dispatcher.on('ExecutionFailed', this.handleExecutionFailed.bind(this));
  }

  /**
   * Main entry point for the SLEE pipeline.
   * Handles errors asynchronously to avoid blocking the main execution thread (NFR1).
   */
  private async handleExecutionFailed(errorData: { taskId: string; error: Error; context?: any }) {
    // 1. Create and Save ExecutionLog
    const log: ExecutionLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      task_id: errorData.taskId,
      error_message: errorData.error.message,
      stack_trace: errorData.error.stack || '',
      context_data: errorData.context || {},
      status: 'UNPROCESSED'
    };

    try {
      await this.store.saveExecutionLog(log);
      
      // Fire-and-forget the compilation pipeline to avoid blocking
      Promise.resolve().then(() => this.runPipeline(log)).catch(err => {
        console.error('[SleeOrchestrator] Fatal error in SLEE background pipeline', err);
      });

    } catch (saveError) {
      console.error('[SleeOrchestrator] Failed to save ExecutionLog', saveError);
    }
  }

  private async runPipeline(log: ExecutionLog) {
    // 2. Knowledge Compiler (extracts root cause, dedupes)
    const learning = await this.compiler.compile(log);
    if (!learning) {
      // Was duplicate or ignored
      return;
    }

    // 3. Knowledge Enricher (generates linter rule via real LLM HTTP call)
    try {
      console.log(`[SleeOrchestrator] Enriching learning ${learning.id}...`);
      const rule = await this.enricher.generateLinterRule(learning);
      
      // 4. Save Rule in PENDING state
      await this.store.saveLinterRule(rule);
      console.log(`[SleeOrchestrator] Successfully generated LinterRule ${rule.id} [PENDING]`);
    } catch (enrichError) {
      console.error(`[SleeOrchestrator] Failed to enrich learning ${learning.id}`, enrichError);
    }
  }
}
