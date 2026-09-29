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
exports.restoreQueueState = restoreQueueState;
exports.executePreDebate = executePreDebate;
exports.logAutoResolution = logAutoResolution;
exports.submitToPromptQueue = submitToPromptQueue;
exports.displayNextPrompt = displayNextPrompt;
exports.handlePromptTimeout = handlePromptTimeout;
exports.getTimeoutMs = getTimeoutMs;
exports.getMaxAttempts = getMaxAttempts;
exports.routeUserResponse = routeUserResponse;
exports.partialHalt = partialHalt;
exports.resumeAgent = resumeAgent;
exports.getAgentHaltStates = getAgentHaltStates;
exports.isAgentHalted = isAgentHalted;
exports.generateDecisionsSummary = generateDecisionsSummary;
exports.getQueueLength = getQueueLength;
exports.getQueueSnapshot = getQueueSnapshot;
exports.clearQueue = clearQueue;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const constants_1 = require("./constants");
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes per attempt
const MAX_ATTEMPTS = 2;
// ---------------------------------------------------------------------------
// In-memory state + persistence helpers
// ---------------------------------------------------------------------------
let promptQueue = [];
let agentHaltStates = new Map();
let queueIdCounter = 0;
function nowIso() {
    return new Date().toISOString();
}
function generateQueueId() {
    queueIdCounter += 1;
    return `pq-${Date.now()}-${queueIdCounter}`;
}
/**
 * Resolves the path to the queue state persistence file.
 */
function getQueueStatePath(projectRoot) {
    return path.join(projectRoot, '_iwish', 'runtime', 'prompt-queue-state.json');
}
/**
 * Resolves the decisions log file path for a given epic.
 */
function getDecisionsLogPath(projectRoot, epicId) {
    return path.join(projectRoot, constants_1.I_WISH_OUTPUT_DIR, `decisions-log-epic-${epicId}.json`);
}
/**
 * Persist current in-memory queue state to a JSON file for crash recovery.
 */
async function persistQueueState(projectRoot) {
    const statePath = getQueueStatePath(projectRoot);
    const state = {
        queue: [...promptQueue],
        agentStates: Array.from(agentHaltStates.values()),
        lastUpdated: nowIso(),
    };
    await fs.ensureDir(path.dirname(statePath));
    await fs.writeJson(statePath, state, { spaces: 2 });
}
/**
 * Restore queue state from persisted JSON file on startup.
 */
async function restoreQueueState(projectRoot) {
    const statePath = getQueueStatePath(projectRoot);
    if (!fs.existsSync(statePath)) {
        return;
    }
    try {
        const state = await fs.readJson(statePath);
        promptQueue = state.queue || [];
        agentHaltStates = new Map((state.agentStates || []).map((s) => [s.agentId, s]));
        queueIdCounter = promptQueue.length;
    }
    catch {
        // Corrupted state file — start fresh
        promptQueue = [];
        agentHaltStates = new Map();
    }
}
// ---------------------------------------------------------------------------
// Task 1: executePreDebate
// ---------------------------------------------------------------------------
/**
 * Simulate a 1-round internal debate between agent personas to attempt
 * auto-resolving a question without user intervention.
 *
 * The debate checks each persona's position against the provided project
 * documentation. If all personas converge on the same recommendation with
 * document-backed evidence, the question is considered resolved.
 *
 * @param question - The question requiring a decision.
 * @param storyContext - Context about the story triggering the question.
 * @param relevantDocs - Map of document names to their content for evidence lookup.
 * @returns PreDebateResult indicating whether consensus was reached.
 */
