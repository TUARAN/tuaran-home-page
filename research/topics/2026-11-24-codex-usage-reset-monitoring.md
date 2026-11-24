---
title: Codex 额度重置监控：四种重置的机制、近期舆情与工具盘点
category: topics
date: 2026-11-24
time: 08:40
tags: [AI, Codex, OpenAI, 额度, 重置, 重置卡, 监控工具, CodexBar]
summary: 个人额度窗口一直按时刷新，停的是 OpenAI 额外发放的全员重置与重置卡。四种重置的规则、10 月以来的额度舆情，以及按用途选择的监控工具。
tldr: 个人额度窗口一直在按时刷新，刷新时间只在自己账号的用量页或 CLI 的 /status 里是准的；OpenAI 额外发放的重置没有排期，最近一次全员重置是 2026 年 10 月 28 日，到 11 月 24 日约 26 天没有新的一次，最近一张重置卡在 11 月 13 日预告「已激活、陆续到账」。重置卡到账后要手动兑换，兑换会改掉下一次刷新时间。个人额度看官方入口或本机菜单栏工具，官方何时发重置看跟踪 Tibo 原帖的公开事件日历，2aran.com/codex-reset 属于后一类。
topic_type: tech
subjects: [ai_dev]
content_type: analysis
assistance: workbuddy
model: glm-5.4
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
auto_images: false
---

> 适用范围：重置规则来自 OpenAI 帮助中心 2026-11-24 的页面，套餐与活动条款会变，兑换前以自己账号用量页的提示为准。第三方工具的星标、Provider 数量与价格多来自各自文章，未逐一安装实测。个人读数来自站长本机日志，只代表一个账号。

## 一、先给结论

- **个人的额度窗口一直在按时刷新。** Plus、Business 标准席位这类同时带五小时和每周两个窗口的套餐，五小时周期从上一周期结束后的第一条消息起算，到点自然刷新。刷新时间只在自己账号的用量页或 CLI 的 `/status` 里是准的。
- **OpenAI 额外发放的重置确实停了一阵。** 最近一次全员重置是 10 月 28 日，到 11 月 24 日约 26 天没有新的一次；最近一张重置卡在 11 月 13 日预告「已激活、陆续到账」。帮助中心写明，这类免费重置属于酌情发放的促销权益，没有保证的可用性和节奏。
- **重置卡到账不等于额度恢复。** 卡先存进账户，要自己去兑换；在用量设置里兑换时，至少一项覆盖额度剩余要低于 80%。兑换会把被恢复额度的下一次刷新时间改成新的起算点。
- **个人额度和官方重置是两类信息，各有各的查法。** 个人剩余额度看官方入口或本机菜单栏工具；官方何时发重置，看跟踪 Tibo（@thsottiaux）原帖的公开事件日历。2aran.com/codex-reset 做的是后一类，按北京时间整理原帖，不读取个人额度。

## 二、四种「重置」，规则各不相同

OpenAI 帮助中心把 Codex 的额度恢复拆成四种，触发方式、覆盖范围和对刷新时间的影响差别很大。

| 类型 | 怎么触发 | 覆盖哪些额度 | 对刷新时间的影响 |
|---|---|---|---|
| 周期刷新（5 小时 / 每周） | 到点自动 | 套餐内含额度 | 新周期从上一周期结束后的第一条消息起算 |
| 全员重置（automatic / global reset） | OpenAI 直接打到被选中的账号，不用领 | 只覆盖活动指定的账号和额度，「全员」不含每个账号 | 受影响额度回到 100%，刷新时间可能被改 |
| 重置卡（banked reset） | 先存进账户，自己挑时间兑换 | Plus、Business 标准席位：5 小时 + 每周；Pro 100/200/500：每周；Go：每月 | 被恢复的周期从兑换时刻重新计时 |
| 付费即时重置（paid instant reset） | 部分 Plus、Pro 个人账号可买，价格在结账页显示 | 5 小时和每周立即恢复 | 新的每周周期从购买后第一条请求起算，7 天后刷新 |

