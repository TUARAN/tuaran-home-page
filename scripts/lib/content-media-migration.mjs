import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

const BEGIN = '# BEGIN content-media-migration'
const END = '# END content-media-migration'
const MIME = { '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif', '.webp':'image/webp', '.avif':'image/avif', '.svg':'image/svg+xml', '.mp4':'video/mp4', '.webm':'video/webm', '.m4v':'video/mp4', '.mp3':'audio/mpeg', '.wav':'audio/wav', '.ogg':'audio/ogg' }
export const sha256 = (data) => createHash('sha256').update(data).digest('hex')
function validateEntry(entry) {
  if (!/^public\/(feed|images|videos|audio)\//.test(entry.path) || entry.path.split('/').some((part) => ['..','.',''].includes(part))) throw new Error('Invalid media path')
  if (!/^[a-f0-9]{64}$/.test(entry.sha256) || !Number.isSafeInteger(entry.bytes) || entry.bytes < 0) throw new Error('Invalid media checksum')
  if (entry.objectKey !== undefined) {
    const expectedKey = `content-media/${entry.sha256}/${path.basename(entry.path)}`
    const expectedOld = '/' + entry.path.slice('public/'.length).split('/').map(encodeURIComponent).join('/')
    const destination = new URL(entry.url)
    if (destination.protocol !== 'https:' || destination.username || destination.password || destination.search || destination.hash || entry.objectKey !== expectedKey || entry.oldUrl !== expectedOld || !destination.pathname.endsWith('/'+expectedKey.split('/').map(encodeURIComponent).join('/')) || entry.contentType !== MIME[path.extname(entry.path).toLowerCase()]) throw new Error('Invalid media destination')
  }
}
function localFile(root, entry) {
  validateEntry(entry)
  const filename = path.resolve(fs.realpathSync(root), entry.path)
  const real = fs.realpathSync(filename)
  if (real !== filename) throw new Error('Symlinks are not supported')
  const data = fs.readFileSync(filename)
  if (data.length !== entry.bytes || sha256(data) !== entry.sha256) throw new Error(`Local file changed: ${entry.path}`)
  return { filename, data }
}

export function prepareMediaPlan(root, inventory, { baseUrl, bucket }) {
  const base = new URL(baseUrl)
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || base.hostname === '2aran.com' || !/^[a-z0-9-]+$/.test(bucket || '')) throw new Error('Use an HTTPS public R2 origin and a valid bucket')
  const approved = inventory.files.filter((entry) => entry.migrationStatus === 'approved' && entry.visibility === 'public')
  if (!approved.length) throw new Error('No media explicitly classified public and approved in the inventory')
  const entries = approved.map((entry) => {
    localFile(root, entry)
    const contentType = MIME[path.extname(entry.path).toLowerCase()]
    if (!contentType) throw new Error(`Unsupported media type: ${entry.path}`)
    const objectKey = `content-media/${entry.sha256}/${path.basename(entry.path)}`
    const oldUrl = '/' + entry.path.slice('public/'.length).split('/').map(encodeURIComponent).join('/')
    const url = base.href.replace(/\/$/, '') + '/' + objectKey.split('/').map(encodeURIComponent).join('/')
    if (`${oldUrl} ${url} 302`.length > 1000) throw new Error('Redirect exceeds Pages line limit')
    return { path: entry.path, bytes: entry.bytes, sha256: entry.sha256, contentType, objectKey, oldUrl, url }
  })
  if (new Set(entries.map((entry) => entry.oldUrl)).size !== entries.length) throw new Error('Duplicate media paths')
  return { version: 1, bucket, entries }
}

export async function verifyMedia(root, plan, fetcher = fetch) {
  for (const entry of plan.entries) {
    if (!entry.objectKey) throw new Error('Invalid media plan entry')
    const { data } = localFile(root, entry)
    const response = await fetcher(entry.url, { redirect: 'error', cache: 'no-store', headers: { Origin: 'https://2aran.com' } })
    if (response.status !== 200) throw new Error(`Remote media unavailable: ${entry.oldUrl} (${response.status})`)
    if (response.headers.get('content-type')?.split(';')[0] !== entry.contentType) throw new Error(`Remote content type mismatch: ${entry.oldUrl}`)
    const cors = response.headers.get('access-control-allow-origin')
    if (!['*','https://2aran.com'].includes(cors)) throw new Error(`Public media CORS missing: ${entry.oldUrl}`)
    const remote = Buffer.from(await response.arrayBuffer())
    if (remote.length !== entry.bytes || sha256(remote) !== entry.sha256) throw new Error(`Remote hash mismatch: ${entry.oldUrl}`)
    if (/\.(mp4|mp3|webm|m4v)$/i.test(entry.path) && data.length >= 16) {
      const partial = await fetcher(entry.url, { redirect: 'error', cache: 'no-store', headers: { Range: 'bytes=0-15' } })
      if (partial.status !== 206 || !Buffer.from(await partial.arrayBuffer()).equals(data.subarray(0,16))) throw new Error(`Range requests unavailable: ${entry.oldUrl}`)
    }
  }
}

