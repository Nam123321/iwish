/**
 * BMAD Idea Navigator - Main Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();
    
    // Load Data and Render
    renderNavigatorContent();
    
    // SVG Connection Drawing
    window.addEventListener('resize', drawLineage);
    setTimeout(drawLineage, 500); // Initial draw delay for layout settling
    
    // Scroll Effects
    handleScroll();
    window.addEventListener('scroll', handleScroll);
});

function renderNavigatorContent() {
    const data = window.NAV_DATA;
    if (!data) return;

    // Header
    document.getElementById('project-title').textContent = data.project.title;
    document.getElementById('project-tagline').textContent = data.project.tagline;
    document.getElementById('project-status').textContent = data.project.status;

    // Sections
    if (data.sections.origin) {
        document.getElementById('origin-content').innerHTML = marked.parse(data.sections.origin.markdown);
    }
    if (data.sections.spark) {
        document.getElementById('spark-content').innerHTML = marked.parse(data.sections.spark.markdown);
    }
    if (data.sections.deepDive) {
        document.getElementById('deep-dive-content').innerHTML = marked.parse(data.sections.deepDive.markdown);
    }
    if (data.sections.forge) {
        document.getElementById('forge-content').innerHTML = marked.parse(data.sections.forge.markdown);
    }
}

function handleScroll() {
    const sections = document.querySelectorAll('.journey-section');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    let current = "";
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === current) {
            link.classList.add('active');
        }
    });
}

function drawLineage() {
    const svg = document.getElementById('lineage-svg');
    const sections = document.querySelectorAll('.journey-section');
    
    // Clear existing paths
    svg.innerHTML = '';
    
    if (sections.length < 2) return;

    for (let i = 0; i < sections.length - 1; i++) {
        const startCard = sections[i].querySelector('.content-card');
        const endCard = sections[i+1].querySelector('.content-card');
        
        const startRect = startCard.getBoundingClientRect();
        const endRect = endCard.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();
        
        // Calculate points relative to SVG container
        const x1 = startRect.left + startRect.width / 2 - svgRect.left;
        const y1 = startRect.bottom - svgRect.top;
        const x2 = endRect.left + endRect.width / 2 - svgRect.left;
        const y2 = endRect.top - svgRect.top;

        // Draw Bezier Curve
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const cp1y = y1 + (y2 - y1) / 2;
        const cp2y = y1 + (y2 - y1) / 2;
        
        const d = `M ${x1} ${y1} C ${x1} ${cp1y}, ${x2} ${cp2y}, ${x2} ${y2}`;
        
        path.setAttribute("d", d);
        path.setAttribute("stroke", "rgba(124, 77, 255, 0.3)");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-dasharray", "8,8");
        
        svg.appendChild(path);
        
        // Add animated glow circle
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("r", "4");
        circle.setAttribute("fill", "#7c4dff");
        svg.appendChild(circle);
        
        const animate = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
        animate.setAttribute("dur", "5s");
        animate.setAttribute("repeatCount", "indefinite");
        animate.setAttribute("path", d);
        circle.appendChild(animate);

        // Draw Pivots if they exist for this section
        const currentSectionId = sections[i+1].getAttribute('id');
        const pivot = window.NAV_DATA.pivots.find(p => p.section === currentSectionId);
        if (pivot) {
            const pivotPoint = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            pivotPoint.setAttribute("cx", x2);
            pivotPoint.setAttribute("cy", y2 - 20); // Slightly above the card
            pivotPoint.setAttribute("r", "8");
            pivotPoint.setAttribute("class", "pivot-point");
            
            const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            title.textContent = `PIVOT: ${pivot.note}`;
            pivotPoint.appendChild(title);
            
            svg.appendChild(pivotPoint);
        }
    }
}