帮助中心《How resets work in Codex》里的几条细则：

- **兑换有门槛。** 所有覆盖额度都还剩 80% 以上时，页面会提示「Your usage does not need a reset right now」，卡继续留着，到期前都可用。
- **Codex 可以替你用。** 桌面端「Allow your assistant to use resets」开着时，主 5 小时或每周额度剩 10% 以下，Codex 会自动消耗重置卡。想自己挑时间就关掉。
- **不叠加。** 已经是 100% 的额度不会被重新开始；用过重置卡之后再遇全员重置，只回到 100%，用掉的卡不退，未用的卡也不会被消耗。
- **历史记录只记重置卡。** 桌面端「Usage & billing → History」显示近 30 天重置卡的收到与使用。全员重置和付费重置不进这个列表，看不到条目不等于没发过。
- **移动端 App 没有兑换入口。** 兑换在桌面端、网页或 CLI（`/usage` 后选 Redeem reset）。
- **付费重置立即生效，不能留。** 买的时候哪怕还有剩余额度也会马上重置，一般情况下不退款，只向部分 Plus、Pro 个人账号开放。

Pro 100/200/500 目前没有五小时限制，只有每周额度；「工作」模式与 Codex 共享同一份额度。官方给 Plus 的估算是一个五小时周期内约 15–160 条 GPT-6.1 Sol 本机消息，用 GPT-6 Astra 是 5–45 条，GPT-6 Luna 是 350–3,000 条，任务、推理设置和上下文长度都会让实际数字偏离。

12 月起 Plus、Pro、Business 套餐的用量将在 ChatGPT 和 Codex 之间共享，并按 token 计量，Instant 聊天不计入，依据是帮助中心《Understanding ChatGPT and Codex usage limits》；具体上线日期和各档 token 数量都还没有公布。

## 三、两层窗口怎么计时：一组本机读数

Codex CLI 每次收到模型响应，都会在会话日志的 `token_count` 事件里写入一段 `rate_limits`：`primary` 是五小时窗口（`window_minutes: 300`），`secondary` 是每周窗口（`10080`），各带 `used_percent` 和 Unix 秒的 `resets_at`。日志在 `~/.codex/sessions/年/月/日/rollout-*.jsonl`，字段里的 `timestamp` 是 UTC，换算北京时间要加 8 小时。当天有会话时，一条命令就能读到最新一行：

```bash
grep -o '"rate_limits":{[^}]*}[^}]*}[^}]*}[^}]*}' ~/.codex/sessions/$(date +%Y/%m/%d)/*.jsonl | tail -1
```

站长在 11 月 22 日至 23 日用 Codex CLI 0.136.0、模型 gpt-6.1-sol 记下的读数如下。

| 时间（北京） | 五小时窗口已用 | 五小时窗口到期 | 每周已用 | 每周到期 |
|---|---|---|---|---|
| 11-22 18:14 | 86% | 11-22 22:38 | 30% | 11-28 11:20 |
| 11-23 08:45 | 3% | 11-23 13:42 | 30% | 11-28 11:20 |
| 11-23 09:31 | 100% | 11-23 13:42 | 45% | 11-28 11:20 |
| 11-23 15:41 | 8% | 11-23 20:24 | 47% | 11-28 11:20 |

