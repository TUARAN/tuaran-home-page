import { getOwnerOrReject } from '../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../lib/db/d1'
import { getPrivateDocumentsR2 } from '../../../../lib/db/r2'
import { createXReplyDownloadPassword } from '../../../../lib/content/xReplyDownloadPassword.mjs'
import { readSyncblogDownload, saveSyncblogDownload, syncblogDownloadStatus } from '../../../../lib/content/syncblogDownload.mjs'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
const reply = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })
export async function GET(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  return reply(syncblogDownloadStatus(await readSyncblogDownload(getD1())))
}
export async function POST(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  const db = getD1()
  const current = await readSyncblogDownload(db)
  const generated = await createXReplyDownloadPassword('owner')
  await saveSyncblogDownload(db, { ...current, password: generated.record }, 'owner')
  return reply({ ...syncblogDownloadStatus({ ...current, password: generated.record }), password: generated.password })
}
export async function PUT(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  const maxSize = 25 * 1024 * 1024
  if (Number(req.headers.get('content-length')) > maxSize + 65536) return reply({ error: '安装包不能超过 25 MB' }, 413)
  const form = await req.formData()
  const file = form.get('file')
  if (!file || typeof file.arrayBuffer !== 'function' || !file.name?.endsWith('.zip') || !file.size || file.size > maxSize) return reply({ error: '请选择 25 MB 以内的 ZIP 安装包' }, 400)
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 3 || bytes[3] !== 4) return reply({ error: 'ZIP 格式不正确' }, 400)
  const objectKey = `vip/syncblog/${crypto.randomUUID()}.zip`
  const bucket = getPrivateDocumentsR2()
  await bucket.put(objectKey, bytes, { httpMetadata: { contentType: 'application/zip' } })
  const db = getD1()
  const current = await readSyncblogDownload(db)
  const record = { ...current, objectKey, fileName: file.name.replace(/[\\/\r\n"]/g, '_'), uploadedAt: Date.now() }
  await saveSyncblogDownload(db, record, 'owner')
  return reply(syncblogDownloadStatus(record))
}
