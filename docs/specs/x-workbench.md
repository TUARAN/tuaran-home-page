# x.2aran.com：X 创作与互动工作台

2026-11-22 · 状态：第一版已写（仿 bluev.fun 与 xbangdan.com 的功能面，先完成再优化）· 面向外部用户

## 定位

公开首页展示简中区 X 热榜，并对照正在使用智能体插件的账号当天动作。

```
智能体 → 插件 → 读本
```

公开首页只展示站长智能体 @TuaranX 的插件日报动作，不展示第三方推文榜、涨粉榜或收录账号。智能体账号池（日历等）在 `lib/interaction/agentPool.js` 维护，当前三个账号，可扩至更多。读本为大互动理论（`/theory`）、日历与圆桌；智能体手册（`/docs`）与排期、海报在登录后的 `/x-workbench/ops`。

配对、排期、改写、海报在 `/x-workbench/ops`，登录后使用。核心产品仍是「X 大互动智能体」。

## 已确定

- 面向外部用户，需要多租户、额度、付费与滥用防护。
- 账号沿用主站登录态：`lib/auth/edgeSession.js` 已支持 `Domain=.2aran.com` Cookie；`x.2aran.com` 通过 `/api/me` 与 `SharedSessionProvider` 展示与主站同一账号，未登录时跳转 `2aran.com/login?returnTo=`。
- 云端负责规划、改写、排期和数据；操作 X 页面的动作全部由 Chrome 插件执行。

## 已采用的决策（站长 2026-11-22 确认按推荐方案）

| 项 | 决策 |
| --- | --- |
| 仓库与部署 | 同仓库、同一个 Pages 项目，`x.2aran.com` 作为自定义域，中间件把 `/` 改写到 `/x-workbench`（与 `rank.2aran.com` 同一做法）。Worker 体积逼近上限时再拆独立项目 |
| 首期 | P1 智能体上云，先于雷达与改写 |
| 付费 | P5 之前不收费，但从 P0 起按用户记账额度，超额拒绝 |
| X 凭据 | 云端不存 X OAuth token，只走插件 |

## 技术选型（落地前需核实各项当前状态）

| 层 | 选择 |
| --- | --- |
| Web | Next.js 15 + Tailwind + shadcn/ui |
| 边缘 API | Hono |
| LLM 调用 | Vercel AI SDK，文本模型按 `automation-strategy` 默认 DeepSeek |
| 智能体运行时 | Cloudflare Agents SDK（每个 X 账号一个 Durable Object） |
| 任务与定时 | Cloudflare Queues + 独立 Cron Worker（Pages 不支持 cron） |
| 海报 | Satori + resvg，沿用 `app/api/og` |
| 插件 | 保持现有原生 JS，新增模块可用 WXT；不重写 |
| 部署 | 沿用 next-on-pages；OpenNext 迁移单独评估，不与本项目绑定 |

不引入 LangChain、CrewAI 等重型多智能体框架：现有 Harness 是受限循环，原则校验必须留在自己手里。

## 外部用户带来的约束

1. **租户隔离**：所有 `x_` 表带 `user_id`；X 账号绑定在主站用户下，记忆、人格、草稿按 `user_id + x_account` 隔离，对应 Harness 原则 6。
2. **凭据**：不保存用户的 X 密码。需要云端调 X API 时才存 OAuth token，加密存储，可随时撤销删除；默认只走插件，不存 token。
3. **额度**：改写、生图、智能体对话按用户月额度计量，超额拒绝而不是降级偷跑；成本数据进后台。
4. **平台风险**：
   - 雷达只使用公开可见数据和插件在用户自己登录态下能看到的内容，不做批量抓取。
   - 智能体沿用「少而准」：云端排期不得越过插件的上限和冷却，不提供调高上限、缩短冷却、绕开检测的选项。
   - 对外说明写明风险由用户的 X 账号承担，文案走白名单引用，不写成营销承诺。
5. **内容安全**：改写和生图输出需要基础审核与举报入口；封禁用户须同时失效其插件会话。
6. **隐私**：用户草稿、记忆默认私有；提供导出与删除。

## 数据（草案，具体字段以迁移为准）

