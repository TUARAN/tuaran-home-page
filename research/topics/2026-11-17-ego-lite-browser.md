---
title: 「ego-lite 浏览器」核实为 ego(lite)：Citro Labs 出品的本机 Agent 浏览器
category: topics
topic_type: product
subjects: [ai_dev]
content_type: analysis
date: 2026-11-17
time: 11:00
tags: [ego-lite, ego(lite), Citro Labs, AI Agent, 浏览器, ego-browser]
summary: 「ego-lite 浏览器」的官方名称是 ego(lite)，由新加坡 CITRO LABS PTE. LIMITED（对外写作 Citro Labs）开发，是一款已可在 macOS 和 Windows 本机安装的 Chromium 浏览器，用来和本地 AI Agent 共用登录态；GitHub 仓库的 MIT 许可覆盖仓库内容，浏览器本体是单独的免费下载。
tldr: 这是已经能下载的本机 Agent 浏览器，和仍在等待名单上的完整版 ego 是同一团队宣布的两条产品线，也不是腾讯或「八爪鱼」系产品。当前宜把它当高权限本地工具来试。官方中文产品介绍与下载页、更新日志对 Windows 是否已经提供的说法还没有对齐。
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> 风险与合规提示：资料用于理解官方产品口径、许可和数据说明，不构成安装、迁移浏览器数据或授权 Agent 操作已登录网站的建议。导入密码、Cookie 并让 Agent 操作页面，会把已登录会话和页面内容交给本机 Agent 及其所用模型；是否导入、授权范围，以及提交或支付前是否人工确认，需自行判断。官方服务条款还写有个人非商业使用等限制，具体以当时条款原文为准。

## 一、先给结论

