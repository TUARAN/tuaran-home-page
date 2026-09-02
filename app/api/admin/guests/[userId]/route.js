import { getOwnerOrReject } from '../../../../../lib/adminAuth'
import { getD1 } from '../../../../../lib/d1'
import { getGuestDirectoryEntry } from '../../../../../lib/guestDirectory'
import { listUnlocksForUser } from '../../../../../lib/resourceUnlocks'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const { userId: rawUserId } = await params
  const userId = String(rawUserId || '').trim()
  if (!userId.startsWith('guest:')) {
    return Response.json({ status: 'error', error: 'INVALID_GUEST_ID' }, { status: 400 })
  }

  try {
    const db = getD1()
    const guest = await getGuestDirectoryEntry(db, userId)
    if (!guest) return Response.json({ status: 'error', error: 'GUEST_NOT_FOUND' }, { status: 404 })
    const unlocks = await listUnlocksForUser(db, userId, { limit: 300 })
    return Response.json({
      status: 'ok',
      generatedAt: Date.now(),
      guestDetail: { guest, unlocks, movedToAccount: guest.boundUserId || '' },
    })
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        error: 'GUEST_DETAIL_READ_FAILED',
        message: '游客详情读取失败。',
        detail: String(error?.message || error),
      },
      { status: 500 }
    )
  }
}
