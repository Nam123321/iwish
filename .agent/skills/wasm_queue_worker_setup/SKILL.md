---
name: "wasm_queue_worker_setup"
description: "Use when the user needs to optimize Fastify by offloading CPU-heavy tasks like Wasm, Magika, or RegEx to worker threads, or mentions Fastify event loop blocking."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# wasm_queue_worker_setup

## When to Use This Skill
- When a Fastify application is suffering from event loop blocking due to CPU-intensive operations.
- When the user specifically requests setting up a worker queue for tasks like Magika file validation, WebAssembly (Wasm) execution, or complex Regular Expressions.
- When configuring `fastify-piscina` or Node.js `worker_threads` for a Fastify app.

## Core Rules
1. **Use Piscina:** Always use the `piscina` library (or `fastify-piscina`) for worker pools in Fastify, as it is the official recommendation and highly optimized for Node.js worker threads.
2. **Isolate CPU Tasks:** Only send purely CPU-bound tasks (Magika, Wasm, Regex) to the worker. Never send I/O tasks (DB queries, network requests) to the worker queue, as the IPC (Inter-Process Communication) overhead will degrade performance.
3. **Structured Cloning:** Ensure all data passed to and from the worker thread can be serialized via the Structured Clone Algorithm. No functions or complex class instances.
4. **Pool Sizing:** Configure the worker pool size dynamically based on the deployment environment (e.g., `Math.max(1, os.cpus().length - 1)`).

## Red Flags — STOP and Reconsider
- **Red Flag:** You find yourself suggesting `child_process.fork()` instead of `worker_threads` for frequent, small tasks.
  - *Reality:* Spawning new processes has massive overhead. `worker_threads` via `piscina` is the standard for Node.js CPU offloading.
- **Red Flag:** You are passing large buffers directly by value instead of using `Transferable` objects.
  - *Reality:* Always use `SharedArrayBuffer` or transfer ownership of `ArrayBuffer` when sending large files (like for Magika) to avoid memory duplication overhead.

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| G-01 | Verify `piscina` package is installed in `package.json` | Category A | `grep_search` or script checks `package.json` for dependency | Tool call output |
| G-02 | Ensure worker payload is serializable | Category B | Static code analysis by agent | Agent review notes |

## Boilerplate / Snippets

### Fastify Plugin Setup (`worker-plugin.js`)
```javascript
const fp = require('fastify-plugin');
const { resolve } = require('path');
const Piscina = require('piscina');

async function workerPlugin(fastify, options) {
  const pool = new Piscina({
    filename: resolve(__dirname, 'worker.js'),
    minThreads: 1,
    maxThreads: Math.max(1, require('os').cpus().length - 1)
  });

  fastify.decorate('workerPool', pool);

  fastify.addHook('onClose', async (instance) => {
    await instance.workerPool.destroy();
  });
}

module.exports = fp(workerPlugin, { name: 'fastify-worker-pool' });
```

### Worker File (`worker.js`)
```javascript
const { Magika } = require('magika');
// Initialize Magika or Wasm module once per worker thread
const magika = new Magika();
magika.load();

module.exports = async (taskData) => {
  const { type, payload } = taskData;
  
  if (type === 'magika_scan') {
    // payload should be a Uint8Array
    const result = await magika.identifyBytes(payload);
    return result;
  }
  
  if (type === 'regex_match') {
    // Heavy regex logic
    const regex = new RegExp(payload.pattern, 'g');
    return payload.text.match(regex);
  }
  
  throw new Error('Unknown task type');
};
```