- `x_accounts`：user_id、handle、绑定状态
- `x_agent_profiles`：账号人格、记忆（沿用 `xrcAgentProfilesV1` 结构）
- `x_drafts`、`x_schedules`：草稿与排期
- `x_radar_sources`、`x_radar_items`：监控账号、关键词、爆点条目
- `x_usage`：额度与成本记账

迁移放 `migrations/`，由站长手动执行。

## 分期

| 期 | 内容 |
| --- | --- |
| P0 | 子域名、鉴权互通、`x_` 表、账号绑定、额度记账 |
| P1 | 智能体上云：人格与记忆同步；插件「工作台桥」；新增只读工具 `draft.list`、`schedule.queue`、`stats.account` |
| P2 | 雷达：监控账号、关键词、话题聚合 |
| P3 | 创作台：改写、找角度、风格、海报 |
| P4 | 定时发布与复盘回流 |
| P5 | 套餐与付费、后台 |

## 不做

- 不重写现有扩展。
- 不提供批量抓取、批量关注、绕开 X 检测的能力。
- 云端不直接执行任何写 X 的动作。

## 实现状态（2026-11-22）

| 项 | 状态 | 位置 |
| --- | --- | --- |
| P0 表：账号、人格记忆、额度 | 已在远程 D1 执行，结构与文件一致 | `migrations/0130_x_workbench.sql` |
| P1/P4 表：草稿、排期 | 已在远程 D1 执行，结构与文件一致 | `migrations/0131_x_workbench_drafts.sql` |
| 纯逻辑、D1 读写、排期队列 | 已写并有测试 | `lib/x/workbench/` |
| API：accounts / profile / usage / drafts / schedules | 已写 | `app/api/x-workbench/` |
| 雷达与监控表 | 已在远程 D1 执行；2026-11-23 补上当时缺失的 `x_radar_topic_suggestions` | `migrations/0134_x_workbench_radar.sql` |
| 雷达（爆发指数、筛选、监控备注、手动收录）、账号榜（今日/昨日/7 天 × 发帖/评论/曝光/互动，北京时间 8 点为界） | 已写并有测试 | `lib/x/workbench/radar*.js`、`app/api/x-workbench/{radar,leaderboard}` |
| AI 改写、找角度（扣额度，失败退回；带账号人格与记忆） | 已写并有测试，需要 `DEEPSEEK_API_KEY` | `lib/x/workbench/rewrite*.js`、`llm.js` |
| 海报（浏览器内 SVG 转 PNG，下载与复制） | 已写 | `posterCore.js`、`PosterTab.jsx` |
| 公开首页（@TuaranX 插件日报）；读本为大互动理论；智能体手册在 ops；运营在 `/x-workbench/ops`（智能体 / 排期 / 海报） | 已写 | `app/(x)/x-workbench/` |
| 插件桥模块（同步人格记忆、领取与回报排期、提交采集推文） | 已接入 `background.js`，使用 Bearer 配对令牌；有本地门禁与重启测试 | `tools/x-reply-clipboard-extension/workbenchBridge.js` |
| 测试 | `tests/x-workbench/`、`tests/extensions/workbench-bridge.test.mjs` | |

排期语义：云端只排队。插件领取到期条目（`claim`），按本机上限与冷却决定能否执行，再回报（`report`）。领取后 15 分钟未回报会回到队列。

## 阻塞与待决（同步贴到 Issue）

做不了或需要站长动手的事，按谁来处理分类。

**需要站长在 Cloudflare / 本机操作**

1. 工作台迁移 0130、0131、0133、0134 已在远程库 `tuaran-me` 执行。0132 属于独立记忆库，这次没有执行。
2. 给 Pages 项目添加自定义域 `x.2aran.com` 并配置 DNS。
3. 重新核对 `lib/site/subsiteOrigins.js` 中新增的 `https://x.2aran.com`，它同时放行了登录回跳。
4. 本机已有他人未提交的改动（`app/api/auth/callback/x/`、`LoginClient.jsx`、`edgeSession.js` 等，疑似 X 登录）。提交工作台前要分开暂存，避免混入。

**需要站长决策**

