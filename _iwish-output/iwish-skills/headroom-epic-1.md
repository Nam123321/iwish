# Epic: Headroom Proxy Integration

## Mục tiêu Epic
Thiết lập Headroom làm proxy chạy ngầm (always-on daemon) trong I-Wish, giúp giảm token LLM thông qua nén nội dung, đồng thời cấu hình Whitelist bảo vệ các tài liệu quan trọng.

## Các Story
1. **Story 1: Setup Proxy Daemon**: Tạo script khởi động proxy Headroom (`headroom proxy --port 8787`) và cấu hình môi trường I-Wish để route requests qua proxy này.
2. **Story 2: Config Whitelist**: Tích hợp các bộ lọc (blacklist/whitelist) để bỏ qua nén đối với các file `PRD.md`, `Epic.md`, `Story.md`, `repo-dna.md` để đảm bảo độ chính xác của AI.
3. **Story 3: MCP Reversibility Tool**: Kích hoạt MCP plugin `headroom_retrieve` cho các agents, cho phép chúng truy vấn lại bản gốc khi cần.
