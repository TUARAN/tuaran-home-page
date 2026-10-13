# 文档

项目文档集中在这个目录。各工具自己的说明留在 `tools/<工具>/docs/`。

| 目录                                                    | 放什么              | 谁读取                                                  |
| ----------------------------------------------------- | ---------------- | ---------------------------------------------------- |
| [specs/](specs/site-design-language.md)               | 现行规范             | 后台 `/admin/design` 直接读取。和组件、令牌冲突时，以代码为准，并在同一次修改里更新文档 |
| [context/](context/README.md)                         | 带日期的架构、审查、交接和路线图 | 按需引用。顶层 Markdown 会加密进记忆库；时效以各文档落款为准，和代码冲突时以代码为准      |
| [runbooks/](runbooks/site-autopilot.md)               | 仍在用的操作说明         | 脚本注释和站长查阅                                            |
| [plans/](plans/2026-09-10-content-storage.md)         | 一次性实施计划          | 对照当时的任务范围，不作为现行规范                                    |
| [releases/](releases/subsite-release-2026-08-28.json) | 某次发布的验收记录        | 对照该次提交，不改写里面的历史路径                                    |
| [seo/](seo/README.md)                                 | 路由 SEO 审计基线      | `npm run seo:routes:audit`                           |
| [deliverables/](deliverables/new-message-phone.html)  | 测试读取的静态交付物       | `tests/new-message-phone.test.mjs`                   |
| personal/                                             | 备案表、座谈会材料        | 不进入记忆快照，也不当站点文档引用                                    |

## specs

| 文档                                                         | 内容             |
| ---------------------------------------------------------- | -------------- |
| [site-design-language.md](specs/site-design-language.md)   | 颜色、排版、状态和交互的总纲 |
| [loading-motion-system.md](specs/loading-motion-system.md) | 加载、等待和减少动态     |

## runbooks

| 文档                                                                            | 内容                 |
| ----------------------------------------------------------------------------- | ------------------ |
| [site-autopilot.md](runbooks/site-autopilot.md)                               | 站点自迭代扫描协议          |
| [site-status-automation.md](runbooks/site-status-automation.md)               | 故障公告自动化            |
| [cloudflare-split-plan.md](runbooks/cloudflare-split-plan.md)                 | 公开站与后台站拆分          |
| [frontend-weekly-data-pipeline.md](runbooks/frontend-weekly-data-pipeline.md) | 前端周看数据流水线          |
| [content-storage-rollout.md](runbooks/content-storage-rollout.md)             | 内容存储上线与恢复          |
| [x-owner-distribution.md](runbooks/x-owner-distribution.md)                   | X 站长分发             |
| [mcp-center.md](runbooks/mcp-center.md)                                       | MCP 中心、文章服务与 OAuth |
| [mcp-stdio-demo.md](runbooks/mcp-stdio-demo.md)                               | 本地 stdio MCP Demo  |
| [subsite-management.md](runbooks/subsite-management.md)                       | 二级站管理              |
| [subsite-account-integration.md](runbooks/subsite-account-integration.md)     | 子站统一账号接入           |

## plans

| 文档                                                                                           | 内容                                     |
| -------------------------------------------------------------------------------------------- | -------------------------------------- |
| [2026-09-10-content-storage.md](plans/2026-09-10-content-storage.md)                         | 内容存储与发布改造                              |
| [cloudflare-worker-size-gate-2026-09-15.md](plans/cloudflare-worker-size-gate-2026-09-15.md) | Worker 体积闸门                            |
| [2026-07-20/](plans/2026-07-20/planning-center.md)                                           | 规划中心、专题圈子、Nano Banana 迁移、X 情报图谱的设计与实施稿 |

`context/` 里的路线图和审查仍可能被后台页面读取。它们的索引和快照约定写在 [context/README.md](context/README.md)。
