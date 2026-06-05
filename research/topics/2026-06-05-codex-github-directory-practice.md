---
title: 用 Codex 整理本地 GitHub 项目目录：一次 68G 到 30G 的实践调研
category: topics
date: 2026-06-05
tags: [Codex, 项目管理, 本地工程治理, Git, 自动化]
summary: 记录一次用 Codex 梳理本地 GitHub 同级项目目录的全过程：先盘点，再分类，再清理缓存与归档非 Git 项目，最后沉淀管理规则。
tldr: 项目目录失控时，真正的问题通常不是“项目太多”，而是缺少状态、体积、归属和风险台账；Codex 适合把本地文件系统、Git 状态和工程判断串成一次可审计的整理流程。
topic_type: tech
assistance: codex
model: gpt-5
pv: 0
---

## 一、背景：不是项目多，而是状态不清

这次整理的对象是本机 `/Users/tuaran/Documents/github` 目录。它和 `codex` 工作区同级，长期承载各种 GitHub 项目、实验项目、运行目录和历史资料。

整理前的问题很典型：

- 一级目录太多，已经很难一眼判断哪些是主线项目、哪些是实验、哪些只是运行缓存。
- 一些项目体积异常大，但不清楚是源码大、Git 历史大，还是 `node_modules`、Tauri `target`、浏览器 profile 这类可再生缓存大。
- 多个仓库存在未提交改动，直接删除或移动有风险。
- 有些目录不是 Git 仓库，却混在 Git 项目根目录里，增加了认知成本。
- `xhs` 这类自动化项目有浏览器 profile，本地登录态、缓存和运行数据混在一起，很容易越积越大。

所以这次不是简单“删东西”，而是一次工程资产盘点：先知道有什么，再判断为什么大，再决定哪些能清、哪些该保留、哪些先归档。

## 二、Codex 实际做了什么

### 1. 先只读盘点

Codex 先没有做任何修改，而是用命令读取目录、体积、Git 状态和远端信息。

盘点内容包括：

- 一级目录列表；
- 每个目录体积；
- 哪些目录是 Git 仓库；
- 当前分支；
- 未提交改动数量；
- Git remote；
- 最近一次提交时间；
- 大项目内部的空间来源。

这个阶段得出的关键事实是：

- `/Users/tuaran/Documents/github` 总体积约 `68G`。
- 共有 35 个一级目录，其中 31 个是 Git 仓库。
- 真正占空间的不是所有项目，而是少数几个大户。
- 多个大户的空间来自可再生构建产物，而不是源码本身。

### 2. 定位大体积来源

进一步检查后，空间来源变得很清楚：

- `EmployeeHub` 从表面看有 `13G`，实际主要是多个 Tauri/Rust `target`、`node_modules`、Python build/dist。
- `ProductDiagramCopilot` 的 `4.4G` 主要来自 `frontend/src-tauri/target`。
- `new-api-run` 的 `3.0G` 主要来自两个前端子目录的 `node_modules`。
- `SMSTaggingOfficer` 的 `2.3G` 主要来自 Tauri `target`。
- `xhs` 的 `5.2G` 主要是浏览器 profile。
- `AI-Learning-Library` 里有 `large_pdfs_backup` 和 `dist`，属于可以单独处理的备份/构建内容。

这一步很重要。因为如果只看目录大小，很容易误判“这个项目没用了，删掉”。但实际更好的处理方式是：保留项目，删除可再生缓存。

### 3. 识别不能乱动的仓库

清理前，Codex 还检查了未提交改动。

当时比较重要的 dirty repo 包括：

- `accomplish`：大量未提交改动，明显是在研项目；
- `EmployeeHub`：有业务组件改动和本地工具目录；
- `moltbot`：有源码改动和 `.codex-worktrees`；
- `md`：有新增 skill 文件；
- `new-api-run`：有 lockfile 改动；
- `ProductDiagramCopilot`：有本地 sqlite；
- `smart-news-platform`、`Tasnia-aes`、`muti-ip` 等也有不同程度未提交内容。

因此，清理策略不是“把 dirty repo 还原”，而是只清理明确可再生的目录：`node_modules`、`.next`、`target`、`dist`、`build`、profile、备份目录。源码改动一律不碰。

### 4. 执行清理

实际删除的主要类别是：

- Tauri/Rust 构建缓存：`src-tauri/target`；
- Node 依赖目录：`node_modules`；
- Next.js 构建产物：`.next`；
- Python 构建输出：`build`、`dist`；
- `xhs` 浏览器 profile；
- `AI-Learning-Library/large_pdfs_backup`；
- `AI-Learning-Library/dist`。

清理结果：

- 总目录从 `68G` 降到约 `29G`；
- 后续归档整理后约 `30G`；
- 实际释放约 `38G`。

几个变化最大的项目：

