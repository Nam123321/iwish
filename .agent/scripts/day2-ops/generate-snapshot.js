const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("📸 Generating Health Snapshot Report...");

function execGraphQuery(query) {
    const escapedQuery = query.replace(/'/g, "'\\''");
    // Use --csv for easier parsing if needed, but --raw avoids headers
    const cmd = `docker exec distro-falkordb redis-cli GRAPH.QUERY codegraph '${escapedQuery}' --raw`;
    try {
        return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    } catch (e) {
        return "";
    }
}

function parseOutput(output) {
    if (!output) return [];
    return output.split('\n').filter(p => p && !p.includes('Query internal execution time') && !p.includes('f.path') && !p.includes('a.path') && !p.includes('Cached execution') && p.trim() !== '');
}

function run() {
    const today = new Date().toISOString().split('T')[0];
    const reportDir = path.resolve(process.cwd(), `_iwish-output/health-reports/${today}`);
    
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    
    let md = `# Codebase Health Snapshot - ${today}\n\n`;

    // 1. Complexity Hotspots
    md += `## 🔥 Top 10 Complexity Hotspots\n`;
    md += `*Files with highest AST cyclomatic complexity. Values > 15 indicate a need for refactoring.*\n\n`;
    const getSafeList = (query) => {
        const out = execGraphQuery(query);
        return parseOutput(out);
    };

    const hotspots = getSafeList("MATCH (f:File) WHERE f.complexity_score IS NOT NULL RETURN f.path + '|' + toString(f.complexity_score) ORDER BY f.complexity_score DESC LIMIT 10");
    md += `| File Path | Complexity Score |\n|---|---|\n`;
    hotspots.forEach(line => {
        const parts = line.split('|');
        if (parts.length === 2) {
            md += `| \`${parts[0]}\` | **${parts[1]}** |\n`;
        }
    });
    md += `\n`;

    // 2. High Churn Files
    md += `## 🌪️ High Churn Files (Last 30 Days)\n`;
    md += `*Files that change the most frequently. High churn + high complexity = High Risk.*\n\n`;
    const churns = getSafeList("MATCH (f:File) WHERE f.churn_count IS NOT NULL RETURN f.path + '|' + toString(f.churn_count) ORDER BY f.churn_count DESC LIMIT 10");
    md += `| File Path | Commits (30d) |\n|---|---|\n`;
    churns.forEach(line => {
        const parts = line.split('|');
        if (parts.length === 2 && parts[1] !== '0') {
            md += `| \`${parts[0]}\` | ${parts[1]} |\n`;
        }
    });
    md += `\n`;

    // 3. Dead Code
    md += `## 🧟 Dead Code Candidates\n`;
    md += `*Files with no incoming explicit IMPORTS (excluding entry points).*\n\n`;
    const deadCode = getSafeList("MATCH (f:File) WHERE f.is_dead_code = true RETURN f.path LIMIT 15");
    if (deadCode.length > 0) {
        deadCode.forEach(line => { md += `- \`${line}\`\n`; });
    } else {
        md += `*No dead code detected!*\n`;
    }
    md += `\n`;

    // 4. Circular Dependencies
    md += `## 🌀 Circular Dependencies\n`;
    md += `*Files involved in circular imports (A -> B -> A).*\n\n`;
    const circular = getSafeList("MATCH (f:File) WHERE f.has_circular_dependency = true RETURN f.path LIMIT 15");
    if (circular.length > 0) {
        circular.forEach(line => { md += `- \`${line}\`\n`; });
    } else {
        md += `*No circular dependencies detected!*\n`;
    }
    md += `\n`;

    // 5. Implicit Coupling
    md += `## 🔗 Implicit Coupling\n`;
    md += `*Files often committed together but without an explicit import relationship (Spooky Action at a Distance).*\n\n`;
    const coupling = getSafeList("MATCH (a:File)-[r:CO_COMMITTED_WITH]->(b:File) RETURN a.path + ' & ' + b.path + '|' + toString(r.weight) ORDER BY r.weight DESC LIMIT 10");
    md += `| File Pairs | Co-commits (30d) |\n|---|---|\n`;
    coupling.forEach(line => {
        const parts = line.split('|');
        if (parts.length === 2) {
            md += `| \`${parts[0]}\` | ${parts[1]} |\n`;
        }
    });
    md += `\n`;

    // 6. Immune System Warnings (Bug Hotspots)
    md += `## 🛡️ Immune System Warnings (Bug Hotspots)\n`;
    md += `*Files with high bug_count. Agents must exercise extreme caution here.*\n\n`;
    const bugHotspots = getSafeList("MATCH (f:File) WHERE f.bug_count IS NOT NULL RETURN f.path + '|' + toString(f.bug_count) ORDER BY f.bug_count DESC LIMIT 10");
    let hasBugs = false;
    md += `| File Path | Bug Count |\n|---|---|\n`;
    bugHotspots.forEach(line => {
        const parts = line.split('|');
        if (parts.length === 2 && parts[1] !== '0') {
            md += `| \`${parts[0]}\` | **${parts[1]}** |\n`;
            hasBugs = true;
        }
    });
    if (!hasBugs) {
         md += `*No high bug_count files detected!*\n`;
    }
    md += `\n`;

    const reportPath = path.join(reportDir, 'health-report.md');
    fs.writeFileSync(reportPath, md, 'utf8');
    
    console.log(`✅ Snapshot saved to: ${reportPath}`);
}

run();
