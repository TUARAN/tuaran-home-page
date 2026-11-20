---
title: 一次 Claude Code 中转按量实测：账单拆解与三层价格对照
category: topics
topic_type: tech
tech_type: ai_coding
subjects: [ai_dev]
content_type: practice
date: 2026-11-20
time: 15:20
tags: [Claude Code, API 中转, 按量付费, 订阅, Token 成本, 模型定价, 实测]
summary: 以一次 Claude Code 中转按量使用的首日账单为样本，拆解 477 次请求、54.65M token 与 15.79 美元的来历，再把它分别放到 Anthropic 官方 API、四家厂商按量报价和主流订阅套餐三把尺子上，给出按量与包月的取舍边界。
tldr: 实测综合单价约 0.29 美元/百万 token，落在官方 Sonnet 半价与 Opus 四折之间；同批 token 走 DeepSeek 约 3 美元、走官方 Opus 约 63 美元。月化约 68 美元时，Max 5x（100 美元）用封顶换确定性。单日样本只能支撑量级判断，底层模型归属和两周消耗曲线是关键缺项。
assistance: workbuddy
model: claude-opus-6
show_assistance: false
review_ready: false
ad_eligible: false
auto_images: false
pv: 0
---

> 适用范围：价格与套餐为 2026-11-20 查询的公开报价，会随厂商调整变动；换算均为相同 token 数下的理论账单，用来判断量级，不代表完成同一任务的真实成本。实测数据来自单一中转账号的首次使用日，样本只有一天。

> 风险提示：第三方 API 中转存在代码与密钥经过第三方服务器、模型可能被替换、余额无托管等风险。涉及公司代码、生产数据和私密信息的任务应使用官方直连。

## 一、先给结论

一次中转按量使用的首日账单：477 次请求全部成功，54.65M token，消耗 15.79 美元。把这笔钱拆开，再放到三把尺子上量，能站住的判断有五条：

1. **综合单价约 0.29 美元/百万 token**，单次请求约 3.3 美分、11.5 万 token。这个单价夹在官方各模型的缓存读价与输入价之间，说明 token 里绝大多数是命中缓存的历史上下文读取。
2. **对照 Anthropic 官方 API**，同批 token 按 92% 缓存命中估算：Haiku 约 1.8 美元、Sonnet 约 32 美元、Opus 约 63 美元、Fable 约 117 美元。实测值落在 Sonnet 半价与 Opus 四折之间。
3. **横向对照四家厂商**，便宜的一端是 GPT-6 Luna 约 1.8 美元、DeepSeek V4-Flash 约 3.2 美元、Grok 4.1 Fast 约 4.0 美元；贵的一端是 Opus 63 美元、GPT-6 Astra 约 184 美元。价差主要来自模型档位，不是计费口径的花招。
4. **对照订阅套餐**，按近 7 天摊出的月化约 68 美元，落在 Claude Pro（20 美元）与 Max 5x（100 美元）之间；若按首日强度天天跑，月化会到 470 美元以上，Max 20x（200 美元）反而省。
5. **这份样本只够做量级判断**。底层模型归属、缓存命中明细、两周消耗曲线都还没拿到，它们直接决定"划算"这个结论往哪边倒。

## 二、这笔账单里有什么

### 2.1 面板原始读数

| 项目 | 数值 | 说明 |
|---|---|---|
| 请求数 | [!good]477[/!good] | 成功 477，失败 0 |
| Token 总量 | [!good]54.65M[/!good] | 含输入、输出及缓存 |
| 当日 / 近 7 天 / 累计消耗 | [!good]15.785115 美元[/!good] | 三项完全相同 |
| 当前余额 | 5.21 美元 | 注册礼包 3 美元未领 |
| 预扣中 | 0.23951 美元 | 截取时仍有请求在跑 |

三项消耗完全相同，配合"新人礼包未领"的状态，指向一个判断：这是账号的首次使用日，477 次请求集中在一天内完成。这也意味着后面所有"月化"数字都建立在单日样本上，只能看趋势。

### 2.2 三个衍生指标

- **综合单价** = 15.79 ÷ 54.65 ≈ **0.289 美元/百万 token**。
- **单次成本** = 15.79 ÷ 477 ≈ **3.3 美分**。
- **单次 token** = 54.65M ÷ 477 ≈ **11.5 万**。

