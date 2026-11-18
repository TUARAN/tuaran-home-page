---
title: 分支管理自查与优化：187 个远程分支的盘点口径与配置收口
category: topics
topic_type: tech
tech_type: web_cloud
subjects: [site_engineering]
content_type: build_log
date: 2026-11-18
tags: [Git, 分支管理, 站点工程, 持续部署, 仓库治理, 自查]
summary: 2026-11-18 对一个持续部署仓库做只读盘点：远程 187 个分支、本地 136 个、历史 PR 204 条，仅 1 条开放。squash 合并让 git 的合并判定只识别出 42 个分支；改用 PR 合并时间、末次提交与当前 sha 交叉校验后，145 个分支可清理。开启合并后自动删分支与 fetch.prune 后，远程剩 44 个。
tldr: 分支堆积来自一条关闭的仓库设置。squash 合并下 git branch --merged 会失真，删除依据要换成 PR 记录与 sha 校验；先留存快照、分批删除，再用合并即删、命名带 Issue 号、短生命周期和定期巡检收口。
assistance: workbuddy
show_assistance: false
review_ready: false
ad_eligible: false
auto_images: false
pv: 0
---

> 适用范围：数据来自 2026-11-18 对单个 Next.js + Cloudflare Pages 仓库的只读盘点。清理命令会改变仓库引用，执行前先留存分支名与 commit sha，并重新拉取一次 PR 状态。

## 一、结论

一个持续部署的仓库，远程分支可以在几个月里涨到接近 200 个，而开放的 PR 只有 1 条。2026-11-18 的只读盘点得到 187 个远程分支、136 个本地分支、204 条历史 PR；其中 145 个分支的改动早已随 PR 合入主干，只是没有被删除。

- `git branch --merged` 在 squash 合并的仓库里严重失真：189 条已合并 PR 只对应 42 个被识别为已合并的远程分支。
- 删除依据换成 PR 的 `mergedAt`、分支末次提交时间、当前 sha 三者交叉校验，并排除所有 OPEN PR 的 head 分支。
- 堆积的直接来源是仓库设置 `delete_branch_on_merge = false`；开启后新增的合并分支会自动清理。
- 主干保护与自动发布工作流直推主干存在冲突，需要先定绕过方案再改保护规则。
- 删除前留存分支名与 sha 快照，执行时按每批不超过 10 个逐批校验。

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

配置落地后重新核对，远程分支从 187 个降到 44 个，剩下的都是主干、开放 PR 分支和待确认分档。

### 4.2 命名、生命周期与备份

分支名带上任务编号，从名字就能反查台账：`<类型>/<Issue号>-<简短描述>`，例如 `codex/423-home-masonry-lazy-load`。前缀收敛到 `codex/`、`feat/`、`fix/`、`content/`、`chore/` 这类白名单，工具自动生成的随机名前缀关掉或统一映射。

一个 Issue 对应一个分支和一个 PR，分支存活控制在 3–7 天；超过 14 天没有提交、也没有开放 PR 的分支进清理清单。需要留痕时用 tag，例如 `git tag archive/<name> <sha>`，长期占位的 `*-backup` 分支没有必要。

### 4.3 主干保护的取舍

主干适合加上 require PR、require status checks、禁止 force push 与禁止删除。这里有个前置冲突：内容自动发布工作流以 `github-actions[bot]` 身份直接推送 `main`，require PR 会挡住它。可选路径有三条：

| 方案 | 做法 | 代价 |
| --- | --- | --- |
| Ruleset 绕过 | 把 GitHub Actions App 加进 bypass list | 需要维护绕过规则 |
| 改走 PR | 自动发布先开 PR 再合入 | 发布实时性下降 |
| 只加基础保护 | 仅禁止 force push 与分支删除 | 保护强度最弱 |

方案选定前不动保护规则，避免自动发布中断。

### 4.4 定期治理

把分支清理做成季度巡检，或加进现有的仓库扫描任务，输出待删清单，删除动作由人工确认后执行。执行时重新拉一次 PR 状态，跳过新出现的 OPEN PR 分支，按每批不超过 10 个删除并逐批复核远程引用确实消失。

## 五、信息来源与持续验证

主要来源：2026-11-18 本机只读盘点命令（`git ls-remote --heads origin`、`gh pr list --state all --limit 1000`、`gh api repos/<owner>/<repo>/branches`、`git for-each-ref`、`git branch -r --merged origin/main`），以及仓库设置读取 `gh api repos/<owner>/<repo> --jq '.delete_branch_on_merge'`。资料截至 2026-11-18（北京）。

持续验证：

- 剩余 44 个分支里第二档与第三档的处置结论会随后续 PR 状态变化，清理前需重新拉取 PR 状态。
- 主干保护方案取决于自动发布工作流的绕过方式，选定前不改变结论。
