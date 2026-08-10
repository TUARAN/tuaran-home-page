import { SUBJECT_META } from './contentTaxonomy.js'

export const SUBJECT_GOVERNANCE = {
  ai_dev: {
    definition: '模型、智能体、AI 编程、算法与算力，以及它们在开发中的应用。',
    includes: ['大模型与推理', 'Agent 与自动化', 'AI 编程与数据算法'],
    excludes: ['普通 Web 工程', '仅讨论创作经营的 AI 工具'],
    aliases: ['人工智能', 'AI 工程'],
  },
  web_cloud: {
    definition: 'Web、云平台、网络、身份安全、系统架构与工程交付。',
    includes: ['前后端工程', 'Cloudflare 与云服务', '架构、网络与安全'],
    excludes: ['模型能力本身', '不含工程细节的产品体验'],
    aliases: ['工程化', '云与架构'],
  },
  product_experience: {
    definition: '产品设计、用户需求、交互体验、功能取舍与产品方法。',
    includes: ['用户体验', '产品策略', '功能与需求分析'],
    excludes: ['纯市场规模研究', '具体开发实现'],
    aliases: ['产品', '用户体验'],
  },
  business_market: {
    definition: '商业模式、市场、行业、投资、增长、渠道与公司经营。',
    includes: ['行业与市场', '商业化与增长', '投资与财务'],
    excludes: ['单一公司的完整档案', '纯产品使用体验'],
    aliases: ['商业', '市场与行业'],
  },
  company_research: {
    definition: '以一家公司或组织为主要研究对象的档案、沿革与经营分析。',
    includes: ['公司档案', '组织沿革', '公司经营与竞争位置'],
    excludes: ['跨公司的行业研究', '以个人为核心的人物研究'],
    aliases: ['公司观察', '企业调研'],
  },
  people_profiles: {
    definition: '以具体人物或人物群体为核心的经历、思想、选择与影响观察。',
    includes: ['人物档案', '生平与思想', '人物群像'],
    excludes: ['只把人物当作案例的行业分析', '公司组织史'],
    aliases: ['人物', '人物研究'],
  },
  content_creation: {
    definition: '写作、媒体、平台分发、创作者经营、视觉与内容生产方法。',
    includes: ['写作与编辑', '创作者平台经营', '内容分发与视觉生产'],
    excludes: ['一般职场沟通', '只讨论底层开发技术的工具'],
    aliases: ['创作', '内容与媒体'],
  },
  workplace_org: {
    definition: '职业发展、招聘、协作、管理、组织制度与工作关系。',
    includes: ['求职与招聘', '团队协作与管理', '组织权力与制度'],
    excludes: ['公司商业模式', '一般家庭关系'],
    aliases: ['职场', '组织管理'],
  },
  humanities_history: {
    definition: '历史、政治、哲学、文学、艺术、制度与人类知识成就。',
    includes: ['历史与制度', '思想与文学', '文化艺术与知识史'],
    excludes: ['当代公司的经营档案', '家庭日常经验'],
    aliases: ['人文', '历史与思想'],
  },
  life_family: {
    definition: '家庭、育儿、健康、关系、居住与个人日常生活。',
    includes: ['家庭与育儿', '健康与饮食', '居住与个人生活'],
    excludes: ['职业组织问题', '宏观公共政策分析'],
    aliases: ['生活', '家庭与健康'],
  },
}

export const TAXONOMY_DIMENSIONS = [
  { id: 'contentKind', label: '内容类型', rule: '单选', description: '内容采用什么表达和使用形态，例如分析、实践、互动、指南或资源。' },
  { id: 'subjects', label: '内容主题', rule: '唯一单选', description: '内容最主要讨论什么；每条内容只保留一个主题。' },
  { id: 'entityType', label: '研究对象', rule: '可选单选', description: '主要对象是公司、人物、产品、技术还是行业。' },
  { id: 'delivery', label: '交付方式', rule: '单选', description: '读者通过阅读、交互、下载、订阅或外部访问来使用内容。' },
  { id: 'series', label: '固定系列', rule: '可选单选', description: '只用于有稳定名称并持续更新的系列。' },
]

export const TAXONOMY_GOVERNANCE_RULES = [
  '稳定 ID 不随展示文案变化；改名只修改首选标签，并保留旧称作为别名。',
  '人工填写的唯一 subjects 值优先于关键词推断；推断只服务于存量内容迁移。',
  '每条内容只保留一个最符合读者检索意图的主题，其余概念继续作为标签。',
  '主题、对象、交付方式和编辑状态分别管理，避免一个标签承担多种含义。',
  '新增主题前检查边界、样本和持续供给；内容稀疏时优先并入上位主题。',
  '每次调整都抽查正例、反例和边界内容，并运行全量分类审计与构建。',
]

export const SUBJECT_GOVERNANCE_LIST = Object.entries(SUBJECT_META).map(([id, meta]) => ({
  id,
  label: meta.label,
  status: 'active',
  ...SUBJECT_GOVERNANCE[id],
}))
