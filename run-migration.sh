#!/bin/bash
# run-migration.sh: Lệnh Migration tự động từ BMAD-DragonBall sang AI-Embedded Light DMS

SOURCE_DIR="/Users/hatrang20061988/Desktop/AI Project/BMAD-DragonBall"
TARGET_DIR="/Users/hatrang20061988/Desktop/AI Project/AI-Embedded Light DMS"
BACKUP_DIR="$TARGET_DIR/_bmad_backup_v1"

echo "=========================================================="
echo "🚀 Khởi chạy quá trình Migration BMAD-DragonBall -> Light DMS 🚀"
echo "=========================================================="
echo "Thư mục gốc (Source): $SOURCE_DIR"
echo "Thư mục đích (Target): $TARGET_DIR"
echo ""

if [ ! -d "$TARGET_DIR" ]; then
    echo "❌ LỖI: Không tìm thấy dự án Light DMS tại: $TARGET_DIR"
    exit 1
fi

echo "🔹 [Phase 1: Khảo sát & Backup] Đang sao lưu dữ liệu lõi cũ của Light DMS..."
mkdir -p "$BACKUP_DIR"

# Backup .agent, templates, scripts, _bmad (nếu tồn tại)
for DIR in ".agent" "templates" "scripts" "_bmad"; do
    if [ -d "$TARGET_DIR/$DIR" ]; then
        cp -R "$TARGET_DIR/$DIR" "$BACKUP_DIR/"
        echo "   ✔️ Đã lưu trữ $DIR"
    fi
done
echo "✅ Quá trình backup an toàn hoàn tất tại: $BACKUP_DIR"
echo ""

echo "🔹 [Phase 2: Ghi đè Cốt lõi (Core Injection)] Đang đồng bộ khung Golden Auto-Chain..."

# Chép đè Agent, Scripts, và Templates. Sử dụng rsync để không làm hỏng file mà copy gộp
if [ -d "$SOURCE_DIR/.agent" ]; then
    echo "   📦 Đang chép đè hệ thống Agents (.agent)..."
    rsync -av --exclude='.DS_Store' "$SOURCE_DIR/.agent/" "$TARGET_DIR/.agent/" > /dev/null
fi

if [ -d "$SOURCE_DIR/scripts" ]; then
    echo "   📦 Đang chép đè nhóm thư viện Scripts..."
    rsync -av --exclude='.DS_Store' "$SOURCE_DIR/scripts/" "$TARGET_DIR/scripts/" > /dev/null
fi

if [ -d "$SOURCE_DIR/templates" ]; then
    echo "   📦 Đang chép đè hệ thống Templates..."
    rsync -av --exclude='.DS_Store' "$SOURCE_DIR/templates/" "$TARGET_DIR/templates/" > /dev/null
fi

# Chép thư mục _bmad/bmm/workflows (Lưu ý, không đụng vào bmm/config.yaml của dự án Light DMS)
if [ -d "$SOURCE_DIR/_bmad/bmm/workflows" ]; then
    echo "   📦 Đang đồng bộ thư mục workflows..."
    rsync -av --exclude='.DS_Store' "$SOURCE_DIR/_bmad/bmm/workflows/" "$TARGET_DIR/_bmad/bmm/workflows/" > /dev/null
fi
if [ -d "$SOURCE_DIR/_bmad/core" ]; then
    echo "   📦 Đang đồng bộ thư mục lõi bmad..."
    rsync -av --exclude='.DS_Store' "$SOURCE_DIR/_bmad/core/" "$TARGET_DIR/_bmad/core/" > /dev/null
fi


echo "✅ Quá trình ghi đè hoàn tất!"
echo ""
echo "🔥 XONG! Dự án AI-Embedded Light DMS đã được cập nhật toàn bộ Hệ sinh thái BMAD Tối thượng (19 Personas & Golden Auto-Chain)."
echo "🚀 Hãy kiểm tra các thư mục để chắc chắn và chạy thử một luồng /sprint-runner bên Light DMS nhé."
