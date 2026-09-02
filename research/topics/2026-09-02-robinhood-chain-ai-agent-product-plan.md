---
title: Robinhood Chain AI Agent 项目：先做无币产品，再决定是否发行代币
category: topics
topic_type: product
content_type: analysis
subjects: [ai_dev]
date: 2026-09-02
time: 08:35
tags: [Robinhood Chain, AI Agent, 链上金融, RWA, 智能合约, 产品验证, 代币设计, Web3安全]
summary: 把“跟随 FABLE 发一个 AI Agent 代币”改写成可验证的产品计划：先做用户确认交易的研究与执行助手，用 12 周验证安全、留存和收入，再设置是否发行代币的决策门槛。
tldr: Robinhood Chain 已具备 EVM、账户抽象、Stock Token 数据、Chainlink 和 DeFi 基础设施；更稳妥的切入点是先上线无币 Demo，让 AI 生成有来源的资产研究与交易草案，每笔交易由用户签名，等产品形成留存和非投机收入后再评估代币。
assistance: codex
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> **风险与合规提示：** 这是产品与工程方案，不构成投资、法律或代币发行建议。加密资产、代币化证券和自动化交易可能造成全部本金损失。项目应在确定运营主体、用户地区和法律意见后再开放真实资金功能。若团队、运营或推广面向中国大陆，还需特别注意 2026 年监管通知对代币发行融资、虚拟货币服务、RWA 代币化、商业展示、营销宣传及技术服务的限制。

## 一、先给结论

可行的项目定义是：

> 面向 Robinhood Chain 资产的 AI 研究与执行助手。它读取链上状态与可核验市场数据，生成带来源、风险和模拟结果的交易草案；用户确认后，由受限智能账户执行。

这一定义把 AI 放在研究、解释、模拟和交易编排环节。资金控制仍由用户签名、账户策略和链上限额共同约束。

建议按以下顺序推进：

1. **先确认参考资产。** X 搜索页只能说明关键词热度，无法唯一指向一份链上资产。记录 `chainId + 完整合约地址`，再核验创建交易、交易池、权限与持仓。
2. **先做无币 MVP。** 第一阶段使用测试网资产；真实收费可在合规路径明确后使用 ETH、USDG 或链下订阅，项目币不应成为启动前提。
3. **先把用户确认做成硬约束。** AI 只能生成提案，默认不能绕过用户签名，也不能持有项目金库或升级权限。
4. **公开可验证记录。** 模型输出全文保存在链下内容存储，链上只记录摘要哈希、策略版本、数据时间戳和执行结果，避免把敏感内容和大段文本永久公开。
5. **第 9—10 周设置代币决策门。** 留存、收入、安全和法律意见未达标时继续做产品，不安排 TGE。

## 二、先识别 FABLE，再谈“复制”

代币名称和 ticker 都可以重复。第三方索引在 Robinhood Chain 上已经收录多份名称或符号含 FABLE 的资产，例如：

| 索引结果 | 链上标识 | 能确认的范围 |
|---|---|---|
| `i am fable` / `fable` | Pons 页面列出 `0x9Fe1a89c2b5a702dd2f5eb9f783a08e3d6cec737` | 页面称其为固定供应代币，并显示 Uniswap v4 市场；仍需用浏览器复核合约和池 |
| `FableOS` / `FABLE` | DexPaprika 列出 `0x8794841d7da49dcb1ee81db9eb048bab372d45d9` | 第三方页面记录了 USDG/FABLE 池；项目归属和权限仍需独立核验 |
| 两份 `i am fable` / `FABLE` | HoodNexus 显示 `0x598c6e…b23a1b` 与 `0x9b8465…e99f1c` | 截断地址只够证明索引中存在两个条目，不能用于转账或下单 |

任何研究记录都应使用以下最小标识：

```json
{
  "chainId": 4663,
  "tokenAddress": "0x完整的40位十六进制地址",
  "poolAddressOrId": "0x完整地址或Uniswap v4 Pool ID",
  "deploymentTx": "0x部署交易哈希"
}
```

核验顺序是：完整合约地址 → 创建交易 → 源码与代理结构 → 管理角色 → 实际交易池 → 流动性 → 大额持仓 → 公开账号。社交搜索、代币名称、图标和 ticker 只适合发现线索。

## 三、Robinhood Chain 已经提供什么

截至 2026 年 9 月 2 日，Robinhood Chain 的公开资料可以确认以下能力：

