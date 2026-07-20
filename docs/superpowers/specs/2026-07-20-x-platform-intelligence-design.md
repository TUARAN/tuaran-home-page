# X 平台多维情报图谱设计

日期：2026-07-20
状态：已确认，等待实施计划
目标路由：`/x-platform-intelligence`

## 1. 背景与目标

为 2aran.com 新增一张公开、可筛选、可追溯、按季度维护的 X 平台多维情报页。页面面向中文科技创作者和平台经营者，帮助他们判断：

- X 当前的用户规模、活跃度、国家分布和用户画像是什么；
- 哪些数字是官方披露、监管口径、独立调查、第三方测量或未经独立验证的说法；
- X 与全球及中文社交平台在传播、搜索、关系、外链和商业化方面有哪些关键差异；
- 哪些创作者、内容和经营目标适合 X，以及 X 应该怎样与其他平台组合。

页面不是一次性长文，也不是实时监控系统。它是保留历史快照的季度情报图谱。

## 2. 已确认范围

### 2.1 页面定位

- 公开访问，登记到现有“多维页面”的“数据可视化”分类。
- 采用“证据优先的情报图谱”布局。
- 用少量叙事解释核心判断，用底层数据表提供筛选、溯源和导出。
- 首版使用静态数据和浏览器交互，不接运行时 API，不做自动爬取。

### 2.2 比较平台

全球组：

- Threads
- Facebook
- Instagram
- TikTok
- Reddit
- LinkedIn

中文组：

- 微博
- 知乎
- 小红书
- 微信公众号
- 即刻

X 是页面主对象；其他平台只采集支持经营差异判断所需的数据，不为每个平台复制一套完整档案。

### 2.3 不在首版范围

- 登录、收藏、评论或个人工作区；
- 后台可视化编辑器；
- 自动抓取第三方网站；
- 对单个 X 账号的实时诊断；
- 预测未来用户规模；
- 将不同口径强制折算成一个“真实 MAU”。

## 3. 设计原则

1. **口径先于数字**：DAU、MAU、广告受众、访问者、设备和注册账户必须分别展示。
2. **冲突也是信息**：可信来源冲突时并列展示，不用平均数掩盖差异。
3. **同口径才排名**：无法比较的数据使用区间、差异矩阵或注释，不进入排行榜。
4. **事实与判断分层**：定量观测、来源事实、编辑结论和经营建议使用不同标签。
5. **筛选不制造数据**：没有真实交叉数据时显示“暂无可靠数据”，不拼接伪画像。
6. **历史可回看**：季度更新新增记录，不覆盖旧快照。
7. **核心内容无脚本可读**：图表失效时，摘要、表格和来源仍能被阅读。

## 4. 页面信息架构

### 4.1 一屏结论

- 标题、定位、当前季度、最后核验日期；
- 活跃规模区间、活跃度、核心国家和主力画像；
- 3 至 5 条创作者经营判断；
- 与上季度相比的变化摘要；
- 数据透明度和更新时间提示。

### 4.2 规模与趋势

- DAU；
- MAU；
- 广告可触达人数；
- 网站和 App 访问规模；
- 使用时长与访问频次；
- 发布量、互动量等平台活动指标；
- 官方自报、监管披露、独立调查和第三方估算的历史变化。

趋势线遇到统计定义变化时断开，并显示口径变化节点。

### 4.3 国家与地区

- 全球分布地图；
- 用户规模 Top 国家；
- 广告受众 Top 国家；
- 本地互联网人口渗透率；
- 季度或年度变化；
- 可用性、限制和主要语言。

用户规模、广告受众和网站流量分别成图，不在同一图中混用。

### 4.4 用户画像

- 年龄；
- 性别；
- 收入；
- 教育；
- 职业与行业；
- 城市层级；
- 政治倾向；
- 新闻消费和平台使用动机。

画像卡必须显示地域、样本期和调查或测量方法。仅在来源实际支持时提供交叉筛选。

### 4.5 内容与传播机制

- 文本、图片、视频、长文、直播和 Spaces；
- 实时事件与热点发现；
- For You、Following、Search、Explore 等分发界面；
- 转帖、引用、回复和关系链扩散；
- 内容寿命、爆发速度、搜索价值和外链能力；
- 推荐与可见性机制的已知事实、历史开源实现和实测推断。

算法相关内容必须注明属于当前官方规则、历史开源代码、监管材料、研究结论还是编辑推断。

### 4.6 创作者经营

- 适合 X 的创作者类型；
- 内容格式与生产成本；
- 发布与互动节奏；
- 冷启动、关系建立和跨语种扩散路径；
- 订阅、收入分成、品牌合作和外部导流；
- 参与门槛、支付地区和政策风险；
- “适合 X”“适合作为组合渠道”“不适合只做 X”的明确判断。

页面默认给中文科技创作者一个组合建议：X 用于发现、实时讨论和关系连接，其他平台根据搜索沉淀、中文覆盖或私域触达承担补充角色。该建议属于编辑判断，必须能展开查看依据。

### 4.7 重点差异矩阵

对 X 和比较平台采用下列共同维度：

