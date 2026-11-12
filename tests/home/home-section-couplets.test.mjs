import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

import { DIARY_SERIES_COUPLET } from '../../lib/diary/diarySeries.mjs'
import { HOME_SECTION_COUPLETS } from '../../lib/home/homeSectionCouplets.mjs'

const root = new URL('../../', import.meta.url)

function read(relativePath) {
  return readFileSync(new URL(relativePath, root), 'utf8')
}

function walk(relativeDir, files = []) {
  const absolute = new URL(relativeDir, root)
  for (const name of readdirSync(absolute)) {
    const relative = `${relativeDir}${name}`
    const info = statSync(new URL(relative, root))
    if (info.isDirectory()) {
      walk(`${relative}/`, files)
      continue
    }
    if (/\.(js|jsx|mjs|css)$/.test(name)) files.push(relative)
  }
  return files
}

const sourceFiles = [...walk('app/'), ...walk('lib/')]
const sources = Object.fromEntries(sourceFiles.map((file) => [file, read(file)]))

function countText(text) {
  return sourceFiles.reduce((total, file) => total + (sources[file].split(text).length - 1), 0)
}

const EXPECTED = {
  articles: '新知如潮，旧业未央，却不道学无止境，笔有余情。',
  books: '案头一卷，心血所凝，却不道著书立言，传与后来。',
  opinion: '众说纷纭，潮起潮落，却不道热点易逝，见识长存。',
  rss: '博观约取，他山攻玉，却不道开卷有益，择善而从。',
  inspirations: '灵光偶得，触处生春，却不道吉光片羽，亦可成篇。',
  openSource: '一技之长，公之于众，却不道修修补补，亦是修行。',
  profile: '日复一日，岁不我与，却不道二十年事，只此一件。',
  resetCalendar: '寒来暑往，周而复始，却不道时辰一到，再起新程。',
  platforms: '言路多门，各有听者，却不道同声相应，自有同气。',
  explore: '径路纷然，门庭自开，却不道一站虽小，天地颇宽。',
  contact: '远近无碍，一讯可通，却不道有缘来访，便是开始。',
  downloads: '善事利器，取用随心，却不道工具在手，事已近半。',
}

const PLACEMENTS = [
  ['app/(site)/components/HomeFeaturedReadingClient.jsx', 'articles', 2],
  ['app/(site)/components/HomeWorkCards.jsx', 'books', 1],
  ['app/(site)/components/HomeOpinionSignals.jsx', 'opinion', 2],
  ['app/(site)/components/HomeRuanYifengFeed.jsx', 'rss', 1],
  ['app/(site)/components/HomePrimaryColumnsClient.jsx', 'inspirations', 1],
  ['app/(site)/components/HomeWorkCards.jsx', 'openSource', 1],
  ['app/(site)/page.jsx', 'profile', 1],
  ['app/(site)/components/HomeCodexResetCard.jsx', 'resetCalendar', 1],
  ['app/(site)/page.jsx', 'platforms', 1],
  ['app/(site)/components/HomeDiscoveryPanel.jsx', 'explore', 1],
  ['app/(site)/page.jsx', 'contact', 1],
  ['app/(site)/components/HomeWorkCards.jsx', 'downloads', 1],
]

test('homepage section lines use the confirmed wording once', () => {
  assert.deepEqual(HOME_SECTION_COUPLETS, EXPECTED)
  assert.equal(Object.keys(HOME_SECTION_COUPLETS).length, 12)
  for (const text of Object.values(EXPECTED)) {
    assert.equal(countText(text), 1, text)
    assert.match(text, /^[^，]{4}，[^，]{4}，却不道[^，]{4}，[^。]{4}。$/)
  }
  assert.equal(EXPECTED.opinion.includes('纷纭'), true)
  assert.equal(EXPECTED.opinion.includes('纷纷'), false)
  assert.equal(sources['lib/home/homeSectionCouplets.mjs'].includes('人生碌碌'), false)
  assert.equal(sources['lib/home/homeSectionCouplets.mjs'].includes('碇碇'), false)
})

