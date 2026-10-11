# 内地居民赴港开立 ZA Bank 与 ZA Card 调研

更新：2026-09-07（香港时间）。面向有真实跨境消费、线上订阅或访港支付需求的内地成年人；不构成开户、外汇、税务或投资建议。

## 结论先行

ZA Card 是香港 ZA Bank 发行、直接扣香港港元活期账户余额的 Visa 扣账卡（debit card），不是信用卡、不是预付卡。发行行公开资料没有将它标为 Visa Classic、Gold、Platinum、Signature 或 Infinite；应以“Visa Debit”而非任何推断出的等级理解。它适合低频线上国际支付和香港日常消费，但不是低成本海外旅行卡：外币卡消费通常收 1.95%，境外 ATM 目前显示为每笔 HK$50 加 1.95%。

在订阅方面，ChatGPT 网页结账官方接受信用卡和借记卡，故 ZA Card 的产品类型本身符合；但 OpenAI 同时要求用户所在地及发卡地属于支持地区。已找到相互矛盾的个人实测：一份近期个人使用记录称“香港众安银行卡通过 Google 支付”订阅 ChatGPT Plus；另有非官方攻略称直接绑卡成功。不能据此保证任一新申请或续费必然成功，更不能把“能开 ZA Card”视为绕过地区可用性的方法。

## 1. 卡片、账户与费用

| 项目 | 当前结论 |
|---|---|
| 网络 / 级别 | Visa 扣账卡；ZA 没有公开 Classic/Gold/Platinum 等等级。不要按 Visa 高端权益预期。|
| 扣款性质 | 消费从 HKD current/savings balance 直接扣；无授信、利息、逾期费。ZA Credit 是另一个循环信贷产品。|
| 币种 | 卡的直接扣款资金池是 HKD；外币交易由 Visa 汇率换算后加费，不能把它当作“外币余额直扣多币种卡”。|
| 年费 / 申请 / 管理费 | ZA Card 年费、申请和使用费为 0；个人基本账户无最低余额要求的公开收费。|
| 外币签账 | 1.95%（Visa 1% + ZA 0.95%）；CNY、USD、EUR 等非 HKD 计价均属这一类。|
| 补卡 | 旧收费表：每自然年头两次免费，第三次起 HK$50；下单前仍应看 App 最新报价。|
| 香港 ATM | 仅支持 HKD；Visa ATM 可取。当地 ATM 自行收费风险仍须现场确认。|
| 境外 ATM | 当前帮助中心：每笔 HK$50 + 1.95%；本地和境外合并每月等值 HK$80,000 免费提款额度，超出另收 1%。旧 PDF 仍写 HK$20，已过期（2020 生效），不应采用。|

## 2. 怎么使用，地区差异与限额

开户并通过内部审查后先得到虚拟卡；实体卡须在 App 申请，邮寄到登记通讯地址。虚拟卡用于卡号、有效期、CVV 的线上/CNP 交易及绑定钱包；实体卡可作芯片/感应线下消费和 ATM 取现。二者不是两个独立余额，均扣同一账户；冻结、换虚拟卡或重发会影响相应已保存的订阅卡号。

默认每日消费额度 HK$50,000（内部审查前为 HK$10,000；完成同名转账但尚未审查完为 HK$30,000；审查完成可设 HK$50,000–300,000）；默认月额 HK$300,000，可设 0–1,000,000。实际可用额为剩余日额、剩余月额和 HKD 余额三者最低值。ATM 默认日额 HK$20,000，可设 0–50,000；银行卡和 ATM 的额度并非“自动放开”。

- 香港：实体卡可在 Visa ATM 取 HKD；线下 Visa 受理及 Apple Pay / Google Pay 是主要路径。
- 内地：Visa 受理商户、支持境外卡的线上交易可用，但不能把“内地所有二维码/所有银联机具”理解成可用。CNY 消费仍是外币交易，产生 1.95%。
- 钱包：ZA 官方确认 Apple Pay、Google Pay，并有“添加至 Alipay HK”的操作说明；其营销页面也列 WeChat Pay、Alipay。官方没有把“内地版支付宝/微信支付”和“香港钱包”逐项保证兼容。社区实测会随账户地区、实名状态、商户类型、主动/被动扫码而变，必须先小额测试；不能把港版 AlipayHK 的可绑卡性外推至中国内地版。
- 海外：先在 App 的 Travel 中开“Card Spending / ATM withdrawal”、填目的地和时间；官方明确说这会降低被拦截概率，但高风险交易仍会被拦。付款时选商户本币，拒绝 DCC（商户把外币强换 HKD），否则可能承担商户差汇率且仍有跨境费用。

## 3. 订阅与 OpenAI：证据边界比“成功率”重要

