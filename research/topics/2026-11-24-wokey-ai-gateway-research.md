---
title: Wokey 观察：可验证中转站的低价从哪来，边界在哪
category: topics
date: 2026-11-24
time: 19:10
tags: [Wokey, API中转, AI网关, TEE, 数据安全, 商业模式]
summary: 拆解 Wokey 的 TEE 可验证机制、订阅套利型低价结构、与 CChello 的路线差异，给出可用边界。
tldr: Wokey 用 AWS Nitro Enclave 与开源校验器让用户离线核对响应是否出自官方模型，这是中转赛道的新变量；Claude 全系官方价 15% 的低价来自提供方共享的消费级订阅额度，与上游条款冲突，供给可能整池切断；条款未披露运营主体，充值不退，证明只保完整性、不保机密性。
topic_type: product
subjects: [business_market]
content_type: analysis
assistance: workbuddy
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
auto_images: false
---

> 风险与合规提示：Claude 等境外大模型未在国内完成备案，围绕它们的 API 中转、订阅共享与转售处于灰色地带，平台规则与监管要求持续变化。资料用于理解产品机制与风险边界，不构成使用、投资、开户或法律建议。

Wokey 首页放着三行字：请求只发往官方 API，每条响应附带密码学证明，可以在自己电脑上离线核对。中转站的口头承诺听过太多，这三行字的价值在于它们可以被检验。检验完之后还有第二个问题：既然走官方，为什么 Claude 全系只要官方价 15%？

## 一、先给结论

1. **可验证性是真差异化。** AWS Nitro Enclave 在出口处终止上游 TLS、给响应签名，代码指纹（PCR0）可以由公开源码复现，校验器在浏览器里离线运行。模型真伪这个中转赛道最大的信息不对称，被换成了「信 AWS 根证书、信自己的复现构建」。

2. **低价来自订阅套利，与 API 批发无关。** 供给端是提供方挂出的消费级订阅闲置额度（Provider Node），出站 IP 用提供方自己的网络。一份 $100 的 Max 订阅按 API 牌价折算，价值在 $800 到 $2000 之间（估算，官方不公布绝对额度），按 15% 卖出仍有分成空间。官方 API 转售只能加价 5% 到 20%，做不到这个价位。

3. **证明有覆盖边界。** 只保完整性、不保机密性：明文仍瞬时经过中转，只是不落盘；图像生成与格式转换路由不带证明。用 TEE 证明理解成「数据安全」会错位。

4. **条款把风险写在明面上。** 运营主体与管辖法律均未披露，充值不可退、余额不可提现，违规可封号并清空未用余额，责任上限为前 12 个月已付费用与 100 美元取高者。正常请求只留元数据，失败载荷存档 14 天且不自动脱敏。

5. **使用边界按数据敏感度划。** 公开任务、可丢弃的测试代码适合小额使用；商业机密、客户数据、生产密钥不应该经过；预充值当消耗品管理，别当账户余额。

## 二、事实层

### 1、平台与基础设施

域名 wokey.ai 的 whois 记录显示 2026-04-10 注册于 Cloudflare Registrar，注册人信息隐去，注册国别显示 JP，到期时间 2028-04-10。主站在 Cloudflare 后面，API 域名 api.wokey.ai 解析到 AWS 新加坡节点（54.255.102.151），与 Nitro Enclave 的部署环境一致。

产品形态是聚合网关：一个 Key 同时兼容 OpenAI Chat Completions、Responses 与 Anthropic Messages 三种协议，覆盖 Claude、GPT、Gemini、Grok、DeepSeek、Kimi、GLM 等 56 个文本模型，另有图像与视频生成接口。文档给了 13 个以上客户端的现成配置，包括 Claude Code、Codex、Claude Desktop、Cherry Studio、WorkBuddy。界面中英双轨，充值支持多链 USDT（免手续费）、支付宝与信用卡。官网自称「拼多多版 OpenRouter」。

### 2、定价

价格以美元每百万 token 计，对官方参考价的折扣固定，调价时会提前在定价页公告。

| 模型 | 输入 | 输出 | 官方参考（输入/输出） | 折扣 |
|---|---|---|---|---|
| Claude Opus 5.5 | $0.60 | $3.00 | $4 / $20 | 85% |
| Claude Sonnet 5.5 | $0.30 | $1.50 | $2 / $10 | 85% |
| Claude Fable 5.2 | $1.912 | $9.56 | $8 / $40 | 76% |
| GPT-6 Astra | $0.55 | $2.75 | $10 / $50 | 95% |
| Gemini 4 Argon | $1.20 | $6.00 | $4 / $20 | 70% |
| DeepSeek-V4.1-Flash | 峰谷分时 | 同左 | 官方五折 | 50% |

