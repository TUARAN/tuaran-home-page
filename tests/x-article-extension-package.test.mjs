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
  assert.match(siteSource, /links\.push\(\{ offset: start, length, url \}\)/)
  assert.match(siteSource, /header-/)
  assert.match(siteSource, /unordered-list-item/)
  assert.match(siteSource, /blockquote/)
  assert.match(siteSource, /2ARAN_IMAGE_/)
  assert.match(siteSource, /images\.length >= 20/)
  assert.match(siteSource, /document\.querySelector\("article\.prose-tuaran"\)\s*\n\s*\|\|/)
  assert.match(siteSource, /node\.closest\(EXCLUDE_SELECTOR\)/)
  assert.match(siteSource, /isGeneratedTocItem/)
  assert.match(siteSource, /isSamePageHashLink/)
  assert.match(siteSource, /\.toc-scroll-panel/)
  assert.doesNotMatch(siteSource, /querySelector\("article\.prose-tuaran, \.prose-tuaran, main article, main"\)/)
  assert.doesNotMatch(siteSource, /main > figure img, main > div > img/)
})

test('X 编辑器兼容 Draft.js 的文章输入框', async () => {
  const source = await read('x-content.js')
  assert.match(source, /public-DraftEditor-content/)
  assert.match(source, /data-contents='true'/)
  assert.match(source, /execCommand\("insertText"/)
})

test('设置页只有一个保存并检查按钮，并持久保留领取密钥', async () => {
  const html = await read('popup.html')
  const source = await read('popup.js')
  assert.doesNotMatch(html, /id="save"/)
  assert.match(html, /保存并立即检查/)
  assert.match(source, /extensionSecret/)
  assert.match(source, /saved\.extensionSecret \|\| saved\.settings\?\.secret/)
  assert.match(source, /type: "run-now"/)
})

test('图片经后台下载后调用 X 自身上传处理器，并校验上传数量', async () => {
  const background = await read('background.js')
  const mainWorld = await read('main-world.js')
  const isolated = await read('x-content.js')
  assert.match(background, /prepareImages/)
  assert.match(background, /8 \* 1024 \* 1024/)
  assert.match(background, /blocks: article\.blocks/)
  assert.match(background, /images: article\.images/)
  assert.match(background, /findReusableDraft/)
  assert.match(mainWorld, /fileInput/)
  assert.match(mainWorld, /writeDraftBlocks/)
  assert.match(mainWorld, /mediaIdFromData/)
  assert.match(mainWorld, /X_IMAGE_UPLOAD_TIMEOUT/)
  assert.match(mainWorld, /relocateUploadedMedia/)
  assert.match(mainWorld, /validateFinalLayout/)
  assert.match(mainWorld, /X_IMAGE_MARKER_REMAINED/)
  assert.match(isolated, /uploadedImages/)
  assert.match(isolated, /X_IMAGE_COUNT_MISMATCH/)
})

test('插件已接入浏览器扩展集合、工具库和独立下载介绍页', async () => {
  const manifest = JSON.parse(await read('manifest.json'))
  const workItems = await readFile(new URL('../lib/workItems.js', import.meta.url), 'utf8')
  const toolItems = await readFile(new URL('../lib/toolItems.js', import.meta.url), 'utf8')
  const catalog = await readFile(new URL('../lib/resourceCatalog.js', import.meta.url), 'utf8')
  const registry = await readFile(new URL('../lib/contentRegistry.js', import.meta.url), 'utf8')
  const sitemap = await readFile(new URL('../app/(site)/sitemap.js', import.meta.url), 'utf8')
  const resourcePage = await readFile(
    new URL('../app/(site)/resources/x-article-autopublisher-extension/page.jsx', import.meta.url),
    'utf8',
  )

  for (const source of [workItems, toolItems, catalog, registry, sitemap]) {
    assert.match(source, /x-article-autopublisher-extension/)
  }
  assert.match(catalog, new RegExp(`x-article-autopublisher-extension-v${manifest.version.replaceAll('.', '\\.')}\\.zip`))
  assert.ok(resourcePage.includes(`const VERSION = '${manifest.version}'`))
  assert.match(resourcePage, /领取密钥有什么用/)
  assert.match(resourcePage, /Chrome 需要保持运行/)
})