| 项目 | 清理前 | 清理后 | 主要原因 |
|---|---:|---:|---|
| `EmployeeHub` | 13G | 679M | 清理 Tauri target、node_modules、Python build/dist |
| `ProductDiagramCopilot` | 4.4G | 292M | 清理 Tauri target 与 node_modules |
| `new-api-run` | 3.0G | 150M | 清理 web 子目录 node_modules |
| `SMSTaggingOfficer` | 2.3G | 82M | 清理 Tauri target |
| `edge-llm-workbench` | 2.6G | 99M | 清理 Tauri target |
| `xhs` | 5.2G | 归档后约 100M | 清理浏览器 profile |

### 5. 归档非 Git 目录

清理后，Codex 继续把非 Git 目录从主项目根目录移出，统一放到：

```text
/Users/tuaran/Documents/github/_archive/non-git
```

归档目录包括：

- `TarTab`
- `iseecmic`
- `xhs`
- `yunye3.7.6`

这个动作不是删除，而是降级。它的意义是让 `/Users/tuaran/Documents/github` 主目录重新变成“Git 仓库列表 + `_archive`”，减少每天打开目录时的噪音。

后续还发现 `xhs` profile 被运行时重新生成了一份约 `170M` 的根目录残留。Codex 没有把它混回主目录，而是移动到：

```text
/Users/tuaran/Documents/github/_archive/non-git/xhs-runtime-profile-residual
```

这样主目录保持干净，同时也保留了可追溯性。

### 6. 生成记录和索引

Codex 在 `codex` 工作区生成了两份文档：

- `github-cleanup-report.md`：记录清理前后、删除了什么、释放多少空间；
- `github-projects-index.md`：按产品线整理项目，列出 dirty repo、命名问题、后续动作。

这一步很关键。因为如果只有一次性清理，没有台账，过一两个月目录还会回到混乱状态。

## 三、为什么 Codex 适合做这类目录治理

这类任务不是单纯的 shell 自动化，也不是单纯的写文章。它需要同时具备四种能力。

### 1. 能直接读本地工程上下文

Codex 可以在本机工作区读取文件系统、执行 `du`、`find`、`git status`、`git log` 等命令。

这意味着它不需要用户手动复制大量命令结果，也不会只凭项目名猜测。它可以逐层看：

- 目录有多大；
- 大在哪里；
- 是否是 Git 仓库；
- 是否有未提交改动；
- 最近是否活跃；
- remote 指向哪里；
- 是否有 `.env`、sqlite、本地 profile 这类敏感或运行态文件。

### 2. 能把工程事实转成管理判断

目录治理的难点不是命令，而是判断。

例如：

- `EmployeeHub` 很大，但它是活跃主线项目，应该保留并清缓存；
- `xhs` 很大，但主要是浏览器 profile，删除会影响登录态，所以需要明确风险；
- `ProductDiagramCopilot` 只有一个 sqlite 未跟踪，不应该因为 dirty 就放弃清理；
- 非 Git 目录不一定没用，更适合先归档，而不是直接删除；
- `new-api-run` 指向上游 `QuantumNous/new-api`，更像 vendor/run copy，不适合当作自有产品主线。

Codex 的作用是把这些判断串起来，而不是机械执行 `rm -rf`。

### 3. 能在破坏性操作前分层确认

这次流程里，Codex 先做只读盘点，再给出建议，然后在用户明确“按照建议来，xhs profile 和资料备份也处理”之后才执行删除。

而且删除范围是显式列出的目录，不用宽泛通配。这个原则很重要：

- 不删源码；
- 不还原未提交改动；
- 不碰 `.env` 和本地数据库，除非用户明确要求；
- 优先删可再生缓存；
- 对非 Git 项目先归档，不直接销毁。

### 4. 能把一次操作沉淀成制度

最后的价值不只是释放 38G，而是形成了一套以后可复用的管理方法。

Codex 能把“做过什么”写成报告，把“以后怎么管”写成索引，把项目分到产品线，并指出下一步应该处理的 dirty repo 队列。

这比单次清理更重要。

## 四、以后应该如何管理这类目录

### 1. 主目录只放 Git 仓库和 `_archive`

建议 `/Users/tuaran/Documents/github` 保持一个简单规则：

```text
github/
├── active-git-repo-a/
├── active-git-repo-b/
├── ...
└── _archive/
```

不要让浏览器 profile、临时运行目录、非 Git 历史项目长期混在根目录。

非 Git 项目先进入：

```text
_archive/non-git/
```

如果确认仍有价值，再补 Git 初始化或迁到正式仓库；如果确认无价值，再删除。

### 2. 每个项目标一个状态

项目不应该只有“在”或“不在”两种状态。建议至少分成：