<figure class="research-inline-diagram">
<svg viewBox="0 0 720 300" role="img" aria-label="示意图：五小时窗口在 11 月 22 至 23 日换了三个起算点，其中 11 月 23 日上午的窗口在 09:31 用到 100%；每周窗口从 11 月 21 日 11:20 到 11 月 28 日 11:20 保持不变，已用比例从 30% 升到 47%">
<text x="24" y="28" font-size="15" font-weight="700" fill="#0C447C">同一段用量，两个窗口各自计时（示意，非等比；北京时间）</text>
<text x="24" y="91" font-size="13" font-weight="700" fill="#1F1F1F">5 小时窗口</text>
<text x="205" y="64" text-anchor="middle" font-size="12" fill="#791F1F">11-22 至 22:38 到期</text>
<rect x="130" y="72" width="150" height="28" rx="6" fill="#FCE8E6" stroke="#A32D2D" stroke-width="0.5"/>
<text x="205" y="120" text-anchor="middle" font-size="12" fill="#1F1F1F">18:14 已用 86%</text>
<text x="375" y="64" text-anchor="middle" font-size="12" fill="#0C447C">11-23 08:43–13:43</text>
<rect x="300" y="72" width="150" height="28" rx="6" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="375" y="120" text-anchor="middle" font-size="12" font-weight="700" fill="#791F1F">09:31 已用 100%</text>
<text x="545" y="64" text-anchor="middle" font-size="12" fill="#0C447C">11-23 15:24–20:24</text>
<rect x="470" y="72" width="150" height="28" rx="6" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="545" y="120" text-anchor="middle" font-size="12" fill="#1F1F1F">15:41 已用 8%</text>
<text x="24" y="191" font-size="13" font-weight="700" fill="#1F1F1F">每周窗口</text>
<text x="195" y="164" text-anchor="middle" font-size="12" fill="#1F1F1F">11-22 18:14 · 30%</text>
<text x="330" y="164" text-anchor="middle" font-size="12" fill="#1F1F1F">11-23 09:31 · 45%</text>
<text x="475" y="164" text-anchor="middle" font-size="12" fill="#1F1F1F">11-23 15:41 · 47%</text>
<rect x="130" y="172" width="490" height="28" rx="6" fill="#EAF5EC" stroke="#2E7D4F" stroke-width="0.5"/>
<circle cx="195" cy="186" r="5" fill="#185FA5"/>
<circle cx="330" cy="186" r="5" fill="#185FA5"/>
<circle cx="475" cy="186" r="5" fill="#185FA5"/>
<text x="130" y="224" font-size="12" fill="#1F1F1F">11-21 11:20 起算</text>
<text x="620" y="224" text-anchor="end" font-size="12" font-weight="700" fill="#1F1F1F">11-28 11:20 到期</text>
<text x="24" y="266" font-size="13" fill="#1F1F1F">五小时窗口两天换了三个起算点；每周窗口的到期时间四次读数一致，没有移动。</text>
</svg>
<figcaption>图 1：11 月 22 至 23 日一组本机读数里两个窗口的关系。数据来自站长本机 Codex CLI 会话日志，时间为北京时间；方框宽度不代表实际时长。</figcaption>
</figure>

- **五小时窗口的起算点跟着「上一周期结束后的第一条消息」走。** 11 月 23 日上午的窗口从 08:43 起算、13:43 到期；下午的窗口从 15:24 起算、20:24 到期。到期后不发消息，新窗口就不开始。
- **并行会话是额度消耗的主因。** 11 月 23 日 09:15 至 09:31 同一时段有 9 个会话文件在写入，五小时窗口在 46 分钟里从 3% 走到 100%，每周窗口同期从 30% 走到 45%。
- **每周窗口没有被五小时窗口的刷新带动。** 四次读数的每周到期时间都是 11 月 28 日 11:20:03，倒推起算点是 11 月 21 日 11:20:03。五小时窗口到期只恢复五小时额度，每周已用比例继续累加。
- **截至 11 月 24 日 08:10，本机没有新会话。** 最后一次读数是 11 月 23 日 15:41 的五小时 8%、每周 47%。五小时窗口已在 11 月 23 日 20:24 到期，按规则下一条消息会从新窗口起算；每周窗口要等到 11 月 28 日 11:20。

## 四、舆情：从「重置公司」到「怎么还没重置」

**10 月的「28 天挑战」把重置做成了日常运营。** 10 月 4 日，负责 Codex 的 Thibault Sottiaux（X 账号 @thsottiaux，圈内叫他 Tibo）立下目标：10 月 5 日到 11 月 1 日，每天发一项对多数用户有用的改进，或者来一次完整的额度重置。AIHOT 的公开快照收录了 10 月的 13 次全员重置和 1 次重置卡，7 月是另一个高峰，11 次全员重置加 3 次重置卡。社区里冒出专门追踪他每日动态的网站，有的开了投票，让用户猜当天是「改进日」还是「重置日」。Tibo 自己开玩笑说「从 The Reset Company 毕业，进入 The Token Company」。

