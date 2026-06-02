# SOP Sequential Execution Pattern

This fragment defines the rules for sequential turn routing and execution, modeled after MetaGPT's Selective Extraction patterns.

## React Mode: `BY_ORDER`

When an agent operates in the `BY_ORDER` react mode, it MUST execute steps sequentially, one by one, without skipping or jumping ahead.

### Execution Rules
1. **Linear Progression:** Execution flows strictly from Step $N$ to Step $N+1$.
2. **No Skipping:** Do not infer or combine steps. Each step must be explicitly initiated, executed, and completed before moving to the next.
3. **Turn-Based Pauses:** If a step requires external validation, output, or simulated user input, the agent must pause the sequence, save the current step index, and wait for confirmation before proceeding.

## Step Progress Tracking (`rc.state`)

Agents must maintain a runtime context (`rc.state`) to track sequential progress. 

- `rc.current_step`: The index of the currently executing step (0-indexed).
- `rc.total_steps`: The total number of planned steps.
- `rc.completed_steps`: A list of step indices that have successfully passed validation.
- `rc.memory`: Accumulated state and outputs from previous steps that are explicitly passed as inputs to subsequent steps.

*Tracking Directive:* Before starting any new step, log the state: `[BY_ORDER] Initiating step {rc.current_step + 1} of {rc.total_steps}`. Upon completion, log: `[BY_ORDER] Step {rc.current_step + 1} completed. Updating state.`

## Error Handling & Healing

If a step fails during sequential execution (e.g., validation error, missing context, compilation failure, test failure):

1. **Halt Progression:** Do NOT proceed to Step $N+1$.
2. **Invoke Healing Loop:** Trigger the `fast-track-self-healing` loop, passing the `rc.current_step` context and the error trace.
3. **Healing Resolution:**
   - If healing succeeds: Re-evaluate validation for Step $N$. If it passes, mark as completed and proceed to Step $N+1$.
   - If healing fails after max retries: Suspend sequence and escalate to user with `[BY_ORDER] Sequential execution blocked at step {rc.current_step + 1}`.
