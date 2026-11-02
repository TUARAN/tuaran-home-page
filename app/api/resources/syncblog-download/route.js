import { getD1 } from '../../../../lib/db/d1'
import { getPrivateDocumentsR2 } from '../../../../lib/db/r2'
import { readSyncblogDownload } from '../../../../lib/content/syncblogDownload.mjs'
import { verifyXReplyDownloadPassword } from '../../../../lib/content/xReplyDownloadPassword.mjs'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
const fail = (error, status) => Response.json({ error }, { status, headers: { 'Cache-Control': 'private, no-store' } })
export async function POST(req) {
  if (Number(req.headers.get('content-length')) > 512) return fail('INVALID_PASSWORD', 400)
  let payload
  try { payload = await req.json() } catch { return fail('INVALID_PASSWORD', 400) }
  const record = await readSyncblogDownload(getD1())
  if (!record.objectKey || !record.password) return fail('FILE_NOT_FOUND', 503)
  if (!await verifyXReplyDownloadPassword(payload?.password, record.password)) return fail('INVALID_PASSWORD', 403)
  const object = await getPrivateDocumentsR2().get(record.objectKey)
  if (!object) return fail('FILE_NOT_FOUND', 404)
  return new Response(object.body, { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(record.fileName)}`, 'Cache-Control': 'private, no-store' } })
}
