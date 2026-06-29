---
title: Codex 学习资源收集：逸尘 X 链接帖归档
date: 2026-06-29
time: 11:20
tags: [Codex, AI Agent, Computer Use, 记忆系统, Obsidian, 自动化, App开发, 自媒体, 资源集成, 学习路径]
summary: 基于逸尘 2026-06-23 发布的 Codex 资源索引，按链接帖主题整理为变现实战、新手入门、记忆系统、Agent 开发、工具自动化、Computer Use 和产品比较七个模块。
resource_type: codex-learning
assistance: codex
model: gpt-5.5
pv: 0
---

> **来源说明**：本文基于逸尘在 X 发布的 Codex 资源索引做站内整理。原帖发布时间为 2026-06-23 22:19（北京时间）。这里不做全文转载，只把主帖和链接帖按主题归档，保留原始链接，方便站内检索和回看。

## 模块导航

- [模块 1：边玩边赚钱与实战变现](#模块-1边玩边赚钱与实战变现)
- [模块 2：Codex App 新手入门](#模块-2codex-app-新手入门)
- [模块 3：记忆系统优化](#模块-3记忆系统优化)
- [模块 4：Agent 开发与部署](#模块-4agent-开发与部署)
- [模块 5：工具集成与自动化](#模块-5工具集成与自动化)
- [模块 6：Computer Use 与实战案例](#模块-6computer-use-与实战案例)
- [模块 7：产品比较与日常使用](#模块-7产品比较与日常使用)

## 资源全图：七个模块

> **读表方法**：每一行都对应一个已抓取的链接帖。普通短帖按原帖正文归档；X Article 按公开返回的标题和预览正文归档，不全文转载。

<a id="21-边玩边赚钱与实战变现"></a>

## 模块 1：边玩边赚钱与实战变现

收录范围：办公自动化、3D 视频、电商自动化、图像变现、App 上架、数据中台等。

| 资源 | 原帖内容归档 | 怎么读 | 链接 |
|---|---|---|---|
| Codex 进阶实战：办公四件套、3D 视频、电商自动化 | X Article：标题为「Codex App 边玩边赚钱实战教学：那些不为人知的使用秘诀」。公开预览写到：上一篇讲 Codex App 从 0 到 1 入门和基础配置，这一篇转向把 Codex App 用到真实业务里做提效降本。 | 当作案例总入口，重点看 Codex 如何进入具体业务流程。 | [X 原帖](https://x.com/gengdaJ/status/2053724702993190917) |
| GPT-image 变现路线 | 短帖：从 GPT-image 图片案例集合站出发，继续扩展案例和优化体验；再引入 Seedance 案例；变现路径包括广告、虚拟资料、Skill 打包售卖、自营图片视频平台、同款一键生成、官方/中转站合作和 KOC/KOL 共创。 | 适合学习“内容案例库 -> 流量 -> 产品化”的拆法，不要直接照搬收益预期。 | [X 原帖](https://x.com/gengdaJ/status/2052569175755829477) |
| 用 Codex 做出第一款付费 App | 短帖：作者称一款锁屏待办 App 已完成网站和 App 备案，进入华为审核；信息填写和备案流程大量由 Codex 完成。产品已有上百位付费用户，当前仅限安卓，使用 Flutter，后续计划扩展 Mac 与 iPhone。 | 看 Codex 如何参与资料填写、备案、审核与产品上线，而不是只看“付费用户”结果。 | [X 原帖](https://x.com/gengdaJ/status/2061652037298004332) |
| GUI 数据中台设想 | 短帖：计划用 Codex 做一个 GUI，把微信、X、飞书和各平台数据统一可视化，服务于日报总结、话术分析、销售推进、收藏精选和待办梳理；当时正在跑微信数据可视化。 | 适合做“个人/小团队数据中台”的选题入口。 | [X 原帖](https://x.com/gengdaJ/status/2054928950783299838) |

<a id="22-codex-app-新手入门"></a>

## 模块 2：Codex App 新手入门

收录范围：安装、权限配置、Codex 与 Claude Code 差异、常见代理问题修复。

| 资源 | 原帖内容归档 | 怎么读 | 链接 |
|---|---|---|---|
| Codex App 入门指南 | X Article：标题为「Codex App 从0到1完整入门教程：把这个超级APP的每一个细节抽丝剥茧讲清楚」。公开预览强调新手常见问题：从哪里开始、是否需要大量配置、如何理解基础使用入口。 | 新手先读，解决“怎么打开、怎么授权、怎么让它动本地文件”。 | [X 原帖](https://x.com/gengdaJ/status/2051891231953920174) |
| 新对话代理问题修复 | 短帖：针对新对话 reconnecting 多次的问题，建议同时配置 HTTP/HTTPS/ALL 与 WS/WSS 代理；把代理写进 `~/.codex/config.toml`；用 `launchctl setenv` 写入 macOS 图形应用环境；最后完全退出 Codex 再重启。 | 适合网络环境复杂、Codex Desktop 新会话经常断连的人。 | [X 原帖](https://x.com/gengdaJ/status/2053082764463968671) |
| Codex App 与 Claude Code 对比 | 短帖：作者偏向 Codex App + ChatGPT，理由包括 GUI 比 CLI 更友好、App 形态上手更快、插件安装更简单、Word/Excel/PPT/电脑操控插件可直接用于工作、Claude Code 的 skills 可以迁移到 Codex。 | 当作作者视角，不当作绝对评测；用于理解“为什么普通用户更偏 Codex”。 | [X 原帖](https://x.com/gengdaJ/status/2049096540807893351) |

<a id="23-记忆系统优化"></a>

## 模块 3：记忆系统优化

收录范围：项目记忆、Obsidian、SQLite、向量检索、长期偏好和多 Agent 共用记忆模板。

| 资源 | 原帖内容归档 | 怎么读 | 链接 |
|---|---|---|---|
| 基于 EverOS 重构 Codex 记忆系统 | 短帖：把原 Obsidian Markdown 记忆升级为 EverOS 思路：Markdown 作为可信事实源，SQLite 记录状态，区分用户记忆和 Agent 记忆，用 case/skill 机制沉淀重复流程，并按 user_id、agent_id、app_id、project_id、session_id 做过滤；后续预留 LanceDB 和多模态摄取。 | 把它当作“记忆系统设计原则”，不是只复制目录结构。 | [X 原帖](https://x.com/gengdaJ/status/2067985719675773192) |
| Codex + Obsidian + SQLite + 向量检索 | 短帖：在 Codex + Obsidian 记忆系统上增加 EmbeddingGemma 与 Zvec。分工为 Markdown 存原文、SQLite 做关键词和字段过滤、EmbeddingGemma 转向量、Zvec 保存和检索向量，最后回读 Markdown；作者给出 benchmark，称向量检索命中率明显高于关键词检索。 | 适合已有记忆库、想提高召回准确率的人。 | [X 原帖](https://x.com/gengdaJ/status/2068555151733043504) |
| Obsidian 长期记忆系统提示词 | 长帖：给出一段让 Codex 直接搭建 Obsidian-first 长期记忆系统的提示词，核心要求包括 Markdown 为唯一事实源、SQLite 只做状态层、不接外部 API、不保存敏感信息、不保存完整聊天流水、只读取 AGENTS/INDEX 和最相关文件，并创建用户记忆、项目、工作流、决策、agent/cases、skill-candidates 等目录。 | 适合“懒人一键搭”，但执行前要确认路径和隐私边界。 | [X 原帖](https://x.com/gengdaJ/status/2067985724809642159) |
| 外接 Obsidian 大脑优化 | 短帖：提出一个更省 token 的 Obsidian 记忆库结构：默认只读 AGENTS.md 和 INDEX.md，再按关键词读取最相关 1-3 个文件；只保存长期有效内容，如偏好、边界、项目路径、关键命令、排查结论、工作流和未闭环事项；任务结束做 memory closeout。 | 这是最实用的一条，能直接降低 token 浪费。 | [X 原帖](https://x.com/gengdaJ/status/2061756699170807819) |
| 多 Agent 共用记忆模板 | 短帖：作者把 Codex + Obsidian + SQLite 记忆系统做成模板并开源，定位是让不熟悉原理的人可以 fork 使用。 | 想快速落地可从模板 fork；想长期用仍要理解每个字段。 | [X 原帖](https://x.com/gengdaJ/status/2068217064729592095) |

<a id="24-agent-开发与部署"></a>

## 模块 4：Agent 开发与部署

收录范围：产品对齐、PRD、Plan 拆解、迭代整合、生产部署。

| 资源 | 原帖内容归档 | 怎么读 | 链接 |
|---|---|---|---|
| 从 0 到 1 开发并部署生产级 Agent | 短帖：以“书镜”Agent 为例，先用问答和 Codex 对齐产品并写 PRD，再拆多个 Plan.md，用 Skill 写 `/goal` 提示词，切到目标模式开发；一轮后把 plan 整合成 consolidation.md 再迭代。部署侧选择 EdgeOne Makers，因为模板、记忆系统、沙箱、链路追踪、模型网关、前后端同项目等能力相对开箱即用。 | 重点学习“开发一轮 -> 总结 -> 再开发”的项目节奏。 | [X 原帖](https://x.com/gengdaJ/status/2069345006859805168) |
| 非技术小白用 Codex 做完整项目 | 短帖：作者向高强度使用 Claude Code / Codex 的技术用户发问：技术小白完整开发项目的最佳路径是什么。原帖暴露了作者当前理解中的流程：提需求、一次性开发、慢慢修改、功能正常、开卖、收集用户需求、继续迭代。 | 适合反思：非技术用户缺的不是灵感，而是工程阶段划分和验证方法。 | [X 原帖](https://x.com/gengdaJ/status/2049437572959744222) |

<a id="25-工具集成与自动化"></a>

## 模块 5：工具集成与自动化

收录范围：微信、飞书、ChatGPT Pro、Computer Use、Playwright、开源模型、Skill 等工具连接。

| 资源 | 原帖内容归档 | 怎么读 | 链接 |
|---|---|---|---|
| Codex 打通微信/飞书归档合同交付物 | 短帖：作者称 Codex 每天处理最多的任务之一，是把重要微信群聊消息快速过滤成精华版本。 | 这是“信息流 -> 可检索资产”的典型自动化。 | [X 原帖](https://x.com/gengdaJ/status/2069052715221782979) |
| Computer Use 连接 Codex 与 ChatGPT Pro | 短帖：作者用 Computer Use 打通 Codex 和 ChatGPT Pro 网页版，使 Codex 在产品调研或复杂思考时可以调用 Pro 模型，并附了 `chatgpt-web-research` skill 仓库链接。 | 适合需要强模型但仍想在 Codex 工作流内调度的人。 | [X 原帖](https://x.com/gengdaJ/status/2068608638626017702) |
| Codex 插件推荐：Computer Use 与 Playwright | 短帖：作者把 Computer Use 列为最好用插件之一，强调电脑操控是 Codex 独有强项，并引导到 Computer Use 多场景玩法帖。 | 适合做插件安装优先级清单。 | [X 原帖](https://x.com/gengdaJ/status/2065019075760382327) |
| Codex 支持 DeepSeek / GLM / Kimi | 短帖：作者称 Codex App 已可官方接入第三方模型，因此可以换用 DeepSeek、GLM、Kimi 等模型。 | 作为模型路由/本地供应商配置线索，实际配置仍看官方文档。 | [X 原帖](https://x.com/gengdaJ/status/2067233776540016887) |
| Codex + GPT5.5 微信双开 Skill | 短帖：作者称用 Codex App 配合模型和图像生成处理微信双开，一次性完成并生成蓝色图标；附了 `mac-wechat-dual-open` skill 仓库链接。 | 看 Skill 如何把一次性操作固化为可复用工具。 | [X 原帖](https://x.com/gengdaJ/status/2049047427383210334) |

<a id="26-computer-use-与实战案例"></a>

## 模块 6：Computer Use 与实战案例

收录范围：点击、输入、截图、修配置、跑审核流程等真实软件界面操作案例。

| 资源 | 原帖内容归档 | 怎么读 | 链接 |
|---|---|---|---|
| Computer Use 用法清单 | 短帖：列出多种 Computer Use 场景，包括自动开发浏览器插件并端到端测试、Obsidian 到公众号/X 插件、华为开发者平台和阿里云备案审核、法信/北大法宝检索并生成 Word 报告、修网络、上传网盘、下载素材、截图打码、下载工具、剪映导入、表情包上架等；也说明部分后台可能禁用 Computer Use，需要改用 Playwright MCP。 | 这是 Computer Use 最值得反复看的案例库。 | [X 原帖](https://x.com/gengdaJ/status/2061824810267906059) |
| Codex 完成 App 备案与华为审核 | 短帖：作者复盘鸿蒙 App 上架过程，认为 Codex 理论上能帮忙完成备案，但上传压缩包、上传截图、输入路径等动作人类更快；问题不是不会指挥，而是 Computer Use 和 token 成本可能过高。 | 非常重要，提醒自动化要算成本。 | [X 原帖](https://x.com/gengdaJ/status/2065418851240620505) |
| Codex 修 WiFi 连接问题 | 短帖：作者回家后 WiFi 连接报错，尝试无果后让 Codex 检查，称约 2 分钟修好。 | 适合作为本地系统排障的轻量案例。 | [X 原帖](https://x.com/gengdaJ/status/2067543658283548796) |

<a id="27-产品比较与日常使用"></a>

## 模块 7：产品比较与日常使用

收录范围：Codex / Claude Code 对比、站点生成命令、作者主页资源检索和线下分享反馈。

| 资源 | 原帖内容归档 | 怎么读 | 链接 |
|---|---|---|---|
| Claude Fable5 vs Codex | 短帖：作者看完 Claude Fable5 测评后承认其强且贵，但不打算从 Codex 切换，因为个人工作流已固定，Codex 对他更顺手；同时提醒保持冷静，不要因热点增加焦虑。 | 重点读“工作流惯性”这层，不是简单站队。 | [X 原帖](https://x.com/gengdaJ/status/2064503056474222925) |
| Codex /Sites 命令做团队网站或 App | 短帖：作者提到 Codex 更新后可用 `/Sites` 构建网站或 App 并分享给团队成员，也提到 ChatGPT 与 Codex 可能进一步融合；但当时 `/Sites` 仅对团队版和企业版开放。 | 适合关注 Codex 从开发代理走向协作产品的方向。 | [X 原帖](https://x.com/gengdaJ/status/2061992858585075972) |
| Claude vs GPT Codex 全面对比 | 短帖：原帖实际抓取到的是 Codex 用户突破 500 万、用量即将重置，以及提醒开启 `/fast` 的短评。 | 这条不适合作为严肃对比来源，只当作产品热度信号。 | [X 原帖](https://x.com/gengdaJ/status/2060965779605213483) |
| 搜索作者主页 Codex 推文 | 短帖：作者建议在其主页搜索「Codex」学习历史推文，再用 Grok 扩展搜索 X 上中英文 Codex 博主。 | 这是资源扩展方法，不是一条具体教程。 | [X 原帖](https://x.com/gengdaJ/status/2063147147223355740) |
| 重庆线下 Codex 分享 | 短帖：作者参加重庆 waytoagi 线下分享后反馈，很多参与者仍是第一次听说 Codex，认为 AI 赋能个体、企业培训、企业知识库搭建、个人提效仍处早期；建议把 Codex 落到具体工作和业务流程里。 | 适合判断 Codex 中文市场教育阶段。 | [X 原帖](https://x.com/gengdaJ/status/2061074796369358916) |

## 来源

- [逸尘：Codex 资源索引原帖（X，2026-06-23）](https://x.com/gengdaJ/status/2069425112651272493)
- [被引用的 Agent 开发与部署视频帖](https://x.com/gengdaJ/status/2069345006859805168)
