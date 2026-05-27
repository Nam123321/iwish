# Contributing to I-Wish

We treat I-Wish as a living ecosystem of AI agents. If you invent a brilliant new Workflow or Skill for a project and realize it's highly reusable, contribute it back! 

## How to add a new Workflow or Skill

1. **Core vs Pack**: Decide if your workflow is a universal necessity (Core - e.g. `templates/core/workflows`) or a specific capability for a niche (e.g. `templates/library/devops-pack`).
2. **Name it after a character (optional)**: If you're adding an Agent role, pick an unused Dragon Ball character that fits the vibe.
3. **Format**: Write your workflow or skill in Markdown `*.md` formatting. Ensure it relies on clear step-by-step instructions.
4. **Submit a PR**: Add your files to the respective `templates/` structure.

## Building the CLI
```bash
git clone https://github.com/Nam123321/iwish.git
cd iwish
npm install
npm run build
npm link
# test locally
iwish init
```
