import { getD1 } from './d1'
import { bumpShortLinkClick, isValidShortCode, resolveShortLink } from './shortLinks'

const NOT_FOUND_RESPONSE = () => new Response('Not Found', { status: 404 })

export async function handleShortLinkRedirect(request, params, { reservedCodes = new Set() } = {}) {
  const { code } = await params
  if (!code || reservedCodes.has(code) || !isValidShortCode(code)) {
    return NOT_FOUND_RESPONSE()
  }

  let db
  try {
    db = getD1()
  } catch {
    return NOT_FOUND_RESPONSE()
  }

  const row = await resolveShortLink(db, code)
  if (!row?.original) {
    return NOT_FOUND_RESPONSE()
  }

  let destination
  try {
    destination = new URL(row.original, request.url)
  } catch {
    return NOT_FOUND_RESPONSE()
  }
  if (!['http:', 'https:'].includes(destination.protocol)) {
    return NOT_FOUND_RESPONSE()
  }

  await bumpShortLinkClick(db, row.id).catch(() => {})
  return Response.redirect(destination, 307)
}
