# BẢN THIẾT KẾ KIẾN TRÚC: SSOT & ANTI-DRIFT CHO I-WISH SDLC (V3)

**Tài liệu Phân tích & Kế hoạch Triển khai (Architecture Decision Record & Planning)**
**Cập nhật lần cuối:** 2026-09-29
**Trạng thái:** Approved (Tích hợp Báo cáo Reconciliation & Party Mode Tinh chỉnh Logic Đọc File)

---

## 1. BỐI CẢNH & ĐỊNH VỊ KIẾN TRÚC (Context & Positioning)
I-Wish là một **AI-native SDLC framework** độc lập. Hiện tượng SSOT Drift đang xảy ra do thiếu vắng một rào cản vật lý giữa tài liệu văn xuôi và mã nguồn. 
Kiến trúc V3 khẳng định: I-Wish hoạt động như một **Trình biên dịch hợp đồng (Contract-aware SDLC Compiler)** được hỗ trợ bởi Graph Intelligence. I-Wish phải duy trì tính trung lập (Stack-Neutral), không áp đặt công nghệ của dự án mục tiêu (Cowok) lên toàn bộ framework.

---

## 2. CÁC QUYẾT ĐỊNH KIẾN TRÚC LÕI (Architecture Decision Records)

### ADR 1: Phân tách Authority & Trung lập Ngôn ngữ (Stack-Neutrality)
*   **Quyết định:** Không có 1 file SSOT duy nhất. Thay vào đó, thiết lập ma trận Authority qua **Contract Adapters**.
    *   *Source of Truth:* Git chứa các Hợp đồng máy (Machine Contracts) đã được phê duyệt.
    *   *Graph Projection:* FalkorDB chỉ là bản chiếu (Read-model) tốc độ cao của một Revision cụ thể trong Git, không phải là Source gốc.
    *   *Target-Project Authority:* Sử dụng Adapter để parse Prisma, OpenAPI, Zod, Protobuf tùy thuộc vào Stack của dự án mục tiêu.

### ADR 2: Phân cấp Quản trị (Risk-Tiered Manifests)
*   **Quyết định:** Quản trị theo mức độ rủi ro để giảm tải cho Agent.
    *   **Embedded Mode (Thấp/Cục bộ):** Nhúng khối YAML Contract Manifest vào thẳng frontmatter của `data-spec.md`.
    *   **Sidecar Mode (Cao/Shared):** Tạo file `contract-manifest.yaml` riêng biệt cho các ranh giới chia sẻ hoặc thay đổi có tính phá vỡ.

### ADR 3: Ràng buộc Song song tại Bước 3B (Dual-Input Boundary)
*   **Quyết định:** Bác bỏ tư duy "Tước quyền đọc file Markdown". Dev-Agent bắt buộc phải tiếp nhận 2 nguồn tri thức phân lập rõ ràng:
    1.  **Instruction Input (Đọc Hiểu):** `impl-plan.md` và `story.md`. Cung cấp Kiến trúc (System Design), FMEA Mitigations, Blueprint Tasks, và Business Logic.
    2.  **Constraint Input (Ràng Buộc):** `contract-context.json` (Do AI Contract Compiler sinh ra). Đóng vai trò là "Vòng Kim Cô".
*   **Hệ quả:** LLM dùng văn xuôi để viết thuật toán, nhưng khi định nghĩa Database Schema hay API Route, nó bắt buộc phải đối chiếu với `contract-context.json`. LLM không được tự ý "sáng tác" các field ngoài JSON.

### ADR 4: Concurrency qua Distributed Epochs
*   **Quyết định:** Áp dụng mô hình **Project-Scoped Distributed Lease** (Redis SET NX) kết hợp **Graph Epoch Publish**. FalkorDB sẽ build Graph vào một namespace phiên bản (vd: `epoch_145`). Chỉ khi Verify thành công, con trỏ Atomic Pointer mới trỏ sang epoch mới.

### ADR 5: Giữ nguyên Python Tooling cho Integrity Runner
*   **Quyết định:** Giữ nguyên và nâng cấp các script Python hiện tại (như `pipeline-integrity-runner.py`) thay vì đập đi viết lại bằng TypeScript. Tận dụng tối đa AST Parsing và Watchmen Cryptographic Sealing của Python.

