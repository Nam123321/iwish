# Technical Research

- **Lựa chọn thư viện**: Đánh giá Vis.js và Cytoscape.js. Vis.js được chọn nhờ hiệu năng render mượt mà với 10000+ nodes.
- **Thử nghiệm PoC**: Đã xây dựng thành công bản thử nghiệm đồng bộ thiết kế Stitch và render đồ thị thời gian thực.
- **Kiến trúc mã nguồn**: Chọn TypeScript làm ngôn ngữ phát triển cốt lõi, tổ chức theo mô hình Clean Architecture phân tầng rõ rệt.
- **Bảo mật dữ liệu**: Sử dụng cơ chế cách ly sandbox cho các subagent để ngăn chặn rò rỉ context hoặc thực thi lệnh nguy hiểm.
- **Hiệu năng biên dịch**: Tối ưu hóa thời gian sinh dashboard HTML tĩnh dưới 200ms bằng kỹ thuật thay thế chuỗi nhanh.
