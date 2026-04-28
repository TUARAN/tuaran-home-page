// 站点上下文按主题分片，仅在用户问题命中关键词时注入对应分片，
// 避免每次推理都吞下完整 system prompt 拖慢首 token。

const IDENTITY_CHUNK = `tuaran 的身份：
- 程序员、项目经理
- 技术博主、出版作者
- 茉莉奶爸
- 广州矩联科技创始人
- 也叫涂阿燃 / 掘金安东尼 / 安东尼404`

const SITE_CHUNK = `tuaran.me 是“涂阿燃（tuaran）的网络日志”，也是个人项目与内容导航站。
长期内容方向：前端工程化、SEO、AI 智能体、创作者成长、个人项目与阅读沉淀。`

const PROJECTS_CHUNK = `站内代表性项目：
- 博主联盟 (blogger-alliance.cn)：开发者博主联盟平台
- 前端下一步 Frontend Next (frontendnext.com)：帮前端在 AI 时代做转型决策
- I Am Vibe Coder (iamvibecoder.cn)：AI 编程实践与实验场
- PublishLab (publishlab.cc)：AI 写作与数字出版实验
- Frontend 2 AI Agent (frontend2aiagent.com)：帮助前端向 AI Agent 工程转型
- MatrixLink (matrixlink.tech)：广州矩联科技公司官网`

const CONTEXT_CHUNKS = [
  {
    keywords: [
      'tuaran',
      '阿燃',
      '涂阿燃',
      '掘金安东尼',
      '安东尼',
      '茉莉奶爸',
      '矩联',
      '你是谁',
      '作者',
      '博主',
      '创始人',
    ],
    text: IDENTITY_CHUNK,
  },
  {
    keywords: [
      '网站',
      '主页',
      '本站',
      '这个站',
      '这个网站',
      'tuaran.me',
      '2aran',
      '日志',
      '简介',
      '定位',
      'seo',
      'ai 智能体',
      '创作者',
    ],
    text: SITE_CHUNK,
  },
  {
    keywords: [
      '项目',
      '矩阵',
      '产品',
      '作品',
      '博主联盟',
      'blogger',
      'bzlm',
      '前端周刊',
      '前端下一步',
      'frontend next',
      'frontendnext',
      'frontendweekly',
      'qdzk',
      'i am vibe coder',
      'vibe coder',
      'iamvibecoder',
      'publishlab',
      'frontend 2 ai agent',
      'frontend2aiagent',
      'matrixlink',
      '矩联',
    ],
    text: PROJECTS_CHUNK,
  },
]

function normalize(text) {
  return String(text || '').toLowerCase()
}

// 根据用户最后一条消息内容，返回需要注入的站点上下文分片。
// 没命中任何关键词时返回空字符串 —— runtime 据此跳过整个 system prompt。
export function getSiteContextFor(query) {
  const q = normalize(query)
  if (!q) return ''
  const matched = []
  for (const chunk of CONTEXT_CHUNKS) {
    if (chunk.keywords.some((kw) => q.includes(normalize(kw)))) {
      matched.push(chunk.text)
    }
  }
  return matched.join('\n\n')
}

// 用于设置/调试页展示的全量预览。
export const SITE_CONTEXT_PREVIEW = [IDENTITY_CHUNK, SITE_CHUNK, PROJECTS_CHUNK].join('\n\n')