| 状态 | 含义 | 处理方式 |
|---|---|---|
| `active` | 当前主线项目 | 保留，优先保证干净工作区 |
| `maintain` | 仍有价值但低频维护 | 保留，减少依赖和构建缓存 |
| `incubate` | 实验或原型 | 可保留，但要有到期复查 |
| `vendor` | 外部 fork 或运行副本 | 不当作自有产品主线 |
| `archive` | 暂停或历史项目 | 移入 `_archive` |
| `delete-candidate` | 明确无价值候选 | 先确认 remote、数据和未提交内容，再删 |

这比按目录名猜价值可靠得多。

### 3. 定期看四个指标

每个月或每季度扫一次：

- 体积：`du -sh`；
- Git 干净度：`git status --short`；
- 最近提交：`git log -1 --format=%cs`；
- remote：`git remote -v`。

判断项目时，优先问四个问题：

1. 它最近还在用吗？
2. 它有没有未提交改动？
3. 它的大体积是源码、数据、Git 历史，还是缓存？
4. 它属于哪个产品线？

只有这四个问题回答清楚，才进入删除或合并讨论。

### 4. 缓存和源码要分开

以后看到大目录，先不要问“删不删项目”，先问“空间来自哪里”。

通常可以安全清理的包括：

- `node_modules/`
- `.next/`
- `dist/`
- `build/`
- `target/`
- `.turbo/`
- `.cache/`
- Python `__pycache__/`
- Tauri/Rust `src-tauri/target/`

但下面这些要谨慎：

- `.env`
- sqlite / db 文件；
- 浏览器 profile；
- 用户上传数据；
- `data/`、`exports/`、`backup/`；
- 未提交源码；
- `.git`。

一个简单原则是：能通过 install/build 重新生成的，可以清；包含配置、登录态、业务数据、历史证据的，不要随手清。

### 5. 先归档，再删除

对不确定的目录，建议采用“三段式”：

1. 移入 `_archive`；
2. 观察 30-90 天；
3. 确认不用后再删除或压缩。

这比一次性删除更适合个人长期工程目录。因为很多项目不是“没用”，只是暂时没有上下文。

### 6. dirty repo 要有处理队列

这次整理后，最应该优先处理的不是大目录，而是 dirty repo。

建议顺序：

1. `accomplish`：大量未提交改动，必须单独处理；
2. `smart-news-platform`：旧项目但 dirty 较多，决定恢复还是归档；
3. `Tasnia-aes`：实验项目，适合收口；
4. `muti-ip`：本地名和 remote 名不一致，要改名或写清楚；
5. `EmployeeHub`：业务改动要提交，工具目录要决定是否忽略；
6. `md`：新增 skill 文件应提交或移出；
7. `moltbot`：检查 `.codex-worktrees`；
8. `new-api-run`：确认是否只是 vendor/run copy；
9. `edge-llm-workbench`：确认示例数据是否应入库；
10. `ProductDiagramCopilot`：sqlite 应加入忽略或归档。

目录治理的核心不是“清空”，而是让每个改动都有归属。

### 7. 命名要和 remote 对齐

几个命名问题值得后续修正：

- `awsome-prompt` 应考虑改成本地 `awesome-prompt`；
- `muti-ip` 的 remote 是 `blogger-eye-platform`，本地名和远端名不一致；
- `AutoCommitWeb-cf` 的 remote 是 `AutoCommitWeb`，需要确认 `-cf` 是否代表部署变体；
- `new-api-run` 是上游 fork/runtime copy，应明确标注 vendor 属性。

命名不是洁癖。名字不一致会导致未来找项目、写脚本、做备份、判断归属时都变慢。

## 五、这次实践的结论

这次整理释放了大约 `38G` 空间，但真正的收益不是磁盘空间，而是把本地工程资产重新分层：

- 主目录恢复为 Git 仓库集合；
- 非 Git 项目进入归档区；
- 大体积缓存被清掉；
- dirty repo 被排队；
- 项目被按产品线重新理解；
- 后续治理规则被写成文档。

我的结论是：

**个人项目越来越多时，不要急着合并仓库，也不要急着删除项目。先建立目录台账，再按状态管理。**

Codex 在这类任务里的价值，正是把“命令行事实”和“工程管理判断”接起来：它能看见本地目录，也能理解 Git 风险，还能把操作过程记录成可复盘的文档。

以后这类目录可以按一个固定节奏管理：

1. 每月扫一次体积和 dirty repo；
2. 每季度归档一次非活跃项目；
3. 每次大清理都生成报告；
4. 不确定的目录先归档，不直接删除；
5. 所有可再生缓存都应该进 `.gitignore`；
6. 任何有业务数据、登录态、`.env`、sqlite 的目录，都先标风险再处理。

这样项目多并不可怕。可怕的是项目没有状态、目录没有边界、缓存和数据混在一起。

