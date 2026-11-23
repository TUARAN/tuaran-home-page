# 分支管理规范

适用于本仓库所有分支、PR 与 worktree，无论由站长本机、哪个 AI 工具还是聊天助手执行。后台 `/admin/branch-rules`（工程与运维 → 规划与交付 → 分支规范）直接读取本文件。与 [Issue 优先工作流](../runbooks/issue-first-workflow.md) 配合使用：该文件管“能不能开工、怎么合”，本文件管“分支怎么开、怎么收”。

分支名表达任务性质，不记录由哪个工具创建。同一件事的分支无论由 Codex、Cursor、Claude 还是助手开，前缀都按任务类型取，便于检索和归档。

## 基本模型

- 只有一条长期分支：`main`。不建 `develop`、`release` 等长期分支。
- 所有改动走短命分支，PR 经 squash 合回 `main`，分支寿命以天计。
- **开工隔离**：任务一开始就 `git worktree add -b <类型>/<任务名> <路径> origin/main`，在独立目录里写文件、提交、推送；不在主工作区直接写文件或提交。主工作区常被多个智能体共享，在其中 `checkout` 新分支不算隔离——目录相同，他人未提交改动仍混在一起；判断标准是目录形态（`.git` 为目录即主工作区），不是分支名。`pre-commit` 钩子拒绝主工作区的任何提交；站长明确要求在主工作区直接提交的小改动可用 `ALLOW_MAIN_COMMIT=1 git commit ...` 绕过。钩子只在本机 clone（`core.hooksPath=scripts/hooks`）生效，云端 VM 靠本条自觉。
- 合入 `main` 是否触发 Cloudflare Pages 生产构建，看 squash 提交说明是否以 `[CF-Pages-Skip]` 开头。规则见「预览与部署」。合并动作只由站长发出。助手不 squash、不 merge。
- 非琐碎改动不直接推 `main`。

## 预览与部署

Cloudflare Pages 的跳过方式只有一种：提交说明以 `[CF-Pages-Skip]` 开头。Pages 略过该次预览或部署。GitHub Actions 的 CI 仍会跑。不要写成 `[skip ci]`。

- 只有需要站长看过官方预览再说「合」的页面改动，才触发预览构建。公开站官方预览是 `tuaran`，后台站是 `tuaran-admin-git`。不是每个 Issue、PR 或推送都要预览。
- 纯文档、进度说明、中间变基、同分支连推：提交说明以 `[CF-Pages-Skip]` 开头。同分支上只有那一次需要站长看的页面提交不加标记。
- 合入 `main` 后同一标记继续生效。squash 说明以 `[CF-Pages-Skip]` 开头的提交，不作为完整的预览式生产部署。需要站长看过再合的页面改动，squash 说明不加该标记，合入后才走生产构建。
- 不改 Cloudflare 控制台，也不另造跳过机制。步骤见 [Issue 优先工作流](../runbooks/issue-first-workflow.md) 的「预览、内容与合并」。

## 命名

前缀白名单只有下面五个，按任务性质取，不按执行工具取：

| 前缀 | 用途 | 示例 |
| --- | --- | --- |
| `feat/<任务名>` | 新功能、体验调整 | `feat/x-home-reading-nav` |
| `fix/<任务名>` | 缺陷修复 | `fix/csdn-account-links` |
| `research/<主题>` | 单篇调研 | `research/bitverse` |
| `content/<任务名>` | 文章、资料稿、内容资产 | `content/weekly-rss` |
| `chore/<任务名>` | 运维、构建、依赖、巡检、文档 | `chore/security-scan-2026-11-23` |

历史遗留的 `codex/*`、`cursor/*`、`claude/*` 等工具前缀分支不再新开；已存在的按生命周期正常清理，不必改名。需要区分同一任务的多条分支时，用任务名区分，不要退回工具前缀。

- 一件事一个分支，一个分支一个 PR。几篇调研各开各的，不合并到同一个分支。
- 名称只写任务，不加 `-backup`、`-done`、`-v2` 之类后缀。需要保留旧版本时打 tag。

## 生命周期

1. 从最新的 `main` 开分支。
2. 在分支上提交，推送，开 PR。PR 正文按 Issue 优先工作流写 `Closes #N` 或 `Related: #N`。
3. CI 通过后等站长说“合”，在 **squash 合并之前** 给 PR 分支 tip 打 `archive/*` tag（见下文「合并前归档」），再 squash 合并。
4. 合并后当天清理：远端分支由 GitHub 自动删除，本地分支和 worktree 由本机清理；本机新打的 `archive/*` 推送到 `origin`。
5. 分支超过 7 天没有新提交：要么推进，要么按“归档”处理后删除。

