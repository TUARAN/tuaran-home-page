import { getActiveFestivalBanner, getDefaultActiveFestivalBanner } from '../../../lib/festivalBanners'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const banner = await getActiveFestivalBanner()
    return Response.json({ banner }, { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' } })
  } catch (error) {
    console.error('[festival-banner] failed to load active banner', error)
    return Response.json({ banner: getDefaultActiveFestivalBanner() }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  }
}
