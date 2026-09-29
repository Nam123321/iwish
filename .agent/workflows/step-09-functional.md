---
name: 'step-09-functional'
description: 'Synthesize all discovery into comprehensive functional requirements'

# File References
nextStepFile: './step-10-nonfunctional.md'
outputFile: '{planning_artifacts}/2. Product Planning/2.1. product-brief-or-prd.md'

# Task References
advancedElicitationTask: '{project-root}/_iwish/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_iwish/core/workflows/party-mode/workflow.md'
---

# Step 9: Functional Requirements Synthesis

**Progress: Step 9 of 11** - Next: Non-Functional Requirements

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER generate content without user input

- 📖 CRITICAL: ALWAYS read the complete step file before taking any action - partial understanding leads to incomplete decisions
- 🔄 CRITICAL: When loading next step with 'C', ensure the entire file is read and understood before proceeding
- ✅ ALWAYS treat this as collaborative discovery between pm-agent peers
- 📋 YOU ARE A FACILITATOR, not a content generator
- 💬 FOCUS on creating comprehensive capability inventory for the product
- 🎯 CRITICAL: This is THE CAPABILITY CONTRACT for all downstream work
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

## EXECUTION PROTOCOLS:

- 🎯 Show your analysis before taking any action
- ⚠️ Present A/P/C menu after generating functional requirements
- 💾 ONLY save when user chooses C (Continue)
- 📖 Update output file frontmatter, adding this step name to the end of the list of stepsCompleted
- 🚫 FORBIDDEN to load next step until C is selected


## CONTEXT BOUNDARIES:

- Current document and frontmatter from previous steps are available
- ALL previous content (executive summary, success criteria, journeys, domain, innovation, project-type) must be referenced
- No additional data files needed for this step
- Focus on capabilities, not implementation details

## CRITICAL IMPORTANCE:

**This section defines THE CAPABILITY CONTRACT for the entire product:**

- UX designers will ONLY design what's listed here
- Architects will ONLY support what's listed here
- Epic breakdown will ONLY implement what's listed here
- If a capability is missing from FRs, it will NOT exist in the final product

## FUNCTIONAL REQUIREMENTS SYNTHESIS SEQUENCE:

### 1. Understand FR Purpose and Usage

Start by explaining the critical role of functional requirements:

**Purpose:**
FRs define WHAT capabilities the product must have. They are the complete inventory of user-facing and system capabilities that deliver the product vision.

**Critical Properties:**
✅ Each FR is a testable capability
✅ Each FR is implementation-agnostic (could be built many ways)
✅ Each FR specifies WHO and WHAT, not HOW
✅ No UI details, no performance numbers, no technology choices
✅ Comprehensive coverage of capability areas

**How They Will Be Used:**

1. UX Designer reads FRs → designs interactions for each capability
2. architect-agent reads FRs → designs systems to support each capability
3. pm-agent reads FRs → creates epics and stories to implement each capability

### 2. Review Existing Content for Capability Extraction

Systematically review all previous sections to extract capabilities:

**Extract From:**

- Executive Summary → Core product differentiator capabilities
- Success Criteria → Success-enabling capabilities
- User Journeys → Journey-revealed capabilities
- Domain Requirements → Compliance and regulatory capabilities
- Innovation Patterns → Innovative feature capabilities
- Project-Type Requirements → Technical capability needs

### 3. Organize Requirements by Capability Area

Group FRs by logical capability areas (NOT by technology or layer):

**Good Grouping Examples:**

- ✅ "User Management" (not "Authentication System")
- ✅ "Content Discovery" (not "Search Algorithm")
- ✅ "Team Collaboration" (not "WebSocket Infrastructure")

**Target 5-8 Capability Areas** for typical projects.

### 3.5. Force Baseline & Platform Infrastructure Capabilities (CRITICAL PROTECTION - BASE LIBRARY INJECTION)

To prevent the common mistake of only generating "key highlight" features while omitting basic platform requirements, you MUST load and inject standardized baseline requirements from the **SaaS Base Feature Library**:

