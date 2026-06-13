import * as fs from 'fs-extra';
import * as path from 'path';
import YAML from 'yaml';
import { execSync } from 'child_process';

import { I_WISH_OUTPUT_DIR } from './constants';
import { loadRoutingProfiles, RoutingProfile } from './routing-profile';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result of a routing profile lookup for a given task type. */
export type RoutingProfileResult = {
  matched: true;
  profile: RoutingProfile;
  workflows: string[];
  agents: string[];
  source_path: string;
  skills: string[];
} | {
  matched: false;
  scannedProfiles: string[];
  reason: string;
};

/** Context summary for the story currently being executed. */
export type StoryContext = {
  epicGoal: string;
  storyId: string;
  storyTitle: string;
  acceptanceCriteria: string[];
  tasks: string[];
};

/** Write-lock manifest listing files that sub-agents must not modify. */
export type LockManifest = {
  lockedFiles: string[];
};

/** A compliant system prompt assembled from the 4 mandatory sections. */
export type CompliantPrompt = {
  systemPrompt: string;
  sections: {
    persona: string;
    workflowDirective: string;
    writeLockList: string;
    storyContext: string;
  };
  estimatedTokens: number;
  budgetExceeded: boolean;
  compressed: boolean;
};

/** Schema definition for validating workflow output. */
export type WorkflowOutputSchema = {
  workflowId: string;
  requiredSections: string[];
  minQaScore: number | null;
};

/** Result of output validation against a workflow schema. */
export type OutputValidationResult = {
  valid: boolean;
  workflowId: string;
  missingSections: string[];
  qaScoreFound: number | null;
  qaScorePassed: boolean;
  details: string;
};

/** Details about a validation failure, used for retry logic. */
export type FailureDetails = {
  subagentId: string;
  workflowId: string;
  originalPrompt: string;
  validationResult: OutputValidationResult;
  retryCount: number;
};

/** Result of a retry attempt. */
export type RetryResult = {
  action: 'retry' | 'escalate';
  reinforcedPrompt: string | null;
  retryCount: number;
  reason: string;
};

/** A single audit trail entry recording sub-agent execution. */
export type AuditEntry = {
  storyId: string;
  agentPersona: string;
  workflowUsed: string;
  workflowFile: string;
  outputValidation: 'PASS' | 'FAIL';
  failedFields: string[];
  retryCount: number;
  decisionsAutoResolved: number;
  decisionsEscalated: number;
  executionTimeMs: number;
  timestamp: string;
};

