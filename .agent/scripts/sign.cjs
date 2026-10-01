const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const secretsPath = path.join(os.homedir(), ".watchmen", "secrets.env");
const content = fs.readFileSync(secretsPath, "utf-8");
const match = content.match(/^OOB_SIGNING_KEY=(.*)$/m);
const OOB_SIGNING_KEY = match[1].trim();

const gates = ['delivery'];
const story_id = 'story-35.10';

gates.forEach(gate_name => {
  const timestamp = Date.now();
  const payload = `${story_id}:${gate_name}:${timestamp}`;
  const hmac = crypto.createHmac("sha256", OOB_SIGNING_KEY);
  hmac.update(payload);
  const signature = hmac.digest("hex");
  const resultText = `[x] (Timestamp: ${timestamp}, Signature: ${signature})`;
  console.log(`${gate_name}: ${resultText}`);
});
