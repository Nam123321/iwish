---
name: approve-qa
description: Approve a manual test and complete the story
category: implementation
roles:
  - orch-agent
steps:
  - id: step-01-read-state
    description: "Read `.agent/cache/qa-loop.json` to identify the pending story."
  - id: step-02-update-status
    description: "Transition story to `completed` in `sprint-status.yaml` and `story.md`."
  - id: step-03-inject-node
    description: "Run `iwish inject-node` to persist the completed story to the knowledge graph."
  - id: step-04-github-sync
    description: "Execute git commit and push to synchronize the completed status to GitHub."
  - id: step-05-release-pipeline
    description: "Check Epic completion and trigger Release Pipeline (Canary, Version, Changelog)."
  - id: step-06-cleanup
    description: "Clear or archive the `.agent/cache/qa-loop.json` state."
---

# Approve QA Human Cross-Check

This workflow is executed when a human manually approves a QA test that is in the `Pending_Approval` state (Human Cross-Check Gate).

## Step 1: Read Loop State
- Agent reads `.agent/cache/qa-loop.json`.
- Verify that `status` is `Pending_Approval`.
- Extract the `story_id`.

## Step 2: Update Status
- Agent modifies the physical `story.md` file (e.g., `_iwish-output/stories/story-{id}.md` or the hierarchical path):
  - Run `python3 .agent/scripts/update-story-status.py <path_to_story.md> completed` to update the status in the OKF frontmatter safely.
- Agent executes the SSOT Master Sync to auto-propagate the change to `sprint-status.yaml` and `epic.md` tables:
  - Run `python3 .agent/scripts/sync_all_statuses.py`

## Step 3: Knowledge Graph & SSOT Synchronization (Post-Completion)
- Agent MUST synchronize all data layers. **[Edge Case Defense]** Graph synchronization errors MUST be treated as non-fatal warnings and MUST NOT abort the overall flow or revert the `completed` status:
  0. **SSOT Backup Zero-Trust (Category A Gate):** You MUST execute the strictly deterministic Python validation wrapper. Run `python3 .agent/scripts/execute-approve-qa-backup.py`. This script handles physical presence checks, execution, and output validation. If exit code != 0, you MUST HALT the workflow immediately and report the terminal output. You are strictly FORBIDDEN from using git commands inside _iwish-output.
  1. **Background Indexing:** Execute `nohup iwish code-graph --fast > _iwish-output/adhoc-workspace/scratch/codegraph.log 2>&1 &` and `nohup iwish featuregraph-index > _iwish-output/adhoc-workspace/scratch/featuregraph.log 2>&1 &` (or use `--queue`) to prevent synchronous execution from hanging the workflow. **[ERROR REPORTING RULE]** You MUST inform the user in your final message to check these log files in case of silent failures (e.g., API limits or deprecated models). DO NOT discard errors to `/dev/null`.
  2. **Safe JSON Injection:** Write the node metadata to a temporary file (e.g., `echo '{"summary": "Story <story_id> completed", "tags": ["story", "completed"]}' > temp_metadata.json`) and then execute `iwish inject-node --file "<path_to_story.md>" --metadata-file temp_metadata.json || true && rm -f temp_metadata.json`. NEVER use inline JSON in the bash command to prevent command injection or parsing errors.

## Step 3.5: NotebookLM Layer 3 Sync (MANDATORY)
- Because the story is now `completed`, its final state MUST be pushed to the Layer 3 Epic Context notebook.
- Load `knowledge-collector` skill.
- Execute NLM Upsert Protocol (see `.agent/fragments/nlm-upsert-protocol.md`):
  1. Resolve the target Layer 3 notebook via `resolve-notebook-targets.py --context-type story --context-id <story_id>`.
  2. Call `source_list_drive` → save evidence to `nlm_evidence_list.json`.
  3. If source exists: call `source_delete` → save evidence to `nlm_evidence_delete.json` → inline assert success.
  4. Call `source_add` with the full text of the completed `story.md` → save evidence to `nlm_evidence_add.json`.
  5. Update `sync_sources` via `registry_crud_manager.py upsert_source '<json>'`.
