# I-Wish Introduction Guide

Generated: 2026-05-16

## 1. I-Wish là gì

`I-Wish` là một hệ thống phát triển sản phẩm và điều phối agent theo hướng:

- `Orch-first`
- `open-platform`
- `open-module`
- `skill-native`
- `source-of-truth aware`

Nói ngắn gọn, I-Wish không chỉ là một bộ prompt hay một bộ slash command. Nó là một **operating system cho AI-assisted product delivery**:

- đi từ idea đến product delivery
- có khung phát triển chính rõ ràng
- có agent, workflow, skill, tool, module hỗ trợ
- có khả năng mở rộng thêm repo, skill pack, tool platform bên ngoài
- có cơ chế giữ context và source-of-truth để Orch Agent phối hợp tốt hơn theo thời gian

## 2. Tư duy cốt lõi của I-Wish

I-Wish được xây theo 4 lớp:

1. `Main delivery framework`
2. `Process-primary capabilities`
3. `Supportive capabilities`
4. `Foundational injections`

### 2.1 Main delivery framework

Đây là luồng chính mà user nên nhìn đầu tiên:

```text
Idea -> Discover -> Plan -> Solution -> Implement -> Validate -> Deliver -> Operate/Learn
```

I-Wish muốn user hiểu hệ thống theo luồng này, thay vì nhìn một danh sách phẳng các command, skill, agent.

### 2.2 Process-primary capabilities

Đây là các capability trực tiếp xử lý stage/task của luồng chính.

Ví dụ:

- `research`
- `plan`
- `make-story`
- `make-ui-spec`
- `code`
- `review`
- `status`
- `retro`

### 2.3 Supportive capabilities

Đây là các capability hỗ trợ process chính, không thay thế xương sống delivery.

Ví dụ:

- `absorb-repo`
- `register-skill-pack`
- `create-skill`
- `enhance-skill`
- `analyze-codebase`
- `fix-bug`
- `simulate-user`
- `impact-analysis`

### 2.4 Foundational injections

Đây là các rules, standards, fragments, governance, design principles, validation heuristics được inject vào nhiều workflow/skill/agent.

Chúng giúp hệ thống:

- giữ chất lượng
- chống lệch context
- giảm routing noise
- đảm bảo quá trình evolve có governance

## 3. Các feature nổi bật của I-Wish

### 3.1 Orch-first experience

User có thể làm việc theo cách tự nhiên hơn với `orch-agent`, thay vì buộc phải nhớ toàn bộ slash command.

Orch sẽ:

- đọc source-of-truth
- shortlist workflow/skill/agent phù hợp
- đề xuất execution path
- phối hợp thêm supportive capability nếu cần

### 3.2 Function-first agents

I-Wish rời khỏi cách đặt tên persona-first làm user phải nhớ “ai làm gì”.

Surface canonical hiện tại dùng tên theo chức năng:

- `orch-agent`
- `dev-agent`
- `pm-agent`
- `ux-agent`
- `review-agent`
- `research-agent`
- `delivery-manager-agent`
- `capability-agent`
- cùng các agent chức năng khác như `qa-agent`, `architect-agent`, `product-agent`, `devops-agent`, `analyst-agent`, `ai-agent`, `creative-agent`, `data-architect-agent`

### 3.3 Open platform installation

I-Wish hướng đến việc cài đặt và chạy trên nhiều môi trường:

- `local-terminal`
- `claude-code`
- `cursor`
- `windsurf`
- `opencode`
- `google antigravity`

Canonical runtime hiện dùng:

- `_iwish/`
- `IWISH_HOME`
- installer CLI:
  - `iwish install`
  - `iwish update`
  - `iwish status`
  - `iwish doctor`
  - `iwish register-module`

### 3.4 Open module ecosystem

I-Wish không giới hạn ở closed marketplace.

User có thể:

- add repo GitHub
- add skill pack
- add workflow pack
- add local capability
- add external module

Sau đó hệ thống có thể:

- absorb
- classify
- review
- register
- route

### 3.5 Review pack và HTML artifact

Mỗi repo/module/skill quan trọng được add hoặc tạo mới nên có:

