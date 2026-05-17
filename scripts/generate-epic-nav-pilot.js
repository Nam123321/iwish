#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const { marked } = require('marked');

const ROOT = path.resolve(__dirname, '..');
const PHASE_DIR = path.join(ROOT, 'Test HTML - Phase 1');
const EPIC_FILE = path.join(PHASE_DIR, 'epics', 'epic-01.md');
const RESEARCH_DIR = path.join(PHASE_DIR, 'research');
const OUTPUT_DIR = path.join(PHASE_DIR, 'pilot');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'epic-nav-pilot.html');
const PDF_FILE = path.join(OUTPUT_DIR, 'epic-nav-pilot.pdf');
const EXPORT_SCRIPT_FILE = path.join(OUTPUT_DIR, 'export-epic-nav-pilot-pdf.sh');

function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function parseFrontmatter(filePath) {
    const raw = readFile(filePath);
    const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) {
        return {
            data: {},
            body: raw.trim()
        };
    }

    return {
        data: yaml.parse(match[1]) || {},
        body: match[2].trim()
    };
}

function extractAcceptanceCriteria(markdown) {
    const sectionMatch = markdown.match(/## Acceptance Criteria\s*([\s\S]*?)(?:\n## |\nPIVOT|\n---|$)/i);
    if (!sectionMatch) return [];

    return sectionMatch[1]
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => /^\d+\./.test(line))
        .map((line) => line.replace(/^\d+\.\s*/, '').trim());
}

function extractPivot(markdown) {
    const match = markdown.match(/PIVOT\s*([\s\S]*)$/i);
    return match ? match[1].trim() : '';
}

function extractBulletList(markdown, heading) {
    const regex = new RegExp(`## ${heading}\\s*([\\s\\S]*?)(?:\\n## |\\nPIVOT|\\n---|$)`, 'i');
    const match = markdown.match(regex);
    if (!match) return [];

    return match[1]
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- ') || line.startsWith('* '))
        .map((line) => line.slice(2).trim());
}

