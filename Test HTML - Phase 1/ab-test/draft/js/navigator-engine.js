document.addEventListener('DOMContentLoaded', () => {
    const data = window.BMAD_NAV_DATA;
    if (!data) {
        console.error("BMAD_NAV_DATA is not defined. Ensure navigator-data.js is loaded.");
        return;
    }

    const stages = ['origin', 'spark', 'deep_dive', 'forge'];
    
    stages.forEach(stage => {
        const container = document.getElementById(`stage-${stage}-grid`);
        if (!container) return;

        const items = data[stage];
        
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

    // Custom renderer logic removed. We will post-process HTML instead.

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

    // Handle minimap clicks
    document.getElementById('modal-content').addEventListener('click', (e) => {
        if (e.target.classList.contains('minimap-link')) {
            const id = e.target.getAttribute('data-id');
            const stage = e.target.getAttribute('data-stage');
            if (id && stage) {
                openArtifactModal(id, stage);
            }
        }
    });

    // Event delegation for opening cards (both mouse and keyboard)
    document.addEventListener('click', handleCardInteraction);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleCardInteraction(e);
        }
    });

    function handleCardInteraction(e) {
        const card = e.target.closest('.glass-card');
        if (!card) return;
        
        // Prevent default scrolling for Spacebar when focused on card
        if (e.type === 'keydown' && e.key === ' ') {
            e.preventDefault();
        }

        const id = card.getAttribute('data-id');
        const stage = card.getAttribute('data-stage');
        openArtifactModal(id, stage);
    }

    function openArtifactModal(id, stage) {
        const item = data[stage].find(i => i.id === id);
        if (!item) return;

        document.getElementById('modal-tag').textContent = item.tag;
        document.getElementById('modal-tag').className = `card-tag ${item.type === 'epic' ? 'epic' : ''}`;
        document.getElementById('modal-title').textContent = item.title;
        
        // Render Admiralty Badge
        const headerActions = document.getElementById('modal-header-actions');
        if (headerActions) {
            const existingBadge = headerActions.querySelector('.admiralty-badge');
            if (existingBadge) existingBadge.remove();
            
            if (item.admiraltyScore) {
                const scoreClass = item.admiraltyScore.toLowerCase().replace(/[^a-z0-9]/g, '');
                const badgeHTML = `<span class="admiralty-badge ${scoreClass}" title="Admiralty Score: ${item.admiraltyScore}">🛡️ ${item.admiraltyScore}</span>`;
                headerActions.insertAdjacentHTML('beforeend', badgeHTML);
            }
        }

        // Render Markdown content securely
        const rawContent = item.content || item.description || "No content available.";
        
        let htmlContent = rawContent;
        let sectionCardsHTML = '';
        try {
            if (typeof marked !== 'undefined') {
                htmlContent = marked.parse(rawContent);
                // Post-process HTML to add pivot highlights safely (multiline and case-insensitive)
                htmlContent = htmlContent.replace(/<p>([\s\S]*?\bPIVOT\b[\s\S]*?)<\/p>/gi, '<p class="pivot-highlight">$1</p>');
                htmlContent = htmlContent.replace(/<li>([\s\S]*?\bPIVOT\b[\s\S]*?)<\/li>/gi, '<li class="pivot-highlight">$1</li>');
            }
            if (typeof DOMPurify !== 'undefined') {
                htmlContent = DOMPurify.sanitize(htmlContent, { ADD_ATTR: ['class', 'target'] });
            }

            // Split content into separated cards based on headings
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            const children = Array.from(tempDiv.children);
            const sections = [];
            let currentSection = [];

            children.forEach(child => {
                const tag = child.tagName;
                if (tag === 'H1' || tag === 'H2' || tag === 'H3') {
                    if (currentSection.length > 0) {
                        sections.push(currentSection);
                        currentSection = [];
                    }
                }
                currentSection.push(child.outerHTML);
            });
            if (currentSection.length > 0) {
                sections.push(currentSection);
            }

            if (sections.length > 0) {
                sectionCardsHTML = sections.map((sec, index) => `
                    <div class="modal-section-card fade-in-section" style="animation-delay: ${0.1 + index * 0.1}s;">
                        <div class="markdown-body">${sec.join('')}</div>
                    </div>
                `).join('');
            } else {
                sectionCardsHTML = `
                    <div class="modal-section-card fade-in-section" style="animation-delay: 0.1s;">
                        <div class="markdown-body">${htmlContent}</div>
                    </div>
                `;
            }
        } catch (e) {
            console.error("Error rendering markdown:", e);
            sectionCardsHTML = `
                <div class="modal-section-card fade-in-section" style="animation-delay: 0.1s;">
                    <div class="markdown-body"><p>${rawContent}</p></div>
                </div>
            `;
        }

        // Logic Timeline
        let timelineHTML = '';
        if (item.timeline && item.timeline.length > 0) {
            timelineHTML = `
            <div class="logic-timeline fade-in-section" style="animation-delay: 0.5s;">
                <h3 class="timeline-title">Logic Timeline</h3>
                ${item.timeline.map((step, index) => `
                    <div class="timeline-step" style="animation-delay: ${0.6 + index * 0.1}s;">
                        <div class="timeline-step-content">${step}</div>
                    </div>
                `).join('')}
            </div>`;
        }

        // Interactive Mini-map
        let minimapHTML = '';
        if (data.edges) {
            const connectedSources = data.edges.filter(e => e.target === id).map(e => e.source);
            const connectedTargets = data.edges.filter(e => e.source === id).map(e => e.target);
            
            const findItem = (nodeId) => {
                for (const st of stages) {
                    const found = data[st].find(i => i.id === nodeId);
                    if (found) return { item: found, stage: st };
                }
                return null;
            };

            const links = [];
            connectedSources.forEach(s => {
                const found = findItem(s);
                if (found) links.push(`<a class="minimap-link" data-id="${found.item.id}" data-stage="${found.stage}">← ${found.item.title}</a>`);
            });
            connectedTargets.forEach(t => {
                const found = findItem(t);
                if (found) links.push(`<a class="minimap-link" data-id="${found.item.id}" data-stage="${found.stage}">${found.item.title} →</a>`);
            });

            if (links.length > 0) {
                minimapHTML = `<div class="minimap-container fade-in-section" style="animation-delay: 0s;">
                    <strong>Connections:</strong> <div class="minimap-links">${links.join('')}</div>
                </div>`;
            }
        }

        document.getElementById('modal-content').innerHTML = `
            ${minimapHTML}
            ${sectionCardsHTML}
            ${timelineHTML}
        `;

        modal.showModal();
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
});