图像 $0.01 一张，Grok 视频按秒计费，480P 起价 $0.0056 每秒。计费纯按量，无月费无套餐。另有拼团活动：三名新用户各充值 2 美元成团，全员 Opus 5.5 按官方价 7.5% 计费 48 小时，每多一人加 24 小时；团长拿被推荐人后续消费 20% 的平台费，无时限。条款写明 Opus 5.5 不收平台费。

### 3、证明机制怎么工作

开源仓库 `focuxdot/proof-of-observation` 给了完整实现：Rust 写的 enclave 加 TypeScript 校验器，MIT 与 Apache-2.0 双许可，另有一份用 RFC 2119 关键词写的协议规范。

每个请求进 enclave 后做四件事：在箱内终止到上游的 TLS 连接，用编译进镜像的 CA 包校验证书；边流式返回边计算哈希，不缓冲完整响应；用 Ed25519 签一条 `tee-exchange-v2` 语句，绑定路由信息与请求响应两侧的哈希；附上 NSM 认证报告，把签名公钥和 PCR0 链到 AWS Nitro 根证书。

<figure class="research-inline-diagram">
<svg viewBox="0 0 720 312" role="img" aria-label="请求经 Wokey 平台与 Nitro Enclave 抵达官方上游，响应带签名返回客户端离线校验的链路图">
<defs>
<marker id="wkArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
<path d="M2 1L8 5L2 9" fill="none" stroke="#5F5E5A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</marker>
</defs>
<rect x="24" y="44" width="158" height="56" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="103" y="66" text-anchor="middle" font-size="14" font-weight="500" fill="#0C447C">客户端</text>
<text x="103" y="86" text-anchor="middle" font-size="12" fill="#185FA5">Claude Code 等</text>
<rect x="202" y="44" width="158" height="56" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="281" y="66" text-anchor="middle" font-size="14" font-weight="500" fill="#0C447C">Wokey 平台</text>
<text x="281" y="86" text-anchor="middle" font-size="12" fill="#185FA5">路由 · 计费 · 托管</text>
<rect x="380" y="44" width="158" height="56" rx="8" fill="#E1F5EE" stroke="#0F6E56" stroke-width="0.5"/>
<text x="459" y="66" text-anchor="middle" font-size="14" font-weight="500" fill="#085041">Nitro Enclave</text>
<text x="459" y="86" text-anchor="middle" font-size="12" fill="#0F6E56">TLS 箱内终止并签名</text>
<rect x="558" y="44" width="158" height="56" rx="8" fill="#F1EFE8" stroke="#5F5E5A" stroke-width="0.5"/>
<text x="637" y="66" text-anchor="middle" font-size="14" font-weight="500" fill="#2C2C2A">官方上游</text>
<text x="637" y="86" text-anchor="middle" font-size="12" fill="#5F5E5A">Anthropic 等厂商</text>
<line x1="184" y1="72" x2="198" y2="72" stroke="#5F5E5A" stroke-width="1.5" marker-end="url(#wkArrow)"/>
<line x1="362" y1="72" x2="376" y2="72" stroke="#5F5E5A" stroke-width="1.5" marker-end="url(#wkArrow)"/>
<line x1="540" y1="72" x2="554" y2="72" stroke="#5F5E5A" stroke-width="1.5" marker-end="url(#wkArrow)"/>
<path d="M459 100 L459 128 L103 128 L103 104" fill="none" stroke="#0C447C" stroke-width="1.5" marker-end="url(#wkArrow)"/>
<text x="281" y="146" text-anchor="middle" font-size="12" fill="#0C447C">响应 + tee-proof 签名返回</text>
<rect x="24" y="176" width="330" height="116" rx="10" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="42" y="200" font-size="14" font-weight="500" fill="#042C53">本地离线校验（浏览器或 CLI）</text>
<text x="42" y="226" font-size="12" fill="#185FA5">认证链到 AWS Nitro 根证书</text>
<text x="42" y="248" font-size="12" fill="#185FA5">PCR0 对上公开源码复现值</text>
<text x="42" y="270" font-size="12" fill="#185FA5">收到的字节哈希对上签名语句</text>
<rect x="378" y="176" width="318" height="116" rx="10" fill="#FAEEDA" stroke="#BA7517" stroke-width="0.5"/>
<text x="396" y="200" font-size="14" font-weight="500" fill="#412402">证明覆盖不到的</text>
<text x="396" y="226" font-size="12" fill="#854F0B">不保机密性，明文仍过中转</text>
<text x="396" y="248" font-size="12" fill="#854F0B">图像与格式转换路由不带证明</text>
<text x="396" y="270" font-size="12" fill="#854F0B">nonce 新鲜度由校验器检查</text>
</svg>
<figcaption>图 1：请求与证明两条链路。业务请求经平台进入 Enclave 再到官方上游，响应在箱内签名，校验在用户本地完成。</figcaption>
</figure>

