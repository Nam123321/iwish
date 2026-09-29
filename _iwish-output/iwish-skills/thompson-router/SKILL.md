---
name: 'thompson-router'
description: 'Adaptive model selection using Thompson Sampling, dynamically scaling across active environment LLM providers.'
inputs:
  - task_type: 'Categorization of task (e.g., code_gen, test_gen, research)'
  - prompt_length: 'Number of input characters or estimated tokens'
outputs:
  - selected_model: 'Model identifier recommended for routing'
  - selected_provider: 'LLM provider recommended for routing'
mcp_tools_required: []
subagent_triggers: []
---

# 🎯 Thompson Sampling Model Router
> Nhóm phân loại / Classification: `SKILL_ATTACHMENT / SUPPORTIVE`

## 📌 Overview
This skill dynamically selects the optimal model tier (latency/cost/performance) for outbound LLM calls using a Multi-Armed Bandit model (Thompson Sampling) based on Beta distribution parameters. It scans active environment variables to dynamically discover available providers (Google, Anthropic, OpenAI, local Ollama) and avoid Claude vendor lock-in.

---

## 🛠️ Usage Guidelines

### Execution Flow
1. **Model Discovery:** Reads current environment keys (e.g., `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`) to compile the active pool of models.
2. **Compute Probability:** Evaluates historic successes ($ \alpha $) and failures ($ \beta $) stored in `.iwish/routing-stats.json`.
3. **Thompson Selection:** Draws a random sample from the Beta distribution for each model and outputs the model with the highest value:
   ```bash
   node _iwish-output/iwish-skills/thompson-router/scripts/thompson-selector.js <task_type>
   ```
4. **Stats Feedback:** Log execution success/failure back to updating model parameters:
   ```bash
   node _iwish-output/iwish-skills/thompson-router/scripts/stats-tracker.js log <model> <provider> <success_flag> <latency_ms>
   ```

---

## 🚦 Verification Checklist
- [ ] Verify env discovery flags models correctly when API keys are toggled.
- [ ] Run 100 simulated selections; verify the router trends toward models with higher historical success rates.
- [ ] Confirm stats database `.iwish/routing-stats.json` updates successfully after each mock logging event.
