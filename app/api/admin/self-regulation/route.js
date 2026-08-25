import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { renderMarkdown } from '../../../../lib/research/markdown'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const DOCUMENT_SLUG = 'self-regulation-memoir'
const PASSWORD_ITERATIONS = 310000
const PASSWORD_SALT = '0Cw53n1tKTI1pQAdzS9afg=='
const PASSWORD_HASH = 'nw3OwRB6k5aXDT4PClY6HC9iWyqdYPnq089GyPsWtLQ='

function base64ToBytes(value) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function safeEqual(left, right) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index]
  return difference === 0
}

async function verifyPassword(password) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: base64ToBytes(PASSWORD_SALT),
      iterations: PASSWORD_ITERATIONS,
    },
    key,
    256
  )
  return safeEqual(new Uint8Array(bits), base64ToBytes(PASSWORD_HASH))
}

function normalizePrivateMarkdown(markdown) {
  return String(markdown || '').replace(/<aside>\s*([\s\S]*?)\s*<\/aside>/gi, (_match, body) => {
    const quote = String(body || '').trim().split(/\r?\n/).map((line) => `> ${line}`).join('\n')
    return `\n\n${quote}\n\n`
  })
}

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0' },
  })
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'INVALID_JSON' }, 400)
  }

  const password = String(body?.password || '').trim()
  if (!password || password.length > 256) return json({ error: 'INVALID_PASSWORD' }, 400)
  if (!(await verifyPassword(password))) return json({ error: 'WRONG_PASSWORD' }, 403)

  let db
  try {
    db = getD1()
  } catch {
    return json({ error: 'DB_UNAVAILABLE' }, 503)
  }

  try {
    const row = await db
      .prepare('SELECT title, content, updated_at FROM private_documents WHERE slug = ?')
      .bind(DOCUMENT_SLUG)
      .first()
    if (!row) return json({ error: 'DOCUMENT_NOT_FOUND' }, 404)

    return json({
      status: 'ok',
      title: String(row.title || '回忆录'),
      html: renderMarkdown(normalizePrivateMarkdown(row.content), { breaks: true }),
      updatedAt: Number(row.updated_at) || 0,
    })
  } catch (error) {
    return json({ error: 'PRIVATE_DOCUMENT_READ_FAILED', detail: String(error?.message || error) }, 500)
  }
}
