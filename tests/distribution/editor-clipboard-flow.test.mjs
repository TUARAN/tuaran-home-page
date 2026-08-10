import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentUrl = new URL(
  '../../app/(site)/components/DistributeContentButton.jsx',
  import.meta.url,
)

async function readComponent() {
  return readFile(componentUrl, 'utf8')
}

function functionBody(source, name, nextName) {
  const start = source.indexOf(`async function ${name}`)
  const end = source.indexOf(`\n  ${nextName}`, start)
  assert.notEqual(start, -1, `${name} should exist`)
  assert.notEqual(end, -1, `${name} should have a readable boundary`)
  return source.slice(start, end)
}

test('CSDN distribution copies Markdown before opening the official editor', async () => {
  const source = await readComponent()
  const body = functionBody(source, 'handleCsdnDistribute', 'function handleDistribute')

  assert.match(source, /CSDN_ARTICLE_COMPOSE_URL = 'https:\/\/editor\.csdn\.net\/md\/'/)
  assert.ok(body.indexOf('copyPlainText(articleDraft)') < body.indexOf("window.open('', 'csdn-article-compose')"))
  assert.ok(body.indexOf("window.open('', 'csdn-article-compose')") < body.indexOf('await copyPromise'))
  assert.doesNotMatch(body, /directPublish|platforms: \['csdn'\]|postMessage/)
})

test('X article distribution starts rich copy before opening the composer', async () => {
  const source = await readComponent()
  const body = functionBody(source, 'handleOwnerArticleDistribute', 'function getLabel')

  assert.ok(body.indexOf('copyRichText({') < body.indexOf("window.open('', 'x-article-compose')"))
  assert.ok(body.indexOf("window.open('', 'x-article-compose')") < body.indexOf('await copyPromise'))
  assert.match(body, /X Articles 编辑器已打开，但正文复制失败/)
})

test('distribution actions expose browser-plugin requirement badges', async () => {
  const source = await readComponent()

  assert.match(source, /需要浏览器插件/)
  assert.match(source, /无需浏览器插件/)
  assert.ok((source.match(/<PluginRequirementBadge \/>/g) || []).length >= 5)
})