三个数里最反直觉的是第三个。一次请求带上 11.5 万 token，接近主流模型的整个上下文窗口。这类体量来自 Claude Code 的工作方式：每一轮都会把完整对话历史、工具定义和代码上下文重新发一遍。

### 2.3 缓存命中率为什么是关键变量

上面这批 token 里，重复发送的历史上下文占绝大部分。厂商对这类重复内容按"缓存读取"计价，单价通常只有普通输入的十分之一甚至更低。以 Opus 5.5 为例，普通输入 4 美元/百万 token，缓存读取 0.20 美元/百万 token，相差 20 倍。

这就解释了两件事。其一，token 数看着吓人，钱花得没那么夸张。其二，综合单价 0.289 美元这个位置本身携带信息：它低于官方所有模型的普通输入价，高于所有模型的缓存读价。中转把缓存折扣透传了下来，把缓存读取按输入全价收的经营方式在这里没有出现。

同一批 token，缓存命中率从 92% 提到 99%，官方 Opus 估算会从 63 美元掉到 18 美元附近。所有跨模型对照都带着这个假设，看的是量级。

## 三、三层价格对照

### 3.1 官方 API：同一批 token，模型档位决定一切

按 92% 缓存命中、剩余 token 按输出 50% / 普通输入 30% / 缓存写 20% 分配，54.65M token 在 Anthropic 自家模型上的估算：

| 模型 | 输入/输出 | 缓存读 | 同用量估算 | 对实测 |
|---|---|---|---|---|
| Haiku 5.5 | 0.10 / 0.50 | 0.01 | [!warn]约 1.8 美元[/!warn] | 便宜约 9 倍 |
| Sonnet 5.5 | 2 / 10 | 0.10 | [!warn]约 32 美元[/!warn] | 贵约 2 倍 |
| Opus 5.5 | 4 / 20 | 0.20 | [!warn]约 63 美元[/!warn] | 贵约 4 倍 |
| Fable 5.2 | 8 / 40 | 0.20 | [!warn]约 117 美元[/!warn] | 贵约 7 倍 |

（单价单位：美元/百万 token；Haiku 5.5 为提示不超过 100K 的档位。）

底层模型未知时，这四种价格都能"解释"同一张账单。实测值最贴近 Sonnet 半价与 Opus 四折的区间，这也是同类按量中转常见的折扣带。

### 3.2 四家厂商：同一批 token 的横向花费

