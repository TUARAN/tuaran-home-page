# 内容可视化方案对齐记录：站点与 WorkBuddy

记录日期：2026-11-18
状态：阶段 0–2 已于 2026-11-18 落地（彩色契约、白名单扩展、试点汇总大图与彩色表格），阶段 3–4 待排期；组件与图表库限制已由站长解除
适用范围：`/articles` 下的调研文章与普通文章、`lib/research/markdown.js` 渲染链路、后台文章发布入口。
权威来源：可视化写作约定见 `research/README.md`；界面配色与可访问性见 `docs/specs/site-design-language.md`；运行时约束见根目录 `AGENTS.md`。代码与本文冲突时，以代码为准。
本轮落地的实现与验收清单见第七节「阶段 0–2 落地记录」，写作约定与白名单清单以 `research/README.md` 和代码为准。

## 一、先给结论

站点已经具备与 WorkBuddy 高度同构的三层可视化能力，本次对齐的重点落在补齐一份彩色契约、「大画布汇总」形态，以及把运行时图表接进内容渲染链路。站长于 2026-11-18 解除「不要新建组件或引入图表库」的限制，**可以新建组件或引入图表库**；运行时分层保持不变。

- **已对齐**：结构图用内嵌 SVG（`research-inline-diagram`）、流程与关系图用 Mermaid、结构化数据用 Markdown 表格，三者都有明暗主题样式和点击放大。WorkBuddy 对话里呈现的 SVG 图、Mermaid 图、表格，在站点都有对应形态。
- **真实缺口**：站点没有跨文章的内容汇总画布；调研正文的图由作者在写作时手工写入，站内没有运行时按数据出图的能力；正文里的交互式 HTML 片段被安全白名单挡住，新建客户端组件不受这条白名单约束。
- **彩色契约已补齐**：此前彩色图已经在写（`research/topics/2026-11-18-theory-system-panorama.md` 的六层架构图用了红系填充，`app/globals.css` 的 `mm-*` 系列用了蓝系），缺统一色板和明暗主题契约；阶段 1–2 已登记 `--sem-*` 双主题令牌与 `.sem-tag` 语义标签，并写进 `docs/specs/site-design-language.md`。
- **限制已解除**：`package.json` 已装 `echarts ^6.1.0`，此前只用在 `/web3/us-stocks` 与后台 `/admin/stock-analysis`，没进内容渲染链路。`research/README.md` 原写「写调研时复用既有组件，不要新建组件或引入图表库」，2026-11-18 站长确认改为「可以新建组件或引入图表库」，该节标题也已从「沿用既有组件」改为「可视化图表」。运行时图表进入调研正文由此转为可落地项，按第七节阶段 3 执行。

## 二、术语对齐：canvas 指什么

需求里说的「大的 canvas 汇总」有三种可能含义，方案不能建立在歧义上：

| 含义 | 技术形态 | 站点现状 |
|---|---|---|
| 视觉上的大图 / 汇总区块 | 一张信息密度高、可放大的结构化图或彩色表格 | 已有，`research-inline-diagram` 支持点击放大，`svg` 最大宽度 780px |
| HTML5 `<canvas>` 绘图 | 由 JS 在画布上绘制（Chart.js、ECharts 的渲染方式） | 已有库但未用于正文；正文 SVG 白名单不接受 `<canvas>` 标签，新建客户端组件不受此限 |
| 无限画布 / 白板 | Obsidian JSON Canvas、Excalidraw 那种可拖拽的节点网络 | 站内没有，属于跨文章关联视图，和正文渲染是两条链路 |

本次对齐聚焦第一种，把第三种列为可选延伸。第二种在限制解除后可以新建组件或引入图表库，按第七节阶段 3 落地。

## 三、WorkBuddy 侧调研结论

### 3.1 产品内置能力

WorkBuddy 有一套内联 Visualizer，把可视化分成四种渲染模式，直接呈现在对话里，可下载、复制、二次编辑：

| 模式 | 输出 | 说明 |
|---|---|---|
| Chart | 数据图表 | 折线、柱状、饼图、热力图、桑基图、关系网络等，第三方教程描述底层用 Chart.js（Canvas 渲染） |
| Diagram | SVG 矢量图 | 流程图、架构图、状态机、时序图，矢量优先，可复制进文档 |
| Interactive | HTML 交互组件 | 仪表盘、表单、可筛选看板，带交互逻辑 |
| Art / Mockup | SVG | 概念图、教学图、UI 原型 |

