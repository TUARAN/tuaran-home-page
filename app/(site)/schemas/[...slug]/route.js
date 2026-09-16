import { getContentProofSchema } from '../../../../lib/contentProofSchemas.js'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(_request, { params }) {
  const { slug } = await params
  const schema = getContentProofSchema(Array.isArray(slug) ? slug.join('/') : slug)
  if (!schema) return new Response('Not found', { status: 404 })
  return Response.json(schema, {
    headers: {
      'content-type': 'application/schema+json; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
