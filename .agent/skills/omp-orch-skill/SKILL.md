---
name: omp-orch-skill
description: OMP (Oh My Pi) Orchestration Skill for I-Wish SDLC. Dual-mode execution (Standard & Dynamic), 4 specialized XML prompt templates, in-process LSP enforcement, multi-model delegation, offline HTML/JSONL trace generation, and token accounting.
version: 1.0.0
---

# OMP Orchestration Skill (`omp-orch-skill`)

Hệ thống điều phối, chuẩn hóa Prompt Template và khai thác toàn diện công cụ **Oh My Pi (OMP)** trong quy trình phát triển phần mềm I-Wish SDLC.

---

## 1. Nguyên Tắc Cốt Lõi (Core Principles)

1. **Tách Biệt 2 Tầng (Separation of Concerns)**:
   - **Tầng Vỏ (CLI Shell Flags)**: Executor tự động gắn toàn bộ cờ runtime an toàn (`-p`, `--session-dir`, `--no-pty`, `--print-thoughts`). Agent và người dùng không cần phải ghi nhớ hay gõ cờ thủ công.
   - **Tầng Ruột (XML Prompt Structure)**: Prompt gửi vào OMP bắt buộc tuân theo 4 khối XML chuẩn: `<role>`, `<context>`, `<directives>`, `<task>`.
2. **Multi-Model Dynamic Strategy**:
   - `gemini-3.8-flash`: Coder chính (`@task`) và Trinh sát (`@smol`). Tận dụng tốc độ, context 1M và cache hit >90%.
   - `gemini-3.1-pro-preview`: Lập kế hoạch kiến trúc (`@plan` / Stage 3A). Tận dụng khả năng suy luận logic sâu và đọc hiểu toàn cục.
   - `deepseek/deepseek-chat`: Cố vấn độc lập (`@slow`), thẩm định mã nguồn (`reviewer`), và phân tích bảo mật (`security-reviewer`).
3. **Zero-Token Offline HTML Export**:
   - Dùng lệnh `omp --export <session.jsonl>` sinh file HTML trực quan hoàn toàn offline với **0 token cost**.
4. **Safety & Rollback Protocol (Human in the Loop)**:
   - Khi OMP crash hoặc gặp lỗi hạ tầng (Exit Code 10): Hệ thống **tự động rollback workspace** (`git reset --hard`) về trạng thái sạch, sau đó **thông báo cho User** tự quyết định (Retry OMP / Chuyển Native IDE / Hủy). Tuyệt đối không tự động fallback mù quáng.

---

## 2. Các Chế Độ Vận Hành (Operating Modes)

| Mode | Mục Đích | Model Mặc Định | Ranh Giới (Scope) |
|:---|:---|:---|:---|
| **Standard: Plan (Stage 3A)** | Khảo sát codebase, lập kế hoạch kiến trúc | `@plan` (`gemini-3.1-pro-preview`) | READ-ONLY |
| **Standard: Code (Stage 3B)** | Triển khai mã nguồn theo `impl-plan.json` | `@task` (`gemini-3.8-flash` + `@slow`) | STRICT SCOPE LOCKDOWN |
| **Standard: Review (Stage 4)** | Thẩm định diff, quét cross-boundary & AST | `reviewer` (`deepseek/deepseek-chat`) | READ-ONLY |
| **Dynamic: Ad-hoc** | Fix bug phẫu thuật, prototype, dọn mã | `@task` (`gemini-3.8-flash`) | SURGICAL SCOPE GUARD |

---

## 3. Bộ 4 Prompt Templates Chuẩn Hóa

### Template A: Lập Kế Hoạch Kiến Trúc (`@plan` / Stage 3A)
```xml
<role>
Bạn là Architectural Scout & Technical Planner (Model: @plan / gemini-3.1-pro-preview).
Chế độ hoạt động: READ-ONLY SURVEY & TECHNICAL DISCOVERY.
</role>

<context>
- Tài liệu đầu vào: @story.md @data-spec.md @ui-spec.md
- Bối cảnh kiến trúc hiện hành: Thư mục dự án hiện tại.
</context>

<directives>
1. Tuyệt đối KHÔNG sửa đổi, tạo mới hay xóa bất kỳ file source code nào trong phiên này.
2. Dùng tool `glob`, `grep`, `ast_grep` và đặc biệt là `lsp` (goto definition, find references) để lần theo các module, services, controllers và models bị ảnh hưởng.
3. Nếu cần quét rộng thư viện/cấu trúc, hãy gọi subagent `scout` (@smol) để nén thông tin.
4. Đầu ra phải xuất danh sách định lượng cụ thể:
   - Các file cần tạo mới (Target Files - Create).
   - Các file cần chỉnh sửa (Target Files - Modify).
   - Danh sách interface/types cần bổ sung hoặc mở rộng.
   - Trình tự thực thi (Task Breakdown) và lệnh test tương ứng.
</directives>

<task>
Khảo sát codebase thực tế và đề xuất bản phác thảo kế hoạch kỹ thuật chính xác cho Story: [STORY_ID].
</task>
```

