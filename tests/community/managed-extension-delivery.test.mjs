import { existsSync } from 'node:fs'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import test from 'node:test'
import { SYNCBLOG_EXTENSION_PACKAGE as release } from '../../lib/generated/syncblogExtensionPackage.js'
import { MANAGED_EXTENSIONS, isManagedExtensionResource } from '../../lib/content/managedExtensions.mjs'
import { getResourceDelivery } from '../../lib/content/resourceCatalog.js'
import { readPrivateExtensionPackage } from '../../lib/content/privateExtensionPackage.mjs'
import { injectZipStoredFile, communitySecretLocalJson } from '../../lib/content/zipStoredAppend.mjs'

test('both managed plugins use the same private delivery and credential path', () => {
  for (const plugin of Object.values(MANAGED_EXTENSIONS)) {
    assert.equal(isManagedExtensionResource(plugin.resourceKey), true)
    assert.equal(getResourceDelivery(plugin.resourceKey, 'extension-zip').objectKey, plugin.release.objectKey)
  }
  assert.equal(isManagedExtensionResource('resource:unrelated'), false)
})
test('packaged AI release passes integrity verification and has manifest at root with no credential', { skip: !existsSync(new URL(`../../output/${release.fileName}`, import.meta.url)) }, async () => {
  const bytes = new Uint8Array(await readFile(new URL(`../../output/${release.fileName}`, import.meta.url)))
  const bucket = { get: async () => ({ arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }) }
  assert.equal((await readPrivateExtensionPackage(bucket, release.objectKey, release)).size, bytes.length)
  const inspection = JSON.parse(execFileSync('python3', ['-c', `import json,sys,zipfile
with zipfile.ZipFile(sys.argv[1]) as z:
 print(json.dumps({'manifest':json.loads(z.read('manifest.json')), 'secret': 'community-secret.local' in z.namelist(), 'valid':z.testzip() is None}))`, `output/${release.fileName}`], { encoding: 'utf8' }))
  assert.equal(inspection.manifest.version, release.version)
  assert.equal(inspection.secret, false); assert.equal(inspection.valid, true)
  const personalized = injectZipStoredFile(bytes, 'community-secret.local', communitySecretLocalJson('test-person-code-only'))
  const { mkdtemp, writeFile, rm } = await import('node:fs/promises'); const os = await import('node:os'); const path = await import('node:path')
  const dir = await mkdtemp(path.join(os.tmpdir(), 'ai-delivery-test-'))
  try {
    const file = path.join(dir, 'personalized.zip'); await writeFile(file, personalized)
    const decoded = JSON.parse(execFileSync('python3', ['-c', `import sys,zipfile
with zipfile.ZipFile(sys.argv[1]) as z:
 assert z.testzip() is None
 print(z.read('community-secret.local').decode())`, file], { encoding: 'utf8' }))
    assert.deepEqual(decoded, { secret: 'test-person-code-only' })
  } finally { await rm(dir, { recursive: true, force: true }) }
})
test('admin cards share one UI and do not expose manual package upload or password generation', async () => {
  const client = await readFile(new URL('../../app/(admin)/admin/community-actions/CommunityActionsClient.jsx', import.meta.url), 'utf8')
  const panel = await readFile(new URL('../../app/(admin)/admin/community-actions/ExtensionPackagePanel.jsx', import.meta.url), 'utf8')
  assert.match(client, /<ExtensionPackagePanel pluginId=/)
  assert.equal([...client.matchAll(/<PersonInvitesPanel\s*\/>/g)].length, 1)
  assert.doesNotMatch(client, /安装包与下载密码|<SyncblogDownloadPanel/)
  assert.doesNotMatch(panel, /type="file"|生成下载密码|上传并替换/)
  assert.match(panel, /download=1/)
})

test('actual delivery handler gates AI ZIP before storage access and injects the authorized credential', { skip: !existsSync(new URL(`../../output/${release.fileName}`, import.meta.url)) }, async () => {
  const vm = await import('node:vm')
  const { privateExtensionReleaseForKey } = await import('../../lib/content/managedExtensions.mjs')
  const source = (await readFile(new URL('../../app/api/resources/deliver/route.js', import.meta.url), 'utf8')).replace(/^import .*\n/gm, '').replace(/^export (const|async function)/gm, '$1')
  const bytes = new Uint8Array(await readFile(new URL(`../../output/${release.fileName}`, import.meta.url)))
  let reads = 0, marked = 0
  const context = vm.createContext({ Request, Response, URL, Headers, Uint8Array, crypto,
    getD1: () => ({}), getUserFromRequest: async () => ({ id: 'test-user' }), getUserRole: async () => 'owner',
    GUEST_USER_PREFIX: 'guest:', getOrIssueGuest: async () => null, awardGuestSeed: async () => {}, unlockResource: async () => ({ ok: true }),
    getResourceDelivery, isManagedExtensionResource, privateExtensionReleaseForKey, readPrivateExtensionPackage, injectZipStoredFile, communitySecretLocalJson,
    getR2: () => { throw new Error('Managed release must never read public R2') },
    getPrivateDocumentsR2: () => ({ get: async () => { reads++; return { arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) } } }),
    recordResourceEvent: async () => {}, publicUrlFor: () => '',
    authorizeDownloadInvite: async (_db, value) => value === 'test-valid-person-code' ? { ok: true, kind: 'person', invite: { id: 'invite-12345678' } } : { ok: false, status: 403, error: 'INVALID_PASSWORD' },
    markPersonInviteDownloaded: async () => { marked++ },
  })
  vm.runInContext(source, context)
  const endpoint = 'https://2aran.com/api/resources/deliver?resourceKey=resource:syncblog-publisher&file=extension-zip'
  assert.equal((await context.GET(new Request(endpoint))).status, 403)
  assert.equal((await context.POST(new Request(endpoint, { method: 'POST', body: JSON.stringify({ password: 'wrong' }) }))).status, 403)
  assert.equal(reads, 0)
  const delivered = await context.POST(new Request(endpoint, { method: 'POST', body: JSON.stringify({ password: 'test-valid-person-code' }) }))
  assert.equal(delivered.status, 200); assert.equal(reads, 1); assert.equal(marked, 1)
  assert.equal(delivered.headers.get('cache-control'), 'private, no-store')
  assert.match(delivered.headers.get('content-disposition'), /ai-distribution-master/)
  assert.ok((await delivered.arrayBuffer()).byteLength > bytes.length)
})