5. 付费：套餐档位、价格、收款方式。P5 之前全部走 `free`，额度数字（改写 30、配图 10、智能体对话 200，账号 3 个）是占位值。
6. 已决定：雷达只走插件在用户登录态下采集，不做云端抓取，不接 xbangdan 或其付费 MCP。以下资料保留为历史调研背景。

   2026-11-22 调研：xbangdan 官方没有公开采集方式，页面只写「根据公开数据推算」「持续回访曝光」，收录账号走人工审核名单。其 MCP（`xbangdan.com/api/mcp`）是 ¥999/年的付费卡密，页面未写允许二次分发或商用，不能拿来当本站数据源。同名第三方开源项目 `xiongma0-at/x-bangdan` 的做法是 Apify 定时抓取（搜索语句 `lang:zh-cn min_faves:100 -filter:replies`，每小时一次，GitHub Actions 或 Cron 触发）。可选来源：A 插件在用户登录态下提交（已有配对码与「提交当前页面推文」按钮）；B 付费第三方抓取服务加 Cloudflare 定时入库，需要站长提供密钥并确认成本与合规。
7. AI 改写、生图用哪个模型与密钥。文本默认 DeepSeek，生图未选。云端密钥只能放 Cloudflare Secret。

**需要先验证，我这边做不了**

8. 插件已走配对 Bearer 令牌，`credentials: omit`，不依赖 Cookie；真实插件联调仍待验证。
9. 已接入启动/会话同步、闹钟领取与回报。只有普通发帖排班启用、无运行任务、无待发队列、额度明确可用且冷却结束才领取；使用已打开的 X 首页，不自动打开浏览器。未知结果保守回报失败，本机保留尝试记录防止同一排期再次发送。
10. 公开站 Pages 构建及独立 verifier 已通过。后台构建的路由隔离修正后通过，但 raw 比基线增长 0.659 MiB（6.8%），被回归门禁阻断。未修改基线。
11. 页面在真实浏览器里的显示没有看过（本仓库约定不开浏览器，除非你要求）。

**后续期（本次没做）**

12. 雷达数据走插件采集（站长 2026-11-22 决定不用云端抓取）：工作台「智能体」标签生成一次性配对码，插件工具箱配对后可手动提交当前页面推文，或开启自动提交（`workbenchCollector.js`，默认关闭，只提交点赞 ≥ 50 或展示 ≥ 5000 的公开推文，跳过受保护账号，未配对时暂停 30 分钟）。覆盖面取决于装插件并开启的用户数量，未在真实 X 页面验证过选择器。
13. 账号榜的「涨粉」维度做不了：没有粉丝数据来源。
14. AI 生图未做（未选模型）。海报只有文字加作者名的版式。
15. 工具箱未做：图片去水印、视频与 GIF 下载、回关检查、限流检测。
16. 冠军历史与榜单分享图已补充；X 日报、封号监测、名人堂未做，MCP 接入不纳入本次范围。
17. 付费秘籍与套餐未做（见第 5 条）。
18. 智能体对话上云与 Cloudflare Agents SDK 的 Durable Object 接入，依赖第 7 条。
19. 后台用户管理与成本看板未做。
20. 排期的「随机间隔」只在浏览器里给发布时间加随机延后，没有批量按间隔排队。

## 本机接手补充（2026-11-22）

- 复用 Issue #473；后台、成本、生图、工具箱与付费决策单列 Issue #475（`needs:decision`）。
- 冠军历史按当前采集指标重算最近七个完整统计日，界面明确说明后续采集可能改变排名；支持下载榜单 PNG。
- 话题来源由站长本次确认：采集用户选择标签，站长审核。提议先进入待审队列，通过后才进入公开话题与推文筛选。DDL 追加在尚未执行的 0134 中。
- 选择器补充中英文受保护 SVG 图标、带参数 analytics 链接、引用推文指标隔离测试；夹具为合成 DOM。curl 获取 X 页面超时，真实 DOM 尚未核验。
- 后台构建必须同时排除公开 `(x)` 路由组与 API。必要修复位于 `scripts/build-admin-pages.cjs`，该文件不在本次允许暂存清单中，仍保留未暂存，发布前需单独处理。
- 未执行 Cloudflare 迁移，未提交、推送或合并。上线由站长手动执行 0130、0131、0133、0134。
