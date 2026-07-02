import { notFound, redirect } from 'next/navigation'
import { getD1 } from '../../../../lib/d1'
import { bumpShortLinkClick, isValidShortCode, resolveShortLink } from '../../../../lib/shortLinks'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export default async function ShortRedirectPage({ params }) {
  const { code } = await params
  if (!code || !isValidShortCode(code)) {
    notFound()
  }

  let db
  try {
    db = getD1()
  } catch {
    notFound()
  }

  const row = await resolveShortLink(db, code)
  if (!row?.original) {
    notFound()
  }

  await bumpShortLinkClick(db, row.id).catch(() => {})
  redirect(row.original)
}
