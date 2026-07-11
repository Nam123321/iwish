import fs from 'fs';
import path from 'path';

// Parse arguments
const args = process.argv.slice(2);
const params = {};
args.forEach(arg => {
    if (arg.startsWith('--')) {
        const [key, value] = arg.split('=');
        params[key.substring(2)] = value;
    }
});

const { story, draft, out } = params;

if (!story || !draft || !out) {
    console.error("❌ ERROR: Missing required arguments. Usage: node finalize-ui-spec.js --story=<id> --draft=<path> --out=<path>");
    process.exit(1);
}

const draftPath = path.resolve(draft);
const outPath = path.resolve(out);
const outDir = path.dirname(outPath);

// The HTML file MUST exist in the same directory as the expected UI spec
const htmlPreviewPath = path.join(outDir, `html-preview-story-${story}.html`);

console.log(`[Strict Gate] Validating workflow for Story ${story}...`);

if (!fs.existsSync(htmlPreviewPath)) {
    console.error(`\n🚨 [STRICT GATE VIOLATION] 🚨`);
    console.error(`MANDATORY HTML PREVIEW MISSING!`);
    console.error(`Expected to find: ${htmlPreviewPath}`);
    console.error(`You MUST NOT skip the HTML preview step. Generate the zero-logic HTML/CSS preview file first and present it to the user.`);
    
    if (fs.existsSync(draftPath)) {
        console.error(`Deleting unauthorized draft: ${draftPath}`);
        fs.unlinkSync(draftPath);
    }
    
    process.exit(1);
}

// If HTML exists, we can promote the draft
if (!fs.existsSync(draftPath)) {
    console.error(`❌ ERROR: Draft file not found at ${draftPath}`);
    process.exit(1);
}

try {
    fs.renameSync(draftPath, outPath);
    console.log(`✅ [Strict Gate Passed] UI Spec successfully promoted to: ${outPath}`);
    console.log(`👉 Next step: Run the Design Compliance Scanner on the generated UI Spec.`);
    process.exit(0);
} catch (error) {
    console.error(`❌ ERROR: Failed to promote draft: ${error.message}`);
    process.exit(1);
}
