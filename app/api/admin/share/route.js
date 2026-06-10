import { getOwnerOrReject } from '../../../../lib/adminAuth'
import {
  createSharedNote,
  deleteSharedNote,
  listSharedNotes,
  updateSharedNote,
} from '../../../../lib/sharedNotes'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const items = await listSharedNotes()
  return Response.json({ items })
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  let body = null
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }
  const result = await createSharedNote({
    envelope: body?.envelope,
    title: body?.title,
    expiresInDays: body?.expiresInDays ?? null,
    createdBy: guard.user?.id || guard.user?.login || null,
  })
  if (!result.ok) return Response.json(result, { status: result.status || 400 })
  return Response.json(result)
}

export async function PATCH(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  let body = null
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }
  const result = await updateSharedNote({
    slug: body?.slug,
    envelope: body?.envelope,
    title: body?.title,
    expiresInDays: body?.expiresInDays,
  })
  if (!result.ok) return Response.json(result, { status: result.status || 400 })
  return Response.json(result)
}

export async function DELETE(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')
  const result = await deleteSharedNote(slug)
  if (!result.ok) return Response.json(result, { status: result.status || 400 })
  return Response.json(result)
}
