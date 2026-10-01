---
name: 'setup-pr-babysitter'
description: 'Cài đặt và cấu hình quy trình PR Babysitter tự động sửa lỗi CI cho Pull Request'
---

# 🤖 PR Babysitter Setup Workflow

Tính năng **PR Babysitter** giúp tự động theo dõi, tạo bản sửa lỗi và đẩy commit lên các Pull Request đang gặp lỗi CI/CD (như lỗi Linter, Unit test) mà không cần lập trình viên phải thực hiện thủ công.

## Tự Động Hóa

Hệ thống đã tự động cài đặt các thành phần cốt lõi:
1. **File Trạng Thái:** `_iwish-output/pr-babysitter-state.md`
2. **GitHub Action:** `.github/workflows/pr-babysitter.yml`

## Các Bước Cấu Hình Bổ Sung (Dành cho Người Dùng)

Để PR Babysitter hoạt động được trên GitHub, bạn cần đảm bảo Action có quyền thay đổi mã nguồn. Vui lòng thực hiện các bước sau trên Repo của bạn:

1. Truy cập vào trang **Settings** của dự án Cowok.ai trên GitHub.
2. Điều hướng đến **Actions > General**.
3. Cuộn xuống phần **Workflow permissions**.
4. Chọn tuỳ chọn **Read and write permissions**.
5. Đảm bảo ô **Allow GitHub Actions to create and approve pull requests** được chọn (nếu có).
6. Lưu lại.

## Khắc Phục Sự Cố

- Nếu Bot bị lỗi phân quyền khi push code, bạn có thể tạo một GitHub Personal Access Token (PAT) và nạp vào cấu hình Repository Secrets với tên `GITHUB_TOKEN`.
- Khi Bot gửi quá 3 lần thất bại trên cùng 1 PR, hãy kiểm tra file log `_iwish-output/pr-babysitter-state.md` để tự xử lý tiếp.
