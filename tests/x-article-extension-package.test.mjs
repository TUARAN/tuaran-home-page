import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

import { STATIC_PAGE_REGISTRY } from '../lib/staticPageRegistry.mjs'

const extensionRoot = new URL('../tools/x-article-autopublisher-extension/', import.meta.url)

async function read(name) {
  return readFile(new URL(name, extensionRoot), 'utf8')
}

async function loadFormatCore() {
  const context = { URL }
  context.self = context
  vm.runInNewContext(await read('format-core.js'), context)
  return context.XArticleFormat
}

test('X Article 插件是 Manifest V3，并只申请运行所需权限', async () => {
  const manifest = JSON.parse(await read('manifest.json'))
  assert.equal(manifest.manifest_version, 3)
  assert.deepEqual(manifest.permissions.sort(), ['alarms', 'storage', 'tabs'])
  assert.ok(manifest.host_permissions.includes('https://2aran.com/*'))
  assert.ok(manifest.host_permissions.includes('https://x.com/*'))
  assert.ok(manifest.host_permissions.includes('https://*/*'))
  assert.equal(manifest.background.service_worker, 'background.js')
  assert.ok(manifest.content_scripts.every((entry) => entry.js[0] === 'format-core.js'))
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
  assert.match(siteSource, /MAX_IMAGES = 20/)
  assert.match(siteSource, /images\.length >= MAX_IMAGES/)
  assert.match(siteSource, /renderTableImage/)
  assert.match(siteSource, /renderMermaidImage/)
  assert.match(siteSource, /data-mermaid-diagram/)
  assert.match(siteSource, /tableMode/)
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
  const mainWorld = await read('main-world.js')
  assert.match(source, /public-DraftEditor-content/)
  assert.match(source, /data-contents='true'/)
  assert.match(source, /execCommand\("insertText"/)
  assert.match(mainWorld, /depth:/)
  assert.match(mainWorld, /validateInlineFormatting/)
  assert.match(mainWorld, /X_INLINE_STYLE_MISMATCH/)
  assert.match(mainWorld, /X_LINK_MISMATCH/)
})

test('设置页只有一个保存并检查按钮，并持久保留领取密钥', async () => {
  const html = await read('popup.html')
  const source = await read('popup.js')
  assert.doesNotMatch(html, /id="save"/)
  assert.match(html, /保存并立即检查/)
  assert.match(source, /extensionSecret/)
  assert.match(source, /saved\.extensionSecret \|\| saved\.settings\?\.secret/)
  assert.match(source, /type: "run-now"/)
  assert.match(html, /id="table-mode"/)
  assert.match(html, /id="review"/)
})

test('上传前生成可审计交接包并拒绝结构不完整的文章', async () => {
  const background = await read('background.js')
  const core = await read('format-core.js')
  assert.match(background, /importScripts\("format-core\.js"\)/)
  assert.match(background, /reviewArticle/)
  assert.match(background, /review:/)
  assert.match(core, /ARTICLE_IMAGE_MARKER_MISMATCH/)
  assert.match(core, /ARTICLE_INLINE_RANGE_INVALID/)
  assert.match(core, /ARTICLE_LINK_URL_UNSAFE/)
})

test('交接包保留换行与列表层级，并核对图片标记和安全链接', async () => {
  const format = await loadFormatCore()
  const valid = format.reviewArticle({
    title: '测试文章',
    blocks: [
      { type: 'ordered-list-item', depth: 2, text: '第一行\r\n第二行', inlineStyleRanges: [], links: [] },
      { type: 'unstyled', text: '[[2ARAN_IMAGE_0]]', inlineStyleRanges: [], links: [] },
    ],
    images: [{ marker: '[[2ARAN_IMAGE_0]]' }],
  })
  assert.equal(valid.ok, true)
  assert.equal(valid.article.blocks[0].depth, 2)
  assert.equal(valid.article.blocks[0].text, '第一行\n第二行')

  const invalid = format.reviewArticle({
    title: '测试文章',
    blocks: [{ type: 'unstyled', text: '危险链接', links: [{ offset: 0, length: 4, url: 'javascript:alert(1)' }] }],
    images: [{ marker: '[[2ARAN_IMAGE_0]]' }],
  })
  assert.equal(invalid.ok, false)
  assert.ok(invalid.errors.some((error) => error.startsWith('ARTICLE_LINK_URL_UNSAFE')))
  assert.ok(invalid.errors.includes('ARTICLE_IMAGE_MARKER_MISMATCH'))
})

test('图片经后台下载后调用 X 自身上传处理器，并校验上传数量', async () => {
  const background = await read('background.js')
  const mainWorld = await read('main-world.js')
  const isolated = await read('x-content.js')
  const siteSource = await read('site-content.js')
  assert.match(background, /prepareImages/)
  assert.match(background, /prepareImage/)
  assert.match(background, /skippedImages/)
  assert.match(background, /SOURCE_UNAVAILABLE/)
  assert.match(background, /ARTICLE_IMAGE_FETCH_FAILED/)
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
  assert.match(siteSource, /sources/)
  assert.match(siteSource, /wsrv\.nl/)
  assert.match(siteSource, /\/_next\/image/)
})

test('插件已接入统一工具目录和独立下载介绍页', async () => {
  const manifest = JSON.parse(await read('manifest.json'))
  const workItems = await readFile(new URL('../lib/downloadItems.js', import.meta.url), 'utf8')
  const toolItems = await readFile(new URL('../lib/toolItems.js', import.meta.url), 'utf8')
  const catalog = await readFile(new URL('../lib/resourceCatalog.js', import.meta.url), 'utf8')
  const registry = await readFile(new URL('../lib/contentRegistry.js', import.meta.url), 'utf8')
  const resourcePage = await readFile(
    new URL('../app/(site)/resources/x-article-autopublisher-extension/page.jsx', import.meta.url),
    'utf8',
  )

  assert.match(workItems, /\.\/toolItems\.js/)
  for (const source of [toolItems, catalog, registry]) {
    assert.match(source, /x-article-autopublisher-extension/)
  }
  assert.ok(STATIC_PAGE_REGISTRY.some((entry) => entry.path === '/resources/x-article-autopublisher-extension' && entry.sitemap))
  assert.match(catalog, new RegExp(`x-article-autopublisher-extension-v${manifest.version.replaceAll('.', '\\.')}\\.zip`))
  assert.ok(resourcePage.includes(`const VERSION = '${manifest.version}'`))
  assert.match(resourcePage, /领取密钥有什么用/)
  assert.match(resourcePage, /Chrome 需要保持运行/)
})
