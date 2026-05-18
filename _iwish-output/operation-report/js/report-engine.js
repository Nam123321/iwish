function renderDashboard(data) {
    renderHero(data);
    renderMetricGrid(data);
    renderModuleBars(data.defects?.defectDensityByModule || []);
    renderStoryLoad(data.sprint || {}, data.codebase || {});
    renderStoryHotspots(data.defects?.defectDensityByStory || [], data.defects?.bugDetails || []);
    renderEvolution(data.evolution || {});
    renderInsights(data.insights || []);
}

function renderHero(data) {
    const heroMeta = document.getElementById('hero-meta');
    const statusPanel = document.getElementById('status-panel');
    const generatedAt = formatDateTime(data.generatedAt);

    heroMeta.innerHTML = `
        <div class="hero-meta-chip">Generated<strong>${generatedAt}</strong></div>
        <div class="hero-meta-chip">Source<strong>${escapeHtml(data.meta?.source || 'Unknown')}</strong></div>
        <div class="hero-meta-chip">Absorbed patterns<strong>${escapeHtml((data.meta?.absorbedPatterns || []).join(' · ') || 'None')}</strong></div>
    `;

    statusPanel.innerHTML = `
        <div class="section-kicker">Live Status</div>
        <h2 class="section-title">${escapeHtml(toTitleCase(data.sprint?.status || 'unknown'))}</h2>
        <p class="section-copy">${escapeHtml(data.sprint?.sprintGoal || 'No sprint goal declared yet.')}</p>
        <div class="status-row"><span>Progress</span><strong>${Number(data.sprint?.progressPct || 0)}%</strong></div>
        <div class="status-track"><div class="status-fill" style="width:${Number(data.sprint?.progressPct || 0)}%"></div></div>
        <div class="status-row"><span>Completed stories</span><strong>${Number(data.sprint?.completedStories || 0)} / ${Number(data.sprint?.totalStories || 0)}</strong></div>
        <div class="status-row"><span>Completed epics</span><strong>${Number(data.sprint?.completedEpics || 0)} / ${Number(data.sprint?.totalEpics || 0)}</strong></div>
        <div class="status-row"><span>Last commit</span><strong>${escapeHtml(data.codebase?.lastCommit || 'N/A')}</strong></div>
    `;
}

function renderMetricGrid(data) {
    const metricGrid = document.getElementById('metric-grid');
    const metrics = data.health?.metrics || [];

    metricGrid.innerHTML = metrics.map((metric) => {
        const tone = escapeHtml(metric.tone || 'mint');
        const value = Number(metric.value || 0);
        const suffix = escapeHtml(metric.suffix || '');
        const caption = buildMetricCaption(metric.label, data);

        return `
            <article class="metric-card">
                <div class="metric-label">${escapeHtml(metric.label)}</div>
                <div class="metric-number ${tone}">${formatCompactNumber(value)}${suffix}</div>
                <div class="metric-caption">${caption}</div>
            </article>
        `;
    }).join('');
}

