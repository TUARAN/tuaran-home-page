import { getOwnerOrReject } from '../../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../../lib/db/d1'
import {
  createXReplyDownloadPassword,
  readXReplyDownloadPassword,
  saveXReplyDownloadPassword,
  xReplyDownloadPasswordStatus,
} from '../../../../../lib/content/xReplyDownloadPassword.mjs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function noStore(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

export async function GET(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  try {
    return noStore({ ok: true, ...xReplyDownloadPasswordStatus(await readXReplyDownloadPassword(getD1())) })
  } catch {
    return noStore({ ok: false, error: 'PASSWORD_STORE_UNAVAILABLE' }, 503)
  }
}

export async function POST(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  try {
    const db = getD1()
    const { password, record } = await createXReplyDownloadPassword(auth.user?.login || 'owner')
    await saveXReplyDownloadPassword(db, record)
    return noStore({ ok: true, password, ...xReplyDownloadPasswordStatus(record) })
  } catch {
    return noStore({ ok: false, error: 'PASSWORD_GENERATION_FAILED' }, 503)
  }
}
