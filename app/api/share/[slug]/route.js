import { bumpViewCount, getSharedNote } from '../../../../lib/sharedNotes'
import { isAdminLocalPreviewEnabled } from '../../../../lib/adminLocalPreview'
import { getUserFromRequest } from '../../../../lib/edgeSession'
import { isOwnerUser } from '../../../../lib/ownerAuth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

async function isOwnerRequest(req) {
  if (isAdminLocalPreviewEnabled()) return true
  const user = await getUserFromRequest(req)
  return isOwnerUser(user)
}

/**
 * 公共接口：任何人凭 slug 拿到密文信封。
 * 非 owner 只拿 envelope，浏览器用密码解密；owner 访问同一分享链接时直接带出明文。
 */
export async function GET(req, context) {
  const { slug } = await context.params
  const owner = await isOwnerRequest(req)
  const note = await getSharedNote(slug, { includeContent: owner })
  if (!note) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (note.expired) return Response.json({ error: 'EXPIRED' }, { status: 410 })

  // envelope 在 D1 里是字符串，发出去前 parse 回对象
  let envelope = null
  try {
    envelope = JSON.parse(note.envelope)
  } catch {
    return Response.json({ error: 'CORRUPTED_ENVELOPE' }, { status: 500 })
  }

  // 这里需要可靠落库；Edge 环境下 fire-and-forget 可能在响应后被中断。
  await bumpViewCount(slug)

  return Response.json({
    slug: note.slug,
    title: note.title || '',
    envelope,
    content: owner ? note.content || '' : undefined,
    created_at: note.created_at,
    updated_at: note.updated_at,
    expires_at: note.expires_at,
  })
}
