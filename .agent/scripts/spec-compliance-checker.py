#!/usr/bin/env python3
"""
Spec Compliance Checker — Automated spec-code drift detection.

Usage:
    python3 .agent/scripts/spec-compliance-checker.py <story_file> [--ui-spec <path>] [--data-spec <path>]

This script performs lightweight structural checks by parsing spec markdown
files and comparing key entities against the codebase. It produces a
Spec Compliance Score (SCS) and a list of drift items.

NOTE: This script performs heuristic-based checks. It does NOT replace
the full Spec Compliance Guardian skill which requires LLM-level semantic
understanding. Use this for fast pre-flight gating.
"""

import argparse
import json
import os
import re
import sys
import glob
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class Status(Enum):
    PASS = "✅ PASS"
    PARTIAL = "🟡 PARTIAL"
    MISSING = "🔴 MISSING"
    DRIFT = "🟠 DRIFT"
    SKIP = "⏭️ SKIP"


@dataclass
class CheckResult:
    check_id: str
    dimension: str
    spec_definition: str
    code_implementation: str
    status: Status


@dataclass
class ComplianceReport:
    story_id: str
    ui_checks: list = field(default_factory=list)
    data_checks: list = field(default_factory=list)
    ac_checks: list = field(default_factory=list)
    task_checks: list = field(default_factory=list)
    ast_checks: list = field(default_factory=list)

    @property
    def scs_ast(self) -> float:
        if not self.ast_checks:
            return -1  # N/A
        passed = sum(1 for c in self.ast_checks if c.status == Status.PASS)
        partial = sum(1 for c in self.ast_checks if c.status == Status.PARTIAL)
        total = len([c for c in self.ast_checks if c.status != Status.SKIP])
        return ((passed + 0.5 * partial) / total * 100) if total > 0 else 0

    @property
    def scs_ui(self) -> float:
        if not self.ui_checks:
            return -1  # N/A
        passed = sum(1 for c in self.ui_checks if c.status == Status.PASS)
        partial = sum(1 for c in self.ui_checks if c.status == Status.PARTIAL)
        total = len([c for c in self.ui_checks if c.status != Status.SKIP])
        return ((passed + 0.5 * partial) / total * 100) if total > 0 else 0

    @property
    def scs_data(self) -> float:
        if not self.data_checks:
            return -1  # N/A
        passed = sum(1 for c in self.data_checks if c.status == Status.PASS)
        partial = sum(1 for c in self.data_checks if c.status == Status.PARTIAL)
        total = len([c for c in self.data_checks if c.status != Status.SKIP])
        return ((passed + 0.5 * partial) / total * 100) if total > 0 else 0

    @property
    def scs_ac(self) -> float:
        if not self.ac_checks:
            return 100  # No ACs = default pass
        passed = sum(1 for c in self.ac_checks if c.status == Status.PASS)
        partial = sum(1 for c in self.ac_checks if c.status == Status.PARTIAL)
        total = len([c for c in self.ac_checks if c.status != Status.SKIP])
        return ((passed + 0.5 * partial) / total * 100) if total > 0 else 0

    @property
    def scs_overall(self) -> float:
        scores = []
        weights = []
        if self.scs_ui >= 0:
            scores.append(self.scs_ui)
            weights.append(0.15)
        if self.scs_ast >= 0:
            scores.append(self.scs_ast)
            weights.append(0.25)
        if self.scs_data >= 0:
            scores.append(self.scs_data)
            weights.append(0.30)
        scores.append(self.scs_ac)
        weights.append(0.30)
        # Normalize weights
        total_weight = sum(weights)
        return sum(s * w / total_weight for s, w in zip(scores, weights))

    @property
    def disposition(self) -> str:
        scs = self.scs_overall
        if scs >= 90:
            return "🟢 COMPLIANT"
        elif scs >= 75:
            return "🟡 MINOR_DRIFT"
        elif scs >= 50:
            return "🟠 SIGNIFICANT_DRIFT"
        else:
            return "🔴 CRITICAL_DRIFT"


def parse_frontmatter(content: str) -> dict:
    """Extract YAML frontmatter from markdown."""
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not match:
        return {}
    fm = {}
    for line in match.group(1).split('\n'):
        if ':' in line:
            key, _, val = line.partition(':')
            fm[key.strip()] = val.strip().strip("'\"")
    return fm


