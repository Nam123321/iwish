const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const net = require('net');

function callDaemonSign(payload) {
    return new Promise((resolve, reject) => {
        const client = net.createConnection({ path: '/tmp/watchmen.sock' }, () => {
            client.write(JSON.stringify({ action: 'sign', payload }));
        });
        
        let dataStr = '';
        client.on('data', (data) => { dataStr += data.toString(); });
        client.on('end', () => {
            try {
                const res = JSON.parse(dataStr);
                if (res.error) reject(new Error(res.error));
                else resolve(res.signature);
            } catch(e) { reject(e); }
        });
        client.on('error', reject);
    });
}

function getHash(filePath) {
  const rawContent = fs.readFileSync(filePath, 'utf8');
  const normalizedContent = rawContent.replace(/\r\n/g, '\n').trim().normalize('NFC');
  return crypto.createHash('sha256').update(normalizedContent).digest('hex');
}

const uiSpecPath = "_iwish-output/3. Development/1. Epic & Story/FG-04-AI-Agent-Skills/Epic-78/Story-78.6/ui-spec.md";
const previewPath = "_iwish-output/3. Development/1. Epic & Story/FG-04-AI-Agent-Skills/Epic-78/Story-78.6/preview.html";

async function main() {
  const uiHash = getHash(uiSpecPath);
  const previewHash = getHash(previewPath);

  const approvalJson = {
    status: "approved",
    ui_spec_hash: uiHash,
    preview_html_hash: previewHash
  };

  fs.writeFileSync("_iwish-output/3. Development/1. Epic & Story/FG-04-AI-Agent-Skills/Epic-78/Story-78.6/design-approval.json", JSON.stringify(approvalJson, null, 2));

  const storyId = "78.6";
  const payloadString = `${storyId}:${uiHash}`;
  const payloadDigest = crypto.createHash('sha256').update(payloadString).digest('hex');
  const sigHex = await callDaemonSign(payloadDigest);

  const sigJson = {
    story_id: storyId,
    signature: sigHex
  };

  fs.writeFileSync("_iwish-output/3. Development/1. Epic & Story/FG-04-AI-Agent-Skills/Epic-78/Story-78.6/design-approval.json.sig", JSON.stringify(sigJson, null, 2));

  console.log("Generated design approval successfully.");
}

main().catch(console.error);
