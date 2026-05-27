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
  const reviewQuestions = input.reviewQuestions || defaultReviewQuestions(input);

  // Try to load the template
  const templatePath = path.join(input.projectRoot, 'templates', 'iwish', 'capability-package', 'review-pack', 'integration-guide.html');
  if (fs.existsSync(templatePath)) {
    try {
      const template = fs.readFileSync(templatePath, 'utf8');
      const capability_name = input.name;
      const summary = `A readable, shareable review pack for ${input.name}, explaining where it fits in the delivery framework and its routing constraints.`;
      const owner = input.primaryAgents && input.primaryAgents.length > 0 ? input.primaryAgents.join(', ') : 'orch-agent';
      const framework_placement = `Phases: ${phases.map(p => `<code>${p}</code>`).join(', ')}<br>Stages / Tasks: ${stages.map(s => `<code>${s}</code>`).join(', ')}`;
      const ipo_summary = `Input: user intent, story context.<br>Process: Orch evaluates phase/stage fit and checks constraints.<br>Output: clear execution path, reviewed capability routing.`;
      const use_case_summary = `<strong>Core Use Cases:</strong><ul>${toHtmlList(coreUseCases)}</ul><strong>Adjacent Use Cases:</strong><ul>${toHtmlList(adjacentUseCases)}</ul><strong>Do Not Use Cases:</strong><ul>${toHtmlList(doNotUseCases)}</ul>`;
      const edge_case_summary = `<strong>Edge Cases:</strong><ul>${toHtmlList(edgeCases)}</ul><strong>Stress Cases:</strong><ul>${toHtmlList(stressCases)}</ul>`;
      const constraint_summary = `<strong>Constraints:</strong><ul>${toHtmlList(constraints)}</ul>`;
      
      const q1 = reviewQuestions[0] || 'Which use cases of this capability do you want Orch to suggest automatically?';
      const q2 = reviewQuestions[1] || 'What edge cases, exclusions, or approval boundaries should Orch respect?';
      const q3 = reviewQuestions[2] || 'Should this stay external/supportive, or do you expect deeper promotion later?';
      const q4 = reviewQuestions[3] || 'How will you verify this capability is working as expected?';

      return template
        .replace(/\{\{capability_name\}\}/g, escapeHtml(capability_name))
        .replace(/\{\{summary\}\}/g, escapeHtml(summary))
        .replace(/\{\{source\}\}/g, escapeHtml(input.source))
        .replace(/\{\{shape\}\}/g, escapeHtml(input.shape))
        .replace(/\{\{role\}\}/g, escapeHtml(input.role))
        .replace(/\{\{owner\}\}/g, escapeHtml(owner))
        .replace(/\{\{framework_placement\}\}/g, framework_placement)
        .replace(/\{\{ipo_summary\}\}/g, ipo_summary)
        .replace(/\{\{use_case_summary\}\}/g, use_case_summary)
        .replace(/\{\{edge_case_summary\}\}/g, edge_case_summary)
        .replace(/\{\{constraint_summary\}\}/g, constraint_summary)
        .replace(/\{\{review_q1\}\}/g, escapeHtml(q1))
        .replace(/\{\{review_q2\}\}/g, escapeHtml(q2))
        .replace(/\{\{review_q3\}\}/g, escapeHtml(q3))
        .replace(/\{\{review_q4\}\}/g, escapeHtml(q4));
    } catch (e) {
      console.warn('Error reading integration guide template, using fallback design:', e);
    }
  }

  // Fallback buildHtml implementing the exact design system of integration-guide.html
  const owner = input.primaryAgents && input.primaryAgents.length > 0 ? input.primaryAgents.join(', ') : 'orch-agent';
  const q1 = reviewQuestions[0] || 'Which use cases of this capability do you want Orch to suggest automatically?';
  const q2 = reviewQuestions[1] || 'What edge cases, exclusions, or approval boundaries should Orch respect?';
  const q3 = reviewQuestions[2] || 'Should this stay external/supportive, or do you expect deeper promotion later?';
  const q4 = reviewQuestions[3] || 'How will you verify this capability is working as expected?';
  
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(input.name)} Integration Guide</title>
    <style>
      :root {
        --bg: #f8f5ef;
        --panel: rgba(255, 255, 255, 0.88);
        --ink: #1f2937;
        --muted: #5b6472;
        --line: rgba(31, 41, 55, 0.12);
        --brand: #0f766e;
        --accent: #1d4ed8;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Inter", system-ui, sans-serif;
        color: var(--ink);
        background: linear-gradient(180deg, #fcfaf5 0%, var(--bg) 100%);
      }
      .page {
        width: min(1120px, calc(100vw - 28px));
        margin: 24px auto 60px;
      }
      .hero, .card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 22px;
        padding: 24px;
        margin-bottom: 18px;
      }
      .eyebrow {
        display: inline-block;
        background: rgba(15, 118, 110, 0.08);
        color: var(--brand);
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
      }
      h1 { font-size: clamp(30px, 5vw, 52px); margin: 16px 0 12px; }
      h2 { margin: 0 0 12px; font-size: 24px; }
      h3 { margin: 0 0 10px; font-size: 18px; }
      p, li { color: var(--muted); line-height: 1.7; }
      code {
        background: rgba(31, 41, 55, 0.06);
        padding: 2px 6px;
        border-radius: 8px;
      }
      .grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }
      .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }
      .tab {
        border: 1px solid var(--line);
        background: white;
        border-radius: 999px;
        padding: 10px 14px;
        cursor: pointer;
      }
      .tab.active {
        background: rgba(29, 78, 216, 0.08);
        color: var(--accent);
      }
      [data-panel] { display: none; }
      [data-panel].active { display: block; }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="hero">
        <div class="eyebrow">I-Wish Adoption Review Pack</div>
        <h1>${escapeHtml(input.name)} Integration Guide</h1>
        <p>A readable, shareable review pack for ${escapeHtml(input.name)}, explaining where it fits in the delivery framework and its routing constraints.</p>
        <div class="tabs" id="tabs">
          <button class="tab active" data-target="overview">Overview</button>
          <button class="tab" data-target="framework">Framework Fit</button>
          <button class="tab" data-target="routing">Routing</button>
          <button class="tab" data-target="review">Review</button>
        </div>
      </header>

      <section class="card active" data-panel="overview">
        <h2>Snapshot</h2>
        <div class="grid">
          <div><h3>Source</h3><p>${escapeHtml(input.source)}</p></div>
          <div><h3>Shape</h3><p>${escapeHtml(input.shape)}</p></div>
          <div><h3>Role</h3><p>${escapeHtml(input.role)}</p></div>
          <div><h3>Owner</h3><p>${escapeHtml(owner)}</p></div>
        </div>
      </section>

      <section class="card" data-panel="framework">
        <h2>Delivery Framework Placement</h2>
        <p>Phases: ${phases.map(p => `<code>${p}</code>`).join(', ')}<br>Stages / Tasks: ${stages.map(s => `<code>${s}</code>`).join(', ')}</p>
        <h3>Input → Process → Output</h3>
        <p>Input: user intent, story context.<br>Process: Orch evaluates phase/stage fit and checks constraints.<br>Output: clear execution path, reviewed capability routing.</p>
      </section>

      <section class="card" data-panel="routing">
        <h2>Use Cases, Edge Cases, Constraints</h2>
        <p><strong>Core Use Cases:</strong><ul>${toHtmlList(coreUseCases)}</ul><strong>Adjacent Use Cases:</strong><ul>${toHtmlList(adjacentUseCases)}</ul><strong>Do Not Use Cases:</strong><ul>${toHtmlList(doNotUseCases)}</ul></p>
        <p><strong>Edge Cases:</strong><ul>${toHtmlList(edgeCases)}</ul><strong>Stress Cases:</strong><ul>${toHtmlList(stressCases)}</ul></p>
        <p><strong>Constraints:</strong><ul>${toHtmlList(constraints)}</ul></p>
      </section>

      <section class="card" data-panel="review">
        <h2>Review Questions</h2>
        <ul>
          <li>${escapeHtml(q1)}</li>
          <li>${escapeHtml(q2)}</li>
          <li>${escapeHtml(q3)}</li>
          <li>${escapeHtml(q4)}</li>
        </ul>
      </section>
    </div>

    <script>
      const tabs = document.querySelectorAll("[data-target]");
      const panels = document.querySelectorAll("[data-panel]");
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          tabs.forEach((node) => node.classList.remove("active"));
          panels.forEach((node) => node.classList.remove("active"));
          tab.classList.add("active");
          const panel = document.querySelector(\`[data-panel="\${tab.dataset.target}"]\`);
          if (panel) panel.classList.add("active");
        });
      });
    </script>
  </body>
</html>`;
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