| 项目 | 已确认事实 | 对产品的意义 |
|---|---|---|
| 网络 | 基于 Ethereum 的 Arbitrum L2，使用 ETH 支付 Gas | 可以沿用 Solidity、Foundry、Hardhat、viem、Wagmi 等 EVM 工具 |
| 网络 ID | 主网 `4663`，测试网 `46630` | 所有资产、签名和监控记录必须携带 Chain ID |
| 账户抽象 | 官方文档称支持 ERC-4337、批量交易、Gas 赞助和 session key | 可以实现受限会话、消费策略和更简单的首次使用流程 |
| 资产 | Stock Tokens 是 ERC-20 形式的代币化债务证券，并有专门的价格、公司行动和元数据接口 | Agent 必须处理适用地区、交易资格、公司行动与 multiplier，不能只读取 ticker 和余额 |
| 数据 | Robinhood 提供 Stock Token 只读 API；Chainlink 提供链上价格与 Data Streams | 报告可以引用来源，并在执行前校验数据时间戳和价格偏差 |
| 基础设施 | 官方生态页列出 Alchemy、Chainlink、Uniswap、Morpho、Paxos USDG 等 | RPC、交易、借贷和稳定币组件已有接入起点，但生产可用性仍需逐项实测 |
| 浏览器 | 主网与测试网均提供 Blockscout | 合约验证、事件检索和公开审计记录可以直接链接 |

还要区分两个容易混淆的入口：

- **Robinhood Chain** 是开放的第三方开发网络。开发者可以部署合约和 dApp。
- **Robinhood App 的 Agentic Trading** 是 Robinhood 自己公布的产品能力，允许第三方 AI Agent 连接专用 Robinhood 账户。链上部署不会自动获得 Robinhood App 上架、分发、合作或品牌背书。

Robinhood Chain 服务条款也写明，Robinhood 不控制第三方在链上构建的项目，不托管链上资产，并对第三方项目、桥接合约及相关基础设施不作安全保证。产品页面必须使用准确的品牌表述，避免让用户误以为项目由 Robinhood 发行或审核。

## 四、第一版产品边界

### 目标用户

第一批用户应限定为理解自托管钱包、愿意查看交易模拟、可以接受测试网或小额真实资金实验的链上用户。第一版不面向需要“AI 代替自己赚钱”的用户，也不宣传收益率。

### 核心任务

用户输入一段自然语言，例如：

> 查看我在 Robinhood Chain 的持仓，列出流动性、价格源、集中度和合约权限风险；给出把 100 USDG 分配到白名单资产的方案，但不要直接交易。

系统输出应固定包含：

- 资产的 `chainId`、完整合约地址、余额和来源时间；
- 价格来源、更新时间、是否应用 Stock Token multiplier；
- 流动性、预估滑点、合约权限和持仓集中度；
- 方案目标、每一步 calldata、人类可读解释和最坏情景；
- 模拟结果、Gas 估算、授权额度与失败原因；
- “仅保存草案”和“连接钱包确认”两个明确动作。

### 第一版明确不做

- 不让模型保存助记词、私钥或金库签名权；
- 不执行无限额度授权，默认使用精确授权或 Permit；
- 不支持模型自行更换路由器、价格源或白名单；
- 不做复制交易、杠杆、永续合约和跨链自动追涨；
- 不发布自动收益承诺、排行榜造势或代币预售；
- 不把未经独立核验的社交内容直接转成交易。

## 五、产品与合约架构

```text
浏览器端
  ├─ 钱包连接与网络校验
  ├─ AI 对话、证据卡片与报告
  ├─ 交易模拟与风险确认
  └─ 用户签名
          │
          ▼
链下服务
  ├─ Asset Registry：chainId + 合约 + 资产资格
  ├─ Data Adapter：RPC / Stock Token API / Chainlink
  ├─ Research Agent：检索、引用、生成候选方案
  ├─ Deterministic Policy Engine：硬规则检查
  └─ Simulation / Monitoring：预执行与告警
          │
          ▼
Robinhood Chain
  ├─ ERC-4337 智能账户或受限执行账户
  ├─ Policy Module：单笔、单日、白名单、滑点、到期时间
  ├─ Execution Adapter：只调用审核过的协议
  ├─ Decision Registry：记录摘要哈希和执行结果
  └─ Emergency Pause：用户撤销 session key，管理操作走多签与时间锁
```

### AI 与策略引擎的职责要分开

