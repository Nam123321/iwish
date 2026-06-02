import * as fs from 'fs-extra';
import * as path from 'path';
import YAML from 'yaml';

import { getRuntimeRoot, LEGACY_AGENT_ALIASES, LEGACY_COMMAND_ALIASES } from './constants';
import { loadAliasRegistry, searchCatalog } from './catalog';
import { getStatus } from './runtime';
import { loadRoutingProfiles } from './routing-profile';
import { findSourceOfTruthMatches, loadSourceOfTruth } from './source-of-truth';
import { buildToolSetupPrompts, ToolSetupPrompt } from './tooling';

type ConfidenceBand = 'direct' | 'options' | 'clarify';

export type RouteDecision = {
  timestamp: string;
  request: string;
  normalizedRequest: string;
  canonicalCommand: string;
  legacyAliasMatched: string | null;
  targetAgent: string;
  routeReason: string;
  graphStatus: 'available' | 'degraded' | 'unavailable';
  contextScope: {
    storyCount: number;
    epicCount: number;
    bugTrackerPresent: boolean;
    legacyRuntimeDetected: boolean;
    matchedStories: string[];
    matchedEpics: string[];
    reconciliationScopes: string[];
  };
  candidateCatalogEntries: Array<{
    id: string;
    type: string;
    canonical: string;
    source: string;
  }>;
  followUp: {
    requiresReconciliation: boolean;
    recommendedQueueType: 'bugfix' | 'code-change' | 'feature-tweak' | 'design-tweak' | 'repo-absorption' | 'none';
  };
  scoring: {
    threadContinuityScore: number;
    artifactFocusScore: number;
    sourceOfTruthMatchScore: number;
    artifactReadinessScore: number;
    routingProfileFitScore: number;
    currentTurnKeywordScore: number;
    ambiguityPenalty: number;
    totalScore: number;
    confidencePercent: number;
    confidenceBand: ConfidenceBand;
    evidence: string[];
  };
  recommendations: {
    workflowChain: string[];
    supportiveSkills: string[];
    artifactChain: string[];
  };
  toolSetupPrompts: ToolSetupPrompt[];
};

function nowIso(): string {
  return new Date().toISOString();
}

function countFiles(dirPath: string): number {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }
  return fs.readdirSync(dirPath).filter((entry) => !entry.startsWith('.')).length;
}

function getTargetAgent(canonicalCommand: string): string {
  switch (canonicalCommand) {
    case '/idea-challenge':
      return 'pm-agent';
    case '/plan':
    case '/project-expansion-review':
      return 'pm-agent';
    case '/review':
      return 'review-agent';
    case '/make-ui-spec':
      return 'ux-agent';
    case '/research':
    case '/idea-discover':
      return 'research-agent';
    case '/pivot-project':
      return 'orch-agent';
    case '/bootstrap-existing-project':
      return 'orch-agent';
    case '/make-story':
    case '/retro':
      return 'delivery-manager-agent';
    case '/code':
      return 'dev-agent';
    case '/create-skill':
    case '/enhance-skill':
    case '/research-solution-sources':
    case '/register-skill-pack':
    case '/absorb-repo':
      return 'capability-agent';
    default:
      return 'orch-agent';
  }
}

