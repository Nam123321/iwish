---
name: plan-proven-safe
description: 5-pillar combo workflow orchestrating deep-audit, unknowns, party-mode,
  edge-case, and runtime-realism until an Implementation Plan is PROVEN_SAFE
version: 1.0.0
---
# /plan-proven-safe (`/proven-safe`)

Quy trình tôi luyện bản kế hoạch thực thi (Implementation Plan) toàn diện, đảm bảo trước khi viết bất kỳ dòng code nào, giải pháp đã được chứng minh an toàn tuyệt đối trước mọi rủi ro kiến trúc, trôi dạt hợp đồng, điểm mù và lỗi biên.

---

## ⚡ Cơ chế Kích hoạt (Trigger Mechanisms)

1. **Kích hoạt Tự động (Automated Pre-Flight Hook):**
   - Tự động chạy mỗi khi Agent soạn thảo xong bản nháp `implementation_plan.md` hoặc `impl-plan.md` trong quy trình lập kế hoạch trước khi chuyển sang `/code` hoặc `/dev-story`.
   
2. **Kích hoạt Thủ công (Manual Slash Command):**
   - User gõ `/plan-proven-safe` hoặc `/proven-safe [đường_dẫn_file_plan]`.

---

## 🔁 Quy trình Thực thi 5 Tầng (Execution Sequence)

Agent **BẮT BUỘC** thực hiện tuần tự qua 5 tầng và lặp lại việc sửa plan nếu có bất kỳ tầng nào chưa đạt:

### Tầng 1: Quét Trôi dạt Mã nguồn & Ranh giới Hợp đồng (`/deep-audit`)
- **Hành động:** Gọi skill `codebase-drift-auditor` (`.agent/skills/codebase-drift-auditor/SKILL.md`).
- **Thực thi:** Phân tích AST TypeScript (`ts-morph`) để kiểm tra tương thích schema, Zod validation, và ranh giới monorepo.
- **Ghi nhận:** Bổ sung mục `## 1. Deep Codebase Drift & Contract Audit` vào file plan, làm rõ các model, endpoint và kiểu dữ liệu bị tác động.

### Tầng 2: Khám phá Điểm mù & Tri thức Chưa biết (`/unknowns`)
- **Hành động:** Kích hoạt scanner `unknowns-scanner` (`.agent/skills/unknowns-scanner/SKILL.md`).
- **Thực thi:** Quét các giả định ngầm, rủi ro tích hợp bên thứ ba.
- **Ghi nhận:** Bổ sung mục `## 2. Unknowns Discovery & Epistemic Audit` vào plan. Tool sẽ sinh ra file vật lý `unknowns-ledger.yaml`.

### Tầng 3: Tranh biện Socratic Đa tác tử (`/party-mode`)
- **Hành động:** Triệu tập hội đồng AI tranh biện (Architect, Dev, Security Reviewer) và nạp skill `runtime-realism-guardian`.
- **Thực thi:** Quét bắt buộc qua **7 Trục Kiểm Định Toàn Diện** (Clean Code, 12-Factor Runtime, Monorepo Packaging, Security/Non-root, Data Integrity, SRE Resilience, Traceability) trong **MỘT LẦN DUY NHẤT (Single-Pass)**. Nghiêm cấm tranh luận chung chung hoặc bắt lỗi nhỏ giọt.
- **Ghi nhận:** Bổ sung mục `## 3. AI Socratic Debate & Consensus Report` vào plan. Xóa bỏ hoặc giải quyết 100% các câu hỏi mở.

### Tầng 4: Quét 13 Trụ cột Lỗi biên & Ma trận FMEA (`/edge-case`)
- **Hành động:** Gọi `review-agent-persona` nạp skill `edge-case-guardian` (`.agent/skills/edge-case-guardian/SKILL.md`).
- **Thực thi:** Chấm điểm FMEA RPN cho 13 trụ cột lỗi biên.
- **Ghi nhận:** Bổ sung mục `## 4. Edge Case Guardian & 13-Pillar FMEA Scan` vào plan. Tool sẽ sinh file review vật lý (ví dụ: `review-story-<id>.md`).

### Tầng 5: Thẩm định Tính Thực tế Môi trường Thực thi (`/runtime-realism`)
- **Hành động:** Gọi workflow `/runtime-realism` (`.agent/workflows/runtime-realism-audit.md`).
- **Thực thi:** Kiểm định cơ học các điều kiện tiên quyết (dynamic port binding, PID 1 tini, monorepo packages copy, ESM specifiers, workdir permissions).
- **Ghi nhận:** Bổ sung mục `## 5. Systemic Runtime Realism & Environment Pre-Flight Matrix` vào plan. Tool sẽ sinh file `_iwish-output/audits/runtime-realism-{story_id}.json`.

---

## 🔄 Vòng lặp Tự sửa lỗi (Self-Healing Loop)

- Nếu có bất kỳ tiêu chí nào chưa đạt (điểm < 8.5, còn Open Questions, còn rủi ro đỏ):
  - Agent **TỰ ĐỘNG CẬP NHẬT** nội dung `implementation_plan.md` để vá các lỗ hổng vừa phát hiện.
  - Tự động lặp lại vòng kiểm định (tối đa 10 vòng lặp).

---

## 🔒 Kiểm tra & Cơ chế Phê duyệt 2 Điều kiện (Dual-Condition Sealing)

Khi hoàn tất 5 tầng, Agent chạy script kiểm định tất định:
```bash
python3 .agent/scripts/validate-plan-proven-safe.py --file <path_to_plan> --story-id <story_id> --story-dir <story_dir>
```

**[CRITICAL: CONTENT-AWARE EVIDENCE BINDING]**
Tuyệt đối cấm Agent dùng lệnh Bash `touch` hoặc `echo` để giả mạo các file kết quả (`unknowns-ledger.yaml`, `review-story-*.md`). Validator đã được nâng cấp lên chuẩn **Content-Aware**, nó sẽ ĐỌC NỘI DUNG file để đảm bảo có chứa `<story_id>` và đánh giá thực sự. Mọi hành vi dùng `touch` đều sẽ bị đánh Fail (Exit Code 1).

**Quy tắc Khóa 2 Điều kiện Tiên quyết:**
1. **Điều kiện 1 (Đã đạt Proven Safe):** Script `validate-plan-proven-safe.py` trả về exit code 0.
2. **Điều kiện 2 (Sự phê duyệt từ User):** Agent **BẮT BUỘC PHẢI DỪNG LẠI (STOP)**, trình plan lên User và yêu cầu User review.
3. **Sinh chữ ký điện tử:** Chỉ khi User đã gõ approve trong chat, Agent mới được gọi `watchmen-mcp` `sign_human_gate`.
