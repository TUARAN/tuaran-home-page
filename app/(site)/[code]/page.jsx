import { notFound, redirect } from 'next/navigation'
import { getD1 } from '../../../lib/d1'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const CODE_RE = /^[A-Za-z0-9]{4,16}$/
const RESERVED_CODES = new Set(['poetry'])

export default async function ShortRedirectPage({ params }) {
  const { code } = await params
  if (!code || RESERVED_CODES.has(code) || !CODE_RE.test(code)) {
    notFound()
  }

  let db
  try {
    db = getD1()
  } catch {
    notFound()
  }

  const row = await db
    .prepare('SELECT original FROM short_links WHERE code = ?1 LIMIT 1')
    .bind(code)
    .first()

  if (!row?.original) {
    notFound()
  }

  redirect(row.original)
}
