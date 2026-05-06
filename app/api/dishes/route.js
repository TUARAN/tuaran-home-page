import { getD1 } from '../../../lib/d1'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const VALID_AUDIENCES = new Set(['adult', 'baby'])

/**
 * GET /api/dishes?audience=adult|baby → { audience, count, dishes: [...] }
 *
 * 数据从 D1 dishes 表拉，按 (audience, is_active, display_order) 索引命中，
 * 默认 audience='adult'。无效 audience 返回 400。
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const audience = searchParams.get('audience') || 'adult'

  if (!VALID_AUDIENCES.has(audience)) {
    return Response.json({ error: 'INVALID_AUDIENCE' }, { status: 400 })
  }

  let db
  try {
    db = getD1()
  } catch {
    return Response.json(
      { error: 'DB_UNAVAILABLE', message: '菜品数据需要部署环境（Cloudflare D1）才能读取。' },
      { status: 503 }
    )
  }

  try {
    const result = await db
      .prepare(
        `SELECT id, name_zh, rating_score, rating_label, short_recipe, category, audience, display_order
         FROM dishes
         WHERE is_active = 1 AND audience = ?1
         ORDER BY display_order ASC, name_zh ASC`
      )
      .bind(audience)
      .all()

    const dishes = result?.results || []
    return Response.json({ audience, count: dishes.length, dishes })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}