**官方可确认**：ChatGPT 网页订阅可用 credit/debit cards；API credits 只接受标准信用卡或借记卡，不能用 prepaid；发卡行或用户所在区域不在支持范围、3DS/SCA 未完成、余额/卡资料不一致、银行阻拦线上/国际/周期扣款，都可能被拒。ChatGPT Plus/Pro 续费也可能因安全或支付方式问题失败。

**实测信号，非统计结论**：近期个人博客记录以“香港众安银行卡通过 Google 支付”支付 ChatGPT Plus；另一篇未披露支付流程和样本数的攻略声称 ZA Card 成功绑 ChatGPT Plus、Midjourney、Netflix。它们说明“并非产品层面必然不支持”，却不能推出授权成功率，尤其不能代表直接网页、App Store/Google Play 内购、API billing 三种通道。未找到可复核的大样本、发卡 BIN 分组测试，故成功率应标为**未知**。GitHub Copilot、Netflix 同理：卡组织/标准订阅能力具备，但没有足以定量证明 ZA 成功率的公开样本。

**安全做法**：使用真实香港账单资料和自己的 OpenAI 账户；保证账户 HKD 余额覆盖订阅金额、汇率和 1.95% 费用；保留 ZA Verify/3DS 流程；首笔失败不要连续高频重试；在银行端确认“线上、境外、循环扣款”开关及旅行设置，再联系 OpenAI 或发卡行。不要用 VPN、虚构居住地、代付或拆分账户规避服务区域和银行合规审查。

## 4. 同类型横向对标（截至本次核验）

| 银行 / 卡 | 卡组织、卡级 | 外币 / 跨境费 | 内地访港开户门槛 | 卡形态与订阅判断 |
|---|---|---|---|---|
| ZA Bank / ZA Card | Visa Debit；无公开等级 | 1.95%；海外 ATM HK$50+1.95% | 18+、在香港、内地身份证、可在港收短信/电话的内地手机号、同号内地储蓄卡、NIA 出入境证明 | 虚拟卡先发、实体可申请；标准借记卡可尝试订阅，成功率未知。|
| Mox / Mox Card | Mastercard debit（非 Visa） | 外币 1.95%；即使 HKD 但收单/商户在境外也有 1.95% cross-border access fee；不应选 DCC | 18+、人在香港、PRC 身份证、回乡证及 NIA travel record、地址/手机号；PRC 身份证用户另需从本人内地/香港账户同名转入至少 HK$1,000、RMB950 或 USD130 才解除部分零额度 | 数码卡即时、实体卡；Apple/Google Pay；官方称部分钱包（含 Alipay、PayMe）不接 Mastercard debit top-up；订阅成功率未知。|
| WeLab / Global Wallet Debit Card | Mastercard debit（非 Visa） | 对其 11 个支持币种的合规本币支付主张 $0 foreign-currency transaction fee；非支持币种由 Mastercard 换 HKD +1.95%。多币种直扣/SmartSwitch 是四者中最适合旅行的设计 | 18+、人在香港、内地身份证、NIA 出入境记录、内地/香港手机号和地址，且页面写有有效推荐码 | 核心账户自带虚拟卡，可绑手机钱包；实体卡资格/邮寄需 App 确认；能绑内地 Alipay/WeChat 的官方推广仅针对其 Global Wallet，不等于所有版本均必过。订阅成功率未知。|
| 天星银行（Airstar；品牌已迁为 Ele Bank，需以 App/现行条款为准）/ Visa 白金卡 | **Visa Platinum debit**（条款明确） | 公开收费摘要写跨境 HKD 交易 1.95%；多币种条款存在，具体支持币种、换汇和 ATM 费用应在当前 App/收费表逐项确认 | 未找到截至本次检索仍有效、由现行银行官网发布的“内地访港个人客户”开户资格页；旧教程不能替代当前资格确认 | 虚拟、实体、电子钱包卡均在条款定义内；订阅成功率未知。|

所有四者的账户月管理费通常为 0 / 无最低余额收费；Mox+ 等是可选权益等级，未达余额只会失去权益而非产生月费。此表不把短期返现和开户奖励当作长期费率。

## 5. ZA 访港开户：硬条件与真实阻碍

ZA 官方现行访港旅客 FAQ 的硬性条件为：年满 18；开户时实际处于香港主区；有效 PRC 居民身份证原件（从开户日起至少余 30 日有效期）；能在香港收短信和接电话的内地手机号；与该手机号绑定的有效内地储蓄卡；有效国家移民管理局出入境证明。官方明确“必须亲自到香港”。没有“先在内地远程开好、落地自动生效”的官方路径。

开户成功也不等于所有额度立刻可用：ZA 另有内部审查，决定初始卡额度和实体/虚拟卡能力。资料真实、一致、网络与定位正常、光线足够的人脸识别、预先下载 NIA 证明是可操作的准备项；不要因为非官方教程声称“不要香港、可寄内地、数分钟必下”而放弃以 App 提示为准。

