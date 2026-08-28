import { SECONDARY_SITES } from './secondarySites.js'
import { DOMAIN_REGISTRY } from './domainRegistry.js'
import { ACCOUNT_SUBSITE_ORIGINS } from './subsiteOrigins.js'

export const SITE_STATUSES = { pending: '待上线', active: '运营中', paused: '暂停', legacy: '兼容保留', archived: '已归档' }
export const SITE_AUDIENCES = { public: '公开访问', private: '内部 / 受控' }
export const RELATION_TYPES = {
  parent: '归属于', account: '账号由其提供', points: '燃币由其提供',
  deployment: '复用其部署', content: '内容来自', dependency: '依赖服务',
}
export const RELATION_STATUSES = { planned: '待接入', active: '已接入', disabled: '已停用' }

export function createSiteRegistry() {
  const main = DOMAIN_REGISTRY.find((item) => item.id === 'main')
  // The admin inventory includes internal services and legacy domains, not just public sites.
  const catalog = [...SECONDARY_SITES, ...DOMAIN_REGISTRY
    .filter((record) => record.id !== 'main' && !SECONDARY_SITES.some((site) => site.id === record.id))
    .map((record) => ({ id: record.id, domain: record.domain, label: record.role, category: record.audience === 'private' ? '内部服务' : '待分类', desc: record.role, deploymentDetail: record.statusDetail }))]
  const sites = [{
    id: 'main', label: 'TUARAN 主站', domain: main.domain, category: '主站',
    project: main.project, platform: main.platform, status: 'active', audience: 'public',
    description: main.role, repository: '', notes: '主站作为关系锚点，资料只读。',
  }, ...catalog.map((site) => {
    const domain = DOMAIN_REGISTRY.find((item) => item.id === site.id)
    return {
      id: site.id, label: site.label, domain: site.domain, category: site.category,
      project: domain?.project || '', platform: domain?.platform || site.deployment,
      status: Object.hasOwn(SITE_STATUSES, domain?.status) ? domain.status : 'pending',
      audience: domain?.audience === 'private' ? 'private' : 'public',
      description: site.desc, repository: '', notes: site.deploymentDetail,
    }
  })]
  const relations = []
  function relate(source, type, status = 'active', note = '') {
    relations.push({ source, target: 'main', type, status, note })
  }
  for (const site of sites.filter((item) => item.id !== 'main')) {
    relate(site.id, 'parent')
    if (ACCOUNT_SUBSITE_ORIGINS.includes(`https://${site.domain}`)) {
      relate(site.id, 'account', 'active', '浏览器已验证继承主站登录身份；旧账号须由用户验证后关联。')
      relate(site.id, 'points', 'active', '浏览器已验证主站与两个子站余额一致，签到状态共用；不新增扣费。')
    }
  }
  if (sites.some((site) => site.id === 'rank')) relate('rank', 'deployment')
  if (sites.some((site) => site.id === 'workbuddy')) {
    relate('workbuddy', 'account', 'active', '子站服务端向主站验证身份。')
    relate('workbuddy', 'points', 'active', '共用燃币账本与资源权益。')
  }
  return { version: 1, revision: 0, sites, relations }
}

// Upgrade older saved inventories without overwriting edits or resurrecting removed relationships.
// This is read-time enrichment; the next explicit save persists it using the original raw CAS value.
export function includeRegisteredSites(current) {
  const defaults = createSiteRegistry()
  const next = structuredClone(current)
  const added = new Set()
  for (const site of defaults.sites) {
    if (next.sites.some((item) => item.id === site.id || item.domain === site.domain)) continue
    next.sites.push(site)
    added.add(site.id)
  }
  next.sites = next.sites.map((site) => ({
    ...site,
    audience: site.audience ?? defaults.sites.find((item) => item.id === site.id && item.domain === site.domain)?.audience ?? 'private',
  }))
  for (const edge of defaults.relations) {
    if (!added.has(edge.source) || next.relations.some((item) => relationKey(item) === relationKey(edge))) continue
    const target = next.sites.find((site) => site.id === edge.target)
    if (target) next.relations.push({ ...edge, status: target.status === 'archived' ? 'disabled' : edge.status })
  }
  return next
}

export class SiteRegistryError extends Error {
  constructor(message, status = 400) { super(message); this.status = status }
}

function requireValue(condition, message) {
  if (!condition) throw new SiteRegistryError(message)
}

function field(value, label, max, required = false) {
  requireValue(typeof value === 'string', `${label}必须是文本。`)
  const result = value.trim()
  requireValue(result.length <= max && (!required || result.length > 0), `${label}${required ? '不能为空，且' : ''}不能超过 ${max} 字。`)
  return result
}

