# tuaran-home-page Agent Instructions

本文件是仓库内所有 AI 开发代理的通用规则与项目上下文的唯一正本。工具专属入口文件只引用本文件，不重复维护通用内容。

## Codex 开发八荣八耻（强制遵守）

- 以臆猜接口为耻，以查档求证为荣。
- 以模糊排期为耻，以对齐需求为荣。
- 以脑补业务为耻，以依规请示为荣。
- 以新增冗余为耻，以复用存量为荣。
- 以省略校验为耻，以完备测例为荣。
- 以擅改架构为耻，以恪守规范为荣。
- 以不懂装懂为耻，以坦诚存疑为荣。
- 以批量乱改为耻，以分步迭代为荣。

## 项目概览

- Next.js 15 App Router 个人站，部署在 Cloudflare Pages（Functions + D1）。
- 使用 JavaScript（无 TypeScript）、Tailwind CSS 3、React 19。

## 关键目录

- `app/`：页面、布局、API 路由；`app/(admin)/admin/*` 为站长后台，由 `AdminPageGate` 鉴权。
- `lib/`：运行时封装与数据。`edgeSession.js` 处理自定义 GitHub OAuth 与签名 Cookie；`d1.js` 读取 D1 binding；`researchStyleTemplates.js` 是调研风格库；`contentPipeline.js` 是文章、调研、资源的统一内容注册表，`contentKey` 与评论的 `articleKey`、燃币的 `resourceKey` 使用同一套约定。
- `research/`：调研知识库（companies / topics / people），Markdown 落盘，构建时由 loader 渲染到 `/articles`。
- `migrations/`：D1 SQL。
- `ai-context/`：项目文档与历史快照，索引见 `ai-context/README.md`；以各文档落款日期判断时效。

## 规则与资料的优先级

- 通用代理规则与项目上下文：以本文件 `AGENTS.md` 为唯一正本。
- 调研 frontmatter 与目录契约：以 `research/README.md` 为准。
- 调研风格与措辞：以 `lib/researchStyleTemplates.js` 中 `status === 'active'` 的版本为唯一正本；写调研前必须先选择并读取当前生效风格，不得凭旧模板复述。
- 架构细节：参考 `ai-context/architecture.md`，但它是带日期的历史快照；与当前代码冲突时，以当前代码和配置为准。
- 工具专属入口只负责兼容加载或专属命令，不得复制通用规则；发现重复时应回收到本文件。

## 调研知识库协作

- 写任何调研前先选风格，例如默认调研、人味调研、周刊解释、投研备忘、资料档案。
- Claude Code 可使用 `/research-company <名称>`、`/research-topic <事项>`；命令定义位于 `.claude/commands/`。
- 不要自动提交调研产出，须由站长确认后再提交。
- 网站不调用任何大模型；调研作者统一记为 `TUARAN`，AI 仅作为协助工具标注在 `assistance` 字段。

## 避免自我指涉（强制遵守）

- 公开内容默认从读者要理解的问题、可获得的信息和可执行动作出发，不围绕“本站为什么这样写”“作者接下来要讲什么”“系统为什么要设计这套机制”展开。
- 作者正文禁用模板化假对比句“不是 X，而是 Y”。应直接陈述 Y，或拆成可以验证的具体事实；不得把普通事实强行包装成对立、转折或价值拔高。
- 作者正文禁用“谁接住谁”“没人接得住”“有人托住 / 兜住某人”等悬浮比喻来概括人物、组织、代际或制度关系。直接写清责任归属、支持方式、继承机制、资源条件或失败原因；“接住实物”“承接产业转移”等具有明确字面含义的表达不受影响。
- “本文 / 本篇 / 本调研 / 本页 / 下面 / 接下来”等元指涉没有实际范围或导航作用时必须删除，直接进入主题。真实界面导航、章节范围、适用边界和时间顺序可以保留。
- 引用原文、法律或安全声明、风险边界、必要范围说明，以及专门研究语言现象或自我指涉的内容属于例外；不得为了满足字面规则而改坏事实、引文和研究对象。
- 功能设计优先呈现读者可理解的明确动作，例如分享、复制、下载、获取、使用和查询权益。发布、分发、同步、维护等站长工作流必须按权限收口，不向普通读者暴露为公共能力。
- 信息架构应为同一说明保留一个权威入口；重复的站点自述应合并或重定向。创作过程、路线图、维护成本、上下文记忆和内部运营记录默认下沉到页脚、个人实验区、站长入口或 `noindex` 页面。
- 批量治理必须按 Markdown 结构和语义上下文逐项判断，不得对全库执行无差别正则替换。修改后运行 `npm run research:style-audit`，确认目标规则没有待修复项，并复核被保护的引用、安全声明和范围说明。

## 运行时约束

- 三层运行时并存：静态/ISR 页面、Cloudflare Edge API（`runtime = 'edge'`）、浏览器端推理（`/web-llm`，WebGPU）。
- Cloudflare 构建：公开站使用 `npm run pages:build:public`，后台站使用 `npm run pages:build`（`@cloudflare/next-on-pages`）；配置位于 `wrangler.toml` 与 Cloudflare Pages Build settings。
- Edge 路由不能使用 Node-only API；D1 必须通过 `lib/d1.js` 获取 binding。

## 历史遗留

- NextAuth 相关文件已废弃，`[...nextauth]` 路由返回 410。
- `lib/stompDb.js` 是 better-sqlite3 本地版本，线上不使用。

## Git 发布规则

- 用户说“push”时，只提交当前任务范围内的改动并推送当前分支；如果当前分支是 `main`，就直接推送 `main`。不要因此自动创建分支或 Pull Request。
- 用户说“开 PR”或“建分支”时，创建 `codex/<简短任务名>` 分支，提交任务范围内的改动，推送分支并创建 Pull Request。
- 工作区混有其他改动时，默认只暂存当前任务相关文件；只有用户明确要求提交全部待提交改动时，才一并提交。
- 用户对本次发布方式的明确指令优先于默认工作流或工具建议。