---

## 3. TÍCH HỢP VÀO PIPELINE `/flow-auto-approve` (TỪ DDD ĐẾN DoD)

Quy trình tự động hóa sẽ được nâng cấp thành luồng Zero-Trust khép kín:

*   **Stage 1 (Spec):** Agent sinh ra Contract Manifest (Embedded hoặc Sidecar). Output mang trạng thái `UNVERIFIED`.
*   **Stage 3A (Plan):** Ngay trước khi Human Gate kích hoạt, hệ thống chạy **AI Contract Compiler**. Đọc Manifest + Quét Graph để xuất ra `contract-context.json`.
*   **Stage 3B (Code):** `/pi-code-agent` hoặc `/omp-orch-skill` hấp thụ song song cả `impl-plan.md` (Cách làm) và `contract-context.json` (Ranh giới).
*   **Stage 4 (Review - Hard Gate):** Sức mạnh SSOT nằm ở đây. Script `pipeline-integrity-runner.py` chạy **Semantic Diff**. Nếu AST của mã nguồn vừa sinh ra sửa đổi Database/API mà KHÔNG có mặt trong `contract-context.json` $\rightarrow$ Đánh **FAIL CLOSED**, ép Agent Remediate.
*   **Stage 4B/5B (Completion - DoD):** Sau khi User phê duyệt (Approve), hệ thống cấp phát chữ ký điện tử, đổi status Manifest thành `APPROVED`, và Publish Graph Epoch mới trên FalkorDB. Story chính thức đạt Definition of Done (DoD).

---

## 4. KẾ HOẠCH TRIỂN KHAI THEO PHASES (Implementation Sequence)

### Phase A: Sửa chữa Authority Drift nội bộ
- [ ] Khẳng định định danh Graph: FalkorDB là query projection, Git là SSOT.
- [ ] Hợp nhất Graph Profile và thêm Project Namespace vào FalkorDB.

### Phase B: Contract IR & Tracer Bullet
- [ ] Định nghĩa cấu trúc JSON chuẩn cho **Contract IR** và Interface cho **Contract Adapter**.
- [ ] Viết Python Adapter đầu tiên hỗ trợ đọc **Prisma** Schema.

### Phase C: AI Contract Compiler & Semantic Diff Gate
- [ ] Hoàn thiện script `AI Contract Compiler` (Python), xuất ra `contract-context.json`.
- [ ] Nâng cấp `pipeline-integrity-runner.py`: Tích hợp Adapter-specific Semantic Diff (Pre-merge Gate).
- [ ] Cập nhật Workflows (`flow-stage-3b-code.md`) để truyền cả 2 input (Plan và JSON) cho Code Agent.

### Phase D: Concurrency Protocol (Redis Epochs)
- [ ] Tích hợp Redis Distributed Lease (`SET NX`) và luồng Atomic Publish Pointer.

### Phase E: Tái định vị `/project-drift-detector`
- [ ] Phát triển `/project-drift-detector` thành một Continuous Macro-Auditor (Không chỉ dùng để migrate file cũ).
- [ ] Migration Legacy: Batch parse văn xuôi cũ thành Manifest (Chỉ cắm cờ `UNVERIFIED`, LLM tuyệt đối không tự sửa file source code).

---

## 5. BẢO MẬT & QUẢN TRỊ RỦI RO (Risk Management)
*   **Rủi ro Đa luồng (EC-P13-01):** Khóa cục bộ `fcntl` đã được thay bằng Redis Epoch Publish Protocol (ADR 4).
*   **Bảo mật YAML (EC-P6-01):** Bắt buộc dùng `yaml.safe_load()` trong Python Tooling.
*   **Mất Context Thiết kế (Party Mode Tinh chỉnh):** Khắc phục Bias tước quyền đọc file Markdown bằng cơ chế Dual-Input Boundary (ADR 3). LLM không bị mù kiến trúc hệ thống.
*   **Zero-Trust Enforcement:** 100% các chặng chuyển giao phải có bằng chứng `.json` được ký `.sig` qua Watchmen MCP (`sign_pipeline_gate`).

---
*Tài liệu này đóng vai trò SSOT Architecture Blueprint cho đợt nâng cấp I-Wish Anti-Drift V3.*