function detectCommand(normalizedRequest: string): { canonicalCommand: string; legacyAliasMatched: string | null; targetAgent: string; routeReason: string } {
  if (normalizedRequest.startsWith('/')) {
    const exact = normalizedRequest.split(/\s+/)[0];
    const canonical = LEGACY_COMMAND_ALIASES[exact] || exact;
    return {
      canonicalCommand: canonical,
      legacyAliasMatched: exact !== canonical ? exact : null,
      targetAgent: getTargetAgent(canonical),
      routeReason: exact !== canonical ? `Legacy alias ${exact} mapped to ${canonical}` : `Explicit command ${canonical} requested`,
    };
  }

  if (/https?:\/\/github\.com\/|https?:\/\/gitlab\.com\/|https?:\/\/bitbucket\.org\//.test(normalizedRequest)) {
    return {
      canonicalCommand: '/absorb-repo',
      legacyAliasMatched: null,
      targetAgent: 'capability-agent',
      routeReason: 'Repository URL detected, routing to absorption pipeline',
    };
  }

  if (/\b(brownfield|existing project|legacy project|legacy codebase|existing codebase|bootstrap project|document project|project context)\b/.test(normalizedRequest)) {
    return {
      canonicalCommand: '/bootstrap-existing-project',
      legacyAliasMatched: null,
      targetAgent: 'orch-agent',
      routeReason: 'Existing-project or brownfield bootstrap intent detected',
    };
  }

  if (
    /\b(idea-discover|idea discover|discover idea|mom test|jtbd|start idea|new idea)\b/.test(normalizedRequest) ||
    /phỏng vấn ý tưởng|làm rõ ý tưởng|khám phá ý tưởng/.test(normalizedRequest)
  ) {
    return {
      canonicalCommand: '/idea-discover',
      legacyAliasMatched: null,
      targetAgent: 'research-agent',
      routeReason: 'Initial idea discovery or elicitation intent detected',
    };
  }

  if (
    /\b(prfaq|working backwards|working-backwards|press release first|customer faq|internal faq|idea challenge|stress-test (this )?idea|validate (this )?(idea|concept)|product concept)\b/.test(normalizedRequest) ||
    normalizedRequest.includes('challenge assumptions') ||
    /phản biện ý tưởng|thử thách ý tưởng|đánh giá ý tưởng/.test(normalizedRequest)
  ) {
    return {
      canonicalCommand: '/idea-challenge',
      legacyAliasMatched: null,
      targetAgent: 'pm-agent',
      routeReason: 'Discover-phase concept challenge intent detected',
    };
  }

  if (/\b(unique advantage|business advantage|strategic advantage|unfair advantage|business model advantage|pricing advantage|distribution advantage|competitive edge|biz stack|defensibility|moat|economic moat|network effects|switching costs|counter-positioning|cornered resource|lợi thế cạnh tranh|lợi thế cạnh tranh bất bình đẳng|lợi thế kinh doanh|lợi thế mô hình|lợi thế bền vững|lợi thế khó sao chép|khác biệt cạnh tranh)\b/.test(normalizedRequest)) {
    return {
      canonicalCommand: /\b(pivot|re-route|reroute|scope drift|mid sprint|mid-sprint)\b/.test(normalizedRequest) ? '/pivot-project' : '/idea-challenge',
      legacyAliasMatched: null,
      targetAgent: /\b(pivot|re-route|reroute|scope drift|mid sprint|mid-sprint)\b/.test(normalizedRequest) ? 'orch-agent' : 'pm-agent',
      routeReason: 'Strategic advantage or business differentiation intent detected',
    };
  }

  if (
    /\b(project expansion|feature expansion|expansion review|evaluate expansion|project-expansion-review|per review)\b/.test(normalizedRequest) ||
    /đánh giá mở rộng|đánh giá tác động mở rộng|review mở rộng/.test(normalizedRequest)
  ) {
    return {
      canonicalCommand: '/project-expansion-review',
      legacyAliasMatched: null,
      targetAgent: 'pm-agent',
      routeReason: 'Project expansion or impact evaluation intent detected',
    };
  }

  if (/\b(course correct|course-correct|pivot|rescope|scope drift|major change|significant change|mid sprint|mid-sprint|wrong direction|re-route|reroute|change navigation)\b/.test(normalizedRequest)) {
    return {
      canonicalCommand: '/pivot-project',
      legacyAliasMatched: null,
      targetAgent: 'orch-agent',
      routeReason: 'Mid-flight pivot or change-navigation intent detected',
    };
  }

  if (/\b(create|build|make|scaffold)\s+(a\s+)?(new\s+)?(skill|workflow|agent)\b/.test(normalizedRequest)) {
    return {
      canonicalCommand: '/create-skill',
      legacyAliasMatched: null,
      targetAgent: 'capability-agent',
      routeReason: 'Capability creation intent detected',
    };
  }

  if (/\b(register|import|integrate|install|attach)\b.*\b(skill pack|workflow pack|skill|module|superpower|external repo|custom module)\b/.test(normalizedRequest)) {
    return {
      canonicalCommand: '/register-skill-pack',
      legacyAliasMatched: null,
      targetAgent: 'capability-agent',
      routeReason: 'Open customization module intake intent detected',
    };
  }

  if (
    normalizedRequest.includes('github') &&
    /\b(repo|repository|framework|package|module|solution|skill|workflow|agent)\b/.test(normalizedRequest)
  ) {
    return {
      canonicalCommand: '/research-solution-sources',
      legacyAliasMatched: null,
      targetAgent: 'capability-agent',
      routeReason: 'Explicit GitHub/external solution research intent detected',
    };
  }

  if (
    /\b(research|search|find|compare|look for|discover)\b.*\b(github|repo|repository|framework|package|module|open source|open-source|solution|skill)\b/.test(normalizedRequest) ||
    /\b(find|search|look for|discover|compare)\b.*\b(repo|repository|skill|workflow|agent|framework|package|module|solution)\b/.test(normalizedRequest) ||
    /\b(is there (already )?(a|an)?\s*(skill|repo|framework|package|module|solution))\b/.test(normalizedRequest) ||
    /nghiên cứu.*github|research.*github|github.*giải pháp|github.*solution/.test(normalizedRequest) ||
    /tìm repo|tìm skill|tìm giải pháp|tìm framework|tìm package|tìm module/.test(normalizedRequest) ||
    (normalizedRequest.includes('tìm') && /\brepo|skill|framework|package|module|giải pháp\b/.test(normalizedRequest))
  ) {
    return {
      canonicalCommand: '/research-solution-sources',
      legacyAliasMatched: null,
      targetAgent: 'capability-agent',
      routeReason: 'Capability/repo solution-source research intent detected',
    };
  }

  if (/\b(review|audit|feedback|pull request|pr)\b/.test(normalizedRequest)) {
    return {
      canonicalCommand: '/review',
      legacyAliasMatched: null,
      targetAgent: 'review-agent',
      routeReason: 'Review intent detected',
    };
  }

  if (/\b(enhance|evolve|upgrade|refine|improve|patch)\s+(an?\s+|the\s+)?(skill|workflow|agent)\b/.test(normalizedRequest)) {
    return {
      canonicalCommand: '/enhance-skill',
      legacyAliasMatched: null,
      targetAgent: 'capability-agent',
      routeReason: 'Capability evolution intent detected',
    };
  }

  if (
    /\b(ui|ux|design|figma|stitch|canva|claude design|layout|screen)\b/.test(normalizedRequest) ||
    /thiết kế|tạo thiết kế|tool thiết kế|website thiết kế|công cụ thiết kế/.test(normalizedRequest)
  ) {
    return {
      canonicalCommand: '/make-ui-spec',
      legacyAliasMatched: null,
      targetAgent: 'ux-agent',
      routeReason: 'UI/design intent detected',
    };
  }

  if (/\b(plan|prd|brief|roadmap|priorit(y|ize)|product strategy|product plan)\b/.test(normalizedRequest)) {
    return {
      canonicalCommand: '/plan',
      legacyAliasMatched: null,
      targetAgent: 'pm-agent',
      routeReason: 'Product planning intent detected',
    };
  }

  if (/\b(story|epic|spec|acceptance criteria)\b/.test(normalizedRequest)) {
    return {
      canonicalCommand: '/make-story',
      legacyAliasMatched: null,
      targetAgent: 'delivery-manager-agent',
      routeReason: 'Planning/story intent detected',
    };
  }

  if (/\b(research|market|domain|technical|analyze)\b/.test(normalizedRequest)) {
    return {
      canonicalCommand: '/research',
      legacyAliasMatched: null,
      targetAgent: 'research-agent',
      routeReason: 'Research intent detected',
    };
  }

  if (/\b(retro|retrospective|postmortem)\b/.test(normalizedRequest)) {
    return {
      canonicalCommand: '/retro',
      legacyAliasMatched: null,
      targetAgent: 'delivery-manager-agent',
      routeReason: 'Retrospective intent detected',
    };
  }

  if (/\b(gen-dashboard|gen dashboard|generate dashboard|idea navigator)\b/.test(normalizedRequest)) {
    return {
      canonicalCommand: '/gen-dashboard',
      legacyAliasMatched: null,
      targetAgent: 'orch-agent',
      routeReason: 'Dashboard generation intent detected',
    };
  }

  if (/\b(status|sprint|progress|blocker|blockers|release note|summary|weekly update|report)\b/.test(normalizedRequest)) {
    return {
      canonicalCommand: '/status',
      legacyAliasMatched: null,
      targetAgent: 'orch-agent',
      routeReason: 'Status/communication intent detected',
    };
  }

  if (/\b(bug|fix|patch|refactor|implement|code|feature)\b/.test(normalizedRequest)) {
    return {
      canonicalCommand: '/code',
      legacyAliasMatched: null,
      targetAgent: 'dev-agent',
      routeReason: 'Code/change intent detected',
    };
  }

  return {
    canonicalCommand: '/status',
    legacyAliasMatched: null,
    targetAgent: 'orch-agent',
    routeReason: 'Defaulted to orchestration status/help route',
  };
}

