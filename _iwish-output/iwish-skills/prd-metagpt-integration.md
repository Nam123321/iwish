# Product Requirements Document (PRD): MetaGPT Selective Extraction Integration

## 1. Goal Description
The objective is to selectively extract and integrate high-value operational and execution mechanisms from MetaGPT into the I-Wish meta-agent framework as System Skills and Fragments. This includes (1) the `BY_ORDER` sequential turn execution model, (2) the recursive `ActionNode` XML parsing system with security fixes, and (3) a Fast-Track Self-Healing compilation/test retry loop. This will enable stable, debate-free agent sequencing and robust self-correction without compromising project security.

---

## 2. Functional Requirements (FR)

### FR1: Sequential SOP Turn Execution (`sop-sequential-execution`)
- Implement a fragment/guide detailing the sequential turn execution rules.
- Enable agents to run in `BY_ORDER` react mode where turns flow sequentially without dynamic routing or debates.

### FR2: Secure XML ActionNode Parser (`safe-xml-parser`)
- Implement a system skill `safe-xml-parser` to parse recursive XML output blocks from LLM responses.
- **CRITICAL SECURITY REQUIREMENT:** Absolutely forbid raw `eval()` for list/dict deserialization. Replace with `ast.literal_eval()` or native Pydantic validators.

### FR3: Fast-Track Self-Healing Retry Loop (`fast-track-self-healing`)
- Implement a system skill `fast-track-self-healing` to capture terminal compiler and test runner stderr traces.
- Auto-inject compilation errors back into the code agent's prompt to trigger a self-correction turn.
- Cap retry loops at exactly **3 attempts** before escalating to the user.

---

## 3. Non-Functional Requirements (NFR)

### NFR1: Security & Workspace Isolation
- All extracted skills must execute within the local sandbox/workspace environment.
- No global package dependencies or global npm modifications are permitted.

### NFR2: Performance & Token Budget Protection
- The self-healing loop must have a hard stop at 3 retries to prevent unbounded LLM token consumption in case of persistent errors.