1. **Load Base Library**: Read the YAML file at `@{project-root}/.agent/workflows/saas-base-features.yaml`.
2. **Identify Category/SaaS Group**: Based on the project vision, classification, and step-02 vision details, identify the matching SaaS group:
   - `b2b_enterprise` (B2B / Enterprise SaaS - featuring multi-tenancy, workspaces, hierarchical RBAC, multi-portal subdomains, multi-level payment & payment management, detailed auth flows, and compliance docs)
   - `b2c_consumer` (B2C Consumer SaaS)
   - `developer_api` (Developer & API SaaS)
   - `ecommerce_marketplace` (E-commerce & Marketplace SaaS)
   - `ai_agent_native` (AI & Agentic SaaS)
3. **Auto-Inject Baseline Features**: Copy the standardized `features` list for the matched category directly into your functional requirements list under their respective areas (e.g. Identity & Access Management, Subdomain Topology, Hierarchical RBAC, Multi-level Payment & Payment Management, Legal & Compliance Documents).
4. **Custom/Core Features**: Supplement these baseline requirements with the unique/key business-specific features discussed during product discovery.
5. **No Placeholders**: Ensure all baseline requirements are written in full (not summarized) to maintain a complete capability contract.

### 3.6. Force Platform & Infrastructure Capabilities (CONDITIONAL — Platform Products Only)

If the product is classified as Platform or Enterprise Platform (per Step 4 above), you MUST
also evaluate and include these additional baseline capability areas:

#### F. AI/ML Infrastructure (Mandatory for AI-powered platforms)
- **Model Management**: Model routing, provider switching, cost tracking per model
- **Agent Orchestration**: Agent creation, configuration, execution, monitoring
- **Fine-tuning Pipeline**: Data preparation, training triggers, model deployment
- **Guardrails & Safety**: Input/output filtering, prompt injection prevention, content policy

#### G. Plugin & Extension System (Mandatory for extensible platforms)
- **Plugin Lifecycle**: Install, configure, enable/disable, uninstall plugins
- **Plugin Isolation**: Sandboxed execution environment for third-party code
- **Plugin Marketplace**: Discovery, review, publishing pipeline
- **Extension SDK**: APIs and developer documentation for plugin authors

#### H. Integration & Connectivity (Mandatory for integration platforms)
- **Protocol Adapters**: MCP, REST, GraphQL, WebSocket connector framework
- **Third-party Integrations**: Chat platforms (Slack, Lark), project tools, CRM
- **Webhook Management**: Inbound/outbound webhook configuration and monitoring
- **OAuth/API Key Management**: Secure credential storage for external services

#### I. DevOps & Infrastructure (Mandatory for self-hosted/hybrid platforms)
- **Environment Management**: Dev/staging/production environment configuration
- **Sandbox/Secure Execution**: Isolated code execution environment for AI agents
- **Deployment Pipelines**: CI/CD integration, canary deploys, rollback
- **Observability**: Logging, tracing, metrics dashboards for platform operators

#### J. Self-Learning & Optimization (For AI-native platforms)
- **Pattern Recognition**: Detect repeating tasks across tenants
- **Auto-Plugin Generation**: Suggest or auto-create plugins for common patterns
- **Cost Optimization**: Token usage tracking, SLM vs Cloud LLM routing
- **Knowledge Accumulation**: Cross-tenant anonymized learning from workflows

### 3.7. Cross-Journey FR Synthesis (MANDATORY for >3 Journeys)

If the product has more than 3 user journeys defined in previous steps:

1. **Build Journey × Capability Matrix**: Create a matrix mapping each journey to capability areas.
   Ask: "Which journeys share the same underlying capability?"
2. **Identify Shared Infrastructure FRs**: Extract capabilities that appear in 2+ journeys
   but are not yet captured as explicit FRs (e.g., shared notification system, shared file management).
3. **Identify Journey Intersection FRs**: Look for capabilities needed at the BOUNDARY between
   journeys (e.g., HR onboarding → IT provisioning, Sales → Finance invoicing).
4. **Validate No Orphan Journeys**: Ensure every journey has at least 3 supporting FRs.
   If a journey has <3 FRs, probe deeper with the user.