function getGraphStatus(projectRoot: string): 'available' | 'degraded' | 'unavailable' {
  const runtimeGraphProfile = path.join(getRuntimeRoot(projectRoot, 'iwish'), 'graphs', 'graph-profile.yaml');
  const knowledgeGraph = path.join(projectRoot, '.agent', 'knowledge-graph.yaml');
  const graphProfile = fs.existsSync(runtimeGraphProfile)
    ? (YAML.parse(fs.readFileSync(runtimeGraphProfile, 'utf8')) as { selection_state?: string; graph_profile?: string })
    : null;

  if (
    fs.existsSync(runtimeGraphProfile) &&
    fs.existsSync(knowledgeGraph) &&
    graphProfile?.selection_state !== 'required' &&
    graphProfile?.graph_profile !== 'pending-selection'
  ) {
    return 'available';
  }
  if (fs.existsSync(runtimeGraphProfile) || fs.existsSync(knowledgeGraph)) {
    return 'degraded';
  }
  return 'unavailable';
}

function loadRecentRouteDecisions(projectRoot: string, limit = 3): Array<{ canonicalCommand?: string; contextScope?: { matchedStories?: string[]; matchedEpics?: string[] } }> {
  const dir = path.join(getRuntimeRoot(projectRoot, 'iwish'), 'runtime', 'route-decisions');
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((entry) => entry.endsWith('.json'))
    .sort()
    .slice(-limit)
    .map((entry) => {
      try {
        return fs.readJsonSync(path.join(dir, entry)) as { canonicalCommand?: string; contextScope?: { matchedStories?: string[]; matchedEpics?: string[] } };
      } catch {
        return {};
      }
    });
}

