# 分支管理规范

适用于本仓库所有分支、PR 与 worktree，无论由站长本机、哪个 AI 工具还是聊天助手执行。后台 `/admin/branch-rules`（工程与运维 → 规划与交付 → 分支规范）直接读取本文件。与 [Issue 优先工作流](../runbooks/issue-first-workflow.md) 配合使用：该文件管“能不能开工、怎么合”，本文件管“分支怎么开、怎么收”。

分支名表达任务性质，不记录由哪个工具创建。同一件事的分支无论由 Codex、Cursor、Claude 还是助手开，前缀都按任务类型取，便于检索和归档。

## 基本模型

- 只有一条长期分支：`main`。不建 `develop`、`release` 等长期分支。
- 所有改动走短命分支，PR 经 squash 合回 `main`，分支寿命以天计。
- **开工隔离**：任务在独立 worktree 里写文件、提交、推送；不在主工作区直接写文件或提交。主仓（`.git` 为目录）执行 `npm run worktree:add -- <类型> <任务名>`，会 `worktree add` 并把卫星目录的 `node_modules` 链到主仓那一份。等价原语：`git worktree add -b <类型>/<任务名> <路径> origin/main`，再加 `npm run worktree:link-deps`（在卫星目录）。主工作区常被多个智能体共享，在其中 `checkout` 新分支不算隔离——目录相同，他人未提交改动仍混在一起。`pre-commit` 钩子拒绝主工作区的任何提交；站长明确要求在主工作区直接提交的小改动可用 `ALLOW_MAIN_COMMIT=1 git commit ...` 绕过。钩子只在本机 clone（`core.hooksPath=scripts/hooks`）生效，云端 VM 靠本条自觉。
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
- 名称只写任务，不加 `-backup`、`-done`、`-v2` 之类后缀。需要保留旧版本时按「归档」推到 `refs/archive/*`，不另开分支，也不打标签。

## 生命周期

1. 从最新的 `main` 开分支。
2. 在分支上提交，推送，开 PR。PR 正文按 Issue 优先工作流写 `Closes #N` 或 `Related: #N`。
3. CI 通过后等站长说“合”，再 squash 合并。合并前的分支线由 GitHub 的 `refs/pull/<N>/head` 保留，不另打标签（见下文「合并后追溯」）。
4. 合并后当天清理：远端分支由 GitHub 自动删除，本地分支和 worktree 由本机清理。
5. 分支超过 7 天没有新提交：要么推进，要么按“归档”处理后删除。

## 数量上限

| 项目 | 上限 |
| --- | --- |
| 本地分支 | 10 个 |
| 同时存在的 worktree | 5 个，含主仓库 |
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

## 合并后追溯

本仓库 squash 合并后，`main` 历史呈一条线，分支名会从 SourceTree 等工具的图谱里消失。GitHub 为每个 PR 永久保留 `refs/pull/<N>/head`，指向 PR 分支的最后一次提交；远端分支删除后这个引用仍在。经 PR 合并的分支线以它为准，合并前后都不另打标签。

需要在本机重新看某条已合并的分支线：

```bash
# 拉回 PR #540 的分支线，临时建一个本地分支查看
git fetch origin pull/540/head:<分支名>
# 看完删除，不长期占分支名额
git branch -D <分支名>
```

需要在 SourceTree 等工具里一次看到全部 PR 分支线，可以把所有 PR 引用拉到本机的 `refs/pull/` 命名空间。它们不算分支，不占数量上限：

```bash
git fetch origin '+refs/pull/*/head:refs/pull/*/head'
```

- **与 PR 的对应关系**：权威叙事在 GitHub PR / Issue；`refs/pull/<N>/head` 是 GitHub 维护的合并前代码状态，不需要本机补记。
- **不做的事**：不为「图上好看」长期保留已合并的远程分支；不用标签记录分支。

## 归档

只有**没有 PR**、但要留住代码的分支才需要归档，例如超过 7 天无提交、或不确定是否还要用的本地分支。归档推到自定义命名空间 `refs/archive/<名称>`，再删本地分支：

```bash
git push origin <分支名>:refs/archive/<名称>
git branch -D <分支名>
```

- 名称去掉任务类型前缀，例如 `content/weekly-rss` → `refs/archive/weekly-rss`。
- `refs/archive/*` 不出现在 GitHub 的 Branches / Tags 页，`git clone` 和默认 `git fetch` 也不会拉取。需要时显式取回：

```bash
git fetch origin 'refs/archive/*:refs/archive/*'   # 拉回全部归档
git branch <分支名> refs/archive/<名称>               # 恢复其中一条
git push origin --delete refs/archive/<名称>          # 确认不再需要后删除
```

- 删除本地分支前，用 `git ls-remote origin refs/archive/<名称>` 确认远端归档已指向预期提交。
- 已开过 PR 的分支不归档，直接依赖「合并后追溯」。

## 标签

