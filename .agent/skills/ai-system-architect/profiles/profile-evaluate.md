# Profile: Evaluate Mode (`--mode=evaluate`)

1. **Intake:** Nhận story_dir / query.
2. **Tri-Source Protocol:**
   - Kích hoạt `aiml-architecture-evaluator`.
   - Đọc Topology + Query Notebook `655d181d` + Đọc hiện trạng `architecture.md`.
3. **Evidence Generation:**
   - Xuất file evidence: `_iwish-output/adhoc-workspace/scratch/{uuid}-aiml-evidence.json`.
4. **Validation Gate:**
   - Chạy `python3 .agent/scripts/validate-aiml-evidence.py --file <path> --conversation-id <cid>`.