**重置卡的争议集中在「收到」和「恢复」之间。** 10 月 31 日 Tibo 预告「接下来两天会是重置……存入账户的」，11 月 1 日发「Banked 1/2」，11 月 2 日发「Day 28/ Banked 2/2」，三条原帖都没写适用套餐、每个账号几张、什么时候过期。eraofminds 用 X API 统计，提到 banked reset 的帖子在 10 月 25 至 30 日每天 120–387 条，10 月 31 日跳到 770 条；回复里反复出现「到账了吗」「什么时候过期」「现在用还是留着」。更早有人兑换被拒后直接称它是骗局。Net.Coffee 在 11 月 12 日的报道里提到，有用户在论坛反映用掉重置卡后周额度没有恢复，帮助中心不同语言版本对「是否重置每周周期」的表述也有出入。11 月 12 日 Tibo 写「banked reset 已激活，应该很快会到每个人的账户」，有人几分钟内看到，有人几小时后还在问。

**全员重置也有人不喜欢。** 机器之心转述过付费用户的抱怨：全局重置会重启 7 天计时，对精打细算规划周额度的人来说反而打乱节奏。

**额度异常消耗的事故。** 10 月 17 至 18 日的周末有用户反映额度掉得异常快。Tibo 10 月 20 日说明，约 40,000 个账号被套用了与所选套餐不符的限额，问题已修正，会逐一联系受影响用户并补 credits。这次处理是修复加补偿，没有做全员重置。

**套餐额度调整引发反弹。** Pro 200 在「工作」和 Codex 中的额度原定从 10 月 30 日起由 Plus 的 20 倍降到 10 倍，争议很大；10 月 29 日 Tibo 宣布取消削减，Pro 100/200/500 和 Business Premium 的额度翻倍，Plus 不在其中。

**12 月合并额度池。** 帮助中心 11 月初上线的文档确认 12 月起 ChatGPT 与 Codex 共享按 token 计量的额度后，X 用户 xikhar 表示自己喜欢 ChatGPT 订阅的原因是聊天额度独立，合并后可能会多买 Claude。同一周，据 Codex Update 账号整理的帮助页面，一台设备能登录的付费账号数量设了上限，超出会看到「Device limit reached」；多账号轮换这条扩容路径被明确堵上。

**11 月的「怎么还没重置」。** 28 天挑战结束后，重置明显变疏。AIHOT 快照里 11 月只有 3 次重置卡（11 月 2 日两条、11 月 13 日一条），没有全员重置。whenreset.app 只统计全员重置、不含重置卡，给出的历史中位间隔是 2 天，最长 68 天；它在 11 月中旬的页面快照已经标出「已超过典型间隔」，并注明按中位间隔推算的下次时间不是官方预告。

## 五、监控工具盘点

个人额度是账号私有数据，只有官方入口和读取本机登录状态的工具能拿到；官方重置事件是公开信息，靠跟踪原帖。

**第一类，官方入口。** 数字直接来自 OpenAI，最权威。

| 入口 | 位置 | 能看到什么 |
|---|---|---|
| 桌面端 | Settings → Usage & billing | 剩余额度、下次刷新时间、可用重置卡与到期时间、近 30 天重置卡历史 |
| 网页 | Usage 设置（chatgpt.com/codex/settings/usage） | 当前限额与重置时间 |
| CLI | 会话内 `/status`、`/usage` | 当前窗口用量与重置时间；`/usage` 里可兑换重置卡 |

**第二类，本机菜单栏与终端工具。** 自动轮询，把剩余额度和重置倒计时放在眼前。

