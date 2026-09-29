"use strict";
/**
 * dependency-mapper.ts — Epic Dependency Mapper & Story Classification Engine
 *
 * Story 10.1: Analyzes all Stories within an Epic, automatically classifies them
 * as Independent, Dependent, or Ambiguous, and outputs a DAG with execution waves
 * so that `orch-agent` can determine the optimal parallel execution order.
 *
 * @module dependency-mapper
 */
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
exports.CircularDependencyError = void 0;
exports.parseStoryDependencies = parseStoryDependencies;
exports.buildDependencyDAG = buildDependencyDAG;
exports.classifyStories = classifyStories;
exports.computeExecutionWaves = computeExecutionWaves;
exports.serializeDAG = serializeDAG;
exports.analyzeDependencies = analyzeDependencies;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
/** Custom error for circular dependencies */
class CircularDependencyError extends Error {
    chain;
    constructor(chain) {
        super(`Circular dependency detected: ${chain.join(' → ')}`);
        this.name = 'CircularDependencyError';
        this.chain = chain;
    }
}
exports.CircularDependencyError = CircularDependencyError;
// ---------------------------------------------------------------------------
// Task 1: parseStoryDependencies — Hybrid Detection Engine (AC1)
// ---------------------------------------------------------------------------
/**
 * Reads a single story markdown file and extracts all dependency signals
 * using the 3-layer hybrid detection strategy.
 *
 * - Layer 1: Explicit markers (confidence 1.0)
 * - Layer 2: Keyword matching for shared resources (confidence 0.6–0.8)
 * - Layer 3: Structural inference from ordering hints (confidence 0.5–0.7)
 *
 * @param storyPath - Absolute path to the story markdown file
 * @param storyId - The story ID (e.g., "story-10.1")
 * @returns Array of dependency signals
 */