function toId(text) {
    return String(text)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function loadResearchFiles() {
    return fs.readdirSync(RESEARCH_DIR)
        .filter((name) => name.endsWith('.md'))
        .sort()
        .map((name) => {
            const filePath = path.join(RESEARCH_DIR, name);
            const parsed = parseFrontmatter(filePath);
            const title = parsed.data.title || parsed.body.match(/^#\s+(.+)$/m)?.[1] || name;
            const bullets = extractBulletList(parsed.body, 'Technologies');

            return {
                id: toId(name),
                fileName: name,
                title,
                phase: parsed.data.phase || parsed.data.workflowType || 'research',
                description: parsed.data.description || '',
                markdown: parsed.body,
                html: marked.parse(parsed.body),
                technologies: bullets
            };
        });
}

function buildHtml() {
    const epic = parseFrontmatter(EPIC_FILE);
    const researchFiles = loadResearchFiles();
    const acceptanceCriteria = extractAcceptanceCriteria(epic.body);
    const pivot = extractPivot(epic.body);
    const references = Array.isArray(epic.data.refs) ? epic.data.refs : [];

    const techResearch = researchFiles.find((item) => item.fileName === 'tech-stack.md');
    const marketResearch = researchFiles.find((item) => item.fileName === 'bmad_research_report.md');

    const keyCompetitors = marketResearch
        ? (marketResearch.markdown.match(/### Key Competitors & Patterns([\s\S]*?)## 2\./i)?.[1] || '')
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => /^\d+\./.test(line))
            .map((line) => line.replace(/^\d+\.\s*/, ''))
        : [];

    const techCards = (techResearch?.technologies || []).map((item) => `
        <div class="signal-card">
            <div class="signal-label">Technology</div>
            <div class="signal-value">${escapeHtml(item.split(':')[0])}</div>
            <div class="signal-copy">${escapeHtml(item.split(':').slice(1).join(':').trim())}</div>
        </div>
    `).join('');

    const researchCards = researchFiles.map((item) => `
        <article class="research-card" id="${escapeHtml(item.id)}">
            <div class="chip">${escapeHtml(item.phase)}</div>
            <h3>${escapeHtml(item.title)}</h3>
            <p class="research-desc">${escapeHtml(item.description || 'Primary evidence source for the epic pilot.')}</p>
            <details>
                <summary>Open research source</summary>
                <div class="markdown-body">${item.html}</div>
            </details>
        </article>
    `).join('');

    const competitorItems = keyCompetitors.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const acItems = acceptanceCriteria.map((item, index) => `
        <li>
            <span class="ac-index">AC-${index + 1}</span>
            <span>${escapeHtml(item)}</span>
        </li>
    `).join('');

    const refItems = references.map((item) => `<span class="ref-chip">${escapeHtml(item)}</span>`).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Epic Nav Pilot Test</title>
    <style>
        :root {
            --bg: #08111f;
            --panel: rgba(12, 22, 41, 0.84);
            --panel-soft: rgba(17, 29, 53, 0.7);
            --line: rgba(255,255,255,0.1);
            --text: #eef4ff;
            --muted: #9fb3d9;
            --mint: #69f0d0;
            --orange: #ffb36b;
            --blue: #8fb6ff;
        }

        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            background:
                radial-gradient(circle at top left, rgba(105,240,208,0.14), transparent 32%),
                radial-gradient(circle at top right, rgba(143,182,255,0.16), transparent 28%),
                linear-gradient(180deg, #050b15, var(--bg));
            color: var(--text);
        }

        .shell {
            width: min(1220px, calc(100vw - 32px));
            margin: 0 auto;
            padding: 32px 0 72px;
        }

        .hero, .panel, .research-card, .signal-card {
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 28px;
            box-shadow: 0 24px 80px rgba(0,0,0,0.3);
            backdrop-filter: blur(18px);
        }

        .hero {
            padding: 28px;
            display: grid;
            grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.8fr);
            gap: 20px;
            margin-bottom: 20px;
        }

        .eyebrow, .chip, .ref-chip, .ac-index {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            border: 1px solid var(--line);
            background: rgba(255,255,255,0.04);
        }

        .eyebrow, .chip, .ref-chip {
            padding: 6px 10px;
            color: var(--muted);
            font-size: 0.78rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
        }

        h1 {
            margin: 16px 0 12px;
            font-size: clamp(2rem, 4vw, 3.8rem);
            line-height: 0.98;
        }

        .lead, .panel-copy, .research-desc, .markdown-body {
            color: var(--muted);
            line-height: 1.7;
        }

        .hero-side {
            display: grid;
            gap: 14px;
        }

        .hero-side .panel-soft {
            background: var(--panel-soft);
            border-radius: 22px;
            padding: 18px;
            border: 1px solid var(--line);
        }

        .signal-grid, .research-grid {
            display: grid;
            gap: 16px;
        }

        .signal-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            margin-bottom: 20px;
        }

        .signal-card {
            padding: 18px;
        }

        .signal-label {
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.12em;
            font-size: 0.74rem;
        }

        .signal-value {
            margin: 12px 0 8px;
            font-size: 1.45rem;
            font-weight: 800;
            color: var(--mint);
        }

        .two-up {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 16px;
            margin-bottom: 20px;
        }

        .panel {
            padding: 22px;
        }

        .panel h2 {
            margin: 12px 0 10px;
            font-size: 1.3rem;
        }

        .ac-list, .competitor-list {
            list-style: none;
            margin: 0;
            padding: 0;
            display: grid;
            gap: 12px;
        }

        .ac-list li, .competitor-list li {
            display: grid;
            gap: 10px;
            align-items: start;
            grid-template-columns: auto 1fr;
            padding: 14px 16px;
            border: 1px solid var(--line);
            border-radius: 18px;
            background: rgba(255,255,255,0.03);
        }

        .ac-index {
            min-width: 58px;
            padding: 6px 10px;
            font-size: 0.76rem;
            color: var(--blue);
        }

        .pivot {
            border-left: 4px solid var(--orange);
            padding: 18px 18px 18px 20px;
            border-radius: 18px;
            background: rgba(255,179,107,0.08);
            color: #ffd8b0;
        }

        .refs {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 14px;
        }

        .research-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .research-card {
            padding: 20px;
        }

        .research-card h3 {
            margin: 14px 0 8px;
            font-size: 1.2rem;
        }

        details {
            margin-top: 12px;
        }

        summary {
            cursor: pointer;
            color: var(--mint);
            font-weight: 600;
        }

        .markdown-body h1, .markdown-body h2, .markdown-body h3 {
            font-size: 1rem;
            margin-top: 1.2rem;
            color: var(--text);
        }

        .markdown-body p, .markdown-body li {
            font-size: 0.95rem;
        }

        .footer-note {
            margin-top: 20px;
            text-align: center;
            color: var(--muted);
            font-size: 0.9rem;
        }

        @media (max-width: 980px) {
            .hero, .two-up, .research-grid, .signal-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <main class="shell">
        <section class="hero">
            <div>
                <div class="eyebrow">Pilot Test · Epic Nav</div>
                <h1>${escapeHtml(epic.data.title || 'Epic Nav Pilot')}</h1>
                <p class="lead">${escapeHtml(epic.data.description || '')}</p>
                <div class="refs">${refItems || '<span class="ref-chip">No refs</span>'}</div>
            </div>
            <div class="hero-side">
                <div class="panel-soft">
                    <div class="eyebrow">Status</div>
                    <h2 style="margin:14px 0 8px">${escapeHtml(epic.data.status || 'Unknown')}</h2>
                    <p class="panel-copy">Assignee: ${escapeHtml(epic.data.assignee || 'Unassigned')}</p>
                    <p class="panel-copy">Phase: ${escapeHtml(epic.data.phase || 'origin')}</p>
                </div>
                <div class="panel-soft">
                    <div class="eyebrow">Pilot Focus</div>
                    <p class="panel-copy">Render the epic and its research pack as a publishable HTML artifact, with fast scanability for pivot, evidence, and next-step feasibility.</p>
                </div>
            </div>
        </section>

        <section class="signal-grid">
            ${techCards || `
                <div class="signal-card">
                    <div class="signal-label">Technology</div>
                    <div class="signal-value">N/A</div>
                    <div class="signal-copy">No technology bullets were extracted.</div>
                </div>
            `}
        </section>

        <section class="two-up">
            <article class="panel">
                <div class="eyebrow">Acceptance Criteria</div>
                <h2>Epic Readiness Snapshot</h2>
                <p class="panel-copy">This section turns the raw markdown epic into a checklist-like surface that is easier to scan in review sessions.</p>
                <ul class="ac-list">${acItems}</ul>
            </article>

            <article class="panel">
                <div class="eyebrow">Pivot Signal</div>
                <h2>Why This Epic Matters</h2>
                <p class="pivot">${escapeHtml(pivot || 'No pivot statement found in the source epic.')}</p>
                <h2 style="margin-top:18px">Competitive Reference Points</h2>
                <ul class="competitor-list">
                    ${competitorItems || '<li><span class="ac-index">INFO</span><span>No competitor section was extracted.</span></li>'}
                </ul>
            </article>
        </section>

        <section class="research-grid">
            ${researchCards}
        </section>

        <p class="footer-note">Generated from <code>Test HTML - Phase 1/epics</code> and <code>Test HTML - Phase 1/research</code> for pilot evaluation. PDF export path is prewired through the <code>export-pdf</code> skill.</p>
    </main>
</body>
</html>`;
}

function main() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const html = buildHtml();
    fs.writeFileSync(OUTPUT_FILE, html);
    const exportScript = `#!/usr/bin/env bash
set -euo pipefail
bash "${path.join(ROOT, '.agent', 'skills', 'export-pdf', 'scripts', 'ensure_export_html_to_pdf.sh')}" "${OUTPUT_FILE}" "${PDF_FILE}"
`;

    fs.writeFileSync(EXPORT_SCRIPT_FILE, exportScript);
    fs.chmodSync(EXPORT_SCRIPT_FILE, 0o755);

    console.log(`[Output] Generated pilot HTML at ${OUTPUT_FILE}`);
    console.log(`[Output] Generated PDF export helper at ${EXPORT_SCRIPT_FILE}`);
}

main();
