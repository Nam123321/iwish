---
name: workflow-concurrency-benchmark-generator
description: Multi-tenant synthetic concurrent traffic generator for latency, throughput, and circuit-breaker resilience benchmarking.
version: 1.0.0
---

# 🚀 Workflow Concurrency Benchmark Generator

## Purpose
Generates isolated, multi-tenant concurrent synthetic workflow traffic to benchmark p50/p95/p99 latency, throughput (RPS), error rates, and circuit breaker resilience under heavy load.

## Core Capabilities
1. **Canary Tenant Traffic Isolation**: Tags each request with `canary:benchmark:*` to ensure zero interference with production queues.
2. **Virtual User Ramping**: Concurrently spawns $N$ simulated workflows with Poisson arrival times.
3. **Metric Stream Forwarding**: Pipes response time and error data directly into Prometheus Summary / Counter buffers.
4. **Adaptive Throttling**: Automatically backs off if host memory governor crosses 80% RAM threshold.

## Usage
\`\`\`bash
# Trigger synthetic benchmark suite across targets
python3 .agent/scripts/run-concurrency-benchmark.py --scenarios 10 --concurrency 5 --target fastgpt
\`\`\`