function activePaths(root) {
  return { redirects: path.join(root,'public/_redirects'), config: path.join(root,'data/media-redirects.json') }
}
function readOptional(filename) { return fs.existsSync(filename) ? fs.readFileSync(filename,'utf8') : '' }

export async function activateMedia(root, plan, fetcher = fetch) {
  await verifyMedia(root, plan, fetcher)
  const paths = activePaths(root)
  const current = readOptional(paths.redirects)
  if (current.includes(BEGIN) || fs.existsSync(paths.config)) throw new Error('A media migration is already active; rollback it before replacing the plan')
  if (plan.entries.length + current.split('\n').filter((line) => line.trim() && !line.startsWith('#')).length > 2000) throw new Error('Too many Pages redirects')
  for (const entry of plan.entries) {
    if (current.split('\n').some((line) => line.trim().split(/\s+/)[0] === entry.oldUrl)) throw new Error(`Existing redirect owns ${entry.oldUrl}`)
  }
  fs.mkdirSync(path.dirname(paths.config),{recursive:true})
  fs.writeFileSync(paths.config, JSON.stringify({ version:1, entries:plan.entries.map(({oldUrl,url})=>({oldUrl,url})) },null,2)+'\n')
  const block = [BEGIN,...plan.entries.map((entry)=>`${entry.oldUrl} ${entry.url} 302`),END].join('\n')
  fs.writeFileSync(paths.redirects, block+'\n'+current)
}

export async function pruneMedia(root, plan, backupDirectory, { siteUrl = 'https://2aran.com', fetcher = fetch } = {}) {
  const paths = activePaths(root)
  const configured = JSON.parse(readOptional(paths.config) || '{}')
  if (JSON.stringify(configured.entries) !== JSON.stringify(plan.entries.map(({oldUrl,url})=>({oldUrl,url})))) throw new Error('Local redirect configuration does not match the plan')
  const backupRoot = path.resolve(backupDirectory)
  if (backupRoot === path.resolve(root,'public') || backupRoot.startsWith(path.resolve(root,'public') + path.sep)) throw new Error('Backups must be outside public/')
  await verifyMedia(root, plan, fetcher)
  for (const entry of plan.entries) {
    const response = await fetcher(new URL(entry.oldUrl,siteUrl), { redirect:'manual',cache:'no-store' })
    if (response.status !== 302 || new URL(response.headers.get('location') || '',siteUrl).href !== entry.url) throw new Error(`Old URL has not switched: ${entry.oldUrl}`)
  }
  // Back up every file before removing any of them. A partial failure remains recoverable.
  for (const entry of plan.entries) {
    const { data } = localFile(root,entry)
    const backup = path.join(backupDirectory,entry.sha256)
    fs.mkdirSync(backupDirectory,{recursive:true})
    const realBackup = fs.realpathSync(backupDirectory)
    const realPublic = fs.realpathSync(path.join(root,'public'))
    if (realBackup === realPublic || realBackup.startsWith(realPublic + path.sep)) throw new Error('Backups must be outside public/')
    if (fs.existsSync(backup) && sha256(fs.readFileSync(backup)) !== entry.sha256) throw new Error('Backup hash mismatch')
    fs.writeFileSync(backup,data)
  }
  for (const entry of plan.entries) fs.unlinkSync(path.join(root,entry.path))
}

export function rollbackMedia(root, plan, backupDirectory) {
  for (const entry of plan.entries) {
    if (!entry.objectKey) throw new Error('Invalid media plan entry')
    validateEntry(entry)
    const filename = path.join(fs.realpathSync(root),entry.path)
    if (fs.existsSync(filename)) { localFile(root,entry); continue }
    const backup = fs.readFileSync(path.join(backupDirectory,entry.sha256))
    if (sha256(backup) !== entry.sha256) throw new Error('Backup hash mismatch')
    let ancestor = path.dirname(filename)
    while (!fs.existsSync(ancestor)) ancestor = path.dirname(ancestor)
    if (fs.realpathSync(ancestor) !== ancestor) throw new Error('Symlinks are not supported')
    fs.mkdirSync(path.dirname(filename),{recursive:true}); fs.writeFileSync(filename,backup)
  }
  const paths = activePaths(root)
  const content = readOptional(paths.redirects)
  const block = [BEGIN,...plan.entries.map((entry)=>`${entry.oldUrl} ${entry.url} 302`),END].join('\n')+'\n'
  if (!content.startsWith(block)) throw new Error('Redirect block changed; restore files succeeded, review redirects manually')
  fs.writeFileSync(paths.redirects,content.slice(block.length))
  fs.rmSync(paths.config,{force:true})
}

export function mediaRouteExclusions(entries) {
  // These three namespaces contain static assets only. Feed also has dynamic
  // pages, so exclude its migrated files individually, never /feed/*.
  return [...new Set(entries.map(({oldUrl})=>/^\/(images|videos|audio)\//.test(oldUrl) ? `/${oldUrl.split('/')[1]}/*` : oldUrl))]
}
