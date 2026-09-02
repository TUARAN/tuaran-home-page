import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

const TENOR_BASE_URL = 'https://tenor.googleapis.com/v2/search'

function getApiKey() {
  const context = getOptionalRequestContext()
  return String(context?.env?.TENOR_API_KEY || process.env.TENOR_API_KEY || '').trim()
}

export async function GET(request) {
  const query = String(new URL(request.url).searchParams.get('q') || '').trim().slice(0, 80)
  if (!query) return Response.json({ error: '请输入搜索关键词' }, { status: 400 })

  const apiKey = getApiKey()
  if (!apiKey) {
    return Response.json({ error: 'GIF 搜索服务尚未配置 TENOR_API_KEY' }, { status: 503 })
  }

  try {
    const upstream = new URL(TENOR_BASE_URL)
    upstream.searchParams.set('q', query)
    upstream.searchParams.set('key', apiKey)
    upstream.searchParams.set('limit', '18')
    upstream.searchParams.set('media_filter', 'gif')
    upstream.searchParams.set('contentfilter', 'medium')
    const response = await fetch(upstream, { headers: { 'user-agent': '2aran-code-miner/1.0' } })
    if (!response.ok) throw new Error(`Tenor 返回 ${response.status}`)
    const data = await response.json()
    const results = (data.results || []).map((item) => {
      const media = item.media_formats?.gif || {}
      return {
        id: item.id,
        title: item.title || query,
        preview: media.preview || media.url,
        url: media.url,
        size: media.size ? `${(media.size / 1024 / 1024).toFixed(1)} MB` : '',
        dimensions: Array.isArray(media.dims) ? media.dims.join('×') : '',
      }
    }).filter((item) => item.url)
    return Response.json({ results }, { headers: { 'cache-control': 'public, max-age=60, s-maxage=300' } })
  } catch (error) {
    return Response.json({ error: error.message || 'GIF 搜索失败' }, { status: 502 })
  }
}