官方 Web UI 文档确认的富消息渲染包括 Markdown、代码高亮、表格、图片与 **Mermaid 图**（流程图、时序图、状态图），图表跟随明暗主题，支持复制源码与导出 SVG。

证据分级要分开写：Mermaid 有官方 Web UI 文档确认；「Chart.js / HTML 交互组件」来自第三方教程与官方公众号内容，未见产品源码佐证，按内部记录使用，不当作既成架构事实。

### 3.2 可确认的开源组件与协议

| 组件 | 协议 | 与 WorkBuddy 的关系 |
|---|---|---|
| Mermaid | MIT | 产品内置渲染，官方 Web UI 文档确认 |
| Chart.js | MIT | 第三方教程描述为 Chart 模式底层，未获源码确认 |
| Excalidraw / Rough.js | MIT | Obsidian 生态的手绘白板，非 WorkBuddy 内置 |
| ECharts | MIT | 站点自己已装（`^6.1.0`），与 WorkBuddy 无关 |

### 3.3 社区周边（容易被误读成「WorkBuddy 采用了」）

- `workbuddy-canvas`（MIT）：社区把 Codex-Canvas 移植到 CodeBuddy / WorkBuddy 会话的无限画布，复用内置 ImageGen / ImageEdit 做图片生成编辑，数据落在项目 `canvas/` 目录。
- `llm-wiki-canvas`（Apache-2.0）：把 Markdown 知识库编译成 Obsidian `.canvas` 与 `.excalidraw`，README 声明兼容 Codex、Claude Code、Qoder、TRAE 与 Tencent WorkBuddy 的普通文件工作流。
- `axton-obsidian-visual-skills`（MIT）：输出 Canvas / Excalidraw / Mermaid 三件套的 Agent Skill。

这三个是第三方项目对 WorkBuddy 的兼容或周边扩展，WorkBuddy 产品没有采用它们。写后续方案时不要把兼容声明当成官方组件清单。

## 四、站点现状核实（代码证据）