- `integration-guide.md`
- `integration-guide.html`

Mục tiêu:

- user đọc hiểu nhanh
- share nội bộ dễ hơn
- Orch có thêm context phục vụ routing sau này

### 3.6 Routing-profile cho Orch

I-Wish đã thêm lớp `routing-profile.yaml` để Orch research hiệu quả hơn.

Thứ tự Orch nên đọc là:

1. source-of-truth context
2. `routing-profile.yaml`
3. `integration-guide.md`
4. execution body

Điều này giúp:

- tiết kiệm token
- tăng độ chính xác
- giảm việc phải scan full workflow/skill body quá sớm

### 3.7 Source-of-truth aware delivery

I-Wish không chỉ route theo keyword.

Nó đang đi theo hướng route theo:

- sprint / epic / story
- reconciliation state
- capability graph
- routing profile
- module/tool availability

### 3.8 Open tool abstraction

I-Wish tách rõ tool registry thay vì hardcode một tool duy nhất.

Ví dụ:

- browser:
  - `playwright`
  - `chrome-devtools-mcp`
  - `browser-use`
- design:
  - `figma`
  - `stitch`
  - `claude-design`
- graph:
  - `falkordb-full`
  - `lite-static`
  - `custom-adapter`

Open Tool trong I-Wish không chỉ là “có adapter”.

Mỗi tool nghiêm túc nên có:

- tool adapter
- usage skill pack / workflow pack
- routing profile
- review pack

Ví dụ với design tools:

- `stitch-first-dev` + `stitch-to-code`
- `figma-first-dev` + `figma-to-code`
- `claude-design-first-dev` + `claude-design-to-code`
- và `visual-fidelity-gate` là generic design validation gate

## 4. Luồng làm việc chính với I-Wish

### Phase 1: Discover

User đang tìm hiểu và làm rõ ý tưởng, nghiên cứu thị trường, đối thủ, nghiệp vụ và bối cảnh kỹ thuật codebase.

*Luồng bắt buộc:*
1. **Làm rõ Ý tưởng (`/idea-discover`)**: Đây là bước **tiên quyết** đầu tiên trước khi brainstorm. Agent sử dụng bộ khung 5 Thấu Kính (Mom Test & JTBD) để đặt câu hỏi làm rõ các bối cảnh, rủi ro, nỗi đau của người dùng và loại bỏ các giả định mơ hồ. Output: `1.1. idea-discovery.md`.
2. **Brainstorming (`/brainstorm`)**: Tìm các hướng giải pháp tiềm năng và MVP scope. Output: `1.2. idea-bank.md`.
3. **Idea Challenge (`/idea-challenge`)**: Tranh biện và phản biện ý tưởng (PRFAQ stress-test). Output: `1.3. idea-challenge.md`.
4. **Nghiên cứu bối cảnh (`/research`)**: Quét thị trường (`market-research.md`), đối thủ/giải pháp thay thế (`competitor-research.md`), nghiệp vụ (`domain-research.md`), kỹ thuật (`technical-research.md`), và bối cảnh dự án (`project-context.md`).

Các workflow tiêu biểu:

- `idea-discover`
- `brainstorm`
- `idea-challenge`
- `research`
- `analyze-codebase`

Agent tiêu biểu:

- `research-agent`
- `orch-agent`
- `analyst-agent`

### Phase 2: Plan

User muốn làm rõ product direction, PRD, roadmap, product brief.

Các workflow tiêu biểu:

- `plan`
- `bmad-bmm-create-product-brief`
- `bmad-bmm-create-prd`
- `bmad-bmm-edit-prd`
- `bmad-bmm-validate-prd`

Agent tiêu biểu:

- `pm-agent`
- `product-agent`
- `orch-agent`

### Phase 3: Solution

User chuyển từ plan sang giải pháp có thể build được (buildable specifications).

Các workflow tiêu biểu:

- `make-story` (tạo `story.md`)
- `make-ui-spec` (tạo `ui-ux-spec.md` thay vì `ui-spec.md` cũ)
- `make-data-spec` (tạo `database-spec.md` riêng lẻ cho Story)
- `bmad-bmm-create-architecture`
- `bmad-bmm-create-epics-and-stories`
- `bmad-bmm-check-implementation-readiness`

