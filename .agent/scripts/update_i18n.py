import os, sys
# --- [Watchmen Core Injection] ---
_script_dir = os.path.dirname(os.path.abspath(__file__))
_agent_dir = os.path.abspath(os.path.join(_script_dir, ".."))
if _agent_dir not in sys.path:
    sys.path.insert(0, _agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass # Ignore for environment without watchmen_core, let the system handle it
# ---------------------------------

import os
import json
import re

locales_dir = "src/i18n/locales"
locales = ["en.json", "es.json", "fr.json", "it.json", "ja.json", "ko.json", "pt.json", "vi.json", "zh.json"]

vi_overrides = {
    "common.semantic_caching_layer": "Lớp Bộ Nhớ Đệm Ngữ Nghĩa",
    "common.industrial_grade_vector_cache_": "Bộ nhớ đệm vector cấp doanh nghiệp giúp loại bỏ các yêu cầu LLM trùng lặp.",
    "common.global_hit_rate": "Tỷ Lệ Trúng Bộ Nhớ Đệm Toàn Cục",
    "cache.hit_rate_tooltip": "Tỷ lệ các câu hỏi trùng lặp mà AI không cần phải suy nghĩ lại, giúp trả lời lập tức.",
    "common.hits_": "lần trúng /",
    "common.queries": "truy vấn",
    "common.est_savings": "Ước Tính Tiết Kiệm",
    "cache.savings_tooltip": "Số lượng Token (tài nguyên AI) mà bạn đã tiết kiệm được nhờ dùng lại câu trả lời cũ.",
    "common.ai_credits": "AI Credits",
    "common.direct_infrastructure_cost_avo": "Chi phí hạ tầng trực tiếp được tiết kiệm.",
    "common.total_queries_processed": "Tổng Truy Vấn Đã Xử Lý",
    "cache.total_queries_tooltip": "Tổng số lượng câu hỏi đã đi qua hệ thống tối ưu này.",
    "common.processed_through_semantic_lay": "Đã xử lý qua lớp ngữ nghĩa.",
    "common.top_cached_queries": "Các Truy Vấn Trúng Cache Hàng Đầu",
    "common.your_cache_is_warming_up_": "Bộ nhớ đệm của bạn đang được làm nóng.",
    "common.as_users_make_queries_saving": "Khi người dùng thực hiện truy vấn, thông tin tiết kiệm sẽ xuất hiện ở đây.",
    "common.top_cached_queries_by_task_t": "Các Truy Vấn Trúng Cache Theo Loại Tác Vụ",
    "common.task_type": "Loại Tác Vụ",
    "common.cache_hits": "Số Lần Trúng",
    "common.hit_rate": "Tỷ Lệ Trúng",
    "common.saved_tokens": "Token Tiết Kiệm",
    "common.global_settings": "Cài Đặt Toàn Cục",
    "common.contact_tenant_admin_to_adjust": "Liên hệ quản trị viên tenant để điều chỉnh luật bộ nhớ đệm.",
    "common.similarity_threshold_0_0_1_0_": "Ngưỡng Tương Đồng (0.0 - 1.0)",
    "cache.similarity_tooltip": "Độ khó tính khi so sánh 2 câu hỏi. Ví dụ 0.95 nghĩa là 2 câu hỏi phải giống hệt nhau tới 95% thì mới dùng lại câu trả lời cũ. Đặt số thấp sẽ dễ dùng lại câu trả lời cũ nhưng có thể sai ngữ cảnh.",
    "common.warning_low_threshold_can_lead": "Cảnh báo: ngưỡng thấp có thể dẫn đến kết quả sai lệch.",
    "common.higher_threshold_means_stricte": "Ngưỡng cao đồng nghĩa với việc khớp nghiêm ngặt hơn. Khuyến nghị 0.90 - 0.95 đối với các tác vụ yêu cầu tính thực tế.",
    "common.time_to_live_seconds_": "Thời Gian Tồn Tại (Giây)",
    "cache.ttl_tooltip": "Thời gian (tính bằng giây) mà câu trả lời cũ được hệ thống nhớ. Ví dụ: 3600 giây (1 giờ). Sau thời gian này, AI sẽ buộc phải suy nghĩ lại từ đầu để có câu trả lời mới.",
    "common.duration_before_a_cached_vecto": "Khoảng thời gian trước khi một vector bị xóa khỏi bộ nhớ đệm.",
    "common.task_specific_overrides": "Ghi Đè Theo Loại Tác Vụ",
    "common.similarity": "Độ Tương Đồng",
    "common.ttl_s_": "TTL (s)",
    "common.status": "Trạng Thái",
    "common.no_custom_overrides_set_using_": "Chưa có ghi đè tùy chỉnh. Đang sử dụng mặc định toàn cục.",
    "common.add_new_override": "Thêm Ghi Đè Mới",
    "common.e_g_summarization": "VD: summarization",
    "common.add": "Thêm",
    "common.clear_cache": "Xóa Bộ Nhớ Đệm",
    "common.permanently_delete_all_cached_": "Xóa vĩnh viễn tất cả các vector đã lưu. Thao tác này sẽ tạm thời làm tăng việc sử dụng token cho đến khi bộ nhớ đệm được làm nóng lại.",
    "common.hold_to_clear": "Giữ Để Xóa",
    "common.information_setting_limits": "Thông tin: Đặt giới hạn trên 100 Workflows hoặc 50 Skills sẽ vượt qua ngưỡng tiêu chuẩn của hệ thống. Vui lòng đảm bảo điều này khớp với thỏa thuận hợp đồng."
}

files_to_scan = [
    "src/features/dashboard/SemanticCacheDashboard.jsx",
    "src/features/dashboard/semantic-cache/CacheMetricsCards.jsx",
    "src/features/dashboard/semantic-cache/TopCachedQueriesTable.jsx",
    "src/features/dashboard/semantic-cache/CacheConfigForm.jsx",
    "src/features/dashboard/SuperadminDashboard.jsx"
]

extracted = {}
regex = re.compile(r't\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)')

for fpath in files_to_scan:
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
        matches = regex.findall(content)
        for key, val in matches:
            extracted[key] = val

for loc in locales:
    p = os.path.join(locales_dir, loc)
    if not os.path.exists(p):
        with open(p, "w") as f:
            f.write("{}")
            
    with open(p, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except:
            data = {}
            
    for key, val in extracted.items():
        if loc == "vi.json" and key in vi_overrides:
            data[key] = vi_overrides[key]
        elif key not in data:
            data[key] = val
            
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated 9 locales successfully.")
