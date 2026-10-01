#!/usr/bin/env python3
import os
import sys

# Inject Watchmen Core
script_dir = os.path.dirname(os.path.abspath(__file__))
agent_dir = os.path.abspath(os.path.join(script_dir, ".."))
if agent_dir not in sys.path:
    sys.path.insert(0, agent_dir)

try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    print("⚠️  [Watchmen] Cảnh báo: watchmen_core module không tìm thấy, bỏ qua xác thực chữ ký (Development Mode).")

import subprocess
import time

def get_host_repo():
    try:
        common_dir = subprocess.check_output(['git', 'rev-parse', '--git-common-dir']).decode('utf-8').strip()
        if common_dir.endswith('.git'):
            return os.path.dirname(os.path.abspath(common_dir))
        return os.path.abspath(common_dir)
    except Exception:
        return os.getcwd()

def main():
    print("🛡️  [Category A Gate] Bắt đầu thực thi Zero-Trust SSOT Backup...")
    
    host_repo = get_host_repo()
    script_path = os.path.join(host_repo, ".agent/scripts/ssot-backup.sh")
    backup_dir = os.path.join(host_repo, ".agent/backups")
    
    # 1. Physical Presence Check
    if not os.path.exists(script_path):
        print(f"❌ FATAL ERROR: Không tìm thấy {script_path}!")
        print("💡 Giải quyết: Nhánh hiện tại chưa được cập nhật kiến trúc V4. Vui lòng chạy lệnh: git pull origin master")
        sys.exit(1)
        
    # Ghi nhận trạng thái thư mục backup trước khi chạy
    old_backups = set()
    if os.path.exists(backup_dir):
        old_backups = set(f for f in os.listdir(backup_dir) if f.endswith('.tar.gz'))
        
    # 2. Thực thi Bash script bảo mật
    print(f"🚀 Đang chạy {script_path}...")
    try:
        result = subprocess.run(
            ["bash", script_path],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"❌ FATAL ERROR: Script backup thất bại với mã lỗi {e.returncode}!")
        print(e.stdout)
        sys.exit(1)
        
    # 3. Validation & Physical Evidence (Anti-Hallucination)
    if not os.path.exists(backup_dir):
        print("❌ FATAL ERROR: Thư mục backup không được tạo!")
        sys.exit(1)
        
    new_backups = set(f for f in os.listdir(backup_dir) if f.endswith('.tar.gz'))
    created_files = new_backups - old_backups
    
    if created_files:
        new_file = list(created_files)[0]
        file_path = os.path.join(backup_dir, new_file)
        size_mb = os.path.getsize(file_path) / (1024 * 1024)
        print(f"✅ BẰNG CHỨNG VẬT LÝ: Đã tạo thành công {new_file} ({size_mb:.2f} MB)")
    else:
        print("✅ BẰNG CHỨNG VẬT LÝ: Không có file mới nào được tạo (Holiday Amnesia - Không có thay đổi so với bản trước).")
        
    print("✅ [Category A Gate] PASS. Cho phép tiếp tục workflow.")

if __name__ == "__main__":
    main()