## 数量上限

| 项目 | 上限 |
| --- | --- |
| 本地分支 | 10 个 |
| 同时存在的 worktree | 3 个，含主仓库 |
| 单个分支的存活时间 | 7 天无动静即处理 |

超过上限时，先清理再开新分支。

## 合并后清理

本仓库使用 squash 合并，`git branch --merged` 认不出已合并的分支，改用“远端已删除”判断：

```bash
git fetch --prune
git branch -vv | awk '/: gone]/{print $1}'
```

确认清单后再删除：

```bash
git branch -vv | awk '/: gone]/{print $1}' | xargs -r git branch -D
```

被 worktree 占用的分支删不掉，先移除 worktree：

```bash
git worktree list
git worktree remove <路径>
```

worktree 里有未提交文件时 git 会拒绝。先用 `git -C <路径> status` 看清楚：自动生成的快照可以加 `--force` 丢弃，手写内容先提交或备份。

## 合并前归档

本仓库 squash 合并后，`main` 历史呈一条线，分支名会从图谱里消失。为了在 SourceTree 等工具里仍能指回「合并前的 worktree / 分支线」，**每次 squash 合并前**都给该 PR 分支 tip 打 `archive/*` tag。tag 不占分支名额，也不替代 Issue / PR 正文里的任务说明。

推荐顺序（站长说「合」之后、执行 `gh pr merge` 之前）：

```bash
# 1) 取 PR 分支最后一次提交的 SHA（示例：PR #540）
SHA=$(gh pr view 540 --json commits --jq '.commits[-1].oid')
BRANCH=$(gh pr view 540 --json headRefName --jq .headRefName)

# 2) tag 名：去掉 feat/fix/research/content/chore 及历史 codex|cursor|claude 前缀
#    feat/x-home-reading-nav → archive/x-home-reading-nav

git tag archive/<名称> "$SHA"
# 可选：附 PR / Issue，便于在标签列表里辨认
# git tag -a archive/<名称> "$SHA" -m "PR #540 · $BRANCH · Closes #539"

# 3) 再 squash 合并并删远端分支；随后本地 worktree / gone 分支照旧清理

# 4) 批量合并后推送 tag（避免 tag 只留在本机）
git push origin --tags
```

若分支已删、只剩 GitHub 记录，可从已合并 PR 的 commits 最后一项取 `oid` 补打 tag（与上表相同）。

恢复临时查看线（不长期占分支名额）：

```bash
git branch <分支名> archive/<名称>
# 看完可删：git branch -D <分支名>
```

- **与 PR 的对应关系**：权威叙事仍在 GitHub PR / Issue；`archive/*` 是合并前代码状态的 SHA 书签。
- **不做的事**：不为「图上好看」长期保留已合并的远程分支；不把执行工具名写进 tag（与分支命名一致）。

## 归档

除「合并前归档」外，对**尚未合并**、但超过 7 天无提交或不确定是否还要用的分支，也可先打 `archive/*` 再删本地分支：

```bash
git tag archive/<名称> <分支名>
git branch -D <分支名>
```

- tag 名去掉任务类型前缀，例如 `content/weekly-rss` → `archive/weekly-rss`。
- 删除分支前确认 tag 已指向预期提交；已合并的 PR 优先用「合并前归档」流程，避免漏打。

## 工作区卫生

- `public/data/memory/` 下的加密快照由 `pre-push` 钩子自动生成，会让每个 worktree 都显示“有未提交改动”。提交时只暂存任务相关文件，不把快照混进功能提交。
- `lib/research/styleAudit.js` 由 `npm run research:style-audit` 生成，文件头写明不要手改。它只在调研批量治理的 PR 里提交。
- worktree 只用于并行任务。任务结束当天移除，不长期保留。
- 本地 Codex 与聊天助手并行时，同一条 Issue 只走一条落地路径，不为同一件事再开第二个分支。

## 不做的事

- 不引入 GitFlow 或 release 分支。
- 不对个人站强制多人 review。站长在 squash 前确认即是 review。
- 不用 `git push --force` 改写 `main`。
- 不在 `main` 上直接提交非琐碎改动。

## 每周自检

每周或每次合并一批 PR 后执行一次：

1. `git fetch --prune`
2. 核对刚合并的 PR 是否都有对应 `archive/*` tag；缺则从 PR commits 补打并 `git push origin --tags`。
3. 按“合并后清理”处理远端已删除的分支。
4. `git branch | wc -l` 与 `git worktree list`，确认没有超过上限。
5. 对超过 7 天没动的分支，二选一：推进，或归档后删除。