def extract_acceptance_criteria(story_content: str) -> list:
    """Extract AC items from a story file."""
    acs = []
    in_ac_section = False
    ac_pattern = re.compile(r'^\s*[-*]\s*\[?\s*(?:EDGE-CASE)?\s*\]?\s*(?:AC[-\s]?\d+[.:])?\s*(.*)', re.IGNORECASE)

    for line in story_content.split('\n'):
        if re.match(r'^#+\s*(?:Acceptance\s+Criteria|Tiêu\s+chí)', line, re.IGNORECASE):
            in_ac_section = True
            continue
        if in_ac_section and re.match(r'^#+\s', line):
            in_ac_section = False
            continue
        if in_ac_section:
            m = ac_pattern.match(line)
            if m and m.group(1).strip():
                acs.append(m.group(1).strip())
    return acs


def extract_tasks(story_content: str) -> list:
    """Extract task items from a story file."""
    tasks = []
    in_task_section = False
    task_pattern = re.compile(r'^\s*[-*]\s*\[[ xX/]\]\s*(.*)')

    for line in story_content.split('\n'):
        if re.match(r'^#+\s*(?:Tasks?|Implementation\s+Tasks?|Nhiệm\s+vụ)', line, re.IGNORECASE):
            in_task_section = True
            continue
        if in_task_section and re.match(r'^#+\s', line):
            in_task_section = False
            continue
        if in_task_section:
            m = task_pattern.match(line)
            if m and m.group(1).strip():
                tasks.append(m.group(1).strip())
    return tasks


def extract_components_from_ui_spec(ui_spec_content: str) -> list:
    """Extract component names from UI spec."""
    components = []
    # Match patterns like: `<ComponentName>`, `ComponentName component`, `### ComponentName`
    patterns = [
        re.compile(r'<(\w+(?:Page|Component|Panel|Modal|Dialog|Form|Card|List|Table|Button|Input|Header|Footer|Sidebar|Nav|Menu|Bar|Section|Container|Wrapper|View|Layout))\s*/?\s*>', re.IGNORECASE),
        re.compile(r'`(\w+(?:Page|Component|Panel|Modal|Dialog|Form|Card|List|Table|Button|Input|Header|Footer|Sidebar|Nav|Menu|Bar|Section|Container|Wrapper|View|Layout))`', re.IGNORECASE),
        re.compile(r'###+\s+(\w+(?:Page|Component|Panel|Modal|Dialog|Form|Card|List|Table))', re.IGNORECASE),
    ]
    for pattern in patterns:
        for match in pattern.finditer(ui_spec_content):
            name = match.group(1)
            if name not in components:
                components.append(name)
    return components


def extract_entities_from_data_spec(data_spec_content: str) -> list:
    """Extract entity/model definitions from data spec."""
    entities = []
    # Match patterns like: `model ModelName`, `### ModelName`, `Entity: ModelName`
    patterns = [
        re.compile(r'model\s+(\w+)\s*\{', re.IGNORECASE),
        re.compile(r'(?:Entity|Model|Table)\s*:\s*`?(\w+)`?', re.IGNORECASE),
        re.compile(r'###+\s+(?:Entity|Model|Table)\s*:\s*(\w+)', re.IGNORECASE),
    ]
    for pattern in patterns:
        for match in pattern.finditer(data_spec_content):
            name = match.group(1)
            if name not in entities:
                entities.append(name)
    return entities


def extract_dto_fields(data_spec_content: str) -> dict:
    """Extract DTO field definitions from data spec."""
    dtos = {}
    # Simple extraction of field lists within code blocks
    current_dto = None
    in_code_block = False
    for line in data_spec_content.split('\n'):
        if '```' in line:
            in_code_block = not in_code_block
            continue
        if in_code_block:
            # Match field definitions like: name: string, price: Decimal
            field_match = re.match(r'\s+(\w+)\s*[?!]?\s*:\s*(\w+)', line)
            if field_match and current_dto:
                if current_dto not in dtos:
                    dtos[current_dto] = []
                dtos[current_dto].append(field_match.group(1))
        # Match DTO/interface names
        dto_match = re.match(r'(?:interface|type|class|model)\s+(\w+(?:Dto|DTO|Request|Response|Input|Output))', line)
        if dto_match:
            current_dto = dto_match.group(1)
    return dtos


