import { PUBLISHED_WORKS } from '../site/publishedWorks.js'
import { RESOURCE_BOOKS } from './resourceBooks.mjs'

const SITE_AUTHOR = '涂阿燃 TUARAN'
export const LIBRARY_COLLECTION_COVER = '/images/books/aran-collection-cover.jpg'

export const LIBRARY_BOOKS = [
  ...PUBLISHED_WORKS.map((work) => ({
    href: work.href,
    title: work.title.replace(/[《》]/g, ''),
    kind: work.type,
    category: work.type === '电子小册' ? '电子小册' : '出版社图书',
    ownership: 'self',
    creditLabel: '作者',
    credit: work.author || SITE_AUTHOR,
    publisher: work.publisher,
    publisherLabel: work.type === '电子小册' ? '发布平台' : '出版社',
    description: work.description,
    cover: work.image,
    action: '查看作品详情',
  })),
  ...RESOURCE_BOOKS.map((book) => ({
    ...book,
    category: book.ownership === 'external' ? '外部资源书' : book.kind === '使用手册' ? '指南手册' : '其他原创资源',
    creditLabel: book.ownership === 'external' ? book.sourceLabel : '作者',
    credit: book.ownership === 'external' ? book.source : SITE_AUTHOR,
    action: '在线阅读',
  })),
]

export const LIBRARY_COUNTS = {
  self: LIBRARY_BOOKS.filter((book) => book.ownership === 'self').length,
  external: LIBRARY_BOOKS.filter((book) => book.ownership === 'external').length,
}
