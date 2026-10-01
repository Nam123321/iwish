const { spawn } = require('child_process');

const server = spawn('node', ['.agent/mcp-servers/watchmen-mcp/build/index.js']);
const story_id = process.argv[2];
const gate_name = process.argv[3];

const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'sign_pipeline_gate',
    arguments: {
      story_id: story_id,
      gate_name: gate_name
    }
  }
};

let output = '';

server.stdout.on('data', (data) => {
  const messages = data.toString().split('\n').filter(Boolean);
  for (const msg of messages) {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.id === 1) {
        console.log(JSON.stringify(parsed, null, 2));
        server.kill();
      }
    } catch(e) {}
  }
});

server.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 0,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'cli', version: '1.0' }
  }
}) + '\n');

setTimeout(() => {
  server.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  server.stdin.write(JSON.stringify(request) + '\n');
}, 500);