PCR0 是这套方案的关键。这个数字由任何人用公开源码双次构建复现，不依赖运营方自报：仓库 README 记录当前生产版本用 Docker 29.1.3 与 nitro-cli 1.4.5 在 aarch64 主机上从空缓存构建两次，得到同一个指纹，并注明 2026-11-05 实测线上 enclave 与该值一致。镜像里写死了只调官方域名，掺水、换小模型都会让响应哈希与签名对不上。

### 4、条款与数据留存

服务条款 2026-10-19 生效，共 15 条。几处与使用者直接相关：

- **主体与管辖**：未写公司实体、注册地、管辖法律与争议解决方式，联系方式只有一个 contact@wokey.ai。
- **资金**：充值到账即不可退，余额不可提现或兑换现金；重复扣款、错误扣款须在发现后 7 个日历日内申诉。余额明确不是存款或受保资金，链上支付一经广播可能不可逆。
- **数据**：正常成功的请求不持久化完整提示词与输出，只保留元数据、状态、用量与成本；失败、异常或涉及调查的请求会存档完整原始载荷，最长 14 天，不自动脱敏，授权管理员可访问。
- **处置权**：平台可随时限制、冻结、暂停或终止服务，封号时可清空未用余额；已产生的费用与调查义务在终止后继续有效。
- **责任**：按「现状」提供，累计责任上限为争议前 12 个月实付费用与 100 美元取高者。
- **供给侧**：第三方提交上游凭证即授权平台用于测试、路由、调用与结算，须自行保证不违反上游协议，凭证静态加密存储。

### 5、外部记录

V2EX 2026 年 10 月有一条带推广链接的推荐帖，回帖里有人问：如果镜像里预置自签的厂商证书，用 hosts 或中间人代理把请求引到自己的服务器，能不能绕过验证？这个疑问指向的正是可复现构建要解决的问题——CA 包编进镜像，镜像的度量值可复现，编进去的是哪份证书因此可审计。

第三方工具目录 toolin.ai 的收录页给了编辑评价：技术与可验证性是真差异化，但低价来自提供方共享的消费级订阅额度，与上游禁止共享凭据、禁止转售的条款直接冲突，供给可能被整池切断；加上预付不退、主体未披露、责任上限 100 美元，适合小额试水。

## 三、结构分析

### 1、证明链把信任锚挪到了哪

中转站的老问题是模型真伪无法从外部核对。平台展示的模型名由自己填写，后台调用的未必是同名满血模型。CISPA 对影子 API 的测试里，伪装成 Gemini-2.5-flash 的服务在 MedQA 上只有 37% 正确率，官方为 83.82%；arXiv 2603.01919 测了 24 个端点，45.83% 未通过指纹验证。

TEE 方案把判断依据从「相信运营方」换成三样可以独立核对的东西：AWS 的根证书、公开源码复现出的 PCR0、以及自己收到的字节哈希。运营方即使想换模型，也过不了用户本地的校验。这是同类站里第一次有人把「别信我，自己验」做成可执行流程。

代价在覆盖面。enclave 只处理原样转发的路由，格式转换、图像生成、视频生成不带证明；证明保完整性，不保机密性，明文仍要经过中转内存，只是不落盘。需要「运营方读不到内容」的场景，这套机制覆盖不了。

### 2、价格从哪来

官方有两条收费通道，价格差一个数量级：API 按 token 计费，Opus 5.5 是输入 4 美元、输出 20 美元每百万 token；订阅按包月买断额度，Pro 20 美元、Max 100 美元（5 倍 Pro 用量）、Ultra 200 美元（10 倍）。订阅的定价锚点是一个人一个月的重度用量，一份 Max 订阅按 API 牌价折算，价值在 800 到 2000 美元之间（估算区间，官方不公布绝对额度）。

