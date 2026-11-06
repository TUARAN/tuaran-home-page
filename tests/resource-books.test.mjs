import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

import { RESOURCE_BOOKS, RESOURCE_BOOK_HREFS } from '../lib/content/resourceBooks.mjs'
import { LIBRARY_BOOKS, LIBRARY_COUNTS, LIBRARY_COLLECTION_COVER } from '../lib/content/libraryCatalog.mjs'
import { PUBLISHED_WORKS } from '../lib/site/publishedWorks.js'

test('书架目录的每本书都有唯一且可打开的站内页面', () => {
  assert.equal(RESOURCE_BOOKS.length, RESOURCE_BOOK_HREFS.size)
  for (const book of RESOURCE_BOOKS) {
    assert.match(book.href, /^\/(resources|tools)\//)
    const route = join(process.cwd(), 'app/(site)', book.href.slice(1))
    assert.ok(
      ['page.jsx', 'page.js', 'page.mdx'].some((file) => existsSync(join(route, file))),
      `${book.href} 缺少页面`,
    )
    assert.ok(book.title && book.kind && book.description, `${book.href} 缺少书籍信息`)
  }
})

test('馆藏把站长作品和外部作者作品明确分开', () => {
  assert.equal(LIBRARY_COUNTS.self + LIBRARY_COUNTS.external, LIBRARY_BOOKS.length)
  assert.deepEqual(LIBRARY_COUNTS, { self: 7, external: 5 })
  const selfCategories = new Set(LIBRARY_BOOKS.filter((book) => book.ownership === 'self').map((book) => book.category))
  assert.deepEqual(selfCategories, new Set(['出版社图书', '电子小册', '指南手册', '其他原创资源']))

  for (const book of LIBRARY_BOOKS) {
    assert.ok(book.credit && book.creditLabel, `${book.href} 缺少作者或来源`)
    if (book.ownership === 'external') {
      assert.equal(book.category, '外部资源书', book.href)
      assert.notEqual(book.credit, '涂阿燃 TUARAN', book.href)
    }
  }
  assert.equal(LIBRARY_BOOKS.find((book) => book.href === '/resources/cz-memoirs')?.credit, '赵长鹏')
  assert.equal(LIBRARY_BOOKS.find((book) => book.href === '/resources/ethereum-whitepaper')?.ownership, 'external')
})

test('馆藏同时收录出版作品和在线书，封面路径可用', () => {
  const all = [...PUBLISHED_WORKS, ...RESOURCE_BOOKS]
  assert.equal(all.length, new Set(all.map((book) => book.href)).size)
  assert.ok(PUBLISHED_WORKS.length > 0)
  assert.ok(RESOURCE_BOOKS.length > 0)
  assert.ok(existsSync(join(process.cwd(), 'public', LIBRARY_COLLECTION_COVER.slice(1))), '阿燃典藏统一封面不存在')
  for (const book of LIBRARY_BOOKS) {
    const cover = book.cover || LIBRARY_COLLECTION_COVER
    assert.ok(existsSync(join(process.cwd(), 'public', cover.slice(1))), `${book.href} 封面不存在`)
  }
  assert.equal(LIBRARY_BOOKS.find((book) => book.href === '/resources/big-interaction-whitepaper')?.cover, undefined, '宣传海报不能冒充封面')
})
