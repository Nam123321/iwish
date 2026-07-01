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
exports.KnowledgeCompiler = void 0;
const crypto = __importStar(require("crypto"));
class KnowledgeCompiler {
    store;
    constructor(store) {
        this.store = store;
    }
    async compile(log) {
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
        const learning = {
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
    truncateStack(stack) {
        // Edge Case Guardian: Prevent OOM on giant stack traces
        if (!stack)
            return '';
        return stack.length > 500 ? stack.substring(0, 500) : stack;
    }
}
exports.KnowledgeCompiler = KnowledgeCompiler;