<figure class="research-inline-diagram">
<svg viewBox="0 0 720 312" role="img" aria-label="消费级订阅经 Provider Node 转为平台供给并按官方牌价 15% 售出的套利结构图">
<defs>
<marker id="wkArrow2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
<path d="M2 1L8 5L2 9" fill="none" stroke="#5F5E5A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</marker>
</defs>
<rect x="24" y="44" width="158" height="56" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="103" y="66" text-anchor="middle" font-size="14" font-weight="500" fill="#0C447C">Max 订阅</text>
<text x="103" y="86" text-anchor="middle" font-size="12" fill="#185FA5">100 美元 · 5 倍 Pro</text>
<rect x="202" y="44" width="158" height="56" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="281" y="66" text-anchor="middle" font-size="14" font-weight="500" fill="#0C447C">Provider Node</text>
<text x="281" y="86" text-anchor="middle" font-size="12" fill="#185FA5">闲置额度转为供给</text>
<rect x="380" y="44" width="158" height="56" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="459" y="66" text-anchor="middle" font-size="14" font-weight="500" fill="#0C447C">Wokey 平台</text>
<text x="459" y="86" text-anchor="middle" font-size="12" fill="#185FA5">按牌价 15% 结算</text>
<rect x="558" y="44" width="158" height="56" rx="8" fill="#F1EFE8" stroke="#5F5E5A" stroke-width="0.5"/>
<text x="637" y="66" text-anchor="middle" font-size="14" font-weight="500" fill="#2C2C2A">消费者</text>
<text x="637" y="86" text-anchor="middle" font-size="12" fill="#5F5E5A">USDT · 支付宝</text>
<line x1="184" y1="72" x2="198" y2="72" stroke="#5F5E5A" stroke-width="1.5" marker-end="url(#wkArrow2)"/>
<line x1="362" y1="72" x2="376" y2="72" stroke="#5F5E5A" stroke-width="1.5" marker-end="url(#wkArrow2)"/>
<line x1="540" y1="72" x2="554" y2="72" stroke="#5F5E5A" stroke-width="1.5" marker-end="url(#wkArrow2)"/>
<rect x="24" y="152" width="330" height="140" rx="10" fill="#EAF3DE" stroke="#3B6D11" stroke-width="0.5"/>
<text x="42" y="176" font-size="14" font-weight="500" fill="#173404">套利账（估算）</text>
<text x="42" y="202" font-size="12" fill="#3B6D11">额度折算牌价 800–2000 美元每月</text>
<text x="42" y="224" font-size="12" fill="#3B6D11">按 15% 卖出：120–300 美元每月</text>
<text x="42" y="246" font-size="12" fill="#3B6D11">订阅成本 100 美元，提供方拿大头</text>
<text x="42" y="268" font-size="12" fill="#3B6D11">Opus 5.5 零平台费，作引流品</text>
<rect x="378" y="152" width="318" height="140" rx="10" fill="#FAEEDA" stroke="#BA7517" stroke-width="0.5"/>
<text x="396" y="176" font-size="14" font-weight="500" fill="#412402">这个模式的代价</text>
<text x="396" y="202" font-size="12" fill="#854F0B">订阅按单人用量定价</text>
<text x="396" y="224" font-size="12" fill="#854F0B">多租户转售摧毁上游单位经济</text>
<text x="396" y="246" font-size="12" fill="#854F0B">批量风控可整池切断供给</text>
<text x="396" y="268" font-size="12" fill="#854F0B">封号损失由提供方承担</text>
</svg>
<figcaption>图 2：订阅额度的套利结构。低价来自把单人包月额度拆成多人批发，与官方 API 的批发价没有关系。</figcaption>
</figure>

套利发生在这个前提被打破的地方。Provider Node 是开源软件（Apache-2.0），装在提供方自己的机器上，通过出站 WebSocket 跟平台保持连接，把本地订阅凭证的额度挂成供给；官方请求从提供方自己的 IP 出去，在厂商看来是正常家用。平台负责派单、计费、凭证托管与结算。一份订阅按牌价折算卖出去能收 120 到 300 美元每月（估算），提供方拿分成，平台在其他模型上抽 20% 平台费，Opus 5.5 免平台费做引流。

另外三条成本节省同样重要：封号成本外部化给提供方，平台不养号池与代理网络；USDT 直收，没有退款、拒付与坏账，余额沉淀归平台；获客靠拼团裂变与 20% 平台费返佣，省掉广告预算。四项叠加，15% 的牌价才有空间。