/** Filters for querying the audit trail. */
export type AuditQueryFilters = {
  storyId?: string;
  agentPersona?: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RETRIES = 2;
const DEFAULT_TOKEN_BUDGET = 200_000;
const TOKEN_BUDGET_RATIO = 0.5;
const APPROX_CHARS_PER_TOKEN = 4;

// ---------------------------------------------------------------------------
// Layer 1 — Routing Profile Lookup (Task 1: AC1, AC2, AC3)
// ---------------------------------------------------------------------------

/**
 * Find the routing profile that matches a given task type.
 *
 * Scans all `*.routing-profile.yaml` files within `.agent/agents/`,
 * `.agent/workflows/`, `.agent/skills/`, and external-module catalogs.
 * Matches the task type against `triggers` and `primary_workflows` fields.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @param taskType - The task type string to match (e.g. "make-story", "dev-story", "create story for story-10.1").
 * @returns A `RoutingProfileResult` — either a successful match with extracted fields, or a no-match result.
 */
export function findRoutingProfile(projectRoot: string, taskType: string): RoutingProfileResult {
  const profiles = loadRoutingProfiles(projectRoot);
  const normalizedTask = taskType.trim().toLowerCase();

  for (const profile of profiles) {
    // Match against triggers
    const triggerMatch = profile.triggers.some((trigger) => {
      const normalizedTrigger = trigger.trim().toLowerCase();
      return normalizedTask.includes(normalizedTrigger) || normalizedTrigger.includes(normalizedTask);
    });

    // Match against primary_workflows
    const workflowMatch = profile.primary_workflows.some((workflow) => {
      const normalizedWorkflow = workflow.trim().toLowerCase().replace(/^\//, '');
      return normalizedTask.includes(normalizedWorkflow) || normalizedWorkflow === normalizedTask.replace(/^\//, '');
    });

    if (triggerMatch || workflowMatch) {
      return {
        matched: true,
        profile,
        workflows: profile.primary_workflows,
        agents: profile.primary_agents,
        source_path: profile.source_path || '',
        skills: profile.supportive_skills,
      };
    }
  }

  // AC3: NO-PROFILE-MATCH edge case
  const scannedProfiles = profiles.map((p) => `${p.id} (${p.kind}: ${p.name})`);
  return {
    matched: false,
    scannedProfiles,
    reason: `[NO-PROFILE-MATCH] No routing profile matched task type "${taskType}". ` +
      `Scanned ${profiles.length} profile(s). User confirmation required before proceeding.`,
  };
}

// ---------------------------------------------------------------------------
// Layer 2 — Mandatory System Prompt Injection (Task 2: AC4, AC5)
// ---------------------------------------------------------------------------

/**
 * Build a compliant system prompt for a sub-agent with 4 mandatory sections.
 *
 * The prompt includes:
 * 1. Full persona file content
 * 2. Hard directive to follow the specific workflow
 * 3. Write-lock file list from `lock-manifest.json`
 * 4. Story context summary (epic goal, ACs, tasks)
 *
 * Validates that the prompt does not exceed 50% of the model's token budget.
 * If it exceeds, applies Level 1 micro-compact compression.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @param routingProfile - The resolved routing profile for the sub-agent.
 * @param storyContext - Context summary of the story being executed.
 * @param lockManifest - Write-lock manifest listing files the sub-agent must not modify.
 * @param tokenBudget - Total token budget for the model (default: 200,000).
 * @returns A `CompliantPrompt` with the assembled system prompt and metadata.
 */
export function buildCompliantPrompt(
  projectRoot: string,
  routingProfile: RoutingProfile,
  storyContext: StoryContext,
  lockManifest: LockManifest,
  tokenBudget: number = DEFAULT_TOKEN_BUDGET,
): CompliantPrompt {
  // Section 1: Full persona file content
  let personaContent = '';
  if (routingProfile.source_path) {
    const personaPath = routingProfile.source_path.startsWith('/')
      ? path.join(projectRoot, routingProfile.source_path)
      : path.join(projectRoot, routingProfile.source_path);
    if (fs.existsSync(personaPath)) {
      personaContent = fs.readFileSync(personaPath, 'utf8');
    }
  }
  if (!personaContent) {
    personaContent = `[Agent Persona: ${routingProfile.name}]\nKind: ${routingProfile.kind}\nRole: ${routingProfile.role}`;
  }

  // Section 2: Hard workflow directive
  const workflowFiles = routingProfile.primary_workflows.map((wf) => {
    const wfName = wf.replace(/^\//, '');
    return `.agent/workflows/iwish-feature-${wfName}.md`;
  });
  const workflowDirective =
    `## MANDATORY WORKFLOW COMPLIANCE\n` +
    `You MUST read the entire contents of the following workflow file(s) AND follow EXACTLY every step defined in them. ` +
    `Executing the task by ANY other method is STRICTLY PROHIBITED.\n\n` +
    `Workflow file(s):\n${workflowFiles.map((wf) => `- ${wf}`).join('\n')}\n\n` +
    `Designated workflows: ${routingProfile.primary_workflows.join(', ')}`;

  // Section 3: Write-lock list
  const writeLockList =
    `## WRITE-LOCK: FILES YOU MUST NOT MODIFY\n` +
    `The following files are locked and must not be created, modified, or deleted:\n` +
    (lockManifest.lockedFiles.length > 0
      ? lockManifest.lockedFiles.map((f) => `- ${f}`).join('\n')
      : '- (no files currently locked)');

  // Section 4: Story context summary
  const storyContextSection =
    `## STORY CONTEXT\n` +
    `Epic Goal: ${storyContext.epicGoal}\n` +
    `Story: ${storyContext.storyId} — ${storyContext.storyTitle}\n\n` +
    `### Acceptance Criteria\n` +
    storyContext.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n') +
    `\n\n### Implementation Tasks\n` +
    storyContext.tasks.map((t, i) => `${i + 1}. ${t}`).join('\n');

  // Assemble full prompt
  let systemPrompt =
    `${personaContent}\n\n---\n\n${workflowDirective}\n\n---\n\n${writeLockList}\n\n---\n\n${storyContextSection}`;

  // AC5: Token budget check (50% limit)
  const maxTokens = Math.floor(tokenBudget * TOKEN_BUDGET_RATIO);
  let estimatedTokens = Math.ceil(systemPrompt.length / APPROX_CHARS_PER_TOKEN);
  let compressed = false;
  let budgetExceeded = estimatedTokens > maxTokens;

  if (budgetExceeded) {
    // Level 1 micro-compact compression: strip redundant whitespace, shorten sections
    systemPrompt = compressPrompt(systemPrompt);
    estimatedTokens = Math.ceil(systemPrompt.length / APPROX_CHARS_PER_TOKEN);
    compressed = true;
    budgetExceeded = estimatedTokens > maxTokens;
  }

  return {
    systemPrompt,
    sections: {
      persona: personaContent,
      workflowDirective,
      writeLockList,
      storyContext: storyContextSection,
    },
    estimatedTokens,
    budgetExceeded,
    compressed,
  };
}

/**
 * Level 1 micro-compact compression for system prompts.
 * Removes excessive blank lines, trims indentation, and abbreviates markers.
 */
function compressPrompt(prompt: string): string {
  return prompt
    .replace(/\n{3,}/g, '\n\n')          // Collapse 3+ newlines to 2
    .replace(/^[ \t]+/gm, '')            // Strip leading whitespace per line
    .replace(/<!--[\s\S]*?-->/g, '')     // Remove HTML comments
    .replace(/\*\*([^*]+)\*\*/g, '$1')   // Remove bold markers
    .trim();
}

// ---------------------------------------------------------------------------
// Layer 3 — Output Schema Validation (Task 3: AC6)
// ---------------------------------------------------------------------------

/**
 * Get the expected output schema for a given workflow.
 *
 * Each workflow has specific required sections that must be present in the
 * sub-agent's output. For `/make-story`, this includes AC section, Task list,
 * AC-Task Traceability Matrix, and a QA Scorecard with minimum score ≥ 8.5.
 *
 * @param workflowId - The workflow identifier (e.g. "make-story", "dev-story").
 * @returns A `WorkflowOutputSchema` with required sections and validation rules.
 */
export function getWorkflowSchema(workflowId: string): WorkflowOutputSchema {
  const normalizedId = workflowId.replace(/^\//, '').toLowerCase();

  const schemas: Record<string, WorkflowOutputSchema> = {
    'make-story': {
      workflowId: 'make-story',
      requiredSections: [
        'Acceptance Criteria',
        'Task',
        'AC-to-Task Traceability',
        'QA Simulator Guardian Scorecard',
        'Cross-Feature Dependencies',
      ],
      minQaScore: 8.5,
    },
    'create-ui-spec': {
      workflowId: 'create-ui-spec',
      requiredSections: [
        'Component Hierarchy',
        'Responsive Layout',
        'Design Tokens',
        'Design Consultation Report',
      ],
      minQaScore: 8.5,
    },
    'make-ui-spec': {
      workflowId: 'make-ui-spec',
      requiredSections: [
        'Component Hierarchy',
        'Responsive Layout',
        'Design Tokens',
        'Design Consultation Report',
      ],
      minQaScore: 8.5,
    },
    'dev-story': {
      workflowId: 'dev-story',
      requiredSections: [
        'Implementation',
        'Compilation',
        'AC Coverage',
      ],
      minQaScore: null,
    },
    'code': {
      workflowId: 'code',
      requiredSections: [
        'Implementation',
        'Compilation',
        'AC Coverage',
      ],
      minQaScore: null,
    },
    'code-review': {
      workflowId: 'code-review',
      requiredSections: [
        'AC Coverage',
        'QA Simulator Guardian Scorecard',
        'Trust Score',
      ],
      minQaScore: 8.5,
    },
    'review': {
      workflowId: 'review',
      requiredSections: [
        'AC Coverage',
        'QA Simulator Guardian Scorecard',
        'Trust Score',
      ],
      minQaScore: 8.5,
    },
  };

  return schemas[normalizedId] || {
    workflowId: normalizedId,
    requiredSections: [],
    minQaScore: null,
  };
}

/**
 * Helper function to locate the project root directory
 */
function getProjectRoot(): string {
  let dir = process.cwd();
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, '.agent')) || fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function findDesignMdRecursive(dir: string, depth = 0): string | null {
  if (depth > 4) return null;
  if (!fs.existsSync(dir)) return null;
  try {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      if (entry.startsWith('.') || entry === 'node_modules') continue;
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const found = findDesignMdRecursive(fullPath, depth + 1);
        if (found) return found;
      } else if (entry.toLowerCase() === 'design.md') {
        return fullPath;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

/**
 * Validate a sub-agent's output against the expected workflow schema.
 *
 * Checks that all required sections are present in the output text
 * and that the QA Scorecard score meets the minimum threshold (if applicable).
 *
 * @param workflowId - The workflow identifier to validate against.
 * @param output - The raw output text produced by the sub-agent.
 * @returns An `OutputValidationResult` with pass/fail status and details.
 */
export function validateWorkflowOutput(workflowId: string, output: string): OutputValidationResult {
  const schema = getWorkflowSchema(workflowId);
  const normalizedOutput = output.toLowerCase();

  // Check required sections
  const missingSections: string[] = [];
  for (const section of schema.requiredSections) {
    if (!normalizedOutput.includes(section.toLowerCase())) {
      missingSections.push(section);
    }
  }

  // Check QA Scorecard score if applicable
  let qaScoreFound: number | null = null;
  let qaScorePassed = true;

  if (schema.minQaScore !== null) {
    const scoreMatch = output.match(/(?:TOTAL\s+AVERAGE|Overall\s+Score|QA\s+Score)[:\s]*(\d+(?:\.\d+)?)\s*(?:\/\s*10)?/i);
    if (scoreMatch) {
      qaScoreFound = parseFloat(scoreMatch[1]);
      qaScorePassed = qaScoreFound >= schema.minQaScore;
    } else {
      qaScorePassed = false;
    }
  }

  // Check design compliance if workflow is a UI spec
  let designCompliancePassed = true;
  let designComplianceDetails = '';

  const isUiSpec = ['create-ui-spec', 'make-ui-spec'].includes(workflowId.replace(/^\//, '').toLowerCase());
  if (isUiSpec) {
    const root = getProjectRoot();
    const designMdPath = findDesignMdRecursive(root);
    if (designMdPath) {
      const tempSpecDir = path.join(root, '_iwish-output', 'temp');
      fs.ensureDirSync(tempSpecDir);
      const tempSpecPath = path.join(tempSpecDir, 'temp-ui-spec.md');
      fs.writeFileSync(tempSpecPath, output, 'utf8');

      const scannerPath = path.join(root, '.agent', 'scripts', 'design-compliance-scanner.js');
      if (fs.existsSync(scannerPath)) {
        try {
          execSync(`node "${scannerPath}" --spec "${tempSpecPath}" --design "${designMdPath}"`, { stdio: 'pipe' });
        } catch (error: any) {
          designCompliancePassed = false;
          designComplianceDetails = error.stdout ? error.stdout.toString() : 'Design compliance check failed.';
        } finally {
          try {
            fs.unlinkSync(tempSpecPath);
          } catch (e) {}
        }
      }
    }
  }

  const valid = missingSections.length === 0 && qaScorePassed && designCompliancePassed;

  let details: string;
  if (valid) {
    details = `Output validation PASSED for workflow "${workflowId}". ` +
      `All ${schema.requiredSections.length} required section(s) present.`;
    if (qaScoreFound !== null) {
      details += ` QA Score: ${qaScoreFound}/10 (minimum: ${schema.minQaScore}).`;
    }
  } else {
    const issues: string[] = [];
    if (missingSections.length > 0) {
      issues.push(`Missing sections: ${missingSections.join(', ')}`);
    }
    if (!qaScorePassed) {
      issues.push(
        qaScoreFound !== null
          ? `QA Score ${qaScoreFound}/10 is below minimum ${schema.minQaScore}/10`
          : `QA Scorecard score not found in output`
      );
    }
    if (!designCompliancePassed) {
      issues.push(`Design Compliance violations:\n${designComplianceDetails}`);
    }
    details = `Output validation FAILED for workflow "${workflowId}". Issues: ${issues.join('; ')}.`;
  }

  return {
    valid,
    workflowId,
    missingSections,
    qaScoreFound,
    qaScorePassed,
    details,
  };
}

// ---------------------------------------------------------------------------
// Layer 3 (cont.) — Retry with Reinforced Prompt (Task 4: AC7)
// ---------------------------------------------------------------------------

/**
 * Build a reinforced prompt for retrying a failed sub-agent execution.
 *
 * Combines the original prompt with specific error details and explicit
 * instructions to fix the identified issues. Enforces a maximum of 2 retries.
 * After 2 consecutive failures, escalates to the user.
 *
 * @param failureDetails - Details about the failure including original prompt and validation result.
 * @returns A `RetryResult` indicating whether to retry or escalate, with the reinforced prompt if retrying.
 */
export function retryWithReinforcedPrompt(failureDetails: FailureDetails): RetryResult {
  if (failureDetails.retryCount >= MAX_RETRIES) {
    return {
      action: 'escalate',
      reinforcedPrompt: null,
      retryCount: failureDetails.retryCount,
      reason:
        `Sub-agent "${failureDetails.subagentId}" failed ${failureDetails.retryCount} consecutive time(s) ` +
        `for workflow "${failureDetails.workflowId}". Maximum retry limit (${MAX_RETRIES}) reached. ` +
        `Escalating to user for manual intervention.\n\n` +
        `Last failure: ${failureDetails.validationResult.details}`,
    };
  }

  const retryNumber = failureDetails.retryCount + 1;
  const { validationResult } = failureDetails;

  // Build specific error feedback
  const errorFeedback: string[] = [
    `## RETRY ATTEMPT ${retryNumber}/${MAX_RETRIES} — COMPLIANCE ERROR CORRECTION`,
    ``,
    `Your previous output for workflow "${validationResult.workflowId}" FAILED validation.`,
    ``,
    `### Specific Issues to Fix:`,
  ];

  if (validationResult.missingSections.length > 0) {
    errorFeedback.push(
      `- **Missing Required Sections:** ${validationResult.missingSections.join(', ')}`,
      `  You MUST include all of these sections in your output.`,
    );
  }

  if (!validationResult.qaScorePassed) {
    if (validationResult.qaScoreFound !== null) {
      errorFeedback.push(
        `- **QA Score Too Low:** Your score was ${validationResult.qaScoreFound}/10 but minimum required is 8.5/10.`,
        `  Re-evaluate your output quality and increase the score.`,
      );
    } else {
      errorFeedback.push(
        `- **QA Scorecard Missing:** You must include a QA Simulator Guardian Scorecard with a TOTAL AVERAGE score.`,
      );
    }
  }

  errorFeedback.push(
    ``,
    `### Original Error Details:`,
    validationResult.details,
    ``,
    `IMPORTANT: Fix ALL the issues listed above. Do NOT repeat the same mistakes.`,
  );

  const reinforcedPrompt = `${failureDetails.originalPrompt}\n\n---\n\n${errorFeedback.join('\n')}`;

  return {
    action: 'retry',
    reinforcedPrompt,
    retryCount: retryNumber,
    reason: `Retry ${retryNumber}/${MAX_RETRIES} with reinforced prompt addressing: ${validationResult.details}`,
  };
}

// ---------------------------------------------------------------------------
// Layer 4 — Post-Execution Audit Log (Task 5: AC8, AC9)
// ---------------------------------------------------------------------------

/**
 * Append an audit trail entry for a sub-agent execution.
 *
 * Writes to `_iwish-output/audit-trail-epic-{epicId}.json`. Creates the file
 * if it does not exist. Each entry records the sub-agent's persona, workflow
 * used, validation result, retry count, and timing.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @param epicId - The epic identifier (e.g. "10") used in the filename.
 * @param entry - The audit entry to append.
 */
export async function appendAuditEntry(
  projectRoot: string,
  epicId: string,
  entry: AuditEntry,
): Promise<void> {
  const outputDir = path.join(projectRoot, I_WISH_OUTPUT_DIR);
  await fs.ensureDir(outputDir);

  const filePath = path.join(outputDir, `audit-trail-epic-${epicId}.json`);

  let entries: AuditEntry[] = [];
  if (await fs.pathExists(filePath)) {
    try {
      const existing = await fs.readJson(filePath);
      if (Array.isArray(existing)) {
        entries = existing as AuditEntry[];
      }
    } catch {
      // If file is corrupt, start fresh
      entries = [];
    }
  }

  entries.push(entry);
  await fs.writeJson(filePath, entries, { spaces: 2 });
}

/**
 * Query the audit trail for a specific epic, optionally filtered by storyId or agentPersona.
 *
 * Reads from `_iwish-output/audit-trail-epic-{epicId}.json` and applies
 * the provided filters to return matching entries.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @param epicId - The epic identifier (e.g. "10") used in the filename.
 * @param filters - Optional filters for storyId and/or agentPersona.
 * @returns An array of matching `AuditEntry` records.
 */
export async function queryAuditTrail(
  projectRoot: string,
  epicId: string,
  filters: AuditQueryFilters = {},
): Promise<AuditEntry[]> {
  const filePath = path.join(projectRoot, I_WISH_OUTPUT_DIR, `audit-trail-epic-${epicId}.json`);

  if (!(await fs.pathExists(filePath))) {
    return [];
  }

  let entries: AuditEntry[];
  try {
    const raw = await fs.readJson(filePath);
    entries = Array.isArray(raw) ? (raw as AuditEntry[]) : [];
  } catch {
    return [];
  }

  return entries.filter((entry) => {
    if (filters.storyId && entry.storyId !== filters.storyId) {
      return false;
    }
    if (filters.agentPersona && entry.agentPersona !== filters.agentPersona) {
      return false;
    }
    return true;
  });
}
