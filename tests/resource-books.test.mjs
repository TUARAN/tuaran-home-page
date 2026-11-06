import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

import { RESOURCE_BOOKS, RESOURCE_BOOK_HREFS } from '../lib/content/resourceBooks.mjs'
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

test('馆藏同时收录出版作品和在线书，封面路径可用', () => {
  const all = [...PUBLISHED_WORKS, ...RESOURCE_BOOKS]
  assert.equal(all.length, new Set(all.map((book) => book.href)).size)
  assert.ok(PUBLISHED_WORKS.length > 0)
  assert.ok(RESOURCE_BOOKS.length > 0)
  for (const book of all) {
    if (book.image || book.cover) {
      assert.ok(existsSync(join(process.cwd(), 'public', (book.image || book.cover).slice(1))), `${book.href} 封面不存在`)
    }
  }
})