export function normalizeSite(input) {
  requireValue(input && typeof input === 'object', '缺少站点资料。')
  const id = field(input.id, '站点标识', 48, true)
  requireValue(/^[a-z][a-z0-9-]*$/.test(id), '站点标识须以小写字母开头，只能包含小写字母、数字和连字符。')
  const domain = field(input.domain, '域名', 253, true).toLowerCase()
  requireValue(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+2aran\.com$/.test(domain), '请填写 2aran.com 下的完整子域名，不含协议、端口和路径。')
  requireValue(Object.hasOwn(SITE_STATUSES, input.status), '无效的站点状态。')
  const audience = input.audience ?? 'private'
  requireValue(Object.hasOwn(SITE_AUDIENCES, audience), '无效的访问范围。')
  const repository = field(input.repository ?? '', '代码仓库', 300)
  if (repository) {
    let url
    try { url = new URL(repository) } catch { throw new SiteRegistryError('代码仓库必须是 HTTPS 地址。') }
    requireValue(url.protocol === 'https:' && !url.username && !url.password, '代码仓库必须是无凭证的 HTTPS 地址。')
  }
  return {
    id, domain, status: input.status, audience, repository,
    label: field(input.label, '站点名称', 80, true),
    category: field(input.category ?? '', '分类', 60),
    project: field(input.project ?? '', '部署项目', 100),
    platform: field(input.platform ?? '', '部署平台', 120),
    description: field(input.description ?? '', '简介', 500),
    notes: field(input.notes ?? '', '备注', 2000),
  }
}

export function relationKey(relation) {
  return `${relation.source}:${relation.type}:${relation.target}`
}

function validateGraph(registry) {
  const sites = new Map(registry.sites.map((site) => [site.id, site]))
  for (const edge of registry.relations) {
    requireValue(sites.has(edge.source) && sites.has(edge.target), '关系两端必须是已登记站点。')
    requireValue(edge.source !== edge.target, '站点不能关联自身。')
    if (edge.status === 'active') {
      requireValue(sites.get(edge.source).status !== 'archived' && sites.get(edge.target).status !== 'archived', '归档前请停用该站点所有已接入关系。')
    }
  }
  for (const type of ['parent', 'dependency', 'deployment']) {
    const edges = registry.relations.filter((edge) => edge.type === type && edge.status !== 'disabled')
    if (type === 'parent') {
      requireValue(new Set(edges.map((edge) => edge.source)).size === edges.length, '每个站点只能有一个未停用的归属关系。')
      requireValue(edges.every((edge) => edge.source !== 'main'), '主站不能归属于二级站。')
    }
    const visiting = new Set()
    const visited = new Set()
    function visit(id) {
      requireValue(!visiting.has(id), `${RELATION_TYPES[type]}关系不能形成循环。`)
      if (visited.has(id)) return
      visiting.add(id)
      for (const edge of edges.filter((item) => item.source === id)) visit(edge.target)
      visiting.delete(id)
      visited.add(id)
    }
    for (const site of sites.keys()) visit(site)
  }
}

export function changeSiteRegistry(current, action) {
  const next = structuredClone(current)
  requireValue(action && typeof action === 'object', '缺少管理动作。')
  if (action.type === 'save-site') {
    const site = normalizeSite(action.site)
    requireValue(site.id !== 'main', '主站资料不可编辑。')
    requireValue(!DOMAIN_REGISTRY.some((item) => item.domain === site.domain && item.id !== site.id), '该域名已属于其他站点或内部基础设施。')
    requireValue(!next.sites.some((item) => item.id !== site.id && item.domain === site.domain), '域名已被其他站点使用。')
    const index = next.sites.findIndex((item) => item.id === site.id)
    if (action.create) requireValue(index === -1, '站点标识已存在。')
    else requireValue(index !== -1, '站点不存在，请刷新后重试。')
    if (index === -1) next.sites.push(site)
    else next.sites[index] = site
  } else if (action.type === 'save-relation') {
    const edge = action.relation
    requireValue(edge && Object.hasOwn(RELATION_TYPES, edge.type), '无效的关系类型。')
    requireValue(Object.hasOwn(RELATION_STATUSES, edge.status), '无效的关系状态。')
    const relation = {
      source: field(edge.source, '来源站点', 48, true),
      target: field(edge.target, '目标站点', 48, true),
      type: edge.type, status: edge.status, note: field(edge.note ?? '', '关系备注', 500),
    }
    const index = next.relations.findIndex((item) => relationKey(item) === relationKey(relation))
    if (action.create) requireValue(index === -1, '关系已存在，请使用编辑关系修改。')
    if (index === -1) next.relations.push(relation)
    else next.relations[index] = relation
  } else if (action.type === 'delete-relation') {
    requireValue(next.relations.some((item) => relationKey(item) === action.key), '关系不存在，请刷新后重试。')
    next.relations = next.relations.filter((item) => relationKey(item) !== action.key)
  } else {
    throw new SiteRegistryError('不支持的管理动作。')
  }
  requireValue(next.sites.length <= 100 && next.relations.length <= 500, '台账最多登记 100 个站点、500 条关系。')
  validateGraph(next)
  next.revision += 1
  return next
}
