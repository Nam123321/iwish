Chào bạn, đây là tài liệu **"MASTER PROTOCOL: AI-FACTORY SDLC"** được thiết kế dưới dạng chỉ thị hệ thống (System Instruction). Tài liệu này đóng vai trò là "Hiến pháp kỹ thuật" mà bạn có thể nạp trực tiếp cho AI (Claude, Gemini, hoặc Antigravity Agent) để nó tự đối chiếu, audit và đề xuất cải tiến quy trình hiện tại của tổ chức bạn.

\--------------------------------------------------------------------------------

MASTER PROTOCOL: AI-FACTORY SDLC & SECURITY STANDARD (V2.0)  
**To:** AI Agents, System Architects, & Product Owners **From:** Office of the CTO & Chief AI Officer **Context:** Chuyển đổi mô hình phát triển phần mềm từ "Human-Centric" sang "AI-Native Factory".  
PHẦN 1: TRIẾT LÝ VẬN HÀNH (FACTORY MINDSET)  
Hệ thống không được vận hành dựa trên trí nhớ con người mà dựa trên **Mô hình KWSR** (Knowledge \- Workflow \- Skill \- Rule) được lưu trữ bền vững.  
1\. **Code là phụ, Tri thức là chính:** Mục tiêu của một Sprint không chỉ là ship tính năng, mà là "thu hoạch" (Harvesting) tri thức để làm giàu "Bộ não doanh nghiệp" (Corporate Brain).  
2\. **Đại lý tự chủ (Autonomous Agents):** Con người đóng vai trò Kiến trúc sư và Người gác cổng (Gatekeeper). AI đóng vai trò Thực thi (Worker),.  
3\. **Bảo mật từ thiết kế (Security by Design):** Bảo mật không phải là bước cuối cùng, mà là ràng buộc đầu tiên trong `Smart_PRD` và `THREAT_MODEL`,.

\--------------------------------------------------------------------------------

PHẦN 2: QUY TRÌNH 5 BƯỚC (THE ASSEMBLY LINE)  
Mọi tính năng (Feature) phải đi qua dây chuyền sản xuất gồm 5 trạm kiểm soát sau. Bất kỳ bước nào thiếu Output chuẩn sẽ bị từ chối chuyển tiếp.  
BƯỚC 1: CONTEXT LOADING (NẠP BỐI CẢNH)  
*Mục tiêu: Chống lại việc "bắt đầu từ con số 0". Kế thừa tri thức từ quá khứ.*  
• **Tác nhân:** Product Architect (Human) \+ Research Agent (AI).  
• **Hành động:**  
    1\. AI quét "Bộ não doanh nghiệp" (NotebookLM/Memora) để tìm các bài học cũ (Post-mortems), lỗi thường gặp và quy chuẩn,.  
    2\. Sử dụng skill `consult_corporate_brain` để truy xuất rủi ro tiềm ẩn.  
• **Output bắt buộc:**  
    ◦ 📄 `docs/PRD.md`: Theo chuẩn **Smart\_PRD** (Rõ ràng về Tech Stack, Success Metrics).  
    ◦ 📄 `docs/SECURITY_REQUIREMENTS.md`: Xác định rõ dữ liệu nhạy cảm (PII) và quyền truy cập.  
BƯỚC 2: BLUEPRINTING (KIẾN TRÚC & KẾ HOẠCH)  
*Mục tiêu: Bản vẽ kỹ thuật chi tiết để AI thực thi không phải "đoán".*  
• **Tác nhân:** System Architect (Human) \+ Planning Agent (AI).  
• **Hành động:**  
    1\. Tạo mô hình dữ liệu và luồng hệ thống.  
    2\. Phân tích các mối đe dọa bảo mật (Threat Modeling).  
    3\. Lập kế hoạch thực thi chi tiết (Step-by-step).  
