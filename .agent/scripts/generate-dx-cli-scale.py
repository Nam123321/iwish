import os

import sys

def main():
    target_dir = ".agent/skills/agent-dx-cli-scale"
    target_file = os.path.join(target_dir, "SKILL.md")

    # AC6: Handle case where target directory or file exists (idempotent safe overwrites)
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)

    points = [
        "1. POSIX-compliant Flags: Uses standard single-dash short flags and double-dash long flags.",
        "2. Built-in Help: Provides comprehensive help text via `--help` flag.",
        "3. Versioning: Provides version information via `--version` flag.",
        "4. Configuration Precedence: Follows Flags > Env Vars > Config File hierarchy.",
        "5. stdout vs stderr: Separates data output (stdout) from logs/errors (stderr).",
        "6. Exit Codes: Returns 0 on success, >0 on failure.",
        "7. Rule of Silence: Emits zero output when successful unless explicitly requested.",
        "8. CI/CD Ready: Detects non-interactive environments and avoids prompting (or supports `--yes`).",
        "9. Structured Output: Supports JSON or parsable output via `--json` or `--output=json`.",
        "10. Color Support: Uses colors for humans but respects `NO_COLOR` and disables color when piped.",
        "11. Progress Indicators: Uses spinners/bars for long tasks, automatically disabled in CI.",
        "12. Idempotency: Running the same command multiple times yields the same final state safely.",
        "13. Actionable Errors: Error messages suggest how to fix the problem.",
        "14. Autocompletion: Provides scripts for bash/zsh/fish autocompletion.",
        "15. Fallbacks: Gracefully degrades when network or external dependencies are missing.",
        "16. Telemetry Opt-out: Telemetry must be transparent and respect `DO_NOT_TRACK` or similar opt-outs.",
        "17. Fast Startup: Commands start and execute in sub-second time for responsiveness.",
        "18. Context Awareness: Automatically detects context (like CWD or `.git`) to minimize required flags.",
        "19. Pluggability: Extensible architecture for adding custom subcommands if applicable.",
        "20. Backward Compatibility: Deprecates flags gracefully with warnings instead of breaking suddenly.",
        "21. Single Executable: Easy distribution without requiring complex local runtime setups."
    ]

    # AC5: Verify exactly 21 evaluation criteria points
    if len(points) != 21:
        print(f"Validation Error: Expected 21 points, got {len(points)}. Failing gracefully.")
        sys.exit(1)

    frontmatter = {
        "name": "agent-dx-cli-scale",
        "description": "Evaluation criteria for building high-quality, developer-friendly CLI tools.",
        "inputs": ["CLI tool source code", "CLI tool documentation"],
        "outputs": ["DX Scorecard", "Improvement suggestions"],
        "tags": ["dx", "cli", "evaluation", "scale"]
    }

    # AC4: Validate OKF YAML frontmatter
    if "name" not in frontmatter or "description" not in frontmatter:
        print("Validation Error: Invalid OKF YAML frontmatter. Missing name or description.")
        sys.exit(1)

    content = f"""---
{"name: agent-dx-cli-scale\ndescription: \"Evaluation criteria for building high-quality, developer-friendly CLI tools.\"\ninputs:\n  - \"CLI tool source code\"\n  - \"CLI tool documentation\"\noutputs:\n  - \"DX Scorecard\"\n  - \"Improvement suggestions\"\ntags: [\"dx\", \"cli\", \"evaluation\", \"scale\"]\n"}---

# Agent DX CLI Scale

This skill provides a 21-point evaluation criteria to assess the Developer Experience (DX) of Command Line Interface (CLI) tools.

## 21-Point Evaluation Criteria

"""
    for point in points:
        content += f"{point}\n"

    # Write to file (idempotent overwrite)
    with open(target_file, "w") as f:
        f.write(content)

    print(f"Successfully generated {target_file} with 21 evaluation points.")

if __name__ == "__main__":
    main()
