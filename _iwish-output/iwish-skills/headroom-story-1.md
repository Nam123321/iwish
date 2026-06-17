# Story 1: Setup Headroom Proxy Skill

## Task Breakdown
- [ ] Task 1.1: Tạo file `SKILL.md` (chuẩn I-Wish Frontmatter) mô tả cách vận hành Headroom.
- [ ] Task 1.2: Viết script Bash để kiểm tra và chạy `headroom proxy` ở background.
- [ ] Task 1.3: Cập nhật biến môi trường LLM URL trong `.env` hoặc Agent runtime để trỏ về `http://localhost:8787/v1`.

# Story 2: Config Whitelist

## Task Breakdown
- [ ] Task 2.1: Tạo file `headroom-whitelist.json` định nghĩa các rule loại trừ (loại bỏ `PRD.md`, `Epic*.md`, `Story*.md`, `*dna.md`).
- [ ] Task 2.2: Sửa đổi script khởi động proxy để load file config whitelist này (`headroom proxy --config headroom-whitelist.json`).

# Story 3: MCP Integration

## Task Breakdown
- [ ] Task 3.1: Đăng ký `headroom_retrieve` tool vào hệ thống MCP configs của I-Wish để Orchestrator và Research Agent có quyền tiếp cận context gốc.