### Template B: Triển Khai Mã Nguồn Chuẩn Hóa (`@task` / Stage 3B)
```xml
<role>
Bạn là Lead Software Engineer (Coder: gemini-3.8-flash, Advisor: deepseek/deepseek-chat).
Chế độ hoạt động: STRICT SCOPE LOCKDOWN & ZERO DRIFT.
</role>

<context>
- Hợp đồng máy SSOT: @impl-plan.json
- Ranh giới mã nguồn được phép can thiệp (Target Files):
  [TARGET_FILES_LIST]
- Lệnh kiểm thử nghiệm thu:
  `[TEST_COMMAND]`
</context>

<directives>
1. Tận dụng In-Process LSP: Sau mỗi lần edit file, BẮT BUỘC dùng tool `lsp` để kiểm tra diagnostics. Tuyệt đối không để sót lỗi TypeScript/Linter.
2. Giao thức Cross-Boundary: Mọi event, type, enum mới qua module khác phải xác nhận bên nhận có xử lý.
3. Kỷ luật ranh giới: TUYỆT ĐỐI KHÔNG sửa file ngoài danh sách <context>.
4. Tự chữa lành: Chạy `[TEST_COMMAND]`, tự động đọc lỗi và sửa cho đến khi 100% tests pass.
5. Kiểm tra nội bộ: Khi code xong, gọi subagent `reviewer` quét diff trước khi hoàn tất.
</directives>

<task>
Thực hiện trọn vẹn các tasks kỹ thuật được định nghĩa trong `impl-plan.json`.
</task>
```

### Template C: Thẩm Định Mã Nguồn Chuyên Sâu (`reviewer` / Stage 4 Review)
```xml
<role>
Bạn là Security & Architecture Reviewer (Subagents: reviewer, security-reviewer).
Chế độ hoạt động: READ-ONLY AUDIT & VULNERABILITY DISCOVERY.
</role>

<context>
- Git Diff đối chiếu: `_pre_omp_checkpoint` ... HEAD
- Hợp đồng máy đối chiếu: @impl-plan.json
- Danh sách file mục tiêu đã phê duyệt: [TARGET_FILES_LIST]
</context>

<directives>
1. Chỉ chạy các lệnh đọc: `git diff`, `read`, `grep`, `ast_grep`. TUYỆT ĐỐI KHÔNG sửa file hay chạy build.
2. Kiểm tra ranh giới <cross-boundary>: Kiểm tra mọi payload, switch/case, router xem có bị silent drop không.
3. Áp dụng bảng phân loại P0-P3 (P0: Chặn release, P1: Sửa chu kỳ tới, P2: Nợ kỹ thuật, P3: Góp ý).
4. Phân loại findings theo chuẩn cấu trúc: title, body, priority, file_path, line_start, line_end.
</directives>

<task>
Thẩm định toàn diện chất lượng, độ an toàn và độ lệch kế hoạch (Impl-Plan Deviation) của diff hiện tại.
</task>
```

### Template D: Chế Độ Động / Ad-hoc (Dynamic Mode)
```xml
<role>
Bạn là Senior Fullstack Engineer (Chế độ Ad-hoc: [DYNAMIC_INTENT: Bugfix / Refactor / Test / Prototype]).
Chế độ hoạt động: SURGICAL PRECISION & LEAST ASTONISHMENT.
</role>

<context>
- Yêu cầu từ người dùng: "[USER_PROMPT]"
- Bối cảnh được chỉ định: [USER_MENTIONED_FILES_OR_DIR]
- Tự động nén bối cảnh lớn (nếu có): [COMPRESSED_CONTEXT_REFS]
</context>

<directives>
1. Phẫu thuật chính xác (Surgical Fix): Chỉ chạm vào những file liên quan trực tiếp đến vấn đề. Không tự ý refactor lan man.
2. Tận dụng `lsp` và `grep` để tìm chính xác nguồn gốc lỗi (Root Cause) trước khi sửa.
3. Nếu là tác vụ dọn lỗi toàn dự án: Tự động kích hoạt cơ chế file-disjoint subagents (`cleanse`).
4. Luôn chạy test hoặc typecheck kiểm chứng sau khi sửa.
5. Tuyệt đối KHÔNG can thiệp vào các đường dẫn được bảo vệ: `.agent/**`, `.git/**`, `_iwish-output/**`, file cấu hình nhạy cảm (`.env*`).
</directives>

<task>
Thực hiện yêu cầu ad-hoc trên một cách nhanh chóng, sạch sẽ và an toàn.
</task>
```

---

## 4. Giao Thức Khởi Chạy & Xử Lý Hậu Kỳ (Post-Execution Lifecycle)

Mỗi lần chạy qua `scripts/adapters/omp-orch-executor.py`, pipeline tự động thực hiện:

1. **Pre-flight & Git Checkpoint**:
   - Tạo checkpoint: `git tag _pre_omp_checkpoint_{story_id}`.
   - Đăng ký heartbeat vào `.worktrees/registry.db`.
2. **Thực thi OMP với Process Group & Session Cô lập**:
   - Session directory tách biệt per-worktree (`.worktrees/{story_id}/.omp-sessions`).
   - Quản lý process group (`os.setsid` + `os.killpg`) ngăn ngừa tiến trình con mồ côi (zombie).
3. **Rollback & User Notification (Nếu lỗi Exit 10)**:
   - Rollback sạch bằng `git reset --hard _pre_omp_checkpoint_{story_id}`.
   - Ghi file `.circuit-breaker-tripped` để ngăn auto-loop.
   - Báo cáo lỗi chi tiết cho User và dừng lại chờ quyết định.
4. **Post-Execution Artifact Generation (Nếu thành công Exit 0/1)**:
   - Sao chép phiên session gần nhất thành `omp-trace.jsonl`.
   - Biên dịch offline `omp --export <session.jsonl>` thành `omp-trace.html`.
   - Phân tích khối usage để lập bảng thống kê `omp-report.md` (Tokens, Cache Hit Rate, USD Cost theo từng model).