function renderModuleBars(rows) {
    const container = document.getElementById('module-bars');
    if (!rows.length) {
        container.innerHTML = emptyState('No module hotspots found in the current bug tracker snapshot.');
        return;
    }

    const max = Math.max(...rows.map((row) => Number(row.count || 0)), 1);
    container.innerHTML = `
        <div class="bar-list">
            ${rows.map((row) => `
                <div class="bar-row">
                    <div class="bar-label">${escapeHtml(row.module)}</div>
                    <div class="bar-track">
                        <div class="bar-fill" style="width:${Math.max((Number(row.count || 0) / max) * 100, 8)}%"></div>
                    </div>
                    <div class="bar-value">${Number(row.count || 0)}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderStoryLoad(sprint, codebase) {
    const container = document.getElementById('story-load');
    container.innerHTML = `
        <tr><th class="muted">Backlog</th><td>${Number(sprint.backlogStories || 0)}</td></tr>
        <tr><th class="muted">In flight</th><td>${Number(sprint.inFlightStories || 0)}</td></tr>
        <tr><th class="muted">Completed</th><td>${Number(sprint.completedStories || 0)}</td></tr>
        <tr><th class="muted">Tracked LOC</th><td>${formatCompactNumber(Number(codebase?.loc?.total || 0))}</td></tr>
    `;
}

function renderStoryHotspots(stories, bugDetails) {
    const container = document.getElementById('story-hotspots');
    if (!stories.length && !bugDetails.length) {
        container.innerHTML = emptyState('No bug-to-story mapping has been inferred yet.');
        return;
    }

    const primaryRows = stories.length
        ? stories.map((story) => `
            <tr>
                <td>${escapeHtml(story.storyId || 'Unknown')}</td>
                <td>${escapeHtml(story.storyTitle || 'Unknown story')}</td>
                <td>${Number(story.count || 0)}</td>
            </tr>
        `).join('')
        : `
            <tr>
                <td colspan="3" class="muted">Path-based story mapping did not find a confident match yet.</td>
            </tr>
        `;

    const detailRows = bugDetails.slice(0, 5).map((bug) => `
        <tr>
            <td>${escapeHtml(bug.id)}</td>
            <td>${escapeHtml(bug.module)}</td>
            <td>${escapeHtml(bug.mappedStory?.title || 'Unmapped')}</td>
        </tr>
    `).join('');

    container.innerHTML = `
        <table class="report-table" style="margin-bottom:16px">
            <thead>
                <tr>
                    <th>Story ID</th>
                    <th>Story</th>
                    <th>Bug Events</th>
                </tr>
            </thead>
            <tbody>${primaryRows}</tbody>
        </table>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Bug</th>
                    <th>Module</th>
                    <th>Mapped Story</th>
                </tr>
            </thead>
            <tbody>${detailRows || '<tr><td colspan="3" class="muted">No bug details available.</td></tr>'}</tbody>
        </table>
    `;
}

function renderEvolution(evolution) {
    const container = document.getElementById('evolution-summary');
    const newest = evolution.newestKnowledgeItems || [];

    container.innerHTML = `
        <table class="report-table" style="margin-bottom:16px">
            <tbody>
                <tr><th class="muted">Skills</th><td>${Number(evolution.skills || 0)}</td></tr>
                <tr><th class="muted">Workflows</th><td>${Number(evolution.workflows || 0)}</td></tr>
                <tr><th class="muted">Knowledge Items</th><td>${Number(evolution.knowledge || 0)}</td></tr>
                <tr><th class="muted">Total Capabilities</th><td>${Number(evolution.totalCapabilities || 0)}</td></tr>
            </tbody>
        </table>
        ${
            newest.length
                ? `
                    <table class="report-table">
                        <thead>
                            <tr><th>Newest Knowledge Assets</th></tr>
                        </thead>
                        <tbody>
                            ${newest.map((item) => `<tr><td>${escapeHtml(item)}</td></tr>`).join('')}
                        </tbody>
                    </table>
                `
                : emptyState('No knowledge assets detected in the current report scope.')
        }
    `;
}

function renderInsights(insights) {
    const container = document.getElementById('insight-grid');
    if (!insights.length) {
        container.innerHTML = emptyState('No insight cards were generated for this snapshot.');
        return;
    }

    container.innerHTML = insights.map((insight) => `
        <article class="insight-card">
            <div class="insight-icon">${escapeHtml(insight.icon || '•')}</div>
            <h3 class="insight-title">${escapeHtml(insight.title || 'Insight')}</h3>
            <p class="insight-copy">${escapeHtml(insight.body || '')}</p>
        </article>
    `).join('');
}

function renderFailure(error) {
    const heroMeta = document.getElementById('hero-meta');
    const statusPanel = document.getElementById('status-panel');
    const metricGrid = document.getElementById('metric-grid');
    const moduleBars = document.getElementById('module-bars');
    const storyHotspots = document.getElementById('story-hotspots');
    const evolutionSummary = document.getElementById('evolution-summary');
    const insightGrid = document.getElementById('insight-grid');
    const storyLoad = document.getElementById('story-load');

    const message = 'Failed to load data stream. Ensure `operation-report.json` exists and the report is opened through a local server.';
    heroMeta.innerHTML = `<div class="hero-meta-chip">Status<strong>Load failure</strong></div>`;
    statusPanel.innerHTML = `
        <div class="section-kicker">Live Status</div>
        <h2 class="section-title">Data unavailable</h2>
        <p class="section-copy">${escapeHtml(message)}</p>
        <div class="status-row"><span>Reason</span><strong>${escapeHtml(error?.message || 'Unknown error')}</strong></div>
    `;
    metricGrid.innerHTML = emptyState(message);
    moduleBars.innerHTML = emptyState(message);
    storyHotspots.innerHTML = emptyState(message);
    evolutionSummary.innerHTML = emptyState(message);
    insightGrid.innerHTML = emptyState(message);
    storyLoad.innerHTML = `<tr><td class="muted">${escapeHtml(message)}</td></tr>`;
}

function buildMetricCaption(label, data) {
    switch (label) {
        case 'Sprint Progress':
            return `${Number(data.sprint?.completedStories || 0)} stories complete across ${Number(data.sprint?.totalEpics || 0)} tracked epics.`;
        case 'Net Lines Changed':
            return `From the latest 50 commits: +${formatCompactNumber(Number(data.codebase?.insertions || 0))} / -${formatCompactNumber(Number(data.codebase?.deletions || 0))}.`;
        case 'Open Bug Events':
            return `${Number(data.defects?.defectDensityByModule?.length || 0)} modules are represented in the tracker snapshot.`;
        case 'Capability Surface':
            return `${Number(data.evolution?.skills || 0)} skills, ${Number(data.evolution?.workflows || 0)} workflows, ${Number(data.evolution?.knowledge || 0)} knowledge assets.`;
        default:
            return 'Operational signal.';
    }
}

function formatCompactNumber(value) {
    return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function formatDateTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString();
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function emptyState(message) {
    return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function toTitleCase(value) {
    return String(value)
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data/operation-report.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        window.__reportData = await response.json();
        renderDashboard(window.__reportData);
    } catch (error) {
        console.error('Failed to load report data:', error);
        renderFailure(error);
    }
});
