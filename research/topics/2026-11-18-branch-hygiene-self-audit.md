---
title: 分支管理自查与优化：187 个远程分支的盘点口径与配置收口
category: topics
topic_type: tech
tech_type: web_cloud
subjects: [site_engineering]
content_type: build_log
date: 2026-11-18
updated: 2026-11-23
tags: [Git, 分支管理, 站点工程, 持续部署, 仓库治理, 自查, 分支规范, worktree]
summary: 2026-11-18 对一个持续部署仓库做只读盘点：远程 187 个分支、本地 136 个、历史 PR 204 条，仅 1 条开放。squash 合并让 git 的合并判定只识别出 42 个分支；改用 PR 合并时间、末次提交与当前 sha 交叉校验后，145 个分支可清理。开启合并后自动删分支与 fetch.prune 后，远程剩 44 个。
tldr: 分支堆积来自一条关闭的仓库设置。squash 合并下 git branch --merged 会失真，删除依据要换成 PR 记录与 sha 校验；先留存快照、分批删除，再用合并即删、任务类型前缀、独立 worktree 开工、每周自检和合并前归档收口。
assistance: workbuddy
show_assistance: false
review_ready: false
ad_eligible: false
auto_images: false
pv: 0
---

> 适用范围：盘点数据来自 2026-11-18 对单个 Next.js + Cloudflare Pages 仓库的只读盘点，规则现状核对到 2026-11-23。清理命令会改变仓库引用，执行前先留存分支名与 commit sha，并重新拉取一次 PR 状态。

## 一、结论

一个持续部署的仓库，远程分支可以在几个月里涨到接近 200 个，而开放的 PR 只有 1 条。2026-11-18 的只读盘点得到 187 个远程分支、136 个本地分支、204 条历史 PR；其中 145 个分支的改动早已随 PR 合入主干，只是没有被删除。

- `git branch --merged` 在 squash 合并的仓库里严重失真：189 条已合并 PR 只对应 42 个被识别为已合并的远程分支。
- 删除依据换成 PR 的 `mergedAt`、分支末次提交时间、当前 sha 三者交叉校验，并排除所有 OPEN PR 的 head 分支。
- 堆积的直接来源是仓库设置 `delete_branch_on_merge = false`；开启后新增的合并分支会自动清理。
- 主干保护与自动发布工作流直推主干存在冲突，需要先定绕过方案再改保护规则。
- 删除前留存分支名与 sha 快照，执行时按每批不超过 10 个逐批校验。

盘点之后，这些动作陆续固定成仓库规范。2026-11-20 新增 `docs/specs/branch-management.md`，后台 `/admin/branch-rules` 直接读取该文件；2026-11-23 把独立 worktree 开工写成硬规则、把分支前缀从工具名换成任务类型白名单、收紧 Cloudflare Pages 的预览触发条件，并规定 squash 合并前给 PR 分支 tip 打 `archive/*` tag。后续每条分支的开、合、收按规范执行；合并即删与每周自检负责新增分支的清理。

## 二、盘点事实

数据来源为 2026-11-18 本机 `git ls-remote --heads origin`、`gh pr list --state all --limit 1000`、`gh api repos/<owner>/<repo>/branches`、本地 `git for-each-ref`，以及 `git branch -r --merged origin/main`。远程分支数用 `ls-remote` 与 GitHub Branches API 双向核对过。

| 口径 | 结果 | 说明 |
| --- | ---: | --- |
| 远程分支 | 187 | `ls-remote` 实测 |
| 本地分支 | 136 | 含 11 个远程已删除的残留 |
| 历史 PR | 204 | MERGED 189 / CLOSED 14 / OPEN 1 |
| git 判定已合入 main | 42 | `git branch -r --merged origin/main` |
| 合并后自动删分支 | 关闭 | `delete_branch_on_merge = false` |
| 主干保护 | 未开启 | 分支保护接口返回 404 |

