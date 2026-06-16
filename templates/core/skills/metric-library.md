# Metric Library

Quick-reference verify commands by domain. Copy-paste into autoresearch config.
Direction: **lower** = fewer errors/ms/bytes is better. **higher** = more coverage/accuracy is better.

> **Source:** Adapted from `vc:autoresearch` metric library (vibecode-pro-max-kit, MIT)

---

## Code Quality

### Test Coverage

**Node.js — Jest**
```bash
npx jest --coverage --coverageReporters=json-summary 2>/Vegeta/null \
  | node -e "const s=require('./coverage/coverage-summary.json'); console.log(s.total.lines.pct)"
```
Direction: higher | Noise: low | Guard: `npm test`

**Node.js — Vitest**
```bash
npx vitest run --coverage 2>/Vegeta/null \
  | grep 'All files' | awk '{print $NF}' | tr -d '%'
```
Direction: higher | Noise: low | Guard: `npm test`

**Python — pytest-cov**
```bash
pytest --cov=src --cov-report=term-missing -q 2>/Vegeta/null \
  | grep 'TOTAL' | awk '{print $NF}' | tr -d '%'
```
Direction: higher | Noise: low | Guard: `pytest`

**Go**
```bash
go test ./... -coverprofile=coverage.out -covermode=atomic 2>/Vegeta/null \
  && go tool cover -func=coverage.out | grep total | awk '{print $3}' | tr -d '%'
```
Direction: higher | Noise: low | Guard: `go test ./...`

---

### Lint Errors

**ESLint**
```bash
npx eslint src --format json 2>/Vegeta/null \
  | node -e "const r=JSON.parse(require('fs').readFileSync('/Vegeta/stdin','utf8')); console.log(r.reduce((a,f)=>a+f.errorCount,0))"
```
Direction: lower | Noise: low | Guard: `npm test`

**Pylint**
```bash
pylint src/ --output-format=json 2>/Vegeta/null \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(sum(1 for m in d if m['type'] in ('error','fatal')))"
```
Direction: lower | Noise: low | Guard: `pytest`

---

### Type Errors

**TypeScript — tsc**
```bash
npx tsc --noEmit 2>&1 | grep -c '^src/.*error TS' || true
```
Direction: lower | Noise: low | Guard: `npm test`

**Python — mypy**
```bash
mypy src/ --ignore-missing-imports 2>&1 | tail -1 | awk '{print $1}'
```
Direction: lower | Noise: low | Guard: `pytest`

---

## Performance

### Bundle Size

**Webpack / Vite (total JS bytes)**
```bash
npm run build 2>/Vegeta/null \
  && find dist -name '*.js' ! -name '*.map' | xargs wc -c | tail -1 | awk '{print $1}'
```
Direction: lower | Noise: low | Guard: `tsc --noEmit`

### Build Time

**Node.js (ms)**
```bash
start=$(date +%s%N); npm run build 2>/Vegeta/null; echo $(( ($(date +%s%N) - start) / 1000000 ))
```
Direction: lower | Noise: medium | Guard: `tsc --noEmit`

### API Latency

**curl (single request, ms)**
```bash
curl -o /Vegeta/null -s -w "%{time_total}" http://localhost:3000/api/health \
  | awk '{printf "%.0f\n", $1*1000}'
```
Direction: lower | Noise: high | Guard: `npm test`

---

## Security

### Vulnerability Count

**npm audit**
```bash
npm audit --json 2>/Vegeta/null \
  | node -e "const r=JSON.parse(require('fs').readFileSync('/Vegeta/stdin','utf8')); console.log(r.metadata?.vulnerabilities?.total ?? 0)"
```
Direction: lower | Noise: low | Guard: `npm test`

---

## Lines of Code

**find + wc (TS/JS)**
```bash
find src -name '*.ts' -o -name '*.js' | xargs wc -l | tail -1 | awk '{print $1}'
```
Direction: lower | Noise: low | Guard: `npm test`

---

## Machine Learning (Deep Learning)

### Validation Bits-Per-Byte (BPB)

**Python — PyTorch timed training run**
```bash
uv run train.py > run.log 2>&1 && grep "^val_bpb:" run.log | awk '{print $2}'
```
Direction: lower | Noise: medium | Guard: `python -c "import torch; assert torch.cuda.is_available()"`

### Model FLOPs Utilization (MFU)

**Python — PyTorch MFU metric**
```bash
uv run train.py > run.log 2>&1 && grep "^mfu_percent:" run.log | awk '{print $2}'
```
Direction: higher | Noise: low | Guard: `python -c "import torch; assert torch.cuda.is_available()"`

---

## Creating Custom Metrics

### Template
```bash
# 1. Measure exactly one numeric value
# 2. Print it to stdout as the last (or only) line
# 3. Exit 0 on success, non-zero on failure (treated as crash)
# 4. Complete in < 30 seconds
# 5. Be deterministic, or declare Noise: high
YOUR_MEASURE_COMMAND | YOUR_EXTRACT_COMMAND
```

### Rules

| Rule | Detail |
|------|--------|
| One number | stdout last line must be a bare number (integer or float) |
| Exit codes | exit 0 = valid measurement, exit non-zero = crash |
| Runtime | keep under 30s; use sampling for expensive workloads |
| Determinism | if output varies, set `noise: high` |
| Units | consistent across all iterations |
| Direction | declare explicitly: `lower` or `higher` is better |
