import {
  CZ_MEMOIR_CHAPTER_GROUPS,
  CZ_MEMOIR_COVER,
  CZ_MEMOIR_FIRST_CHAPTER_SLUG,
  czMemoirChapterPath,
} from '../../../../lib/czMemoirs'
import CzMemoirChapterView from './CzMemoirChapterView'

export const dynamic = 'force-static'

const RESOURCE_PATH = '/resources/cz-memoirs'
const RESOURCE_URL = `https://2aran.com${RESOURCE_PATH}`
const REPOSITORY_URL = 'https://github.com/TUARAN/cz_memoirs'
const TITLE = '赵长鹏自传《币安人生》在线阅读｜CZ 回忆录简体中文版'
const DESCRIPTION =
  '赵长鹏（CZ）自传《币安人生》简体中文全文：从江苏农村、加拿大求学、东京程序员到创立币安，并经历监管风暴、美国司法部谈判、入狱与特赦。'

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    '赵长鹏自传',
    '币安人生',
    'CZ 回忆录',
    '赵长鹏回忆录',
    '币安创始人',
    '币安历史',
    '加密货币创业',
    '简体中文版',
    '在线阅读',
  ],
  alternates: { canonical: RESOURCE_PATH },
  openGraph: {
    type: 'book',
    locale: 'zh_CN',
    siteName: '2aran.com',
    title: '《币安人生》：赵长鹏（CZ）自传简体中文版',
    description: DESCRIPTION,
    url: RESOURCE_URL,
    images: [
      {
        url: `https://2aran.com${CZ_MEMOIR_COVER}`,
        width: 1200,
        height: 1600,
        alt: '赵长鹏自传《币安人生》封面',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '赵长鹏自传《币安人生》在线阅读',
    description: '从江苏农村到创立币安，再到监管风暴、入狱与特赦：CZ 回忆录简体中文全文。',
    images: [`https://2aran.com${CZ_MEMOIR_COVER}`],
  },
}

const chapterGroups = CZ_MEMOIR_CHAPTER_GROUPS

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Book',
      '@id': `${RESOURCE_URL}#book`,
      name: '币安人生',
      alternateName: ['CZ 回忆录', '赵长鹏自传'],
      author: { '@type': 'Person', name: '赵长鹏', alternateName: 'CZ' },
      inLanguage: 'zh-CN',
      image: `https://2aran.com${CZ_MEMOIR_COVER}`,
      url: RESOURCE_URL,
      isBasedOn: REPOSITORY_URL,
    },
    {
      '@type': 'WebPage',
      '@id': `${RESOURCE_URL}#page`,
      name: TITLE,
      description: DESCRIPTION,
      url: RESOURCE_URL,
      inLanguage: 'zh-CN',
      datePublished: '2026-09-15',
      dateModified: '2026-09-19',
      about: { '@id': `${RESOURCE_URL}#book` },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: chapterGroups.reduce((count, group) => count + group.chapters.length, 0),
        itemListElement: chapterGroups.flatMap((group) =>
          group.chapters.map(([name, slug], index) => ({
            '@type': 'ListItem',
            position:
              chapterGroups
                .slice(0, chapterGroups.indexOf(group))
                .reduce((count, item) => count + item.chapters.length, 0) +
              index +
              1,
            name,
            url: `https://2aran.com${czMemoirChapterPath(slug)}`,
          })),
        ),
      },
    },
  ],
}

export default function CzMemoirsResourcePage() {
  return <CzMemoirChapterView slug={CZ_MEMOIR_FIRST_CHAPTER_SLUG} jsonLd={jsonLd} />
}
