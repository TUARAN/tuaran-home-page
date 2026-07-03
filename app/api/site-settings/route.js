import { getSiteSettings } from '../../../lib/siteSettings'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  const settings = await getSiteSettings()
  return Response.json(
    { settings },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
