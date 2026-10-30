import { getD1 } from '../../../../lib/db/d1'
import { COMMUNITY_ACTION_SECRET_HEADER } from '../../../../lib/community/communityActions'
import { readPublicPromptVotes, recordPromptVote } from '../../../../lib/community/xExtensionPromptVotes'
import { authorizeCommunitySecret } from '../../../../lib/content/xReplyPersonInvite.mjs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function isMissingTable(error) {
  return /no such table/i.test(String(error?.message || error))
}

export async function GET() {
  const db = dbOrNull()
  if (!db) return Response.json({ ok: false, error: 'DB_UNAVAILABLE' }, { status: 503 })
  try {
    return Response.json(await readPublicPromptVotes(db))
  } catch (error) {
    if (isMissingTable(error)) return Response.json({ ok: false, error: 'MIGRATION_REQUIRED' }, { status: 503 })
    throw error
  }
}

export async function POST(req) {
  const db = dbOrNull()
  if (!db) return Response.json({ ok: false, error: 'DB_UNAVAILABLE' }, { status: 503 })
  let body = null
  try {
    body = await req.json()
  } catch {
    body = null
  }
  if (!body || typeof body !== 'object') {
    return Response.json({ ok: false, error: 'INVALID_VOTE' }, { status: 400 })
  }
  try {
    const authorized = await authorizeCommunitySecret(db, req.headers.get(COMMUNITY_ACTION_SECRET_HEADER), {
      deviceId: body.deviceId || '',
      accountHandle: body.accountHandle || '',
      bind: true,
    })
    if (!authorized.ok) return Response.json({ ok: false, error: authorized.error }, { status: authorized.status })
    const recorded = await recordPromptVote(db, body)
    if (!recorded.ok) return Response.json(recorded, { status: 400 })
    return Response.json(recorded)
  } catch (error) {
    if (isMissingTable(error)) return Response.json({ ok: false, error: 'MIGRATION_REQUIRED' }, { status: 503 })
    throw error
  }
}
