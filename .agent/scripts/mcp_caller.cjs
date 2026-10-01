const { spawn } = require('child_process');

const server = spawn('node', ['.agent/mcp-servers/watchmen-mcp/build/index.js']);

const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'cli', version: '1.0' }
  }
};

let step = 0;
const gates = ['pre-code', 'post-code', 'review'];
let currentGateIdx = 0;

server.stdout.on('data', (data) => {
  const messages = data.toString().split('\n').filter(Boolean);
  for (const msg of messages) {
    try {
      const parsed = JSON.parse(msg);
      // console.log(parsed);
      if (step === 0 && parsed.id === 1) {
        step = 1;
        server.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
        sendNextGate();
      } else if (step === 1 && parsed.id > 1) {
        console.log(`Gate result for ${gates[currentGateIdx]}:`);
        console.log(JSON.stringify(parsed, null, 2));
        currentGateIdx++;
        sendNextGate();
      }
    } catch(e) {}
  }
});

function sendNextGate() {
  if (currentGateIdx < gates.length) {
    server.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 2 + currentGateIdx,
      method: 'tools/call',
      params: {
        name: 'sign_pipeline_gate',
        arguments: {
          story_id: 'story-35.10',
          gate_name: gates[currentGateIdx]
        }
      }
    }) + '\n');
  } else {
    server.kill();
  }
}
