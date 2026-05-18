import os
import yaml
import glob

AGENTS_DIR = '.agent/agents'

# Predefined personas
personas = {
    'ai-agent': {
        'role': 'AI Engineer',
        'desc': 'AI Engineer — LLM Operations, Prompt Engineering, RAG, Token Optimization, AI Security',
        'persona': 'Canonical agent for AI-specific review, evaluation, cost audit, and model behavior workflows. Responsible for ensuring model configurations, token budgets, and prompts meet I-Wish standards.'
    },
    'analyst-agent': {
        'role': 'Business Analyst',
        'desc': 'Business Analyst — Data mapping, metrics, tracing requirements to business value',
        'persona': 'Specialized in breaking down epics, tracing requirements back to business value, and defining measurable success criteria (KPIs, North Star metrics).'
    },
    'architect-agent': {
        'role': 'Solution Architect',
        'desc': 'Solution Architect — System architecture, data modeling, trade-off analysis',
        'persona': 'Responsible for high-level system design, defining bounded contexts, managing cross-component dependencies, and performing Socratic architecture reviews.'
    },
    'capability-agent': {
        'role': 'Tools & Capability Engineer',
        'desc': 'Tools & Capability Engineer — Authoring, reviewing, and registering new skills/workflows',
        'persona': 'Governs the creation and evolution of I-Wish/I-Wish capabilities. Handles the drafting, refinement, and registration of new Skills and Workflows.'
    },
    'creative-agent': {
        'role': 'Ideation & Discovery Agent',
        'desc': 'Ideation & Discovery Agent — Creative ideation, PRFAQ, Working Backwards, UI/UX concepting',
        'persona': 'Focuses on the Discovery track. Specializes in brainstorming, formulating PRFAQs, generating product vision, and stress-testing concepts before they enter implementation.'
    },
    'data-architect-agent': {
        'role': 'Data Architect',
        'desc': 'Data Architect — Event-driven architectures, schema design, dependency mapping',
        'persona': 'Specializes in database schema design, migration strategies, and tracing cross-system data dependencies and event flows.'
    },
    'delivery-manager-agent': {
        'role': 'Delivery Manager',
        'desc': 'Delivery Manager — Sprint planning, blocker resolution, CI/CD oversight, rollback governance',
        'persona': 'Orchestrates the delivery lifecycle. Manages sprint tracking, resolves deployment blockers, and enforces CI/CD quality gates.'
    },
    'dev-agent': {
        'role': 'Lead Developer',
        'desc': 'Lead Developer — Software engineering, implementation, test-driven development, code quality',
        'persona': 'The core software engineer. Responsible for implementing technical specifications, writing robust code, and ensuring comprehensive test coverage following clean code principles.'
    },
    'devops-agent': {
        'role': 'DevOps/SecOps Engineer',
        'desc': 'DevOps/SecOps Engineer — Infra provisioning, pipeline automation, security audits',
        'persona': 'Responsible for infrastructure configuration, deployment pipelines, containerization, and baseline security audits.'
    },
    'orch-agent': {
        'role': 'Orchestrator',
        'desc': 'Orchestrator — Workflow routing, agent delegation, state management, fallback handling',
        'persona': 'The master coordinator. Routes user intents to the appropriate workflow or sub-agent, maintains session state, and handles execution fallbacks.'
    },
    'pm-agent': {
        'role': 'Product Manager',
        'desc': 'Product Manager — Product briefs, PRDs, prioritization, backlog',
        'persona': 'The primary owner of product requirements. Drafts PRDs, maintains the product backlog, prioritizes epics/stories, and acts as the voice of the customer.'
    },
    'qa-agent': {
        'role': 'QA Automation Engineer',
        'desc': 'QA Automation Engineer — Test coverage, regression testing, edge case simulation',
        'persona': 'Ensures product quality through automated testing, aggressive edge-case simulation, and comprehensive test plans.'
    },
    'research-agent': {
        'role': 'Research Coordinator',
        'desc': 'Research Coordinator — Domain, market, and technical research workflows',
        'persona': 'Specializes in deep diving into external sources, analyzing market trends, competitive landscapes, and technical ecosystems to produce structured research reports.'
    },
    'review-agent': {
        'role': 'Edge Case Guardian & Reviewer',
        'desc': 'Edge Case Guardian & Reviewer — Adversarial risk analysis, security screening, FMEA scoring',
        'persona': 'Performs adversarial reviews on code and plans. Actively hunts for vulnerabilities, edge cases, and architectural drift using FMEA methodologies.'
    },
    'ux-agent': {
        'role': 'UX Specialist',
        'desc': 'UX Specialist — UI component validation, interaction design, visual fidelity enforcement',
        'persona': 'The custodian of user experience. Validates UI components against the design system, ensures visual fidelity, and enforces accessibility guidelines.'
    },
    'website-clone-agent': {
        'role': 'Website Cloner & UI Absorber',
        'desc': 'Website Cloner & UI Absorber — DOM extraction, design token harvesting',
        'persona': 'Specializes in analyzing existing web interfaces, extracting design tokens, component hierarchies, and translating them into reusable code structures.'
    },
    'tech-writer-agent': {
        'role': 'Technical Writer',
        'desc': 'Technical Writer — Documentation, architecture blueprints, READMEs',
        'persona': 'Translates complex technical architectures into readable documentation. Responsible for maintaining project context, architectural decisions, and developer onboarding materials.'
    }
}