def find_prisma_schema(project_root: str) -> Optional[str]:
    """Find the Prisma schema file."""
    candidates = [
        os.path.join(project_root, 'prisma', 'schema.prisma'),
        os.path.join(project_root, 'distro', 'prisma', 'schema.prisma'),
        os.path.join(project_root, 'packages', 'database', 'prisma', 'schema.prisma'),
    ]
    for pattern in ['**/schema.prisma']:
        matches = glob.glob(os.path.join(project_root, pattern), recursive=True)
        candidates.extend(matches)
    for path in candidates:
        if os.path.exists(path):
            return path
    return None


def check_component_exists(component_name: str, project_root: str) -> tuple:
    """Check if a component file exists in the project."""
    import subprocess
    try:
        result = subprocess.run(
            ['grep', '-rl', f'function {component_name}\\|const {component_name}\\|export.*{component_name}',
             '--include=*.tsx', '--include=*.jsx', '--include=*.ts',
             '--exclude-dir=node_modules', '--exclude-dir=.git',
             project_root],
            capture_output=True, text=True, timeout=10
        )
        if result.stdout.strip():
            files = result.stdout.strip().split('\n')
            return True, files[0]
    except (subprocess.TimeoutExpired, Exception):
        pass
    return False, None


def check_ast_node_exists(identifier: str, search_path: str) -> tuple:
    """
    Check if a data-testid or required field identifier exists in the codebase using Tag-Aware Regex.
    It verifies that the identifier is inside an HTML/JSX tag, ignoring comments or random text.
    """
    import subprocess
    import re
    try:
        if os.path.isdir(search_path):
            result = subprocess.run(
                ['grep', '-rl', identifier, '--include=*.tsx', '--include=*.jsx', '--exclude-dir=node_modules', '--exclude-dir=.git', search_path],
                capture_output=True, text=True, timeout=10
            )
            files = result.stdout.strip().split('\n')
        elif os.path.isfile(search_path):
            files = [search_path]
        else:
            # Fallback to search in project root if file path is not found yet
            # e.g. when component file is not created
            return False, None

        files = [f for f in files if f.strip()]
        
        # Tag-aware regex: matches <Tag ... data-testid="identifier" ...>
        # or <Tag ... data-testid='identifier' ...>
        # Looks for < followed by word, any chars except >, then identifier in quotes
        tag_pattern = re.compile(rf'<[a-zA-Z0-9_-]+[^>]*?[\'"]{re.escape(identifier)}[\'"][^>]*?>')
        
        for file_path in files:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if tag_pattern.search(content):
                    return True, file_path
                    
    except (subprocess.TimeoutExpired, Exception) as e:
        print(f"Error checking node {identifier}: {e}", file=sys.stderr)
        
    return False, None


def check_prisma_model(model_name: str, schema_path: str) -> bool:
    """Check if a Prisma model exists in the schema."""
    if not schema_path or not os.path.exists(schema_path):
        return False
    with open(schema_path) as f:
        content = f.read()
    return bool(re.search(rf'model\s+{model_name}\s*\{{', content))


