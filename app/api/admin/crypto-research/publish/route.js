import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getOwnerOrReject } from '../../../../../lib/adminAuth'
import { getD1 } from '../../../../../lib/d1'
import { CryptoPublishError, publishCryptoDraft } from '../../../../../lib/cryptoPublisher'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const id = String((await req.json().catch(() => null))?.id || '').trim()
  if (!id) return Response.json({ error: 'MISSING_ID' }, { status: 400 })
  let db
  try { db = getD1() } catch { return Response.json({ error: 'D1_UNAVAILABLE' }, { status: 503 }) }
  const draft = await db.prepare('SELECT * FROM crypto_drafts WHERE id = ?').bind(id).first()
  if (!draft) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
  try {
    return Response.json(await publishCryptoDraft({ db, env: getOptionalRequestContext()?.env || {}, draft, mode: 'manual' }))
  } catch (error) {
    return Response.json({ error: error instanceof CryptoPublishError ? error.code : 'PUBLISH_FAILED', detail: String(error?.message || error) }, { status: error instanceof CryptoPublishError ? error.status : 500 })
  }
}