到 **2026-11-17（北京）**：「ego-lite 浏览器」对应的是 Citro Labs 放在 [lite.ego.app](https://lite.ego.app/) 上的产品 **ego(lite)**。它是一款可在本机安装的 Chromium 浏览器，官方定位是让使用者和本地 AI Agent 共用同一个浏览器：人继续用自己的标签页，Agent 通过 `ego-browser` 在独立的 Space 里打开页面、读取 Snapshot、点击和填表。仓库、下载页和隐私政策把开发主体写成 Citro Labs / CITRO LABS PTE. LIMITED，没有把它写成腾讯产品，也没有使用「八爪鱼」这个名称。

能站住的要点：

1. **这是已经发布、可以下载的桌面浏览器，不是一则只有预告的口号。** [下载页](https://lite.ego.app/zh-cn/download) 提供 macOS（Intel 与 Apple Silicon）安装包，并单独列出 Windows（beta）。[更新日志](https://lite.ego.app/changelog) 最新一条是 ego(lite) 0.6.3.17（Staged rollout），日期为 2026-11-16。Linux 出现在[路线图](https://lite.ego.app/roadmap) 的 Planned 项里，没有公布发布时间。需要分开看的是：中文[产品介绍](https://lite.ego.app/document/zh/docs/product-introduce) 仍写「目前提供 macOS 版本。Windows 和 Linux 版本正在计划中。」这和下载页、更新日志、企业页并不一致，下文按各页原文并存，不以过时介绍覆盖已经提供的下载入口。

2. **开源许可覆盖的是仓库内容，浏览器本体是单独下载的应用。** GitHub 仓库 [citrolabs/ego-lite](https://github.com/citrolabs/ego-lite) 的 README 写：「本仓库内容基于 MIT License 发布。ego lite 浏览器是独立、免费的下载产品。」仓库里主要是 `ego-browser` Skill、运行时和文档；GitHub 最新正式 Release 是 2026-11-16 发布的 `v2.2.1`，附件是 `ego-browser-v2.2.1.zip`，不是完整浏览器安装包。安装包入口在官网下载页和 `cdn.ego.app`。

3. **使用产品本身，官方写明免费、不必注册；Agent 和模型仍按原方式付费。** 下载页常见问题写：完全免费，也不用登录或注册账号。[企业页](https://lite.ego.app/enterprise) 把个人版写成 Free，并另列 Business，价格是「Custom pricing」。[服务条款](https://lite.ego.app/terms)（Last updated: May 25, 2026）则写 Services currently provided free of charge，同时保留未来推出付费方案的空间，并把 Services 写成 personal and non-commercial use。免费下载和条款里的使用范围，要分开读。

4. **它和完整版 ego、以及其他自动化工具要分开认。** 官方博客写：lite 意味着「它并不是 ego 的全部」；完整版 ego 被写成包含个人 Agent、云端沙盒、浏览器之外的系统级能力和记忆系统，并「将两者作为独立产品发布」。[ego.app](https://ego.app/) 仍写着产品在打磨中，可加入 waiting list。`ego-browser` 是驱动 ego(lite) 的 Skill / 命令行运行时，不是给人手动点的另一款浏览器。Browser Use、Vercel 的 agent-browser、Playwright、Perplexity Comet、Dia 等，是官方对比表里的邻近对象，官方没有把它们写成 ego(lite) 的别名。

## 二、事实层

资料核对窗口：约 **2026-11-17（北京）**。产品定义、平台、价格、许可和隐私口径，以官网、文档、更新日志、法律页和 GitHub 仓库原文为准。官网首页的速度、成功率、成本数字是官方自测口径，未经复现，不作为已经核实的性能结论。

### 2.1 名称、主体和易混对象

官方页面和仓库里，产品名有几种并行写法：正文和文档常用 **ego(lite)**，README 里也写 ego lite、ego (lite)，GitHub 仓库名是 `ego-lite`，安装包文件名可见 `egolite-*.dmg`、`egoliteSetup-*.exe`。「ego-lite 浏览器」和这些官方叫法指向同一条产品线。驱动层的正式名称是 **ego-browser**。英文文档把它写成把 ego(lite) 变成 Agent 浏览器的 Skill，也写成通过 Chrome DevTools Protocol 连接真实 Chromium 会话的命令行运行时。

开发与发布主体，法律页写得很明确。[隐私政策](https://lite.ego.app/privacy)（Last updated: Oct 29, 2026）和[服务条款](https://lite.ego.app/terms) 的签署方都是 **CITRO LABS PTE. LIMITED**（文中简称 Citro），隐私政策给出的注册地址是 67 AYER RAJAH CRESCENT, #02-10, SINGAPORE 139950。官网页脚写作 ©2026 Citro Labs。团队页把 [Aute](https://lite.ego.app/team/aute) 写成 Citro Labs 的 founder and CEO，并写该团队是 ego(lite) 的开发方。面向模型阅读的 [llms-full.txt](https://lite.ego.app/llms-full.txt) 也写：ego(lite) is built by Citro Labs，仓库为 citrolabs/ego-lite。新加坡公司登记底档尚未在正文里核对，股权或最终控制人仍有缺口；主体认定停在法律页、官网和仓库归属。

仓库本身由 GitHub Organization `citrolabs` 持有，创建时间为 2026-04-16T12:51:09Z（北京时间 2026-04-16 20:51），主页字段指向 https://lite.ego.app，许可证为 MIT。创建时间只能说明仓库何时公开出现，不宜直接写成浏览器首发日。更新日志最早一条是 ego(lite) 0.4.2.21，日期为 2026-06-24；更早版本是否曾发布，该页没有继续列出。

需要从这条产品说明里划出去的，主要是这些邻近对象：

- **完整版 ego。** 官网博客《[The fastest browser for AI agents to run web automation](https://lite.ego.app/blog/browser-for-run-browser-automation-tasks-in-parallel)》（Last updated Oct 15, 2026；[中文页](https://lite.ego.app/zh-cn/blog/browser-for-run-browser-automation-tasks-in-parallel) 同步）写：ego(lite) 中的 “lite” 意味着它并不是 ego 的全部；完整版还包括个人 Agent、云端沙盒环境、浏览器之外的系统级能力以及记忆系统，「我们将两者作为独立产品发布」。[ego.app](https://ego.app/) 把 ego 定义成「a personal AI agent that lives across your browser, desktop, and phone」，并写 “We are still polishing ego. Join the waitlist to get early access when we launch.” 该页还提到 subscription，以及 macOS 先发、Windows planned。已经能下载的是 ego(lite)，不宜把 lite 的可下载状态写到完整版 ego 头上。
- **ego-browser。** 它随浏览器安装，也可以用 `npx skills add citrolabs/ego-lite` 单独加 Skill。它是 Agent 调用 ego(lite) 的入口，不是又一个给普通人日常点击的浏览器应用。
- **浏览器自动化框架和 AI 浏览器。** 官方对比里反复出现 Browser Use、Vercel 的 agent-browser、Playwright / Puppeteer、Browser Harness、Browserbase，以及 Perplexity Comet、Dia、Claude / Codex 的 Chrome 扩展、各家应用内置浏览器。官方把前一类写成需要另找浏览器来驱动的框架或桥，把后一类写成自带助手、通常只服务一个 Agent 的产品。它们是对照对象，不是 ego(lite) 的官方别名。
- **「八爪鱼」采集器。** 见 2.5。公开检索里还有一些 GitHub 派生仓库沿用 `ego-lite` 名字，它们不是这条官方产品线的第二官网。

没有发现另一家公司把一款已发布的桌面浏览器同样定名为 ego(lite) 或 ego-lite，并提供可核对的官方站。主要容易混写的，是同一团队宣布的完整版 ego，以及产品内部的浏览器应用和 `ego-browser` 连接层。

### 2.2 产品定义、能力和安装入口

中文产品介绍开头写：ego(lite) 是一款运行在 macOS 上的 Chromium 浏览器，由你和你的 AI Agent 共同使用；你可以像用 Chrome 一样用它浏览网页，Agent 也在这个浏览器里完成调研、填表、采集和测试 Web 应用。英文产品介绍把平台写成 macOS and Windows，并强调：Agent 需要在同一台电脑上运行本地命令；「A web chat does not gain control of your local browser merely because you name the Skill。」Windows 专页同样把产品写成可以在 Windows 上和 Agent 一起使用的 Chromium 浏览器。

官方反复强调的机制有三层：

- **Space**：同一浏览器里的隔离工作区。官方写：它不是新窗口，不是另一个 Chrome 个人资料，也不是 headless 浏览器；所有 Space 都运行在同一个 ego(lite) 里，可以使用已有登录状态。使用者可以查看、停止或接管。能同时跑多少个，取决于本机内存和 CPU。英文文档补充：一次 macOS 焦点抽查只覆盖了有限动作，不能外推成所有焦点和权限提示都已验证。
- **Snapshot**：给 Agent 读的页面文本版本，元素带 `@3` 这类短引用。中文产品介绍写，典型页面大约 200 到 400 个 Token，并称 Snapshot 在修改过的 Chromium 引擎内部生成，因此能覆盖跨域 iframe、shadow DOM 和部分第三方组件。英文文档写得更收：一次受控测试不能证明兼容所有第三方控件。
- **ego-browser**：Agent 一次写入一段 Node.js / JavaScript 流程，在页面里连续执行 snapshot、fill、click、wait、navigate、capture 等操作。官方把它和「每次只调用一个工具再等待结果」的 Playwright / Puppeteer 式往返做对比。通信方式，下载页写的是通过 CDP（Chrome DevTools Protocol）与 ego(lite) 通信。

安装路径是可核对的。下载页提供 macOS 与 Windows（beta）入口，并写安装时会把 `ego-browser` 和相关 Skill 写入本机已安装的 Agent CLI 技能目录；首次设置会扫描 Claude Code、Codex、Cursor、Continue、Gemini CLI 等。完成后，在 Agent 里输入 `/ego-browser`，用自然语言描述任务。仓库还提供 `npx skills add citrolabs/ego-lite`：先装 Skill，Agent 第一次跑浏览器任务时再引导安装应用。首次启动会询问是否迁移 Chrome 数据；跳过后仍可在「设置 → 导入数据」里补做。下载页写：迁移是复制，不会搬空原 Chrome，迁移完成后两边不会自动同步。

更新日志 0.6.1.9（2026-10-24）还写到，除 Chrome 外，也可从 Comet、Opera、Vivaldi、Yandex、Dia、Arc、Firefox、Zen 导入，并可包含阅读列表和站点权限。同一条日志写：在取得相应授权后，Netflix、Spotify 这类受保护音视频可以播放；页面加载 DRM 内容后，ego-browser 和 Agent 不能再对其截图、录制、抓 trace 截图或打印 PDF，使用者自己打开的开发者工具不受影响。0.6.3.12（2026-11-12）写：默认关闭 On-device AI，未改设置时不再下载约 3 GB 的本地模型；聊天侧栏默认关闭，需在 `about:flags` 打开 `ask-ego-for-lite`。

「经验积累 / 可复用 skills」在产品介绍、README 和路线图里仍标为即将推出或 In progress，不宜写成已经落地的能力。

中文首页和仓库 README 还公布了一组官方自测数字：在 Real-World Bench 的 31 个真实网站任务上，官方称 ego-browser 让 Agent 完成复杂网页任务的速度比所测的其他浏览器工具快 47% 到 63%，并由同一个 Agent（pi）、同一个模型（gpt-5.6-sol）驱动。首页同时给出了平均耗时、完整成功率和平均成本的排行。这些数字全部来自官方页面，未经复现。

### 2.3 平台、版本和发布状态

把官方页放在一起看，平台口径并不完全一致：

| 出处 | 平台原文要点 | 核对日期 |
| --- | --- | --- |
| [中文下载页](https://lite.ego.app/zh-cn/download) | 有 Windows 版，目前是测试版；macOS 支持 Intel 与 Apple Silicon；Linux 在路线图上，还没有确定的发布时间 | 2026-11-17 |
| [英文产品介绍](https://lite.ego.app/document/en/docs/product-introduce) | available for macOS and Windows；本页不宣布 Linux | 2026-11-17 |
| [Windows 产品介绍](https://lite.ego.app/document/en/docs/windows/product-introduce) | 明确写成可在 Windows 上使用 | 2026-11-17 |
| [企业页](https://lite.ego.app/enterprise) | macOS & Windows apps, free download — Linux on the roadmap | 2026-11-17 |
| [中文产品介绍](https://lite.ego.app/document/zh/docs/product-introduce) | 「目前提供 macOS 版本。Windows 和 Linux 版本正在计划中。」 | 2026-11-17 |
| [官方博客](https://lite.ego.app/blog/browser-for-run-browser-automation-tasks-in-parallel)（Last updated Oct 15, 2026） | 「目前，ego(lite) 在 macOS 上免费提供，Windows 和 Linux 版本已列入路线图。」 | 原文日期 2026-10-15 |

更新日志从 2026-10-19 起已经连续出现 Windows 安装、引导和崩溃修复，例如 0.6.0.16「Fixed ego-browser crashing right away on some Windows machines」。结合 10 月 15 日博客仍把 Windows 放在路线图、10 月 19 日起日志开始大量写 Windows，可以把 Windows 测试版看成大约在这个窗口之后已经提供下载；精确到某一天的「Windows 首发日」，官方页面没有写死。

浏览器版本和连接层版本也要分开。更新日志最新是 0.6.3.17（2026-11-16，Staged rollout）；同一周期的 0.6.3.12 写，内置 ego-browser Skill 和运行时更新到 v2.2.1-beta.3。GitHub 在 2026-11-16T07:45:28Z（北京时间 15:45）发布了 ego-browser `v2.2.1`。下载页写：macOS 和 Windows 都会自动更新，新版本后台下载，下次启动生效。更新日志里还出现过浏览器引擎版本，例如升到 Chromium 156.0.8078.74、内置 Node.js v24.22.1；这是官方日志中的引擎版本记录，不是对本机安装包做的校验。

### 2.4 许可、定价、隐私和条款

许可要拆成两层。仓库 LICENSE 是 MIT，版权行写作 Copyright (c) 2026 CitroLabs。README 明确把「仓库内容」和「浏览器本体」分开。官网 [llms-full.txt](https://lite.ego.app/llms-full.txt) 把 ego-browser 写成 open source。浏览器安装包本身，官方页面写成免费下载，没有把浏览器源码仓库或开源许可证单独公布出来。

定价方面，产品介绍、下载页和企业页的个人向说明一致：应用免费下载和使用，没有订阅费，不按任务或浏览器时长收费；使用者继续为自己的 Agent 和模型付费。企业页另有 Business：「Custom pricing built around how your team runs agents at scale。」没有公开标出具体金额。服务条款写未来若推出付费功能或订阅，会在购买前披露价格和周期；「You will not be charged merely because you currently use the free Services。」同一节还写：Your Account is intended for use by a single user only. These Services are designed for your personal and non-commercial use and should not be shared with other individuals. 条款更新日（2026-05-25）早于隐私政策（2026-10-29），也早于当前下载页和更新日志。个人向「免费、无需账号」和条款里的账号、非商业使用表述，目前还没有在同一份页面上完全收拢。

隐私口径同样要分层看。产品介绍和下载页的对外说法是：浏览器跑在使用者自己的电脑上；从 Chrome 迁过来的密码、Cookie、记录、书签、扩展和个人资料保存在这台电脑上；使用不必注册账号或提供邮箱；当 Agent 操作页面时，Agent 会把页面内容发送给它所使用的模型；ego(lite) 负责在浏览器和 Agent 之间传递命令和结果。仓库 README 还写，产品数据收集比较克制，例如是否把 ego lite 设为默认浏览器。官方博客也提醒：ego(lite) 让 Agent 既能读页面、也能执行实际操作，因此获准驱动它的 Agent 应来自可信来源。

[隐私政策](https://lite.ego.app/privacy) 的适用范围更宽。它声明适用于 ego(lite) AI browser application（desktop and mobile）、browser extension、网站、cloud-based AI agent service，以及与第三方消息平台的集成。政策写：若注册账号，可能收集用户名、邮箱、电话和凭证；浏览数据默认存在本机，若打开 “Make searches and browsing better” 或 “Improve search suggestions”，可能收集访问 URL、地址栏输入和 IP 等；若打开 “Help improve ego(lite)’s features and performance”，可能把功能使用情况、标识符、IP 与地理信息、访问 URL，以及 Agent 任务原文、执行记录和相关页面内容发到其服务器。政策同时写：关闭该开关后，正常接口运行中，公司和其服务商不会在这一路径上接收这些内容；外部 AI 工具也不能通过浏览器接口读取或导出已保存的密码、认证 Cookie 或 session token，但可以用已有登录态访问网页，读到的页面里仍可能含个人数据。首次设置可选择是否自动上传崩溃报告。联系邮箱为 privacy@citrolabs.ai。

这和产品页「不必注册」并不必然互相否定：当前 ego(lite) 下载和文档把无账号作为使用条件，隐私政策则覆盖了更广的服务范围，包括可能尚未在下载页提供的 mobile、extension 和 cloud agent。完整版 ego 的官网确实写了云端执行和订阅。把隐私政策里的每一项都当成当前 lite 浏览器的默认收集行为，依据不足；忽略可选开关和「页面内容会进入你所选模型」这一条，也不完整。

服务条款要求使用者年满 18 岁，或符合居住地使用年龄并具有签约能力。非美国使用者的条款签署地写成新加坡，适用新加坡法律，争议在新加坡国际仲裁中心（SIAC）仲裁；美国使用者另有美国法律和仲裁条款。条款联系邮箱为 support@citrolabs.ai。

### 2.5 与「腾讯八爪鱼」的关系

**ego(lite) 和「腾讯八爪鱼」不是同一产品，也不宜写成同一产品的两个名称。**

依据是：ego(lite) 的官网、仓库、隐私政策和服务条款都指向 Citro Labs / CITRO LABS PTE. LIMITED，产品域名是 `lite.ego.app`，这些页面没有出现腾讯公司署名，也没有出现「八爪鱼」字样。

公开检索里更常见的「八爪鱼」是 [八爪鱼采集器](https://www.bazhuayu.com/)。该站把自己写成可视化网页数据采集工具，业务咨询邮箱为 sales@skieer.com，地址写在深圳市南山区。这和 ego(lite) 的主体、官网、产品形态都不相同。「腾讯八爪鱼」具体指腾讯自有产品、应用商店里的采集器，还是其他同名对象，不属于这篇的核实范围，也不影响上述结论：ego(lite) 不是它的别称，也不是同一主体下的另一个名字。

二者若要放在同一视野里，只是都涉及网页上的自动操作或数据获取。官方文档、安装包、账号体系和运行位置都不共用，不能据此合成一条产品。

## 三、结构分析

下载页、更新日志和本机安装包入口已经足够说明：ego(lite) 是可以安装的桌面软件。真正卡住判断的，是它把三件事叠在同一层里：日常浏览器、已登录会话，以及可被本地 Agent 驱动的自动化接口。

第一层是开放连接、封闭本体。`ego-browser` 和 Skill 在公开仓库里，许可是 MIT，Agent 侧的调用方式可以核对。浏览器则是单独分发的、经过定制的 Chromium 应用，官方强调 Snapshot 在内核里生成，而不是向普通 Chrome 注入脚本。要接受「读得更深、动作更稳」这类说法，也就同时要接受：日常浏览、密码库和扩展，跑在一家公司分发的修改版内核里，而不是跑在你自己编译的版本或官方 Chrome 里。仓库的更新频率只能说明项目活跃，不能代替对浏览器二进制的独立审计。这一点会决定：它更像可以试用的本地工具，还是可以整体替换 Chrome 的日常浏览器。

第二层是「数据在本机」和「页面会被送出本机」同时成立。官方产品文案强调密码和 Cookie 留在电脑上、不必注册。这个说法针对的是浏览数据默认存储位置，以及当前 lite 产品不强制开账号。可一旦 Agent 开始工作，Snapshot 或页面内容会进入你为该 Agent 选择的模型；若打开改进产品的开关，任务原文和相关页面内容还可能进入 Citro 的服务器。英文产品介绍把这点写得很直：Keeping the browser on your computer does not mean that page content stays out of that model's context. 官方自己也建议，支付、提交、删除之前让 Agent 停住，并确认驱动它的 Agent 来源可信。结构上，这是一款高权限本地代理工具，权限边界主要由使用者给 Agent 的权限、是否导入密码，以及模型提供方的数据政策共同决定，而不是由「免费、本机、无账号」单独保证。

第三层是文档和条款还没有完全收到同一条线上。中文产品介绍和 10 月 15 日博客仍把 Windows 放在计划中，下载页和更新日志已经提供 Windows 测试版。产品页写不必注册、个人免费；服务条款保留账号注册、个人非商业使用和未来收费的表述；隐私政策覆盖 mobile、扩展和云端 Agent，这些能力在当前 lite 下载页上并没有对应的安装入口。完整版 ego 仍在等待名单，却可能解释法律文本为什么写得比 lite 更宽。对判断的影响是：今天可以按「免费本机浏览器」去试用；若要把它写成长期可依赖的基础设施，或用于明确的商业场景，还需要看条款是否会改写、Business 如何定价，以及 lite 与完整版 ego 的数据边界会不会被打通。

首页给出的 Real-World Bench 是理解官方自我定位的材料，不足以单独支撑「在速度、成功率和成本上全面领先」这类外部结论。英文文档在焦点、并发和第三方控件上已经比中文营销页更谨慎，外部判断应跟较谨慎的那一层走。

## 四、外部研判

一种可能的外部解读是：如果你已经在用 Claude Code、Codex 或 Cursor 这类能在本机执行命令的 Agent，并且经常要在已登录的后台、表格或内部页面上做事，ego(lite) 值得跟进并做一次受控试用。它要解决的问题是清楚的——让 Agent 用上真实登录态，同时尽量不抢走你正在看的标签页。官方已经提供安装包、文档和持续更新，产品不是停留在概念页上。

如果主要需求只是换一款日常浏览器，或希望得到一个完全开源、可自行审计内核的 Chromium 发行版，目前更适合观望。浏览器本体不在 MIT 仓库里，Windows 仍标测试版，Linux 还没有发布，法律文本与产品文案也还有错位。把整份 Chrome 密码和会话一次性迁过去，再把高权限交给 Agent，代价和收益不对称。

下一步建议先小范围试用，而不是直接替换默认浏览器：使用单独的 Profile，先不导入或不完整导入密码库；在设置里核对「Help improve ego(lite)’s features and performance」等开关；给 Agent 只下只读或可撤销的任务，支付和正式提交前要求它停住。官方文档已经按这个方向写了操作提醒。若试用中登录继承、Space 隔离和 Snapshot 在你常用的站点上稳定，再决定是否扩大使用范围。对完整版 ego，仍只按等待名单产品看待，不把 lite 的可下载状态转移到那一条产品线上。

判断：**跟进试用，暂不作为日常默认浏览器来推广。** 会改变这一判断的，主要是浏览器源码或独立安全审计是否公开、Windows 是否摘掉 beta、条款中非商业使用和账号范围是否改写，以及 lite 与完整版 ego 的数据关系是否被官方写清楚。

## 五、信息来源与持续验证

资料截至 **2026-11-17（北京）**。主要来源如下：

- 产品与下载：[https://lite.ego.app/](https://lite.ego.app/)、[https://lite.ego.app/zh-cn](https://lite.ego.app/zh-cn)、[https://lite.ego.app/zh-cn/download](https://lite.ego.app/zh-cn/download)、[https://lite.ego.app/enterprise](https://lite.ego.app/enterprise)、[https://lite.ego.app/changelog](https://lite.ego.app/changelog)、[https://lite.ego.app/roadmap](https://lite.ego.app/roadmap)
- 文档：[https://lite.ego.app/document/zh/docs/product-introduce](https://lite.ego.app/document/zh/docs/product-introduce)、[https://lite.ego.app/document/en/docs/product-introduce](https://lite.ego.app/document/en/docs/product-introduce)、[https://lite.ego.app/document/en/docs/windows/product-introduce](https://lite.ego.app/document/en/docs/windows/product-introduce)、[https://lite.ego.app/document/zh/docs/quick-start](https://lite.ego.app/document/zh/docs/quick-start)、[https://lite.ego.app/document/zh/docs/ego-browser](https://lite.ego.app/document/zh/docs/ego-browser)、[https://lite.ego.app/llms-full.txt](https://lite.ego.app/llms-full.txt)
- 法律与主体：[https://lite.ego.app/privacy](https://lite.ego.app/privacy)、[https://lite.ego.app/terms](https://lite.ego.app/terms)、[https://lite.ego.app/team/aute](https://lite.ego.app/team/aute)
- 仓库与许可：[https://github.com/citrolabs/ego-lite](https://github.com/citrolabs/ego-lite)、[README.zh-CN.md](https://raw.githubusercontent.com/citrolabs/ego-lite/main/README.zh-CN.md)、[LICENSE](https://raw.githubusercontent.com/citrolabs/ego-lite/HEAD/LICENSE)、GitHub Release `v2.2.1`
- 完整版 ego 与名称说明：[https://lite.ego.app/blog/browser-for-run-browser-automation-tasks-in-parallel](https://lite.ego.app/blog/browser-for-run-browser-automation-tasks-in-parallel)、[https://lite.ego.app/zh-cn/blog/browser-for-run-browser-automation-tasks-in-parallel](https://lite.ego.app/zh-cn/blog/browser-for-run-browser-automation-tasks-in-parallel)、[https://ego.app/](https://ego.app/)
- 易混对象对照：[https://www.bazhuayu.com/](https://www.bazhuayu.com/)

持续验证（只保留会改变结论的缺项）：

- 中文产品介绍和 10 月 15 日博客若正式改写 Windows 状态，平台部分可以不再并列保留「计划中」的旧句。
- 若官方公布浏览器本体源码、独立安全审计，或改变「仓库 MIT、应用单独下载」的许可结构，「不宜直接替换日常浏览器」的判断需要重写。
- 服务条款中的个人非商业使用、账号条款，以及 Business 定价若落地，会影响「免费本机工具」能否用于明确的商业或团队场景。
- 若 lite 下载页开始提供 mobile、扩展或云端 Agent，或与完整版 ego 打通账号和数据，需要重新核对隐私政策里那些更宽的适用范围是否已经变成默认行为。
- 官方基准测试若出现可复核的原始记录或第三方复现，再决定是否采用其速度和成本数字。
