---
title: 腾讯、阿里的智能体基座平台：接入机制与运营商的差异化空间
category: topics
date: 2026-11-27
time: 10:17
tags: [AI, 大模型, Agent, 云计算, 电信运营商]
summary: 拆解腾讯 TEG/CSIG 与阿里 ATH 两个基座平台的组织归属、接入路径和计量结算机制，并推导运营商自建同类平台应该押注的能力。
tldr: 腾讯用「TEG 造基座 + CSIG 出平台 + 业务线自建 Harness」的组织承接智能体浪潮，阿里用 ATH 事业群把 Token 全链路收进一个组织；两家都靠沙箱、网关和积分体系收口业务方接入，运营商要进场，机会在号码身份和通信通道这两件别人做不到的事上。
topic_type: industry
content_type: analysis
assistance: workbuddy
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
auto_images: false
---

> 适用范围：基于截至 2026-11-27 的公开资料、官方文档与财报电话会报道整理；组织架构以官方公告和内部信转载为准，内部结算与算力调度机制部分来自媒体报道，口径在文末逐项标注。

## 一、先给结论

腾讯和阿里的业务方接入智能能力，走的都是「基座统一供给、平台层收口、业务线自建应用」的结构，但两家把这张网络织在了不同的组织位置上。已经能站住的判断有五个：

1. **腾讯的基座在 TEG**。AI Infra 部、大语言模型部、多模态模型部、AI Data 部、数据计算平台部都归技术工程事业群，首席 AI 科学家姚顺雨双线汇报（总裁办 + TEG），说明基座是公司级工程。平台层和商业化出口在 CSIG/腾讯云：TokenHub、ADP、Agent Runtime。
2. **阿里的基座是独立事业群**。Alibaba Token Hub（ATH）2026 年 3 月成立，吴泳铭直管，通义实验室（造 Token）、百炼 MaaS（送 Token）、千问/千问办公（用 Token）在一个组织里闭环，集团技术委员会负责把算力（阿里云）和业务接入（集团 CTO 线）拉齐。
3. **接入机制上，腾讯靠 Co-Design 和积分池，阿里靠统一出口和 Credits**。腾讯旗舰产品以首发名单方式接入混元，内部业务走 TokenHub API 加部门积分池；阿里集团内业务统一经百炼接入、按 Token 内部结算，财报里有独立的内部收入科目。
4. **计量结算的路线不同**：阿里把调度做成了价格机制（Credits 倍率、峰谷折扣、配额熔断），腾讯把调度做成了工程与优先级（模型降本、KV 压缩、集团统一分配卡）。
5. **运营商自建同类平台的可行路径**：不在通用沙箱和 Harness 上和两家拼，把「号码即身份、通道即工具、计费并入话费」做成平台的第一等公民。

## 二、事实层

### 组织架构（截至 2026 年 11 月）

腾讯在 2025 年 12 月完成大模型体系重组：新设 AI Infra 部、AI Data 部、数据计算平台部，姚顺雨出任 CEO/总裁办首席 AI 科学家，兼任 AI Infra 部与大语言模型部负责人；2026 年 3 月 20 日撤销成立近十年的 AI Lab，约 300 人并入混元团队。多模态模型部、AI Data 部由蒋杰分管。应用侧在 2025 年初已有一次集中：元宝、QQ 浏览器、ima、搜狗输入法从 TEG 转入 CSIG，TEG 专注基础研究，CSIG 侧同时是腾讯云 TokenHub、ADP、Agent Runtime 的产品归属。

阿里在 2026 年半年内动了三次：3 月 16 日成立 ATH 事业群（内部信原文经澎湃、科创板日报等多家转载），下设通义实验室、MaaS 业务线、千问事业部、悟空事业部、AI 创新事业部；4 月 8 日设集团技术委员会，吴泳铭任组长，周靖人任首席 AI 架构师，李飞飞（阿里云 CTO）负责云与 AI 基建，吴泽明（集团 CTO）负责业务技术平台与 AI 推理平台；6 月 8 日通义大模型事业部与未来生活实验室合并为 Token Foundry 事业部，仍由吴泳铭直接负责。8 月，悟空与 QoderWork、MuleRun 整合为千问办公，与钉钉同属一个事业部，官方口径上线 30 天用户破 3000 万。