| 工具 | 形态 | 价格与许可 | 与 Codex 额度的关系 |
|---|---|---|---|
| CodexBar | macOS 菜单栏 + CLI | 免费开源（MIT），需 macOS 14+ | 显示五小时与每周窗口的已用比例和重置倒计时；`codexbar guard` 可在脚本里按剩余额度做门禁 |
| ClaudeBar | macOS 菜单栏 | Apache-2.0，需 macOS 15 | 同类，覆盖 Codex、Claude、Gemini、Copilot、Cursor 等 |
| OpenUsage | macOS 菜单栏 | 免费开源 | 插件式接入各家额度 |
| SessionWatcher | macOS 菜单栏 / Windows 任务栏 | 付费买断 | 覆盖约 22 款工具，Windows 用户的选项 |
| ccusage、CodeBurn | 终端 CLI | 免费开源 | 读本地日志算 token 与折算成本；CodeBurn 另有菜单栏和桌面端 |
| CodexHUD、TokenTracker | 终端覆盖层 / 桌面 App | 免费开源 | 前者看实时 token 消耗，后者重历史曲线与导出 |

CodexBar 是这一类里被引用最多的。GitHub API 在 11 月 24 日读到 23,302 个星标，最新版本 v0.85.0 发布于 11 月 21 日。各篇文章对它支持的 Provider 数量说法不一，一篇公众号评测按 8 月的数据写 67 家，LobsterOne 的盘点写 114 家；数字随版本变，装之前看当前 README。Claude Code Usage Monitor 这类以预测「何时撞线」为卖点的工具，仓库最后一次推送在 2026 年 7 月，依赖它之前先确认还跟得上现行套餐限额。

这类工具靠复用本机已有的 OAuth 令牌、浏览器 Cookie、API Key 或本地配置文件取数，常见要读 `~/.codex/auth.json`、访问钥匙串，导入 Safari Cookie 还需要完全磁盘访问权限。要收紧权限：只开启自己确实要看的 Provider；不导入 Cookie 就不给完全磁盘访问；能用 OAuth 或 CLI 方式取数的，关掉钥匙串访问。

**第三类，官方重置事件追踪。** 盯的是 Tibo 和 @OpenAIDevs 的原帖。

| 平台 | 做什么 | 口径 |
|---|---|---|
| AIHOT（aihot.news/codex-reset） | 收录 Tibo 原帖，区分全员重置与重置卡，提供公开 JSON 接口并带监控状态 | 自 2026-04-15 起 64 条事件，其中全员重置 48 条、重置卡 16 条；预告与已确认分开标 |
| whenreset.app/codex | 统计距上次重置的时长、典型间隔，给出下次预估 | 只统计全员重置，不含重置卡；预估非官方预告 |
| LimitDigest | 每小时盯 @thsottiaux，把事故和规则整理成解释页 | 单篇说明为主 |
| 公众号「Codex 额度情报局」 | 按月整理重置日历和自查清单 | 作者的跟踪记录，非官方到账统计 |
| 2aran.com/codex-reset | 北京时间日历加原帖 | 数据来自 AIHOT 公开接口 |

## 六、用 2aran.com/codex-reset 查官方重置

打开 <https://2aran.com/codex-reset>，看到的是一张按北京时间排的日历。三种事件分色：黄色「重置预告」是已发预告、尚未确认完成；「发重置卡」是重置卡发放；「全员重置」以绿色标已确认。每条事件挂着 Tibo 的原帖链接和北京时间，可以按月翻看历史。

配合自己的用量页，四步处理一条新事件：

1. **日历上出现「发重置卡」。** 打开自己的 Usage 设置，看有没有「1 reset available」或「Full reset」提示，核对它覆盖哪些额度、什么时候到期，再决定现在兑换还是留着。
2. **日历上出现「全员重置」且已确认。** 回用量页核对剩余额度是否回到 100%、下次刷新时间有没有被改。确认帖的时间不等于自己账号的到账时间。
3. **日历上什么都没有。** 说明近期没有官方额外重置，额度以自己用量页显示的刷新时间为准。
4. **想自己做提醒。** <https://2aran.com/api/codex-resets> 返回同一份 JSON，含事件状态、日程和原帖，可以接进自己的脚本。