### 4. Generate Comprehensive FR List

Create complete functional requirements using this format:

**Format:**

- FR#: [Actor] can [capability] [context/constraint if needed]
- Number sequentially (FR1, FR2, FR3...)
- Aim for FRs appropriate to product complexity class:
  - **Simple App** (single-domain, 1-2 user types): 15-30 FRs
  - **Standard App** (multi-domain, 3-5 user types): 30-60 FRs
  - **Platform Product** (multi-tenant, infrastructure, extensible): 60-120 FRs
  - **Enterprise Platform** (multi-tenant, multi-integration, self-service): 80-150+ FRs
- If the product has >5 user journeys OR >3 integration domains, it is likely Platform-class.
- NEVER cap FRs artificially — completeness > brevity for capability contracts.

**Altitude Check:**
Each FR should answer "WHAT capability exists?" NOT "HOW it's implemented?"

**Examples:**

- ✅ "Users can customize appearance settings"
- ❌ "Users can toggle light/dark theme with 3 font size options stored in LocalStorage"

### 5. Self-Validation Process

Before presenting to user, validate the FR list:

**Completeness Check:**

1. "Did I cover EVERY capability mentioned in the MVP scope section?"
2. "Did I include domain-specific requirements as FRs?"
3. "Did I cover the project-type specific needs?"
4. "SaaS Readiness Check: Did I include capabilities for Onboarding, Trial billing, Credits lifecycle, and API management (Key rotation, Sandbox)?"
5. "Compliance & Security Check: Did I include immutable Audit Logging, AES-256 data encryption controls, and rate-limiting limits?"
6. "Ecosystem Integration Check: If target platforms include Shopify/Haravan, did I include OAuth install, GDPR mandatory webhooks, and App Proxy routing?"
7. "Could a UX designer read ONLY the FRs and know what to design?"
8. "Could an architect-agent read ONLY the FRs and know what to support?"
9. "Are there any user actions or system behaviors we discussed that have no FR?"
10. "CRITICAL: Did I include the fundamental baseline requirements (IAM, Tenant Management, Billing, Notifications, Metrics/Auditing) appropriate for this product type as detailed in Step 3.5?"

**Altitude Check:**