Agent tiêu biểu:

- `delivery-manager-agent`
- `ux-agent`
- `architect-agent`
- `orch-agent`

### Phase 4: Implement

User bắt đầu code, sửa bug, review code, correct course.

Các workflow tiêu biểu:

- `code`
- `fix-bug`
- `review`
- `bmad-bmm-dev-story`
- `bmad-bmm-code-review`
- `bmad-bmm-correct-course`
- `bmad-bmm-qa-automate`

Agent tiêu biểu:

- `dev-agent`
- `review-agent`
- `qa-agent`
- `orch-agent`

### Phase 5: Validate / Deliver

User cần status, validate, release confidence, handoff.

Các workflow tiêu biểu:

- `status`
- `retro`
- `bmad-bmm-sprint-status`
- `bmad-bmm-retrospective`

Agent tiêu biểu:

- `delivery-manager-agent`
- `review-agent`
- `orch-agent`

### Phase 6: Operate / Learn

User muốn absorb repo, add module, evolve capability, learn từ project.

Các workflow tiêu biểu:

- `absorb-repo`
- `register-skill-pack`
- `create-skill`
- `enhance-skill`

Agent tiêu biểu:

- `capability-agent`
- `orch-agent`
- `research-agent`

## 5. Hệ thống agent hiện tại

### Canonical agents

Canonical function-first surface hiện có `16` agent:

- `ai-agent`
- `analyst-agent`
- `architect-agent`
- `capability-agent`
- `creative-agent`
- `data-architect-agent`
- `delivery-manager-agent`
- `dev-agent`
- `devops-agent`
- `orch-agent`
- `pm-agent`
- `product-agent`
- `qa-agent`
- `research-agent`
- `review-agent`
- `ux-agent`

### Legacy persona agents

I-Wish vẫn giữ compatibility layer với agent cũ như:

- `vegeta`
- `whis`
- `grand-priest`
- `piccolo`
- `hit`
- `android-18`
- `king-kai`
- `trunks`
- `bulma`
- `songoku`
- `gotenks`
- `master-roshi`

Chúng không còn là canonical public surface, nhưng vẫn tồn tại để không làm gãy workflow cũ.

## 6. Hệ thống skill hiện tại

Root skill packages hiện có `18` skill:

- `canary`
- `caveman-mode`
- `clone-website`
- `design-consultation`
- `export-pdf`
- `github-deep-research`
- `idea-hardening`
- `land-and-deploy`
- `navigator-guardian`
- `pivot-guardian`
- `qa-simulator-guardian`
- `repo-absorption`
- `security-guardian`
- `socratic-review`
- `ui-ux`
- `user-simulation-guardian`
- `ux-guardian`
- `visual-fidelity-gate`

Chúng chia thành 3 nhóm:

- `process-primary`
- `supportive`
- `foundational`

Ví dụ:

- `repo-absorption` = supportive
- `design-consultation` = supportive
- `ux-guardian` = foundational
- `security-guardian` = foundational
- `pivot-guardian` = supportive

## 7. Hệ thống workflow hiện tại

### Canonical workflows

Canonical short-form workflows hiện có `23`:

- `absorb-repo`
- `bootstrap-existing-project`
- `canary`
- `code`
- `codebase-health`
- `create-skill`
- `enhance-skill`
- `fix-bug`
- `gen-dashboard`
- `idea-discover`
- `idea-challenge`
- `make-data-spec`
- `make-story`
- `make-ui-spec`
- `pivot-project`
- `plan`
- `register-skill-pack`
- `research`
- `research-solution-sources`
- `retro`
- `review`
- `simulate-user`
- `status`

### Active non-canonical workflows

Hiện có thêm `8` workflow hỗ trợ quan trọng:

- `analyze-codebase`
- `audit-ux-patterns`
- `create-data-overview`
- `data-dependency-map`
- `impact-analysis`
- `mkt-capture-pipeline`
- `prd-purpose`
- `research-project-modules`

### Legacy workflow layer

Repo vẫn còn legacy wrapper layer như:

