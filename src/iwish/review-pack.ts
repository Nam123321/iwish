import * as fs from 'fs-extra';
import * as path from 'path';

export type ReviewPackKind = 'external-module' | 'repo-absorption' | 'skill' | 'workflow' | 'agent';
export type ReviewPackRole = 'process-primary' | 'supportive' | 'foundational';

export type ReviewPackInput = {
  projectRoot: string;
  name: string;
  source: string;
  kind: ReviewPackKind;
  shape: string;
  role: ReviewPackRole;
  registrationState: string;
  targetDir?: string;
  moduleClass?: string;
  triggers?: string[];
  toolDependencies?: string[];
  primaryAgents?: string[];
  primaryWorkflows?: string[];
  supportiveSkills?: string[];
  phases?: string[];
  stages?: string[];
  coreUseCases?: string[];
  adjacentUseCases?: string[];
  doNotUseCases?: string[];
  edgeCases?: string[];
  stressCases?: string[];
  constraints?: string[];
  orchHints?: string[];
  reviewQuestions?: string[];
  examples?: string[];
};

export type ReviewPackResult = {
  markdownPath: string;
  htmlPath: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'review-pack';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function list(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function toHtmlList(items: string[]): string {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n');
}

function defaultPhases(role: ReviewPackRole): string[] {
  if (role === 'foundational') {
    return ['cross-phase'];
  }
  if (role === 'process-primary') {
    return ['discover', 'plan', 'solution', 'implement', 'validate', 'deliver'];
  }
  return ['supporting multiple delivery phases'];
}

function defaultStages(kind: ReviewPackKind): string[] {
  switch (kind) {
    case 'repo-absorption':
      return ['intake', 'assessment', 'integration planning'];
    case 'skill':
      return ['task execution', 'specialized assistance'];
    case 'workflow':
      return ['stage orchestration', 'artifact production'];
    case 'agent':
      return ['decision making', 'coordination'];
    default:
      return ['task support', 'artifact generation', 'review support'];
  }
}

function defaultCoreUseCases(input: ReviewPackInput): string[] {
  return [
    `Use ${input.name} when the user explicitly asks for this capability or its native artifact/output.`,
    `Use ${input.name} when Orch needs a specialized ${input.kind.replace('-', ' ')} to improve execution quality.`,
    `Use ${input.name} as a reviewed building block instead of improvising an ad-hoc equivalent.`,
  ];
}

function defaultAdjacentUseCases(input: ReviewPackInput): string[] {
  return [
    `Pair ${input.name} with a parent workflow when the task is broader than the capability itself.`,
    `Use ${input.name} during review, audit, or stakeholder communication when its output can improve clarity.`,
  ];
}

function defaultDoNotUseCases(input: ReviewPackInput): string[] {
  return [
    `Do not default to ${input.name} when a simpler canonical workflow already covers the job.`,
    `Do not use ${input.name} outside its reviewed boundaries without updating this review pack.`,
  ];
}

function defaultEdgeCases(input: ReviewPackInput): string[] {
  return [
    `${input.name} may fit only a slice of a larger task, so Orch should avoid routing the whole request into it prematurely.`,
    `Alias overlap or vague user intent may make ${input.name} look applicable when it should be treated as optional support.`,
  ];
}

function defaultStressCases(input: ReviewPackInput): string[] {
  return [
    `${input.name} should be re-evaluated when the request spans multiple stories, multiple tools, or a full end-to-end delivery phase.`,
    `High-ambiguity requests should trigger a staged plan before ${input.name} is used as a primary driver.`,
  ];
}

function defaultConstraints(input: ReviewPackInput): string[] {
  return [
    `${input.name} remains inside the I-Wish governance model: user review, explicit promotion boundaries, and compatibility-aware routing.`,
    `If ${input.name} is external, Orch should treat it as reviewed support rather than silently promoting it into core behavior.`,
  ];
}

function defaultOrchHints(input: ReviewPackInput): string[] {
  return [
    `Prefer suggesting ${input.name} when its trigger phrases appear and the current stage matches its delivery placement.`,
    `Avoid auto-routing to ${input.name} when the request is still under-scoped and a broader planning or review workflow should run first.`,
  ];
}

function defaultReviewQuestions(input: ReviewPackInput): string[] {
  return [
    `Which use cases of ${input.name} do you want Orch to suggest automatically?`,
    `What edge cases, exclusions, or approval boundaries should Orch respect for ${input.name}?`,
    `Should ${input.name} stay external/supportive, or do you expect deeper promotion into canonical workflows later?`,
  ];
}

function defaultExamples(input: ReviewPackInput): string[] {
  return [
    `Use ${input.name} to support a stage-specific task inside an existing delivery workflow.`,
    `Ask Orch to evaluate whether ${input.name} should be used before implementation begins.`,
    `Review ${input.name} as an optional supportive module for a story that needs better artifacts or stronger quality gates.`,
  ];
}

function buildMarkdown(input: ReviewPackInput, slug: string): string {
  const phases = input.phases || defaultPhases(input.role);
  const stages = input.stages || defaultStages(input.kind);
  const coreUseCases = input.coreUseCases || defaultCoreUseCases(input);
  const adjacentUseCases = input.adjacentUseCases || defaultAdjacentUseCases(input);
  const doNotUseCases = input.doNotUseCases || defaultDoNotUseCases(input);
  const edgeCases = input.edgeCases || defaultEdgeCases(input);
  const stressCases = input.stressCases || defaultStressCases(input);
  const constraints = input.constraints || defaultConstraints(input);
  const orchHints = input.orchHints || defaultOrchHints(input);
  const reviewQuestions = input.reviewQuestions || defaultReviewQuestions(input);
  const examples = input.examples || defaultExamples(input);

  return `# ${input.name} Integration Guide

## Snapshot

- Name: \`${input.name}\`
- Slug: \`${slug}\`
- Source: \`${input.source}\`
- Kind: \`${input.kind}\`
- Shape: \`${input.shape}\`
- Role: \`${input.role}\`
- Registration state: \`${input.registrationState}\`
- Module class: \`${input.moduleClass || 'n/a'}\`
- Trigger hints: ${input.triggers && input.triggers.length > 0 ? input.triggers.map((item) => `\`${item}\``).join(', ') : 'none'}
- Tool dependencies: ${input.toolDependencies && input.toolDependencies.length > 0 ? input.toolDependencies.map((item) => `\`${item}\``).join(', ') : 'none'}

## What It Is

\`${input.name}\` is a ${input.kind.replace('-', ' ')} registered in I-Wish as a \`${input.role}\` capability.

## Why It Exists

- It gives users and Orch a reviewed, reusable capability instead of rediscovering the same solution each time.
- It creates a stable contract for future routing, planning, and human review.

## Delivery Framework Placement

- Phases:
${list(phases)}
- Stages / tasks:
${list(stages)}

## Input -> Process -> Output

- Input:
  - user intent
  - relevant story, artifact, or task context
  - any tool/module constraints already known
- Process:
  - Orch evaluates whether \`${input.name}\` fits the current phase/stage
  - Orch decides whether to use it directly or through a parent workflow
  - user reviews any meaningful boundary or risk before deeper promotion
- Output:
  - clearer execution path
  - a reusable reviewed capability
  - richer routing context for future use

## Use Cases

### Core use cases
${list(coreUseCases)}

### Adjacent use cases
${list(adjacentUseCases)}

### Do-not-use cases
${list(doNotUseCases)}

## Edge Cases / Stress Cases / Constraints

### Edge cases
${list(edgeCases)}

### Stress cases
${list(stressCases)}

### Constraints
${list(constraints)}

## Agent / Workflow / Skill Coordination

- Canonical agents:
${list(input.primaryAgents && input.primaryAgents.length > 0 ? input.primaryAgents : ['orch-agent'])}
- Primary workflows:
${list(input.primaryWorkflows && input.primaryWorkflows.length > 0 ? input.primaryWorkflows : ['review', 'plan', 'code'])}
- Supportive skills:
${list(input.supportiveSkills && input.supportiveSkills.length > 0 ? input.supportiveSkills : ['skill selection depends on the parent workflow'])}

## Orch Routing Hints

${list(orchHints)}

## Review Questions For The User

${list(reviewQuestions)}

## Example Scenarios

${list(examples)}
`;
}

