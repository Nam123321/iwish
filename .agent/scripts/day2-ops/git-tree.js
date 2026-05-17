const { execSync } = require('child_process');

console.log("🌳 Starting GitTree Analytics (Churn & Coupling)...");

// --- Utility: Run FalkorDB Cypher Queries ---
function execGraphQuery(query) {
    const escapedQuery = query.replace(/'/g, "'\\''");
    const cmd = `docker exec distro-falkordb redis-cli GRAPH.QUERY codegraph '${escapedQuery}' --raw`;
    try {
        return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    } catch (e) {
        return "";
    }
}

function run() {
    // 1. Fetch all tracked files from Neo4j to filter the git log
    const filesOutput = execGraphQuery("MATCH (f:File) RETURN f.path");
    const trackedFiles = new Set(filesOutput.split('\n').filter(p => p && !p.includes('f.path') && !p.includes('Query internal execution time') && p.trim() !== ''));

    console.log(`📦 Found ${trackedFiles.size} tracked files in CodebaseGraph.`);

    // 2. Parse Git Log (last 30 days)
    console.log("📜 Parsing Git History (last 30 days)...");
    let gitLog = "";
    try {
        gitLog = execSync('git log --since="30 days ago" --name-only --format="COMMIT|%h|%cI"', { encoding: 'utf8' });
    } catch (err) {
        console.warn("⚠️ Failed to read git log:", err.message);
        return;
    }

    const lines = gitLog.split('\n');
    const fileChurn = {}; // path -> count
    const fileLastModified = {}; // path -> date
    const coCommits = {}; // JSON.stringify([f1, f2]) -> count

    let currentCommitFiles = [];
    let currentDate = null;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            // End of commit block
            if (currentCommitFiles.length > 0 && currentCommitFiles.length <= 50) {
                // Generate pairs for co-commits
                for (let i = 0; i < currentCommitFiles.length; i++) {
                    for (let j = i + 1; j < currentCommitFiles.length; j++) {
                        const pair = [currentCommitFiles[i], currentCommitFiles[j]].sort();
                        const key = JSON.stringify(pair);
                        coCommits[key] = (coCommits[key] || 0) + 1;
                    }
                }
            }
            currentCommitFiles = [];
            currentDate = null;
            continue;
        }

        if (trimmed.startsWith('COMMIT|')) {
            const parts = trimmed.split('|');
            currentDate = parts[2]; // ISO date
        } else {
            // It's a file path
            const filePath = trimmed;
            if (trackedFiles.has(filePath)) {
                currentCommitFiles.push(filePath);
                fileChurn[filePath] = (fileChurn[filePath] || 0) + 1;
                if (!fileLastModified[filePath]) {
                    // Git log is chronological (newest first), so the first time we see a file is its last modification date
                    fileLastModified[filePath] = currentDate;
                }
            }
        }
    }

    // Process the final commit block if file didn't end with newline
    if (currentCommitFiles.length > 0 && currentCommitFiles.length <= 50) {
        for (let i = 0; i < currentCommitFiles.length; i++) {
            for (let j = i + 1; j < currentCommitFiles.length; j++) {
                const pair = [currentCommitFiles[i], currentCommitFiles[j]].sort();
                const key = JSON.stringify(pair);
                coCommits[key] = (coCommits[key] || 0) + 1;
            }
        }
    }

    // 3. Upsert Churn metrics
    console.log(`📈 Upserting churn metrics for ${Object.keys(fileChurn).length} files...`);
    let updatedCount = 0;
    for (const [filePath, churn] of Object.entries(fileChurn)) {
        const lastMod = fileLastModified[filePath];
        execGraphQuery(`MATCH (f:File {path: "${filePath}"}) SET f += {churn_count: ${churn}, last_modified_date: "${lastMod}"}`);
        updatedCount++;
    }
    console.log(`✅ Upserted churn to ${updatedCount} nodes.`);

    // 4. Create Implicit Coupling Edges (CO-COMMITTED_WITH)
    console.log("🔗 Analyzing implicit coupling...");
    let edgeCount = 0;
    for (const [pairJson, count] of Object.entries(coCommits)) {
        if (count >= 3) { // Threshold: At least 3 co-commits to be considered implicit coupling
            const [f1, f2] = JSON.parse(pairJson);
            // Check if they already have an IMPORTS relationship
            const checkQuery = `
                MATCH (a:File {path: "${f1}"})-[r:IMPORTS]-(b:File {path: "${f2}"})
                RETURN count(r) AS c
            `;
            const checkRes = execGraphQuery(checkQuery);
            if (checkRes && checkRes.trim() === '0') {
                // No explicit imports, but high co-commits = Implicit Coupling!
                const mergeQuery = `
                    MATCH (a:File {path: "${f1}"}), (b:File {path: "${f2}"})
                    MERGE (a)-[r:CO_COMMITTED_WITH]->(b)
                    SET r.weight = ${count}
                `;
                execGraphQuery(mergeQuery);
                edgeCount++;
            }
        }
    }
    console.log(`✅ Created ${edgeCount} implicit coupling edges.`);
    console.log("🎉 GitTree Analytics Complete!");
}

run();
