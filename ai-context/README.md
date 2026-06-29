# ai-context 索引

项目级文档与历史快照。**时效以各文档落款日期为准**——这里的文件只在被显式引用时才进入 AI 上下文，
不会自动加载（自动加载的仓库说明在根目录 `CLAUDE.md`）。

## 在用

| 文档 | 内容 | 状态 |
|---|---|---|
| [architecture.md](architecture.md) | 技术架构总结 | 2026-05 快照，部分内容可能滞后于代码 |
| [site-review-2026-05-17.md](site-review-2026-05-17.md) | 外部 AI 视角站点犀利审查（10 问题 + 路线图） | 讨论网站迭代/变现/IP 时引用 |
| [content-layer-refactor-plan.md](content-layer-refactor-plan.md) | 内容层抽象重构工作底稿（2026-05-30） | 多周渐进计划，推进状态以文内勾选为准 |
| [web-llm-integration-notes.md](web-llm-integration-notes.md) | /web-llm 与参考项目的对照与维护原则 | 维护 /web-llm 前必读 |
| [web-llm-port-handoff.md](web-llm-port-handoff.md) | Web LLM 1:1 移植手册（跨站点复用） | 给其它仓库/新 session 用的迁移指南 |
| [site-tools-shortener.md](site-tools-shortener.md) | 站内工具「转短」设计记录 | 维护短链功能时引用 |

## archive/（已完成的一次性记录，仅作历史追溯）

| 文档 | 内容 |
|---|---|
| [archive/web-llm-1to1-port.md](archive/web-llm-1to1-port.md) | /web-llm 1:1 移植过程记录 |
| [archive/performance-optimization-report.md](archive/performance-optimization-report.md) | 2026-05-31 首屏性能优化调研记录 |

## 与其它记录层的分工

- **CLAUDE.md（仓库根）**：每次 AI 会话自动加载的最小事实集，指向各正本
- **research/README.md**：调研知识库的 frontmatter / 目录契约
- **lib/researchStyleTemplates.js**：调研写作风格的唯一正本（风格库，/admin/research-style 可视化）
- **本目录**：架构、审查、计划、交接等项目文档；一次性记录完成后移入 `archive/`