function buildHtml(input: ReviewPackInput, slug: string): string {
  const phases = input.phases || defaultPhases(input.role);
  const stages = input.stages || defaultStages(input.kind);
  const coreUseCases = input.coreUseCases || defaultCoreUseCases(input);
  const adjacentUseCases = input.adjacentUseCases || defaultAdjacentUseCases(input);
  const doNotUseCases = input.doNotUseCases || defaultDoNotUseCases(input);
  const edgeCases = input.edgeCases || defaultEdgeCases(input);
  const stressCases = input.stressCases || defaultStressCases(input);
  const constraints = input.constraints || defaultConstraints(input);
  const orchHints = input.orchHints || defaultOrchHints(input);
  const reviewQuestions = input.reviewQuestions || defaultReviewQuestions(input);
  const examples = input.examples || defaultExamples(input);
  const agents = input.primaryAgents && input.primaryAgents.length > 0 ? input.primaryAgents : ['orch-agent'];
  const workflows = input.primaryWorkflows && input.primaryWorkflows.length > 0 ? input.primaryWorkflows : ['review', 'plan', 'code'];
  const supportiveSkills = input.supportiveSkills && input.supportiveSkills.length > 0 ? input.supportiveSkills : ['skill selection depends on the parent workflow'];

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.name)} Integration Guide</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f5f0e8;
        --panel: rgba(255, 255, 255, 0.9);
        --ink: #1d1b19;
        --muted: #5f5a54;
        --accent: #b55d32;
        --accent-soft: #f7d7c5;
        --line: #dfd4ca;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(181, 93, 50, 0.12), transparent 32%),
          linear-gradient(180deg, #fbf8f3 0%, var(--bg) 100%);
        color: var(--ink);
      }
      .wrap {
        max-width: 1200px;
        margin: 0 auto;
        padding: 32px 20px 60px;
      }
      .hero {
        display: grid;
        gap: 18px;
        margin-bottom: 26px;
      }
      .eyebrow {
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--accent);
        font-weight: 700;
        font-size: 12px;
      }
      h1 {
        margin: 0;
        font-size: clamp(2rem, 4vw, 3.4rem);
        line-height: 1.05;
      }
      .lede {
        max-width: 78ch;
        color: var(--muted);
        font-size: 1.05rem;
        line-height: 1.7;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
      }
      .panel {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 20px;
        box-shadow: 0 14px 40px rgba(56, 37, 23, 0.06);
      }
      h2, h3 {
        margin-top: 0;
      }
      ul {
        margin: 10px 0 0;
        padding-left: 20px;
      }
      li { margin: 6px 0; }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 12px;
      }
      .chip {
        border: 1px solid var(--line);
        background: var(--accent-soft);
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 0.92rem;
      }
      .snapshot {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 12px;
      }
      .label {
        font-size: 0.8rem;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .value {
        font-weight: 700;
        margin-top: 5px;
      }
      code {
        background: #f2ece5;
        border-radius: 6px;
        padding: 2px 6px;
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      <section class="hero">
        <div class="eyebrow">I-Wish Adoption Review Pack</div>
        <h1>${escapeHtml(input.name)}</h1>
        <p class="lede">
          A readable, shareable review pack for humans and Orch. This artifact explains where
          <strong>${escapeHtml(input.name)}</strong> fits in the delivery framework, when it should be used,
          and which boundaries should be respected.
        </p>
        <div class="meta">
          <span class="chip">${escapeHtml(input.kind)}</span>
          <span class="chip">${escapeHtml(input.role)}</span>
          <span class="chip">${escapeHtml(input.shape)}</span>
          <span class="chip">${escapeHtml(input.registrationState)}</span>
        </div>
      </section>

      <section class="panel">
        <h2>Snapshot</h2>
        <div class="snapshot">
          <div><div class="label">Slug</div><div class="value">${escapeHtml(slug)}</div></div>
          <div><div class="label">Source</div><div class="value">${escapeHtml(input.source)}</div></div>
          <div><div class="label">Module Class</div><div class="value">${escapeHtml(input.moduleClass || 'n/a')}</div></div>
          <div><div class="label">Triggers</div><div class="value">${escapeHtml((input.triggers || []).join(', ') || 'none')}</div></div>
          <div><div class="label">Tools</div><div class="value">${escapeHtml((input.toolDependencies || []).join(', ') || 'none')}</div></div>
        </div>
      </section>

      <section class="grid" style="margin-top: 18px;">
        <article class="panel">
          <h2>Delivery Placement</h2>
          <h3>Phases</h3>
          <ul>${toHtmlList(phases)}</ul>
          <h3>Stages / Tasks</h3>
          <ul>${toHtmlList(stages)}</ul>
        </article>

        <article class="panel">
          <h2>Coordination</h2>
          <h3>Canonical Agents</h3>
          <ul>${toHtmlList(agents)}</ul>
          <h3>Primary Workflows</h3>
          <ul>${toHtmlList(workflows)}</ul>
          <h3>Supportive Skills</h3>
          <ul>${toHtmlList(supportiveSkills)}</ul>
        </article>
      </section>

      <section class="grid" style="margin-top: 18px;">
        <article class="panel">
          <h2>Use Cases</h2>
          <h3>Core</h3>
          <ul>${toHtmlList(coreUseCases)}</ul>
          <h3>Adjacent</h3>
          <ul>${toHtmlList(adjacentUseCases)}</ul>
          <h3>Do Not Use</h3>
          <ul>${toHtmlList(doNotUseCases)}</ul>
        </article>

        <article class="panel">
          <h2>Edges and Constraints</h2>
          <h3>Edge Cases</h3>
          <ul>${toHtmlList(edgeCases)}</ul>
          <h3>Stress Cases</h3>
          <ul>${toHtmlList(stressCases)}</ul>
          <h3>Constraints</h3>
          <ul>${toHtmlList(constraints)}</ul>
        </article>
      </section>

      <section class="grid" style="margin-top: 18px;">
        <article class="panel">
          <h2>Orch Routing Hints</h2>
          <ul>${toHtmlList(orchHints)}</ul>
        </article>

        <article class="panel">
          <h2>Review Questions</h2>
          <ul>${toHtmlList(reviewQuestions)}</ul>
        </article>
      </section>

      <section class="panel" style="margin-top: 18px;">
        <h2>Example Scenarios</h2>
        <ul>${toHtmlList(examples)}</ul>
      </section>
    </main>
  </body>
</html>
`;
}

export async function generateReviewPack(input: ReviewPackInput): Promise<ReviewPackResult> {
  const slug = slugify(input.name);
  const targetDir = input.targetDir || path.join(input.projectRoot, 'docs', 'open-modules');
  const markdownPath = path.join(targetDir, `${slug}-integration-guide.md`);
  const htmlPath = path.join(targetDir, `${slug}-integration-guide.html`);

  await fs.ensureDir(targetDir);
  await fs.writeFile(markdownPath, buildMarkdown(input, slug), 'utf8');
  await fs.writeFile(htmlPath, buildHtml(input, slug), 'utf8');

  return { markdownPath, htmlPath };
}
