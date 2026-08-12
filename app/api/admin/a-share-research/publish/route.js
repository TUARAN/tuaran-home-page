import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getOwnerOrReject } from '../../../../../lib/adminAuth'
import { getD1 } from '../../../../../lib/d1'
import { ASharePublishError, publishAShareDraft } from '../../../../../lib/aSharePublisher'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const id = String(body?.id || '').trim()
  if (!id) return Response.json({ error: 'MISSING_ID' }, { status: 400 })

  let db
  try {
    db = getD1()
  } catch {
    return Response.json({ error: 'D1_UNAVAILABLE' }, { status: 503 })
  }

  let draft
  try {
    draft = await db.prepare('SELECT * FROM a_share_drafts WHERE id = ?').bind(id).first()
  } catch (error) {
    return Response.json({ error: 'A_SHARE_FETCH_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
  if (!draft) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
  const env = getOptionalRequestContext()?.env || {}
  try {
    const result = await publishAShareDraft({ db, env, draft, mode: 'manual' })
    return Response.json({
      ...result,
      note: '已提交 main，Cloudflare Pages 构建完成后即可访问。',
    })
  } catch (error) {
    const publishError = error instanceof ASharePublishError ? error : null
    return Response.json(
      { error: publishError?.code || 'PUBLISH_FAILED', detail: String(error?.message || error) },
      { status: publishError?.status || 500 },
    )
  }
}