标签只用于发布与版本，按 Git 约定：对外发布用带说明的 annotated tag（`git tag -a`），私人临时标记用 lightweight tag 且不推送。不用标签记录分支、PR 或合并前状态。

2026-11-25 之前按旧规范推送过 92 个 `archive/*` 标签，已于当天清理：62 个迁到 `refs/archive/*`，30 个与 PR 引用指向同一提交，随后删除全部标签。对照表见 Issue #622。

## 依赖与磁盘

Git worktree **共享** `.git/objects`，但 **`node_modules` 不进 Git**，不会随 worktree 自动共享。每个卫星目录若单独 `npm install`，大约再占一份完整依赖（本仓库约 2GB 量级），是本地磁盘暴涨的常见原因。

- **只在主 worktree**（`.git` 为目录的那棵）执行 `npm install` / `npm ci`。改 `package-lock.json` 后回主仓重装；卫星目录通过符号链接自动跟上。
- **新开卫星**：在主仓执行 `npm run worktree:add -- <类型> <任务名>`。类型取命名表白名单（`feat` / `fix` / `research` / `content` / `chore`）。
- **已有卫星缺链或链错**：在该卫星目录执行 `npm run worktree:link-deps`（误装出实体目录时用 `npm run worktree:link-deps -- --force` 先删掉再链）。
- **禁止**在卫星目录执行 `npm install`、`npm ci`、`pnpm install`（除非站长明确用 `ALLOW_LOCAL_NODE_MODULES=1` 绕过 `pre-commit`）。
- **自检**：`npm run worktree:doctor`，列出各 worktree 与 `node_modules` 是主仓实体、符号链接还是缺失。
- Git 层所谓「稀疏」只省对象库；**疏通磁盘靠共享依赖 + 合并当天拆 worktree**，见上表数量上限。

## Worktree：任务型与智能体槽位

目录隔离和分支命名是两件不同的事。

- **分支名**只按任务类型白名单（`feat/`、`fix/` 等）和任务名起，**不**用智能体名、工具名当分支前缀（历史 `codex/*`、`cursor/*` 已不再新开）。
- **worktree 目录**可以按任务开，也可以按智能体或工作环境开——前者适合单次 PR，后者适合长期并行的多个助手。

| 模式 | 何时用 | 创建方式 | 任务结束后 |
| --- | --- | --- | --- |
| **任务型** | 一次性功能 / 修复，合完就收 | `npm run worktree:add -- <类型> <任务名>` | 当天 `git worktree remove`，删本地分支 |
| **智能体槽位** | 固定给 WorkBuddy、豆包、Cursor 等一头长期占坑 | 首次：`npm run worktree:add -- chore slot-<标识>`（`标识` 如 `workbuddy`、`doubao`）；目录落在 `…-slot-<标识>` | **保留目录**；推 PR、等合并后在该目录 `git fetch origin && git switch -c <类型>/<新任务> origin/main` |

**主 worktree（`main`）**：只适合站长点名「在主仓直接改」、或 `ALLOW_MAIN_COMMIT=1` 的极小改动。其余助手默认进自己的槽位或任务型卫星目录写文件、提交。

智能体槽位是否合理：**合理**，前提是槽位里仍然「一件事一个分支、一个 PR」，换任务就换分支，不把多个 Issue 混在同一未提交工作区。槽位占的是**并行写文件的坑位**，不是把分支永久绑在智能体名上。上限 5（含 `main`）时，典型分配是：`main` + 最多 4 个长期槽位，或 `main` + 若干任务型卫星；超过先 `npm run worktree:doctor` 再开。

同一槽位内开工新任务前，确认无未提交手写改动；有 WIP 先提交、stash 或开任务型 worktree，避免多任务混目录。

## 工作区卫生

- `public/data/memory/` 下的加密快照由 `pre-push` 钩子自动生成，会让每个 worktree 都显示“有未提交改动”。提交时只暂存任务相关文件，不把快照混进功能提交。
- `lib/research/styleAudit.js` 由 `npm run research:style-audit` 生成，文件头写明不要手改。它只在调研批量治理的 PR 里提交。
- **任务型** worktree：任务结束当天移除，不长期保留。**智能体槽位**可长期保留，但分支仍按上文换任务、按合并后清理删已合分支。
- 本地 Codex 与聊天助手并行时，同一条 Issue 只走一条落地路径，不为同一件事再开第二个分支。

## 不做的事

- 不引入 GitFlow 或 release 分支。
- 不对个人站强制多人 review。站长在 squash 前确认即是 review。
- 不用 `git push --force` 改写 `main`。
- 不在 `main` 上直接提交非琐碎改动。

## 每周自检

每周或每次合并一批 PR 后执行一次：

1. `git fetch --prune`
2. 核对没有 PR 的搁置分支，在删除前已推到 `refs/archive/*`。
3. 按“合并后清理”处理远端已删除的分支。
4. `git branch | wc -l` 与 `git worktree list`，确认没有超过上限。
5. 对超过 7 天没动的分支，二选一：推进，或归档后删除。