- **[ZERO-TRUST GATE]** Aggregate all evidence files and run:
  `python3 .agent/scripts/pipeline-integrity-runner.py --target "project" --type project --phase discovery --mode aggregate _iwish-output/adhoc-workspace/scratch/`
  If fails → HALT.

## Step 3.7: Lessons Capture (MANDATORY)
- Agent MUST automatically capture any lessons learned during the QA loop.
- Run `python3 .agent/scripts/extract-review-lessons.py --story-id <story_id>`

## Step 4: GitHub Auto-Sync, PR & Worktree Cleanup (MANDATORY)
- **[PRE-FLIGHT HYGIENE CHECK]** Trước khi thực hiện bất kỳ lệnh Git nào, Agent BẮT BUỘC phải dọn rác và rà soát lỗi rớt code bằng kịch bản sau:
  ```bash
  # [HYGIENE & ZERO-LOSS SWEEP] Tự động hốt rác, gom logs, dọn scripts và tái cấu trúc SSOT
  echo "🧹 [HYGIENE SWEEP] Kích hoạt Workspace Hygiene Guardian..."
  python3 .agent/scripts/workspace-janitor.py --auto-clean --enforce-structure
  
  # [STRICT STAGING GATE] Phanh khẩn cấp chống rớt Core Code (Nhóm 4)
  echo "🛡️ Đang rà soát Code Lõi bị bỏ quên..."
  # Chỉ kiểm tra các thư mục thực sự tồn tại để tránh lỗi Git pathspec fatal
  TARGET_DIRS=""
  for d in src/ prisma/ server/ tests/; do
    [ -d "$d" ] && TARGET_DIRS="$TARGET_DIRS $d"
  done
  
  if [ -n "$TARGET_DIRS" ]; then
    DIRTY_CORE=$(git status --porcelain $TARGET_DIRS)
    if [ -n "$DIRTY_CORE" ]; then
      echo "❌ [STRICT STAGING GATE] THẢM HỌA RỚT CODE: Phát hiện Code lõi / Database có thay đổi chưa được Commit!"
      echo "$DIRTY_CORE"
      echo "Vui lòng dùng Agent Dev để commit nốt hoặc xóa các file này đi trước khi chạy lại /approve-qa."
      exit 1
    fi
  fi
  echo "✅ Không có code rớt. Tiếp tục merge..."
  ```
- **[DATA LOSS PREVENTION RULE]** Because the story is now fully completed, you BẮT BUỘC (MUST) automatically sync the state to GitHub immediately. 
- The **Orchestrator Agent** (you) MUST use `git status` to identify ALL files related to the story.
- To prevent **Cross-Contamination** (staging unrelated/garbage files), you MUST strictly filter the `git status` output and only stage files whose path matches the story's boundary (e.g., contains the Epic/Story ID).
- **[ZERO-TRUST SYNC]** Before pushing, ensure the branch is up-to-date with master without breaking OS-level locks:
  Agent MUST execute: `python3 .agent/scripts/worktree-guard.py sync "$(git rev-parse --show-toplevel)"`
  *(This safely unlocks .agent/scripts, merges master to prevent PR conflicts, and relocks it).*
  **[CRITICAL]** If exit code != 0 (e.g., merge conflict), you MUST HALT immediately and ask the user to resolve conflicts. DO NOT proceed to git push.
- Execute the scope-based staging and commit: `git add <file1> ... && git commit -m "feat(story_{id}): completed" && git push origin HEAD`. NEVER use `git add .` to avoid dirty workspace commits.
- **[WORKTREE END-OF-LIFE]** If the agent is operating inside a parallel worktree (verify via `git worktree list`), execute the following teardown commands:
  ```bash
  # 1. Create PR targeting master (or main)
  BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
  gh pr create --base master --head "${BRANCH_NAME}" \
    --title "feat(${STORY_ID}): <title>" \
    --body "Implements ${STORY_ID}."
  ```

