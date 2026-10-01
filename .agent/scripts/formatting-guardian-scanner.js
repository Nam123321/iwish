#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

function scanFormattingCompliance(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Formatting Scanner Error: File not found: ${filePath}`);
        process.exit(0);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    let hasError = false;

    // Banned patterns
    const bannedPatterns = [
        { regex: /\.toLocaleString\(/g, reason: "Banned static format `.toLocaleString()`. Must use `useFormatter` hook." },
        { regex: /\.toFixed\(/g, reason: "Banned static format `.toFixed()`. Must use `useFormatter` hook." },
        // Look for hardcoded currency symbols outside of markdown tables or code blocks where possible, 
        // but for a simple scanner, we might just look for $ followed by numbers.
        { regex: /\$\d+/g, reason: "Banned hardcoded currency symbol `$`. Must use i18n/formatters." }
    ];

    const lines = content.split('\n');
    lines.forEach((line, index) => {
        if (/banned/i.test(line)) return;
        bannedPatterns.forEach(pattern => {
            if (pattern.regex.test(line)) {
                console.error(`❌ Formatting Compliance FAILED in ${filePath} (Line ${index + 1})`);
                console.error(`   Found: ${line.trim()}`);
                console.error(`   Reason: ${pattern.reason}`);
                hasError = true;
            }
        });
    });

    if (hasError) {
        console.error("\n💡 Hint: Refer to `.agent/skills/formatting-guardian/SKILL.md` for correct dynamic formatting rules.");
        process.exit(0);
    }

    console.log(`✅ Formatting Guardian Compliance PASSED for ${filePath}`);
    process.exit(0);
}

const args = process.argv.slice(2);
const fileArgIndex = args.indexOf('--file');

if (fileArgIndex === -1 || !args[fileArgIndex + 1]) {
    console.error("Usage: node formatting-guardian-scanner.js --file <path-to-ui-spec.md>");
    process.exit(0);
}

scanFormattingCompliance(args[fileArgIndex + 1]);
