import { getD1 } from '../../../lib/d1'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function serialize(row) {
  return {
    id: row.id,
    text: row.text,
    author: row.author,
    source: row.source || '',
    sourceUrl: row.source_url || '',
  }
}

export async function GET() {
  let quote = null

  try {
    const db = getD1()
    quote = await db
      .prepare(
        `SELECT id, text, author, source, source_url
         FROM famous_quotes
         WHERE enabled = 1
         ORDER BY RANDOM()
         LIMIT 1`
      )
      .first()
  } catch {
    quote = null
  }

  return Response.json(quote ? serialize(quote) : null, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
