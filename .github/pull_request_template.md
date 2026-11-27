## 问题

<!-- 链到 Issue。非琐碎改动先有 Issue。例外（纯笔误、CI 红修、站长说直接改）写明原因。 -->

Closes #

<!-- 做完的 Issue 每条一行 Closes #N，可多条。合并后仍应打开（部分推进、依赖、后续）才把该行改成 Related: #N。做完的不要写成 Related。 -->

## 改了什么

## 没改什么

## 验证

- [ ] CI
- [ ] 不需要预览（纯文档、进度说明、中间变基、同分支连推、模板或内容稿）。提交说明以 `[CF-Pages-Skip]` 开头；合入 `main` 的 merge commit 说明同样加该标记，不作为完整的预览式生产部署。GitHub Actions 的 CI 仍会跑。不要写成 `[skip ci]`
- [ ] 需要站长看过官方预览再说「合」的页面改动：已附 Cloudflare Pages 分支预览（公开站 `tuaran`，后台站 `tuaran-admin-git`）。不是每个 Issue、PR 或推送都要预览。站长看过预览再说「合」

## 合并

等站长说「合」后用 **Create a merge commit** 合入（除非当次明确要求 squash）。助手不自行合并。

若 Codex 实质参与编写，按 `AGENTS.md` 核对提交尾注，以及在 **merge commit 说明** 中保留的 `Co-authored-by` 尾注。