<figure class="research-inline-diagram">
<svg viewBox="0 0 720 384" role="img" aria-label="同样 54.65M token 在 GPT、DeepSeek、Grok 与 Claude 各家模型上的估算花费横向条形图，从 1.8 美元到 63.4 美元，本次实测 15.79 美元以竖线标出">
<rect x="0" y="0" width="720" height="384" fill="#FFFFFF"/>
<text x="24" y="26" font-size="14" font-weight="500" fill="#2C2C2A">同样 54.65M token，各家官方报价的估算花费</text>
<text x="24" y="46" font-size="12" fill="#5F5E5A">92% 缓存命中假设 · 竖线为本次实测 15.79 美元</text>
<line x1="311" y1="56" x2="311" y2="372" stroke="#888780" stroke-width="0.5"/>
<text x="186" y="79" font-size="12" fill="#2C2C2A" text-anchor="end">GPT-6 Luna</text>
<rect x="196" y="62" width="13" height="24" rx="3" fill="#EAF3DE" stroke="#3B6D11" stroke-width="0.5"/>
<text x="215" y="79" font-size="12" fill="#27500A">$1.8</text>
<text x="186" y="110" font-size="12" fill="#2C2C2A" text-anchor="end">DeepSeek V4-Flash</text>
<rect x="196" y="93" width="23" height="24" rx="3" fill="#EAF3DE" stroke="#3B6D11" stroke-width="0.5"/>
<text x="225" y="110" font-size="12" fill="#27500A">$3.2</text>
<text x="186" y="141" font-size="12" fill="#2C2C2A" text-anchor="end">Grok 4.1 Fast</text>
<rect x="196" y="124" width="29" height="24" rx="3" fill="#EAF3DE" stroke="#3B6D11" stroke-width="0.5"/>
<text x="231" y="141" font-size="12" fill="#27500A">$4.0</text>
<text x="186" y="172" font-size="12" fill="#2C2C2A" text-anchor="end">DeepSeek V4-Pro</text>
<rect x="196" y="155" width="78" height="24" rx="3" fill="#EAF3DE" stroke="#3B6D11" stroke-width="0.5"/>
<text x="280" y="172" font-size="12" fill="#27500A">$10.8</text>
<text x="186" y="203" font-size="12" font-weight="500" fill="#2C2C2A" text-anchor="end">本次实测</text>
<rect x="196" y="186" width="115" height="24" rx="3" fill="#E6F1FB" stroke="#0C447C" stroke-width="0.5"/>
<text x="317" y="203" font-size="12" font-weight="500" fill="#0C447C">$15.79</text>
<text x="186" y="234" font-size="12" fill="#2C2C2A" text-anchor="end">GPT-6.1 Terra</text>
<rect x="196" y="217" width="115" height="24" rx="3" fill="#F1EFE8" stroke="#5F5E5A" stroke-width="0.5"/>
<text x="317" y="234" font-size="12" fill="#444441">$15.8</text>
<text x="186" y="265" font-size="12" fill="#2C2C2A" text-anchor="end">Grok 4.3</text>
<rect x="196" y="248" width="133" height="24" rx="3" fill="#FAEEDA" stroke="#854F0B" stroke-width="0.5"/>
<text x="335" y="265" font-size="12" fill="#854F0B">$18.3</text>
<text x="186" y="296" font-size="12" fill="#2C2C2A" text-anchor="end">Claude Sonnet / GPT Sol</text>
<rect x="196" y="279" width="230" height="24" rx="3" fill="#FAEEDA" stroke="#BA7517" stroke-width="0.5"/>
<text x="432" y="296" font-size="12" fill="#854F0B">$31.7</text>
<text x="186" y="327" font-size="12" fill="#2C2C2A" text-anchor="end">Grok 4.7</text>
<rect x="196" y="310" width="309" height="24" rx="3" fill="#FAEEDA" stroke="#BA7517" stroke-width="0.5"/>
<text x="511" y="327" font-size="12" fill="#854F0B">$42.6</text>
<text x="186" y="358" font-size="12" fill="#2C2C2A" text-anchor="end">Claude Opus 5.5</text>
<rect x="196" y="341" width="460" height="24" rx="3" fill="#FAEEDA" stroke="#BA7517" stroke-width="0.5"/>
<text x="662" y="358" font-size="12" fill="#854F0B">$63.4</text>
</svg>
<figcaption>图 1：同一批 token 下各家官方报价的估算花费。绿色为低于本次实测的档位，灰色为与实测基本相当，橙色为高于实测；旗舰 GPT-6 Astra 约 184 美元，超出图示范围。</figcaption>
</figure>

四家厂商的公开报价（美元/百万 token，输入/输出/缓存读，均截至 2026-11-20）：

| 厂商 | 入门档 | 中端主力 | 旗舰 |
|---|---|---|---|
| Anthropic | Haiku 5.5 0.10/0.50/0.01 | Sonnet 5.5 2/10/0.10 | Opus 5.5 4/20/0.20；Fable 5.2 8/40/0.20 |
| OpenAI | GPT-6 Luna 0.10/0.50/0.01 | Terra 1/5/0.05；Sol 2/10/0.10 | Astra 10/50/1 |
| xAI | Grok 4.1 Fast 0.20/0.50/0.05 | 4.3 1.25/2.50/0.20；4.7 2/6/0.50 | 老 Grok 4 已退役 |
| DeepSeek | V4-Flash 0.15/0.60 | — | V4-Pro 0.66/1.98 |

三点值得说清。

第一，便宜的一端来自两类模型：DeepSeek 靠整体低定价，Luna 和 Grok Fast 靠极致压缩的入门档。这三档的估算花费在 1.8 到 4 美元之间，比本次实测低 4 到 8 倍。

第二，中端档的价格高度趋同。Sonnet 5.5 与 GPT-6.1 Sol 的三项单价完全一致，都是 2/10/0.10。这批"主力编码模型"已经收敛到同一价格带，选谁更多取决于任务表现。

第三，本次实测的 15.79 美元这个位置相当尴尬：它和 GPT-6.1 Terra（15.8 美元）、Grok 4.3（18.3 美元）几乎重合。拿到模型分布之前，这笔钱买到的究竟是哪一档，无法从金额倒推。

### 3.3 订阅套餐：换一种付费方式