function executePreDebate(question, storyContext, relevantDocs) {
    const personas = [];
    const allEvidence = [];
    const options = [];
    // Scan documents for direct answers to the question
    const questionLower = question.toLowerCase();
    const docNames = Object.keys(relevantDocs);
    for (const docName of docNames) {
        const content = relevantDocs[docName];
        const lines = content.split('\n');
        for (const line of lines) {
            if (line.trim().length === 0)
                continue;
            // Check if any line directly addresses the question keywords
            const questionTokens = questionLower
                .replace(/[?.,!]/g, '')
                .split(/\s+/)
                .filter((t) => t.length > 3);
            const matchCount = questionTokens.filter((token) => line.toLowerCase().includes(token)).length;
            if (matchCount >= Math.ceil(questionTokens.length * 0.4)) {
                allEvidence.push(`[${docName}] ${line.trim()}`);
            }
        }
    }
    // Simulate dev-agent persona
    const devPersona = {
        agentId: 'dev-agent',
        position: allEvidence.length > 0
            ? 'Proceed with documented approach'
            : 'Need clarification from user',
        rationale: allEvidence.length > 0
            ? `Found ${allEvidence.length} supporting evidence lines in project docs.`
            : 'No documentation backing found for this decision.',
        evidence: allEvidence.slice(0, 3),
    };
    personas.push(devPersona);
    // Simulate architect-agent persona
    const architectPersona = {
        agentId: 'architect-agent',
        position: allEvidence.length >= 2
            ? 'Proceed with documented approach'
            : 'Need clarification from user',
        rationale: allEvidence.length >= 2
            ? 'Multiple documentation sources confirm this approach aligns with project architecture.'
            : 'Insufficient documentation coverage to decide confidently.',
        evidence: allEvidence.slice(0, 3),
    };
    personas.push(architectPersona);
    // Determine consensus
    const allAgree = personas.every((p) => p.position === personas[0].position);
    const hasEvidence = allEvidence.length >= 2;
    const resolved = allAgree && hasEvidence;
    // Build options from persona positions
    const uniquePositions = [...new Set(personas.map((p) => p.position))];
    options.push(...uniquePositions);
    if (!options.includes('Defer to user')) {
        options.push('Defer to user');
    }
    const recommendation = resolved
        ? personas[0].position
        : `Pre-debate inconclusive (${personas.filter((p) => p.position === personas[0].position).length}/${personas.length} agree). Escalating to user.`;
    return {
        resolved,
        recommendation: resolved ? personas[0].position : recommendation,
        rationale: resolved
            ? `All ${personas.length} personas reached consensus backed by ${allEvidence.length} document evidence lines.`
            : `Personas disagreed or insufficient evidence (${allEvidence.length} lines found).`,
        evidence: allEvidence.slice(0, 5),
        debateLog: personas,
        options,
    };
}
// ---------------------------------------------------------------------------
// Task 2: logAutoResolution
// ---------------------------------------------------------------------------
/**
 * Write an auto-resolved decision to the decisions log JSON file.
 *
 * Creates or appends to `_iwish-output/decisions-log-epic-{N}.json`.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param storyId - The story ID the decision belongs to.
 * @param question - The question that was auto-resolved.
 * @param rationale - Why the system chose this resolution.
 * @param evidence - Document evidence supporting the decision.
 */
async function logAutoResolution(projectRoot, storyId, question, rationale, evidence) {
    const epicId = extractEpicId(storyId);
    const logPath = getDecisionsLogPath(projectRoot, epicId);
    const entry = {
        storyId,
        question,
        autoResolved: true,
        rationale,
        documentEvidence: evidence,
        timestamp: nowIso(),
    };
    await appendDecisionEntry(logPath, entry);
}
// ---------------------------------------------------------------------------
// Task 3: submitToPromptQueue
// ---------------------------------------------------------------------------
/**
 * Add an unresolved question to the centralized prompt queue.
 *
 * The queue uses FIFO ordering. Each item tracks which sub-agent is waiting
 * so the response can be routed back correctly.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param question - The question to present to the user.
 * @param options - Available answer options from the pre-debate.
 * @param storyId - The story the question belongs to.
 * @param recommendation - The recommended option from pre-debate.
 * @param rationale - Rationale for the recommendation.
 * @param evidence - Supporting evidence.
 * @param waitingAgentId - The sub-agent that is waiting for this response.
 * @returns The queue item ID.
 */
async function submitToPromptQueue(projectRoot, question, options, storyId, recommendation, rationale, evidence, waitingAgentId) {
    const item = {
        id: generateQueueId(),
        storyId,
        question,
        options,
        recommendation,
        rationale,
        evidence,
        waitingAgentId,
        submittedAt: nowIso(),
        attempts: 0,
    };
    promptQueue.push(item);
    await persistQueueState(projectRoot);
    return item.id;
}
/**
 * Dequeue and format the next question for sequential display to the user.
 *
 * Shows story context, options from pre-debate, and recommendation.
 * If the queue is empty, returns a no-op result.
 *
 * @returns DisplayPromptResult with the formatted prompt text.
 */
