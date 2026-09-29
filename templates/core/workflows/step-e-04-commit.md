# Step E-04: Commit (Applying & Logging)

## Goal
Apply the approved enhancements and update the system's evolution lineage.

## Execution Instructions
1. **Apply Changes**:
   - Save the drafted patches to the canonical `.agent/` files.
2. **Update Lineage**:
   - Append an event to `.agent/fragments/capability-provenance-lineage.md` or a local `lineage.jsonl` if it exists.
   - **Event Format**:
     - `timestamp`: [ISO]
     - `type`: "capability_upgrade"
     - `target`: [Path]
     - `reason`: [Summary of clustered evidence]
     - `source`: "Auto-Immune System (HSEA-1.4)"
3. **Verify Deployment**:
   - Confirm that the new rules are visible to future agent turns.
4. **Notify User**:
   - Summarize which skills/workflows were hardened and what specific failure modes they now protect against.

## Expected Output
Final confirmation of changes and an updated lineage log.