### 平台层产品

两家的平台层都是「模型网关 + 智能体运行 + 治理」三件套：

- 腾讯云 2026 年 3 月把 MaaS 平台升级为 TokenHub（混元、DeepSeek、GLM、Kimi、MiniMax 统一 API、网关计费、智能路由），ADP 升级为企业级 AgentOps 平台，Agent Runtime 提供沙箱、Agent Engine 弹性部署和 Agent 注册中心（BETA，上海地域）；沙箱引擎已开源为 CubeSandbox（MicroVM 架构，官方口径冷启动低于 60 毫秒、单沙箱内存开销低于 5MB，兼容 E2B SDK）。
- 阿里云 AgentCore 由 AgentTeams 演进而来，覆盖托管 Harness Agent（QwenPaw，纯配置创建）、高代码 Agent（容器镜像部署）、本地纳管 Agent 三种构建方式，配代码/浏览器/通用沙箱、Team 多人协作、统一身份鉴权、五级纳管与 Agent Judge 评估；函数计算侧另有开源的 AgentRun Sandbox SDK。百炼侧的 Token Plan 用 Credits 统一折算扣减，模型按倍率换算，夜间 22:00-08:00 千问系 4 折、DeepSeek 系 5 折。

### 个人业务的接入实证

把上一轮讨论的「个人短信智能体」放进两家的接入流程，能看清平台边界：AgentCore 托管 Harness 可以零代码起步，但短信读取要自己解决（运营商授权能力或手机端转发），短信发送要过短信网关的签名审核；腾讯 Agent Runtime 同样只提供沙箱与部署，通道侧都要业务方自建。两家的凭证托管、审计和按用量计费是现成的，通信通道全部缺位。

## 三、结构分析

### 接入路径的分层对照

两家的接入都落在同一张四层栈上，差别在每层的组织归属：