def run_compliance_check(args) -> ComplianceReport:
    """Main compliance check logic."""
    basename = os.path.basename(args.story).replace('.md', '')
    if basename == 'story':
        # If it's hierarchical format: Story-36.3/story.md
        parent_dir = os.path.basename(os.path.dirname(args.story))
        story_id = parent_dir.lower().replace('story-', '')
    else:
        # If flat format: story-36.3.md
        story_id = basename.replace('story-', '')
        
    report = ComplianceReport(story_id=story_id)
    
    # Find project root by walking up until we find package.json
    curr_dir = os.path.abspath(args.story)
    project_root = None
    while curr_dir != '/' and curr_dir != '':
        if os.path.exists(os.path.join(curr_dir, 'package.json')) or os.path.exists(os.path.join(curr_dir, '.git')):
            project_root = curr_dir
            break
        curr_dir = os.path.dirname(curr_dir)
        
    if not project_root:
        # Fallback
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(args.story))))

    # Read story file
    with open(args.story) as f:
        story_content = f.read()

    # Extract ACs and Tasks
    acs = extract_acceptance_criteria(story_content)
    tasks = extract_tasks(story_content)

    # AC checks (always applicable)
    for i, ac in enumerate(acs):
        report.ac_checks.append(CheckResult(
            check_id=f"AC-{i+1}",
            dimension="Acceptance Criteria",
            spec_definition=ac[:100],
            code_implementation="Requires LLM semantic check",
            status=Status.SKIP  # Script can't semantically verify ACs
        ))

    # Task checks
    for i, task in enumerate(tasks):
        report.task_checks.append(CheckResult(
            check_id=f"TASK-{i+1}",
            dimension="Implementation Task",
            spec_definition=task[:100],
            code_implementation="Requires LLM semantic check",
            status=Status.SKIP
        ))

    # UI Spec checks
    if args.ui_spec and os.path.exists(args.ui_spec):
        with open(args.ui_spec) as f:
            ui_content = f.read()
        components = extract_components_from_ui_spec(ui_content)
        for comp in components:
            exists, filepath = check_component_exists(comp, project_root)
            report.ui_checks.append(CheckResult(
                check_id=f"UI-COMP-{comp}",
                dimension="Component Hierarchy",
                spec_definition=f"Component: {comp}",
                code_implementation=filepath if exists else "NOT FOUND",
                status=Status.PASS if exists else Status.MISSING
            ))

    # Data Spec checks
    if args.data_spec and os.path.exists(args.data_spec):
        with open(args.data_spec) as f:
            data_content = f.read()
        entities = extract_entities_from_data_spec(data_content)
        schema_path = find_prisma_schema(project_root)

        for entity in entities:
            exists = check_prisma_model(entity, schema_path) if schema_path else False
            report.data_checks.append(CheckResult(
                check_id=f"DATA-MODEL-{entity}",
                dimension="Entity Fields",
                spec_definition=f"Model: {entity}",
                code_implementation=f"Found in {schema_path}" if exists else "NOT FOUND in schema",
                status=Status.PASS if exists else Status.MISSING
            ))

    # AST JSON checks
    story_dir = os.path.dirname(args.story)
    ast_json_path = os.path.join(story_dir, f"ast-constraint-{report.story_id}.json")
    if os.path.exists(ast_json_path):
        try:
            with open(ast_json_path) as f:
                ast_data = json.load(f)
            
            def extract_and_verify(node, parent_file=None):
                if isinstance(node, dict):
                    current_file = node.get("file", parent_file)
                    
                    search_path = project_root
                    if current_file:
                        candidate_path = os.path.join(project_root, current_file)
                        if os.path.exists(candidate_path):
                            search_path = candidate_path
                        else:
                            # Try to find the file if it's a relative path like components/X.tsx
                            import glob
                            matches = glob.glob(os.path.join(project_root, f"**/{current_file}"), recursive=True)
                            if matches:
                                search_path = matches[0]

                    if "data-testid" in node:
                        ident = node["data-testid"]
                        exists, filepath = check_ast_node_exists(ident, search_path)
                        report.ast_checks.append(CheckResult(
                            check_id=f"AST-NODE-{ident}",
                            dimension="AST JSON Constraint",
                            spec_definition=f"Required identifier: {ident}",
                            code_implementation=filepath if exists else "NOT FOUND",
                            status=Status.PASS if exists else Status.MISSING
                        ))
                        
                    if "required_fields" in node and isinstance(node["required_fields"], list):
                        for ident in node["required_fields"]:
                            exists, filepath = check_ast_node_exists(ident, search_path)
                            report.ast_checks.append(CheckResult(
                                check_id=f"AST-NODE-{ident}",
                                dimension="AST JSON Constraint",
                                spec_definition=f"Required identifier: {ident}",
                                code_implementation=filepath if exists else "NOT FOUND",
                                status=Status.PASS if exists else Status.MISSING
                            ))
                            
                    if "children" in node:
                        extract_and_verify(node["children"], current_file)
                        
                    for k, v in node.items():
                        if k not in ["file", "data-testid", "required_fields", "children"]:
                            extract_and_verify(v, current_file)
                            
                elif isinstance(node, list):
                    for item in node:
                        extract_and_verify(item, parent_file)
            
            extract_and_verify(ast_data)
        except Exception as e:
            print(f"Failed to parse AST JSON: {e}", file=sys.stderr)

    return report


