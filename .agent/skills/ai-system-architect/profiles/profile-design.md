# Profile: Design Mode (`--mode=design`)

1. **Intake:** Nhận kiến trúc tính năng cần thiết kế (RAG, Chatbot, Tool-calling, Multi-Agent).
2. **Execution:**
   - Kích hoạt `ai-native-architecture` (đọc ít nhất 2 layers).
   - Kích hoạt `llm-engineering-skill` (đọc ít nhất 1 module tương ứng + CLDM).
3. **Evidence & Verification:**
   - Chạy `python3 .agent/scripts/validate-skill-execution-evidence.py --conversation-id <cid> --skill-name "ai-native-architecture"`.
   - Chạy `python3 .agent/scripts/validate-skill-execution-evidence.py --conversation-id <cid> --skill-name "llm-engineering-skill"`.