- 总体触达；
- 实时性；
- 内容寿命；
- 搜索价值；
- 专业关系密度；
- 公共讨论能力；
- 外链友好度；
- 算法分发强度；
- 关注关系价值；
- 中文覆盖；
- 国际化；
- 内容制作成本；
- 原生商业化；
- 私域沉淀；
- 品牌安全；
- 数据透明度。

矩阵值为“高 / 中 / 低 / 未知”或同口径定量值。相对能力属于编辑结论，不伪装成精确统计。点击单元格打开证据抽屉。

### 4.8 风险与限制

- 数据透明度；
- 机器人、垃圾内容和虚假互动；
- 内容治理与品牌安全；
- 创作者政策稳定性；
- 地区可用性与支付限制；
- API、研究接口和数据获取限制；
- 平台所有权、产品和监管变化。

“平台层风险”和“创作者经营风险”分开呈现。

### 4.9 证据账本

提供全部观测记录，支持筛选、排序和 CSV 导出。每条记录至少显示：指标、值、平台、统计期、地区、人群、来源、口径、可信度和冲突状态。

## 5. 筛选与交互

### 5.1 全局筛选

- 季度；
- 地区或国家；
- 人群；
- 创作者目标；
- 比较平台；
- 数据可信度。

筛选状态写入 URL 查询参数，支持复制和分享。无效参数回退到默认值。

### 5.2 作用范围

页面显示当前筛选影响多少模块。监管风险和完整证据账本可保留全局范围；其他模块按真实支持的维度响应。模块不支持某一筛选时给出说明，不静默显示错误结果。

### 5.3 证据抽屉

点击数字、结论或差异矩阵单元格后显示：

- 原始来源；
- 指标定义；
- 统计时间和发布时间；
- 地域与样本；
- 来源类别和可信度；
- 冲突数据；
- 编辑说明。

## 6. 数据模型

### 6.1 Source

```text
id
title
publisher
url
publishedAt
accessedAt
sourceClass
methodologySummary
archiveStatus
notes
```

### 6.2 Observation

```text
id
platformId
metricId
valueType          exact | range | percentage | index | qualitative
value
valueMin
valueMax
unit
periodStart
periodEnd
publishedAt
geography
segments
methodology
sourceId
confidence
comparability
conflictGroupId
status
snapshotId
editorNote
```

### 6.3 Insight

```text
id
title
summary
audienceGoal
geographies
segmentFilters
evidenceObservationIds
evidenceSourceIds
confidence
validFrom
validTo
snapshotId
```

### 6.4 Comparison

```text
id
platformId
dimensionId
rating             high | medium | low | unknown
quantitativeObservationIds
evidenceSourceIds
rationale
confidence
snapshotId
```

### 6.5 Snapshot

```text
id                  2026-q2
label
periodStart
periodEnd
verifiedAt
summary
previousSnapshotId
```

## 7. 来源分类与可信度

### 7.1 来源类别

1. 监管文件、上市文件、平台透明度报告和产品规则；
2. 方法公开的独立调查、监管测量和学术研究；
3. 第三方流量、广告受众、App 测量和行业数据库；
4. 媒体转述、负责人公开发言、案例和从业者观察。

来源类别不直接决定可信度。例如平台广告工具是第一方数据，但广告可触达人数不能替代 MAU。

### 7.2 可信度标签

- **高可信**：指标定义明确、方法公开、可复核；
- **可参考**：来源可靠，但地域、样本、方法或可比性有限；
- **有争议**：多个可信来源给出明显冲突结果；
- **仅作线索**：无法独立验证，不进入核心结论。

可信度综合考虑直接性、方法透明度、样本、时效性和跨平台可比性。

### 7.3 冲突处理

- 不对冲突数字求平均；
- 并列展示来源、值和定义；
- 合理区间必须写明形成规则；
- 摘要选择最适合问题的口径，并在标签中说明；
- 只有单位、地域、统计期和定义可比的数据才能进入排行榜；
- 口径改变时断开历史趋势。

## 8. 首轮检索范围

实施阶段需覆盖并交叉核验下列来源族群。清单是检索下限，不是数据事实清单。

### 8.1 X 一手与监管来源