按末次提交时间分档，46 个分支停在 2026-09 及以前，最老可追到 2026-03；其余 141 个集中在本月，属于合并完成后没有清理。

| 末次提交区间 | 分支数 | 观察 |
| --- | ---: | --- |
| ≤ 2026-09 | 46 | 长期无迭代 |
| 11/01–11/07 | 71 | 本月合并后未清理 |
| 11/08–11/14 | 34 | 同上 |
| 11/15–11/18 | 36 | 近 4 天 |

命名前缀的分布同样能看出工具痕迹：`codex/` 108 个、`cursor/` 73 个、`feat/` 3 个，`agent/`、`claude/`、`refactor/` 各 1 个。多个工具各自按自己的规则建分支，名字里既没有任务编号，也没有状态信息。

## 三、判断依据

### 3.1 合并判定为什么会失真

`git branch --merged` 依赖 commit 祖先关系。项目统一用 squash 合并，主干上生成的是一个新的合并 commit，原分支的 tip 并不在主干历史里。于是 189 条状态为 MERGED 的 PR，只留下 42 个能被 git 识别为已合并的远程分支；剩下的 148 个看上去「未合并」，实际大多已经交付。

`git branch --merged` 的结果不能直接当删除清单。删除依据改用 PR 记录，再用分支末次提交与当前 sha 做一致性校验。

### 3.2 判定顺序

1. 拉取全量 PR，取每条分支最新一条 PR 的 `state`、`mergedAt`。
2. 拉取远程真实分支名与 sha，排除 `main` 和所有 OPEN PR 的 head 分支。
3. 最新 PR 为 MERGED 且分支末次提交不晚于 `mergedAt` 的，进入可清理档；当前 sha 与快照不一致说明合并后又有新提交，跳过。
4. 无 PR 关联但被 `git branch -r --merged origin/main` 命中的，属于早期用 merge commit 合入的历史分支，可清理。
5. 剩余按「PR 关闭未合并」「未合入且无 PR」分档，先确认内容是否还有价值。

<figure class="research-inline-diagram">
<svg viewBox="0 0 720 150" role="img" aria-label="分支可否清理的判定顺序：先拉取 PR 与远程分支，排除保留项，再比对合并状态与 sha，最后分档处置">
<defs>
<marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
<path d="M2 1L8 5L2 9" fill="none" stroke="#185FA5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</marker>
</defs>
<rect x="20" y="45" width="155" height="60" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="97" y="72" text-anchor="middle" font-size="13" font-weight="500" fill="#0C447C">拉取 PR 与分支</text>
<text x="97" y="91" text-anchor="middle" font-size="12" fill="#185FA5">出口是 sha 清单</text>
<rect x="195" y="45" width="155" height="60" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="272" y="72" text-anchor="middle" font-size="13" font-weight="500" fill="#0C447C">排除保留项</text>
<text x="272" y="91" text-anchor="middle" font-size="12" fill="#185FA5">main 与 OPEN PR</text>
<rect x="370" y="45" width="155" height="60" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="447" y="72" text-anchor="middle" font-size="13" font-weight="500" fill="#0C447C">比对 mergedAt</text>
<text x="447" y="91" text-anchor="middle" font-size="12" fill="#185FA5">并校验 sha 未变</text>
<rect x="545" y="45" width="155" height="60" rx="8" fill="#EAF3DE" stroke="#3B6D11" stroke-width="0.5"/>
<text x="622" y="72" text-anchor="middle" font-size="13" font-weight="500" fill="#27500A">分档处置</text>
<text x="622" y="91" text-anchor="middle" font-size="12" fill="#3B6D11">留存快照后执行</text>
<line x1="177" y1="75" x2="193" y2="75" stroke="#185FA5" stroke-width="1.5" marker-end="url(#arrow)"/>
<line x1="352" y1="75" x2="368" y2="75" stroke="#185FA5" stroke-width="1.5" marker-end="url(#arrow)"/>
<line x1="527" y1="75" x2="543" y2="75" stroke="#185FA5" stroke-width="1.5" marker-end="url(#arrow)"/>
</svg>
<figcaption>图 1：分支可否清理的判定顺序，先排除保留项，再比对合并状态与 sha。</figcaption>
</figure>

