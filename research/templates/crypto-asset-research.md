---
template_id: crypto-asset-research
template_version: 1
template_updated: 2026-08-26
style_id: default-research
---

# 加密资产观察通用模板

自动化每天按 CoinGecko 美元市值排名选择一个尚未完成的币种。排名、价格、市值和供给数据只代表资料截点，不构成投资建议。

## 输出 frontmatter

```yaml
---
title: "阿燃调研：每天一个加密资产 —— {{COIN_NAME}}（{{SYMBOL}}）观察"
category: topics
topic_type: market
crypto_type: asset
coin_id: "{{COIN_ID}}"
symbol: "{{SYMBOL}}"
market_cap_rank: {{MARKET_CAP_RANK}}
date: "{{DATE}}"
time: "{{TIME}}"
tags: [加密资产, "{{COIN_NAME}}", "{{SYMBOL}}"]
subjects: [business_market]
summary: "{{SUMMARY}}"
tldr: "{{TLDR}}"
content_type: analysis
assistance: codex
model: deepseek-v4-flash
research_template: crypto-asset-research
research_template_version: 1
sources_as_of: "{{SOURCES_AS_OF}}"
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---
```

## 一、先给结论

一句话说明它解决什么问题、凭什么获得当前市值、最关键的持续观察变量。再列 3–5 个可核验要点。

## 二、起源、背景与发展时间线

交代创始团队或发起组织、白皮书或主网上线时间、历史阶段、关键升级、重大危机与恢复过程。匿名创始人、争议归属和未经证实的身份必须明确标注。

## 三、技术机制与网络结构

说明它是原生链资产、协议代币、稳定币、封装资产或其他类型；覆盖共识/结算机制、节点或验证者、执行环境、扩容方式、跨链依赖与关键技术边界。

## 四、用途、生态与价值来源

说明支付、Gas、质押、治理、抵押、收益分配或生态激励等实际用途。区分设计用途、真实采用和市场叙事，并给出可跟踪指标。

## 五、代币经济与供给结构

| 指标 | 当前值 | 口径日期 / 来源 |
|---|---:|---|
| 流通量 |  |  |
| 总供应量 |  |  |
| 最大供应量 |  |  |
| 流通市值 |  |  |
| 完全稀释估值（FDV） |  |  |

继续核对发行、增发或销毁规则、初始分配、团队与投资人份额、解锁计划、集中度和质押比例。缺少可靠数据时留到「十、信息来源与未能验证」。

## 六、市场位置与历史表现

记录调研时点的美元价格、市值排名、24 小时成交额、历史高低点及日期。价格表现只做事实记录，不使用短期涨跌推导长期价值。

## 七、治理、安全与关键依赖

覆盖治理权限、基金会或公司影响力、合约升级权、多签、预言机、跨链桥、托管方、客户端集中度、历史攻击/停机/脱锚事件及后续处置。

## 八、监管与合规环境

区分不同司法辖区，记录证券属性争议、稳定币或支付监管、制裁与执法、交易平台限制。法律状态只引用监管机构、法院文件或可靠法律分析。

## 九、催化因素、主要风险与外部研判

把已确认的升级、解锁、治理提案等事项与观察者判断分开。每项风险写清触发条件和可跟踪指标，至少检查技术、供给、治理、监管、流动性和竞争风险。

## 十、信息来源与未能验证

来源优先级：项目官方文档与代码仓库；链上浏览器和治理记录；监管/法院文件；CoinGecko 市场快照；可靠研究机构与媒体。列出直接链接、资料截至时间、互相冲突的口径、未公开信息和查证路径。

自动稿必须保持 `review_ready: false` 与 `ad_eligible: false`。加密资产具有高波动与高风险，正文不得给出买卖、收益保证或仓位指令。
