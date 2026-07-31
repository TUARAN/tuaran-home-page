import { getD1 } from '../../../lib/d1'
import { DEFAULT_FAMOUS_QUOTE, FAMOUS_QUOTES } from '../../../lib/famousQuotes'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function randomIndex(length) {
  const value = new Uint32Array(1)
  crypto.getRandomValues(value)
  return value[0] % length
}

function fallbackQuote(exclude) {
  const candidates = FAMOUS_QUOTES.filter((quote) => quote.enabled && quote.id !== exclude)
  return candidates[randomIndex(candidates.length)] || DEFAULT_FAMOUS_QUOTE
}

function serialize(row) {
  return {
    id: row.id,
    text: row.text,
    author: row.author,
    source: row.source || '',
    sourceUrl: row.source_url || '',
  }
}

export async function GET(request) {
  const exclude = new URL(request.url).searchParams.get('exclude')
  let quote = null

  try {
    const db = getD1()
    quote = await db
      .prepare(
        `SELECT id, text, author, source, source_url
         FROM famous_quotes
         WHERE enabled = 1 AND id != ?
         ORDER BY RANDOM()
         LIMIT 1`
      )
      .bind(exclude || '')
      .first()
  } catch {
    quote = null
  }

  return Response.json(quote ? serialize(quote) : fallbackQuote(exclude), {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
