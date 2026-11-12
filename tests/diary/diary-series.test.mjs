import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { diaryContentFromMarkdown, legacyArticleToMarkdown } from '../../lib/article/legacyArticleMigration.mjs'
import {
  DIARY_ORAL_SOURCE_NOTE,
  DIARY_SERIES_STARTED_ON,
  DIARY_SERIES_TITLE,
  earliestDiaryDate,
  previewFromDiary,
  selectDiarySeries,
} from '../../lib/diary/diarySeries.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))

function legacyArticles() {
  const filename = path.join(root, 'app/(site)/articles/articlesData.js')
  const source = fs.readFileSync(filename, 'utf8').replace(
    /^import (\w+) from '([^']+\.json)'\s*$/gm,
    (_, name, relative) => `const ${name} = ${fs.readFileSync(path.resolve(path.dirname(filename), relative), 'utf8')};`,
  ).replace('export const articles =', 'const articles =')
  return JSON.parse(vm.runInNewContext(`${source}\nJSON.stringify(articles)`))
}

function diaryArticle() {
  return legacyArticles().find((article) => article.slug === 'diary-self-reflection')
}

function shockEntry(article) {
  const index = article.content.findIndex((block) => block?.label === '异世界的冲击')
  assert.ok(index >= 0)
  const blocks = []
  for (let cursor = index + 1; cursor < article.content.length; cursor += 1) {
    const block = article.content[cursor]
    if (block && typeof block === 'object' && block.date) break
    blocks.push(block)
  }
  return { heading: article.content[index], blocks }
}

test('浮生日记 starts on the earliest timeline entry and keeps that framing', () => {
  const article = diaryArticle()
  const founder = article.content.find((block) => block?.label === '工程型创作者')
  assert.equal(earliestDiaryDate(article), DIARY_SERIES_STARTED_ON)
  assert.equal(article.date, DIARY_SERIES_STARTED_ON)
  assert.equal(founder.date, '2026-01-05')
  assert.match(article.summary, /^从 2026-01-05 起/)
  assert.doesNotMatch(article.summary, /口述|机器人整理/)
  assert.doesNotMatch(article.summary, /2026-05-11/)
  assert.equal(DIARY_SERIES_TITLE, '浮生日记')
})

test('异世界的冲击 keeps the oral account and stays within the public draft', () => {
  const { heading, blocks } = shockEntry(diaryArticle())
  const text = blocks.join('\n')
  assert.equal(heading.dateStart, '2026-11-06')
  assert.equal(heading.date, '2026-11-12')
  assert.equal(heading.sourceNote, DIARY_ORAL_SOURCE_NOTE)
  const marked = diaryArticle().content.filter((block) => block?.sourceNote)
  assert.deepEqual(marked.map((block) => block.label), ['异世界的冲击'])
  assert.match(text, /异世界的冲击/)
  assert.match(text, /这里的「异」是异同的异/)
  assert.match(text, /腿部手术已经住院/)
  assert.match(text, /带妻子去复诊/)
  assert.match(text, /小猫利/)
  assert.match(text, /不知道对生活有什么改善，只是有感受/)
  assert.doesNotMatch(text, /notion|诊断|癌症|肿瘤|化疗|病历|手术史/i)
  assert.deepEqual(
    diaryContentFromMarkdown(legacyArticleToMarkdown({ content: [heading, ...blocks] })),
    [heading, ...blocks],
  )
})

test('homepage preview uses the same series and leads with the latest record', () => {
  const preview = previewFromDiary(diaryArticle())
  assert.equal(preview.title, '浮生日记')
  assert.equal(preview.startedOn, '2026-01-05')
  assert.equal(preview.entries[0].label, '异世界的冲击')
  assert.equal(preview.entries[0].span, '2026-11-06～2026-11-12')
  assert.match(preview.entries[0].closing, /只是有感受/)
  assert.equal(preview.entries[0].sourceNote, DIARY_ORAL_SOURCE_NOTE)
  assert.ok(preview.entries.slice(1).every((entry) => !entry.sourceNote))
  assert.equal(preview.entries[0].href, `/diary#${preview.entries[0].id}`)
  assert.ok(preview.entries.length >= 2)
  assert.ok(preview.entries[1].date < preview.entries[0].date)
})

test('an older published snapshot does not hide a later repository entry', () => {
  const archived = diaryArticle()
  assert.equal(archived.content[0].label, '异世界的冲击')
  const older = {
    title: archived.title,
    summary: '旧摘要',
    content: archived.content.slice(9),
  }
  assert.equal(selectDiarySeries(archived, older), archived)

  const newer = {
    title: '线上更新',
    summary: '线上',
    content: [{ date: '2026-12-01', label: '之后的记录', category: '日记' }, '后写的一条'],
  }
  assert.equal(selectDiarySeries(archived, newer), newer)
})

test('homepage and diary page share the series module and the public title', async () => {
  const [home, diary, section] = await Promise.all([
    fs.promises.readFile(path.join(root, 'app/(site)/page.jsx'), 'utf8'),
    fs.promises.readFile(path.join(root, 'app/(site)/diary/page.jsx'), 'utf8'),
    fs.promises.readFile(path.join(root, 'app/(site)/components/HomeDiarySeries.jsx'), 'utf8'),
  ])
  assert.match(home, /previewFromDiary\(findDiaryArticle\(articles\)\)/)
  assert.match(home, /<HomeDiarySeries preview=\{diaryPreview\} \/>/)
  assert.match(diary, /selectDiarySeries\(archived, published\)/)
  assert.match(diary, /publishedTime: toIsoDate\(DIARY_SERIES_STARTED_ON\)/)
  assert.match(diary, /datePublished: toIsoDate\(DIARY_SERIES_STARTED_ON\)/)
  assert.match(section, /\{preview\.title\}/)
  assert.match(section, /className="home-work-stack"/)
  assert.match(section, /className="home-section-title"/)
  assert.doesNotMatch(section, /diary-sheet|These entries are mostly the site owner's spoken accounts/)
  assert.doesNotMatch(diary, /DIARY_SERIES_NOTE|记录主要是站长口述，由机器人整理后公开/)
  assert.match(diary, /diary-entry-source-note/)
  assert.match(diary, /className="diary-sheet diary-page-header"/)
  assert.doesNotMatch(`${home}\n${diary}\n${section}`, /站长字数/)
})
