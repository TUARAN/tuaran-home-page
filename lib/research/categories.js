// 分类元数据：服务端 loader 和客户端筛选器共用的单一真理源。
// 这里**不能**导入任何 node-only 模块（fs / crypto / path），否则会污染 client bundle。
// 加 / 改 / 删分类只动这一个文件。

export const RESEARCH_CATEGORIES = ['companies', 'topics', 'people']

export const CATEGORY_META = {
  companies: { label: '公司观察', short: '公司' },
  topics: { label: '主题', short: '主题' },
  people: { label: '人物', short: '人物' },
}

// 面向读者的内容形态。内部仍沿用 research 目录和路由，避免破坏旧链接；
// 前台用内容形态表达作者的实际工作，而不是把所有长文统称为“调研”。
export const CONTENT_TYPES = ['opinion', 'analysis', 'practice', 'guide', 'fact_check', 'profile', 'archive', 'research']

export const CONTENT_TYPE_META = {
  opinion: { label: '观点' },
  analysis: { label: '分析' },
  practice: { label: '实践' },
  guide: { label: '指南' },
  fact_check: { label: '事实核验' },
  profile: { label: '观察' },
  archive: { label: '资料' },
  research: { label: '研究' },
}

export function inferContentType({ category, topicType, hasAssessment = false } = {}) {
  if (hasAssessment) return 'practice'
  if (category === 'companies' || category === 'people') return 'profile'
  if (topicType === 'thesis' || topicType === 'writing') return 'opinion'
  if (topicType === 'parenting') return 'guide'
  if (topicType === 'tech' || topicType === 'product') return 'analysis'
  if (topicType === 'industry' || topicType === 'market' || topicType === 'workplace') return 'analysis'
  return 'analysis'
}

// 公司观察二级分类（frontmatter: company_type）
export const COMPANY_TYPES = [
  'developer_ecosystem',
  'developer_community',
  'content_community',
  'enterprise_software',
  'cloud_communications',
  'new_energy',
  'devtools',
  'knowledge_paywall_solo',
  'logistics',
]
export const COMPANY_TYPE_META = {
  developer_ecosystem: { label: '开发者生态', tone: 'blue' },
  developer_community: { label: '开发者社区', tone: 'blue' },
  content_community: { label: '内容社区', tone: 'rose' },
  enterprise_software: { label: '企业软件', tone: 'emerald' },
  cloud_communications: { label: '云通信', tone: 'violet' },
  new_energy: { label: '新能源', tone: 'amber' },
  devtools: { label: '开发工具', tone: 'slate' },
  knowledge_paywall_solo: { label: '知识付费个体', tone: 'stone' },
  logistics: { label: '物流', tone: 'sky' },
}

// 主题二级分类（frontmatter: topic_type）
export const TOPIC_TYPES = ['industry', 'tech', 'product', 'market', 'parenting', 'thesis', 'writing', 'workplace']
export const TOPIC_TYPE_META = {
  industry: { label: '行业', tone: 'sky' },
  tech: { label: '技术', tone: 'violet' },
  product: { label: '产品', tone: 'emerald' },
  market: { label: '市场', tone: 'amber' },
  parenting: { label: '育儿', tone: 'rose' },
  thesis: { label: '观点', tone: 'rose' },
  writing: { label: '写作', tone: 'violet' },
  workplace: { label: '职场', tone: 'stone' },
}

// 给前端筛选器用的 defs。"全部"项排在首位，其余按顺序展开。
export function getTopicTypeFilters() {
  return [
    { key: 'all', label: '全部主题' },
    ...TOPIC_TYPES.map((key) => ({ key, label: TOPIC_TYPE_META[key].label })),
  ]
}

export function getCompanyTypeFilters() {
  return [
    { key: 'all', label: '全部公司' },
    ...COMPANY_TYPES.map((key) => ({ key, label: COMPANY_TYPE_META[key].label })),
  ]
}

// 人物观察二级分类（frontmatter: people_type）
export const PEOPLE_TYPES = ['entrepreneur', 'creator', 'scholar', 'historical']
export const PEOPLE_TYPE_META = {
  entrepreneur: { label: '企业家', tone: 'amber' },
  creator: { label: '创作者', tone: 'rose' },
  scholar: { label: '学者科技', tone: 'sky' },
  historical: { label: '历史人物', tone: 'stone' },
}

export function getPeopleTypeFilters() {
  return [
    { key: 'all', label: '全部人物' },
    ...PEOPLE_TYPES.map((key) => ({ key, label: PEOPLE_TYPE_META[key].label })),
  ]
}
