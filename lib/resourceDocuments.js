import fs from 'fs'
import path from 'path'

/** 站内长文资料元数据，供资源页与知识库索引共用。 */
export const RESOURCE_DOCUMENTS = {
  'shen-zhi-ding-nei': {
    slug: 'shen-zhi-ding-nei',
    title: '《置身钉内》',
    pageTitle: '《置身钉内》全文原文：钉钉 ONE 项目离职复盘长文',
    subtitle: '滕雅辛（幽素）· 2026 年 6 月 · 约 7.5 万字',
    date: '2026-06-05',
    author: '滕雅辛（幽素）',
    wordCount: '约 7.5 万字',
    markdownFile: 'content/resources/shen-zhi-ding-nei.md',
    gistUrl: 'https://gist.github.com/horaceho/4be04df73b1f1ede458ad5cec2b94132',
    gistRawUrl:
      'https://gist.githubusercontent.com/horaceho/4be04df73b1f1ede458ad5cec2b94132/raw/%E7%BD%AE%E8%BA%AB%E9%92%89%E5%86%85.md',
    researchHref: '/articles/research/topics/shen-zhi-ding-nei-workplace-observation',
    summary:
      '2026 年 6 月阿里内网流传的《置身钉内》：钉钉 AI 产品经理以 ONE 项目八卷结构，记录 AI 办公产品从立项、冲高到收缩的全过程，并延伸到已读压力、组织节奏与职场权力结构。',
    tags: ['《置身钉内》', '钉钉', '职场', '组织观察', 'B端产品', '原文存档'],
  },
  'shen-zhi-ding-wai': {
    slug: 'shen-zhi-ding-wai',
    title: '《置身钉外》',
    pageTitle: '《置身钉外》全文原文：钉钉副总裁马锐拉离职回应长文',
    subtitle: '马锐拉 · 2026 年 6 月 · 公开版约 2600 字（自述原稿近两万字）',
    date: '2026-06-08',
    author: '马锐拉',
    wordCount: '约 2600 字',
    markdownFile: 'content/resources/shen-zhi-ding-wai.md',
    sourceLabel: '马锐拉个人公众号（媒体转载）',
    sourceUrl: 'https://finance.sina.com.cn/tech/roll/2026-06-09/doc-iniaukpc1974557.shtml',
    researchHref: '/articles/research/topics/shen-zhi-ding-nei-workplace-observation',
    summary:
      '《置身钉内》在阿里内外刷屏后，已于 2026 年 5 月 15 日办完离职手续的钉钉副总裁马锐拉在个人公众号发布《置身钉外》：从管理者一侧回应高压节奏、长期熬夜与「不能说」的复杂感受，并表达对钉钉的祝福。',
    tags: ['《置身钉外》', '钉钉', '职场', '组织观察', '离职长文', '原文存档'],
  },
  'shen-zhi-tuan-nei': {
    slug: 'shen-zhi-tuan-nei',
    title: '《置身团内》',
    pageTitle: '《置身团内》文字版全文：美团到餐基层产品长文存档',
    subtitle: '美团到餐基层产品员工 · 2026 年 6 月 · 约 2200 字',
    date: '2026-06-23',
    author: '美团到餐基层产品员工（脉脉匿名）',
    wordCount: '约 2200 字',
    markdownFile: 'content/resources/shen-zhi-tuan-nei.md',
    sourceLabel: '新浪科技 / 快科技转载页',
    sourceUrl: 'https://finance.sina.com.cn/tech/discovery/2026-06-23/doc-iniekeev9770960.shtml',
    researchHref: '/articles/research/topics/shen-zhi-tuan-nei-meituan-workplace-observation',
    summary:
      '2026 年 6 月 23 日，一名自称美团到餐基层产品员工在脉脉发布《置身团内》：谈美团组织路径依赖、本地生活数据资产化与 AI 落地问题。',
    tags: ['《置身团内》', '美团', '美团到餐', '职场', '组织观察', '原文存档'],
  },
  'shen-zhi-mi-nei': {
    slug: 'shen-zhi-mi-nei',
    title: '《置身米内》',
    pageTitle: '《置身米内》文字版全文：小米校招员工长文 OCR 存档',
    subtitle: '小米校招员工（内网匿名）· 2026 年 6 月 · 约 4000 字',
    date: '2026-06-24',
    author: '小米校招员工（内网匿名）',
    wordCount: '约 4000 字',
    markdownFile: 'content/resources/shen-zhi-mi-nei.md',
    sourceLabel: '用户提供长图 OCR，网易 / DoNews 等媒体转述交叉校对',
    sourceUrl: '',
    researchHref: '/articles/research/topics/shen-zhi-mi-nei-xiaomi-workplace-observation',
    summary:
      '2026 年 6 月 24 日前后，一名自称小米校招员工在内网飞书文档发布《置身米内》：把雷军类比项羽，谈小米高端化、创始人依赖、薪酬竞争力与校招人才流失。本站据用户提供长图 OCR 整理为文字版。',
    tags: ['《置身米内》', '小米', '雷军', '职场', '组织观察', '创始人依赖', '原文存档'],
  },
  'shen-zhi-dou-nei': {
    slug: 'shen-zhi-dou-nei',
    title: '《置身 dou 内 / 置身抖内》',
    pageTitle: '《置身 dou 内 / 置身抖内》：字节同事圈工期 review 与 AI CLI 短帖存档',
    subtitle: '脉脉字节跳动同事圈 · 2026 年 6 月 · 短帖',
    date: '2026-06-25',
    author: '脉脉字节跳动同事圈用户',
    wordCount: '短帖 + 评论摘录',
    markdownFile: 'content/resources/shen-zhi-dou-nei.md',
    sourceLabel: '脉脉原帖',
    sourceUrl: 'https://maimai.cn/community/gossip-detail/37082605?gid=37082605&egid=7db90638dcf947b8aa29bc07f299b5e8',
    researchHref: '/articles/research/topics/shen-zhi-dou-nei-bytedance-workplace-observation',
    summary:
      '2026 年 6 月 25 日，脉脉字节跳动同事圈出现“置身 dou 内”短帖：大于 5 天的需求要被 review，小于等于 3 天的需求强制用内部 AI CLI；评论区把它解读为“需求排 4 天”、化整为零和古德哈特定律案例。',
    tags: ['《置身 dou 内》', '《置身抖内》', '字节跳动', '抖音', '职场', 'AI CLI', '组织观察'],
  },
  'cnt-whitepaper': {
    slug: 'cnt-whitepaper',
    title: 'CNT内容生态代币经济白皮书',
    pageTitle: 'CNT内容生态代币经济白皮书（正式完整版）',
    subtitle: 'TUARAN · 2026 年 · 正式完整版',
    date: '2026-09-21',
    author: 'TUARAN',
    wordCount: '约 4,600 字',
    markdownFile: 'content/resources/cnt-whitepaper.md',
    downloadHref: '/resources/cnt-whitepaper/CNT-content-token-economy-whitepaper.md',
    downloadName: 'CNT内容生态代币经济白皮书.md',
    researchHref: '/articles/research/topics/2aran-onchain-content-site',
    summary:
      'CNT（Content Token）内容生态代币经济白皮书正式完整版：总量 10 亿封顶、双因子衰减挖矿、质量加权贡献分、四层反女巫、销毁与持币分红、DAO 治理，以及 24 个智能合约模块清单。',
    tags: ['CNT', 'Content Token', '白皮书', '内容上链', '代币经济', 'DAO', '行为挖矿'],
  },
  'ethereum-whitepaper': {
    slug: 'ethereum-whitepaper',
    title: '以太坊白皮书',
    pageTitle: '以太坊白皮书中文全文｜Ethereum White Paper（Vitalik Buterin, 2014）',
    subtitle: 'Vitalik Buterin · 2014 年 · 约 2.1 万字',
    date: '2014-12-01',
    author: 'Vitalik Buterin',
    wordCount: '约 2.1 万字',
    markdownFile: 'content/resources/ethereum-whitepaper.md',
    sourceLabel: 'ethereum.org 中文白皮书',
    sourceUrl: 'https://ethereum.org/zh/whitepaper/',
    englishSourceUrl: 'https://ethereum.org/en/whitepaper/',
    pdfHref: '/resources/ethereum-whitepaper/Ethereum_Whitepaper_Buterin_2014.pdf',
    researchHref: '/articles/research/topics/crypto-ethereum',
    summary:
      'Vitalik Buterin 2014 年发表的以太坊白皮书简体中文全文：用图灵完备区块链解释账户、Gas、智能合约和去中心化应用。站内可跳转章节，并保留 ethereum.org 原文与 2014 年 12 月 PDF。',
    tags: ['以太坊白皮书', 'Ethereum White Paper', 'Vitalik Buterin', '智能合约', '去中心化应用', 'ETH', 'EVM'],
  },
  'jianguo-fanglye': {
    slug: 'jianguo-fanglye',
    title: '《建国方略》',
    pageTitle: '《建国方略》全文原文：孙文学说、实业计划、民权初步',
    subtitle: '孙文（孙中山）· 1917–1921 年 · 约 20.1 万字',
    date: '1921-10-10',
    author: '孙文（孙中山）',
    wordCount: '约 20.1 万字',
    markdownFile: 'content/resources/jianguo-fanglye.md',
    sourceLabel: '维基文库公有领域整理本',
    sourceUrl: 'https://zh.wikisource.org/zh-hans/%E5%BB%BA%E5%9B%BD%E6%96%B9%E7%95%A5',
    pdfHref: '/resources/jianguo-fanglye/NLC416-01jh003731-18241-jianguo-fanglye.pdf',
    researchHref: '/articles/research/topics/jianguo-fanglye',
    summary:
      '孙文 1917–1921 年写成的《建国方略》简体全文：心理建设《孙文学说》、物质建设《实业计划》、社会建设《民权初步》。站内可跳转三卷阅读；扫描件来自中国国家图书馆数字资源 NLC416-01jh003731-18241。',
    tags: ['建国方略', '孙中山', '孙文', '孙文学说', '实业计划', '民权初步', '知难行易', '原文存档'],
  },
}

export function getResourceDocument(slug) {
  return RESOURCE_DOCUMENTS[slug] || null
}

export function loadResourceMarkdown(slug) {
  const doc = getResourceDocument(slug)
  if (!doc?.markdownFile) return ''
  const filePath = path.join(process.cwd(), doc.markdownFile)
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch {
    return ''
  }
}
