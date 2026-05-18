// scripts/hotspot-calculator.js
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

/**
 * Calculates hotspot scores for files based on bug-tracker.yaml
 * Shared engine for both Pivot Guardian (HSEA-1.4) and Operation Report (HSEA-4.6)
 */
function calculateHotspots(workspaceRoot = process.cwd()) {
    const bugTrackerPath = path.join(workspaceRoot, '_iwish-output', 'bug-tracker.yaml');
    
    if (!fs.existsSync(bugTrackerPath)) {
        return {};
    }

    try {
        const fileContents = fs.readFileSync(bugTrackerPath, 'utf8');
        let yamlData = yaml.parse(fileContents) || [];
        const bugs = Array.isArray(yamlData) ? yamlData : (yamlData.bugs || []);
        
        const hotspots = {};

        bugs.forEach(bug => {
            // Helper to add files
            const addFiles = (files) => {
                if (Array.isArray(files)) {
                    files.forEach(file => {
                        if (!hotspots[file]) {
                            hotspots[file] = {
                                bug_count: 0,
                                related_bugs: new Set(),
                                rpn_sum: 0
                            };
                        }
                        hotspots[file].bug_count += 1;
                        hotspots[file].related_bugs.add(bug.id);
                        if (bug.rpn && bug.rpn.total) {
                            hotspots[file].rpn_sum += bug.rpn.total;
                        }
                    });
                }
            };

            // v1 format
            if (bug.filesChanged) {
                addFiles(bug.filesChanged);
            }

            // v2 format
            if (bug.fixAttempts && Array.isArray(bug.fixAttempts)) {
                bug.fixAttempts.forEach(attempt => {
                    if (attempt.filesChanged) {
                        addFiles(attempt.filesChanged);
                    }
                });
            }
        });

        // Convert sets to arrays for JSON serialization and calculate score
        for (const file in hotspots) {
            hotspots[file].related_bugs = Array.from(hotspots[file].related_bugs);
            // Formula synchronized with Operation Report: 10 points per bug + average RPN
            hotspots[file].hotspot_score = (hotspots[file].bug_count * 10) + (hotspots[file].rpn_sum / hotspots[file].bug_count || 0); 
        }

        return hotspots;
    } catch (e) {
        console.error("Error calculating hotspots:", e);
        return {};
    }
}

function getHotspotScoreForFile(filePath, workspaceRoot = process.cwd()) {
    const hotspots = calculateHotspots(workspaceRoot);
    const basename = path.basename(filePath);
    return hotspots[filePath] || hotspots[basename] || null;
}

module.exports = {
    calculateHotspots,
    getHotspotScoreForFile
};

// CLI Execution
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length > 0) {
        const file = args[0];
        const score = getHotspotScoreForFile(file);
        console.log(JSON.stringify(score || { bug_count: 0, hotspot_score: 0 }, null, 2));
    } else {
        const hotspots = calculateHotspots();
        console.log(JSON.stringify(hotspots, null, 2));
    }
}
