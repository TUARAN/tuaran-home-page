import { requestRegistrationCode } from '../../../../../lib/emailAuth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    let body
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
    }

    if (body?.purpose && body.purpose !== 'register') {
      return Response.json({ error: 'UNSUPPORTED_CODE_PURPOSE' }, { status: 400 })
    }

    const result = await requestRegistrationCode(req, body?.email)
    if (!result.ok) return Response.json(result, { status: result.status || 400 })
    return Response.json({ ok: true })
  } catch (error) {
    console.error('send registration code failed', error)
    return Response.json({ error: 'SEND_CODE_FAILED' }, { status: 500 })
  }
}
