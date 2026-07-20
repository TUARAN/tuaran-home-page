import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('nano banana is registered only as a rich page', async () => {
  const [works, resources, registry] = await Promise.all([
    read('lib/engineeringWorks.js'),
    read('lib/homeResourceItems.js'),
    read('lib/contentRegistry.js'),
  ])

  assert.match(works, /id: 'nano-banana-gallery'[\s\S]*category: 'ai-engineering'[\s\S]*href: '\/nano-banana-gallery'/)
  assert.doesNotMatch(resources, /href: '\/resources\/nano-banana-gallery'/)
  assert.doesNotMatch(registry, /category: 'resource', slug: 'nano-banana-gallery'/)
  assert.match(registry, /category: 'rich-page', slug: 'nano-banana-gallery'[\s\S]*href: '\/nano-banana-gallery'/)
  assert.match(registry, /'rich-page': '多维页面'/)
  assert.match(registry, /new Set\(\['resource', 'feed', 'rich-page'\]\)/)
})

test('rich-page engagement keys resolve to the canonical route', async () => {
  const [pipeline, articleLinks, keyLite] = await Promise.all([
    read('lib/contentPipeline.js'),
    read('lib/articleLinks.js'),
    read('lib/contentKeyLite.js'),
  ])

  assert.match(pipeline, /'rich-page': '多维页面'/)
  assert.match(articleLinks, /CONTENT_PV_CATEGORIES\.has\(category\)/)
  assert.match(keyLite, /key\.startsWith\('rich-page:'\)/)
  assert.match(keyLite, /return slug \? `\/\$\{slug\}` : null/)
})
