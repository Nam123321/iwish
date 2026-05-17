# HTML Anything trong I-Wish

Generated: 2026-05-16

## 1. Mục tiêu của tài liệu

Tài liệu này giúp user hiểu:

- `html-anything` là gì
- vì sao nó được add vào I-Wish
- nó thuộc nhóm capability nào trong hệ thống
- khi nào Orch Agent nên gợi ý dùng nó
- agent, skill, workflow, task nào sẽ phối hợp với nó
- ví dụ sử dụng thực tế để user có thể nhìn lại và dùng lại nhanh

## 2. Snapshot tích hợp

- Repo nguồn: [nexu-io/html-anything](https://github.com/nexu-io/html-anything)
- Trạng thái trong I-Wish: đã đăng ký ở `_iwish/catalog/external-modules/html-anything.json`
- Kiểu module: `compound-external`
- Registration mode: `absorb`
- Trigger đã gắn: `html`, `export`, `docs`, `deck`, `prototype`, `design`, `social`, `report`
- Tool dependencies đã gắn: `playwright`, `stitch`

## 3. HTML Anything là gì

`html-anything` là một external capability bundle theo hướng:

- local-first
- agent-driven HTML generation
- biến nội dung nháp như markdown, notes, CSV, JSON, SQL thành HTML đọc được bởi con người
- hỗ trợ nhiều deliverable surface khác nhau thay vì chỉ một loại tài liệu

Theo README hiện tại của repo:

- hỗ trợ `8` coding-agent CLIs
- có `75` template skills
- trải trên `9` deliverable surfaces
- có export cho `.html`, `.png`, WeChat, X, Zhihu

Nói ngắn gọn: đây không phải một skill nhỏ. Đây là một **bộ sản xuất HTML artifact** cho nhiều loại output.

## 4. Phân loại theo Capability Funnel

### Shape

`html-anything` nên được phân loại là:

- `compound`

Lý do:

- repo này không phải chỉ có 1 `SKILL.md`
- nó có app runtime, template registry, nhiều template skill, export pipeline, UI editor, deployment path
- bản chất của nó là một subsystem/bundle hơn là một skill đơn

### Role

`html-anything` nên được phân loại là:

- `supportive`

Lý do:

- nó không phải xương sống chính của delivery framework
- nó phục vụ để tạo ra output tốt hơn cho các process chính
- nó hỗ trợ trình bày, mô phỏng, prototype, report, guide, deck, social artifact

### Delivery framework placement

Nó là **cross-phase supportive capability**, dùng được ở nhiều phase:

- `Discover`
- `Plan`
- `Solution`
- `Implement`
- `Validate/Deliver`
- `Operate/Learn`

## 5. Vị trí của HTML Anything trong khung hệ thống I-Wish

I-Wish nên được nhìn theo mô hình:

1. `Delivery Framework`
2. `Process-primary capabilities`
3. `Supportive capabilities`
4. `Foundational injections`

`html-anything` nằm ở lớp `Supportive capabilities`.

Nó không thay thế:

- `make-story`
- `make-ui-spec`
- `plan`
- `code`
- `review`
- `research`

Nó hỗ trợ các flow đó tạo ra artifact tốt hơn để:

- đọc
- trình bày
- review
- share
- handoff
- archive

## 6. Các nhóm output mà HTML Anything phục vụ tốt

### A. Documentation / Guide / Readable artifact

Phù hợp khi cần:

- viết guide cho user
- viết docs đẹp hơn markdown thường
- tạo runbook / onboarding / PM spec / report

### B. Presentation / Deck

Phù hợp khi cần:

- deck cho strategy
- deck cho product launch
- deck tech sharing
- deck review sprint / roadmap / architecture

### C. Prototype / Web artifact

Phù hợp khi cần:

- tạo HTML prototype nhanh
- tạo landing page
- tạo dashboard mock
- tạo docs page
- tạo mobile/web visual prototype

### D. Social / Share artifact

Phù hợp khi cần:

- social cards
- poster
- X / Xiaohongshu style artifact
- image-shareable content

### E. Report / Structured communication

Phù hợp khi cần:

- finance report
- data report
- weekly update
- OKR view
- PM spec
- engineering runbook

## 7. Các phase/stage mà module này hỗ trợ

## Discover

Hỗ trợ các task:

- tóm tắt research thành HTML readable brief
- tạo market scan card/deck
- tạo structured discovery artifact cho stakeholder

Workflow/process chính đi cùng:

- `research`
- `bmad-bmm-market-research`
- `bmad-bmm-domain-research`
- `bmad-bmm-technical-research`
- `analyze-codebase`

## Plan

Hỗ trợ các task:

- trình bày product brief
- dựng PM spec
- dựng roadmap deck
- tạo document dễ share cho stakeholder

Workflow/process chính đi cùng:

- `plan`
- `bmad-bmm-create-product-brief`
- `bmad-bmm-create-prd`
- `bmad-bmm-edit-prd`
- `bmad-bmm-validate-prd`

## Solution

Hỗ trợ các task:

- tạo visual artifact cho UI concept
- dựng UX/spec support page
- trình bày architecture hoặc epic/story mapping đẹp hơn

Workflow/process chính đi cùng:

- `make-ui-spec`
- `bmad-bmm-create-ui-spec`
- `bmad-bmm-create-ux-design`
- `bmad-bmm-create-architecture`
- `bmad-bmm-create-epics-and-stories`

## Implement

Hỗ trợ các task:

- tạo implementation handoff page
- render bug/report summary dạng HTML
- tạo preview để review UI/output

Workflow/process chính đi cùng:

- `code`
- `fix-bug`
- `review`
- `bmad-bmm-dev-story`
- `bmad-bmm-code-review`
- `bmad-bmm-correct-course`

## Validate / Deliver

Hỗ trợ các task:

- sprint status deck
- release note HTML
- QA summary
- rollout communication artifact

Workflow/process chính đi cùng:

- `status`
- `retro`
- `bmad-bmm-sprint-status`
- `bmad-bmm-retrospective`

## Operate / Learn

Hỗ trợ các task:

- publish learnings
- create reusable docs
- create external-facing case-study or internal artifact

Workflow/process chính đi cùng:

- `absorb-repo`
- `create-skill`
- `enhance-skill`
- `register-skill-pack`

## 8. Agent nào nên dùng HTML Anything

### `orch-agent`

Vai trò:

- phát hiện user đang cần artifact “human-readable / shareable / deck / HTML”
- route sang agent sở hữu process chính
- gắn `html-anything` như supportive module nếu output cần HTML chất lượng cao

### `pm-agent`

Dùng khi:

- PRD summary
- product brief
- roadmap / prioritization deck
- stakeholder communication page

### `ux-agent`

Dùng khi:

- UI spec companion
- prototype HTML
- design direction page
- visual review artifact

### `review-agent`

Dùng khi:

- tạo report review
- tạo compliance summary
- xuất QA / UX / code review findings thành artifact đọc tốt

### `creative-agent`

Dùng khi:

- poster
- social asset
- editorial layout
- visual storytelling

### `research-agent`

Dùng khi:

- research brief
- comparative deck
- synthesis artifact

### `dev-agent`

Dùng khi:

- cần handoff artifact cho frontend
- cần debug/output report ở dạng HTML
- cần prototype very-close-to-implementation

### `capability-agent`

Dùng khi:

- register / absorb / patch / wire module này vào hệ thống
- decide có nên tạo skill-attachment hay workflow-patch quanh `html-anything`

## 9. Skill và supportive capability đi cùng

### Skill / capability rất phù hợp để đi cùng

- `design-consultation`
- `ux-guardian`
- `ui-ux`
- `user-simulation-guardian`
- `pivot-guardian`
- `github-deep-research`
- `repo-absorption`

### Vì sao

- `design-consultation`, `ux-guardian`, `ui-ux` giúp artifact đẹp nhưng không lệch hệ thống UX hiện có
- `user-simulation-guardian` giúp output không chỉ đẹp mà còn hợp hành vi user
- `pivot-guardian` giúp tránh lạm dụng HTML artifact khi task thật ra không cần
- `github-deep-research` và `repo-absorption` hữu ích khi cần học pattern/template mới từ repo ngoài

## 10. Workflow nào nên gọi HTML Anything như supportive module

### Nên coi là pairing rất mạnh

- `plan`
- `make-ui-spec`
- `review`
- `research`
- `register-skill-pack`
- `absorb-repo`

### Các workflow kế thừa BMAD Method rất hợp

- `bmad-bmm-create-product-brief`
- `bmad-bmm-create-prd`
- `bmad-bmm-create-ui-spec`
- `bmad-bmm-create-ux-design`
- `bmad-bmm-code-review`
- `bmad-bmm-correct-course`
- `bmad-bmm-qa-automate`

## 11. Nguyên tắc Input -> Process -> Output

## Case A — PM Brief

Input:

- product notes
- discovery notes
- PRD skeleton

Process:

- `pm-agent` chạy `plan`
- nếu cần artifact đẹp để stakeholder đọc, Orch gắn `html-anything`
- chọn surface kiểu `pm-spec`, `deck`, hoặc `doc`

Output:

- HTML brief
- shareable deck
- readable PM page

## Case B — UX compliance

Input:

- UI problems
- master design / `DESIGN.md`
- story context

Process:

- `ux-agent` chạy `make-ui-spec` hoặc `review`
- supportive skills: `design-consultation`, `ux-guardian`, `ui-ux`
- nếu cần artifact review dễ share, gắn `html-anything`

Output:

- HTML review artifact
- visual guideline page
- prototype correction page

## Case C — Sprint / status communication

Input:

- sprint status
- blockers
- metrics

Process:

- `delivery-manager-agent` hoặc `pm-agent`
- workflow `status` hoặc `retro`
- dùng `html-anything` để tạo deck/report

Output:

- HTML sprint report
- deck update
- stakeholder summary

## 12. Mô phỏng Orch Agent reasoning

## Tình huống 1

User:

`Tạo cho tôi một product brief dễ share với stakeholder, có thể đọc trên web và chụp màn hình đẹp.`

Orch nên suy luận:

1. Đây là `Plan` phase.
2. Stage/task là `product brief communication`.
3. Process chính là `plan` hoặc `bmad-bmm-create-product-brief`.
4. Agent phù hợp là `pm-agent`.
5. User yêu cầu output HTML/shareable, nên gắn supportive module `html-anything`.

Đề xuất route:

- primary: `pm-agent` + `/plan`
- supportive: `html-anything`
- output surface gợi ý: `pm-spec`, `doc`, `deck-pitch`, hoặc `deck-simple`

## Tình huống 2

User:

`UX hiện tại có nhiều lỗi và tôi cần một artifact rõ ràng để team frontend sửa đúng master design.`

Orch nên suy luận:

1. Đây là `Solution` hoặc `Validate` phase.
2. Stage/task là `UX compliance + implementation guidance`.
3. Process chính là `make-ui-spec` hoặc `review`.
4. Agent chính là `ux-agent`.
5. Supportive skills: `design-consultation`, `ux-guardian`, `ui-ux`.
6. Nếu user muốn artifact shareable, dùng `html-anything`.

Đề xuất route:

- primary: `ux-agent` + `/make-ui-spec`
- supportive: `html-anything`
- output surface gợi ý: `docs-page`, `prototype-web`, `deck-tech-sharing`

## Tình huống 3

User:

`Tôi muốn tạo deck tổng hợp tình hình sprint để họp với stakeholder vào chiều nay.`

Orch nên suy luận:

1. Đây là `Validate/Deliver`.
2. Stage/task là `status communication`.
3. Process chính là `status` hoặc `bmad-bmm-sprint-status`.
4. Agent phù hợp: `delivery-manager-agent` hoặc `pm-agent`.
5. Supportive module: `html-anything`.

Đề xuất route:

- primary: `delivery-manager-agent` + `/status`
- supportive: `html-anything`
- output surface gợi ý: `deck-tech-sharing`, `deck-simple`, `weekly-update`

## 13. Những gì HTML Anything không nên thay thế

Không nên dùng `html-anything` để thay thế:

- source of truth của story / epic / PRD
- quyết định UX governance
- approval gate
- artifact planning logic
- review logic

Nó là công cụ **render / package / communicate**, không phải owner của planning hoặc governance.

## 14. Đề xuất action tiếp theo cho I-Wish

Nếu muốn tích hợp sâu hơn, nên làm theo thứ tự:

1. Giữ `html-anything` là `compound-external + supportive`
2. Tạo `skill-attachment` mỏng để Orch hiểu khi nào nên gọi nó
3. Tạo `workflow-patch` cho một số flow chính:
   - `plan`
   - `make-ui-spec`
   - `review`
   - `status`
4. Không biến nó thành main delivery workflow
5. Chỉ promote deeper integration sau khi có validation với 2-3 case thật

## 15. Prompt mẫu cho user

### Prompt 1

`Tạo product brief HTML để share cho stakeholder, tone gọn, hiện đại, dễ chụp màn hình.`

### Prompt 2

`Tạo HTML review artifact cho các lỗi UX của story-1.6, bám master design và highlight những chỗ frontend cần sửa.`

### Prompt 3

`Tạo deck sprint status dạng HTML, gồm progress, blocker, risk, next action để trình bày nhanh trong buổi họp.`

### Prompt 4

`Tạo prototype HTML cho landing page này để team có thể xem và góp ý trước khi code thật.`

## 16. Kết luận

`html-anything` là một external module rất mạnh cho việc biến output của I-Wish thành artifact đọc tốt, trình bày tốt, share tốt.

Trong hệ I-Wish, nó nên được hiểu là:

- `compound`
- `supportive`
- `cross-phase`

Nó đặc biệt hợp khi user cần:

- HTML đọc tốt hơn markdown
- deck / report / prototype / share artifact
- output “human-facing” thay vì chỉ “agent-facing”