大模型适合做意图理解、研究摘要、异常解释和候选操作编排。以下规则必须由确定性代码执行：

```js
const policy = {
  chainId: 4663,
  maxPerTransactionUsd: 100,
  maxPerDayUsd: 300,
  maxSlippageBps: 50,
  allowedTokens: ['0x...'],
  allowedTargets: ['0x...'],
  approvalMode: 'exact',
  requireFreshPriceWithinSeconds: 30,
  requireSimulation: true,
  requireUserSignature: true,
}
```

模型不能修改这份策略。修改限额、白名单、执行适配器和价格源应触发独立用户签名；项目级升级还应通过多签与时间锁。

### 决策凭证怎样上链

链上记录建议保持最小化：

```solidity
event DecisionRecorded(
    address indexed account,
    bytes32 indexed decisionHash,
    bytes32 indexed policyHash,
    string modelId,
    uint64 dataTimestamp,
    address target,
    bytes4 selector,
    bool executed
);
```

完整报告、提示词和证据清单存放在链下；对规范化 JSON 计算哈希后再写链。这样可以证明内容没有被事后更改，也能避免泄露用户对话、策略细节和个人信息。`modelId` 需要包含供应商、模型版本和应用侧提示模板版本。

## 六、两周无币 Demo

Demo 的目标是证明完整的“读数据—生成方案—模拟—用户确认—记录结果”链路，不追求资产数量。

### 第 1 周：只读研究

- 接入 Robinhood Chain 测试网 `46630`，钱包切链失败时给出明确提示；
- 建立 5—10 个白名单测试资产的注册表；
- 读取余额、交易记录、合约元数据与价格；
- 把每条关键结论绑定到具体 RPC 返回、官方 API 或价格源；
- 输出统一风险卡：地址、流动性、管理员权限、价格新鲜度、可交易性；
- 对同名资产强制展示完整地址，禁止按 ticker 自动选币。

### 第 2 周：受限执行

- 只支持一种操作，例如测试网的固定输入 swap；
- 在签名前完成 `eth_call` 或等价模拟，展示余额变化、Gas、授权和滑点；
- 策略引擎拒绝超限额、非白名单、过期报价和未知目标合约；
- 用户在钱包内签名，服务端不接触私钥；
- 将 `decisionHash + policyHash + 执行结果` 写入测试网；
- 为用户提供一键撤销 session key、授权和紧急暂停入口。

Demo 验收需要同时通过以下场景：正常成交、报价过期、滑点超限、目标地址被替换、错误 Chain ID、授权额度过大、RPC 不一致、价格源停更、模拟成功但上链失败、用户取消签名。

## 七、12 周执行表

| 周次 | 交付物 | 退出条件 |
|---|---|---|
| 1—2 | 用户访谈、司法辖区清单、竞品与同名资产核验、无币 Demo | 20 次有效访谈；完整测试链路可复现；没有真实资金自动执行 |
| 3—4 | Asset Registry、证据化报告、钱包与模拟界面 | 每个资产由 `chainId + address` 唯一识别；关键数字都有来源和时间戳 |
| 5 | Policy Engine 与智能账户原型 | 越权、超额、过期报价、错误网络全部被确定性规则拒绝 |
| 6 | 决策凭证、监控、撤销和暂停 | 能从报告哈希追溯到执行；用户能独立撤销权限 |
| 7—8 | 30—100 人封闭测试与外部安全评审 | 严重问题清零；失败原因可观测；完成恢复演练 |
| 9 | 付费与留存验证 | 至少一种与代币价格无关的收入；留存按真实活跃钱包计算 |
| 10 | 代币必要性、法律意见和威胁模型评审 | 逐项回答“代币解决了哪项无法用数据库、订阅或稳定币解决的问题” |
| 11—12 | 有限主网上线或继续测试网迭代 | 主网仅对白名单用户和小额限额开放；文档、源码、监控、应急联系人齐全 |

如果安全评审、法律意见或恢复演练没有完成，第 11—12 周继续停留在测试网。这也属于正常的产品结果。

## 八、指标与代币决策门

### 产品指标

建议把“看起来热闹”和“真的有用”拆开：