function getKeywordScore(normalizedRequest: string, canonicalCommand: string): number {
  if (canonicalCommand === '/research-solution-sources') {
    if (/\b(github|repo|repository|skill|framework|package|module|solution|compare|research)\b/.test(normalizedRequest)) return 18;
  }
  if (canonicalCommand === '/make-story') {
    if (/\b(story|epic|acceptance criteria|backlog)\b/.test(normalizedRequest)) return 18;
  }
  if (canonicalCommand === '/code') {
    if (/\b(implement|code|fix|patch|feature)\b/.test(normalizedRequest)) return 18;
  }
  if (canonicalCommand === '/plan') {
    if (/\b(plan|prd|brief|roadmap)\b/.test(normalizedRequest)) return 18;
  }
  return 10;
}

function isImplementationIntent(normalizedRequest: string): boolean {
  return /\b(fix|implement|code|patch|bug|ship|complete|build)\b/.test(normalizedRequest);
}

function isPlanningIntent(normalizedRequest: string): boolean {
  return /\b(create|draft|write|refine|story|epic|acceptance criteria|spec|plan)\b/.test(normalizedRequest);
}

function computeScoring(
  projectRoot: string,
  normalizedRequest: string,
  canonicalCommand: string,
  routeReason: string,
  truthMatches: ReturnType<typeof findSourceOfTruthMatches>,
  truth: ReturnType<typeof loadSourceOfTruth>,
  routeProfileExists: boolean,
): RouteDecision['scoring'] {
  const evidence: string[] = [];
  const recentDecisions = loadRecentRouteDecisions(projectRoot);
  let threadContinuityScore = 0;
  let artifactFocusScore = 0;
  let sourceOfTruthMatchScore = 0;
  let artifactReadinessScore = 0;
  let routingProfileFitScore = routeProfileExists ? 12 : 4;
  const currentTurnKeywordScore = getKeywordScore(normalizedRequest, canonicalCommand);
  let ambiguityPenalty = 0;

  if (routeProfileExists) {
    evidence.push('Routing profile exists for selected canonical workflow.');
  }

  if (truthMatches.stories.length > 0 || truthMatches.epics.length > 0) {
    sourceOfTruthMatchScore = 22;
    evidence.push(`Source-of-truth matched: ${[...truthMatches.stories, ...truthMatches.epics].join(', ')}.`);
  }

  const matchedStoryRecords = truth.storyRecords.filter((record) => truthMatches.stories.includes(record.id));
  if (matchedStoryRecords.length > 0) {
    artifactFocusScore = 18;
    evidence.push(`Active artifact focus detected on ${matchedStoryRecords.map((record) => record.id).join(', ')}.`);

    const strongestRecord = matchedStoryRecords[0];
    const storyLifecycleState = (strongestRecord.fileStatus || strongestRecord.sprintStatus || '').toLowerCase();
    if (strongestRecord.readiness === 'high') {
      artifactReadinessScore = 18;
      evidence.push(`Story ${strongestRecord.id} has high readiness (${strongestRecord.fileStatus || strongestRecord.sprintStatus || 'unknown'}).`);
    } else if (strongestRecord.readiness === 'medium') {
      artifactReadinessScore = 10;
      evidence.push(`Story ${strongestRecord.id} has medium readiness.`);
    } else {
      artifactReadinessScore = 2;
      evidence.push(`Story ${strongestRecord.id} looks thin or incomplete; prefer canonical planning refinement first.`);
    }

    if (storyLifecycleState === 'review') {
      if (canonicalCommand === '/review') {
        artifactReadinessScore += 8;
        evidence.push(`Story ${strongestRecord.id} is in review state, strengthening /review as the next canonical action.`);
      }
      if (canonicalCommand === '/status') {
        ambiguityPenalty += 6;
        evidence.push(`Story ${strongestRecord.id} is awaiting review, so pure status/orchestration is less precise than /review.`);
      }
      if (canonicalCommand === '/code') {
        ambiguityPenalty += 10;
        evidence.push(`Story ${strongestRecord.id} is awaiting review; penalizing direct /code until review or explicit reopen intent.`);
      }
      if (canonicalCommand === '/make-story') {
        ambiguityPenalty += 14;
        evidence.push(`Story ${strongestRecord.id} already passed story creation and is awaiting review; penalizing /make-story.`);
      }
    }

    if (storyLifecycleState === 'todo' && canonicalCommand === '/make-story') {
      artifactReadinessScore += 6;
      evidence.push(`Story status is TODO, strengthening /make-story as the next action.`);
    }

    if (['completed', 'done', 'closed'].includes(storyLifecycleState)) {
      if (canonicalCommand === '/make-story') {
        ambiguityPenalty += 18;
        evidence.push(`Story ${strongestRecord.id} is already completed; penalizing /make-story as a likely next action.`);
      }
      if (canonicalCommand === '/code') {
        ambiguityPenalty += 14;
        evidence.push(`Story ${strongestRecord.id} is already completed; penalizing direct /code unless the user explicitly reopens or rescopes the work.`);
      }
      if (canonicalCommand === '/status') {
        artifactReadinessScore += 6;
        evidence.push(`Story ${strongestRecord.id} is completed, strengthening orchestration/status guidance over planning.`);
      }
    }
  }

  const recentStoryOverlap = recentDecisions.some((decision) =>
    (decision.contextScope?.matchedStories || []).some((storyId) => truthMatches.stories.includes(storyId)),
  );
  const recentCommandOverlap = recentDecisions.some((decision) => decision.canonicalCommand === canonicalCommand);
  if (recentStoryOverlap || recentCommandOverlap) {
    threadContinuityScore = recentStoryOverlap ? 22 : 14;
    evidence.push(recentStoryOverlap ? 'Recent route decisions show the same story thread.' : 'Recent route decisions show command continuity.');
  }

  if ((truthMatches.stories.length + truthMatches.epics.length) > 1) {
    ambiguityPenalty += 10;
    evidence.push('Multiple story/epic matches increase ambiguity.');
  }

  if (canonicalCommand === '/status' && /Defaulted to orchestration status/.test(routeReason) && sourceOfTruthMatchScore === 0) {
    ambiguityPenalty += 6;
  }

  const totalScore = Math.max(0, Math.min(100, threadContinuityScore + artifactFocusScore + sourceOfTruthMatchScore + artifactReadinessScore + routingProfileFitScore + currentTurnKeywordScore - ambiguityPenalty));
  const confidencePercent = totalScore;
  const confidenceBand: ConfidenceBand =
    confidencePercent >= 90 ? 'direct' : confidencePercent >= 70 ? 'options' : 'clarify';

  return {
    threadContinuityScore,
    artifactFocusScore,
    sourceOfTruthMatchScore,
    artifactReadinessScore,
    routingProfileFitScore,
    currentTurnKeywordScore,
    ambiguityPenalty,
    totalScore,
    confidencePercent,
    confidenceBand,
    evidence,
  };
}