| 厂商 | 入门 | 主力 | 高端 |
|---|---|---|---|
| Claude | Pro 20 美元/月 | Max 5x 100 美元/月 | Max 20x 200 美元/月 |
| ChatGPT | Go 8 / Plus 20 美元/月 | Pro 100 美元/月 | Pro 200 / Pro 500 美元/月 |
| xAI | X Premium 8 / SuperGrok 30 美元/月 | — | SuperGrok Heavy 300 美元/月 |
| Google | AI Plus 8 / AI Pro 20 美元/月 | — | AI Ultra 100 / 200 美元/月 |

月化有两种算法，落到不同结论：

- **按近 7 天摊**：15.79 ÷ 7 × 30 ≈ **68 美元/月**。落在 Pro（20）与 Max 5x（100）之间。Max 5x 比按量贵约 32 美元，换来成本封顶、官方模型品质和高优先级。
- **按首日强度外推**：15.79 × 30 ≈ **474 美元/月**。这时 Max 20x（200 美元）反而便宜一半以上。

订阅的额度口径也要看清。Max 和 Pro 都按"每 5 小时会话 + 周限额"计量，官方不给固定消息数。编码代理消耗额度极快，100 美元档也可能撞墙，撞墙后要么等重置，要么另外购买按量额度。

## 四、按量还是订阅：一个决策框架

把前面三层对照收拢，选择取决于用量形状：

| 用量画像 | 更合适的模式 | 理由 |
|---|---|---|
| 天天高强度编码，月消耗稳定超过 100 美元 | [!core]订阅（Max 5x / Pro）[/!core] | 封顶省钱，账单可预测，官方模型品质稳定 |
| 月均在 50 到 100 美元之间波动 | 看稳定性：稳定用订阅，忽高忽低用按量 | 订阅在闲置月份会浪费，按量在爆发月份会失控 |
| 间歇使用，多数月份低于 50 美元 | [!core]按量[/!core] | 只为实际用量付费，订阅额度大部分闲置 |
| 以分类、改写、小修补为主 | [!core]便宜模型按量[/!core] | DeepSeek、Luna 一档足够，成本能降一个数量级 |

这套框架有一个前提：任务质量要能兜住。核心重构交给便宜模型，一次返工的时间成本可能超过省下的钱。

落到当前这份样本，合理的做法是先积累两周数据。看累计消耗曲线是平稳爬升还是忽高忽低，再决定要不要把按量换成包月。首日强度偏高，容易高估持续用量。

## 五、信息来源与持续验证

### 主要来源（截至 2026-11-20）

- 本次中转账号面板截图（作者自持，2026-11-20）：请求数、token、消耗与余额读数。
- Anthropic 官方模型文档与定价：[Opus 5.5 概览](https://platform.claude.com/docs/en/models/opus-5-5/overview)；各家现价经 [API 定价汇总](https://starty.ai/ai-api-cost) 交叉核对（2026-11-11）。
- OpenAI GPT-6 系列定价：[GPT-6 API Pricing](https://costmytokens.com/gpt-6-api-pricing)（2026-11-10）。
- xAI Grok 定价：[Grok 定价与退役清单](https://aiwiki.ai/index.php?title=Grok)（2026-09）。
- DeepSeek 定价：[官方费率汇总](https://deepseek.ai/)（2026-09-18 核验）；第三方汇总口径略有差异。
- 订阅套餐：Claude 见 [Claude Pricing Plans 2026](https://asapai.co.kr/en/claude-pricing-plans-2026)，ChatGPT 见 [ChatGPT Pricing 2026](https://superapp.dev/blog/chatgpt-pricing)，Grok 见前述 xAI 来源。
- 站内关联：[AI API 中转站灰色经济分析](/articles/research/topics/ai-api-relay-station-grey-economy)（中转的安全与合规风险）。

### 持续验证

- **底层模型归属**：面板的模型消费分布未纳入本次截图。这项直接决定"划算"结论；拿到后可用官方费率重算精确账，替换第三节的估算。
- **缓存命中明细**：92% 是估算假设，面板未给缓存读取的 token 明细。命中率每变动几个百分点，同用量估算会显著变化。
- **两周消耗曲线**：单日样本无法区分稳定用量与偶发爆发，直接决定按量与订阅的选择。
- **中转计费规则**：本次使用的中转未公开计费倍率，折扣幅度只能从综合单价间接推断。
