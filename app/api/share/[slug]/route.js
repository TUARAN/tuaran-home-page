import { bumpViewCount, getSharedNote } from '../../../../lib/sharedNotes'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/**
 * 公共接口：任何人凭 slug 拿到密文信封。
 * 后台可见明文；公开分享端仍只拿 envelope，浏览器用密码解密。
 */
export async function GET(req, context) {
  const { slug } = await context.params
  const note = await getSharedNote(slug)
  if (!note) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (note.expired) return Response.json({ error: 'EXPIRED' }, { status: 410 })

  // envelope 在 D1 里是字符串，发出去前 parse 回对象
  let envelope = null
  try {
    envelope = JSON.parse(note.envelope)
  } catch {
    return Response.json({ error: 'CORRUPTED_ENVELOPE' }, { status: 500 })
  }

  // 异步累加浏览数（不阻塞响应）
  bumpViewCount(slug).catch(() => {})

  return Response.json({
    slug: note.slug,
    title: note.title || '',
    envelope,
    created_at: note.created_at,
    updated_at: note.updated_at,
    expires_at: note.expires_at,
  })
}