这也是上游要封的原因。订阅按一个人一个月定价，前提是这个量只给一个人用；多租户转售直接摧毁单位经济。Anthropic 2026-11-12 生效的支持地区政策明文禁止消费级订阅转发与代理转售，加入 30 天日志留存要求，封号后不再退款。平台的对策是工程化的（IP 稳定性、行为分布调优），赌的是检测速度慢于供给增长。

### 3、与 CChello 的路线差异

同为 Claude 中转，两家的产品逻辑与风险结构不一样。CChello 数据取自站内 2026-11-19 的调研。

| 维度 | CChello | Wokey |
|---|---|---|
| 定位 | Claude 专精中转，改写官方 Claude Desktop 配置一键接入 | 多模型聚合 API，13 个以上客户端即插即用 |
| 上线 | 2026-08-12 注册域名 | 2026-04-10 注册域名 |
| 货源 | 不公开，号池、授权或混合无法判断 | 公开为提供方共享消费级订阅额度 |
| 价格 | Opus 5.5 官方五折 | Claude 全系官方 15%，GPT 低至 5% |
| 模型真伪 | 无法从外部验证 | TEE 与开源校验器可离线验证 |
| 数据留存 | 全量留存请求与响应，不自动过期，采集设备指纹 | 正常请求只留元数据，失败载荷 14 天 |
| 运营主体 | 署名 BitVerse，无可核验实体 | 条款未写主体与管辖 |
| 追偿 | 预充值无法律追偿渠道 | 充值不退，责任上限 100 美元 |

两家解决的是不同问题。CChello 卖接入体验，替国内用户抹掉代理、外币卡、海外手机号与合规四道门槛；Wokey 卖可验证与更低的价格，用密码学消掉模型真伪的信息不对称。价格差异是结果：五折要覆盖不透明渠道的采购与毛利，15% 只有订阅额度这一种解释。

## 四、外部研判

**Wokey 属于「号池层」的透明化版本。** 按合规程度分层，它的供给结构落在订阅拆分这一层，与国内多数中转站同类；区别在于它把这件事写进博客、开源了 Provider Node、把出站白名单写死在源码里。透明在判断上是加分项：用户能提前知道风险在哪、什么时候会断供。风控上是减分项：上游看到的是一份公开承认共享订阅的架构说明。

**数据面的差距比价格差距大。** CChello 全量留存请求与响应且不自动过期，还采集设备指纹；Wokey 正常请求不落全文，失败载荷 14 天后过期。两家都要求预充值、都不披露主体。对敏感数据，差别在于「永久全量留存」与「元数据加 14 天异常存档」是两个量级的暴露面。

**可验证性改变的是决策方式，不能改变资金风险。** 有了 TEE，用户不必再猜后台是不是真模型，省掉第三方指纹检测这一环；但预充值的钱照样拿不回来，封号照样清零。证明解决技术信任，条款解决不了商业信任，两者要分开看。

**适用边界。** 公开信息、可丢弃的测试代码、公开数据集上的批量任务，适合小额使用，价格与可验证性都是实在的价值。商业机密、客户数据、生产密钥、有 DPA 或 SLA 要求的企业采购，不适合经过任何一家此类网关。可以把预充值当消耗品，按周小额续，不要一次充大额。

## 五、信息来源与持续验证

主要来源：wokey.ai 首页、定价页、服务条款（2026-10-19 生效）、拼团活动页、客户端文档与博客（2026-11-24 读取）；whois.nic.ai 域名注册记录与 DNS 解析（2026-11-24 实测）；GitHub `focuxdot/proof-of-observation` 与 `focuxdot/wokey-provider-node` 仓库说明；Anthropic 定价页（Pro 20、Max 100、Ultra 200 美元）与 2026-11-12 支持地区政策；V2EX 2026-10-07 讨论帖；toolin.ai 收录页编辑评价；站内《CChello 这类 Claude 中转站靠什么赚钱，水平如何，风险在哪》（2026-11-19）的事实口径；CISPA 影子 API 测试与 arXiv 2603.01919 的掺假实测。资料截至 2026-11-24。

持续验证：

- 运营主体是否公开。出现可核验的公司实体与管辖法律，会改变责任追偿的判断。
- 上游是否对共享订阅额度做批量风控。一次整池切断会让价格体系与余额同时失效。
- 平台费率结构未完整披露，哪些模型收 20% 平台费、哪些免，影响供给方的收益预期与稳定性。
