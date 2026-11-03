export const RESEARCH_METHOD_NAV = [
  {
    id: 'writing',
    label: '写法',
    items: [
      {
        id: 'rules',
        kind: 'embed',
        view: 'rules',
        title: '写作规范',
        summary: '所有调研共同遵守的禁语和写法底线。',
      },
      {
        id: 'styles',
        kind: 'embed',
        view: 'styles',
        title: '调研风格',
        summary: '默认分析风格，以及人味、干练、周刊解释、投研备忘等可选风格。',
      },
    ],
  },
  {
    id: 'subjects',
    label: '对象方法',
    items: [
      {
        id: 'person',
        kind: 'method',
        title: '人物观察',
        version: '1',
        updated: '2026-11-03',
        styleId: 'default-research',
        sourcePath: 'research/templates/person-research.md',
        outputPath: 'research/people/YYYY-MM-DD-<slug>.md',
        summary: '输入可以只有一个姓名。先按打开的材料分行，再决定哪些记录是同一个人。公开账号要查，显示名相同不自动合并。',
        steps: [
          '名字是唯一必填项。地域、单位、证件号和要做的决定没给就留空。',
          '智能体只填记录表：一行一条已经打开的材料。搜索摘要和打不开的页面放进线索。',
          '合并要有同一单位、同一证件号，或同一篇材料写了两个场合。只有姓名相同就分开。',
          '重名时展开已打开材料最多的三组。知名度不参与排序，成就只抄该组原文里有的职务和行动。',
          '评价写四行：分成几条、证据、写不上的部分、什么新材料会改变分组。',
        ],
        platforms: [
          '国家企业信用信息公示系统',
          '巨潮资讯 / 港交所披露易 / SEC EDGAR',
          '政府与机构公示',
          '中国执行信息公开网',
          '中国裁判文书网',
          'ORCID 与机构名录',
          '知乎、今日头条、抖音、微信公众号',
          '微博、视频号、小红书、B 站',
        ],
        prompt: `你正在做人物调研。输入只有一个名字：{{NAME}}。
地域、单位、证件号、要回答的决定，用户没给就留空，不要补。

不要先写生平。不要把同名收成一个人。不要用记忆补出生日期、亲属、现任职务或实际控制。

按这个顺序打开页面。打不开的放进「线索」，不放进记录表。
1. 国家企业信用信息公示系统：法定代表人、股东、主要人员，以及页面上的日期
2. 若指向上市公司：巨潮资讯、港交所披露易或 SEC EDGAR 里对应年份的年报、任命或辞任公告
3. 政府、学校、医院、社区等机构网站上的公示和活动全文
4. 中国执行信息公开网：被执行人、失信、限高。只有姓名时列出全部同名；证件号对不上的不写入此人
5. 中国裁判文书网：只摘已经打开的全文里的法院、案号、当事人身份和裁判日期
6. ORCID、期刊页面、机构教师名录
7. 公开账号：知乎、今日头条、抖音、微信公众号、微博、视频号、小红书、B 站。公众号先用微信搜一搜或搜狗微信定位，再打开文章全文。只摘已经打开的主页或内容：账号名、平台展示的认证文案、发布日期、原话或标题、链接。同名账号全部列出。粉丝数、点赞、播放量不写入成就。打不开或只有搜索标题的，放进线索
8. 搜索引擎、企查查、天眼查只用来找下一页

输出固定为四块，不要改成通顺传记。

## 记录
每一行只属于一条已经打开的材料。

| 编号 | 日期 | 出处 | 原文称呼 | 这个人做的动作 | 单位 | 同页其他人 | 链接 | 页面已打开 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## 线索
没打开的标题、搜索摘要、商业站卡片，以及记得但没有链接的说法。每条注明为什么没进记录表。

## 分组
把记录编号分成若干人。只有至少满足一项才可以合并：同一单位、同一证件号或登记号、同一篇材料写了两个场合。社交账号与登记、报道合并，也要满足这些条件；仅显示名相同就单独成组。每组写明依据的是哪些编号；依据不足就分开。这是分组提议，不是已经查实的身份。

## 评价
分组写完后再写。已打开材料最多的三组各自展开；不足三组就全部展开。每组只写：原文称呼、单位、该组记录里出现过的行动、最近日期、链接。不要按知名度重排，不要补成就、代表作或社会评价。其余组各留一行：编号、单位、出处，不展开。

然后用四行收这一次调研：
- 结论：这个名字分成几条；展开的是哪三条（或更少）；跟到哪一天
- 证据：每条展开记录的原文称呼、动作和链接
- 写不上的部分：没有材料支持的任期、亲属、实际控制、知名度排名，写明写不上
- 重测：哪一份新公示、新活动稿、新的执行记录或新打开的账号原文会改变分组或最近状态

没有新的任免或活动全文，不要把最近一次称呼写成现任。法定代表人、控股股东、实际控制人分三列，材料没出现的留空。用户若指出要找的是材料较少的那一组，用该组替换展开名单里的最后一名。`,
      },
      {
        id: 'company',
        kind: 'method',
        title: '公司观察',
        version: '现行风格',
        updated: '随默认分析风格',
        styleId: 'default-research',
        sourcePath: '.claude/commands/research-company.md',
        outputPath: 'research/companies/YYYY-MM-DD-<slug>.md',
        summary: '手工公司观察跟着当前生效的调研风格写。上市公司的定时起草走下面的上市公司模板，不混用这一条。',
        steps: [
          '先读调研风格里 status 为 active 的版本，再动笔。',
          'slug 用域名主干或公司英文名，日期用当天。同 slug 已存在就更新，不另起一篇。',
          '正文按风格骨架：先给结论、事实层、结构分析、外部研判、来源与持续验证。',
          '公司归属写到最终控制人。国资写明层级和具体履职机构。',
          '外部研判给出跟进、观望或不跟进。写完不自动提交。',
        ],
        sections: ['先给结论', '事实层', '结构分析', '外部研判', '信息来源与持续验证'],
      },
      {
        id: 'a-share',
        kind: 'method',
        title: '上市公司观察',
        version: '5',
        updated: '2026-09-18',
        styleId: 'default-research',
        sourcePath: 'research/templates/a-share-company-research.md',
        outputPath: 'research/companies/YYYY-MM-DD-a-share-<code>.md',
        workbenchHref: '/admin/a-share-research',
        workbenchLabel: 'A 股研究',
        summary: '定时任务按这份模板起草一家 A 股公司。升级模板时递增版本号；已经生成的稿件保留自己的 research_template_version。',
        steps: [
          '自动化读取本模板和当前生效的调研风格，再检索一手资料。',
          '控制权、财报数字和来源写严。真正卡住判断的一两个变量写透，其余收短。',
          '输出 frontmatter 写入 research_template: a-share-company-research 和 research_template_version: 5。',
          '草稿进入 A 股研究工作台复核。review_ready 保持 false，不自动提交。',
        ],
        sections: [
          '先给结论',
          '公司身份与上市信息',
          '业务结构与行业位置',
          '财务质量',
          '治理与资本结构',
          '估值与市场预期',
          '催化因素与主要风险',
          '外部研判',
          '信息来源与持续验证',
        ],
      },
      {
        id: 'crypto',
        kind: 'method',
        title: '加密资产观察',
        version: '3',
        updated: '2026-09-18',
        styleId: 'default-research',
        sourcePath: 'research/templates/crypto-asset-research.md',
        outputPath: 'research/topics/YYYY-MM-DD-crypto-<slug>.md',
        workbenchHref: '/admin/crypto-research',
        workbenchLabel: '加密调研',
        summary: '每天按 CoinGecko 美元市值选择一个尚未完成的币种。排名、价格和供给只代表资料截点。',
        steps: [
          '自动化读取本模板和当前生效的调研风格。',
          '先写已经能确认的机制、用途和风险。关键数字配一手来源。',
          '输出 frontmatter 写入 research_template: crypto-asset-research 和 research_template_version: 3。',
          '草稿进入加密调研工作台复核，不提供投资建议。',
        ],
        sections: [
          '先给结论',
          '起源、背景与发展时间线',
          '技术机制与网络结构',
          '用途、生态与价值来源',
          '代币经济与供给结构',
          '市场位置与历史表现',
          '治理、安全与关键依赖',
          '监管与合规环境',
          '催化因素、主要风险与外部研判',
          '信息来源与持续验证',
        ],
      },
    ],
  },
]

export function listResearchMethodItems() {
  return RESEARCH_METHOD_NAV.flatMap((group) => group.items)
}

export function getResearchMethod(id) {
  return listResearchMethodItems().find((item) => item.id === id) || null
}