### 3.3 分档结果

| 档位 | 判定条件 | 数量 | 处置 |
| --- | --- | ---: | --- |
| 保留 | `main` 与 OPEN PR 的 head 分支 | 2 | 不动 |
| 第一档 | 最新 PR 为 MERGED，末次提交 ≤ `mergedAt`，sha 未变 | 145 | 可清理 |
| 第二档 | PR 关闭未合并，或无 PR 关联但 git 判定已合入 main | 33 | 建议清理，需复核 |
| 第三档 | 合并后仍有新提交，或未合入且无 PR | 7 | 先确认内容价值 |

清理前把全部远程与本地分支的分支名、sha、末次提交日期、提交主题写成一份 TSV 快照。误删时按快照恢复：

```
git push origin <sha>:refs/heads/<branch-name>
git branch <branch-name> <sha>
```

托管平台会在一段时间内保留被删分支的 commit，PR 记录也长期存在，sha 可恢复；分支名和对应的预览部署不会自动还原。

| 校验项 | 状态 | 作用 |
| --- | --- | --- |
| OPEN PR 分支排除 | [!good]已核验[/!good] | 避免删掉正在评审的分支 |
| 分支 sha 与快照一致 | [!good]已核验[/!good] | 合并后又有新提交的分支跳过 |
| 主干保护绕过方案 | [!warn]待决策[/!warn] | 自动发布直推主干时先定方案 |

## 四、优化动作

### 4.1 让合并即删成为默认行为

仓库设置 `delete_branch_on_merge` 关闭时，每次 PR 合并都会留下一个 head 分支。开启后，新合并的分支由平台自动删除：

```
printf '%s' '{"delete_branch_on_merge": true}' | gh api -X PATCH repos/<owner>/<repo> --input -
gh api repos/<owner>/<repo> --jq '.delete_branch_on_merge'
git config --global fetch.prune true
```

`fetch.prune` 让每次 `git fetch` 顺带清掉失效的远程跟踪引用。全局配置写入被 `~/.gitconfig.lock` 挡住时，仓库级 `git config fetch.prune true` 同样生效；残留的锁文件需要单独清理，否则后续全局配置写入会继续报错。

配置落地后重新核对，远程分支从 187 个降到 44 个，剩下的都是主干、开放 PR 分支和待确认分档。日常清理由规范里的「合并后清理」承接：`git fetch --prune` 之后用 `git branch -vv | awk '/: gone]/'` 找出远端已删除的分支，确认清单再删；被 worktree 占用的分支先移除 worktree，目录里有未提交的手写内容时先提交或备份。

### 4.2 命名、生命周期与归档

分支名表达任务性质，不记录由哪个工具创建。前缀白名单只有五个，按改动性质取：

| 前缀 | 用途 | 示例 |
| --- | --- | --- |
| `feat/<任务名>` | 新功能、体验调整 | `feat/x-home-reading-nav` |
| `fix/<任务名>` | 缺陷修复 | `fix/csdn-account-links` |
| `research/<主题>` | 单篇调研 | `research/bitverse` |
| `content/<任务名>` | 文章、资料稿、内容资产 | `content/weekly-rss` |
| `chore/<任务名>` | 运维、构建、依赖、巡检、文档 | `chore/security-scan-2026-11-23` |

历史遗留的 `codex/*`、`cursor/*`、`claude/*` 等工具前缀分支不再新开，已存在的按生命周期正常清理，不必改名。名称只写任务，不加 Issue 号，也不加 `-backup`、`-done`、`-v2` 之类后缀；需要保留旧版本时打 tag。2026-11-18 盘点到的 `codex/` 108 个、`cursor/` 73 个，正是各工具按自己规则建分支留下的痕迹。