function buildRecommendations(
  canonicalCommand: string,
  normalizedRequest: string,
): RouteDecision['recommendations'] {
  if (canonicalCommand === '/idea-challenge') {
    const workflowChain = ['/idea-challenge'];
    const supportiveSkills = ['socratic-review', 'idea-hardening'];
    const artifactChain = ['idea-challenge-{project}.md', 'idea-challenge-{project}-distillate.md'];

    const needsResearch = /\b(research|market|domain|competitor|feasibility|evidence|benchmark|pricing|distribution|segment|user behavior|technical)\b/.test(normalizedRequest);
    const needsAdvantage = /\b(unique advantage|business advantage|strategic advantage|unfair advantage|business model advantage|pricing advantage|distribution advantage|competitive edge|biz stack|defensibility|moat|economic moat|network effects|switching costs|counter-positioning|cornered resource|lợi thế cạnh tranh|lợi thế kinh doanh|lợi thế mô hình|lợi thế bền vững|lợi thế khó sao chép|khác biệt cạnh tranh)\b/.test(normalizedRequest);

    if (needsResearch || needsAdvantage) {
      workflowChain.push('/research');
      artifactChain.push('research notes / evidence brief');
    }

    if (needsAdvantage) {
      supportiveSkills.push('unique-advantage-evaluator');
      artifactChain.push('biz-stack.md');
    }

    workflowChain.push('/plan');
    artifactChain.push('product brief / PRD draft');

    return { workflowChain, supportiveSkills, artifactChain };
  }

  if (canonicalCommand === '/pivot-project') {
    return {
      workflowChain: ['/pivot-project', '/research', '/plan'],
      supportiveSkills: ['socratic-review', 'unique-advantage-evaluator', 'pivot-guardian'],
      artifactChain: ['pivot notes', 'impact analysis', 'updated plan / story / epic context'],
    };
  }

  if (canonicalCommand === '/research-solution-sources') {
    const explicitInternalOnly = /\b(internal only|internal capability|only internal|repo mình|nội bộ|existing iwish|existing i-wish)\b/.test(normalizedRequest);
    const explicitExternalSearch = /\b(github|repo|repository|framework|package|module|open source|open-source|external)\b/.test(normalizedRequest);
    const defaultToExternal = explicitExternalSearch || !explicitInternalOnly;
    return {
      workflowChain: ['/research-solution-sources', 'discover', 'enrich', 'trust-check', 'deep-dive', 'recommend'],
      supportiveSkills: defaultToExternal ? ['github-deep-research', 'repo-absorption'] : ['repo-absorption'],
      artifactChain: defaultToExternal
        ? [
            'candidate-pool.md',
            'candidate-enrichment-table.md',
            'trust-screening.md',
            'finalist-deep-dive.md',
            'solution-research-verdict.md',
            'shortlist-scorecard.md',
            'next action: enhance-skill | create-skill | register-skill-pack | absorb-repo | reference only | compose multiple solutions',
          ]
        : [
            'candidate-pool.md',
            'candidate-enrichment-table.md',
            'solution-research-verdict.md',
            'next action: enhance-skill | create-skill | register-skill-pack | absorb-repo | reference only | compose multiple solutions',
          ],
    };
  }

  return {
    workflowChain: [canonicalCommand],
    supportiveSkills: [],
    artifactChain: [],
  };
}

