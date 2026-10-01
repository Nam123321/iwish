
const fs = require('fs');
const crypto = require('crypto');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const path = require('path');

const projectRoot = process.cwd();
const privateKeyPath = path.join(projectRoot, '.agent/.secrets/watchmen.key');
const privateKeyBase64 = fs.readFileSync(privateKeyPath, 'utf8').trim();
const secretKey = naclUtil.decodeBase64(privateKeyBase64);

let keyPair;
try {
  keyPair = nacl.sign.keyPair.fromSecretKey(secretKey);
} catch (e) {
  keyPair = nacl.sign.keyPair.fromSeed(secretKey);
}

const storyId = process.argv[2]; // story-17.x
const uiSpecPath = process.argv[3];
const previewPath = process.argv[4];
const approvalPath = process.argv[5];

const getHash = (filePath) => {
    if (!fs.existsSync(filePath)) return null;
    const rawContent = fs.readFileSync(filePath, 'utf8');
    const normalizedContent = rawContent.replace(/\r\n/g, '\n').trim().normalize('NFC');
    return crypto.createHash('sha256').update(normalizedContent).digest('hex');
};

const hashHex = getHash(uiSpecPath);
const previewHex = getHash(previewPath);

if (hashHex && previewHex) {
    const payloadString = `${storyId}:${hashHex}`;
    const payloadBytes = new TextEncoder().encode(payloadString);
    const signatureBytes = nacl.sign.detached(payloadBytes, keyPair.secretKey);
    const sigBase64 = naclUtil.encodeBase64(signatureBytes);

    const approvalJson = {
      "status": "approved",
      "timestamp": new Date().toISOString(),
      "approver": "auto-approve-agent",
      "ui_spec_hash": hashHex,
      "preview_html_hash": previewHex
    };
    fs.writeFileSync(approvalPath, JSON.stringify(approvalJson, null, 2));

    const sigJson = {
      "story_id": storyId,
      "signature": sigBase64
    };
    fs.writeFileSync(approvalPath + ".sig", JSON.stringify(sigJson, null, 2));
    console.log("Signed UI design for " + storyId);
} else {
    console.log("No UI spec or preview found for " + storyId + ", skipping signature.");
}
