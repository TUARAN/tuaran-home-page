import { getOwnerOrReject } from '../../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../../lib/db/d1'
import { getPrivateDocumentsR2 } from '../../../../../lib/db/r2'
import { readOwnerCommunitySecret } from '../../../../../lib/content/xReplyPersonInvite.mjs'
import { MANAGED_EXTENSIONS } from '../../../../../lib/content/managedExtensions.mjs'
import { readPrivateExtensionPackage } from '../../../../../lib/content/privateExtensionPackage.mjs'
import { communitySecretLocalJson, injectZipStoredFile } from '../../../../../lib/content/zipStoredAppend.mjs'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
export async function GET(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  const url = new URL(req.url)
  const item = MANAGED_EXTENSIONS[url.searchParams.get('plugin') || 'x']
  if (!item || !Object.hasOwn(MANAGED_EXTENSIONS, item.id)) return reply({ error: 'INVALID_PLUGIN' }, 400)
  try {
    if (url.searchParams.get('download') === '1') {
      const secret = await readOwnerCommunitySecret(getD1())
      if (!secret) return reply({ error: 'SECRET_NOT_CONFIGURED' }, 503)
      // Public API routes are excluded from the standalone Admin build.
      // Owner authorization above gates the same private reader and ZIP injector.
      const release = await readPrivateExtensionPackage(getPrivateDocumentsR2(), item.release.objectKey, item.release)
      if (!release) return reply({ error: 'PACKAGE_UNAVAILABLE' }, 503)
      const bytes = injectZipStoredFile(release.bytes, 'community-secret.local', communitySecretLocalJson(secret))
      return new Response(bytes, { headers: {
        'Content-Type': release.contentType,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(release.fileName)}`,
        'Content-Length': String(bytes.byteLength),
        'Cache-Control': 'private, no-store',
      } })
    }
    const object = await getPrivateDocumentsR2().head(item.release.objectKey)
    return reply({ ready: !!object && object.size === item.release.size, version: item.release.version || item.release.fileName.match(/-v([\d.]+)\.zip$/)?.[1] || '', fileName: item.release.fileName, size: item.release.size, sha256: item.release.sha256 })
  } catch (error) {
    console.error('Extension delivery unavailable', error.message)
    return reply({ error: 'PACKAGE_UNAVAILABLE' }, 503)
  }
}
