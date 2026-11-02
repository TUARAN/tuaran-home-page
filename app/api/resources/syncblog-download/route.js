import { POST as deliver } from '../deliver/route'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export async function POST(req) {
  const url = new URL(req.url)
  url.pathname = '/api/resources/deliver'
  url.search = new URLSearchParams({ resourceKey: 'resource:syncblog-publisher', file: 'extension-zip' }).toString()
  const text = await req.text()
  if (text.length > 512) return Response.json({ error: 'INVALID_PASSWORD' }, { status: 400 })
  return deliver(new Request(url, { method: 'POST', headers: req.headers, body: text }))
}