| 能力 | 落点 | 约束 |
|---|---|---|
| 内嵌彩色 SVG 图 | `lib/research/markdown.js` 的 `SAFE_DIAGRAM_TAGS` / `SAFE_DIAGRAM_ATTRS`；`isSafeResearchDiagram()` 校验整块 | 核实当时仅 13 个标签、缺 `polygon`/渐变/`stop`/`tspan` 与 `points` 等属性；阶段 1 已补齐，`style`、`href`、`xlink:href`、`src`、`on*`、`font-family`、`dominant-baseline`、`xmlns` 与危险协议仍一律拒绝，带这些的整块转义成文本。现行清单以代码与 `research/README.md` 为准 |
| 点击放大 | `makeDiagramZoomable()` 加 `data-research-lightbox`；`app/(site)/components/ImageViewer.jsx`、`ZoomableResearchMedia.jsx` | 自动生效，无需额外脚本 |
| 明暗主题配色 | `app/globals.css` 的 `.research-inline-diagram`、`.mm-*` 系列，以及阶段 2 新增的 `--sem-*` 令牌与 `.sem-*` / `.sem-tag` 类 | `mm-center` 蓝 `#4a6fa5` 等原有值保留；`--sem-*` 在 `:root` 与 `.dark` 各定义一套低饱和色板 |
| Mermaid | `markdown.js` 把 ` ```mermaid ` 转成 `.mermaid-diagram` figure；`app/(site)/components/MermaidRenderer.jsx` 客户端渲染 | 从 jsdelivr 动态加载 `mermaid@11.16.0`，`securityLevel: 'strict'`，支持缩放、拖拽平移、全屏、复制源码、主题切换；按需加载，不进主 bundle |
| 宽表格 | `renderMarkdown()` 把 `<table>` 包进 `.table-scroll`；样式在 `app/globals.css` 约 9118 行起 | 移动端横向滚动，行式分隔，站点设计语言要求列表与台账优先行式 |
| 彩色图实例 | `research/topics/2026-11-18-theory-system-panorama.md` | 六层架构图用内联 `fill`/`stroke` 配色，frontmatter 设 `auto_images: false` 关掉氛围图 |
| 运行时图表 | `echarts`、`lightweight-charts`、`three` 在 `package.json`；用于 `/web3/us-stocks`、后台 `/admin/stock-analysis`、`skill-center` | 未接入调研正文；`research/README.md` 已于 2026-11-18 改为允许新建组件或引入图表库 |
| 普通文章 | `app/(site)/components/ArticlePostBody.jsx` 按 Tiptap JSON 渲染，部分片段复用 `renderMarkdown` | 与调研正文不是同一条渲染路径，任何改造要两条链路一起核 |

设计语言的硬约束：`docs/specs/site-design-language.md` 要求低饱和强调色、正文靠字号行高建立层级、避免大量彩色卡片切碎阅读，状态不能只依赖颜色表达，深色模式需单独验证对比度。彩色规范要落在这套令牌之上。

## 五、能力对照

| WorkBuddy 对话内 | 站点 `/articles` | 判定 |
|---|---|---|
| SVG 矢量图（Diagram / Art） | `research-inline-diagram` 内嵌 SVG | 已对齐 |
| Mermaid 代码块 | `.mermaid-diagram` + `MermaidRenderer` | 已对齐，站点多了缩放/全屏/复制源码 |
| Markdown 表格 | `.table-scroll` 宽表格 + `.sem-tag` 语义标签与单元格色条 | 已对齐，彩色语义单元格于阶段 2 补齐 |
| 图表可放大 / 导出 SVG | lightbox 放大，Mermaid 可复制源码 | 部分对齐，普通 SVG 无源码导出 |
| Chart.js 数据图表 | ECharts 已装但未进正文 | 限制已解除，按阶段 3 新建组件或引入图表库落地 |
| HTML 交互组件 | 正文白名单不接受 `<script>` / `style` / 事件属性 | 新建客户端组件可实现，不照搬内联 HTML 片段 |
| 一句话生成、对话内迭代 | 作者写作时写入，走后台审批发布 | 流程不同，站内不调用大模型 |
| 无限画布 / 跨内容节点网络 | 无 | 缺口，列为可选延伸 |

## 六、对齐后的目标方案

### 6.1 分层

- **L1 静态彩色汇总图**（阶段 1 已落地）：沿用 `research-inline-diagram`，承载「一图一结论」的大图与多层汇总。彩色优先用 `sem-*` 语义类，也可用内联 `fill`/`stroke`，不做运行时计算。
- **L2 结构与关系图**：沿用 Mermaid，用于流程、时序、状态、实体关系。跨文章关系不做进正文，避免把导航结构伪装成图。
- **L3 彩色表格**（阶段 2 已落地）：在 `.table-scroll` 基础上用 `.sem-tag` 语义标签与 `:has()` 单元格色条表达分类与状态，状态词写在文字里，不靠颜色单独表达。
- **L4 交互图表**（阶段 3 待排期）：限制解除后可以新建客户端组件或引入图表库。参照 `MermaidRenderer.jsx` 的 `'use client'` + 动态加载模式，只挂客户端组件，静态 HTML 保留等价文本与表格；图表库按需加载，不进主 bundle。

### 6.2 彩色契约（阶段 2 已生效）

两套路径，各有适用面：

1. **内联 `fill` / `stroke`**：作者在写作时指定，自由度高，缺点是每篇自己配、明暗主题要各写一套。早期彩色图走这条，仍可用。
2. **预定义语义类**（现行推荐）：`app/globals.css` 的 `:root` / `.dark` 各登记一套 `--sem-*` 低饱和令牌，配套 `.sem-*` 形状/文字类、`.sem-grad-*` 渐变 stop 类与 `.sem-tag--*` 标签类。作者只写语义（核心、正向、提示、风险、次要），配色由站点统一维护。原有 `mm-*` 继续保留，两者不冲突。

落地后的硬约束：装饰性强调色在同一张图内不超过一主一辅，按类别区分时走语义色板；文字与填充对比度在明暗两套主题下都要过；每幅图配 `figcaption` 与 `aria-label`；正文有内嵌图时 frontmatter 设 `auto_images: false`；一表一类语义，状态词写进标签文字。完整契约见 `docs/specs/site-design-language.md`。

### 6.3 大画布汇总形态

「大的 canvas 汇总」在站内落地成一张信息密度更高的静态 SVG 汇总图 + 一张彩色表格，挂 `research-inline-diagram` 与 `.table-scroll`，继续享受点击放大和移动端滚动。跨文章的节点网络若要做，单独作为工具页或 `noindex` 页面，输出 Obsidian JSON Canvas / Excalidraw 供本地编辑，不进公开正文，也不向读者暴露发布、同步、维护等站长动作。

## 七、分阶段落地

| 阶段 | 动作 | 状态 | 验收 |
|---|---|---|---|
| 0 | 记录对齐判断、彩色契约草案与边界；同步 `docs/context/README.md` 索引；`research/README.md` 解除组件与图表库限制 | 已完成（2026-11-18 上午） | 文档入仓，未改运行时代码，未提交 |
| 1 | 试点 1–2 篇调研的大图与彩色表格；扩展白名单（补 `polygon`、`linearGradient`、`radialGradient`、`stop`、`tspan` 与 `points`、`offset`、`stop-color`、`gradientUnits` 等属性）并同步安全测试 | 已完成（2026-11-18） | `npm run research:style-audit`、`npm run style:check`、45 个文章测试、`next build` 全通过；明暗主题走语义令牌各一套；点击放大可用；试点文章设 `auto_images: false` |
| 2 | 把语义色类与彩色表格样式写进 `docs/specs/site-design-language.md`，和代码同一次修改 | 已完成（2026-11-18） | 明暗对比度按两套令牌复核；状态词写在标签文字里，不只靠颜色；`/help` 公开说明已同步 |
| 3（已放行，待排期） | 新建客户端组件或引入图表库，把运行时图表接入调研正文；优先复用已装的 ECharts `^6.1.0`，走动态加载 | 未开始 | 先走 Issue 优先；Worker 体积闸门不报警；首屏与静态 HTML 不受影响；明暗主题与可访问性复核 |
| 4（可选，待排期） | 跨文章 canvas 关联视图，独立页面，导出 `.canvas` / `.excalidraw` | 未开始 | 独立页面不进公开正文；`noindex`；不暴露站长工作流 |

### 阶段 0–2 落地记录（2026-11-18）

站长当次确认「按计划执行」，本轮目标定为阶段 1+2，交付形态为**只落地本地、不提交、不开 PR**。搜重已完成：`TUARAN/tuaran-home-page` 的 open Issue 与 PR 无可视化/canvas/图表相关重复项，closed 的 #405、#409 是上一轮内容稿，非同一问题。

改动清单：

- `lib/research/markdown.js`：`SAFE_DIAGRAM_TAGS` 补 5 个标签、`SAFE_DIAGRAM_ATTRS` 补 15 个属性；`isSafeResearchDiagram()` 的拒绝面（`style`/`href`/`xlink:href`/`src`/`on*`/危险协议/注释/未知标签）保持不变。新增 `extractSemanticTags()`，用与 `[!red]` 同构的 token 机制把 `[!core|good|warn|risk|mute]…[/!类别]` 渲染成 `<span class="sem-tag sem-tag--类别">`，类别走白名单、文字走 `escapeHtml`。
- `app/globals.css`：`:root` 与 `.dark` 各登记一套 `--sem-*` 低饱和令牌；在 `@layer components` 内加 `.sem-*` 形状/文字类、`.sem-tag` 系列、`:has()` 单元格左侧色条。纯 CSS，未引入运行时依赖。
- `research/README.md`：更新白名单清单，新增「彩色语义标签与彩色表格」写法与约束。
- `docs/specs/site-design-language.md`：新增「内容图表与彩色契约」章节（色板、图/表写法、硬性要求、两条渲染链路边界）。
- `app/(site)/help/page.jsx`：「浏览内容」补一条面向读者的图/表与彩色标签说明。
- `tests/articles/research-diagram-whitelist.test.mjs`（新增）：9 个用例覆盖渐变/多边形/tspan 放行、危险属性整块拒绝、标签转义与未知类别、表格内标签、`[!red]` 兼容。
- `research/topics/2026-11-17-window-account-browser-hierarchy.md`：试点载体，`auto_images: false`，新增一张七层彩色汇总大图（用上渐变、`polygon`、`tspan`、`sem-*` 类）与一张彩色语义表格。原文事实与结论未改。

验收结果：`npm run research:style-audit` 通过（0 篇开头来源声明、0 篇重复来源段）；`npm run style:check` 通过；`node --test tests/articles/*.test.mjs` 45/45 通过；CSS 经 postcss + tailwind 编译产物含全部新规则；`NEXT_DIST_DIR=.next-check npx next build` 成功。首次构建遇到沙箱文件代理 `write EPIPE`，单独重试即通过，非代码问题。审计生成物 `lib/research/styleAudit.js` 已恢复到 HEAD，不把工作区里他人未提交文章的统计固化进本次交付。

阶段 1 起任何代码改动按 `docs/runbooks/issue-first-workflow.md` 先搜重、开 Issue、打分诊标签；本轮因站长当次明确「只落地本地、不提交」，留在工作区未开 Issue/PR，后续进入正式合入流程时补走。阶段 3 的组件与图表库许可已由站长确认，不再挂 `needs:decision`；具体实施方案若缺设计或素材，仍按对应 `needs:*` 停在 Issue。助手不自动提交、不 squash、不 merge。

## 八、风险与边界

- **安全白名单**：扩展 `SAFE_DIAGRAM_ATTRS` 必须同步 `isSafeResearchDiagram()` 的测试与 `research/README.md`；`style`、`href`、`src`、`on*` 保持拒绝，避免正文成为脚本注入面。新建的客户端组件不走这条白名单，但同样不得把作者可控的脚本或内联事件写进正文。
- **运行时分层**：Edge 路由不能用 Node-only API；新增能力放客户端组件，静态 / ISR 页面保留可读 HTML，不破坏 SEO、RSS、`llms` 与 sitemap。
- **体积**：Cloudflare Pages 有 Worker 体积闸门（`docs/plans/cloudflare-worker-size-gate-2026-09-15.md`）。ECharts 体积较大，走动态加载比打进主 bundle 稳妥，Mermaid 已是这个做法。
- **两条渲染链路**：调研走 `renderMarkdown`，普通文章走 Tiptap JSON（`ArticlePostBody.jsx`）。彩色表格与大图若只改一边，两类文章会不一致。
- **内容规则**：图和表服务判断，一张图只表达一层关系；避免自我指涉与模板化假对比句；发布、分发、同步等站长动作按权限收口，不向普通读者暴露。
- **发布流程**：普通文章通过 `/admin/articles` 写入线上 `article_posts`，新调研通过 `/admin/articles/research-import` 审批。改渲染组件不等于内容已发布，需按 `AGENTS.md` 的发布核对清单逐项验证。
- **证据边界**：WorkBuddy 的 Chart.js / HTML 交互组件描述来自第三方教程，未获官方源码确认；社区项目是兼容周边而非官方采用。后续若拿到官方文档，回来更新第 3 节。

## 九、信息来源与持续验证

主要来源（资料截至 2026-11-18）：

- WorkBuddy 官方 Web UI 文档：https://www.workbuddy.ai/docs/cli/web-ui
- WorkBuddy 可视化能力解析（第三方教程）：http://mp.weixin.qq.com/s?__biz=Mzg2MDU3MzI2Mw==&mid=2247484445&idx=1&sn=59e5b145e20366ca16004da6c35c6128
- Chart.js 官方文档与仓库：https://www.chartjs.org/docs/ 、https://github.com/chartjs/Chart.js
- Mermaid 官方站与仓库：https://mermaid.js.org/ 、https://github.com/mermaid-js/mermaid
- workbuddy-canvas：https://github.com/Jarvis-Zhou/workbuddy-canvas
- llm-wiki-canvas：https://github.com/chicogong/llm-wiki-canvas
- axton-obsidian-visual-skills：https://github.com/axtonliu/axton-obsidian-visual-skills
- 站内正本：`AGENTS.md`、`research/README.md`、`docs/specs/site-design-language.md`、`docs/context/README.md`、`docs/runbooks/issue-first-workflow.md`，以及本文第四节列出的代码文件。

会改变结论的持续验证项：

- WorkBuddy Visualizer 的实际底层库清单（当前 Chart.js / HTML 组件仅有第三方描述）。
- 阶段 1 的白名单扩展与安全测试已落地（`tests/articles/research-diagram-whitelist.test.mjs`，9 个用例）。后续若再扩展标签或属性，先补对应拒绝用例再放行。
- 新建图表组件接入后，Worker 体积闸门与静态 HTML 可读性的实测结果，决定阶段 3 能否进入正式发布链路。
- 语义色类在真实浏览器明暗主题下的对比度与 `:has()` 色条可读性，已于 2026-11-18 用 Chrome 无头截图完成目视复核：真实编译 CSS + `renderMarkdown` 实际输出，明暗各出全景与局部放大快照。结论为七层汇总图（渐变/菱形衔接/多行文字）、彩色语义表格（`:has()` 左色条逐行正确）、五类标签药丸在两套主题下均可读，无浅色残留与文字溢出，未发现需修复项。快照为 `/tmp/tuaran-viz-*.png`（临时产物，不入仓）。
