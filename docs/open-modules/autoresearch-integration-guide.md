# Integration Guide: autoresearch

## 1. What Is It
- **Module Name:** `autoresearch` (ML Pretraining Swarm variant)
- **Source:** [karpathy/autoresearch](https://github.com/karpathy/autoresearch)
- **Current Registration State:** Pending Integration (Drafting)
- **Shape Classification:** `dedicated-workflow` (ML research loop) / `skill-attachment` (Muon optimizer & Best-fit dataloader)
- **Role Classification:** `supportive` (for Deep Learning training and optimization tasks)

---

## 2. Why It Exists
- **Job Solved:** Automates the repetitive grind of tuning deep learning model architectures and training hyperparameters (such as learning rates, optimizer momentum, weight decay, activation layers) to minimize validation loss (`val_bpb`) under a fixed time budget.
- **Why I-Wish Wants It:** Extends the existing abstract I-Wish `autoresearch` metrics-optimization loop with a specialized, concrete protocol for GPU-based Deep Learning workloads.
- **Gap Filled:** Integrates advanced ML optimization techniques (Muon orthogonal optimizer, best-fit packing dataloader) directly into the user's toolset.

---

## 3. Delivery Framework Placement
- **Phases Helped:** Execution & Validation (Phase 6 & 7).
- **Stages served:** Model training optimization under `/dev-agent-story` or `/prototype`.
- **Classification:** `supportive` (called on demand when optimizing ML training scripts).

---

## 4. Input -> Process -> Output

### Inputs
- **Training Script (`train.py`):** The PyTorch code defining model architecture, optimizers, and loop.
- **Validation Dataset:** Parquet shards located under `~/.cache/autoresearch/`.
- **Optimization Goal:** Minimize validation bits-per-byte (`val_bpb`).
- **Constraints:** Time budget (e.g. 5 minutes per run), VRAM limits, GPU acceleration.

### Process
1. Initialize experiment branch and record baseline run performance.
2. Edit target hyperparameters/architecture in `train.py`.
3. Commit edits.
4. Execute `uv run train.py` under time-budget monitoring.
5. Parse logs for validation metric.
6. Decides: `keep` (if metric improves) or `revert` (if performance degrades or crashes).
7. Log run metrics to `results.tsv`.
8. Repeat or stop when target or budget is hit.

### Outputs
- Optimized `train.py` training script.
- Log of all iterations (`results.tsv`).
- Progress plots (`progress.png`).

---

## 5. Use Cases

### Core Use Cases
- **Hyperparameter Search:** Finding optimal learning rates, momentum rates, and weight decay policies for training runs.
- **Layer & Model Tuning:** Experimenting with transformer layers (GELU vs. ReLU, RMSNorm vs. LayerNorm, adding value embeddings).
- **Tokenizer Training:** Training custom BPE tokenizers and testing sequence packing efficiency.

### Adjacent Use Cases
- Benchmarking GPU throughput (Model FLOPs Utilization - MFU) across different architectures.

### Do-Not-Use Cases
- **Subjective Code Refactoring:** Cleaning up styling, variable renaming, or fixing standard code-lint errors (use standard dev agents).
- **Non-Numeric Verification:** Optimizing tasks where success cannot be mechanically evaluated by a single continuous scalar value.

---

## 6. Edge Cases / Stress Cases / Constraints

### Edge Cases
- **NaN Loss/Divergence:** Unstable training parameters causing loss to explode to NaN. Handled by fast-fail check and early loop exit.
- **Out of Memory (OOM):** Increasing model size beyond GPU capacity. Mitigated by `PYTORCH_ALLOC_CONF="expandable_segments:True"` and checking `peak_vram_mb`.

### Stress Cases
- **Local Minima Trap:** The agent fails to explore radical improvements because they cause a temporary dip in performance (ratchet rule).
- **Metric Gaming:** The agent decreases the learning rate early to show a temporary drop in `val_bpb` within the 5-minute limit, leading to poor final convergence.

### Constraints
- Requires a local or remote NVIDIA GPU with CUDA support and FlashAttention-3 compatible kernels.
- Heavy token usage if left running for dozens of iterations.

---

## 7. Agent / Workflow / Skill Coordination
- **Canonical Agents:** `dev-agent` (to propose code changes) and `review-agent` (to validate results and enforce safety constraints).
- **Workflows:** Merges into `/autoresearch` as a dedicated **ML-Pretraining Profile**.
- **Supportive Skills:** `MuonOptimizer` and `BestFitDataloader` (adopted as importable libs).

---

## 8. Orch Routing Hints
- **Trigger Phrases:** `"optimize training script"`, `"tune hyperparameters"`, `"run machine learning research loop"`, `"minimize val_bpb"`.
- **Anti-Triggers:** `"fix typescript errors"`, `"style navigation bar"`, `"write docker-compose"`.
- **Routing Stage:** Proposed during technical planning / prototyping stage.

---

## 9. Review Questions for the User
1. Should we restrict the maximum iteration count to 10 by default to prevent token run-away?
2. Do you want the Muon optimizer and Best-fit dataloader to be registered under a global library folder `_iwish-output/libs/`?
3. Should git clean checks block the loop if there are untracked files in the directory?

---

## 10. Example Scenarios

### Scenario 1: Hyperparameter Optimization
```
Goal: Optimize learning rates and weight decay for train.py
Scope: train.py
Verify: uv run train.py | grep "val_bpb:"
Direction: lower
Iterations: 10
```

### Scenario 2: Transformer Layer Tuning
```
Goal: Swap activations and normalization layers to reduce val_bpb under a 5-min budget
Scope: train.py
Verify: uv run train.py | grep "val_bpb:"
Direction: lower
Iterations: 15
```
