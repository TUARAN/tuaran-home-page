import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'

test('站长转发忽略旧领取密钥，使用插件密钥领取且不再保存独立密钥', async () => {
  const source = await readFile(new URL('../tools/x-reply-clipboard-extension/siteForward.js', import.meta.url), 'utf8')
  const data = { xrcSiteForwardSettings: { secret: 'obsolete', tableMode: 'text' } }
  const requests = []
  const context = vm.createContext({
    Intl, Date, console,
    chrome: { storage: { local: {
      get: async key => ({ [key]: data[key] }),
      set: async patch => Object.assign(data, patch),
    } } },
    XrcCommunityReceipt: { readSecret: async () => 'bundled-plugin-key' },
    fetch: async (url, options) => {
      requests.push(options)
      return { ok: true, json: async () => ({ ok: true, done: true }) }
    },
  })
  vm.runInContext(source, context)
  assert.equal((await context.XrcSiteForward.readSettings()).secret, 'bundled-plugin-key')
  await context.XrcSiteForward.writeSettings({ tableMode: 'image', secret: 'ignored' })
  assert.equal(data.xrcSiteForwardSettings.secret, undefined)
  await context.XrcSiteForward.run({ force: true, workTabId: 1 })
  assert.equal(requests[0].headers['x-community-action-secret'], 'bundled-plugin-key')
  assert.equal(requests[0].headers['x-x-article-extension-secret'], undefined)
})

test('任务接口接受有效插件密钥，拒绝失效密钥，并兼容旧插件', async () => {
  const source = await readFile(new URL('../app/api/x-article-extension/task/route.js', import.meta.url), 'utf8')
  const authorizeSource = source.slice(source.indexOf('async function authorize('), source.indexOf('export async function GET'))
  const context = vm.createContext({
    Response,
    COMMUNITY_ACTION_SECRET_HEADER: 'x-community-action-secret',
    X_ARTICLE_SECRET_HEADER: 'x-x-article-extension-secret',
    authorizeCommunitySecret: async (db, key) => key === 'valid' ? { ok: true } : { ok: false, error: 'UNAUTHORIZED', status: 401 },
  })
  vm.runInContext(authorizeSource, context)
  const req = headers => ({ headers: new Headers(headers) })
  assert.equal(await context.authorize(req({ 'x-community-action-secret': 'valid' }), '', {}), null)
  assert.equal((await context.authorize(req({ 'x-community-action-secret': 'revoked' }), '', {})).status, 401)
  assert.equal(await context.authorize(req({ 'x-x-article-extension-secret': 'legacy' }), 'legacy', {}), null)
  assert.equal((await context.authorize(req({}), 'legacy', {})).status, 401)
})