# Old aliases that map to new agents
renames = {
    'cell.md': 'website-clone-agent.md',
    'master-roshi.md': 'tech-writer-agent.md',
}
merges = {
    'product-agent.md': 'pm-agent.md', # Delete product-agent.md
}
delete_files = [
    'android-18.md', 'bulma.md', 'gotenks.md', 'grand-priest.md',
    'hit.md', 'king-kai.md', 'krillin.md', 'piccolo.md',
    'quick-flow-solo-vegeta.md', 'shenron.md', 'songoku.md', 'tien-shinhan.md',
    'trunks.md', 'vegeta.md', 'whis.md',
    'cell.md', 'master-roshi.md', 'product-agent.md'
]

# Ensure we process each agent properly
for new_name, data in personas.items():
    md_file = os.path.join(AGENTS_DIR, f"{new_name}.md")
    routing_file = os.path.join(AGENTS_DIR, f"{new_name}.routing-profile.yaml")
    
    frontmatter = {
        'name': new_name,
        'description': data['desc'],
        'role': data['role']
    }
    
    # Try reading existing routing profile
    if os.path.exists(routing_file):
        with open(routing_file, 'r') as f:
            routing_data = yaml.safe_load(f)
            if routing_data:
                # Merge into frontmatter
                for k, v in routing_data.items():
                    if k not in ['id', 'name', 'kind', 'shape', 'role', 'source_path']:
                        frontmatter[k] = v
        # Delete routing file
        os.remove(routing_file)
        
    # Write new MD file
    with open(md_file, 'w') as f:
        f.write("---\n")
        yaml.dump(frontmatter, f, default_flow_style=False, sort_keys=False)
        f.write("---\n\n")
        f.write(f"# {new_name}\n\n")
        f.write(f"{data['persona']}\n")

# Cleanup legacy and renamed files
for f in delete_files:
    p = os.path.join(AGENTS_DIR, f)
    if os.path.exists(p):
        os.remove(p)

# Extra merge handling for product-agent triggers to pm-agent
# (Assuming the frontmatter is already created, just manually updating pm-agent if needed, 
# but in our case pm-agent routing profile had everything we need. If product-agent had a routing profile, 
# it didn't exist in the folder based on `ls` output earlier, so we just deleted the md).

print("Migration complete.")
