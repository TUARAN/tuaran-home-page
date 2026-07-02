---
title: Cloudflare 免费与付费服务边界深度调研
category: topics
topic_type: tech
date: 2026-07-02
tags: [Cloudflare, Workers, Pages, R2, D1, KV, Zero Trust, CDN, WAF, 成本模型, 边缘计算]
summary: Cloudflare 的免费层不是一个简单的试用版，而是一套覆盖 DNS、CDN、安全和轻量开发者平台的基础设施入口；真正的付费边界出现在 SLA、合规、安全深度、团队治理、日志留存和按量资源消耗上。
tldr: Cloudflare 免费层适合个人站、静态站、早期 MVP、轻量 API、低频 Worker、少量对象存储和 50 人以内 Zero Trust PoC。付费层买的不是“能不能用”，而是确定性：更高运行上限、SLA、合规、安全能力、长期日志、团队支持和按量扩容。生产系统要把套餐费和 Workers、R2、D1、KV、DO、AI、Images、Logs 等按量费用分开建模。
assistance: codex
model: gpt-5
pv: 0
---

> 调研口径：本文按 2026-07-02 公开信息整理。Cloudflare 的价格、免费额度和限制经常调整，涉及采购、合规或大规模上线时，应以官方价格页和开发者文档为准。
>
> 核心来源：Cloudflare [Plans](https://www.cloudflare.com/plans/)、Workers [Limits](https://developers.cloudflare.com/workers/platform/limits/)、Pages [Limits](https://developers.cloudflare.com/pages/platform/limits/)、Pages Functions [Pricing](https://developers.cloudflare.com/pages/functions/pricing/)、Rules [Page Rules migration](https://developers.cloudflare.com/rules/reference/page-rules-migration/)、Turnstile [product page](https://www.cloudflare.com/application-services/products/turnstile/)、Registrar [product page](https://www.cloudflare.com/products/registrar/)。

## 一、先给结论：Cloudflare 的免费层很强，但不是无限生产套餐

Cloudflare 的免费与付费边界不能只看一个价格表。它至少有三套收费逻辑。

第一套是**站点套餐**：Free、Pro、Business、Enterprise/Contract。它解决 DNS、CDN、DDoS、WAF、缓存、SSL、规则、支持、SLA 和合规能力的问题。

第二套是**开发者平台按量计费**：Workers、Pages Functions、R2、KV、D1、Durable Objects、Queues、Workers AI、Vectorize、Images、Browser Rendering、Workers Logs 等。它们通常都有免费额度，超额后按请求、CPU、存储、操作次数、行读写、分钟数或神经元计费。

第三套是**企业安全和网络合同**：Zero Trust、Magic Transit、Bot Management、API Shield、Logpush、Spectrum、Load Balancing、Argo/Smart Shield、企业支持、SASE、合规审计。它们的边界不只看流量，更看组织规模、支持等级、日志留存、合规和安全治理要求。

一句话概括：**免费层买到了“能接入 Cloudflare 全球网络”的入口；付费层买的是“可预测地把业务跑下去”的保障。**

## 二、Cloudflare 免费层到底免费在哪里

免费层的价值集中在四个入口能力。

| 能力 | 免费层能做什么 | 适合场景 | 主要边界 |
|---|---|---|---|
| DNS / CDN / SSL | 托管 DNS、基础 CDN、Universal SSL、基础缓存 | 个人站、博客、文档站、早期产品官网 | 没有商业 SLA，规则和高级优化能力有限 |
| 安全 | 基础 DDoS 防护、基础 WAF 托管规则、基础防火墙规则 | 普通网站防扫、防低级攻击 | 高级 Bot、API、合规、企业安全策略通常要付费 |
| 开发者平台 | Workers、Pages、R2、KV、D1 等有免费额度 | 静态站、轻量 API、低频自动化、MVP | CPU、请求数、存储、写入、构建、日志都有硬边界 |
| Zero Trust | 50 用户以内可开始使用 Access/Gateway 等能力 | 小团队、PoC、个人设备访问控制 | 日志留存、支持、用户数、DLP/CASB 等企业能力受限 |

这套免费层对个人开发者很友好。一个静态站可以用 Pages 托管，用 Cloudflare DNS 接域名，用 CDN 缓存，用 SSL 自动签证书，再用少量 Workers 做短链接、Webhook、轻量 API，用 R2 放图片，用 D1 存小型结构化数据。早期阶段月成本可能长期为 0。

但它不是“所有能力免费”。只要你需要明确 SLA、正式支持、合规、复杂安全策略、日志审计、团队权限、稳定高流量 API、长任务、AI 推理或大量图片/视频处理，就会进入付费区。

## 三、站点套餐边界：Free、Pro、Business、Enterprise

Cloudflare 当前公开套餐中，Free 为 $0；Pro 标价 $20/月（按年付）或 $25/月（按月付）；Business 标价 $200/月（按年付）或 $250/月（按月付）；Enterprise/Contract 是定制价格。这个价格主要覆盖网站、网络和安全套餐，不等同于所有开发者平台资源都包在里面。

| 套餐 | 典型对象 | 核心收益 | 关键边界 |
|---|---|---|---|
| Free | 个人、博客、开源项目、早期 MVP | 免费 DNS、CDN、SSL、基础 DDoS、基础 WAF | 无 SLA，支持弱，规则和高级安全能力有限 |
| Pro | 专业个人站、小商业站、内容站 | 更完整的性能与图片优化能力，成本低 | 仍不适合强 SLA、合规或关键业务 |
| Business | 正式商业业务、电商、SaaS 官网 | 100% uptime SLA、PCI DSS 4.0 相关能力、更高支持等级 | 成本明显上升，但仍可能需要额外购买日志、安全、负载均衡等能力 |
| Enterprise / Contract | 大型企业、金融、电商核心链路、全球业务 | 定制 SLA、网络优先级、企业支持、合同条款、合规和高级安全 | 价格按合同谈判，功能组合复杂 |

这里最重要的分界是 **SLA**。Free 和 Pro 能用于生产，但它们更像“尽力而为”的公共网络服务；Business/Enterprise 才开始进入商业承诺。对于公司官网、小工具、内容站，Free/Pro 可以跑很久；对于支付、交易、企业客户访问、B2B 后台、合规系统，不能只看“能不能访问”，而要看“出问题时谁负责、多久恢复、有没有赔付和审计材料”。

## 四、Workers：免费适合轻量入口，付费用来解除日请求和 CPU 天花板

Workers 是 Cloudflare 开发者平台的核心。免费层可以真正运行代码，但有明确硬限制。

| 项目 | Workers Free | Workers Paid |
|---|---:|---:|
| 请求量 | 100,000 请求/天 | 无日请求硬上限，按量计费 |
| CPU 时间 | 10ms/请求 | 可配置更高，平台文档列出可到分钟级上限 |
| Worker 数量 | 100 个 | 500 个 |
| 子请求 | 50/请求 | 10,000/请求 |
| Worker 包大小 | 3MB gzip 后 | 10MB gzip 后 |
| 内存 | 128MB | 128MB |

Workers Free 的定位很清楚：短逻辑、低流量、边缘小函数。比如短链接、Webhook 验签、A/B 分流、Header 改写、轻量 JSON API、缓存代理、登录回调都很适合。

付费边界通常发生在这些场景：

- 每天请求超过 100,000。
- 单次逻辑不再是 10ms 级别，例如要访问多个上游 API、做鉴权、查数据库、调模型、解析文档。
- 一个请求里需要大量子请求，例如聚合多个服务、爬取、代理、批处理。
- 包体变大，依赖增多，超过免费包大小。
- 你要把 Workers 当正式 API 层，而不是边缘脚本。

Workers 的成本要分成两部分看：请求次数和 CPU 时间。早期项目经常低估 CPU 时间，尤其是 SSR、AI 代理、Markdown 渲染、图像/HTML 处理、复杂鉴权这类任务。Cloudflare 的优势是冷启动和全球网络，劣势是运行时不是完整 Node.js 服务器，内存和 CPU 模型更适合短生命周期边缘计算。

## 五、Pages：静态托管很慷慨，函数和构建才是边界

Cloudflare Pages 对静态站非常友好。静态资源请求在免费和付费计划中都不按请求收费；真正要注意的是 Pages Functions、构建次数、并发构建、文件数量和单文件大小。

| 项目 | Free | Pro | Business |
|---|---:|---:|---:|
| 静态资源请求 | 不限量 | 不限量 | 不限量 |
| 月构建次数 | 500 | 5,000 | 20,000 |
| 并发构建 | 1 | 5 | 20 |
| 单站文件数 | 20,000 | 100,000 | 100,000 |
| 单文件大小 | 25MiB | 25MiB | 25MiB |
| Pages Functions | 计入 Workers | 计入 Workers | 计入 Workers |

如果站点是纯静态内容，Pages Free 可以长期稳定使用。比如博客、文档、作品集、落地页、公开资料库，基本不用担心请求费。

边界出现在三个地方：

第一，站点变成动态应用。只要用了 Pages Functions，本质上就进入 Workers 计费和限制体系。

第二，构建频繁。内容团队、自动化采集、频繁预览环境、多分支部署会快速吃掉构建次数和并发构建能力。

第三，静态文件规模膨胀。图片、PDF、音频、视频、大量生成页面都可能撞到文件数量或单文件大小。大文件应该放 R2，页面只引用资源地址。

## 六、R2：无出口费是王牌，但对象操作不是免费无限

R2 的核心卖点是 S3 兼容对象存储和无出口流量费。这对图片站、下载站、备份、前端静态资源、用户上传文件很有吸引力。

| 项目 | 免费额度 | 付费边界 |
|---|---:|---:|
| 存储 | 10GB-month | 标准存储按 GB-month 计费 |
| Class A 操作 | 100 万次/月 | 写入、列目录、创建 multipart 等高成本操作按百万次计费 |
| Class B 操作 | 1000 万次/月 | 读取、Head 等按百万次计费 |
| 出口流量 | 无 egress 费 | 仍受滥用、请求、带宽和账户策略约束 |

R2 免费层适合个人站图片、少量附件、备份、公开下载、小应用上传。真正的成本来自三类行为：

- 海量小文件读写，操作次数比容量更贵。
- 频繁 list、元数据查询、预签名上传下载。
- 把 R2 当数据库用，导致对象请求数膨胀。

R2 的正确用法是对象存储，不是低延迟数据库。结构化查询放 D1，强一致状态放 Durable Objects，缓存和配置放 KV。

## 七、KV、D1、Durable Objects：三种数据层不要混用

Cloudflare 的数据产品容易混淆。它们都能“存东西”，但边界完全不同。

| 产品 | 免费层适合 | 付费边界 | 不适合 |
|---|---|---|---|
| KV | 配置、缓存、Feature Flag、低频会话 | 读写次数和存储超额 | 强一致、高频写、关系查询 |
| D1 | 小型 SQLite、内容索引、用户表、轻量业务表 | 行读写、存储、数据库规模 | 高并发写、大型 OLTP、复杂事务 |
| Durable Objects | 单用户/单房间/单会话强一致状态、WebSocket、协同 | 请求、Duration、存储 | 全局大表扫描、分析型查询 |

KV 当前免费层包括 1GB 存储、每天 100,000 读、每天 1,000 写/删/list。这个模型说明它适合读多写少。把 KV 用作高频计数器、评论数据库、订单状态机会很快不舒服。

D1 当前免费层包括 5GB 总存储、每天 500 万行读、每天 100,000 行写。它适合边缘 SQLite 场景，比如个人站内容索引、评论、轻量用户系统、后台配置。边界在写入量、数据库体积、查询模式和迁移管理。

Durable Objects 免费层包括每天 100,000 请求和一定 Duration/存储额度。它不是通用数据库，而是强一致 actor。一个聊天室、一个用户会话、一个协同文档、一个 Agent 状态机，都是它的好场景。不要用它做跨用户大表分析。

判断规则可以很简单：

- **读多写少、最终一致**：KV。
- **结构化数据、SQL 查询**：D1。
- **单实体强一致、实时连接、状态机**：Durable Objects。
- **文件和大对象**：R2。

## 八、Queues、Cron、Workflows：免费能试，生产要看操作次数和失败重试

异步任务是很多 Cloudflare 项目低估的部分。Workers 的单请求模型适合短任务，不适合长时间后台作业。Cloudflare 的补齐路径是 Queues、Cron Triggers、Workflows。

Queues 当前免费层约每天 10,000 operations，付费后按百万 operations 计费。它适合解耦发送邮件、处理图片、写日志、同步数据、后台任务。

Cron Triggers 适合定时触发 Worker，例如日报、缓存预热、拉取 RSS、同步第三方 API。它本身不是问题，问题是 Cron 触发后执行的 Workers、D1、R2、KV、上游 API 都会计费或限流。

Workflows 适合多步骤、可重试、可恢复任务。它解决的是“任务不能丢、失败可继续”的问题。边界在步骤数、执行时长、重试次数和被调用资源成本。复杂任务不要试图在一个 Worker 请求里硬跑完。

## 九、AI、Vectorize、Images、Stream：免费层是开发额度，不是生产预算

Cloudflare 近两年把很多 AI 和媒体能力放进开发者平台，但这些服务的收费模型和 CDN 不一样。它们天然按量，免费层更像开发和低量生产缓冲。

| 服务 | 免费层含义 | 付费成本驱动 |
|---|---|---|
| Workers AI | 每天一定 neurons 免费 | 模型类型、输入输出规模、调用次数 |
| Vectorize | 每月一定 queried/stored dimensions 免费 | 向量维度、查询次数、存储向量量 |
| AI Gateway | 模型转发、缓存、观测入口 | 上游模型费通常才是大头 |
| Images | 每月一定 unique transformations 免费 | 转换次数、图片存储、交付次数 |
| Stream | 通常没有 Free 套餐 | 视频存储分钟数、播放交付分钟数 |
| Browser Rendering | 每天少量免费分钟和并发 | 浏览器运行小时、并发浏览器数 |

这里的关键是不要把 Cloudflare AI 当成“免费 LLM”。Workers AI 的免费层很适合 demo、低频工具、小模型推理、embedding、分类、摘要实验；真正的大规模 AI 成本主要由模型调用决定。AI Gateway 的价值是统一接入、缓存、限流、日志和路由，不是替你免掉 OpenAI、Anthropic 或其他模型提供商的账单。

Images 适合动态裁剪、格式转换、缩略图和响应式图片。边界是 unique transformations。电商、相册、内容平台如果图片规格很多，转换次数会快速变成可见成本。

Stream 更像正式视频平台能力。只要涉及视频转码、存储、播放交付，就应该单独估算。

## 十、日志与观测：免费调试够用，审计留存要付费

日志是免费层最容易忽略的边界之一。

Workers Logs 有免费事件额度，超出按事件计费。Log Explorer 有免费 ingest 额度，超出按 GB 计费。Zero Trust 免费层日志留存也明显短于付费/合同层。

这件事对生产系统很重要。没有足够日志，你就很难回答：

- 某个客户请求为什么失败？
- 某次攻击从哪里来？
- 某个 Worker 版本何时开始报错？
- 用户登录、访问、策略命中能不能审计？
- 合规要求要保留多久访问记录？

免费日志适合开发调试和轻量运营；正式业务要把日志成本纳入预算。尤其是高流量 Worker、API、Zero Trust、WAF 事件、Bot 防护事件，日志量可能比业务数据还大。

## 十一、Zero Trust：50 人以内很香，企业化边界非常明确

Zero Trust 免费层适合 50 用户以内的团队或 PoC。它可以替代一部分 VPN 场景：用 Access 保护后台、用 Gateway 做 DNS/HTTP 策略、用 Tunnel 暴露内网服务。

付费 Pay-as-you-go 当前公开价为 $7/用户/月，合同版用于更完整的 SASE、企业支持、日志留存和安全能力。

免费到付费的边界通常不是“访问不了”，而是：

- 用户数超过 50。
- 需要 30 天、6 个月甚至更久的日志留存。
- 需要 DLP、CASB、RBI、设备姿态、复杂策略。
- 需要电话支持、专业服务、合规材料。
- 安全团队需要 SIEM/云存储 Logpush。

小团队可以大胆从免费层开始，但企业采购不能只看“Access 能不能打开后台”。Zero Trust 的核心价值在治理、审计和策略统一，这些恰恰是付费层的重点。

## 十二、WAF、Bot、API Shield、Rules：基础安全免费，高级安全付费

Cloudflare 免费层已经有基础 DDoS 和基础 WAF 能力，对普通网站很有价值。但高级安全是 Cloudflare 商业化最核心的部分之一。

| 能力 | 免费层 | 付费/企业边界 |
|---|---|---|
| DDoS | 基础防护 | 企业级攻击响应、网络优先级、定制策略 |
| WAF | 基础托管规则和自定义规则能力 | 更多托管规则、规则数量、敏感数据、合规、企业支持 |
| Bot | 基础 bot 相关能力有限 | Bot Management、Super Bot Fight Mode 等高级能力 |
| API Shield | 基础 API 防护可用性受套餐影响 | mTLS、Schema Validation、发现、复杂策略 |
| Rules | 基础规则可配置 | 数量、动作、复杂度、产品组合受套餐影响 |

另外，Page Rules 正在被现代 Rules 体系替代。新项目不要围绕旧 Page Rules 设计架构，应优先使用 Cache Rules、Redirect Rules、Transform Rules、Origin Rules 等现代规则体系。

安全能力的预算逻辑很直接：如果只是防扫、防刷、挡普通攻击，免费或低套餐足够；如果业务损失来自恶意流量、账号撞库、API 滥用、爬虫、羊毛党、支付攻击，那就要评估 Bot Management、API Shield、WAF 高级规则和企业支持。

## 十三、Registrar、Turnstile、Email Routing：看似边缘，其实很实用

Cloudflare Registrar 不是免费送域名，而是按成本价注册和续费，Cloudflare 官方强调不加价，并提供 WHOIS 隐私保护、DNSSEC、DNS/CDN/SSL 集成。它适合已经把 DNS 放在 Cloudflare 的个人和公司。

Turnstile 是免费的 CAPTCHA 替代方案。它对登录、注册、评论、表单、下载页、后台入口很有用，尤其适合不想牺牲用户体验的网站。

Email Routing 适合把自定义域名邮箱转发到现有邮箱，比如 `hi@example.com` 转发到 Gmail。它不是完整企业邮箱，不负责发信信誉、邮箱客户端和团队邮箱管理。发信仍要用 Resend、Postmark、SES、Google Workspace、Microsoft 365 等服务。

## 十四、隐藏边界：免费层最容易踩的不是价格，而是限制

很多人只看“免费额度”，忽略了硬限制。几个典型例子：

| 限制 | 为什么重要 |
|---|---|
| 请求体大小 | Free/Pro、Business、Enterprise 层级不同；上传大文件不要直接穿 Worker |
| Worker 内存 128MB | 复杂依赖、图片处理、大对象解析、AI SDK 堆内存都可能撞墙 |
| Worker 包大小 | npm 依赖一多，免费层 3MB gzip 后包体会很紧 |
| CPU 时间 | 不是墙钟时间，计算密集任务很容易超限 |
| 子请求数 | 聚合 API、爬虫、代理、多数据源查询会撞到 |
| Pages 单文件 25MiB | 大 PDF、视频、音频、大图片包应该放 R2 |
| Pages 构建次数和并发 | 团队协作、频繁预览、多分支部署会吃掉额度 |
| 日志留存 | 事故复盘和合规需要长期日志，免费层往往不够 |

如果你的应用只是展示内容，限制不明显；如果你的应用开始处理上传、登录、支付、评论、AI、队列、爬虫、实时连接，这些限制就会变成架构约束。

## 十五、按项目类型给出选型建议

### 1. 个人博客、作品集、文档站

推荐：Free + Pages + DNS + CDN + SSL。

可选：少量 Workers 做短链接、RSS、Webhook、边缘重定向；R2 放图片和下载文件；Turnstile 保护评论和表单。

付费触发点：构建次数不够、需要更多图片优化、需要正式支持、动态函数请求变多。

### 2. 小型 SaaS 或 MVP

推荐：Workers Paid + D1 + R2 + KV + Turnstile。

原因：MVP 一旦有登录、API、数据库和后台任务，Workers Free 的 100,000 请求/天和 10ms CPU 很快会限制架构。Workers Paid 的成本不高，但能减少大量不必要的绕路。

付费触发点：用户增长、后台任务、数据库行读写、R2 操作次数、日志、邮件和模型 API。

### 3. 商业官网、电商落地页、获客站

推荐：Pro 起步，关键业务考虑 Business。

原因：这类站点不一定需要复杂计算，但需要稳定访问、缓存策略、图片优化、安全规则、SEO 和运营支持。只要涉及品牌投放、销售线索或支付链路，SLA 和支持就有实际价值。

付费触发点：SLA、PCI、安全规则、图片优化、WAF、Bot 防护、日志。

### 4. 企业后台、内网工具、替代 VPN

推荐：Zero Trust Free 做 PoC；超过 50 人或正式上线后评估 Pay-as-you-go/Contract。

原因：Access + Tunnel 可以很快保护内部服务，但企业真正需要的是日志、审计、设备策略、用户生命周期、DLP/CASB 和支持。

付费触发点：用户数、日志留存、合规、设备姿态、SIEM 集成、专业支持。

### 5. AI 应用、Agent、RAG、自动化平台

推荐：Workers Paid + Durable Objects + Queues/Workflows + D1/R2 + Vectorize + AI Gateway。

原因：AI 应用通常不是请求数贵，而是模型调用贵、状态管理复杂、日志和重试重要。免费层适合原型，但不要按免费层设计生产上限。

付费触发点：模型费、Workers CPU、DO Duration、Vectorize 查询维度、R2 操作、Browser Rendering、日志事件。

### 6. 图片、视频、媒体平台

推荐：R2 + Images；视频直接单独评估 Stream 或其他视频云。

原因：媒体成本来自存储、转换、交付和请求。R2 无出口费有优势，但 Images/Stream 都要按使用量算。

付费触发点：unique transformations、图片交付次数、视频存储分钟、播放分钟、对象操作次数。

## 十六、成本模型：不要只问“Cloudflare 多少钱一个月”

Cloudflare 成本应该拆成五层：

1. **站点套餐费**：Free / Pro / Business / Enterprise。
2. **计算费**：Workers 请求、CPU、Pages Functions、Durable Objects、Workflows。
3. **数据费**：R2 存储与操作、KV 读写、D1 行读写、Vectorize 维度。
4. **安全与网络费**：Zero Trust 用户数、Load Balancing、Argo/Smart Shield、Bot、API Shield、Logpush。
5. **外部服务费**：模型 API、邮件、支付、数据库上游、第三方 SaaS。

一个常见误判是：看到 Pages 免费、Workers 免费、R2 免费额度，就以为 Cloudflare 项目整体免费。实际上，生产成本往往来自组合后的乘法：

- 每个页面请求触发一次 Function。
- 每次 Function 查 D1、读 KV、写日志、访问 R2。
- 每个用户动作调用模型 API。
- 每个失败任务重试 3 次。
- 每条请求和安全事件进入日志。

所以预算要按链路算，而不是按产品单点算。

## 十七、迁移和架构建议

如果从 0 开始建个人站或轻量应用，可以先用 Free，但要提前留出升级路径：

- 静态页面和大文件分离：页面放 Pages，大文件放 R2。
- API 和页面渲染分离：能静态就静态，动态逻辑才进 Workers。
- 数据分层明确：KV 不做数据库，R2 不做查询，D1 不做大文件，DO 不做全局分析。
- 长任务异步化：不要在 Worker 请求里跑长任务，改用 Queues/Workflows。
- 日志有采样策略：开发期全量，生产期按重要性和成本分层。
- 安全规则可迁移：新项目优先使用现代 Rules，不围绕旧 Page Rules 设计。
- 预算按业务事件建模：一次注册、一次评论、一次上传、一次 AI 对话分别会触发哪些资源。

## 十八、最终判断

Cloudflare 免费层的真正意义，是把“全球网络基础设施”下放给个人和小团队。它让一个人也能拥有 DNS、CDN、TLS、DDoS、边缘函数、静态托管、对象存储、轻量数据库和基础 Zero Trust。

但它的商业逻辑也很清楚：当你的项目从“能跑”进入“必须稳定地跑”，你就会为确定性付费。

免费层适合探索、发布、验证和轻量生产；付费层适合增长、合规、团队协作、安全治理和关键业务。判断是否该付费，不要只看当前账单，而要问五个问题：

- 这个服务不可用 1 小时，损失是否超过套餐费？
- 出事故时，我是否需要官方支持和日志证据？
- 业务是否需要 SLA、合规或审计？
- 当前免费限制是否已经影响架构设计？
- 成本是否能随业务量线性解释和预测？

如果答案里有两个以上是“是”，就不应该继续把 Cloudflare 当免费工具箱，而应该把它当正式基础设施来管理。
