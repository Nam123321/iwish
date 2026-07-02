---
name: automated-benchmark-scaffold
description: Generates and executes objective performance measurement scripts (hyperfine, k6, docker stats) in a sandbox.
---
# Automated Benchmark Scaffold

Triggered during `/rd-evaluate` Step 7 to replace manual, error-prone performance guessing with objective metrics.

## Supported Scaffold Types

1. **CLI Tools (`hyperfine`)**
   - Generate a bash script to install `hyperfine`.
   - Run the target CLI tool 10 times with warmup: `hyperfine --warmup 3 'target-cli args'`.
   - Extract Mean Time and Peak RAM.

2. **API & Web Services (`k6`)**
   - Generate a basic `k6` script (`benchmark.js`) targeting the local instance with 10 VUs for 30s.
   - Measure P95 Latency and Throughput (Req/s).

3. **Background Processes / Agents (Docker / `time`)**
   - Wrap the execution in `/usr/bin/time -v` to extract `Maximum resident set size` (RAM) and CPU percentage.

## Execution
The agent MUST write the script to the temporary workspace, execute it, parse the output, and fill the Step 7 Metrics Table.
