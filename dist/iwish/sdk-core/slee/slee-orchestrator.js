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
exports.SleeOrchestrator = void 0;
const knowledge_compiler_1 = require("./knowledge-compiler");
const llm_enricher_service_1 = require("./llm-enricher-service");
const crypto = __importStar(require("crypto"));
class SleeOrchestrator {
    dispatcher;
    store;
    compiler;
    enricher;
    constructor(dispatcher, store) {
        this.dispatcher = dispatcher;
        this.store = store;
        this.compiler = new knowledge_compiler_1.KnowledgeCompiler(store);
        this.enricher = new llm_enricher_service_1.LLMEnricherService();
        this.registerListeners();
    }
    registerListeners() {
        this.dispatcher.on('ExecutionFailed', this.handleExecutionFailed.bind(this));
    }
    /**
     * Main entry point for the SLEE pipeline.
     * Handles errors asynchronously to avoid blocking the main execution thread (NFR1).
     */
    async handleExecutionFailed(errorData) {
        // 1. Create and Save ExecutionLog
        const log = {
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
        }
        catch (saveError) {
            console.error('[SleeOrchestrator] Failed to save ExecutionLog', saveError);
        }
    }
    async runPipeline(log) {
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
        }
        catch (enrichError) {
            console.error(`[SleeOrchestrator] Failed to enrich learning ${learning.id}`, enrichError);
        }
    }
}
exports.SleeOrchestrator = SleeOrchestrator;
