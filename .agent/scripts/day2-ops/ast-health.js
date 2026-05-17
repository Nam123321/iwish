const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ts = require('typescript');

console.log("🚀 Starting AST Health & Structural Analysis...");

// --- Utility: Run FalkorDB Cypher Queries ---
function execGraphQuery(query) {
    const escapedQuery = query.replace(/'/g, "'\\''");
    const cmd = `docker exec distro-falkordb redis-cli GRAPH.QUERY codegraph '${escapedQuery}' --raw`;
    try {
        return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    } catch (e) {
        // Ignore expected FalkorDB empty result errors
        return "";
    }
}

// --- 1. Calculate Cyclomatic Complexity using AST ---
function calculateComplexity(filePath) {
    try {
        const sourceFile = ts.createSourceFile(
            filePath,
            fs.readFileSync(filePath, 'utf8'),
            ts.ScriptTarget.Latest,
            true
        );

        let complexity = 1;

        function visit(node) {
            switch (node.kind) {
                case ts.SyntaxKind.IfStatement:
                case ts.SyntaxKind.CatchClause:
                case ts.SyntaxKind.ConditionalExpression:
                case ts.SyntaxKind.ForStatement:
                case ts.SyntaxKind.ForInStatement:
                case ts.SyntaxKind.ForOfStatement:
                case ts.SyntaxKind.WhileStatement:
                case ts.SyntaxKind.DoStatement:
                case ts.SyntaxKind.CaseClause:
                case ts.SyntaxKind.AmpersandAmpersandToken:
                case ts.SyntaxKind.BarBarToken:
                case ts.SyntaxKind.QuestionQuestionToken:
                    complexity++;
                    break;
            }
            ts.forEachChild(node, visit);
        }

        visit(sourceFile);
        return complexity;
    } catch (err) {
        console.warn(`⚠️ Could not parse AST for ${filePath}: ${err.message}`);
        return null;
    }
}

// --- 2. Main Logic: Extract files, parse, and upsert ---
function run() {
    // A. Get list of files from existing CodebaseGraph to ensure we only process tracked files
    console.log("📡 Fetching tracked files from CodebaseGraph...");
    const filesOutput = execGraphQuery("MATCH (f:File) RETURN f.path");
    const files = filesOutput.split('\n').filter(p => p && !p.includes('f.path') && !p.includes('Query internal execution time') && p.trim() !== '');

    console.log(`📦 Found ${files.length} tracked files. Calculating AST Complexity...`);
    let updatedCount = 0;
    const batchCommands = [];

    for (const filePath of files) {
        if (!filePath.match(/\.(js|jsx|ts|tsx)$/)) continue;

        const absolutePath = path.resolve(process.cwd(), filePath);
        
        if (fs.existsSync(absolutePath)) {
            const complexity = calculateComplexity(absolutePath);
            if (complexity !== null) {
                batchCommands.push(`GRAPH.QUERY codegraph "MATCH (f:File {path: '${filePath}'}) SET f += {complexity_score: ${complexity}}"`);
                updatedCount++;
            }
        }
    }
    
    if (batchCommands.length > 0) {
        try {
            execSync('docker exec -i distro-falkordb redis-cli > /dev/null', { 
                input: batchCommands.join('\n'),
                stdio: ['pipe', 'ignore', 'ignore'] 
            });
        } catch (e) {
            console.warn("⚠️ Failed to execute bulk batch AST update.");
        }
    }
    console.log(`✅ Upserted complexity_score to ${updatedCount} nodes.`);

    // B. Detect Dead Code (Orphan files with no incoming IMPORTS)
    console.log("🧟 Detecting Dead Code (Orphan files)...");
    execGraphQuery(`MATCH (f:File) SET f += {is_dead_code: false}`); // Reset
    const deadCodeQuery = `
        MATCH (f:File) 
        WHERE NOT ()-[:IMPORTS]->(f) 
          AND NOT f.path ENDS WITH 'page.tsx' 
          AND NOT f.path ENDS WITH 'layout.tsx' 
          AND NOT f.path ENDS WITH 'index.ts'
        SET f += {is_dead_code: true}
    `;
    execGraphQuery(deadCodeQuery);
    console.log(`✅ Dead code marked.`);

    // C. Detect Circular Dependencies
    console.log("🌀 Detecting Circular Dependencies...");
    execGraphQuery(`MATCH (f:File) SET f += {has_circular_dependency: false}`); // Reset
    const circularQuery = `
        MATCH path = (a:File)-[:IMPORTS*2..4]->(a) 
        SET a += {has_circular_dependency: true}
    `;
    execGraphQuery(circularQuery);
    console.log(`✅ Circular dependencies marked.`);

    // D. Sync Bug Tracker Metrics
    console.log("🐛 Syncing Bug Tracker Metrics...");
    execGraphQuery(`MATCH (f:File) SET f += {bug_count: 0}`); // Reset
    
    const bugTrackerPath = path.resolve(process.cwd(), '_bmad-output/bug-tracker.yaml');
    const bugCounts = {}; // filename -> count
    
    if (fs.existsSync(bugTrackerPath)) {
        const content = fs.readFileSync(bugTrackerPath, 'utf8');
        
        // Match both [f1, f2] and - "file" formats
        const bugs = content.split(/id:\s+BUG-\d+/);
        bugs.forEach(bugBlock => {
            const filesMatch = bugBlock.match(/filesChanged:\s*([\s\S]*?)(?:\n\w+:|$)/);
            if (filesMatch) {
                const filesPart = filesMatch[1].trim();
                let fileList = [];
                if (filesPart.startsWith('[')) {
                    fileList = filesPart.replace(/[\[\]]/g, '').split(',').map(f => f.trim().replace(/['"]/g, ''));
                } else {
                    fileList = filesPart.split('\n').map(line => line.trim().replace(/^-\s*/, '').replace(/['"]/g, ''));
                }
                for (const f of fileList) {
                    if (f && f !== '-') {
                        bugCounts[f] = (bugCounts[f] || 0) + 1;
                    }
                }
            }
        });
    }
    
    let bugUpdates = 0;
    const bugBatch = [];
    for (const [filename, count] of Object.entries(bugCounts)) {
        bugBatch.push(`GRAPH.QUERY codegraph "MATCH (f:File) WHERE f.path ENDS WITH '${filename}' SET f += {bug_count: ${count}}"`);
        bugUpdates++;
    }
    
    if (bugBatch.length > 0) {
        try {
            execSync('docker exec -i distro-falkordb redis-cli > /dev/null', { 
                input: bugBatch.join('\n'),
                stdio: ['pipe', 'ignore', 'ignore'] 
            });
        } catch (e) {
            console.warn("⚠️ Failed to execute bulk batch Bug Tracker update.");
        }
    }
    console.log(`✅ Upserted bug_count for ${bugUpdates} unique files based on bug-tracker.yaml.`);

    console.log("🎉 AST Health & Structural Analysis Complete!");
}

run();