function parseStoryDependencies(storyPath, storyId) {
    const signals = [];
    let content;
    try {
        content = fs.readFileSync(storyPath, 'utf8');
    }
    catch (err) {
        console.warn(`⚠️  Could not read story file: ${storyPath}`);
        return signals;
    }
    // Extract the epic number from the storyId (e.g., "10" from "story-10.1")
    const epicMatch = storyId.match(/^story-(\d+)\./);
    const epicNum = epicMatch ? epicMatch[1] : '';
    // --- Layer 1: Explicit Markers (confidence = 1.0) ---
    // 1a: YAML frontmatter `depends_on` field
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
        const fmContent = frontmatterMatch[1];
        const dependsOnMatch = fmContent.match(/depends_on:\s*\[([^\]]*)\]/);
        if (dependsOnMatch) {
            const ids = dependsOnMatch[1].split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean);
            for (const targetId of ids) {
                const normalizedTarget = normalizeStoryId(targetId, epicNum);
                if (normalizedTarget && normalizedTarget !== storyId) {
                    signals.push({
                        sourceStoryId: storyId,
                        targetStoryId: normalizedTarget,
                        type: 'explicit',
                        confidence: 1.0,
                        evidence: `Frontmatter depends_on: [${targetId}]`,
                    });
                }
            }
        }
    }
    // 1b: Body text explicit story references — context-aware
    // Only creates dependency signals when the reference appears in a
    // dependency-indicating context (AC text, "depends on", "requires",
    // "after", etc.), NOT in downstream/output/depended_by sections.
    const storyRefRegex = /(?:Story\s+(\d+\.\d+)|story-(\d+\.\d+)|story-(\d+)\.(\d+))/gi;
    let match;
    // Build a set of character ranges that are inside fenced code blocks (```)
    // References inside code blocks are examples/documentation, not real dependencies.
    const codeBlockRanges = [];
    const codeBlockRegex = /```[\s\S]*?```/g;
    let cbMatch;
    while ((cbMatch = codeBlockRegex.exec(content)) !== null) {
        codeBlockRanges.push({ start: cbMatch.index, end: cbMatch.index + cbMatch[0].length });
    }
    function isInsideCodeBlock(position) {
        return codeBlockRanges.some((r) => position >= r.start && position < r.end);
    }
    // Identify non-dependency sections (downstream references, output descriptions)
    const nonDepPatterns = [
        /\*\*Downstream:?\*\*/i,
        /Downstream:/i,
        /depended_by/i,
        /consumed by/i,
        /consumed bởi/i,
        /reads DAG for/i,
        /reads.*output/i,
        /downstream consumer/i,
        /^\s*["']to["']\s*:/i, // JSON key "to": "story-X.Y" (example output)
        /^\s*["']from["']\s*:/i, // JSON key "from": "story-X.Y" (example output)
        /Wave\s+\d+:/i, // "Wave 2: story-10.2" (execution plan examples)
        /validate.*output.*DAG/i, // Test descriptions referencing DAG outputs
        /expected.*output/i, // Expected output examples
        /JSON.*output/i, // JSON output descriptions
        /ví dụ[:.]?\s/i, // Vietnamese "example:" — story refs are illustrations
        /\(ví dụ/i, // "(ví dụ: A→B→C→A)"
        /e\.g\.\s*[:]/i, // "e.g.:" — English example marker
        /for example/i, // "for example: story-10.2"
        /circular dependency/i, // References inside cycle-detection examples
        /vòng tròn/i, // Vietnamese "circular" — cycle example text
        /chain.*cycle/i, // "chain gây cycle" descriptions
        /IT\d+\s*\|/i, // Integration test table rows ("|IT1|...")
    ];
    while ((match = storyRefRegex.exec(content)) !== null) {
        const refNum = match[1] || match[2] || (match[3] && match[4] ? `${match[3]}.${match[4]}` : null);
        if (!refNum)
            continue;
        const targetId = `story-${refNum}`;
        if (targetId === storyId)
            continue;
        // Skip references inside fenced code blocks (```)
        if (isInsideCodeBlock(match.index))
            continue;
        // Get the surrounding line context to determine directionality
        const lineStart = content.lastIndexOf('\n', match.index) + 1;
        const lineEnd = content.indexOf('\n', match.index + match[0].length);
        const line = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
        // Skip references in non-dependency contexts (downstream, depended_by, etc.)
        const isDownstreamRef = nonDepPatterns.some((p) => p.test(line));
        if (isDownstreamRef)
            continue;
        // Check for AC-text dependency patterns: "Given Story X.Y đã hoàn tất"
        // BUT exclude lines that are describing edge-case behavior or using examples
        const isExampleContext = /EDGE-CASE/i.test(line) ||
            /\(ví dụ/i.test(line) ||
            /ví dụ:/i.test(line) ||
            /for example/i.test(line) ||
            /e\.g\./i.test(line) ||
            /such as/i.test(line);
        if (isExampleContext)
            continue;
        const isDependencyContext = /(?:Given|sau khi|after|requires|dựa trên|depends on|đã qua bước|đã hoàn tất)/i.test(line) ||
            /(?:depends_on|dependency|phụ thuộc)/i.test(line);
        if (isDependencyContext) {
            signals.push({
                sourceStoryId: storyId,
                targetStoryId: targetId,
                type: 'explicit',
                confidence: 1.0,
                evidence: `AC dependency reference: "${match[0]}" in context: "${line.trim().substring(0, 120)}"`,
            });
        }
        // General body mentions without clear dependency context → skip
        // (they'll be caught by Layer 3 if there's structural ordering)
    }
    // 1c: depends_on in body text
    const bodyDependsRegex = /depends_on:\s*\[([^\]]*)\]/g;
    let bodyDepMatch;
    while ((bodyDepMatch = bodyDependsRegex.exec(content)) !== null) {
        // Skip if this is the frontmatter one we already parsed
        if (frontmatterMatch && bodyDepMatch.index < (frontmatterMatch.index || 0) + frontmatterMatch[0].length) {
            continue;
        }
        const ids = bodyDepMatch[1].split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean);
        for (const targetId of ids) {
            const normalizedTarget = normalizeStoryId(targetId, epicNum);
            if (normalizedTarget && normalizedTarget !== storyId) {
                signals.push({
                    sourceStoryId: storyId,
                    targetStoryId: normalizedTarget,
                    type: 'explicit',
                    confidence: 1.0,
                    evidence: `Body depends_on: [${targetId}]`,
                });
            }
        }
    }
    // --- Layer 2: Keyword Matching for shared resources (confidence 0.6–0.8) ---
    // Extract shared resource identifiers
    const sharedResources = extractSharedResources(content);
    // DB tables
    for (const table of sharedResources.tables) {
        signals.push({
            sourceStoryId: storyId,
            targetStoryId: '__shared_resource__',
            type: 'keyword',
            confidence: 0.7,
            evidence: `References DB table: "${table}"`,
        });
    }
    // API endpoints
    for (const endpoint of sharedResources.apiEndpoints) {
        signals.push({
            sourceStoryId: storyId,
            targetStoryId: '__shared_resource__',
            type: 'keyword',
            confidence: 0.7,
            evidence: `References API endpoint: "${endpoint}"`,
        });
    }
    // TypeScript types/interfaces
    for (const typeName of sharedResources.typeNames) {
        signals.push({
            sourceStoryId: storyId,
            targetStoryId: '__shared_resource__',
            type: 'keyword',
            confidence: 0.6,
            evidence: `References TypeScript type/interface: "${typeName}"`,
        });
    }
    // Shared files
    for (const filePath of sharedResources.sharedFiles) {
        signals.push({
            sourceStoryId: storyId,
            targetStoryId: '__shared_resource__',
            type: 'keyword',
            confidence: 0.8,
            evidence: `References shared file: "${filePath}"`,
        });
    }
    // --- Layer 3: Structural Inference (confidence 0.5–0.7) ---
    // Vietnamese and English ordering hints
    const inferencePatterns = [
        { regex: /sau khi\s+(?:Story\s+)?(\d+\.\d+)/gi, confidence: 0.7, label: 'sau khi (after)' },
        { regex: /dựa trên (?:output|kết quả) (?:của\s+)?(?:Story\s+)?(\d+\.\d+)/gi, confidence: 0.7, label: 'dựa trên output (based on output of)' },
        { regex: /after completion of\s+(?:Story\s+)?(\d+\.\d+)/gi, confidence: 0.6, label: 'after completion of' },
        { regex: /requires\s+(?:Story\s+)?(\d+\.\d+)/gi, confidence: 0.6, label: 'requires' },
        { regex: /đã qua bước.*?(?:Story\s+)?(\d+\.\d+)/gi, confidence: 0.7, label: 'đã qua bước (already passed step)' },
        { regex: /đã hoàn tất.*?(?:Story\s+)?(\d+\.\d+)/gi, confidence: 0.6, label: 'đã hoàn tất (already completed)' },
        { regex: /hoàn thành.*?(?:Story\s+)?(\d+\.\d+)/gi, confidence: 0.5, label: 'hoàn thành (completed)' },
    ];
    for (const pattern of inferencePatterns) {
        let inferMatch;
        while ((inferMatch = pattern.regex.exec(content)) !== null) {
            const targetNum = inferMatch[1];
            const targetId = `story-${targetNum}`;
            if (targetId !== storyId) {
                signals.push({
                    sourceStoryId: storyId,
                    targetStoryId: targetId,
                    type: 'inferred',
                    confidence: pattern.confidence,
                    evidence: `Structural hint "${pattern.label}" referencing ${targetNum} in: "${inferMatch[0].substring(0, 80)}"`,
                });
            }
        }
    }
    return signals;
}
/**
 * Extracts shared resource identifiers (tables, API endpoints, types, files)
 * from story content for Layer 2 keyword matching.
 */
function extractSharedResources(content) {
    const tables = [];
    const apiEndpoints = [];
    const typeNames = [];
    const sharedFiles = [];
    // DB tables: CREATE TABLE, ALTER TABLE, backtick-quoted table names
    const tableRegex = /(?:CREATE|ALTER)\s+TABLE\s+(?:`)?(\w+)(?:`)?/gi;
    let m;
    while ((m = tableRegex.exec(content)) !== null) {
        tables.push(m[1]);
    }
    // API endpoints: /api/..., GET/POST/PUT/DELETE /...
    const apiRegex = /(?:GET|POST|PUT|DELETE|PATCH)\s+(\/[\w\-/{}:]+)/gi;
    while ((m = apiRegex.exec(content)) !== null) {
        apiEndpoints.push(m[1]);
    }
    const apiPathRegex = /`(\/api\/[\w\-/{}:]+)`/g;
    while ((m = apiPathRegex.exec(content)) !== null) {
        apiEndpoints.push(m[1]);
    }
    // TypeScript types/interfaces
    const typeRegex = /(?:interface|type|schema)\s+(\w+)/gi;
    while ((m = typeRegex.exec(content)) !== null) {
        typeNames.push(m[1]);
    }
    // Shared files (explicit file paths in backticks)
    const fileRegex = /`([^`]*\.(ts|js|json|yaml|yml|md|sql))`/g;
    while ((m = fileRegex.exec(content)) !== null) {
        // Only include files that look like project paths (not just extension matches)
        const fp = m[1];
        if (fp.includes('/') || fp.includes('.')) {
            sharedFiles.push(fp);
        }
    }
    return {
        tables: [...new Set(tables)],
        apiEndpoints: [...new Set(apiEndpoints)],
        typeNames: [...new Set(typeNames)],
        sharedFiles: [...new Set(sharedFiles)],
    };
}
/**
 * Normalizes various story ID formats to a consistent "story-X.Y" format.
 */
function normalizeStoryId(raw, epicNum) {
    const trimmed = raw.trim();
    // Already in story-X.Y format
    if (/^story-\d+\.\d+$/.test(trimmed)) {
        return trimmed;
    }
    // Just a number like "10.1"
    if (/^\d+\.\d+$/.test(trimmed)) {
        return `story-${trimmed}`;
    }
    // Just a sub-index like "1" — prefix with epic number
    if (/^\d+$/.test(trimmed) && epicNum) {
        return `story-${epicNum}.${trimmed}`;
    }
    // story-X-Y format (dash instead of dot)
    const dashMatch = trimmed.match(/^story-(\d+)-(\d+)$/);
    if (dashMatch) {
        return `story-${dashMatch[1]}.${dashMatch[2]}`;
    }
    return null;
}
// ---------------------------------------------------------------------------
// Task 2: buildDependencyDAG — Graph Construction & Validation (AC2, AC5)
// ---------------------------------------------------------------------------
/**
 * Constructs a DAG from all stories in an Epic directory.
 * Scans `_iwish-output/stories/story-{epicId}.*.md` files, parses dependencies,
 * builds adjacency lists, detects cycles via DFS 3-color marking, and
 * deduplicates edges.
 *
 * @param epicId - The epic identifier (e.g., "10")
 * @param projectRoot - Absolute path to the project root
 * @returns A validated DAGGraph
 * @throws CircularDependencyError if a cycle is detected
 * @throws Error if no stories are found
 */
function buildDependencyDAG(epicId, projectRoot) {
    const storiesDir = path.join(projectRoot, '_iwish-output', 'stories');
    if (!fs.existsSync(storiesDir)) {
        throw new Error(`No stories directory found at: ${storiesDir}`);
    }
    // ST2.1: Find all stories for this epic
    const storyFiles = fs.readdirSync(storiesDir)
        .filter((f) => {
        const pattern = new RegExp(`^story-${epicId}\\.\\d+\\.md$`);
        return pattern.test(f);
    })
        .sort();
    if (storyFiles.length === 0) {
        throw new Error(`No stories found for Epic ${epicId} in ${storiesDir}`);
    }
    // Initialize nodes
    const nodes = new Map();
    for (const file of storyFiles) {
        const storyNum = file.replace(/^story-/, '').replace(/\.md$/, '');
        const storyId = `story-${storyNum}`;
        const storyPath = path.join(storiesDir, file);
        const { title, tags, complexity } = extractStoryMetadata(storyPath);
        nodes.set(storyId, {
            id: storyId,
            title,
            classification: 'independent', // will be updated by classifyStories
            depends_on: [],
            depended_by: [],
            tags,
            estimated_complexity: complexity,
        });
    }
    // ST2.2: Parse dependencies for each story
    const allSignals = [];
    for (const file of storyFiles) {
        const storyNum = file.replace(/^story-/, '').replace(/\.md$/, '');
        const storyId = `story-${storyNum}`;
        const storyPath = path.join(storiesDir, file);
        const signals = parseStoryDependencies(storyPath, storyId);
        allSignals.push(...signals);
    }
    // Cross-reference Layer 2 shared resources to find keyword dependencies
    const keywordEdges = resolveKeywordDependencies(allSignals, nodes);
    // Combine explicit/inferred signals with resolved keyword edges
    const allEdges = [
        ...allSignals.filter((s) => s.targetStoryId !== '__shared_resource__'),
        ...keywordEdges,
    ];
    // ST2.5: Deduplicate edges — same from→to pair, keep highest confidence
    const edgeMap = new Map();
    for (const signal of allEdges) {
        // Only include edges where both source and target exist in this epic
        if (!nodes.has(signal.sourceStoryId) || !nodes.has(signal.targetStoryId)) {
            continue;
        }
        // The dependency direction: sourceStory depends on targetStory
        // In graph terms: edge from targetStory → sourceStory (target must complete first)
        const edgeKey = `${signal.targetStoryId}→${signal.sourceStoryId}`;
        const existing = edgeMap.get(edgeKey);
        if (!existing || signal.confidence > existing.confidence) {
            edgeMap.set(edgeKey, {
                from: signal.targetStoryId,
                to: signal.sourceStoryId,
                type: signal.type,
                confidence: signal.confidence,
                evidence: signal.evidence,
            });
        }
    }
    // ST2.5b: Remove keyword edges that contradict explicit/inferred edges.
    // If explicit/inferred says A→B (A must complete first for B), but keyword
    // says B→A (B must complete first for A), the keyword edge is wrong —
    // keyword ordering is based on alphabetical sort which is unreliable.
    const explicitEdgeKeys = new Set();
    for (const [key, edge] of edgeMap) {
        if (edge.type === 'explicit' || edge.type === 'inferred') {
            explicitEdgeKeys.add(key);
        }
    }
    for (const [key, edge] of edgeMap) {
        if (edge.type === 'keyword') {
            // Check if the reverse direction exists as explicit/inferred
            const reverseKey = `${edge.to}→${edge.from}`;
            if (explicitEdgeKeys.has(reverseKey)) {
                edgeMap.delete(key); // Remove contradicting keyword edge
            }
        }
    }
    const edges = [...edgeMap.values()];
    // ST2.3: Build adjacency lists
    const adjacency = new Map();
    const reverseAdjacency = new Map();
    for (const nodeId of nodes.keys()) {
        adjacency.set(nodeId, []);
        reverseAdjacency.set(nodeId, []);
    }
    for (const edge of edges) {
        const adj = adjacency.get(edge.from);
        if (adj)
            adj.push(edge.to);
        const revAdj = reverseAdjacency.get(edge.to);
        if (revAdj)
            revAdj.push(edge.from);
    }
    // ST2.6: Populate depends_on and depended_by on nodes
    for (const edge of edges) {
        const toNode = nodes.get(edge.to);
        if (toNode && !toNode.depends_on.includes(edge.from)) {
            toNode.depends_on.push(edge.from);
        }
        const fromNode = nodes.get(edge.from);
        if (fromNode && !fromNode.depended_by.includes(edge.to)) {
            fromNode.depended_by.push(edge.to);
        }
    }
    // ST2.4: Cycle detection using DFS with 3-color marking
    detectCycles(adjacency, nodes);
    return { nodes, edges, adjacency, reverseAdjacency };
}
/**
 * Resolves Layer 2 keyword dependencies by finding shared resources
 * mentioned across multiple stories.
 */
function resolveKeywordDependencies(allSignals, nodes) {
    const resourceToStories = new Map();
    for (const signal of allSignals) {
        if (signal.targetStoryId !== '__shared_resource__')
            continue;
        const key = signal.evidence;
        if (!resourceToStories.has(key)) {
            resourceToStories.set(key, []);
        }
        resourceToStories.get(key).push({
            storyId: signal.sourceStoryId,
            evidence: signal.evidence,
            confidence: signal.confidence,
        });
    }
    const keywordEdges = [];
    for (const [resource, stories] of resourceToStories.entries()) {
        // Only create edges when ≥2 stories share the same resource
        if (stories.length < 2)
            continue;
        // Sort by story ID to establish ordering (earlier story is the dependency)
        const sorted = stories
            .filter((s) => nodes.has(s.storyId))
            .sort((a, b) => a.storyId.localeCompare(b.storyId));
        for (let i = 1; i < sorted.length; i++) {
            // Later story depends on earlier story through shared resource
            const confidence = Math.min(sorted[0].confidence, sorted[i].confidence);
            keywordEdges.push({
                sourceStoryId: sorted[i].storyId,
                targetStoryId: sorted[0].storyId,
                type: 'keyword',
                confidence,
                evidence: `Shared resource: ${resource} — referenced by both ${sorted[0].storyId} and ${sorted[i].storyId}`,
            });
        }
    }
    return keywordEdges;
}
/**
 * Detects cycles in the DAG using DFS with WHITE/GRAY/BLACK coloring.
 * @throws CircularDependencyError with the cycle chain if a cycle is found
 */
function detectCycles(adjacency, nodes) {
    const WHITE = 0;
    const GRAY = 1;
    const BLACK = 2;
    const color = new Map();
    const parent = new Map();
    for (const nodeId of nodes.keys()) {
        color.set(nodeId, WHITE);
        parent.set(nodeId, null);
    }
    function dfs(u) {
        color.set(u, GRAY);
        for (const v of adjacency.get(u) || []) {
            if (color.get(v) === GRAY) {
                // Cycle detected — reconstruct the chain
                const chain = [v, u];
                let cur = u;
                while (cur !== v) {
                    const p = parent.get(cur);
                    if (p === null || p === undefined)
                        break;
                    chain.push(p);
                    cur = p;
                }
                chain.reverse();
                // Ensure the cycle closes
                if (chain[chain.length - 1] !== chain[0]) {
                    chain.push(chain[0]);
                }
                throw new CircularDependencyError(chain);
            }
            if (color.get(v) === WHITE) {
                parent.set(v, u);
                dfs(v);
            }
        }
        color.set(u, BLACK);
    }
    for (const nodeId of nodes.keys()) {
        if (color.get(nodeId) === WHITE) {
            dfs(nodeId);
        }
    }
}
/**
 * Extracts metadata (title, tags, complexity) from a story markdown file.
 */
function extractStoryMetadata(storyPath) {
    let content;
    try {
        content = fs.readFileSync(storyPath, 'utf8');
    }
    catch {
        return { title: path.basename(storyPath, '.md'), tags: [], complexity: 'medium' };
    }
    // Extract title from first H1
    const titleMatch = content.match(/^#\s+(?:Story\s+\d+\.\d+:\s*)?(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : path.basename(storyPath, '.md');
    // Extract tags
    const tags = [];
    const tagMatch = content.match(/\*\*Tags:\*\*\s*(.+)$/m);
    if (tagMatch) {
        const tagStr = tagMatch[1];
        const tagRegex = /`\[(\w+)\]`/g;
        let tagM;
        while ((tagM = tagRegex.exec(tagStr)) !== null) {
            tags.push(tagM[1]);
        }
    }
    // Estimate complexity from AC count and CS score
    const acMatches = content.match(/\*\*AC\d+:\*\*/g);
    const acCount = acMatches ? acMatches.length : 0;
    const csMatch = content.match(/Complexity Score\s*\(CS\):\s*(\d+)/);
    const csScore = csMatch ? parseInt(csMatch[1], 10) : 0;
    let complexity = 'medium';
    if (csScore >= 7 || acCount > 7) {
        complexity = 'high';
    }
    else if (csScore <= 3 && acCount <= 4) {
        complexity = 'low';
    }
    return { title, tags, complexity };
}
// ---------------------------------------------------------------------------
// Task 3: classifyStories — Story Classification (AC3, AC6)
// ---------------------------------------------------------------------------
/**
 * Traverses the DAG and assigns a classification to each story node.
 *
 * - `independent`: No incoming edges (in-degree = 0)
 * - `dependent`: At least 1 incoming edge with confidence ≥ threshold
 * - `ambiguous`: Has incoming edges but ALL have confidence < threshold
 *
 * @param dag - The DAG graph
 * @param threshold - Confidence threshold (default: 0.6)
 * @returns The DAG with updated node classifications
 */
function classifyStories(dag, threshold = 0.6) {
    for (const [nodeId, node] of dag.nodes) {
        // Get all incoming edges (edges where this node is the "to" target)
        const incomingEdges = dag.edges.filter((e) => e.to === nodeId);
        if (incomingEdges.length === 0) {
            // No incoming edges → independent
            node.classification = 'independent';
        }
        else {
            // Check if any incoming edge has confidence ≥ threshold
            const hasHighConfEdge = incomingEdges.some((e) => e.confidence >= threshold);
            if (hasHighConfEdge) {
                node.classification = 'dependent';
            }
            else {
                // All edges below threshold → ambiguous
                node.classification = 'ambiguous';
            }
        }
    }
    return dag;
}
// ---------------------------------------------------------------------------
// Task 4: computeExecutionWaves — Topological Sort & Wave Assignment (AC4, AC7)
// ---------------------------------------------------------------------------
/**
 * Uses Kahn's algorithm to compute topological order and assign stories to
 * execution waves. Stories in the same wave have no dependencies on each other.
 *
 * - Fast path: single story or all independent → 1 wave
 * - Disconnected components: placed in wave 1
 * - Ambiguous stories: placed in earliest possible wave (optimistic scheduling)
 *
 * @param dag - The classified DAG
 * @param threshold - Confidence threshold for edges (default: 0.6)
 * @returns Object with execution_waves and summary
 */
function computeExecutionWaves(dag, threshold = 0.6) {
    const nodeIds = [...dag.nodes.keys()];
    // AC7: Fast path — single story or all independent
    if (nodeIds.length <= 1) {
        return {
            execution_waves: [nodeIds],
            summary: buildSummary(dag, [nodeIds]),
        };
    }
    const allIndependent = nodeIds.every((id) => dag.nodes.get(id).classification === 'independent');
    if (allIndependent) {
        return {
            execution_waves: [nodeIds],
            summary: buildSummary(dag, [nodeIds]),
        };
    }
    // Kahn's algorithm with wave grouping
    // Only consider edges with confidence ≥ threshold for ordering
    const significantEdges = dag.edges.filter((e) => e.confidence >= threshold);
    // Calculate in-degrees based on significant edges only
    const inDegree = new Map();
    const adjList = new Map();
    for (const nodeId of nodeIds) {
        inDegree.set(nodeId, 0);
        adjList.set(nodeId, []);
    }
    for (const edge of significantEdges) {
        const current = inDegree.get(edge.to) || 0;
        inDegree.set(edge.to, current + 1);
        adjList.get(edge.from).push(edge.to);
    }
    // Initialize queue with in-degree 0 nodes
    const waves = [];
    let currentWave = nodeIds.filter((id) => inDegree.get(id) === 0);
    while (currentWave.length > 0) {
        waves.push(currentWave.sort());
        const nextWave = [];
        for (const nodeId of currentWave) {
            for (const neighbor of adjList.get(nodeId) || []) {
                const deg = (inDegree.get(neighbor) || 0) - 1;
                inDegree.set(neighbor, deg);
                if (deg === 0) {
                    nextWave.push(neighbor);
                }
            }
        }
        currentWave = nextWave;
    }
    // Check for nodes not placed in any wave (disconnected or only low-confidence edges)
    const placedNodes = new Set(waves.flat());
    const unplacedNodes = nodeIds.filter((id) => !placedNodes.has(id));
    if (unplacedNodes.length > 0) {
        // Add disconnected nodes to wave 1
        if (waves.length > 0) {
            waves[0] = [...waves[0], ...unplacedNodes].sort();
        }
        else {
            waves.push(unplacedNodes.sort());
        }
    }
    return {
        execution_waves: waves,
        summary: buildSummary(dag, waves),
    };
}
/**
 * Builds the summary statistics object.
 */
function buildSummary(dag, waves) {
    let independent = 0;
    let dependent = 0;
    let ambiguous = 0;
    for (const node of dag.nodes.values()) {
        switch (node.classification) {
            case 'independent':
                independent++;
                break;
            case 'dependent':
                dependent++;
                break;
            case 'ambiguous':
                ambiguous++;
                break;
        }
    }
    const maxParallelism = waves.reduce((max, wave) => Math.max(max, wave.length), 0);
    return {
        total_stories: dag.nodes.size,
        independent,
        dependent,
        ambiguous,
        total_edges: dag.edges.length,
        max_parallelism: maxParallelism,
    };
}
// ---------------------------------------------------------------------------
// Task 5: serializeDAG + CLI Entry Point (AC2)
// ---------------------------------------------------------------------------
/**
 * Serializes the DAG result to JSON matching the AC2 schema and writes it
 * to `_iwish-output/dependency-map-epic-{N}.json`.
 *
 * @param result - The complete DAG result
 * @param epicId - The epic identifier
 * @param projectRoot - Absolute path to the project root
 * @param outputDir - Optional custom output directory
 * @returns The output file path
 */
function serializeDAG(result, epicId, projectRoot, outputDir) {
    const dir = outputDir || path.join(projectRoot, '_iwish-output');
    fs.ensureDirSync(dir);
    const outputPath = path.join(dir, `dependency-map-epic-${epicId}.json`);
    fs.writeJsonSync(outputPath, result, { spaces: 2 });
    return outputPath;
}
/**
 * Prints a human-readable summary of the DAG to stdout.
 */
function printSummary(result) {
    const { epicId, execution_waves, summary } = result;
    console.log(`\n📊 Dependency Map for Epic ${epicId}:`);
    for (let i = 0; i < execution_waves.length; i++) {
        const wave = execution_waves[i];
        const isLast = i === execution_waves.length - 1;
        const prefix = isLast ? '└─' : '├─';
        const storyList = wave.join(', ');
        const label = wave.length === 1
            ? execution_waves.length === 1
                ? 'all parallel'
                : i === execution_waves.length - 1
                    ? 'sequential'
                    : 'independent'
            : 'parallel';
        console.log(`${prefix} Wave ${i + 1}: ${storyList} (${label})`);
    }
    console.log(`Total: ${summary.total_stories} stories | ${summary.total_edges} dependencies | Max parallelism: ${summary.max_parallelism}`);
    console.log(`Classification: ${summary.independent} independent, ${summary.dependent} dependent, ${summary.ambiguous} ambiguous\n`);
}
/**
 * Main entry point: analyzes all dependencies in an Epic and produces
 * the complete DAG result with classifications and execution waves.
 *
 * This function orchestrates Tasks 1–4 and serializes the output.
 *
 * @param epicId - The epic identifier (e.g., "10")
 * @param options - Optional configuration
 * @returns The complete DAG result
 */
async function analyzeDependencies(epicId, options = {}) {
    const projectRoot = options.projectRoot
        ? path.resolve(options.projectRoot)
        : process.cwd();
    const threshold = options.confidenceThreshold ?? 0.6;
    // Task 2: Build the DAG (includes Task 1 parsing internally)
    const dag = buildDependencyDAG(epicId, projectRoot);
    // Task 3: Classify stories
    classifyStories(dag, threshold);
    // Task 4: Compute execution waves
    const { execution_waves, summary } = computeExecutionWaves(dag, threshold);
    // Build the result object
    const result = {
        epicId,
        generatedAt: new Date().toISOString(),
        confidenceThreshold: threshold,
        nodes: [...dag.nodes.values()],
        edges: dag.edges,
        execution_waves,
        summary,
    };
    // Task 5: Serialize to JSON
    const outputPath = serializeDAG(result, epicId, projectRoot, options.outputDir);
    // Print human-readable summary
    printSummary(result);
    console.log(`📁 DAG written to: ${outputPath}`);
    return result;
}
// ---------------------------------------------------------------------------
// CLI entry point — allows running directly via ts-node or node
// ---------------------------------------------------------------------------
if (require.main === module) {
    const epicId = process.argv[2];
    if (!epicId) {
        console.error('Usage: dependency-mapper <epicId> [projectRoot]');
        process.exit(1);
    }
    const projectRoot = process.argv[3] || process.cwd();
    analyzeDependencies(epicId, { projectRoot })
        .then(() => {
        process.exit(0);
    })
        .catch((err) => {
        if (err instanceof CircularDependencyError) {
            console.error(`\n🔴 ${err.message}`);
            console.error('   The cycle must be resolved before execution waves can be computed.');
        }
        else {
            console.error(`\n❌ Error: ${err.message}`);
        }
        process.exit(1);
    });
}