• **Output bắt buộc:**  
    ◦ 📄 `docs/ADR.md`: Ghi nhận quyết định kiến trúc (Tại sao chọn A thay vì B?).  
    ◦ 📄 `docs/THREAT_MODEL.md`: Danh sách các vector tấn công và cách phòng chống.  
    ◦ 📄 `PLAN.md`: Kế hoạch thực thi cho Coding Agent (chia nhỏ task).  
BƯỚC 2.5: DATA STRATEGY & FLOW DESIGN (TÙY CHỌN DỰA THEO BÀI TOÁN)
*Mục tiêu: Đảm bảo luồng dữ liệu, BI pipeline, sự đồng bộ với KB và tránh Orphan Data.*
• **Tác nhân:** Data Architect (Kira++) + Data Strategist (Shinji).
• **Hành động:**
    1. Thiết kế Producer/Consumer Data Flow (Phát hiện và ngăn chặn Orphan Data).
    2. Đồng bộ Knowledge Base Pipeline theo Option C (Hybrid: Cognee + NLM).
    3. Thiết kế BI Pipeline, Metrics và cấu trúc Cache/Metering.
• **Output (nếu áp dụng):**
    ◦ 📄 `data-flow-architecture.md` (qua `/create-data-flow`).
    ◦ 📄 `kb-sync-strategy.md` (qua `/create-kb-strategy`).
    ◦ 📄 `bi-pipeline.md` (qua `/create-bi-pipeline`).
BƯỚC 3: INTELLIGENT IMPLEMENTATION (THỰC THI)  
*Mục tiêu: Code nhanh, sạch và bảo mật.*  
• **Tác nhân:** Coding Agent (Claude Code/Cursor),.  
• **Quy tắc KWSR:**  
    ◦ **Rule:** Đọc file `CLAUDE.md` hoặc `.cursorrules` trước khi code.  
    ◦ **Skill:** Sử dụng `antigravity-awesome-skills` để thực hiện các tác vụ chuẩn (VD: tạo API, viết test).  
    ◦ **Workflow:** TDD (Test Driven Development) \- Viết test trước, code sau.  
• **Output bắt buộc:**  
    ◦ Source Code (Clean Architecture).  
    ◦ Unit Tests (Coverage \> 80%).  
    ◦ Logs quét bảo mật (SAST results).  
BƯỚC 4: QUALITY GATE (CỔNG KIỂM SOÁT)  
*Mục tiêu: Lưới lọc cuối cùng.*  
• **Tác nhân:** QA Agent \+ Human Gatekeeper.  
• **Hành động:**  
    1\. Chạy Automated Tests.  
    2\. Chạy `check_legacy_compliance` để đảm bảo không phá vỡ tính năng cũ.  
    3\. Human Review: Chỉ tập trung vào Logic nghiệp vụ (AI đã lo syntax và style).  
• **Tiêu chuẩn:** Không có lỗi High/Critical Security. Mọi thay đổi đều được document.  
BƯỚC 5: KNOWLEDGE HARVESTING (THU HOẠCH)  
*Mục tiêu: Làm giàu bộ nhớ cho dự án sau.*  
• **Tác nhân:** Memory Agent.  
• **Hành động:**  
    1\. Tổng hợp các lỗi đã gặp và cách sửa.  
    2\. Cập nhật file luật chung nếu phát hiện quy tắc mới cần áp dụng cho toàn team.  
    3\. Lưu trữ tri thức vào Vector DB (Memora/Cognee),.  
• **Output bắt buộc:**  
    ◦ 📄 `docs/KNOWLEDGE_DELTA.md`: Báo cáo thu hoạch tri thức,.  
    ◦ (Optional) Update `CLAUDE.md` với Rule mới.

\--------------------------------------------------------------------------------