export async function routeRequest(projectRoot: string, request: string): Promise<RouteDecision> {
  const normalizedRequest = request.trim().toLowerCase();
  const status = getStatus(projectRoot);
  const sourceOfTruth = loadSourceOfTruth(projectRoot);
  const truthMatches = findSourceOfTruthMatches(projectRoot, request);
  const routingProfiles = loadRoutingProfiles(projectRoot);
  let initialRoute = detectCommand(normalizedRequest);

  const activeWorkflowPath = path.join(getRuntimeRoot(projectRoot, 'iwish'), 'runtime', 'workflows', 'active-workflow.json');
  let activeWorkflow: any = null;
  if (fs.existsSync(activeWorkflowPath)) {
    try {
      activeWorkflow = fs.readJsonSync(activeWorkflowPath);
    } catch (e) {
      // ignore
    }
  }

  const isContinuation = /^(yes|no|continue|next|skip|y|n|c|tiếp tục|tiep tuc)$/.test(normalizedRequest);

  if (activeWorkflow && activeWorkflow.status === 'in-progress' && (isContinuation || normalizedRequest === '')) {
    const wfName = activeWorkflow.workflow;
    const currentPhase = activeWorkflow.current_phase;
    let canonicalCommand = `/${wfName}`;
    let targetAgent = 'orch-agent';
    let routeReason = `Active workflow '${wfName}' in progress at phase/step '${currentPhase}'. Continuing sequence.`;

    if (wfName === 'absorb-repo') {
      const agentsMap: Record<string, string> = {
        '0': 'review-agent',
        '1': 'capability-agent',
        '1.5': 'architect-agent',
        '2': 'architect-agent',
        '3': 'capability-agent',
        '4': 'capability-agent',
        '5': 'architect-agent',
        '5.5': 'orch-agent',
        '6': 'dev-agent',
        '7': 'review-agent'
      };
      targetAgent = agentsMap[String(currentPhase)] || 'orch-agent';
      routeReason = `Continuing active Repo Absorption (Phase ${currentPhase}) using ${targetAgent}`;
    } else if (wfName === 'create-skill') {
      const agentsMap: Record<string, string> = {
        'triage': 'capability-agent',
        'spec': 'capability-agent',
        'red-phase': 'capability-agent',
        'forge': 'capability-agent',
        'validate': 'capability-agent'
      };
      targetAgent = agentsMap[String(currentPhase)] || 'capability-agent';
      routeReason = `Continuing active Create Skill (Step ${currentPhase}) using ${targetAgent}`;
    }

    initialRoute = {
      canonicalCommand,
      legacyAliasMatched: null,
      targetAgent,
      routeReason
    };
  }
  const strongestMatchedStory = sourceOfTruth.storyRecords.find((record) => truthMatches.stories.includes(record.id));
  const strongestStoryState = strongestMatchedStory
    ? (strongestMatchedStory.fileStatus || strongestMatchedStory.sprintStatus || '').toLowerCase()
    : '';
  const implementationIntent = isImplementationIntent(normalizedRequest);
  const planningIntent = isPlanningIntent(normalizedRequest);
  const reviewIntent = /\b(review|audit|validate|check|verify)\b/.test(normalizedRequest);
  const storyLooksReviewPending = Boolean(
    strongestMatchedStory &&
      strongestMatchedStory.readiness === 'high' &&
      ['review', 'ready-for-review', 'ready_for_review'].includes(strongestStoryState),
  );
  const storyLooksCompleted = Boolean(
    strongestMatchedStory &&
      strongestMatchedStory.readiness === 'high' &&
      ['completed', 'done', 'closed'].includes(strongestStoryState),
  );
  const storyLooksExecutionReady = Boolean(
    strongestMatchedStory &&
      strongestMatchedStory.readiness === 'high' &&
      ['ready', 'in-progress', 'in_progress'].includes(strongestStoryState),
  );
  const storyLooksPlanningFirst = Boolean(
    strongestMatchedStory &&
      (
        strongestMatchedStory.readiness !== 'high' ||
        ['todo', 'draft', 'backlog', 'planning', 'unknown', ''].includes(strongestStoryState)
      ),
  );
  const route =
    (truthMatches.stories.length > 0 || truthMatches.epics.length > 0) &&
    (initialRoute.canonicalCommand === '/status' || initialRoute.canonicalCommand === '/make-story' || initialRoute.canonicalCommand === '/code' || initialRoute.canonicalCommand === '/review')
      ? {
          canonicalCommand:
            storyLooksReviewPending
              ? '/review'
              : storyLooksCompleted && !implementationIntent && !planningIntent
              ? '/status'
              : storyLooksCompleted && implementationIntent
                ? '/status'
              : reviewIntent && storyLooksExecutionReady
                ? '/review'
              : implementationIntent && storyLooksExecutionReady
              ? '/code'
              : storyLooksPlanningFirst
                ? '/make-story'
                : implementationIntent
                  ? '/code'
                  : storyLooksCompleted
                    ? '/status'
                    : '/make-story',
          legacyAliasMatched: initialRoute.legacyAliasMatched,
          targetAgent:
            storyLooksReviewPending
              ? 'review-agent'
              : storyLooksCompleted && !implementationIntent && !planningIntent
              ? 'orch-agent'
              : storyLooksCompleted && implementationIntent
                ? 'orch-agent'
              : reviewIntent && storyLooksExecutionReady
                ? 'review-agent'
              : implementationIntent && storyLooksExecutionReady
              ? 'dev-agent'
              : storyLooksCompleted
                ? 'orch-agent'
                : 'delivery-manager-agent',
          routeReason:
            storyLooksReviewPending && strongestMatchedStory
              ? `Source-of-truth match detected for ${[...truthMatches.stories, ...truthMatches.epics].join(', ')}; story is awaiting review, so Orch should route into the canonical review workflow`
              : storyLooksCompleted && strongestMatchedStory && !implementationIntent && !planningIntent
              ? `Source-of-truth match detected for ${[...truthMatches.stories, ...truthMatches.epics].join(', ')}; story is already completed, so Orch should guide next-step orchestration instead of story creation`
              : storyLooksCompleted && strongestMatchedStory && implementationIntent
                ? `Source-of-truth match detected for ${[...truthMatches.stories, ...truthMatches.epics].join(', ')}; story is already completed, so Orch should confirm reopen/rescope intent before routing back into implementation`
              : storyLooksPlanningFirst && strongestMatchedStory
              ? `Source-of-truth match detected for ${[...truthMatches.stories, ...truthMatches.epics].join(', ')}; story readiness suggests canonical planning refinement first`
              : `Source-of-truth match detected for ${[...truthMatches.stories, ...truthMatches.epics].join(', ')}`,
        }
      : initialRoute;
  const candidateCatalogEntries = searchCatalog(projectRoot, normalizedRequest).map((entry) => ({
    id: entry.id,
    type: entry.type,
    canonical: entry.canonical,
    source: entry.source,
  }));

  const storyCount = sourceOfTruth.storyIds.length || countFiles(path.join(projectRoot, '_bmad-output', 'stories')) || countFiles(path.join(projectRoot, '_iwish-output', 'stories'));
  const epicCount = sourceOfTruth.epicIds.length || countFiles(path.join(projectRoot, '_bmad-output', 'epics')) || countFiles(path.join(projectRoot, '_iwish-output', 'epics'));
  const bugTrackerPresent = fs.existsSync(path.join(projectRoot, '_bmad-output', 'bug-tracker.yaml')) || fs.existsSync(path.join(projectRoot, '_iwish-output', 'bug-tracker.yaml'));
  const routeProfile = routingProfiles.find((profile) => profile.kind === 'workflow' && profile.name === route.canonicalCommand.replace(/^\//, ''));
  
  const toolDeps = new Set(routeProfile?.tool_dependencies || []);
  if (
    route.targetAgent === 'ux-agent' ||
    route.canonicalCommand === '/ux-agent' ||
    route.canonicalCommand === '/create-ux-design' ||
    route.canonicalCommand === '/make-ui-spec' ||
    /\b(ui|ux|design|figma|stitch|canva|claude design|layout|screen)\b/.test(normalizedRequest) ||
    /thiết kế|tạo thiết kế|tool thiết kế|website thiết kế|công cụ thiết kế/.test(normalizedRequest)
  ) {
    toolDeps.add('design');
  }

  const toolSetupPrompts = buildToolSetupPrompts(Array.from(toolDeps), status.selectedTools);
  const scoring = computeScoring(
    projectRoot,
    normalizedRequest,
    route.canonicalCommand,
    route.routeReason,
    truthMatches,
    sourceOfTruth,
    Boolean(routeProfile),
  );
  const recommendations = buildRecommendations(route.canonicalCommand, normalizedRequest);

  const requiresReconciliation =
    route.canonicalCommand === '/code' ||
    route.canonicalCommand === '/make-ui-spec' ||
    route.canonicalCommand === '/absorb-repo' ||
    route.canonicalCommand === '/enhance-skill';
  const recommendedQueueType: RouteDecision['followUp']['recommendedQueueType'] =
    route.canonicalCommand === '/absorb-repo'
      ? 'repo-absorption'
      : route.canonicalCommand === '/make-ui-spec'
        ? 'design-tweak'
        : route.canonicalCommand === '/enhance-skill'
          ? 'code-change'
          : route.canonicalCommand === '/code'
          ? /\bbug|fix|patch\b/.test(normalizedRequest)
            ? 'bugfix'
            : 'code-change'
          : 'none';

  const decision: RouteDecision = {
    timestamp: nowIso(),
    request,
    normalizedRequest,
    canonicalCommand: route.canonicalCommand,
    legacyAliasMatched: route.legacyAliasMatched,
    targetAgent: route.targetAgent,
    routeReason: route.routeReason,
    graphStatus: getGraphStatus(projectRoot),
    contextScope: {
      storyCount,
      epicCount,
      bugTrackerPresent,
      legacyRuntimeDetected: status.legacyDetected,
      matchedStories: truthMatches.stories,
      matchedEpics: truthMatches.epics,
      reconciliationScopes: truthMatches.reconciliationScopes,
    },
    candidateCatalogEntries,
    followUp: {
      requiresReconciliation,
      recommendedQueueType,
    },
    scoring,
    recommendations,
    toolSetupPrompts,
  };

  const outputDir = path.join(getRuntimeRoot(projectRoot, 'iwish'), 'runtime', 'route-decisions');
  await fs.ensureDir(outputDir);
  const fileSafeTs = decision.timestamp.replace(/[:.]/g, '-');
  await fs.writeJson(path.join(outputDir, `${fileSafeTs}.json`), decision, { spaces: 2 });

  return decision;
}

export function resolveLegacyName(name: string): string {
  const normalized = name.trim().toLowerCase();
  return LEGACY_AGENT_ALIASES[normalized] || LEGACY_COMMAND_ALIASES[normalized] || normalized;
}