页面只记录公开的额度重置与重置卡发放，不读取任何人的个人额度，也不预测下一次重置。首页卡片只推仍然有效的预告，已确认事件和历史留在日历页。接口在 10 分钟内复用缓存，上游接口失败时改用最长 24 小时的缓存快照，再退到内置快照。11 月 24 日 08:12 核对时，接口返回 `source: live`，64 条事件，上游核对时间为 08:10。

截至当天的日历上，最新一条是 11 月 13 日那张状态仍为「已预告」的重置卡，没有未完成的全员重置预告。

## 七、信息来源与持续验证

资料截至 2026-11-24 08:15（北京时间）。

**官方文档**

- OpenAI 帮助中心：[How resets work in Codex](https://help.openai.com/en/articles/20001498-how-resets-work-in-codex)
- OpenAI 帮助中心：[在工作和 Codex 中管理 GPT-6 Astra 用量](https://help.openai.com/zh-hans-cn/articles/20001516)
- OpenAI 帮助中心：[付费重置「工作」及 Codex 的每周速率限制](https://help.openai.com/zh-hans-cn/articles/20001507-paid-weekly-work-and-codex-rate-limit-resets)
- OpenAI 帮助中心：[Understanding ChatGPT and Codex usage limits](https://help.openai.com/en/articles/20001625-understanding-chatgpt-and-codex-usage-limits)

**事件数据**

- [AIHOT Codex 重置公开接口](https://aihot.news/api/v1/codex-resets)，2026-11-24 08:10 快照，64 条事件
- [2aran.com Codex 重置监控接口](https://2aran.com/api/codex-resets)，同日 08:12 读取
- [whenreset.app Codex 重置记录](https://whenreset.app/codex)

**舆情与报道**

- 机器之心（新浪财经转载，2026-11-01）：[Tibo 28 连更后，OpenAI 合并额度池，计费聊天开始了](https://finance.sina.com.cn/roll/2026-11-01/doc-inixeyiz3198259.shtml)
- LimitDigest：[Codex usage draining fast? 40,000 accounts had the wrong plan limits](https://limitdigest.com/guides/codex-usage-draining-fast-wrong-plan-limits)，收录 Tibo 2026-10-20 原帖
- eraofminds（2026-11-01）：[Codex banked reset: when should you use it](https://eraofminds.com/blog/codex-banked-reset)
- Net.Coffee（2026-11-12）：[「周四很有 Codex 味」：Tibo 预告储备重置](https://ip.net.coffee/gpt/news/20261112a.html)
- Sysnote（2026-11-13）：[Codex banked reset lands on Thursday, November 12](https://sysnote.net/news/codex-banked-reset-lands-on-thursday-november-12-tibo-says-it-is-activated-and-r)

**工具**

- [steipete/CodexBar](https://github.com/steipete/CodexBar)，星标与版本经 GitHub API 核对
- LobsterOne：[Best AI Coding Usage Trackers in 2026](https://lobsterone.ai/blog/best-ai-coding-usage-trackers)
- On My Menubar：[CodexBar](https://onmymenubar.app/codexbar/)
- AI Usage Tracker：[Best Mac Trackers for Claude Code and Codex Usage](https://aiusagetracker.dev/best/ai-usage-tracker-for-multiple-subscriptions)（厂商自己的对比文）

**本机读数**：站长本机 Codex CLI 0.136.0 会话日志，2026-11-22 至 11-23。

仍需跟进、可能改变结论的三项：

- 12 月 ChatGPT 与 Codex 合并额度池的确切上线日期，以及各档套餐的 token 上限，官方均未公布。上线后五小时与每周窗口的规则是否照旧，要看新的帮助页。
- 11 月 13 日那张重置卡在 AIHOT 快照里仍是「已预告」。到账范围和有效期未见官方帖，页面状态可能更新。
- 第二类工具的 Provider 数量、星标和价格来自 2026 年 8 月至 11 月的第三方文章，未逐一安装实测，引用具体数字前回查各项目主页。
