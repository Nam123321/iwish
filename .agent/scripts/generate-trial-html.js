#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const { marked } = require('marked');

const args = process.argv.slice(2);
const trialIdArg = args[0];

if (!trialIdArg) {
    console.error('Usage: node generate-trial-html.js <TRIAL_ID>');
    process.exit(1);
}

// Extract TRIAL_ID if a full path was passed
const trialIdMatch = trialIdArg.match(/(TRIAL-[A-Z0-9:-]+)/);
const trialId = trialIdMatch ? trialIdMatch[1] : trialIdArg;

const AGENT_DIR = path.join(__dirname, '..');
const TRIALS_DIR = path.join(AGENT_DIR, 'evolution-lab', 'trials');

const manifestPath = path.join(TRIALS_DIR, `trial-manifest-${trialId}.yaml`);
const scorecardPath = path.join(TRIALS_DIR, `scorecard-${trialId}.md`);
const cssPath = path.join(__dirname, '../../_bmad-output/idea-navigator/css/navigator-theme.css');

if (!fs.existsSync(manifestPath)) {
    console.error(`Error: Manifest not found at ${manifestPath}`);
    process.exit(1);
}

if (!fs.existsSync(scorecardPath)) {
    console.error(`Error: Scorecard not found at ${scorecardPath}`);
    process.exit(1);
}

const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
const scorecardContent = fs.readFileSync(scorecardPath, 'utf-8');

let cssContent = '';
if (fs.existsSync(cssPath)) {
    cssContent = fs.readFileSync(cssPath, 'utf-8');
} else {
    // Fallback basic styling
    cssContent = `
    body { font-family: 'Outfit', sans-serif; background-color: #05060A; color: #FFF; padding: 20px; }
    `;
}

const manifest = yaml.parse(manifestContent);
const scorecardHtml = marked(scorecardContent);

const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Evolution Lab Review Packet: ${trialId}</title>
    <style>
        ${cssContent}
        
        /* Additional specific styles for the review packet */
        .review-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: var(--spacing-xl);
        }
        
        .manifest-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.05), transparent);
            border: 1px solid var(--glass-border);
            border-radius: var(--border-radius-lg);
            padding: var(--spacing-lg);
            margin-bottom: var(--spacing-xl);
            backdrop-filter: blur(10px);
        }
        
        .manifest-card h3 {
            color: var(--neon-mint);
            margin-bottom: var(--spacing-md);
        }
        
        .manifest-detail {
            display: flex;
            gap: var(--spacing-sm);
            margin-bottom: var(--spacing-xs);
        }
        
        .manifest-detail strong {
            color: var(--starlight-muted);
            width: 120px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            background: var(--deep-indigo-glow);
            color: #b59bf7;
            border: 1px solid rgba(74, 0, 224, 0.5);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .status-badge.pending {
            background: rgba(255, 193, 7, 0.2);
            color: #ffc107;
            border-color: rgba(255, 193, 7, 0.5);
        }
        
        .status-badge.approved {
            background: var(--neon-mint-glow);
            color: var(--neon-mint);
            border-color: rgba(0, 255, 163, 0.5);
        }
        
        .status-badge.rejected {
            background: var(--action-orange-glow);
            color: var(--action-orange);
            border-color: rgba(255, 75, 31, 0.5);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: var(--spacing-lg) 0;
            background: rgba(0,0,0,0.2);
            border-radius: var(--border-radius-md);
            overflow: hidden;
        }
        
        th, td {
            padding: var(--spacing-md);
            text-align: left;
            border-bottom: 1px solid var(--glass-border);
        }
        
        th {
            background: rgba(255,255,255,0.05);
            color: var(--neon-mint);
            font-weight: 600;
        }
        
        tr:last-child td {
            border-bottom: none;
        }
    </style>
</head>
<body>
    <div class="nebula-bg"></div>
    <div class="review-container">
        <header class="celestial-header">
            <h1 class="brand-title">Evolution Lab Trial Review</h1>
        </header>

        <div class="manifest-card">
            <h3>Trial Manifest</h3>
            <div class="manifest-detail">
                <strong>Trial ID:</strong> <span>${manifest.trial_id}</span>
            </div>
            <div class="manifest-detail">
                <strong>Fixture:</strong> <span>${manifest.fixture}</span>
            </div>
            <div class="manifest-detail">
                <strong>Timestamp:</strong> <span>${new Date(manifest.timestamp).toLocaleString()}</span>
            </div>
            <div class="manifest-detail">
                <strong>Decision:</strong> <span class="status-badge ${manifest.decision ? manifest.decision.toLowerCase() : 'pending'}">${manifest.decision || 'PENDING'}</span>
            </div>
        </div>

        <div class="markdown-body glass-card">
            ${scorecardHtml}
        </div>
    </div>
</body>
</html>`;

const outputPath = path.join(TRIALS_DIR, `review-${trialId}.html`);
fs.writeFileSync(outputPath, htmlTemplate);
console.log(`[Output] Generated HTML review packet at ${outputPath}`);