<figure class="research-inline-diagram">
<svg viewBox="0 0 720 356" role="img" aria-label="腾讯与阿里智能体基座平台的四层对照">
<text x="285" y="20" text-anchor="middle" font-size="13" font-weight="500" fill="#0C447C">腾讯：TEG 造基座，CSIG 出平台</text>
<text x="568" y="20" text-anchor="middle" font-size="13" font-weight="500" fill="#04342C">阿里：ATH 事业群，技术委员会拉齐</text>
<rect x="24" y="36" width="110" height="64" rx="8" fill="#F1EFE8" stroke="#888780" stroke-width="0.5"/>
<text x="79" y="62" text-anchor="middle" font-size="13" fill="#2C2C2A">产品接入层</text>
<text x="79" y="82" text-anchor="middle" font-size="12" fill="#5F5E5A">业务线自建</text>
<rect x="150" y="36" width="270" height="64" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="285" y="62" text-anchor="middle" font-size="13" fill="#0C447C">元宝、微信小微、WorkBuddy、CodeBuddy</text>
<text x="285" y="82" text-anchor="middle" font-size="12" fill="#185FA5">Co-Design 首发 + Skill 化互通 + 微信 A2A</text>
<rect x="440" y="36" width="256" height="64" rx="8" fill="#E1F5EE" stroke="#0F6E56" stroke-width="0.5"/>
<text x="568" y="62" text-anchor="middle" font-size="13" fill="#04342C">千问、千问办公、淘宝支付宝内嵌</text>
<text x="568" y="82" text-anchor="middle" font-size="12" fill="#0F6E56">Skill 生态 + 钉钉 2600 万组织分发</text>
<rect x="24" y="116" width="110" height="64" rx="8" fill="#F1EFE8" stroke="#888780" stroke-width="0.5"/>
<text x="79" y="142" text-anchor="middle" font-size="13" fill="#2C2C2A">Agent 治理层</text>
<text x="79" y="162" text-anchor="middle" font-size="12" fill="#5F5E5A">构建·运行·管</text>
<rect x="150" y="116" width="270" height="64" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="285" y="142" text-anchor="middle" font-size="13" fill="#0C447C">ADP 4.0 + Agent Runtime + SkillHub</text>
<text x="285" y="162" text-anchor="middle" font-size="12" fill="#185FA5">沙箱（CubeSandbox 开源）· 注册中心 BETA</text>
<rect x="440" y="116" width="256" height="64" rx="8" fill="#E1F5EE" stroke="#0F6E56" stroke-width="0.5"/>
<text x="568" y="142" text-anchor="middle" font-size="13" fill="#04342C">AgentCore + Team 协作 + 企业上下文</text>
<text x="568" y="162" text-anchor="middle" font-size="12" fill="#0F6E56">托管 Harness · 五级纳管 · Agent Judge</text>
<rect x="24" y="196" width="110" height="64" rx="8" fill="#F1EFE8" stroke="#888780" stroke-width="0.5"/>
<text x="79" y="222" text-anchor="middle" font-size="13" fill="#2C2C2A">模型 / MaaS 层</text>
<text x="79" y="242" text-anchor="middle" font-size="12" fill="#5F5E5A">统一出口</text>
<rect x="150" y="196" width="270" height="64" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="285" y="222" text-anchor="middle" font-size="13" fill="#0C447C">TokenHub（混元 + 第三方模型）</text>
<text x="285" y="242" text-anchor="middle" font-size="12" fill="#185FA5">Token Plan 积分池 · 部门配额 · Key 级限速</text>
<rect x="440" y="196" width="256" height="64" rx="8" fill="#E1F5EE" stroke="#0F6E56" stroke-width="0.5"/>
<text x="568" y="222" text-anchor="middle" font-size="13" fill="#04342C">百炼 / DashScope（Qwen + 第三方模型）</text>
<text x="568" y="242" text-anchor="middle" font-size="12" fill="#0F6E56">Credits 倍率折算 · 峰谷折扣 · 额度熔断</text>
<rect x="24" y="276" width="110" height="64" rx="8" fill="#F1EFE8" stroke="#888780" stroke-width="0.5"/>
<text x="79" y="302" text-anchor="middle" font-size="13" fill="#2C2C2A">算力 / 训练层</text>
<text x="79" y="322" text-anchor="middle" font-size="12" fill="#5F5E5A">集团统供</text>
<rect x="150" y="276" width="270" height="64" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="285" y="302" text-anchor="middle" font-size="13" fill="#0C447C">TEG AI Infra · HCC 集群 · 沧海/燧原芯片</text>
<text x="285" y="322" text-anchor="middle" font-size="12" fill="#185FA5">集团行政调度，内部业务优先</text>
<rect x="440" y="276" width="256" height="64" rx="8" fill="#E1F5EE" stroke="#0F6E56" stroke-width="0.5"/>
<text x="568" y="302" text-anchor="middle" font-size="13" fill="#04342C">阿里云 PAI · 灵骏 · 平头哥芯片</text>
<text x="568" y="322" text-anchor="middle" font-size="12" fill="#0F6E56">三年 3800 亿投入，李飞飞线统筹</text>
</svg>
<figcaption>图 1：腾讯与阿里智能体基座平台的四层对照。治理层与模型层的组织归属不同：腾讯的治理平台在 CSIG 商业化体系内，阿里的模型与 MaaS 同属 ATH 事业群。</figcaption>
</figure>

### 卡住判断的两层

**计量结算层，两家选了不同的路。** 阿里把「业务方接平台」做成了内部市场：财报口径的内部收入增速（23%）与外部收入增速（64%）分列披露，媒体调查称内部结算按 Token 定价、沿 Token 链分账，通义自负盈亏；百炼 Token Plan 对外的 Credits 机制（倍率折算、预扣终扣、用量报表）就是对内机制的公开版本。腾讯是成本中心逻辑：算力由集团统一调度，2026 年三季度电话会明确「内部业务优先、剩余容量外溢商业化」（GPU 租赁环比增 30% 以上），业务侧的成本感知通过 Token Plan 部门积分池完成，没有内部收入科目。Hy3 发布后 WorkBuddy 排队率一度超 50% 的市场报道、Hy4 flash 把 KV Cache 压到前代的 1/6 至 1/24 官方口径，从两个方向印证了腾讯的解法：高峰靠工程降本缓解排队，靠优先级分配资源。

