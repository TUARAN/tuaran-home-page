export const runtime = 'edge'

async function detectIp() {
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      cache: 'no-store',
      headers: { 'user-agent': '2aran-network-tool/1.0' },
    })
    if (!response.ok) throw new Error(`上游服务返回 ${response.status}`)
    const data = await response.json()
    return Response.json({
      ok: true,
      ip: data.ip,
      note: '这是处理请求的 Cloudflare 边缘函数出口，不是你的本机公网 IP。',
    }, { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    return Response.json({ ok: false, error: error.message || 'IP 检测失败' }, { status: 502 })
  }
}

export async function GET() {
  return detectIp()
}

export async function POST() {
  return detectIp()
}
