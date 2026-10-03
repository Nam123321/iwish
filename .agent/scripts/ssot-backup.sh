#!/bin/bash
set -u

# 0. Giải quyết Symlink an toàn tuyệt đối
SCRIPT_PATH=$(readlink -f "$0" 2>/dev/null || echo "$0")
cd "$(dirname "$SCRIPT_PATH")/../.." || exit 1

# [VÁ LỖI ZERO-TRUST]: Đảm bảo Backup chạy trên Host Repo gốc
COMMON_DIR=$(git rev-parse --git-common-dir)
if [[ "$COMMON_DIR" == *.git ]]; then
    HOST_REPO=$(dirname "$COMMON_DIR")
else
    # Fallback cho Bare Repo
    HOST_REPO="$COMMON_DIR"
fi

cd "$HOST_REPO" || {
    echo "🚨 LỖI: Không thể chuyển hướng về Host Repo ($HOST_REPO)."
    exit 1
}

BACKUP_DIR=".agent/backups"
LOCK_DIR="$BACKUP_DIR/.lock"
PID_FILE="$LOCK_DIR/pid"
STAGING_DIR=".staging"
MAX_BACKUPS=20

mkdir -p "$BACKUP_DIR"

# 1. Bẫy Deadlock & Lấy lại Lock (Forever Deadlock Rescue & Local Mutex)
TIMEOUT=30
ELAPSED=0
LOCK_ACQUIRED=false

while [ $ELAPSED -lt $TIMEOUT ]; do
    if mkdir "$LOCK_DIR" 2>/dev/null; then
        LOCK_ACQUIRED=true
        break
    else
        # Thử đọc PID của tiến trình giữ lock (Có sleep nhỏ chống Race Condition EC-P3-02)
        sleep 1
        if [ -f "$PID_FILE" ]; then
            LOCK_PID=$(cat "$PID_FILE")
            if ! kill -0 "$LOCK_PID" 2>/dev/null; then
                echo "Phát hiện Stale Lock từ PID $LOCK_PID đã chết. Tiến hành cướp lock!"
                rm -rf "$LOCK_DIR"
                continue # Thử tạo lại lock ở vòng lặp tiếp theo
            fi
        else
            echo "Phát hiện Lock nhưng không có PID_FILE. Xóa Lock rác..."
            rm -rf "$LOCK_DIR"
            continue
        fi
        
        echo "Đang chờ Lock... ($ELAPSED/$TIMEOUT giây)"
        sleep 2
        ELAPSED=$((ELAPSED + 2))
    fi
done

if [ "$LOCK_ACQUIRED" = false ]; then
    echo "🚨 LỖI: Không thể lấy Lock sau $TIMEOUT giây. Hủy bỏ backup để tránh xung đột."
    osascript -e 'display notification "Lỗi kẹt Lock SSOT Backup!" with title "I-Wish Backup Failed"' 2>/dev/null
    exit 1
fi

# Ghi PID ngay sau khi lấy Lock thành công
echo $$ > "$PID_FILE"

# 2. Bảo vệ Lock an toàn tuyệt đối (Blind Trap)
trap "rm -rf \"$LOCK_DIR\"" EXIT

echo "Khởi chạy quá trình Backup SSOT..."

# 3. Chống Vòng lặp Nổ Ổ Cứng (Recursive Explosion)
mkdir -p "$STAGING_DIR"

rsync -a --copy-links --delete \
    --exclude='.git/' \
    --exclude='node_modules/' \
    --exclude='.agent/backups/' \
    --exclude='.staging/' \
    --exclude='.DS_Store' \
    _iwish-output/ "$STAGING_DIR/"

# 4. Ngăn chặn Rác Dữ Liệu (Rsync Failure Cascade)
RSYNC_EXIT_CODE=$?
if [ $RSYNC_EXIT_CODE -ne 0 ]; then
    echo "🚨 LỖI: rsync thất bại với mã lỗi $RSYNC_EXIT_CODE. Dừng backup ngay lập tức để bảo vệ an toàn dữ liệu!"
    osascript -e 'display notification "Lỗi rsync SSOT Backup!" with title "I-Wish Backup Failed"' 2>/dev/null
    exit 1
fi

# 5. Chống Sao lưu Mù (Holiday Amnesia Diffing)
# So sánh với bản nén mới nhất (nếu có)
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/ssot-*.tar.gz 2>/dev/null | head -n 1)
if [ -n "$LATEST_BACKUP" ]; then
    # Giải nén bản mới nhất ra một thư mục tạm để so sánh diff
    TMP_COMPARE_DIR=$(mktemp -d)
    tar -xzf "$LATEST_BACKUP" -C "$TMP_COMPARE_DIR"
    
    if diff -r "$STAGING_DIR" "$TMP_COMPARE_DIR" >/dev/null 2>&1; then
        echo "✅ Không có thay đổi dữ liệu nào kể từ bản backup trước. Bỏ qua backup lần này (Holiday Amnesia)."
        rm -rf "$TMP_COMPARE_DIR"
        exit 0
    fi
    rm -rf "$TMP_COMPARE_DIR"
fi

# 6. Chống ghi đè Timestamp
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="$BACKUP_DIR/ssot-${TIMESTAMP}_$$.tar.gz"
TMP_BACKUP_FILE="/tmp/ssot-${TIMESTAMP}_$$.tar.gz"

echo "Đang nén dữ liệu vào $TMP_BACKUP_FILE..."
tar -czf "$TMP_BACKUP_FILE" -C "$STAGING_DIR" .

if [ $? -eq 0 ]; then
    mv "$TMP_BACKUP_FILE" "$BACKUP_FILE"
    echo "✅ Backup thành công: $BACKUP_FILE"
    
    # 7. Quantity-based Retention
    ls -t "$BACKUP_DIR"/ssot-*.tar.gz | tail -n +$((MAX_BACKUPS + 1)) | tr '\n' '\0' | xargs -0 rm -f 2>/dev/null
else
    rm -f "$TMP_BACKUP_FILE"
    echo "🚨 LỖI: Nén dữ liệu thất bại!"
    osascript -e 'display notification "Lỗi nén tar SSOT Backup!" with title "I-Wish Backup Failed"' 2>/dev/null
    exit 1
fi