def print_report(report: ComplianceReport):
    """Print formatted compliance report."""
    print(f"""
🛡️ [SPEC-COMPLIANCE-GUARDIAN] COMPLIANCE REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Story: {report.story_id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━""")

    if report.scs_ui >= 0:
        total_ui = len([c for c in report.ui_checks if c.status != Status.SKIP])
        passed_ui = sum(1 for c in report.ui_checks if c.status == Status.PASS)
        print(f"UI Spec Compliance:   {report.scs_ui:.0f}% ({passed_ui}/{total_ui} checks)")

    if report.scs_ast >= 0:
        total_ast = len([c for c in report.ast_checks if c.status != Status.SKIP])
        passed_ast = sum(1 for c in report.ast_checks if c.status == Status.PASS)
        print(f"AST Spec Compliance:  {report.scs_ast:.0f}% ({passed_ast}/{total_ast} checks)")

    if report.scs_data >= 0:
        total_data = len([c for c in report.data_checks if c.status != Status.SKIP])
        passed_data = sum(1 for c in report.data_checks if c.status == Status.PASS)
        print(f"Data Spec Compliance: {report.scs_data:.0f}% ({passed_data}/{total_data} checks)")

    total_ac = len(report.ac_checks)
    total_task = len(report.task_checks)
    print(f"ACs Found:            {total_ac} (semantic check required)")
    print(f"Tasks Found:          {total_task} (semantic check required)")

    print(f"""━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DISPOSITION:          {report.disposition}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━""")

    # Collect all drift items
    all_checks = report.ui_checks + report.ast_checks + report.data_checks + report.ac_checks + report.task_checks
    drift_items = [c for c in all_checks if c.status in (Status.MISSING, Status.PARTIAL, Status.DRIFT)]
    if drift_items:
        print("\n[DRIFT ITEMS]")
        for i, item in enumerate(drift_items, 1):
            print(f"  {i}. {item.status.value} {item.check_id}: {item.spec_definition} → {item.code_implementation}")

    # Output machine-readable JSON
    result = {
        "story_id": report.story_id,
        "scs_ui": report.scs_ui if report.scs_ui >= 0 else None,
        "scs_ast": report.scs_ast if report.scs_ast >= 0 else None,
        "scs_data": report.scs_data if report.scs_data >= 0 else None,
        "scs_ac": report.scs_ac,
        "scs_overall": report.scs_overall,
        "disposition": report.disposition,
        "ac_count": total_ac,
        "task_count": total_task,
        "drift_count": len(drift_items),
    }
    print(f"\n[JSON] {json.dumps(result)}")

    # Exit code: 0 if compliant, 1 if drift
    return 0 if report.scs_overall >= 75 else 1


def main():
    parser = argparse.ArgumentParser(description='Spec Compliance Checker')
    parser.add_argument('story', help='Path to story markdown file')
    parser.add_argument('--ui-spec', help='Path to UI spec file', default=None)
    parser.add_argument('--data-spec', help='Path to Data spec file', default=None)
    parser.add_argument('--json', action='store_true', help='Output JSON only')

    args = parser.parse_args()

    if not os.path.exists(args.story):
        print(f"Error: Story file not found: {args.story}", file=sys.stderr)
        sys.exit(2)

    # Auto-detect spec files if not provided
    story_dir = os.path.dirname(os.path.abspath(args.story))
    story_basename = os.path.basename(args.story)

    if not args.ui_spec:
        # Try to find UI spec
        candidates = [
            os.path.join(story_dir, 'ui-spec.md'),
            os.path.join(story_dir, story_basename.replace('story-', 'ui-spec-story-').replace('story.md', 'ui-spec.md')),
        ]
        for c in candidates:
            if os.path.exists(c):
                args.ui_spec = c
                break

    if not args.data_spec:
        candidates = [
            os.path.join(story_dir, 'data-spec.md'),
            os.path.join(story_dir, story_basename.replace('story-', 'data-spec-story-').replace('story.md', 'data-spec.md')),
        ]
        for c in candidates:
            if os.path.exists(c):
                args.data_spec = c
                break

    report = run_compliance_check(args)
    exit_code = print_report(report)
    sys.exit(exit_code)


if __name__ == '__main__':
    main()
