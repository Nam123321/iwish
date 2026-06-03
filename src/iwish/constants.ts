import * as os from 'os';
import * as path from 'path';

export type RuntimeNamespace = 'iwish' | 'legacy-bmad';
export type InstallTargetStatus = 'supported' | 'planned';
export type InstallTargetDefinition = {
  id: string;
  status: InstallTargetStatus;
  installPath: string | null;
  summary: string;
  adapterStory: string | null;
};

export const REPO_ROOT = path.resolve(__dirname, '../..');
export const TEMPLATES_ROOT = path.join(REPO_ROOT, 'templates', 'iwish');
export const RUNTIME_TEMPLATE_ROOT = path.join(TEMPLATES_ROOT, 'runtime');
export const MODULE_TEMPLATE_ROOT = path.join(TEMPLATES_ROOT, 'modules');
export const CAPABILITY_TEMPLATE_ROOT = path.join(TEMPLATES_ROOT, 'capability-package');
export const I_WISH_OUTPUT_DIR = '_iwish-output';

export const INSTALL_TARGET_CATALOG: InstallTargetDefinition[] = [
  {
    id: 'claude-code',
    status: 'supported',
    installPath: '.claude',
    summary: 'First-party runtime materialization for Claude Code projects.',
    adapterStory: null,
  },
  {
    id: 'local-terminal',
    status: 'supported',
    installPath: '.iwish',
    summary: 'First-party runtime materialization for local terminal-based agent projects.',
    adapterStory: null,
  },
  {
    id: 'cursor',
    status: 'supported',
    installPath: '.cursor/rules',
    summary: 'First-party runtime materialization for Cursor rules and prompts.',
    adapterStory: null,
  },
  {
    id: 'windsurf',
    status: 'supported',
    installPath: '.windsurf/rules',
    summary: 'First-party runtime materialization for Windsurf rules and workspace prompts.',
    adapterStory: null,
  },
  {
    id: 'opencode',
    status: 'supported',
    installPath: '.opencode',
    summary: 'First-party runtime materialization for OpenCode workspace instructions.',
    adapterStory: null,
  },
  {
    id: 'google antigravity',
    status: 'supported',
    installPath: '.gemini',
    summary: 'First-party runtime materialization for Google Antigravity and Gemini-aligned workspace instructions.',
    adapterStory: null,
  },
  {
    id: 'openai',
    status: 'supported',
    installPath: '.openai',
    summary: 'First-party runtime materialization for OpenAI Custom GPTs and workspace instructions.',
    adapterStory: null,
  },
] as const;

export const SUPPORTED_INSTALL_TARGETS = INSTALL_TARGET_CATALOG.filter((target) => target.status === 'supported').map(
  (target) => target.id,
) as string[];
export const SUPPORTED_TOOL_PROFILES = ['browser', 'design', 'graph'] as const;

export const LEGACY_AGENT_ALIASES: Record<string, string> = {
  'grand-priest': 'orch-agent',
  whis: 'capability-agent',
  vegeta: 'dev-agent',
  piccolo: 'architect-agent',
  'android-18': 'ux-agent',
  'tien-shinhan': 'qa-agent',
  hit: 'review-agent',
  'king-kai': 'pm-agent',
  trunks: 'delivery-manager-agent',
  bulma: 'analyst-agent',
  shenron: 'data-architect-agent',
  gotenks: 'creative-agent',
  'master-roshi': 'research-agent',
};

export const LEGACY_COMMAND_ALIASES: Record<string, string> = {
  '/dev-story': '/code',
  '/create-story': '/make-story',
  '/create-ui-spec': '/make-ui-spec',
  '/code-review': '/review',
  '/prfaq': '/idea-challenge',
  '/working-backwards': '/idea-challenge',
  '/correct-course': '/pivot-project',
  '/course-correct': '/pivot-project',
  '/create-capability': '/create-skill',
  '/enhance-capability': '/enhance-skill',
  '/market-research': '/research',
  '/competitor-research': '/research',
  '/domain-research': '/research',
  '/technical-research': '/research',
  '/retrospective': '/retro',
  '/create-data-spec': '/make-data-spec',
  '/create-prd': '/plan',
  '/create-epics-and-stories': '/make-story',
  '/create-product-brief': '/plan',
  '/edit-prd': '/plan',
  '/validate-prd': '/plan',
  '/check-implementation-readiness': '/plan',
  '/create-ux-design': '/make-ui-spec',
  '/enrich-ux': '/make-ui-spec',
  '/sync-stitch-design': '/make-ui-spec',
  '/sprint-planning': '/plan',
  '/sprint-status': '/status',
  '/qa-automate': '/review',
  '/quick-dev': '/code',
  '/quick-spec': '/make-story',
  '/document-project': '/bootstrap-existing-project',
  '/generate-project-context': '/bootstrap-existing-project',
  '/iwish-code-graph': '/code-graph',
  '/per': '/project-expansion-review',
  '/feature-expansion-review': '/project-expansion-review',
  '/idea-discovery': '/idea-discover',
  '/brand-id': '/brand',
  '/brand-guideline': '/brand',
  '/logo': '/brand',
};

export function getCanonicalHome(): string {
  return process.env.IWISH_HOME || path.join(os.homedir(), '.iwish');
}

export type PlatformMode = 'AG_MAO' | 'LEGACY_INJECTION';

export function getPlatformMode(): PlatformMode {
  if (process.env.ANTIGRAVITY_SDK_VERSION) {
    return 'AG_MAO';
  }
  return 'LEGACY_INJECTION';
}


export function getRuntimeRoot(projectRoot: string, namespace: RuntimeNamespace): string {
  return path.join(projectRoot, '_iwish');
}

export function getInstallTargetDir(projectRoot: string, platform: string): string {
  const target = INSTALL_TARGET_CATALOG.find((entry) => entry.id === platform);
  if (!target || !target.installPath) {
    return path.join(projectRoot, '.agent');
  }
  return path.join(projectRoot, ...target.installPath.split('/'));
}