function displayNextPrompt() {
    if (promptQueue.length === 0) {
        return {
            item: null,
            queueEmpty: true,
            formattedPrompt: '[Prompt Queue] No pending questions.',
        };
    }
    const item = promptQueue[0]; // peek, don't dequeue yet
    item.attempts += 1;
    const lines = [
        '╔══════════════════════════════════════════════════════╗',
        '║          PROMPT QUEUE — USER DECISION NEEDED         ║',
        '╚══════════════════════════════════════════════════════╝',
        '',
        `📋 Story: ${item.storyId}`,
        `🤖 Waiting Agent: ${item.waitingAgentId}`,
        `⏱  Attempt: ${item.attempts}/${MAX_ATTEMPTS}`,
        '',
        `❓ Question:`,
        `   ${item.question}`,
        '',
        `📝 Options:`,
    ];
    item.options.forEach((opt, idx) => {
        const marker = opt === item.recommendation ? ' ⭐ (recommended)' : '';
        lines.push(`   ${idx + 1}. ${opt}${marker}`);
    });
    lines.push('');
    lines.push(`💡 Recommendation: ${item.recommendation}`);
    lines.push(`📄 Rationale: ${item.rationale}`);
    if (item.evidence.length > 0) {
        lines.push('');
        lines.push('📚 Evidence:');
        item.evidence.forEach((e) => lines.push(`   • ${e}`));
    }
    lines.push('');
    lines.push(`⏰ Timeout: ${TIMEOUT_MS / 60000} minutes. Auto-selects recommended option after ${MAX_ATTEMPTS} timeouts.`);
    lines.push('─'.repeat(56));
    return {
        item,
        queueEmpty: false,
        formattedPrompt: lines.join('\n'),
    };
}
/**
 * Handle timeout for the current prompt. If max attempts are reached,
 * auto-selects the recommended option and logs [AUTO-TIMEOUT].
 *
 * @param projectRoot - Absolute path to the project root.
 * @returns Whether auto-select was triggered.
 */
async function handlePromptTimeout(projectRoot) {
    if (promptQueue.length === 0) {
        return { autoSelected: false, item: null };
    }
    const item = promptQueue[0];
    if (item.attempts >= MAX_ATTEMPTS) {
        // Auto-select recommended option
        promptQueue.shift();
        const epicId = extractEpicId(item.storyId);
        const logPath = getDecisionsLogPath(projectRoot, epicId);
        const entry = {
            storyId: item.storyId,
            question: item.question,
            autoResolved: false,
            rationale: `[AUTO-TIMEOUT] User did not respond after ${MAX_ATTEMPTS} attempts (${TIMEOUT_MS / 60000} min each). Auto-selected recommended option.`,
            documentEvidence: item.evidence,
            userDecision: item.recommendation,
            timeout: true,
            timestamp: nowIso(),
        };
        await appendDecisionEntry(logPath, entry);
        await resumeAgent(projectRoot, item.storyId);
        await persistQueueState(projectRoot);
        return { autoSelected: true, item };
    }
    return { autoSelected: false, item };
}
/**
 * Get the timeout duration in milliseconds for a single prompt attempt.
 */
function getTimeoutMs() {
    return TIMEOUT_MS;
}
/**
 * Get the maximum number of timeout attempts before auto-select.
 */
function getMaxAttempts() {
    return MAX_ATTEMPTS;
}
// ---------------------------------------------------------------------------
// Task 5: routeUserResponse
// ---------------------------------------------------------------------------
/**
 * Route the user's response back to the correct sub-agent and log
 * the decision.
 *
 * Removes the answered item from the queue, logs to the decisions log,
 * and resumes the halted agent.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param storyId - The story the response belongs to.
 * @param response - The user's chosen response.
 * @returns The waiting agent ID that should receive the response, or null if not found.
 */
async function routeUserResponse(projectRoot, storyId, response) {
    const itemIndex = promptQueue.findIndex((item) => item.storyId === storyId);
    if (itemIndex === -1) {
        return null;
    }
    const item = promptQueue[itemIndex];
    promptQueue.splice(itemIndex, 1);
    const epicId = extractEpicId(storyId);
    const logPath = getDecisionsLogPath(projectRoot, epicId);
    const entry = {
        storyId: item.storyId,
        question: item.question,
        autoResolved: false,
        rationale: `User selected: "${response}"`,
        documentEvidence: item.evidence,
        userDecision: response,
        timestamp: nowIso(),
    };
    await appendDecisionEntry(logPath, entry);
    await resumeAgent(projectRoot, storyId);
    await persistQueueState(projectRoot);
    return item.waitingAgentId;
}
// ---------------------------------------------------------------------------
// Task 6: partialHalt and resumeAgent
// ---------------------------------------------------------------------------
/**
 * Mark a specific sub-agent as halted while waiting for a user response.
 *
 * Only the agent associated with the given story is halted; all other
 * agents continue running normally.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param storyId - The story whose agent should be halted.
 * @param agentId - Optional explicit agent ID. Inferred from queue if omitted.
 */
async function partialHalt(projectRoot, storyId, agentId) {
    const resolvedAgentId = agentId || findWaitingAgentId(storyId) || `agent-${storyId}`;
    const state = {
        agentId: resolvedAgentId,
        storyId,
        halted: true,
        haltedAt: nowIso(),
        resumedAt: null,
        reason: `Waiting for user response on story ${storyId}`,
    };
    agentHaltStates.set(resolvedAgentId, state);
    await persistQueueState(projectRoot);
}
/**
 * Resume a previously halted sub-agent after receiving a response.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param storyId - The story whose agent should be resumed.
 */
