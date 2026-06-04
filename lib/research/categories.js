// 分类元数据：服务端 loader 和客户端筛选器共用的单一真理源。
// 这里**不能**导入任何 node-only 模块（fs / crypto / path），否则会污染 client bundle。
// 加 / 改 / 删分类只动这一个文件。

export const RESEARCH_CATEGORIES = ['companies', 'topics']

export const CATEGORY_META = {
  companies: { label: '公司调研', short: '公司' },
  topics: { label: '事项调研', short: '事项' },
}

// 公司调研二级分类（frontmatter: company_type）
export const COMPANY_TYPES = [
  'developer_ecosystem',
  'content_community',
  'enterprise_software',
  'cloud_communications',
  'new_energy',
  'devtools',
]
export const COMPANY_TYPE_META = {
  developer_ecosystem: { label: '开发者生态', tone: 'blue' },
  content_community: { label: '内容社区', tone: 'rose' },
  enterprise_software: { label: '企业软件', tone: 'emerald' },
  cloud_communications: { label: '云通信', tone: 'violet' },
  new_energy: { label: '新能源', tone: 'amber' },
  devtools: { label: '开发工具', tone: 'slate' },
}

// 事项调研二级分类（frontmatter: topic_type）
export const TOPIC_TYPES = ['industry', 'tech', 'product', 'market', 'thesis', 'writing']
export const TOPIC_TYPE_META = {
  industry: { label: '行业', tone: 'sky' },
  tech: { label: '技术', tone: 'violet' },
  product: { label: '产品', tone: 'emerald' },
  market: { label: '市场', tone: 'amber' },
  thesis: { label: '观点', tone: 'rose' },
  writing: { label: '写作调研', tone: 'violet' },
}

// 给前端筛选器用的 defs。"全部"项排在首位，其余按顺序展开。
export function getTopicTypeFilters() {
  return [
    { key: 'all', label: '全部事项' },
    ...TOPIC_TYPES.map((key) => ({ key, label: TOPIC_TYPE_META[key].label })),
  ]
}

export function getCompanyTypeFilters() {
  return [
    { key: 'all', label: '全部公司' },
    ...COMPANY_TYPES.map((key) => ({ key, label: COMPANY_TYPE_META[key].label })),
  ]
}
