export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// 签到功能已归档，接口保留 410 供旧客户端识别。
function archived() {
  return Response.json({ error: 'ARCHIVED', message: 'Check-in has been archived.' }, { status: 410 })
}

export const GET = archived
export const POST = archived