test('diary couplet stays the existing line and is not added again', () => {
  assert.equal(DIARY_SERIES_COUPLET, '人生碌碌，竞短论长，却不道枯荣有数，得失难量。')
  assert.deepEqual(
    sourceFiles.filter((file) => sources[file].includes(DIARY_SERIES_COUPLET)).sort(),
    [
      'app/(site)/articles/articlesData.js',
      'lib/article/articleMetadata.js',
      'lib/diary/diarySeries.mjs',
    ],
  )
  assert.equal(countText('人生碇碇'), 0)
  const diaryCard = sources['app/(site)/components/HomeDiarySeries.jsx']
  const diaryPage = sources['app/(site)/diary/page.jsx']
  assert.equal((diaryCard.match(/\{preview\.couplet\}/g) || []).length, 1)
  assert.match(diaryCard, /<p className="home-section-description">\{preview\.couplet\}<\/p>/)
  assert.equal(diaryCard.includes('diary-sheet-couplet'), false)
  assert.equal(diaryCard.includes('{preview.note}'), false)
  assert.equal(diaryCard.includes('HomeSectionCouplet'), false)
  assert.equal(sources['app/(site)/page.jsx'].includes('HomeSectionCouplet section="diary"'), false)
  assert.equal((diaryPage.match(/\{DIARY_SERIES_COUPLET\}/g) || []).length, 1)
  assert.equal(diaryPage.includes('HomeSectionCouplet'), false)
})

test('each homepage section renders its line under the existing title', () => {
  const seen = []
  for (const [file, section, count] of PLACEMENTS) {
    const matches = sources[file].match(new RegExp(`section="${section}"`, 'g')) || []
    assert.equal(matches.length, count, `${file} ${section}`)
    seen.push(...Array.from({ length: count }, () => section))
  }
  assert.deepEqual(seen.sort(), [
    'articles', 'articles',
    'books',
    'contact',
    'downloads',
    'explore',
    'inspirations',
    'openSource',
    'opinion', 'opinion',
    'platforms',
    'profile',
    'resetCalendar',
    'rss',
  ])

  const featured = sources['app/(site)/components/HomeFeaturedReadingClient.jsx']
  const opinion = sources['app/(site)/components/HomeOpinionSignals.jsx']
  assert.equal(featured.includes('section="articles"'), true)
  assert.equal(featured.slice(featured.indexOf('更多观察')).includes('HomeSectionCouplet'), false)
  assert.match(featured, /md:hidden">\s*<HomeSectionCouplet section="articles" \/>/)
  assert.match(opinion, /className="mb-3 md:hidden"/)
  assert.match(opinion, /md:hidden">\s*<p className="text-sm leading-6 text-\[var\(--site-muted\)\]">/)
})

test('existing captions, kicker, wechat id, and owner line stay in place', () => {
  const featured = sources['app/(site)/components/HomeFeaturedReadingClient.jsx']
  const opinion = sources['app/(site)/components/HomeOpinionSignals.jsx']
  const works = sources['app/(site)/components/HomeWorkCards.jsx']
  const page = sources['app/(site)/page.jsx']
  const couplet = sources['app/(site)/components/HomeSectionCouplet.jsx']

  assert.match(featured, /AI 智能体、前端工程、开源实践与著作/)
  assert.match(opinion, /热点事件、公开讨论与观点变化/)
  assert.match(works, /OpenClaw · \{OPENCLAW_ACHIEVEMENT_COUNT\} merged/)
  assert.match(page, /输入决定输出，输出暴露输入/)
  assert.match(page, /项目合作、产品交流，加微信/)
  assert.match(page, /主要平台 · \$\{SOCIAL_MEDIA_TOTALS\.followers\} 关注/)
  assert.match(sources['lib/site/contactChannels.js'], /value: 'atar24'/)
  assert.equal(couplet.includes('<T'), false)
  assert.equal(couplet.includes('diary-sheet-couplet'), false)
  assert.match(couplet, /lang="zh-CN"/)
})

test('section line style stays on the homepage palette', () => {
  const css = sources['app/globals.css']
  assert.match(css, /\.home-section-couplet \{[\s\S]*font-serif[\s\S]*color: var\(--site-ink\);/)
  assert.match(css, /\.home-contact-panel \.home-section-couplet \{[\s\S]*color: var\(--site-ink\);/)
  const coupletRule = css.slice(css.indexOf('.home-section-couplet {'), css.indexOf('.home-primary-heading .home-section-more'))
  assert.equal(coupletRule.includes('#3d3428'), false)
  assert.equal(coupletRule.includes('#241c14'), false)
  assert.equal(coupletRule.includes('diary-sheet'), false)
  assert.match(
    css,
    /:root\[data-ui='classic'\] \.home-section-title,\s*:root\[data-ui='classic'\] \.home-contact-panel h2,\s*:root\[data-ui='classic'\] \.home-section-couplet \{\s*font-family: "Songti SC", "STSong", "Noto Serif SC", "Source Han Serif SC", Georgia, serif;/,
  )
})