一件事一个分支，一个分支一个 PR。开工即隔离：任务一开始就 `git worktree add -b <类型>/<任务名> <路径> origin/main`，在独立目录里写文件、提交、推送。主工作区常被多个智能体共享，在其中 `checkout` 新分支不算隔离。`pre-commit` 钩子拒绝主工作区的任何提交；站长明确要求在主工作区直接提交的小改动可用 `ALLOW_MAIN_COMMIT=1 git commit ...` 绕过，该钩子只在本机 clone（`core.hooksPath=scripts/hooks`）生效，云端 VM 靠规范自觉。本地分支上限 10 个，同时存在的 worktree 上限 3 个（含主仓库），超过就先清理再开新分支。分支 7 天没有新提交，要么推进，要么归档后删除。

### 4.3 合并前归档与 tag 留痕

squash 合并之后，`main` 历史呈一条线，分支名会从 SourceTree 等工具的图谱里消失。为了还能指回合并前的分支线，每次 squash 合并前给该 PR 分支 tip 打 `archive/*` tag。tag 不占分支名额，也不替代 Issue 与 PR 正文里的任务说明。

推荐顺序（站长说「合」之后、执行 `gh pr merge` 之前）：

```bash
# 1) 取 PR 分支最后一次提交的 SHA（示例：PR #540）
SHA=$(gh pr view 540 --json commits --jq '.commits[-1].oid')
BRANCH=$(gh pr view 540 --json headRefName --jq .headRefName)

# 2) tag 名去掉任务类型前缀：feat/x-home-reading-nav → archive/x-home-reading-nav
git tag archive/<名称> "$SHA"
# 可选：附 PR / Issue，便于在标签列表里辨认
# git tag -a archive/<名称> "$SHA" -m "PR #540 · $BRANCH · Closes #539"

# 3) 再 squash 合并并删远端分支；本地 worktree / gone 分支照旧清理

# 4) 批量合并后推送 tag，避免 tag 只留在本机
git push origin --tags
```

分支已删、只剩 GitHub 记录时，可从已合并 PR 的 commits 最后一项取 `oid` 补打。临时查看用 `git branch <分支名> archive/<名称>` 拉回一条线，看完删掉。tag 里不写执行工具名，也不为「图上好看」长期保留已合并的远程分支。这条规则在 2026-11-23 晚写进 `docs/specs/branch-management.md` 与 `AGENTS.md`，对应 PR #550；当晚批量合并已按它打出 9 个 `archive/*` tag。

对尚未合并、超过 7 天没有提交或不确定是否还要用的分支，同样可以先打 `archive/*` 再删本地分支，删前确认 tag 已指向预期提交。

### 4.4 主干保护与预览部署

主干保护到 2026-11-23 仍未启用。规范里写明不对个人站强制多人 review，站长在 squash 前确认即完成 review；不用 `git push --force` 改写 `main`，非琐碎改动不直接推 `main`，合并动作只由站长发出。自动发布工作流与 require PR 的冲突由合并权限收口，保护规则保持关闭。

| 方案 | 做法 | 代价 |
| --- | --- | --- |
| Ruleset 绕过 | 把 GitHub Actions App 加进 bypass list | 需要维护绕过规则 |
| 改走 PR | 自动发布先开 PR 再合入 | 发布实时性下降 |
| 只加基础保护 | 仅禁止 force push 与分支删除 | 保护强度最弱 |

这三条是 2026-11-18 盘点时列出的候选，方案未选定，三条都没有启用。部署侧在 2026-11-23 另行收紧：合入 `main` 是否触发 Cloudflare Pages 生产构建，由 squash 提交说明是否以 `[CF-Pages-Skip]` 开头决定。跳过方式只有这一种，GitHub Actions 的 CI 仍会跑，不写成 `[skip ci]`。只有需要站长看过官方预览再说「合」的页面改动才触发预览构建，公开站官方预览是 `tuaran`，后台站是 `tuaran-admin-git`；纯文档、进度说明、中间变基与同分支连推都以该标记跳过。不改 Cloudflare 控制台，也不另造跳过机制。