- `bmad-bmm-*`
- `bmad-agent-bmm-*`
- `create-capability`
- `enhance-capability`

Chúng là compatibility surface, không phải mental model chính mà user mới nên học đầu tiên.

## 8. Cách dùng I-Wish thực tế

### Cách 1: Chat tự nhiên với Orch

Đây là hướng nên dùng nhiều nhất.

Ví dụ:

- `Tôi cần plan PRD cho một sản phẩm mới`
- `UX của story-1.6 đang lệch master design, review giúp tôi`
- `Fix bug checkout flow nhưng review scope trước`
- `Hấp thụ repo này vào I-Wish rồi đề xuất cách tận dụng`
- `Tôi muốn add thêm một skill pack từ GitHub`

Trong tương lai gần, đây nên là surface chính để user không phải nhớ quá nhiều lệnh.

### Cách 2: Gọi workflow canonical khi đã biết mình muốn gì

Ví dụ:

- `/idea-discover`
- `/idea-challenge`
- `/plan`
- `/make-story`
- `/make-ui-spec`
- `/make-data-spec`
- `/code`
- `/review`
- `/research`
- `/pivot-project`
- `/project-expansion-review`
- `/bootstrap-existing-project`
- `/retro`
- `/status`
- `/create-skill`
- `/enhance-skill`
- `/research-solution-sources`
- `/register-skill-pack`
- `/absorb-repo`
- `/canary`
- `/unique-advantage-evaluator`
- `/simulate-user`
- `/fix-bug`
- `/codebase-health`
- `/gen-dashboard`
- `/orch-agent`

### Cách 3: Add module mở

Ví dụ:

- add repo GitHub bằng `iwish register-module`
- đi qua `register-skill-pack`
- hoặc chạy `absorb-repo` nếu cần phân tích và hoạch định integration sâu hơn

### Cách 4: Tạo hoặc evolve capability

Ví dụ:

- `create-skill`
- `enhance-skill`

Đây là luồng dùng khi muốn mở rộng chính I-Wish, không chỉ dùng I-Wish để làm project.

## 9. Use case tiêu biểu

### Use case 1: Xây sản phẩm từ ý tưởng (Raw Idea)

Flow:

- `idea-discover` (làm rõ ý tưởng bằng Mom Test)
- `brainstorm` (brainstorm ý tưởng)
- `idea-challenge` (thử thách ý tưởng)
- `research` (nghiên cứu bối cảnh)
- `plan` (lập PRD & Plan)
- `make-story` (tạo Story)
- `make-ui-spec` (thiết kế UI Spec)
- `make-data-spec` (thiết kế Data Spec)
- `code` (code / dev story)
- `review` (code review)
- `status` (theo dõi tiến độ & gen dashboard)

### Use case 2: Brownfield project cần hiểu codebase

Flow:

- `analyze-codebase`
- `research-project-modules`
- `make-story`
- `code`
- `review`

### Use case 3: UX drift / master design drift

Flow:

- `review`
- `make-ui-spec`
- supportive skills:
  - `design-consultation`
  - `ux-guardian`
  - `stitch-design-taste`
- rồi mới `code`

### Use case 4: Add external repo / skill pack

Flow:

- `register-skill-pack`
- hoặc `absorb-repo`
- review `integration-guide.md/.html`
- update routing context
- dùng trong các workflow sau đó

### Use case 5: Day 2 / operations / delivery

I-Wish không chỉ dừng ở build feature.

Nó còn có pack và workflow cho:

- release
- deploy
- rollout safety
- canary
- operations
- monitoring / maintenance style concerns

## 10. Open concept của I-Wish

I-Wish được thiết kế theo 4 hướng mở:

### Open 1: Open installation

Chạy được trên nhiều platform/harness thay vì gắn chặt một môi trường.

### Open 2: Open skill/module integration

Có thể dùng:

- internal skill
- custom skill
- external repo
- third-party pack

### Open 3: Open tool integration

Không ép user dùng một browser tool hay design tool duy nhất.

### Open 4: Open interaction through Orch

Mục tiêu là user nói chuyện với `orch-agent` theo nhu cầu, thay vì ghi nhớ hàng chục slash command.

