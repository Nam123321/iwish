---
epic_id: epic-qasim
title: "Xây dựng Universal Simulator Skill (Monolithic)"
status: "PLANNED"
owner: "Master-Roshi"
priority: "HIGH"
phase: "origin"

---
# Epic: Xây dựng Universal Simulator Skill (Monolithic)

## 1. Tóm tắt (Executive Summary)
Phát triển một Kỹ năng Độc lập (Independent Skill) mang tên **Universal QA Simulator**. Mục tiêu là dung hợp hoàn hảo sức mạnh của 3 hệ thống cốt lõi: 
1. **SKL_Simulator_v1**: Cơ chế quản lý Token, Guardrails (Max 3 rounds), phân loại 13 deliverables.
2. **User Simulation Guardian**: Giao thức REAL-USER thấu cảm sâu sắc (Reality, Emotion, Action, Language).
3. **Edge-Case Guardian**: Tiêu chuẩn kiểm định 8-Pillars (Boundary, State, Concurrency, etc.).

Phiên bản trước bị đánh giá là "hời hợt" (chỉ list gạch đầu dòng mà không embed chi tiết logic của các Skill con). Trọng tâm của Epic này là giải quyết triệt để vấn đề đó, biến nó thành một "Siêu Prompt" nguyên khối (Monolithic), tự thân bao hàm đầy đủ định nghĩa nghiệp vụ để bất kỳ hệ thống AI nào (kể cả ChatGPT thuần) đọc vào cũng có thể execute chuẩn xác mà không cần reference file ngoài.

## 2. Mục tiêu Kinh doanh & Kỹ thuật
- Tự động hóa đánh giá chất lượng (QA) mọi thể loại deliverable (từ Code, Prompt đến Web App, Pitch Deck).
- Khả năng **Custom Context Injection**: Cho phép User khai báo Design System hay Rule riêng.
- Cắt giảm Token hollowing (lạm chi token) qua cơ chế `<scratchpad>` và *Silent Mental Run*.

## 3. Scope & Tính năng chính
- **Cơ chế Phân loại:** Nhận diện 13 loại Deliverables.
- **Tiêu chuẩn Kỹ thuật Nội tại:** Đóng gói toàn bộ định nghĩa 8-Pillars (không gọi file ngoài).
- **Tiêu chuẩn UX Nội tại:** Đóng gói toàn bộ cấu trúc REAL-USER Protocol (không gọi file ngoài).
- **Khung Định giá Hợp nhất:** Chấm điểm dựa trên trục logic (Bugs) và trục cảm xúc (UX).
- **Sub-routing Mở:** Hướng dẫn các Agent bên thứ 3 tự động chuyển tiếp lỗi (delegate).

## 4. Stories trong Epic
- **Story 1.1**: Phân tích, tổng hợp và biên soạn "Siêu Prompt" Universal Simulator Skill. (Đóng gói 3 Skills vào 1).
- **Story 1.1b**: Tái cấu trúc qa-simulator-guardian theo mô hình Fat-Guardian nội bộ I-Wish, chuẩn hóa logic tính điểm 6 Trục.
- **Story 1.2**: Tích hợp Skill vào Agent `Tien-Shinhan` và các workflow có liên quan (`/fix-bug`, `/review-code`).
- **Story 1.3**: Tích hợp QA Simulator rà soát lỗ hổng logic từ sớm vào các quy trình `/create-prd`, `/create-story`.

## 5. Metrics Đo lường Thành công
- File Skill có đầy đủ hướng dẫn thực thi độc lập (đọc 1 file hiểu cả 3 concept).
- AI đóng giả người dùng sinh động được các edge-cases sâu mà không bị lặp vô tận.
