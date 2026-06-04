import { requestRegistrationCode } from '../../../../../lib/emailAuth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const body = await req.json()
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