**治理层的锚点不同。** AgentCore 的治理围绕云端账号与 Workspace 组织，五级纳管让存量 Agent 从纯观测渐进到全栈接管；Agent Runtime 的治理围绕「资产目录」组织，注册中心只管登记、版本、审批与发现，明确不承载业务流量。两家共同的做法值得注意：Agent 进程都不持有密钥，凭证由平台注入；全链路 Trace 都是标配。

### 运营商的差异化空间

中国移动的九天·聚智与中国电信的星海平台已经验证了运营商的路径：不做通用大脑，做通信域的运行底座。把腾讯阿里的接入机制平移过来，运营商平台的设计重心应该在四处：

1. **号码即身份**。Agent 绑定到 MSISDN 与实名账户，授权链路复用运营商现有认证（App 扫码、人脸），「机主授权某 Agent 读短信」有现成且可审计的通道；云账号体系只留给开发者。
2. **通道即工具**。短信收发、语音外呼、5G 消息做成平台级 Skill。第三方平台做个人短信智能体时最难的两件事（端侧转发、签名审核）在运营商域内天然消解；Agent 外呼带可信标识，防诈从事后提醒变成原生能力。
3. **计费并入 BOSS**。Token 用量、通道调用统一折算进话费账户，复用全国性计费清结算系统，省掉阿里建 ATH 那样的组织成本。
4. **通用层不自研**。沙箱（CubeSandbox/Firecracker 系开源方案）、弹性部署、注册中心照行业标准件搭，资源集中在通信 Skill 与风控引擎（诈騒号码库本来就是运营商资产）。

配套的组织约束同样明确：通信 Skill 按风险分档授权（读摘要、读原文、代发、代接听），每次调用携带授权令牌与收发关系校验；能力层全国一套，省分公司只做边缘算力与本地运营；内部业务（营业厅、政企交付）当第一个业务方，再对外开放。

## 四、外部研判

三点观察，点到为止：

- **平台层的竞争已经从模型转向 Harness。** 汤道生公开定调「模型差距在缩小，比的是工程化手段」，杰富瑞对八款 Agent 的实测也把「隐含 Harness 分」作为独立评分维度。运营商如果按传统集成思路只卖通道 API，会错过真正涨价的那一层。
- **个人智能体是检验平台完整度的试金石。** 个人短信智能体在阿里腾讯体系里卡在通道侧，在运营商体系里卡在 Harness 工程能力——两边互补的空档，就是合作或自建的理由。
- **组织的信号比产品的信号更可信。** 阿里把 AI 做成第三个事业群、腾讯让首席 AI 科学家双线汇报，都是资源排位的一手证据；产品发布会的口径变化快，组织调整的成本高，后者更能说明战略权重。

## 五、信息来源与持续验证

主要来源（资料截至 2026-11-27）：腾讯 TEG 重组与 AI Lab 撤销（36 氪智能涌现、第一财经，2025-12 / 2026-03）；阿里 ATH 内部信与集团技术委员会（澎湃、科创板日报、都市快报转载，2026-03 / 2026-04）；Token Plan 个人版官方文档（阿里云帮助中心，2026-11-25 更新版）；Agent Runtime 注册中心文档（腾讯云，2026-09-18 更新）与 CubeSandbox 开源仓库；阿里云 AgentCore 产品页与帮助中心；腾讯云 2026 年 Q3 财报电话会及媒体交流报道；腾讯云 Agent 产品全景图与 2026 年 AI Agent 企业解决方案白皮书（公开流转版）。

持续验证（会改变结论的缺项）：

- 阿里集团内部结算的定价表与分账比例未公开，内部收入 23% 的增速为财报口径，分账机制来自媒体调查。
- 腾讯内部是否存在独立于 TokenHub 的集团级网关、业务方之间是否有内部计费，无一手披露。
- Hy3 发布期 WorkBuddy 排队率超 50% 来自市场报道，腾讯未确认。
- 腾讯 Agent 注册中心与阿里 AgentCore 均处于 BETA/公测阶段，地域和功能范围以文档为准；官方自述的性能数字（任务成功率、越权拦截率等）无第三方验证。