### 4.5 每周自检

一次性大盘点仍按每批不超过 10 个删除并逐批复核远程引用确实消失，执行前重新拉一次 PR 状态，跳过新出现的 OPEN PR 分支。日常收口改为每周或每次合并一批 PR 后自检：

1. `git fetch --prune`。
2. 核对刚合并的 PR 是否都有对应 `archive/*` tag，缺的从 PR commits 补打并 `git push origin --tags`。
3. 按「合并后清理」处理远端已删除的分支。
4. `git branch | wc -l` 与 `git worktree list`，确认没有超过上限。
5. 对超过 7 天没动的分支，二选一：推进，或归档后删除。

本地 Codex 与聊天助手并行时，同一条 Issue 只走一条落地路径，先出现的 PR 为准，避免同一件事开出两条分支。

### 4.6 规则落地清单（2026-11-20 ～ 11-23）

| 变动 | 2026-11-18 盘点时的口径 | 现行 | 依据 | 状态 |
| --- | --- | --- | --- | --- |
| 命名前缀 | `<类型>/<Issue号>-<简述>`，白名单含 `codex/` | 五个任务类型前缀，按性质不按工具 | `1610b084` / #514 | [!good]已合入[/!good] |
| 开工隔离 | 未约定 | `git worktree add -b <类型>/<任务名> … origin/main`，`pre-commit` 拦截主工作区提交 | `3add9a1f` / #503 | [!good]已合入[/!good] |
| 数量与寿命 | 3–7 天，超 14 天进清理清单，季度巡检 | 本地 10 个、worktree 3 个，7 天无动静即处理，每周自检 | 分支管理规范 | [!good]已合入[/!good] |
| 规范正本 | 无 | `docs/specs/branch-management.md` 与后台 `/admin/branch-rules` | `eeeb62e1` | [!good]已合入[/!good] |
| 预览与部署 | 界面改动先看分支预览 | `[CF-Pages-Skip]` 唯一跳过方式，只有需站长看官方预览的页面改动才构建 | `d6683458` / #537 | [!good]已合入[/!good] |
| 合并后清理 | PR `mergedAt` 与 sha 交叉校验 | 日常按「远端已删除」（`: gone]`）判定 | 分支管理规范 | [!good]已合入[/!good] |
| 本地协同 | 未约定 | 同一 Issue 只走一条落地路径 | `51d8aa7d` / #131 | [!good]已合入[/!good] |
| 合并前归档 | 需要留痕时用 tag，`*-backup` 分支没有必要 | 每次 squash 合并前必打 `archive/*` 并 `git push origin --tags` | `24bbd4d6` / PR #550 | [!warn]PR 待合入[/!warn] |

## 五、信息来源与持续验证

主要来源：2026-11-18 本机只读盘点命令（`git ls-remote --heads origin`、`gh pr list --state all --limit 1000`、`gh api repos/<owner>/<repo>/branches`、`git for-each-ref`、`git branch -r --merged origin/main`），以及仓库设置读取 `gh api repos/<owner>/<repo> --jq '.delete_branch_on_merge'`。规则部分核对 `docs/specs/branch-management.md`、`docs/runbooks/issue-first-workflow.md`、`AGENTS.md`，以及 2026-11-20 至 11-23 的相关提交与 PR（#503、#514、#537、#550）。资料截至 2026-11-23（北京）。

持续验证：

- 剩余 44 个分支里第二档与第三档的处置结论会随后续 PR 状态变化，清理前需重新拉取 PR 状态。
- 合并前归档规则在 PR #550，尚未合入 `main`。`AGENTS.md` 与规范里的那句在合入前只代表分支上的约定，合入后以 `main` 为准。
- 主干保护方案仍未选定，保护规则保持关闭；自动发布工作流的绕过方式由合并权限与 `[CF-Pages-Skip]` 承接，若日后启用保护规则需重核这段结论。
