# Issue 优先工作流

助手执行前先读 [AGENTS.md](../../AGENTS.md) 的「Issue 优先」一节。那一节是硬规则，本文件是步骤。

适用：站长在聊天或助手侧提出的需求。定时巡检继续走 [站点自迭代 Autopilot](site-autopilot.md)：扫描、待修 Issue、Draft PR，merge 仍由站长完成。巡检单不要改走本流程。

非琐碎改动先有 Issue，这条顺序参考 OpenClaw 对代理改动的要求。本站没有多维护者路由：分诊标签决定能不能开工，合并只等站长说「合」。

## 标准流程

1. 站长在聊天或助手侧提出需求。
2. 助手先搜重。open、closed 的 Issue 和相关 PR 都要看。命令见下方「去重」。
3. 开新 Issue，或复用已有 Issue。正文写清五段：问题、影响、建议动作、阻塞、来源聊天摘要。来源摘要只保留这次聊天里和需求有关的事实，不贴 token、密码、私人联系方式。
4. 打分诊标签。类型至少一个，优先级恰好一个。规则见「分诊标签」。
5. `priority:now` 且没有任何 `needs:*`：开 PR。正文含 `Closes #N` 或 `Related: #N`，并套用 `.github/pull_request_template.md`。
6. 带 `needs:design`、`needs:decision` 或 `needs:assets`：停在 Issue。把缺什么写进评论。不直接开 PR。`priority:now` 不能压过 `needs:*`；now 只表示阻塞一解除就开工。
7. 站长说「合」之后才 squash。在那之前助手不 squash、不 merge。界面改动先看 Cloudflare Pages 分支预览。内容稿可以 `review_ready: false` 入库，不自动发布。细节见「预览、内容与合并」。

做完 Issue 里的建议动作时用 `Closes #N`，合并后 GitHub 会关闭该 Issue。只推进一部分，或例外修复顺带关联时，用 `Related: #N`，Issue 保持打开。

## 去重

```bash
gh search issues --repo TUARAN/tuaran-home-page --state open --limit 20 "关键词"
gh search issues --repo TUARAN/tuaran-home-page --state closed --limit 20 "关键词"
gh search prs --repo TUARAN/tuaran-home-page --state open --limit 20 "关键词"
gh search prs --repo TUARAN/tuaran-home-page --state closed --limit 20 "关键词"
```

- 同一问题已有 open Issue：在原 Issue 补上这次聊天的新事实，不另开。
- 已关闭且问题再次出现：复开原 Issue。复开权限不足时新开，正文写 `Related: #旧号` 和复开理由。
- 只是相邻主题：新开，正文写 `Related: #旧号`。

## 例外

下面三种情况可以直接开 PR，不必先开 Issue：

- 纯笔误：文案、注释或文档里的错字，不改行为。
- CI 红修：这次只修已经变红的检查，不顺手改别的。
- 站长当次明确说「直接改」或「别开 Issue」。

命中例外时，PR 正文写明命中哪一条。已经有相关 Issue 的，仍然写 `Closes #N` 或 `Related: #N`。能对应上的 `type:*` 和 `priority:*` 仍要打上；令牌不能改标签时，把应打的标签名写进 PR 正文。

## 分诊标签

至少打一个 `type:*`，再打恰好一个 `priority:*`。界面改动追加 `type:ui`。缺设计、决策或素材时追加对应 `needs:*`，可以同时有多个。

| 标签 | 何时使用 |
| --- | --- |
| `type:bug` | 缺陷：行为与预期不符 |
| `type:enhancement` | 改进：新能力或体验调整 |
| `type:content` | 内容：文章、调研或资料稿 |
| `type:ui` | 界面：访客或站长能看见的改动 |
| `type:ops` | 运维：流程、构建、巡检与发布 |
| `priority:now` | 现在做：没有 needs 阻塞即可开 PR |
| `priority:next` | 下一轮：先记下，不立刻开工 |
| `priority:parked` | 搁置：有结论前不排期 |
| `needs:design` | 缺设计：停在 Issue，不直接开 PR |
| `needs:decision` | 缺站长决策：停在 Issue，不直接开 PR |
| `needs:assets` | 缺素材：停在 Issue，不直接开 PR |

颜色只用来区分类型、优先级和阻塞。标签定义在 GitHub 仓库上，不进 git diff。`.github/workflows/triage-labels.yml` 在该文件变更或手动触发时幂等创建；已存在则跳过。本机账号有 Issues 写权限时，也可以按上表同名执行 `gh label create`。

`priority:next` 和 `priority:parked` 保持 Issue 打开，不开 PR。

## 开 PR

- 分支只包含该 Issue 范围内的改动。站长本机说「开 PR」时，分支名用 `codex/<简短任务名>`。云端代理使用当次指定的分支模板。
- 标题说明这次解决的问题。正文按模板写：问题（链到 Issue）、改了什么、没改什么、验证、`Closes #N` 或 `Related: #N`、界面是否要预览后再合。
- 纯文档、模板、标签说明的提交说明以 `[CF-Pages-Skip]` 开头，跳过 Cloudflare Pages 构建。GitHub Actions 的 CI 仍会跑。不要写成 `[skip ci]`。

## 预览、内容与合并

界面改动（带 `type:ui`，或访客、站长能看见的页面、布局、样式、交互）先留在 PR 上。公开站 Pages 项目是 `tuaran`，后台站是 `tuaran-admin-git`。分支推送后，从对应项目的 Preview 部署取得 `*.pages.dev` 链接，写进 PR。站长看过预览再说「合」。预览链接还没有时，PR 保持打开，不 squash。

内容稿可以以 `review_ready: false` 进入 Git。助手不把该字段改成 `true`，也不调用后台发布或审批接口。`review_ready` 标记人工复核是否完成，不代替发布动作。调研的创作正本、后台审批和 72 小时待审批写入 D1 的规则，以 [research/README.md](../../research/README.md) 和 [content-storage-rollout.md](content-storage-rollout.md) 为准。未得到站长「合」之前，内容稿留在 PR 上，不直接推 `main`，避免启动那段计时。普通文章仍只通过 `/admin/articles` 或对应管理 API 发布。

站长说「合」之后，用 squash 合并。助手不自行合并，也不改用普通 merge 收口。

## 模板

| 文件 | 用途 |
| --- | --- |
| `.github/ISSUE_TEMPLATE/feedback.yml` | 原有反馈，保留 |
| `.github/ISSUE_TEMPLATE/bug.yml` | 复现、期望、实际、页面路径、影响 |
| `.github/ISSUE_TEMPLATE/enhancement.yml` | 问题、建议方案、是否依赖设计/决策/素材、优先级建议 |
| `.github/ISSUE_TEMPLATE/content.yml` | 内容与调研：slug、`review_ready` 预期 |
| `.github/ISSUE_TEMPLATE/config.yml` | 关闭空白 Issue，并链接到本 runbook |
| `.github/pull_request_template.md` | PR 正文 |