- [X Transparency Center：DSA Transparency Report](https://transparency.x.com/en/reports/dsa-transparency-report)
- [X Transparency Center：AMARS in the EU](https://transparency.x.com/en/reports/amars-in-the-eu)
- [X Creator Revenue Sharing](https://help.x.com/en/using-x/creator-revenue-sharing)
- [X Creator Subscriptions](https://help.x.com/en/using-x/subscriptions-creator)
- [X Premium](https://help.x.com/en/using-x/x-premium)
- [X Organic Best Practices](https://business.x.com/en/basics/organic-best-practices)
- [X Creative Best Practices](https://business.x.com/en/advertising/creative-best-practices)
- [X Recommendation Algorithm historical repository](https://github.com/twitter/the-algorithm)
- 欧盟委员会 DSA 资料、决定和透明度数据库；
- 各地监管、法院、议会或政府发布的 X 平台材料。

### 8.2 独立测量与用户研究

- [Pew Research Center：Social Media Fact Sheet](https://www.pewresearch.org/internet/fact-sheet/social-media/)
- [Pew：How X users view and experience the platform](https://www.pewresearch.org/internet/2024/06/12/how-x-users-view-experience-the-platform/)
- [Pew：News influencers on X](https://www.pewresearch.org/journalism/2024/11/18/news-influencers-on-x-formerly-twitter/)
- [Ofcom：Online Nation 2025](https://www.ofcom.org.uk/siteassets/resources/documents/research-and-data/online-research/online-nation/2025/online-nations-report-2025.pdf)
- DataReportal；
- Similarweb；
- Sensor Tower；
- GWI；
- eMarketer；
- 学术论文和可复现数据集。

### 8.3 比较平台一手来源

- Meta 财报及 Threads 官方公告；
- Reddit Investor Relations 和 SEC 文件；
- Microsoft 财报与 LinkedIn 官方公告；
- TikTok DSA 透明度报告；
- 微博财报、SEC 和港交所文件；
- 知乎财报、SEC 和港交所文件；
- 腾讯财报及微信公开材料；
- 小红书官方商业资料、官方发布和有方法说明的第三方测量；
- 即刻官方发布和有方法说明的第三方测量。

非上市平台数据不足时必须显示缺口，不能用未经验证的行业传言补成完整表格。

## 9. 技术架构

### 9.1 页面架构

- Next.js App Router 公开静态页面；
- 目标路由 `/x-platform-intelligence`；
- 复用现有站点型多维页面外壳；
- 服务端页面输出 metadata、结构化内容和初始数据；
- 客户端交互组件管理筛选、图表、URL、抽屉和导出；
- 不依赖 Node-only API，保持 Cloudflare Pages 兼容。

### 9.2 模块边界

- `Overview`：季度摘要；
- `ScaleTrends`：规模和趋势；
- `GeoExplorer`：国家与地区；
- `AudienceProfile`：画像；
- `ContentMechanics`：传播机制；
- `CreatorPlaybook`：经营建议；
- `PlatformMatrix`：跨平台差异；
- `RiskRegister`：风险；
- `EvidenceLedger`：证据账本。

组件只通过统一查询接口读取数据，不直接依赖原始数组结构。

### 9.3 数据资产

源代码中维护：

- `sources`；
- `observations`；
- `insights`；
- `comparisons`；
- `snapshots`。

首版不引入 D1。数据量、维护频率和公开属性不足以证明数据库的必要性；静态资产更容易审查、版本控制、回滚和构建。

## 10. 季度更新流程

1. 检索本季度的一手、监管、独立调查和第三方测量；
2. 更新来源访问状态；
3. 新增观测记录，不覆盖历史记录；
4. 建立或更新冲突组；
5. 标记过期数据和口径变化；
6. 更新季度摘要、差异矩阵和创作者建议；
7. 运行数据校验；
8. 运行构建和页面检查；
9. 发布，并保留上一季度 URL 状态可访问。

## 11. 异常与降级

- 无效筛选参数回退到默认值；
- 空筛选组合显示原因和可用范围；
- 失效来源保留标题、发布日期和失效标记；
- 单位、地域、周期或定义不同的记录禁止进入同一排名；
- 过期资料不进入默认摘要，但保留在历史证据账本；
- 图表错误时显示可读表格；
- CSV 导出只包含当前筛选和明确列名；
- 页面无 JavaScript 时仍显示核心结论、方法说明和来源。

## 12. 验收与测试

### 12.1 数据校验

- ID 唯一；
- 引用的来源、观测和快照存在；
- 日期合法且统计期不倒置；
- 精确值、区间和百分比满足各自约束；
- 单位与指标匹配；
- 比较项有依据；
- 核心摘要没有引用“仅作线索”数据；
- 冲突组至少包含两条有效记录；
- 来源 URL 和访问状态存在。

### 12.2 交互测试

- 单项和组合筛选；
- 清除筛选；
- URL 恢复和分享；
- 空状态；
- 证据抽屉；
- 季度切换；
- CSV 导出；
- 键盘操作和焦点管理。

### 12.3 页面验收

- 每个核心数字可追溯到原始来源和口径；
- 全球组和中文组均有可解释的重点差异；
- 手机和桌面均可完成筛选与溯源；
- 颜色不是表达高低或可信度的唯一方式；
- 首屏不依赖运行时 API；
- Cloudflare 静态构建通过；
- 页面登记到多维页面目录；
- SEO metadata、canonical 和社交分享信息完整。

## 13. 成功标准

一位不了解 X 的中文科技创作者应能在五分钟内回答：

1. X 的规模数字为什么互相冲突；
2. X 的核心用户、国家和使用动机是什么；
3. X 与 Threads、微博、知乎、小红书等平台的关键差异是什么；
4. 自己是否应该投入 X；
5. 如果投入，X 在多平台组合中承担什么角色；
6. 每个关键结论依据了哪些来源、统计期和口径。

如果页面只能展示大量数字，却不能回答以上问题，则不算完成。
