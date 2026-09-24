---
name: ghost-file-guardian
description: "Ph\xE1t hi\u1EC7n v\xE0 thanh t\u1EA9y Ghost Files (hi\u1EC7n t\u01B0\
  \u1EE3ng r\xE1c v\u1EADt l\xFD \u0111a nh\xE1nh)"
---
# Ghost File Guardian

Giao thức này xử lý hiện tượng "Bóng ma Worktree" (Ghost Files) - xảy ra khi các file thuộc Story cũ vẫn nằm vật lý dưới dạng Untracked/Modified trong nhánh hiện tại dù đã được Merge lên Master từ nhánh khác.

**Khi nào cần sử dụng:**
- Khi user yêu cầu dọn dẹp môi trường (Workspace Hygiene).
- Khi Strict Staging Gate cảnh báo rớt code nhưng user khẳng định code đã hoàn thành.

**Cách kích hoạt:**
Agent chạy lệnh bash:
```bash
bash .agent/scripts/ghost-file-buster.sh src/ prisma/ server/ tests/
```