async function resumeAgent(projectRoot, storyId) {
    for (const [agentId, state] of agentHaltStates) {
        if (state.storyId === storyId && state.halted) {
            state.halted = false;
            state.resumedAt = nowIso();
            agentHaltStates.set(agentId, state);
        }
    }
    await persistQueueState(projectRoot);
}
/**
 * Get all current agent halt states.
 *
 * @returns Array of agent halt states.
 */
function getAgentHaltStates() {
    return Array.from(agentHaltStates.values());
}
/**
 * Check whether a specific agent is currently halted.
 *
 * @param agentId - The agent identifier to check.
 * @returns True if the agent is halted.
 */
function isAgentHalted(agentId) {
    const state = agentHaltStates.get(agentId);
    return state?.halted === true;
}
// ---------------------------------------------------------------------------
// Task 7: generateDecisionsSummary
// ---------------------------------------------------------------------------
/**
 * Aggregate all decisions for a given epic into a summary report.
 *
 * Reads the decisions log file and computes statistics including
 * total decisions, auto-resolved count, user-escalated count, timeout
 * count, and average resolution time.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param epicId - The epic identifier (e.g. "10").
 * @returns DecisionsSummary with aggregated statistics.
 */
async function generateDecisionsSummary(projectRoot, epicId) {
    const logPath = getDecisionsLogPath(projectRoot, epicId);
    let entries = [];
    if (fs.existsSync(logPath)) {
        try {
            entries = await fs.readJson(logPath);
            if (!Array.isArray(entries)) {
                entries = [];
            }
        }
        catch {
            entries = [];
        }
    }
    const autoResolved = entries.filter((e) => e.autoResolved);
    const userEscalated = entries.filter((e) => !e.autoResolved && !e.timeout);
    const timeoutAutoSelect = entries.filter((e) => e.timeout === true);
    // Calculate average resolution time based on timestamp differences
    let totalResolutionMs = 0;
    let measurableCount = 0;
    for (let i = 1; i < entries.length; i++) {
        const prev = new Date(entries[i - 1].timestamp).getTime();
        const curr = new Date(entries[i].timestamp).getTime();
        const diff = curr - prev;
        if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
            totalResolutionMs += diff;
            measurableCount += 1;
        }
    }
    return {
        epicId,
        generatedAt: nowIso(),
        totalDecisions: entries.length,
        autoResolvedCount: autoResolved.length,
        userEscalatedCount: userEscalated.length,
        timeoutAutoSelectCount: timeoutAutoSelect.length,
        avgResolutionTimeMs: measurableCount > 0 ? Math.round(totalResolutionMs / measurableCount) : 0,
        entries,
    };
}
// ---------------------------------------------------------------------------
// Queue inspection helpers
// ---------------------------------------------------------------------------
/**
 * Get the current number of items in the prompt queue.
 */
function getQueueLength() {
    return promptQueue.length;
}
/**
 * Get all items currently in the queue (read-only snapshot).
 */
function getQueueSnapshot() {
    return [...promptQueue];
}
/**
 * Clear the entire prompt queue. Use with caution — primarily for testing.
 *
 * @param projectRoot - Absolute path to the project root.
 */
async function clearQueue(projectRoot) {
    promptQueue = [];
    agentHaltStates = new Map();
    queueIdCounter = 0;
    await persistQueueState(projectRoot);
}
// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
/**
 * Extract the epic number from a story ID string.
 * E.g. "10.4" → "10", "story-3.2" → "3"
 */
function extractEpicId(storyId) {
    const match = storyId.match(/(\d+)\.\d+/);
    if (match) {
        return match[1];
    }
    // Fallback: try to extract any leading number
    const numMatch = storyId.match(/(\d+)/);
    return numMatch ? numMatch[1] : 'unknown';
}
/**
 * Append a decision entry to the log file (creates if missing).
 */
async function appendDecisionEntry(logPath, entry) {
    let entries = [];
    await fs.ensureDir(path.dirname(logPath));
    if (fs.existsSync(logPath)) {
        try {
            const existing = await fs.readJson(logPath);
            if (Array.isArray(existing)) {
                entries = existing;
            }
        }
        catch {
            // Corrupted file — start fresh
            entries = [];
        }
    }
    entries.push(entry);
    await fs.writeJson(logPath, entries, { spaces: 2 });
}
/**
 * Find the waiting agent ID for a given story in the queue.
 */
function findWaitingAgentId(storyId) {
    const item = promptQueue.find((i) => i.storyId === storyId);
    return item ? item.waitingAgentId : null;
}