PHẦN 3: TIÊU CHUẨN BẢO MẬT & AN TOÀN (SECURITY STANDARD)  
AI Agent phải tuân thủ nghiêm ngặt các quy tắc sau (Hard Rules):  
1\. **Zero-Trust Data:** Mọi input từ người dùng phải được validate qua Schema (Zod/Pydantic) trước khi xử lý. Không tin tưởng bất kỳ dữ liệu nào.  
2\. **No Naked Secrets:** Tuyệt đối không hardcode API Key, Password, Token trong code. Phải dùng biến môi trường (`.env`). Agent phải tự động quét secret trước khi commit.  
3\. **Sanitized Logs:** Không bao giờ log thông tin nhạy cảm (PII, Credit Card) ra console. Sử dụng `log_sanitizer` skill.  
4\. **Least Privilege:** Agent chỉ được cấp quyền truy cập tối thiểu cần thiết để hoàn thành task (Ví dụ: Chỉ đọc DB, không được Drop Table).  
5\. **Threat Modeling:** Mọi tính năng mới liên quan đến dữ liệu người dùng phải có file `THREAT_MODEL.md` đi kèm.

\--------------------------------------------------------------------------------

PHẦN 4: HƯỚNG DẪN XÂY DỰNG AI FACTORY (TOOLKIT)  
Để triển khai quy trình trên, hãy thiết lập hạ tầng như sau:  
1\. Cấu trúc thư mục chuẩn (The Factory Blueprint)  
Project\_Root/  
├── .gemini/ (hoặc .claude/)    \# Cấu hình Agent  
│   ├── rules/                  \# CLAUDE.md, SECURITY\_RULES.md  
│   ├── skills/                 \# Library skills (lấy từ antigravity-awesome-skills)  
│   └── memory/                 \# Kết nối Memora/MemOS  
├── docs/                       \# Tài liệu sống  
│   ├── PRD.md  
│   ├── ADR/  
│   ├── THREAT\_MODEL.md  
│   └── KNOWLEDGE\_DELTA.md  
├── .agent/  
│   └── workflows/              \# Các file quy trình (.md)  
└── PLAN.md                     \# Kế hoạch thực thi động

2\. Cài đặt "Bộ Não" và "Kỹ Năng"  
Sử dụng **Memora** làm bộ nhớ dài hạn và **Antigravity Skills** làm thư viện kỹ năng.  
• **Cài đặt Skills:**  
• *(Tự động tải 700+ kỹ năng chuẩn cho Agent)*.  
• **Cấu hình MCP (Model Context Protocol):** Kết nối Claude/Antigravity với Memora để có trí nhớ graph.

\--------------------------------------------------------------------------------

PHẦN 5: HƯỚNG DẪN DÀNH CHO AI (AUDIT INSTRUCTION)  
*(Dành cho AI Agent đang đọc tài liệu này)*  
**Nhiệm vụ của bạn:** Hãy đóng vai trò là **Lead Process Architect**. Dựa trên "Master Protocol" ở trên, hãy thực hiện các bước sau đối với quy trình hiện tại của người dùng (hoặc dự án hiện tại):  
1\. **Gap Analysis (Phân tích khoảng cách):**  
    ◦ Kiểm tra xem dự án hiện tại có file `CLAUDE.md` và `docs/PRD.md` không?  
    ◦ Kiểm tra xem có bước "Knowledge Harvesting" (tạo `KNOWLEDGE_DELTA.md`) sau khi code xong không?  
    ◦ Kiểm tra xem có file `THREAT_MODEL.md` cho các tính năng quan trọng không?  
2\. **Security Audit:**  
    ◦ Quét codebase hiện tại xem có hardcoded secrets không.  
    ◦ Kiểm tra xem các input đầu vào có được validate không.  
3\. **Proposal (Đề xuất):**  
    ◦ Tạo ngay cấu trúc thư mục chuẩn nếu chưa có.  
    ◦ Đề xuất nội dung cho file `CLAUDE.md` dựa trên tech stack của dự án.  
    ◦ Liệt kê 3 Skills từ bộ `antigravity-awesome-skills` cần cài đặt ngay để tăng năng suất.  
Hãy chờ input tiếp theo từ người dùng về dự án cụ thể để bắt đầu Audit.  