## 6. 适合性与避坑

**适合**：已合规赴港、有稳定同名资金来源、需要香港 FPS 账户和一张低维护 Visa 借记卡的人；线上国际小额付款、香港日常消费、备用支付卡用户。

**不适合**：仅为绕开某平台地区规则或只为 ChatGPT/Netflix 单一订阅而专程办卡的人；频繁海外现金取现者；追求零 FX 成本的旅行用户；需要信用额度、预授权容错、酒店/租车押金或高端 Visa 权益的人。

**最实用的八条**：
1. 出发前逐项备齐身份证、通行证、在港可用手机号/同号储蓄卡、NIA 出入境记录；人必须在香港。
2. 先完成内部审查再安排订阅或大额付款，并在 App 确认消费/ATM 限额。
3. 虚拟卡先用于小额线上验证，实体卡到手再测试 ATM；二者共用 HKD 余额。
4. 海外或内地非 HKD 消费把 1.95% 计入成本；避免 DCC。
5. 订阅要保留足额 HKD，考虑汇率、商户小额预授权与续费日；卡号重发后更新自动扣款。
6. 不把内地支付宝/微信的绑定和扫码当成官方承诺；按钱包版本、地区和商户小额验证。
7. 出境前打开 Travel 的消费/ATM 地区；失败时先检查 ZA Verify、卡设置、额度、余额和商户地区，不要连续盲试。
8. 所有跨境汇款、购汇和税务申报按本人所在地和银行规定如实办理；不要使用虚假用途或第三方代持资金。

## 来源与证据等级

核心一手资料：ZA [年费及属性 FAQ](https://bank.za.group/en/faqs/Individuals/ZA_Card/About_ZA_Card/66ceccd7f8d2035ba7c92c8c)、[访港开户资格](https://bank.za.group/hk/hk/faqs/Individuals/Account_opening/Open_an_account_for_a_visitor_in_HongKong/66503e51b359be4a195230e8)、[必须亲身在港](https://bank.za.group/hk/en/faqs/Individuals/Account_opening/Open_an_account_for_a_visitor_in_HongKong/66503e60b359be4a19523105)、[虚拟/实体卡](https://bank.za.group/en/faqs/Individuals/Account_opening/Open_an_account_for_a_visitor_in_HongKong/67c152c61883244561c2f73d)、[消费额度](https://bank.za.group/en/faqs/Individuals/ZA_Card/ZA_Card_spending/669900839db07431c2ed409d)、[ATM费用](https://bank.za.group/en/faqs/Individuals/ZA_Card/ATM/6650360fb359be4a195230b1)、[旅行设置](https://bank.za.group/en/faqs/Individuals/ZA_Card/ATM/6718c8af9368571c627b4fe1)。

对标一手资料：Mox [开户条件](https://mox.com/account-open/)、[卡 FAQ](https://mox.com/faqs/faq-mox-card/)、[收费表](https://mox.com/static/240729_Fees_and_Charges.pdf)；WeLab [开户条件](https://www.welab.bank/zh-CN/feature/onboarding/)、[Global Wallet](https://www.welab.bank/en/feature/welab-global-wallet/)、[收费](https://www.welab.bank/zh-CN/support/bank-account/general-service-charges/)；天星 [Visa 白金卡条款](https://foss-hk.airstarbank.com/airstarbank_fmp/prod/WebHome_space/15292344c0a84219966232b7b008e666_1765160804315_b531cc_%E5%A4%A9%E6%98%9F%E9%93%B6%E8%A1%8CVisa%E7%99%BD%E9%87%91%E5%8D%A1%E7%9A%84%E6%9D%A1%E6%AC%BE%E5%8F%8A%E6%9D%A1%E4%BB%B6%E9%80%82%E7%94%A8%E4%BA%8E%E5%B7%B2%E5%90%AF%E7%94%A8%E5%A4%9A%E5%B8%81%E7%A7%8D%E4%BA%A4%E6%98%93%E5%8A%9F%E8%83%BD%E5%AE%A2%E6%88%B7.pdf)。

OpenAI 一手资料：[卡拒付排查](https://help.openai.com/en/articles/7232916-how-do-i-get-a-receipt-for-chatgpt-plus)、[订阅续费失败](https://help.openai.com/en/articles/7242622-why-did-my-chatgpt-plus-renewal-transaction-fail)、[支付方式](https://help.openai.com/en/articles/10421635-multi-year-discounts-for-students-on-chatgpt-plus-us-canada-students-only-campaign-guide%252525252525252525252525253F.ejs)、[支持地区限制](https://help.openai.com/en/articles/9131992-chatgpt-and-api-services-in-unsupported-countries-and-territories%23.doc)。个人实测仅作为低等级佐证：[近期个人记录](https://jayncp.com/blog/ai-coding/)、[非官方攻略](https://dev.xiaoc.ee/zabank-guide-2026/)。
