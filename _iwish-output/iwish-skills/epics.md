# Epics & Stories: Autoresearch ML-Pretraining Integration

## Epic 1: Autoresearch Integration & Profile Merging
*Objective: Update the existing I-Wish autoresearch skill to support deep learning training profiles.*

### Story 1.1: Update autoresearch SKILL.md
- **Tasks:**
  - Add references to the new ML pretraining profile.
  - Document the `val_bpb` and `mfu_percent` metrics inside `references/metric-library.md`.

### Story 1.2: Add ML Metric Library Reference
- **Tasks:**
  - Update `references/metric-library.md` with standard PyTorch verification command patterns.

---

## Epic 2: Verification & Validation
*Objective: Ensure the integrated loop runs safely and produces the correct results.*

### Story 2.1: Verify Integration
- **Tasks:**
  - Test run parsing of `val_bpb` with mock outputs.
  - Run syntax/lint check on updated markdown reference files.