- **[LAYER 3 FEEDBACK LOOP] (Self-Healing PR Checks):**
  After creating the PR, the Agent MUST execute the following robust monitoring logic to check Layer 3 CI/CD status (incorporating TOCTOU, Concurrency, and Silent Death defenses):

  ```bash
  # 1. Atomic SHA lock to prevent TOCTOU on CI checks
  TARGET_SHA=$(git rev-parse HEAD)
  
  # Bọc timeout 15 phút để chống Deadlock nếu GitHub CI bị treo
  if timeout 15m gh pr checks "${TARGET_SHA}" --required --watch; then
    echo "✅ [Watchmen Layer 3] PR Passed!"
  else
    echo "❌ [Watchmen Layer 3] CI Failed. TCB tampered. Initiating Recovery Protocol (Max Retries = 1)..."
    
    # Agent MUST dynamically trigger these workflows before continuing:
    # 1. /sync-ssot-worktree (to pull pristine scripts from master)
    # 2. /watchmen-sync (to re-secure and re-sign)
    
    # 2. Strict Scoping Commit (An toàn với set -e)
    git add .agent/config/scripts-lock.*
    if ! git diff --staged --quiet; then
      git commit -m "chore(security): restore TCB and re-sync watchmen"
    fi
    NEW_TARGET_SHA=$(git rev-parse HEAD)
    
    # 3. Concurrency Trap (Push Race Condition)
    if ! git push origin "${NEW_TARGET_SHA}:${BRANCH_NAME}" --force-with-lease; then
      gh pr comment "${BRANCH_NAME}" --body "⚠️ [Watchmen] Phát hiện có commit mới từ Dev trùng thời điểm. Tiến trình tự phục hồi bị hủy (Graceful Abort) để bảo vệ code của Dev."
      exit 1
    fi
    
    # 4. Final CI Check & Silent Death UX Fix (Max Retries = 1)
    if ! timeout 15m gh pr checks "${NEW_TARGET_SHA}" --required --watch; then
      gh pr comment "${BRANCH_NAME}" --body "❌ [Watchmen TCB] Lỗi nghiêm trọng: Đã thử tự phục hồi chữ ký nhưng CI vẫn từ chối hoặc Timeout. Yêu cầu Dev can thiệp thủ công (Chạy /watchmen-sync)."
      exit 1
    fi
    
    echo "✅ [Watchmen Layer 3] Self-Healing Successful. PR Passed!"
  fi
  ```

  ```bash
  # 2. Hướng dẫn User dọn dẹp Worktree an toàn (Chỉ hiển thị khi PR đã PASS 100%)
  echo "Vui lòng mở Terminal tại thư mục gốc (Master Repo) và chạy lệnh sau để dọn dẹp worktree an toàn:"
  echo "python3 .agent/scripts/worktree-guard.py remove <đường_dẫn_thư_mục_worktree>"
  ```

## Step 5: Release Pipeline Trigger
- Evaluate if this story completes the Epic.
- If it is the final story in an Epic, trigger the Release Pipeline:
  1. **[ZERO-TRUST GATE] Release Readiness:** Run `python3 .agent/scripts/validate-release-readiness.py <epic_id>`. This checks if all stories in the Epic are completed. If exit code 1, HALT and do not release.
  2. `python3 .agent/scripts/semver-bump.py --epic <epic_id>` (Version Bump)
  3. `python3 .agent/scripts/generate-changelog.py --epic <epic_id>` (Changelog Auto-gen)
  4. Load `land-and-deploy/SKILL.md` to deploy.
  5. Load `canary/SKILL.md` for platform auto-detect and canary deployment.

## Step 6: Auto-fix Loop Resumption (Retrospective Trigger)
- Agent MUST check if this story was part of a Retro Auto-fix Loop.
- Run `python3 .agent/scripts/update-pending-retro-fixes.py --resolve <story_id>`
- Evaluate the exit code of the script:
  - If exit code is 2: **ALL risks for the Epic have been cleared.** The Agent MUST automatically trigger `/iwish-feature-retrospective` to re-evaluate the Epic.
  - If exit code is 0: There are still other pending risks, or this story wasn't part of the block list. DO NOT trigger retrospective yet to avoid spamming.

## Step 7: Cleanup
- Agent deletes or clears the `.agent/cache/qa-loop.json` file.
- Agent halts execution and notifies the user: *"Story {id} has been fully completed, injected into the Knowledge Graph, and synced to GitHub."*
