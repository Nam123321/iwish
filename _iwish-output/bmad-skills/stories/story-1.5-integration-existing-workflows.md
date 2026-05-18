---
story_id: "STORY-RAP-1.5"
epic_id: "EPIC-RAP-01"
title: "Dynamic Integration Routing & Global Triggers"
status: "DONE"
assignee: "Vegeta"
priority: "P1"
phase: "forge"

---
# Story RAP-1.5: Dynamic Integration Routing & Global Triggers

## 1. Mục tiêu (Objective)

Nâng cấp cơ chế tích hợp của `/absorb-repo` workflow để giải quyết triệt để 2 vấn đề: **"Skill nằm trên giấy"** (thiếu trigger kích hoạt) và **"Phình to ngữ cảnh (Context Bloat)"** (nhồi nhét mọi thứ vào một agent). 

Câu chuyện này sẽ thiết lập một hệ thống **Dynamic Integration Routing (Định tuyến Tích hợp Động)**, bao gồm:
1.  **Global Awareness Trigger:** Bắt chặn các yêu cầu phân tích repo từ user và tự động định hướng sang `/absorb-repo`.
2.  **Classification Framework:** Phân loại repo thành `SKILL`, `WORKFLOW`, `PERSONA`, hoặc `COMPOUND` (nhóm hỗn hợp).
3.  **Trigger Injection:** Tự động "tiêm" trigger vào đúng vị trí trong hệ sinh thái I-Wish dựa trên phân loại.

**User Value:** Tạo ra một luồng tích hợp tự động hoàn toàn, nơi hệ thống không chỉ "đọc" hiểu repo mà còn tự biết "đặt" vũ khí mới vào đúng vị trí và hướng dẫn các agent khác cách sử dụng nó.

---

## 2. Target Users & Personas

- **Vegeta (The Integrator):** Sử dụng Classification Framework ở Phase 6 để phân loại và tiêm trigger.
- **King Kai / Master Router:** Được gắn Global Trigger để nhận thức sự tồn tại của quy trình `/absorb-repo`.
- **All Core Agents:** Ngăn chặn hành vi tự ý code chay khi gặp thư viện/repo lớn lạ lẫm.

---

## 3. Scope & Phạm vi Triển khai

### 3.1 Files cần chỉnh sửa

| File | Path | Thay đổi |
|------|------|----------|
| `absorb-repo.md` | `.agent/workflows/absorb-repo.md` | Cập nhật Phase 5 (Hỗ trợ Compound) và Phase 6 (Classification & Injection) |
| `iwish-bmm-router.md` | `.agent/workflows/iwish-bmm-router.md` | Thêm Global Trigger chặn các yêu cầu research repo |

### 3.2 Thay đổi chi tiết

#### 1. Cập nhật Phase 5 & 6 trong `/absorb-repo`
- **Phase 5 (COMPARE):** Bổ sung chức năng quét "Multi-Component". Nếu phát hiện >3 modules độc lập, gợi ý người dùng chọn chế độ `BUNDLE` (Compound Integration) thay vì tích hợp đơn lẻ.
- **Phase 6 (INTEGRATE):** Vegeta sử dụng framework phân loại 4 cấp độ:
  - `SKILL_ATTACHMENT`: Sinh ra file `SKILL.md` và tiêm vào host agent.
  - `DEDICATED_WORKFLOW`: Sinh ra file `workflow.md` và tiêm vào Master Router.
  - `NEW_PERSONA`: Sinh ra agent profile mới và tiêm vào lệnh `/summon`.
  - `COMPOUND_INTEGRATION` (The Librarian Pattern): Spawn một `[Repo]-Specialist` Agent để gom nhóm các tool.

#### 2. Cập nhật Master Router
- Thêm **Global Awareness Trigger** vào `iwish-bmm-router.md`:
  > *"When User requests integration, cloning, or deep research into an unfamiliar external repository, DO NOT attempt to write code immediately. You MUST trigger `/absorb-repo {url}` first to build the necessary context and DNA."*

---

## 4. Acceptance Criteria

### AC1: Master Router Global Trigger
- **GIVEN** A user asks the AI to "research and implement a new framework from this github link".
- **WHEN** The Master Router intercepts the prompt.
- **THEN** The router MUST refuse to code blindly.
- **AND** The router MUST explicitly trigger `/absorb-repo` as the very first action.

### AC2: The Classification Framework
- **GIVEN** Phase 6 of `/absorb-repo` is executing.
- **WHEN** Vegeta prepares the integration.
- **THEN** He MUST explicitly state the classification type: `SKILL_ATTACHMENT`, `DEDICATED_WORKFLOW`, `NEW_PERSONA`, or `COMPOUND_INTEGRATION`.
- **AND** The generated artifacts must correspond strictly to the chosen classification.

### AC3: Trigger Injection Engine
- **GIVEN** An artifact is generated in Phase 6.
- **WHEN** It is a `SKILL_ATTACHMENT`.
- **THEN** The orchestrator MUST update the host agent's menu to include the trigger for this skill.
- **WHEN** It is a `DEDICATED_WORKFLOW` or `NEW_PERSONA`.
- **THEN** The orchestrator MUST update the system's global menu / summoning list.

### AC4: Multi-Component Compound Handling (The Librarian)
- **GIVEN** A massive repository with multiple skills/workflows is analyzed.
- **WHEN** Phase 6 identifies it as `COMPOUND_INTEGRATION`.
- **THEN** It MUST generate a dedicated `[RepoName]-Specialist` agent.
- **AND** Attach all extracted skills/workflows solely to this new specialist agent to prevent context bloat in core agents.

---

## 5. Technical Constraints

- **Trigger Conflicts:** Phase 6 injection logic must check for duplicate commands (e.g., if `/use-auth` exists, prompt the user for an alternative name like `/use-clerk-auth`).
- **Idempotency:** Re-running Phase 6 should not create duplicate entries in the Router or Agent menus.

---

## 6. Definition of Done (DoD)

- [ ] `story-1.5` rewritten to reflect Dynamic Routing & Global Triggers.
- [ ] `.agent/workflows/absorb-repo.md` Phase 5 and Phase 6 updated with classification and injection logic.
- [ ] `.agent/workflows/iwish-bmm-router.md` updated with Global Trigger.
- [ ] `epic-rap-overview.md` updated to reflect the new workflow scope.
- [ ] Compiler check (`npm run build`) passes.
