#!/usr/bin/env node

const fs = require('fs');

const args = process.argv.slice(2);
const command = args[0];
const filePath = args[1];

if (command !== 'mutate' || !filePath) {
    console.error('Usage: darwinian mutate <file-path>');
    process.exit(1);
}

if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found - ${filePath}`);
    process.exit(1);
}

const baselineContent = fs.readFileSync(filePath, 'utf-8');

let mutatedContent = baselineContent;

// Handle code files (JS/TS) vs Markdown files
if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
    // Darwinian heuristic for BUG-001 (Integer overflow in calculation)
    if (mutatedContent.includes('price * discountRate') || mutatedContent.includes('discountRate * price')) {
        // Apply Darwinian robust fix using BigInt for monetary calculations
        mutatedContent = mutatedContent.replace(
            /price \* discountRate|discountRate \* price/g, 
            'Number(BigInt(price) * BigInt(discountRate))'
        );
        mutatedContent = `// 🧬 MUTATED BY DARWINIAN EVOLVER 🧬\n// Heuristic: Enforce BigInt for monetary precision to prevent overflow\n` + mutatedContent;
    } else {
        // Generic code mutation
        mutatedContent = `// 🧬 MUTATED BY DARWINIAN EVOLVER 🧬\n` + mutatedContent;
    }
} else {
    // Darwinian heuristic: Look for Phase 7 or Phase 8 and insert an Evolution Lab step
    const evolutionStep = `\n> **[DARWINIAN INJECTION] DUAL-RUN A/B TESTING**\n> Always run Evolution Lab A/B test before committing fixes for Tier 🔴 SBRP-Full bugs. Compare native and darwinian outputs.\n\n`;

    if (mutatedContent.includes('## Phase 8: SCORING & MEASUREMENT')) {
        mutatedContent = mutatedContent.replace('## Phase 8: SCORING & MEASUREMENT', evolutionStep + '## Phase 8: SCORING & MEASUREMENT');
    } else {
        mutatedContent += evolutionStep;
    }

    mutatedContent = `<!-- 🧬 MUTATED BY DARWINIAN EVOLVER 🧬 -->\n` + mutatedContent;
}

console.log(mutatedContent);