| 维度 | 指标 | 统计口径 |
|---|---|---|
| 激活 | 首次完成一份带来源报告的用户比例 | 连接钱包不算激活 |
| 使用 | 每周完成研究、保存草案或签名执行的独立钱包 | 剔除团队、测试和女巫地址 |
| 留存 | 第 7、30 天仍完成核心任务的比例 | 以首次核心任务为 cohort 起点 |
| 质量 | 引用可访问率、过期数据拦截率、幻觉地址率 | 幻觉地址目标必须为 0 |
| 执行 | 模拟成功率、上链成功率、平均滑点、失败恢复时间 | 按协议和资产拆分 |
| 安全 | 越权拦截、异常授权、session key 撤销时长 | 每次演练保留证据 |
| 商业 | 付费转化、每付费用户收入、推理与 RPC 成本 | 不计项目币价格上涨 |

### 什么时候才进入代币设计

以下是内部立项门槛，不是行业标准：

- 至少 500 个去重后的真实活跃钱包；
- 30 日核心任务留存达到约 20%；
- 已有稳定币、订阅或协议费形成的非投机收入；
- 外部安全评审、漏洞响应和恢复演练完成；
- 法律意见覆盖发行主体、销售地区、代币属性、KYC/AML、税务与营销；
- 代币对应一项可验证的稀缺资源或经济责任。

可能成立的用途包括策略提供者保证金、可验证数据贡献奖励、风险参数治理和调用费用折扣。单纯以价格上涨、回购、分红或拉新奖励为核心，会显著增加投机、挤兑和监管风险。

若门槛未满足，可以继续用 USDG、ETH 或订阅收费。产品不需要为了维持叙事而发行代币。

## 九、代币草案怎样改得更可执行

在通过决策门之后，才进入供应设计。以下比例只能作为讨论起点：

| 分配 | 比例 | 最低约束 |
|---|---:|---|
| 用户与生态激励 | 45% | 按可验证使用分期释放；反女巫规则和单地址上限公开 |
| 项目金库 | 20% | 多签、时间锁、预算提案和链上支出记录 |
| 团队 | 15% | 12 个月 cliff，随后 36 个月线性释放；受益地址公开 |
| 初始流动性 | 10% | 交易对、初始价格、LP 管理人和撤池规则公开 |
| 开发者与数据贡献者 | 7% | 先定义贡献证明、争议处理和惩罚条件 |
| 安全与审计储备 | 3% | 仅用于审计、漏洞奖励和事件响应；金库单独记账 |

比例相加等于 100%，但这只解决账面分配。正式方案还要给出总供应量、释放曲线、FDV 情景、初始流通量、金库授权、治理法定人数、紧急权力、做市安排、税务处理和退出机制。

需要在合约和运营规则中排除：隐藏增发、无限税率、任意没收、随意拉黑、团队单方升级、团队随时撤出流动性、AI 单签金库，以及依靠后续资金维持既有收益。

## 十、安全威胁模型

| 风险 | 典型路径 | 第一版控制 |
|---|---|---|
| 提示注入 | 代币元数据、网页或社交内容诱导 Agent 调用恶意合约 | 外部文本永远是数据；目标地址只来自独立注册表 |
| 地址幻觉 | 模型编造或抄错合约地址 | 模型不能生成可执行地址；地址由后端按 `chainId` 注入 |
| 价格操纵 | 用浅池现价诱导错误估值 | 多源价格、流动性门槛、最大偏差、时间戳和 TWAP/数据流 |
| 无限授权 | 恶意 Router 或前端要求 `uint256.max` | 精确授权、Permit、授权扫描和一键撤销 |
| Session key 泄漏 | 浏览器、日志或服务端密钥被盗 | 最小权限、短有效期、单笔/单日限额、用户即时撤销 |
| 模拟与成交不一致 | 报价后状态变化、MEV 或夹子交易 | 交易 deadline、最小输出、私有交易路径评估、成交后校验 |
| RPC 欺骗或故障 | 单一节点返回错误状态 | 关键读操作双 RPC 交叉验证；生产环境不依赖公共限流 RPC |
| 预言机异常 | 停更、偏差或错误 multiplier | 新鲜度、deviation、熔断和人工降级模式 |
| 管理员越权 | 升级合约、替换价格源、扩大白名单 | 多签、时间锁、事件监控和公开变更说明 |
| 隐私泄漏 | 把持仓策略、对话或身份永久写链 | 链上只存哈希与最小元数据，报告默认私有 |

项目金库与 Agent 执行账户应完全分离。热钱包不持有合约升级权、金库权或应急多签席位。

## 十一、预算与团队配置

以下为早期规划区间，受团队所在地、审计范围、法律辖区和是否自研智能账户影响很大，不能当成报价：

