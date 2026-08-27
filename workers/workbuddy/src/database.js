const FALLBACK_RESOURCES = [
  ['100-workbuddy-app-cases', '100 个 WorkBuddy 应用案例', '案例合集', 'PDF', '覆盖信息整理、内容生产、项目推进与个人效率的 WorkBuddy 实战案例集。', 'orange', 5, true],
  ['workbuddy-beginner-guide', 'WorkBuddy 保姆级入门指南', '入门指南', 'PDF', '把安装、配置、第一次任务和常见问题集中讲清楚。', 'blue', 5, true],
  ['workbuddy-ima-knowledge-base', '用 WorkBuddy 自动更新、管理 ima 知识库', '知识管理', 'PDF', '把资料收集、分类整理和知识库更新串成一条自动化流程。', 'violet', 5, true],
  ['workbuddy-prompt-templates', '用 WorkBuddy 做 Prompt：高频职场模板', 'Prompt 模板', 'PDF', '整理高频职场任务的 Prompt 结构与可直接修改的模板。', 'pink', 5, false],
  ['ima-workbuddy-automation', 'ima 知识库 + WorkBuddy：管理自动化实操', '自动化实操', 'PDF', '用一套完整实操把 WorkBuddy 与 ima 知识库连接起来。', 'teal', 5, false],
  ['workbuddy-workplace-video-course', 'WorkBuddy 职场提效应用实战', '视频教程', '视频', '通过视频演示常用职场任务的配置、执行与优化。', 'gold', 10, false],
].map(([slug, title, category, format, summary, color, costPoints, featured], index) => ({
  id: `fallback-${index}`,
  slug,
  resourceKey: `workbuddy:${slug}`,
  title,
  eyebrow: '',
  summary,
  description: summary,
  category,
  format,
  tags: [],
  highlights: [],
  color,
  costPoints,
  pageCount: null,
  durationMinutes: null,
  featured,
  fileCount: 0,
  files: [],
}))

function parseJson(value) {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeResource(row) {
  return {
    id: row.id,
    slug: row.slug,
    resourceKey: row.resource_key,
    title: row.title,
    eyebrow: row.eyebrow || '',
    summary: row.summary || '',
    description: row.description || '',
    category: row.category || '效率实战',
    format: row.format || 'PDF',
    tags: parseJson(row.tags_json),
    highlights: parseJson(row.highlights_json),
    color: row.color || 'lime',
    costPoints: Number(row.cost_points || 0),
    pageCount: row.page_count == null ? null : Number(row.page_count),
    durationMinutes: row.duration_minutes == null ? null : Number(row.duration_minutes),
    featured: Boolean(row.featured),
    fileCount: Number(row.file_count || 0),
    publishedAt: row.published_at || null,
    updatedAt: row.updated_at || null,
  }
}

export async function listResources(db, searchParams = new URLSearchParams()) {
  const search = String(searchParams.get('q') || '').trim().slice(0, 80)
  const category = String(searchParams.get('category') || '').trim().slice(0, 40)
  const featured = searchParams.get('featured') === '1'
  const page = Math.max(1, Math.min(10000, Math.trunc(Number(searchParams.get('page')) || 1)))
  const limit = 24
  const where = ["r.status = 'published'"]
  if (featured) where.push('r.featured = 1')
  const bindings = []
  if (category && category !== '全部资源') {
    bindings.push(category)
    where.push(`r.category = ?${bindings.length}`)
  }
  if (search) {
    bindings.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`)
    const marker = `?${bindings.length}`
    where.push(`(r.title LIKE ${marker} ESCAPE '\\' OR r.summary LIKE ${marker} ESCAPE '\\' OR r.tags_json LIKE ${marker} ESCAPE '\\')`)
  }

  try {
    const result = await db
      .prepare(
        `SELECT r.*, COALESCE(g.cost_points, r.cost_points) AS cost_points, COUNT(f.id) AS file_count
           FROM workbuddy_resources r
           LEFT JOIN gated_resources g ON g.resource_key = r.resource_key
           LEFT JOIN workbuddy_files f ON f.resource_id = r.id
          WHERE ${where.join(' AND ')}
          GROUP BY r.id
          ORDER BY r.featured DESC, r.sort_order DESC, r.updated_at DESC, r.id
          LIMIT 24 OFFSET ?${bindings.length + 1}`,
      )
      .bind(...bindings, (page - 1) * limit)
      .all()
    const [count, categoryResult] = await Promise.all([
      db.prepare(`SELECT COUNT(*) AS total FROM workbuddy_resources r WHERE ${where.join(' AND ')}`).bind(...bindings).first(),
      db.prepare("SELECT DISTINCT category FROM workbuddy_resources WHERE status = 'published' ORDER BY category").all(),
    ])
    const total = Number(count?.total || 0)
    return { resources: (result.results || []).map(normalizeResource), fallback: false, total, page, hasMore: page * limit < total, categories: (categoryResult.results || []).map((row) => row.category) }
  } catch (error) {
    console.error(JSON.stringify({ event: 'workbuddy_catalog_fallback', error: String(error?.message || error) }))
    const query = search.toLowerCase()
    const resources = FALLBACK_RESOURCES.filter((item) => {
      const matchesCategory = !category || category === '全部资源' || item.category === category
      const matchesSearch = !query || `${item.title} ${item.summary} ${item.category}`.toLowerCase().includes(query)
      return matchesCategory && matchesSearch && (!featured || item.featured)
    })
    return { resources: resources.slice((page - 1) * limit, page * limit), fallback: true, total: resources.length, page, hasMore: false, categories: [...new Set(FALLBACK_RESOURCES.map((item) => item.category))] }
  }
}

export async function getResourceBySlug(db, slug) {
  try {
    const row = await db
      .prepare(
        `SELECT r.*, COALESCE(g.cost_points, r.cost_points) AS cost_points, COUNT(f.id) AS file_count
           FROM workbuddy_resources r
           LEFT JOIN gated_resources g ON g.resource_key = r.resource_key
           LEFT JOIN workbuddy_files f ON f.resource_id = r.id
          WHERE r.slug = ?1 AND r.status = 'published'
          GROUP BY r.id`,
      )
      .bind(slug)
      .first()
    if (!row) return null
    const filesResult = await db
      .prepare(
        `SELECT id, label, file_name, content_type, size_bytes, delivery
           FROM workbuddy_files
          WHERE resource_id = ?1
          ORDER BY sort_order, created_at`,
      )
      .bind(row.id)
      .all()
    return {
      ...normalizeResource(row),
      files: (filesResult.results || []).map((file) => ({
        id: file.id,
        label: file.label,
        fileName: file.file_name,
        contentType: file.content_type,
        sizeBytes: file.size_bytes == null ? null : Number(file.size_bytes),
        delivery: file.delivery,
      })),
    }
  } catch (error) {
    console.error(JSON.stringify({ event: 'workbuddy_detail_fallback', error: String(error?.message || error) }))
    return FALLBACK_RESOURCES.find((item) => item.slug === slug) || null
  }
}

export async function getFile(db, slug, fileId) {
  return db
    .prepare(
      `SELECT f.id, f.label, f.object_key, f.file_name, f.content_type, f.size_bytes, f.delivery,
              r.resource_key, r.cost_points
         FROM workbuddy_files f
         JOIN workbuddy_resources r ON r.id = f.resource_id
        WHERE r.slug = ?1 AND f.id = ?2 AND r.status = 'published'`,
    )
    .bind(slug, fileId)
    .first()
}
