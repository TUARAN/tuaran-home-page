# 项目记录索引

带日期的架构、审查、计划和交接。总目录见 [docs/README.md](../README.md)。这些文件只在被显式引用时进入 AI 上下文，不会自动加载。自动加载的仓库说明在根目录 `AGENTS.md`。

时效以各文档落款日期为准。和当前代码冲突时，以代码和配置为准。

记忆快照脚本只加密本目录顶层的 `.md`。`archive/` 和 `x-meme-generation-prompts.json` 不进入记忆库。新的项目记录放在本目录顶层，完成的一次性记录再移入 `archive/`。加密结果仍使用来源编号 `ai-context`，已有密文路径保持不变。

## 在用

| 文档 | 内容 | 状态 |
|---|---|---|
| [architecture.md](architecture.md) | 技术架构总结 | 2026-05 快照，部分内容可能滞后于代码 |
| [site-review-2026-05-17.md](site-review-2026-05-17.md) | 外部 AI 视角站点审查（10 个问题 + 路线图） | 讨论网站迭代、变现、个人标识时引用 |
| [content-layer-refactor-plan.md](content-layer-refactor-plan.md) | 内容层抽象重构工作底稿（2026-05-30） | 多周渐进计划，推进状态以文内勾选为准 |
| [content-information-architecture.md](content-information-architecture.md) | 内容分类契约、治理规则与新访客起点指标 | 修改导航、目录、分类或行为埋点前引用 |
| [content-proof-prototype.md](content-proof-prototype.md) | 内容指纹、副本、锚定和开放验证器 | 维护内容证明时引用 |
| [seo-geo-growth-roadmap.md](seo-geo-growth-roadmap.md) | SEO / GEO 现状审计、内容增长方向、分阶段任务与验收标准 | 2026-09-08 基线；后台 `/admin/seo` 直接读取，进度以文内清单为准 |
| [ui-ux-audit-roadmap.md](ui-ux-audit-roadmap.md) | UI / 交互页面问题、证据边界、10 项改造任务与复测矩阵 | 2026-09-08 首轮记录；后台 `/admin/design` 直接读取。视觉规范沿用 [docs/specs/site-design-language.md](../specs/site-design-language.md) |
| [site-health-audit.md](site-health-audit.md) | 流量、错误率、缓存与运行负载 | 后台 `/admin/site-health` 直接读取 |
| [web-llm-integration-notes.md](web-llm-integration-notes.md) | /web-llm 与参考项目的对照与维护原则 | 维护 /web-llm 前阅读 |
| [web-llm-port-handoff.md](web-llm-port-handoff.md) | Web LLM 1:1 移植手册（跨站点复用） | 给其它仓库或新 session 用的迁移指南 |
| [site-tools-shortener.md](site-tools-shortener.md) | 站内工具「转短」设计记录 | 维护短链功能时引用 |
| [a-share-company-research-automation.md](a-share-company-research-automation.md) | A 股公司观察本地 + 线上自动化设计与数据流 | 维护 A 股研究流水线时引用 |
| [deepseek-key-management.md](deepseek-key-management.md) | DeepSeek 密钥管理、任务绑定与调用记录设计 | 维护 DeepSeek 调用层或密钥时引用 |
| [digital-human-deploy.md](digital-human-deploy.md) | 数字人口播的 R2、D1 与视频提供方 | 维护 `/tools/digital-human` 时引用 |
| [x-post-images.md](x-post-images.md) | X 自动发布配图、R2 素材池、失败重试和上线顺序 | 维护 X 自动发布及素材预览时引用。配图提示词在 [x-meme-generation-prompts.json](x-meme-generation-prompts.json) |

## archive/（已完成的一次性记录，仅作历史追溯）

| 文档 | 内容 |
|---|---|
| [archive/web-llm-1to1-port.md](archive/web-llm-1to1-port.md) | /web-llm 1:1 移植过程记录 |
| [archive/performance-optimization-report.md](archive/performance-optimization-report.md) | 2026-05-31 首屏性能优化调研记录 |

## 与其它记录层的分工

- **AGENTS.md（仓库根）**：每次 AI 会话自动加载的最小事实集，指向各正本
- **docs/specs/**：现行界面规范
- **docs/runbooks/**：仍在执行的操作说明
- **research/README.md**：调研知识库的 frontmatter / 目录契约
- **lib/research/researchStyleTemplates.js**：调研写作风格的唯一正本
- **本目录**：架构、审查、计划、交接；一次性记录完成后移入 `archive/`