| 阶段 | 规划区间 | 主要投入 |
|---|---:|---|
| 两周概念验证 | 1万—3万美元 | 产品、前端、数据接入、测试网合约 |
| 可用 MVP | 4万—10万美元 | 智能账户、策略引擎、监控、封闭测试 |
| 独立安全评审 | 1.5万—6万美元 | 合约、前端签名链路、权限与应急流程 |
| 法律与合规 | 2万—8万美元 | 多司法辖区、代币属性、营销、数据与用户准入 |
| 较完整主网产品 | 10万—30万美元 | 生产基础设施、持续安全、支持与运营；不含流动性和做市资金 |

一个精简团队至少需要产品/研究、前端与钱包、合约与安全、后端与数据四项能力。法律意见和独立审计应由外部专业团队完成，不能由开发团队自证。

## 十二、未能验证与下一步输入

目前仍缺少以下决定性信息：

- 用户所指 FABLE 的完整合约地址或任意一笔链上交易；
- 项目运营主体、团队所在地和目标用户地区；
- 启动预算、现有工程团队和可承受的主网资金上限；
- 产品更偏向严肃研究工具、自动化执行工具，还是社区文化项目；
- 计划接入哪些 Stock Tokens、DEX、借贷协议和价格源；
- Robinhood Chain 各生态组件在目标地区、目标资产和测试网的实际可用性。

拿到 FABLE 的完整地址后，下一轮应先产出一份链上核验卡：创建者、源码、代理、管理员、供应量、前十持仓、交易池、流动性、费用、社交归属和风险事件。产品团队随后用两周 Demo 验证研究与受限执行链路，再决定是否进入 12 周计划。

## 十三、信息来源与说明

- [Robinhood Chain 官网](https://robinhood.com/chain)：网络定位、AI Agent、RWA、交易与借贷场景，以及 Stock Token 风险披露。
- [Robinhood Chain 网络配置](https://docs.robinhood.com/chain/connecting/)：Arbitrum L2、ETH Gas、Chain ID、RPC、Alchemy 与 Gasless Transaction Infrastructure。
- [Robinhood Chain 概览](https://docs.robinhood.com/chain/)：EVM、ERC-4337 账户抽象及生态组件。
- [智能合约部署文档](https://docs.robinhood.com/chain/deploy-smart-contracts/)：Foundry、Hardhat、测试网优先和 Blockscout 验证流程。
- [Stock Tokens 文档](https://docs.robinhood.com/chain/stock-tokens/) 与 [Stock Token API](https://docs.robinhood.com/chain/stock-token-apis/)：代币法律结构、ERC-20 接口、Chainlink 价格、公司行动 multiplier 和只读数据接口。
- [Chainlink Data Streams](https://docs.robinhood.com/chain/data-streams/)：低延迟签名数据与 Robinhood Chain 验证合约。
- [Robinhood Chain 服务条款](https://docs.robinhood.com/chain/terms-of-service/)：第三方项目、托管、公共 RPC、基础设施和责任边界。
- [Robinhood 2026 年主网与 Agentic Trading 公告](https://robinhood.com/us/en/newsroom/robinhood-accelerates-global-expansion-robinhood-chain-mainnet-stock-tokens-agentic-trading/)：公开主网、生态伙伴与 Robinhood App Agentic Trading 的产品描述。
- [中国证监会转载的银发〔2026〕42号通知](https://www.csrc.gov.cn/csrc/c100028/c7614318/content.shtml?f_link_type=f_linkinlinenote)：中国大陆关于虚拟货币、RWA 代币化、境外发行、互联网展示及技术服务的现行监管边界。
- [Pons 的 i am fable 页面](https://www.ponsfamily.com/launchpad/0x9fe1a89c2b5a702dd2f5eb9f783a08e3d6cec737)、[DexPaprika 的 USDG/FABLE 池](https://dexpaprika.com/robinhood/pool/0x17494cd7a3cd8cfd9b49e6c09147324e4fbf0c9b7ac0578147c4b2ad900700d6)、[HoodNexus](https://www.hoodnexus.com/)：仅用于说明第三方索引中存在多个 FABLE 相关条目；这些页面不证明项目归属、安全性或与用户提供的 X 搜索结果存在对应关系。

资料截至 2026 年 9 月 2 日。预算、KPI 门槛、产品架构和代币比例属于项目规划建议；Robinhood Chain 网络参数、产品能力和监管事实以对应官方来源为准。
