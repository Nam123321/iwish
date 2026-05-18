document.addEventListener('DOMContentLoaded', () => {
    const data = window.BMAD_NAV_DATA;
    if (!data) {
        console.error("BMAD_NAV_DATA is not defined. Ensure navigator-data.js is loaded.");
        return;
    }

    const stages = ['ideation', 'research', 'specification', 'execution'];
    
    // Custom mapping logic to route existing data to new narrative stages
    const mappedData = {
        ideation: [...(data.origin || []).filter(i => i.id !== 'prd')],
        research: [...(data.deep_dive || [])],
        specification: [...(data.origin || []).filter(i => i.id === 'prd'), ...(data.forge || []).filter(i => i.id === 'product_brief')],
        execution: [...(data.forge || []).filter(i => i.id !== 'product_brief')]
    };

    stages.forEach(stage => {
        const container = document.getElementById(`stage-${stage}-grid`);
        if (!container) return;

        const items = mappedData[stage];
        
        if (!items || items.length === 0) {
            // Render empty state
            container.innerHTML = `
                <div class="empty-state">
                    <div class="connection-node"></div>
                    <p>Awaiting sparks in the ${stage.replace('_', ' ')} phase...</p>
                </div>
            `;
            return;
        }

        // Render cards
        const html = items.map(item => `
            <article class="glass-card" tabindex="0" role="button" data-id="${item.id}" data-stage="${stage}">
                <span class="card-tag ${item.type === 'epic' ? 'epic' : ''}">${item.tag}</span>
                <h2 class="card-title">${item.title}</h2>
                <p class="card-description line-clamp-3">${item.description}</p>
                <div class="card-footer">
                    <span><div class="connection-node"></div> ${item.footerLeft}</span>
                    <span>${item.footerRight}</span>
                </div>
            </article>
        `).join('');

        container.innerHTML = html;
    });

    if (typeof marked !== 'undefined') {
        marked.use({
            renderer: {
                paragraph(text) {
                    const content = typeof text === 'string' ? text : (text.text || '');
                    if (/\bPIVOT\b/.test(content)) {
                        return `<p class="pivot-highlight">${content}</p>\n`;
                    }
                    return `<p>${content}</p>\n`;
                },
                listitem(text) {
                    const content = typeof text === 'string' ? text : (text.text || '');
                    if (/\bPIVOT\b/.test(content)) {
                        return `<li class="pivot-highlight">${content}</li>\n`;
                    }
                    return `<li>${content}</li>\n`;
                }
            }
        });
    }

    // Setup Modal Logic
    const modal = document.getElementById('artifact-modal');
    const closeBtn = document.getElementById('modal-close');

    closeBtn.addEventListener('click', () => {
        modal.close();
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        const rect = modal.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
            modal.close();
        }
    });
    // Event delegation for opening cards
    document.addEventListener('click', handleCardInteraction);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleCardInteraction(e);
        }
    });

    function handleCardInteraction(e) {
        const card = e.target.closest('.glass-card');
        if (!card) return;
        
        if (e.type === 'keydown' && e.key === ' ') {
            e.preventDefault();
        }

        const id = card.getAttribute('data-id');
        // Find stage in mappedData
        let foundStage = null;
        for (const s of stages) {
            if (mappedData[s].find(i => i.id === id)) {
                foundStage = s;
                break;
            }
        }
        openArtifactModal(id, foundStage, mappedData);
    }

    function openArtifactModal(id, stage, sourceData) {
        const item = sourceData[stage].find(i => i.id === id);
        if (!item) return;

        document.getElementById('modal-tag').textContent = item.tag;
        document.getElementById('modal-tag').className = `card-tag ${item.type === 'epic' ? 'epic' : ''}`;
        document.getElementById('modal-title').textContent = item.title;
        
        const modalContent = document.getElementById('modal-content');
        
        if (id === 'prd' || item.title.toLowerCase().includes('prd') || item.title.toLowerCase().includes('requirements document')) {
            renderHybridPRD(item, modalContent);
        } else {
            renderStandardArtifact(item, modalContent);
        }

        modal.showModal();
    }

    function renderStandardArtifact(item, container) {
        const rawContent = item.content || item.description || "No content available.";
        let htmlContent = renderMarkdown(rawContent);
        container.innerHTML = `<div class="markdown-body">${htmlContent}</div>`;
    }

    function renderHybridPRD(item, container) {
        const rawContent = item.content || "";
        const frs = parsePRDMarkdown(rawContent);
        const nfrs = parseNFRMarkdown(rawContent);

        // Traceability Logic: Find which FRs are mentioned in other items or have links
        const allItems = [...mappedData.ideation, ...mappedData.research, ...mappedData.specification, ...mappedData.execution];
        
        const enrichRequirements = (reqs) => {
            return reqs.map(req => {
                // Find items that reference this ID
                const refs = allItems.filter(i => i.id !== item.id && (i.content || "").includes(req.id))
                    .map(ref => {
                        // Determine stage for this ref
                        let refStage = 'ideation';
                        for (const s of stages) {
                            if (mappedData[s].find(i => i.id === ref.id)) {
                                refStage = s;
                                break;
                            }
                        }
                        return { ...ref, stage: refStage };
                    });
                
                // Determine priority (simulated or parsed)
                const priority = (req.content || "").toLowerCase().includes('priority: high') ? 'high' : 
                                 (req.content || "").toLowerCase().includes('priority: low') ? 'low' : 'medium';

                return { ...req, refs, priority };
            });
        };

        const enrichedFrs = enrichRequirements(frs);
        const enrichedNfrs = enrichRequirements(nfrs);
        const allEnriched = [...enrichedFrs, ...enrichedNfrs];

        container.innerHTML = `
            <div class="split-layout">
                <aside class="data-table-sidebar">
                    <div class="table-controls">
                        <input type="text" class="table-search" id="prd-req-search" placeholder="Filter requirements (ID, title)...">
                    </div>
                    <div class="data-table-container">
                        <table class="dense-table">
                            <thead>
                                <tr>
                                    <th style="width: 80px">ID</th>
                                    <th>Requirement</th>
                                    <th style="width: 60px; text-align: right;">Trace</th>
                                </tr>
                            </thead>
                            <tbody id="prd-table-body">
                                ${enrichedFrs.map(fr => `
                                    <tr data-fr-id="${fr.id}">
                                        <td class="fr-id-cell">${fr.id}</td>
                                        <td class="fr-title-cell">${fr.title}</td>
                                        <td class="fr-trace-cell">${fr.refs.length > 0 ? `<span class="trace-badge" title="${fr.refs.map(r => r.id).join(', ')}">${fr.refs.length}</span>` : '—'}</td>
                                    </tr>
                                `).join('')}
                                ${enrichedNfrs.length > 0 ? `
                                    <tr class="section-row">
                                        <th colspan="3" class="table-section-divider">Non-Functional Requirements</th>
                                    </tr>
                                    ${enrichedNfrs.map(nfr => `
                                        <tr data-fr-id="${nfr.id}">
                                            <td class="fr-id-cell">${nfr.id}</td>
                                            <td class="fr-title-cell">${nfr.title}</td>
                                            <td class="fr-trace-cell">${nfr.refs.length > 0 ? `<span class="trace-badge">${nfr.refs.length}</span>` : '—'}</td>
                                        </tr>
                                    `).join('')}
                                ` : ''}
                            </tbody>
                        </table>
                    </div>
                </aside>
                <div class="details-pane" id="prd-details-pane">
                    <div class="details-empty-state">
                        <div class="icon">🔍</div>
                        <p>Select a requirement from the sidebar to inspect logic, criteria, and traceability.</p>
                    </div>
                </div>
            </div>
        `;

        const searchInput = document.getElementById('prd-req-search');
        const tableBody = document.getElementById('prd-table-body');
        const rows = tableBody.querySelectorAll('tr[data-fr-id]');
        const detailsPane = document.getElementById('prd-details-pane');

        // Search logic
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            rows.forEach(row => {
                const id = row.querySelector('.fr-id-cell').textContent.toLowerCase();
                const title = row.querySelector('.fr-title-cell').textContent.toLowerCase();
                if (id.includes(term) || title.includes(term)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });

        // Row interaction
        rows.forEach(row => {
            row.addEventListener('click', () => {
                rows.forEach(r => r.classList.remove('active'));
                row.classList.add('active');

                const frId = row.getAttribute('data-fr-id');
                const requirement = allEnriched.find(r => r.id === frId);
                
                if (requirement) {
                    // Detect Admiralty Score (e.g. A1, C3) in content
                    const admiraltyMatch = (requirement.content || "").match(/Admiralty:\s*([A-F])([1-6])/i);
                    const admiraltyHtml = admiraltyMatch ? `
                        <div class="admiralty-score" title="Admiralty Code: Source ${admiraltyMatch[1]} (Reliability), Info ${admiraltyMatch[2]} (Credibility)">
                            <div class="score-node reliability">${admiraltyMatch[1]}</div>
                            <div class="score-node credibility">${admiraltyMatch[2]}</div>
                        </div>
                    ` : '';

                    // Detect Logic Steps (e.g. 1. Step A, 2. Step B)
                    const logicSteps = (requirement.content || "").match(/^\d+\.\s+.*$/gm);
                    const logicHtml = logicSteps ? `
                        <div class="logic-viz">
                            ${logicSteps.map((step, idx) => `
                                <div class="logic-step">
                                    <div class="step-num">${idx + 1}</div>
                                    <div class="step-text">${step.replace(/^\d+\.\s+/, '')}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '';

                    detailsPane.innerHTML = `
                        <div class="details-scroll-content">
                            <div class="details-header">
                                <div class="req-meta">
                                    <span class="requirement-id">${requirement.id}</span>
                                    <span class="priority-tag ${requirement.priority}">${requirement.priority} Priority</span>
                                    <span class="req-status-badge">Ready for Dev</span>
                                    ${admiraltyHtml}
                                </div>
                                <h3>${requirement.title}</h3>
                            </div>
                            
                            <div class="markdown-body">
                                ${renderMarkdown(requirement.content)}
                            </div>

                            ${logicHtml}

                            ${requirement.refs.length > 0 ? `
                                <div class="traceability-section">
                                    <h4>Traceability Matrix</h4>
                                    <div class="trace-links">
                                        ${requirement.refs.map(ref => `
                                            <div class="trace-link-card" onclick="window.dispatchEvent(new CustomEvent('open-artifact', {detail: {id: '${ref.id}', stage: '${ref.stage}'}}))">
                                                <div class="ref-icon">${ref.type === 'epic' ? '⚡' : ref.id === 'user_journeys' ? '👤' : '📄'}</div>
                                                <div class="ref-info">
                                                    <span class="ref-id">${ref.id}</span>
                                                    <span class="ref-title">${ref.title}</span>
                                                </div>
                                                <div class="ref-stage-tag">${ref.stage}</div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }
            });
        });
    }

    function parsePRDMarkdown(content) {
        const frs = [];
        const frRegex = /(?:^|\n)#{2,4}\s+(FR-\d+)[:\s]+(.*?)(?:\n([\s\S]*?))(?=\n#|$)/g;
        let match;
        while ((match = frRegex.exec(content)) !== null) {
            frs.push({
                id: match[1],
                title: match[2].trim(),
                content: match[3] ? match[3].trim() : ""
            });
        }
        return frs;
    }

    function parseNFRMarkdown(content) {
        const nfrs = [];
        // Find the NFR section specifically
        const nfrSectionRegex = /(?:^|\n)#{2,4}\s+.*Non-Functional Requirements.*?\n([\s\S]*?)(?=\n##|$)/i;
        const nfrMatch = content.match(nfrSectionRegex);
        
        if (nfrMatch) {
            const nfrList = nfrMatch[1].trim();
            // Match - **NFR-XX (Title):** Content OR - **NFR-XX**: Title - Content
            // More flexible to match - **NFR-01 (Title):** or - **NFR-01**: Title
            const individualNfrRegex = /-\s+\*\*(NFR-\d+)(?:\s*\((.*?)\))?[:\s]*\*\*?(.*?)(?:\n(?=-\s+\*\*NFR)|$)/gs;
            let match;
            while ((match = individualNfrRegex.exec(nfrList)) !== null) {
                nfrs.push({
                    id: match[1],
                    title: (match[2] || "NFR Detail").trim(),
                    content: match[3].trim()
                });
            }
        }
        return nfrs;
    }

    function renderMarkdown(raw) {
        if (!raw) return "";
        try {
            if (typeof marked !== 'undefined') {
                // In some versions of marked, the output is already sanitized or needs specific options
                const html = marked.parse(raw);
                return typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : html;
            }
            return raw.replace(/\n/g, '<br>');
        } catch (e) {
            console.error("Error rendering markdown:", e);
            return `<pre>${raw}</pre>`;
        }
    }

    // SVG Narrative Connectors
    window.addEventListener('load', drawConnections);
    
    // Support responsive resizing with requestAnimationFrame for performance
    let resizeTimeout;
    window.addEventListener('resize', () => {
        if (resizeTimeout) {
            cancelAnimationFrame(resizeTimeout);
        }
        resizeTimeout = requestAnimationFrame(() => {
            drawConnections();
        });
    });

    function drawConnections() {
        if (!data || !data.edges) return;

        let svg = document.getElementById('connections-overlay');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.id = 'connections-overlay';
            // Insert at the beginning of the body so it sits behind the canvas
            document.body.insertBefore(svg, document.body.firstChild);
        }
        
        // Clear existing paths
        svg.innerHTML = '';
        
        // Size it to document scroll dimensions
        svg.style.width = document.body.scrollWidth + 'px';
        svg.style.height = document.body.scrollHeight + 'px';

        const fragment = document.createDocumentFragment();

        data.edges.forEach(edge => {
            const sourceEl = document.querySelector(`[data-id="${edge.source}"]`);
            const targetEl = document.querySelector(`[data-id="${edge.target}"]`);
            
            if (sourceEl && targetEl) {
                const sRect = sourceEl.getBoundingClientRect();
                const tRect = targetEl.getBoundingClientRect();
                
                const scrollX = window.scrollX || window.pageXOffset;
                const scrollY = window.scrollY || window.pageYOffset;
                
                // Draw from right edge of source to left edge of target
                // Find connection nodes inside elements if they exist
                const sNode = sourceEl.querySelector('.connection-node');
                const tNode = targetEl.querySelector('.connection-node');
                
                let startX = sRect.right + scrollX;
                let startY = sRect.top + (sRect.height / 2) + scrollY;
                
                let endX = tRect.left + scrollX;
                let endY = tRect.top + (tRect.height / 2) + scrollY;

                // Adjust to nodes if they exist for precision
                if (sNode) {
                    const snRect = sNode.getBoundingClientRect();
                    startX = snRect.left + (snRect.width / 2) + scrollX;
                    startY = snRect.top + (snRect.height / 2) + scrollY;
                }
                
                if (tNode) {
                    const tnRect = tNode.getBoundingClientRect();
                    endX = tnRect.left + (tnRect.width / 2) + scrollX;
                    endY = tnRect.top + (tnRect.height / 2) + scrollY;
                }
                
                // Control points for cubic bezier
                const cpOffset = Math.max(Math.abs(endX - startX) * 0.4, 50);
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const d = `M ${startX} ${startY} C ${startX + cpOffset} ${startY}, ${endX - cpOffset} ${endY}, ${endX} ${endY}`;
                path.setAttribute('d', d);
                
                path.classList.add('nav-edge');
                if (edge.type === 'depends_on') {
                    path.classList.add('edge-depends');
                } else if (edge.type === 'related_to') {
                    path.classList.add('edge-related');
                } else {
                    path.classList.add('edge-default');
                }
                
                fragment.appendChild(path);
            }
        });

        svg.appendChild(fragment);
    }

    // Handle deep links from traceability cards
    window.addEventListener('open-artifact', (e) => {
        const { id, stage } = e.detail;
        openArtifactModal(id, stage, mappedData);
    });
});
