import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const extensionDir = new URL('../../tools/oa-batch-submit-extension/', import.meta.url)

test('extension, resource page and catalog use one release identity', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', extensionDir), 'utf8'))
  const page = await readFile(new URL('../../app/(site)/resources/protal-todo-assistant/page.jsx', import.meta.url), 'utf8')
  const catalog = await readFile(new URL('../../lib/resourceCatalog.js', import.meta.url), 'utf8')

  assert.equal(manifest.manifest_version, 3)
  assert.equal(manifest.name, 'protal待办处理助手')
  assert.equal(manifest.version, '0.2.0')
  assert.deepEqual(manifest.permissions, ['activeTab', 'debugger', 'scripting', 'storage'])
  assert.match(page, /protal待办处理助手/)
  assert.match(page, /免费下载安装插件 v\{VERSION\}|免费下载插件 v\{VERSION\}/)
  assert.match(catalog, /resource:protal-todo-assistant/)
  assert.match(catalog, /protal-todo-assistant-extension-v0\.2\.0\.zip/)
});

test('package script keeps the installable extension payload explicit', async () => {
  const script = await readFile(new URL('../../scripts/build-protal-todo-assistant-extension.mjs', import.meta.url), 'utf8')
  for (const file of ['manifest.json', 'background.js', 'automation-core.js', 'canvas-vision.js', 'content.js', 'README.md']) {
    assert.match(script, new RegExp(file.replace('.', '\\.')))
  }
  assert.doesNotMatch(script, /automation-core\.test/)
  assert.doesNotMatch(script, /DESIGN\.md/)
});

test('site registries expose the assistant as a downloadable tool resource', async () => {
  const [tools, content, pages, nav] = await Promise.all([
    readFile(new URL('../../lib/toolItems.js', import.meta.url), 'utf8'),
    readFile(new URL('../../lib/contentRegistry.js', import.meta.url), 'utf8'),
    readFile(new URL('../../lib/staticPageRegistry.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../../lib/siteNav.js', import.meta.url), 'utf8'),
  ])

  for (const source of [tools, content, pages, nav]) assert.match(source, /\/resources\/protal-todo-assistant/)
  assert.match(tools, /downloadType: 'extension'/)
  assert.match(tools, /sourcePath: 'tools\/oa-batch-submit-extension'/)
});

test('automation keeps the supplied stable selectors and stop controls', async () => {
  const [core, content, background] = await Promise.all([
    readFile(new URL('automation-core.js', extensionDir), 'utf8'),
    readFile(new URL('content.js', extensionDir), 'utf8'),
    readFile(new URL('background.js', extensionDir), 'utf8'),
  ])

  assert.match(core, /\.title\.oneLine/)
  assert.match(core, /onekeySubmit/)
  assert.match(core, /\.onekey-submit-button/)
  assert.match(content, /单步一条/)
  assert.match(content, /正在安全停止/)
  assert.match(content, /document\.hidden/)
  assert.match(content, /PROTAL_CAPTURE_VISIBLE_TAB/)
  assert.match(content, /校准 Canvas/)
  assert.match(background, /Input\.dispatchMouseEvent/)
  assert.match(background, /captureVisibleTab/)
  assert.match(background, /canvas-vision\.js/)
});