## 11. I-Wish khác gì so với các giải pháp khác

So với nhiều giải pháp agent/prompt framework ngoài thị trường, I-Wish nổi bật ở sự kết hợp của các điểm sau:

### 11.1 Không chỉ là prompt collection

I-Wish có:

- delivery framework
- capability taxonomy
- Orch routing
- source-of-truth
- open-module registration
- review pack
- routing profile

### 11.2 Không chỉ là command launcher

I-Wish không dừng ở chuyện “có nhiều command”.

Nó cố gắng tổ chức command, agent, skill, workflow thành một hệ thống phát triển có xương sống rõ ràng.

### 11.3 Không đóng marketplace

I-Wish ưu tiên khả năng hấp thụ repo/skill/module mở, thay vì chỉ cho dùng capability trong một ecosystem khép kín.

### 11.4 Có lớp supportive và foundational rõ ràng

Nhiều hệ thống chỉ có một mặt phẳng capability khá phẳng.

I-Wish phân rõ:

- cái gì là luồng chính
- cái gì là hỗ trợ
- cái gì là guardrail/foundational

### 11.5 Quan tâm source-of-truth và reverse-sync

I-Wish không muốn ad-hoc code changes làm lệch story/spec/epic mãi mãi.

Nó đi theo hướng:

- reconciliation
- story-aware routing
- sprint-aware context
- capability-aware evolution

## 12. Cấu trúc Thư mục Tài liệu Đầu ra Chuẩn (Standardized Output Directory Tree)

Iwish quản lý tất cả tài liệu lập kế hoạch, đặc tả và báo cáo dưới một cấu trúc thư mục chuẩn nhằm đảm bảo tính truy vết (traceability) và kế thừa dữ liệu giữa các giai đoạn:

```text
_iwish-output/
├── 1. Idea Discovery/
│   ├── 1.1. idea-discovery.md           # Làm rõ ý tưởng ban đầu (Mom Test & JTBD)
│   ├── 1.2. idea-bank.md                # Brainstorm giải pháp & MVP scope
│   ├── 1.3. idea-challenge.md           # Thử thách ý tưởng (PRFAQ stress-test)
│   └── 1.4. research/
│       ├── market-research.md           # Nghiên cứu thị trường
│       ├── competitor-research.md       # Nghiên cứu đối thủ hoặc quy trình thay thế
│       ├── domain-research.md           # Nghiên cứu nghiệp vụ chuyên môn
│       ├── technical-research.md        # Khảo sát khả thi kỹ thuật
│       └── project-context.md           # Bối cảnh & quy tắc phát triển dự án
│
├── 2. Product Planning/
│   ├── 2.1. product-brief-or-prd.md     # Tài liệu PRD chính
│   ├── 2.2. database-spec.md            # Thiết kế Schema dữ liệu tổng thể
│   ├── 2.3. ui-ux-spec.md               # Tiêu chuẩn thiết kế giao diện tổng thể (UX Spec & User Journeys)
│   ├── 2.4. epics-and-stories.md        # Danh sách Epics và Stories phân rã từ PRD
│   └── design-system/
│       └── {portal-slug}/
│           └── DESIGN.md                # Design System Master (Base Tokens, Colors, Typography)
│
├── 3. Development/
│   ├── 1. Epic & Story/                 # Quản lý phát triển theo cấu trúc thư mục cây
│   │   └── Epic-[ID]/                   # Thư mục cho từng Epic (Ví dụ: Epic-POC)
│   │       ├── epic-spec.md             # Đặc tả kỹ thuật hoặc thiết kế của Epic
│   │       └── Story-[ID]/              # Thư mục cho từng Story thuộc Epic
│   │           ├── story.md             # File Story chính (AC, Tasks, QA Scorecard)
│   │           ├── ui-ux-spec.md        # Thiết kế giao diện riêng cho Story này
│   │           └── database-spec.md     # Thiết kế dữ liệu riêng cho Story này
│   ├── 2. Bug Report/                   # Thư mục chứa danh sách báo cáo lỗi phát sinh
│   │   └── Bug-[ID].md                  # Chi tiết báo cáo lỗi
│   ├── sprint-status.yaml               # Trạng thái Sprint hiện tại
│   └── project-expansion-review/
│       └── PER-[feature-name].md        # Báo cáo đánh giá tác động mở rộng dự án
│
└── 4. Verification & Release/
    ├── 4.1. walkthrough.md              # Báo cáo kết quả kiểm thử và nghiệm thu
    ├── 4.2. merge-report.json           # Báo cáo sáp nhập code và kiểm tra xung đột
    └── 4.3. retrospective.md            # Rút kinh nghiệm sau mỗi epic/sprint
```

