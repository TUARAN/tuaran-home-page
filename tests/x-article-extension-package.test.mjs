import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const extensionRoot = new URL('../tools/x-article-autopublisher-extension/', import.meta.url)

async function read(name) {
  return readFile(new URL(name, extensionRoot), 'utf8')
}

test('X Article 插件是 Manifest V3，并只申请运行所需权限', async () => {
  const manifest = JSON.parse(await read('manifest.json'))
  assert.equal(manifest.manifest_version, 3)
  assert.deepEqual(manifest.permissions.sort(), ['alarms', 'storage', 'tabs'])
  assert.ok(manifest.host_permissions.includes('https://2aran.com/*'))
  assert.ok(manifest.host_permissions.includes('https://x.com/*'))
  assert.ok(manifest.host_permissions.includes('https://*/*'))
  assert.equal(manifest.background.service_worker, 'background.js')
  assert.ok(manifest.content_scripts.some((entry) => entry.world === 'MAIN' && entry.js.includes('main-world.js')))
})

test('自动发布同时具备北京时间定时、补偿重试和当天幂等保护', async () => {
  const source = await read('background.js')
  assert.match(source, /PUBLISH_ALARM/)
  assert.match(source, /periodInMinutes:\s*24 \* 60/)
  assert.match(source, /retryMinutes/)
  assert.match(source, /state\.successDate === clock\.date/)
  assert.match(source, /state\.status === "uncertain"/)
  assert.match(source, /https:\/\/x\.com\/compose\/articles/)
})

test('文章抽取保留安全链接、基础排版和图片位置', async () => {
  const siteSource = await read('site-content.js')
  assert.match(siteSource, /\["http:", "https:"\]/)
  assert.match(siteSource, /setAttribute\("href", href\)/)
  assert.match(siteSource, /H\[2-4\]/)
  assert.match(siteSource, /2ARAN_IMAGE_/)
  assert.match(siteSource, /images\.slice\(0, 20\)/)
})

test('X 编辑器兼容 Draft.js 的文章输入框', async () => {
  const source = await read('x-content.js')
  assert.match(source, /public-DraftEditor-content/)
  assert.match(source, /data-contents='true'/)
  assert.match(source, /execCommand\("insertText"/)
})

test('图片经后台下载后调用 X 自身上传处理器，并校验上传数量', async () => {
  const background = await read('background.js')
  const mainWorld = await read('main-world.js')
  const isolated = await read('x-content.js')
  assert.match(background, /prepareImages/)
  assert.match(background, /8 \* 1024 \* 1024/)
  assert.match(mainWorld, /onFilesAdded/)
  assert.match(mainWorld, /mediaState/)
  assert.match(mainWorld, /mediaIdFromData/)
  assert.match(mainWorld, /X_IMAGE_UPLOAD_TIMEOUT/)
  assert.match(isolated, /uploadedImages/)
  assert.match(isolated, /X_IMAGE_COUNT_MISMATCH/)
})
