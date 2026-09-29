---
name: export-pdf
description: Export a local HTML file to PDF with WeasyPrint when the user asks to turn an HTML artifact, report, dashboard, or preview page into a printable PDF. Use for I-Wish-generated HTML such as Idea Navigator, operation reports, pilot review pages, or other local static HTML outputs.
---

# HTML to PDF with WeasyPrint

Use this skill when the user wants a local HTML artifact exported to PDF.

## Trigger examples
- "export this HTML to PDF"
- "turn the navigator report into a PDF"
- "make a printable PDF from the pilot HTML"
- "save the operation report as PDF"

## Workflow
1. Confirm the source HTML file exists and prefer a real local file path over pasted HTML.
2. Default the output PDF to the same directory and basename as the HTML file unless the user requests another location.
3. Check whether WeasyPrint is already available:

```bash
python3 .agent/skills/export-pdf/scripts/check_weasyprint.py
```

4. If WeasyPrint is missing, the agent must pause and ask the user whether they want it installed. If the user approves, the agent may install it and continue the export automatically.
5. Install command when approved:

```bash
python3 -m pip install weasyprint
```

6. After install succeeds, or if WeasyPrint was already present, run:

```bash
python3 .agent/skills/export-pdf/scripts/export_html_to_pdf.py "/absolute/input.html" "/absolute/output.pdf"
```

7. Report the produced PDF path back to the user.

## Notes
- WeasyPrint is best for printable, paginated documents and report-style HTML.
- The script passes the HTML file directory as `base_url`, so relative CSS, images, and fonts can resolve.
- If the environment does not have the `weasyprint` Python package installed, explicitly ask the user whether they want the agent to install it. Do not silently attempt installation first.
- If rendering looks wrong, inspect the HTML for browser-only behavior such as heavy JavaScript-driven UI. WeasyPrint works best with static HTML/CSS.
- `python3 -m pip install weasyprint` may still fail if the host machine lacks native dependencies required by WeasyPrint. If that happens, report the failure clearly and stop rather than guessing.

## I-Wish-specific guidance
- Prefer this skill for `_iwish-output/operation-report/*.html`, `Idea Navigator` derivatives, and pilot HTML review packets.
- If the source HTML is meant for screen-first browsing, consider generating a PDF-specific variant later with print CSS, but do not block the first export attempt on that refinement.
- For pilot outputs that ship with a helper shell script, update the flow to: check -> ask install if needed -> install on approval -> export PDF.