## 13. Quy trình Đánh giá Mở rộng Dự án (Project Expansion Review - PER)

Khi dự án đang chạy (in-flight) và có yêu cầu bổ sung thêm tính năng hoặc module mới, hệ thống bắt buộc kích hoạt quy trình **PER** nhằm đánh giá mức độ ảnh hưởng và xác định xem dự án có cần **Pivot** không. PER phân loại tác động thành 3 mức với các hướng định tuyến (routing) khác nhau:

- **🟢 Mức 1: Tác động THẤP (Low Impact)**
  - *Định nghĩa:* Tính năng bổ sung nhỏ, không đổi luồng chính, không đổi DB schema lớn.
  - *Định tuyến:* Cho phép tiếp tục tạo Story (`/make-story`) và triển khai.
  - *Outputs cập nhật:* `story.md`, `sprint-status.yaml`, `task.md`.
  
- **🟡 Mức 2: Tác động TRUNG BÌNH (Medium Impact)**
  - *Định nghĩa:* Module lớn, ảnh hưởng đến database schema nghiệp vụ chính hoặc thay đổi luồng chính nhưng giữ nguyên tệp khách hàng.
  - *Định tuyến:* Dừng tạo story. Quay lại bước `/plan` để cập nhật PRD, thiết kế database spec tổng thể, và phân rã lại Epic.
  - *Outputs cập nhật:* `PRD.md`, `epics-and-stories.md`, `database-spec.md`, `sprint-status.yaml`.
  
- **🔴 Mức 3: Tác động CAO (High Impact / Pivot)**
  - *Định nghĩa:* Thay đổi mô hình giá trị sản phẩm (Zoom-In/Zoom-Out Pivot), đổi đối tượng người dùng, hoặc đổi công nghệ cốt lõi.
  - *Định tuyến:* Đóng băng tiến độ cũ. Quay lại `/idea-challenge` để stress-test lại ý tưởng, tiến hành thêm `/research` mới, rồi mới cập nhật PRD tại `/plan`.
  - *Outputs cập nhật:* `idea-challenge.md`, các file `research/`, `architecture.md` (nếu có), `PRD.md`, `epics/` & `stories/` cũ được lưu trữ (archive).

## 14. User nên bắt đầu từ đâu

Nếu là user mới, thứ tự học tốt nhất là:

1. Hiểu `Main delivery framework`
2. Dùng `orch-agent` cho các yêu cầu tự nhiên
3. Học các `canonical workflows` chính
4. Chỉ sau đó mới mở rộng sang:
   - supportive workflows
   - external modules
   - capability creation/evolution

## 15. Tài liệu nên đọc tiếp

- [I-Wish Capability System Framework](iwish-capability-system-framework.md)
- [I-Wish Routing Profile Standard](iwish-routing-profile-standard.md)
- [I-Wish Adoption Review Pack Standard](iwish-adoption-review-pack-standard.md)
- [I-Wish Skill Graph and Orch Routing Analysis](iwish-skill-graph-routing-analysis.md)

## 16. Bottom line

I-Wish nên được hiểu là:

- một **AI-assisted product delivery system**
- có **khung phát triển chính rõ ràng**
- có **Orch-first coordination**
- có **open skill/module/tool ecosystem**
- có **reviewable source-of-truth**
- và có **khả năng tiến hóa dần theo project và theo capability**

Nếu user chỉ nhớ một điều, hãy nhớ điều này:

`I-Wish không phải là một list command. I-Wish là một hệ thống để đi từ ý tưởng đến delivery, với Orch điều phối và capability mở rộng theo ngữ cảnh.`

