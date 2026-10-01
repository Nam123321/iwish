---
name: sync-ssot-worktree
description: Creates and refreshes a symlink for _iwish-output from the main repository to the current worktree to share untracked SSOT files.
---

# Sync SSOT Worktree

## Purpose
Khi làm việc với `git worktree`, các thư mục bị đưa vào `.gitignore` như `_iwish-output` sẽ không được copy sang worktree mới. Skill này tự động xử lý việc untrack các file rác, xóa/backup thư mục local và tạo Symlink trỏ trực tiếp về thư mục `_iwish-output` của repo gốc. Điều này đảm bảo tất cả các worktree đều đọc/ghi vào một nguồn Single Source of Truth (SSOT) duy nhất.

## Hướng dẫn thực thi (Execution Steps)

Khi user yêu cầu refresh hoặc link SSOT (Hydration), Agent CẦN thực hiện chính xác kịch bản bash sau:

```bash
# 1. Xác định đường dẫn Repo gốc (Main Workspace)
MAIN_REPO=$(dirname "$(git rev-parse --git-common-dir)")
echo "🔗 Gốc dự án: $MAIN_REPO"

# [ZERO-TRUST GATE]: Ngăn chặn việc chạy nhầm ở repo gốc (Main Repo)
if [ "$PWD" = "$MAIN_REPO" ]; then
    echo "❌ FATAL: Bạn đang ở thư mục gốc (Main Repo)!"
    echo "Lệnh này sẽ biến thư mục thật thành Symlink vòng lặp và GÂY MẤT DỮ LIỆU."
    echo "Chỉ được phép chạy lệnh này bên trong các Worktree. Dừng thực thi!"
    exit 1
fi

# 2. Danh sách các thư mục SSOT Runtime (Tuyệt đối KHÔNG chứa Code/Skill)
# [CRITICAL UPDATE]: Chỉ symlink thư mục untracked (_iwish-output). 
# KHÔNG symlink .agent/skills hay .agent/workflows vì chúng là source code được Git track. 
# Nếu symlink chúng, khi commit sẽ gây lỗi typechange và xóa mất file gốc khi merge!
TARGETS=("_iwish-output")

for TARGET in "${TARGETS[@]}"; do
    echo "🔄 Processing $TARGET..."
    
    # Xử lý an toàn: Không dùng rm -rf trực tiếp để tránh mất dữ liệu
    if [ -e "$TARGET" ] && [ ! -L "$TARGET" ]; then
        echo "   - Backup local directory to ${TARGET}.bak"
        mv "$TARGET" "${TARGET}.bak"
    elif [ -L "$TARGET" ]; then
        echo "   - Unlinking old symlink"
        unlink "$TARGET"
    fi
    
    # Tạo Absolute Symlink
    echo "   - Creating Absolute Symlink..."
    ln -s "$MAIN_REPO/$TARGET" "$TARGET"
    
    # Kiểm tra tính toàn vẹn của Symlink
    if [ -L "$TARGET" ]; then
        echo "   ✅ Success: $TARGET -> $MAIN_REPO/$TARGET"
        # [DATA LOSS PREVENTION]: Cố tình KHÔNG xóa file .bak bằng lệnh rm -rf.
        # Nếu Agent/User lỡ tạo story trước khi sync, file sẽ nằm trong .bak để họ tự lấy lại.
        echo "   ℹ️ Note: Bản backup ${TARGET}.bak được giữ lại (nếu có) để chống mất dữ liệu."
        touch -h "$TARGET" # Refresh IDE UI
    else
        echo "   ❌ Fatal Error: Failed to create symlink for $TARGET"
        # Phục hồi backup nếu lỗi
        mv "${TARGET}.bak" "$TARGET" 2>/dev/null || true
    fi
done

# 3. Tạo Searchable Symlink (Alias) cho IDE Antigravity 2.0
# _SSOT không nằm trong .gitignore nên IDE sẽ index toàn bộ file để @mention và Search.
echo "🔍 Creating Searchable Symlink _SSOT for IDE indexing..."
if [ -L "_SSOT" ]; then
    unlink _SSOT
fi
ln -s _iwish-output _SSOT
touch -h _SSOT
echo "✅ Hydration Complete! Bạn có thể dùng @_SSOT/ để search tài liệu."
```

## Anti-Pattern Cần Tránh
- Tuyệt đối cấm Agent tự ý ghi (write) tài liệu trực tiếp vào `_SSOT/...`.
- `_SSOT` chỉ dùng cho người dùng (User) `@mention` và search.
- Khi làm việc với file, Agent bắt buộc phải thao tác qua đường dẫn vật lý thực: `_iwish-output/...` hoặc `.agent/...`.