1. "Am I stating capabilities (WHAT) or implementation (HOW)?"
2. "Am I listing acceptance criteria or UI specifics?" (Remove if yes)
3. "Could this FR be implemented 5 different ways?" (Good - means it's not prescriptive)

**Quality Check:**

1. "Is each FR clear enough that someone could test whether it exists?"
2. "Is each FR independent (not dependent on reading other FRs to understand)?"
3. "Did I avoid vague terms like 'good', 'fast', 'easy'?" (Use NFRs for quality attributes)

### 5b. 🛡️ Edge Case Guardian — PRD Risk Scan (Light)

**AFTER validating FRs, load the Edge Case Guardian SKILL from `{project-root}/.agent/skills/review-agent/SKILL.md` and perform a LIGHT SCAN:**

This is a quick architectural-level risk flag, NOT a full 8-Pillar analysis:

1. **Pillars to scan:** P2 (State Transition), P3 (Concurrency), P5 (Integration), P8 (Business Rule Conflict) — ONLY these 4
2. **For each FR group,** ask: "Could these requirements create state machine gaps? Concurrency issues? Integration risks? Business rule conflicts?"
3. **Output:** Add a brief risk annotation after the FR list:

```markdown
### 🛡️ High-Level Risk Notes (Edge Case Guardian)
- [Risk 1]: FR group [X] may have [P2/P3/P5/P8] concerns — [brief description]
- [Risk 2]: ...
```

4. **Do NOT score individual edge cases at this stage** — that happens during Epic/Story creation. This is a "first alert" only.
5. **Present risk notes to user** as part of the FR review before the A/P/C menu.

### 5c. ❓ Unknowns Scanner — PRD Ambiguity Scan (Quick)

**BEFORE presenting the final FRs to the user, load the `unknowns-scanner` skill (`.agent/skills/unknowns-scanner/SKILL.md`) and run a quick scan to detect implicit assumptions:**

1. **Parameters**: `phase=prd`, `scope=macro`, `depth=quick`
2. **Focus**: Look for "Known-Unknowns" in the functional requirements (e.g., "User can export data" → What format? What size limit?).
3. **Action**: If ambiguity is found, append it to `unknowns-ledger.yaml` via the scanner and optionally add a `> [!WARNING] Ambiguity Detected: ...` block before the A/P/C menu.

### 6. Generate Functional Requirements Content

Prepare the content to append to the document:

#### Content Structure:

When saving to document, append these Level 2 and Level 3 sections:

```markdown
## Functional Requirements

### [Capability Area Name]

- FR1: [Specific Actor] can [specific capability]
- FR2: [Specific Actor] can [specific capability]
- FR3: [Specific Actor] can [specific capability]

### [Another Capability Area]

- FR4: [Specific Actor] can [specific capability]
- FR5: [Specific Actor] can [specific capability]

[Continue for all capability areas discovered in conversation]
```

### 7. Present MENU OPTIONS

Present the functional requirements for review, then display menu:
- Show synthesized functional requirements (using structure from step 6)
- Emphasize this is the capability contract for all downstream work
- Highlight that every feature must trace back to these requirements
- Ask if they'd like to refine further, get other perspectives, or proceed
- Present menu options naturally as part of conversation

**What would you like to do?**"

Display: "**Select:** [A] Advanced Elicitation [P] Party Mode [C] Continue to Non-Functional Requirements (Step 10 of 11)"

#### Menu Handling Logic:
- IF A: Read fully and follow: {advancedElicitationTask} with the current FR list, process the enhanced capability coverage that comes back, ask user if they accept the additions, if yes update content then redisplay menu, if no keep original content then redisplay menu
- IF P: Read fully and follow: {partyModeWorkflow} with the current FR list, process the collaborative capability validation and additions, ask user if they accept the changes, if yes update content then redisplay menu, if no keep original content then redisplay menu
- IF C: Append the final content to {outputFile}, update frontmatter by adding this step name to the end of the stepsCompleted array, then read fully and follow: {nextStepFile}
- IF Any other: help user respond, then redisplay menu

#### EXECUTION RULES:
- ALWAYS halt and wait for user input after presenting menu
- ONLY proceed to next step when user selects 'C'
- After other menu items execution, return to this menu

## APPEND TO DOCUMENT:

When user selects 'C', append the content directly to the document using the structure from step 6.

## SUCCESS METRICS:

✅ All previous discovery content synthesized into FRs
✅ FRs organized by capability areas (not technology)
✅ Each FR states WHAT capability exists, not HOW to implement
✅ Comprehensive coverage with 20-50 FRs typical
✅ Altitude validation ensures implementation-agnostic requirements
✅ Completeness check validates coverage of all discussed capabilities
✅ A/P/C menu presented and handled correctly
✅ Content properly appended to document when C selected

## FAILURE MODES:

❌ Missing fundamental baseline requirements (Authentication, Tenant management, Billing, Notifications, usage metrics) for SaaS/Commercial products.
❌ Missing capabilities from previous discovery sections
❌ Organizing FRs by technology instead of capability areas
❌ Including implementation details or UI specifics in FRs
❌ Not achieving comprehensive coverage of discussed capabilities
❌ Using vague terms instead of testable capabilities
❌ Not presenting A/P/C menu after content generation
❌ Appending content without user selecting 'C'

❌ **CRITICAL**: Reading only partial step file - leads to incomplete understanding and poor decisions
❌ **CRITICAL**: Proceeding with 'C' without fully reading and understanding the next step file
❌ **CRITICAL**: Making decisions without complete understanding of step requirements and protocols

## CAPABILITY CONTRACT REMINDER:

Emphasize to user: "This FR list is now binding. Any feature not listed here will not exist in the final product unless we explicitly add it. This is why it's critical to ensure completeness now."

## NEXT STEP:

After user selects 'C' and content is saved to document, load {nextStepFile} to define non-functional requirements.

Remember: Do NOT proceed to step-10 until user explicitly selects 'C' from the A/P/C menu and content is saved!
