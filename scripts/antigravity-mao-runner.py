#!/usr/bin/env python3
import os
import sys
import json
import subprocess
import asyncio
import re
import time
from google.antigravity import Agent, LocalAgentConfig, types

def get_project_root():
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get_active_workflow_path():
    return os.path.join(get_project_root(), ".iwish", "runtime", "workflows", "active-workflow.json")

def load_active_workflow():
    path = get_active_workflow_path()
    if os.path.exists(path):
        try:
            with open(path, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return None

def save_active_workflow(state):
    path = get_active_workflow_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(state, f, indent=2)

def clear_active_workflow():
    path = get_active_workflow_path()
    if os.path.exists(path):
        try:
            os.remove(path)
        except Exception:
            pass

def record_agent_trace(agent_name, duration, tokens, parent=None):
    trace_path = os.path.join(get_project_root(), ".iwish", "runtime", "workflows", "agent-trace.json")
    os.makedirs(os.path.dirname(trace_path), exist_ok=True)
    
    traces = []
    if os.path.exists(trace_path):
        try:
            with open(trace_path, "r") as f:
                traces = json.load(f)
        except Exception:
            pass
            
    trace_id = f"trace-{len(traces) + 1}"
    traces.append({
        "id": trace_id,
        "label": agent_name,
        "group": "agent",
        "duration": round(duration, 2),
        "tokens": int(tokens),
        "parent": parent,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    })
    
    with open(trace_path, "w") as f:
        json.dump(traces, f, indent=2)

# Mapping of workflows, steps/phases, agents, and prompts
WORKFLOW_CONFIGS = {
    "absorb-repo": {
        "phases": [
            {
                "phase": "0",
                "name": "Security Guardian",
                "agent": "review-agent",
                "prompt_template": "Execute Security Guardian (Phase 0) for repo: {target}. Cloned repository path is under {project_root}/.iwish/sandbox/{repo_name}/. Run secrets scan, dependency audit, and behavioral analysis. Output a security-report.md at {project_root}/_iwish-output/absorbed-repos/{repo_name}/security-report.md.",
                "checkpoint": False
            },
            {
                "phase": "1",
                "name": "Ingest",
                "agent": "capability-agent",
                "prompt_template": "Execute Ingest (Phase 1) for repo: {target}. Run repomix to pack the repository into a context.md file at {project_root}/_iwish-output/absorbed-repos/{repo_name}/context.md. Previous Security Report output: {prev_outputs}",
                "checkpoint": False
            },
            {
                "phase": "1.5",
                "name": "Indexing",
                "agent": "architect-agent",
                "prompt_template": "Execute Indexing (Phase 1.5) for repo: {target}. Build the Tech Graph (CGC) or fallback heuristic scan. Trace AST-to-asset edges. Output asset-inventory.md at {project_root}/_iwish-output/absorbed-repos/{repo_name}/asset-inventory.md. Context file: {project_root}/_iwish-output/absorbed-repos/{repo_name}/context.md",
                "checkpoint": False
            },
            {
                "phase": "2",
                "name": "Map",
                "agent": "architect-agent",
                "prompt_template": "Execute Map (Phase 2) for repo: {target}. Group modules, identify boundaries/hub nodes, overlay behavioral assets, and generate a Mermaid diagram. Output to Architecture Blueprint. Asset Inventory: {prev_outputs}",
                "checkpoint": False
            },
            {
                "phase": "3",
                "name": "Dissect",
                "agent": "capability-agent",
                "prompt_template": "Execute Dissect (Phase 3) for repo: {target}. Graph-directed deep reading of tech modules and behavioral assets. Extract role/persona, system prompts, tool usage patterns, and decision logic. Asset Inventory and Map context: {prev_outputs}",
                "checkpoint": False
            },
            {
                "phase": "4",
                "name": "Document",
                "agent": "capability-agent",
                "prompt_template": "Execute Document (Phase 4) for repo: {target}. Compile findings into the 11-section repo-dna template. Save to {project_root}/_iwish-output/repo-dna/{repo_name}-dna.md and create a symlink in the sandbox. Patterns context: {prev_outputs}",
                "checkpoint": False
            },
            {
                "phase": "5",
                "name": "Compare",
                "agent": "architect-agent",
                "prompt_template": "Execute Compare (Phase 5) for repo: {target}. Perform Gap Analysis against existing assets. Run adversarial review. Formulate track classification (SYSTEM_SKILL vs USER_SPACE). Output gap-analysis.md at {project_root}/_iwish-output/gap-analysis/{repo_name}-gap-analysis.md. Repo DNA: {prev_outputs}",
                "checkpoint": True,
                "checkpoint_msg": "Please review the Gap Analysis report at {project_root}/_iwish-output/gap-analysis/{repo_name}-gap-analysis.md. Type 'continue' or 'yes' to approve and proceed to integration."
            },
            {
                "phase": "5.5",
                "name": "Adoption Review Pack",
                "agent": "orch-agent",
                "prompt_template": "Execute Adoption Review Pack (Phase 5.5) for repo: {target}. Generate integration guide in both markdown and HTML format under {project_root}/docs/open-modules/. Gap analysis: {prev_outputs}",
                "checkpoint": False
            },
            {
                "phase": "6",
                "name": "Integrate & Classify",
                "agent": "dev-agent",
                "prompt_template": "Execute Integrate & Classify (Phase 6) for repo: {target}. Implement approved suggestions and establish Routing Triggers. Draft assets must conform strictly to the frontmatter schema. Context: {prev_outputs}",
                "checkpoint": True,
                "checkpoint_msg": "Draft assets and triggers have been prepared. Please review the diffs and file changes. Type 'continue' or 'yes' to proceed to validation."
            },
            {
                "phase": "7",
                "name": "Validate",
                "agent": "review-agent",
                "prompt_template": "Execute Validate (Phase 7) for repo: {target}. Verify agent's comprehension of the absorbed repo. Answer the 5 core validation questions and score them. Outputs validation-report.md at {project_root}/_iwish-output/absorbed-repos/{repo_name}/validation-report.md. Context: {prev_outputs}",
                "checkpoint": True,
                "checkpoint_msg": "Validation report complete! Please review the Q&A score at {project_root}/_iwish-output/absorbed-repos/{repo_name}/validation-report.md. Type 'continue' or 'yes' to finalize the workflow."
            }
        ]
    },
    "create-skill": {
        "phases": [
            {
                "phase": "triage",
                "name": "Triage",
                "agent": "capability-agent",
                "prompt_template": "Execute Triage (Step 1) for capability creation: {target}. Run quick rule scan and duplicate asset checks. Initialize capability-spec.md and metadata.yaml in {project_root}/_iwish-output/generated-skills/{target}/",
                "checkpoint": False
            },
            {
                "phase": "spec",
                "name": "Spec",
                "agent": "capability-agent",
                "prompt_template": "Execute Spec (Step 2) for capability creation: {target}. Refine capability-spec.md and ensure metadata is set to draft. Context: {prev_outputs}",
                "checkpoint": False
            },
            {
                "phase": "red-phase",
                "name": "RED Phase",
                "agent": "capability-agent",
                "prompt_template": "Execute RED Phase pressure test (Step 2b) for capability creation: {target}. Identify adversarial risks, excuses, and silent bypass loops. Context: {prev_outputs}",
                "checkpoint": False
            },
            {
                "phase": "forge",
                "name": "Forge",
                "agent": "capability-agent",
                "prompt_template": "Execute Forge (Step 3) for capability creation: {target}. Generate the physical capability files (SKILL.md, routing-profile.yaml, etc.) with standardized frontmatter (inputs, outputs, mcp_tools_required, subagent_triggers). Context: {prev_outputs}",
                "checkpoint": True,
                "checkpoint_msg": "Draft capability files have been forged under {project_root}/_iwish-output/generated-skills/{target}/. Please review them and type 'continue' or 'yes' to proceed to validation."
            },
            {
                "phase": "validate",
                "name": "Validate",
                "agent": "capability-agent",
                "prompt_template": "Execute Validate (Step 4) for capability creation: {target}. Run structural validation, convention compliance check, and integration smoke test. Context: {prev_outputs}",
                "checkpoint": False
            }
        ]
    },
    "tournament": {
        "phases": [
            {
                "phase": "setup",
                "name": "Arena Setup",
                "agent": "orch-agent",
                "prompt_template": "Execute Arena Setup (Phase 1) for A/B tournament on task: '{target}'. Set up git branches for candidates: '{candidates}'.",
                "checkpoint": False
            },
            {
                "phase": "dispatch",
                "name": "Agent Dispatch",
                "agent": "orch-agent",
                "prompt_template": "Execute Agent Dispatch (Phase 2) for A/B tournament on task: '{target}'. Dispatch subagents on their respective candidate branches.",
                "checkpoint": False
            },
            {
                "phase": "gate",
                "name": "Resolution Gate",
                "agent": "review-agent",
                "prompt_template": "Execute Resolution Gate (Phase 3) for A/B tournament on task: '{target}'. Run tests, evaluate performance, and generate a scorecard. Previous outputs: {prev_outputs}",
                "checkpoint": True,
                "checkpoint_msg": "Resolution Gate complete! Please review the Tournament Scorecard at {project_root}/_iwish-output/tournaments/{task_slug}-scorecard.md. Type 'continue' or 'yes' to approve and proceed to merge, or 'no' / 'abort' to cancel."
            },
            {
                "phase": "merge",
                "name": "Merge & Cleanup",
                "agent": "orch-agent",
                "prompt_template": "Execute Merge & Cleanup (Phase 5) for A/B tournament on task: '{target}'. Merge winning branch and delete temporary branches. Scorecard context: {prev_outputs}",
                "checkpoint": False
            }
        ]
    }
}

async def spawn_subagent(agent_name: str, prompt: str) -> str:
    print(f"[MAO Runner] Spawning sub-agent: {agent_name}")
    start_time = time.time()
    
    project_root = get_project_root()
    agent_file = os.path.join(project_root, ".agent", "agents", f"{agent_name}.md")
    
    system_instructions = "You are a helpful assistant."
    if os.path.exists(agent_file):
        with open(agent_file, "r") as f:
            system_instructions = f.read()

    config = LocalAgentConfig(
        system_instructions=system_instructions,
        capabilities=types.CapabilitiesConfig(
            enable_subagents=True
        )
    )

    async with Agent(config=config) as agent:
        response = await agent.chat(prompt)
        result = await response.text()
        
        duration = time.time() - start_time
        # Word-count-based token estimation (average 4 chars per token)
        estimated_tokens = (len(prompt) + len(result)) / 4
        
        # Parent trace is "orch-main" for sub-agents spawned during a workflow run
        parent = "orch-main" if agent_name != "orch-agent" else None
        record_agent_trace(agent_name, duration, estimated_tokens, parent)
        
        return result

def extract_json_from_response(text: str) -> dict:
    match = re.search(r"```json\s*([\s\S]*?)\s*```", text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except Exception:
            pass
    return {}

def route_via_iwish(request: str) -> dict:
    project_root = get_project_root()
    try:
        cmd = ["node", "dist/index.js", "route", request, "--json"]
        result = subprocess.run(cmd, cwd=project_root, capture_output=True, text=True, check=True)
        return json.loads(result.stdout)
    except Exception as e:
        print(f"[MAO Runner] Error calling I-Wish CLI: {e}", file=sys.stderr)
        return {}

async def main():
    if len(sys.argv) < 2:
        print("Usage: python3 antigravity-mao-runner.py '<request>'")
        sys.exit(1)
        
    request = sys.argv[1]
    normalized_request = request.strip().lower()
    
    # Check if we should initialize or advance a workflow
    active_wf = load_active_workflow()
    is_continuation = normalized_request in ["yes", "no", "continue", "next", "skip", "y", "n", "c", "tiếp tục", "tiep tuc"]
    
    # 1. Initialize new workflow if request starts with workflow commands
    if normalized_request.startswith("/absorb-repo") and not active_wf:
        parts = request.split()
        target = parts[1] if len(parts) > 1 else ""
        if not target:
            print("[MAO Runner] Error: Repository URL is required for /absorb-repo.", file=sys.stderr)
            sys.exit(1)
        active_wf = {
            "workflow": "absorb-repo",
            "target": target,
            "current_phase": "0",
            "status": "in-progress",
            "accumulated_outputs": {}
        }
        save_active_workflow(active_wf)
        print(f"[MAO Runner] Initialized workflow 'absorb-repo' for target '{target}'")
        
    elif normalized_request.startswith("/create-skill") and not active_wf:
        parts = request.split()
        target = parts[1] if len(parts) > 1 else "new-skill"
        active_wf = {
            "workflow": "create-skill",
            "target": target,
            "current_phase": "triage",
            "status": "in-progress",
            "accumulated_outputs": {}
        }
        save_active_workflow(active_wf)
        print(f"[MAO Runner] Initialized workflow 'create-skill' for target '{target}'")

    elif normalized_request.startswith("/tournament") and not active_wf:
        task_match = re.search(r'--task\s+["\']?([^"\'\n]+)["\']?', request)
        candidates_match = re.search(r'--candidates\s+["\']?([^"\'\n]+)["\']?', request)
        
        def normalize_candidate(c_name: str) -> str:
            val = c_name.lower().strip()
            val = re.sub(r'[\(\)\"\']', '', val)
            if "ui" in val and "ux" in val:
                return "ui-ux-pro-max"
            if "taste" in val:
                return "taste-skill"
            if "stitch" in val:
                return "stitch"
            if "super" in val or "power" in val:
                return "Superpower"
            if "vibe" in val or "vibecode" in val:
                return "vibecode-pro-max"
            if "native" in val or "tự nền tảng" in val or "tự" in val or "platform" in val or "mặc định" in val:
                return "native"
            return re.sub(r'[^a-zA-Z0-9-_]', '', val)

        if task_match and candidates_match:
            target = task_match.group(1).strip()
            candidates_raw = candidates_match.group(1).strip()
            candidates_list = [normalize_candidate(c) for c in candidates_raw.split(',') if c.strip()]
            candidates = ", ".join(candidates_list)
        else:
            # Match natural language format
            connectors = r'(?:với các module|với các plugin|với các workflow|với các|với|sử dụng các module|sử dụng các plugin|sử dụng|dùng các module|dùng các plugin|dùng|with candidates|with modules|with|using)'
            nl_match = re.search(
                r'^/tournament\s+(.+?)\s+' + connectors + r'\s+([^.\n]+)',
                request,
                re.IGNORECASE
            )
            if nl_match:
                target = nl_match.group(1).strip()
                candidates_raw = nl_match.group(2).strip()
                candidates_cleaned = re.sub(r'\b(và|and)\b', ',', candidates_raw, flags=re.IGNORECASE)
                candidates_list = [normalize_candidate(c) for c in candidates_cleaned.split(',') if c.strip()]
                candidates = ", ".join(candidates_list)
            else:
                target = request[len("/tournament"):].strip()
                if not target:
                    target = "A/B Tournament Task"
                candidates = "native"
                print(f"[MAO Runner] [Warning] Candidates not specified. Defaulting to 'native' for task '{target}'.")
        
        active_wf = {
            "workflow": "tournament",
            "target": target,
            "candidates": candidates,
            "current_phase": "setup",
            "status": "in-progress",
            "accumulated_outputs": {}
        }
        save_active_workflow(active_wf)
        print(f"[MAO Runner] Initialized workflow 'tournament' for task '{target}' with candidates '{candidates}'")

    # 2. Process active workflow if it exists
    if active_wf and active_wf.get("status") == "in-progress":
        wf_config = WORKFLOW_CONFIGS.get(active_wf["workflow"])
        if not wf_config:
            print(f"[MAO Runner] Invalid active workflow: {active_wf['workflow']}", file=sys.stderr)
            sys.exit(1)
            
        phases = wf_config["phases"]
        current_phase_id = active_wf["current_phase"]
        
        # Find current phase configuration
        phase_idx = next((i for i, p in enumerate(phases) if p["phase"] == current_phase_id), -1)
        if phase_idx == -1:
            print(f"[MAO Runner] Phase '{current_phase_id}' not found in configuration.", file=sys.stderr)
            sys.exit(1)
            
        current_phase_cfg = phases[phase_idx]
        
        # If we were waiting for approval and user approves, advance phase
        if active_wf.get("waiting_for_approval"):
            if is_continuation and normalized_request in ["yes", "continue", "y", "tiếp tục", "tiep tuc"]:
                print(f"[MAO Runner] Checkpoint approved. Advancing to next phase.")
                # Clear approval block and advance phase index
                active_wf["waiting_for_approval"] = False
                phase_idx += 1
                if phase_idx >= len(phases):
                    print("[MAO Runner] Workflow complete!")
                    active_wf["status"] = "complete"
                    save_active_workflow(active_wf)
                    clear_active_workflow()
                    sys.exit(0)
                current_phase_cfg = phases[phase_idx]
                active_wf["current_phase"] = current_phase_cfg["phase"]
                save_active_workflow(active_wf)
            else:
                print(f"[MAO Runner] Workflow is waiting for approval at phase '{current_phase_id}'. User entered: '{request}'")
                print("If you want to continue, please type 'continue' or 'yes'.")
                sys.exit(0)
        
        project_root = get_project_root()
        target = active_wf["target"]
        repo_name = target.split("/")[-1].replace(".git", "") if "/" in target else target
        task_slug = re.sub(r'[^a-z0-9]+', '-', target.lower()).strip('-')[:30]
        candidates = active_wf.get("candidates", "native")
        
        # Execution loop for non-checkpoint phases
        while True:
            phase_name = current_phase_cfg["name"]
            agent_name = current_phase_cfg["agent"]
            prompt_template = current_phase_cfg["prompt_template"]
            
            # Format outputs of previous phases to pass to this phase
            prev_outputs = json.dumps(active_wf["accumulated_outputs"], indent=2)
            
            prompt = prompt_template.format(
                target=target,
                project_root=project_root,
                repo_name=repo_name,
                prev_outputs=prev_outputs,
                task_slug=task_slug,
                candidates=candidates
            )
            
            print(f"\n--- [MAO Runner] Executing Phase: {phase_name} ({agent_name}) ---")
            agent_response = await spawn_subagent(agent_name, prompt)
            print(f"[MAO Runner] Response complete.")
            
            # Capture outputs: check step-output.json first, then parsed JSON from chat response
            structured_output = {}
            step_output_file = os.path.join(project_root, ".iwish", "runtime", "workflows", "step-output.json")
            if os.path.exists(step_output_file):
                try:
                    with open(step_output_file, "r") as f:
                        structured_output = json.load(f)
                    os.remove(step_output_file)
                except Exception:
                    pass
            
            if not structured_output:
                structured_output = extract_json_from_response(agent_response)
                
            # Add output to state
            active_wf["accumulated_outputs"][f"phase_{current_phase_cfg['phase']}"] = {
                "response_text_snippet": agent_response[:200] + "...",
                "structured": structured_output
            }
            
            # Save progress
            save_active_workflow(active_wf)
            
            # Handle Checkpoints
            if current_phase_cfg["checkpoint"]:
                checkpoint_msg = current_phase_cfg.get("checkpoint_msg", "Checkpoint reached. Type 'continue' or 'yes' to proceed.").format(
                    project_root=project_root,
                    repo_name=repo_name,
                    target=target
                )
                print(f"\n[MAO Runner CHECKPOINT] {checkpoint_msg}")
                active_wf["waiting_for_approval"] = True
                save_active_workflow(active_wf)
                break
                
            # Advance to next phase
            phase_idx += 1
            if phase_idx >= len(phases):
                print("\n[MAO Runner] All phases completed successfully!")
                active_wf["status"] = "complete"
                save_active_workflow(active_wf)
                clear_active_workflow()
                break
                
            current_phase_cfg = phases[phase_idx]
            active_wf["current_phase"] = current_phase_cfg["phase"]
            save_active_workflow(active_wf)
            
    else:
        # Fallback to standard command routing if not inside a managed workflow
        decision = route_via_iwish(request)
        if not decision:
            print("[MAO Runner] Routing failed.", file=sys.stderr)
            sys.exit(1)
            
        target_agent = decision.get("targetAgent", "orch-agent")
        print(f"[MAO Runner Fallback] Routed request: {decision.get('canonicalCommand')} using {target_agent}")
        await spawn_subagent(target_agent, request)

if __name__ == "__main__":
    asyncio.run(main())
