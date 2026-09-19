import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import {
  CZ_MEMOIR_CHAPTERS,
  CZ_MEMOIR_CHAPTER_GROUPS,
  czMemoirChapterPath,
} from '../../lib/czMemoirs.js'
import { readCzMemoirChapter } from '../../lib/czMemoirsContent.js'

const ROOT = process.cwd()

test('CZ memoir catalog exposes 28 unique, locally stored chapters', () => {
  assert.equal(CZ_MEMOIR_CHAPTERS.length, 28)
  assert.equal(new Set(CZ_MEMOIR_CHAPTERS.map((chapter) => chapter.slug)).size, 28)
  assert.equal(CZ_MEMOIR_CHAPTER_GROUPS.length, 7)
  assert.equal(czMemoirChapterPath('00-recommendations'), '/resources/cz-memoirs')

  for (const chapter of CZ_MEMOIR_CHAPTERS) {
    const expected =
      chapter.slug === '00-recommendations'
        ? '/resources/cz-memoirs'
        : `/resources/cz-memoirs/${chapter.slug}`
    assert.equal(czMemoirChapterPath(chapter.slug), expected)
    assert.equal(
      fs.existsSync(path.join(ROOT, 'content', 'resources', 'cz-memoirs', 'chapters', `${chapter.slug}.md`)),
      true,
      `missing chapter source: ${chapter.slug}`,
    )
  }
})

test('CZ memoir renderer keeps rich chapter HTML and rewrites every image to local assets', () => {
  const illustrated = readCzMemoirChapter('05-early-years')
  assert.match(illustrated.html, /src="\/images\/cz-memoirs\/img-001\.jpg"/)
  assert.doesNotMatch(illustrated.html, /src="\/images\/img-/)

  const feud = readCzMemoirChapter('27-twitter-feud')
  assert.match(feud.html, /class="tweet-card tweet-card--star"/)
  assert.match(feud.html, /src="\/images\/cz-memoirs\/twitter-feud\/avatar-star\.jpg"/)
  assert.ok(feud.outline.length >= 5)
})

test('CZ memoir pages no longer depend on the external reading site', () => {
  const page = fs.readFileSync(path.join(ROOT, 'app', '(site)', 'resources', 'cz-memoirs', 'page.jsx'), 'utf8')
  const route = fs.readFileSync(path.join(ROOT, 'app', '(site)', 'resources', 'cz-memoirs', '[chapter]', 'page.jsx'), 'utf8')
  const config = fs.readFileSync(path.join(ROOT, 'next.config.js'), 'utf8')
  assert.doesNotMatch(page, /cz\.fate\.red/)
  assert.doesNotMatch(route, /cz\.fate\.red/)
  assert.match(route, /generateStaticParams/)
  assert.match(route, /dynamicParams = false/)
  assert.match(page, /CzMemoirChapterView/)
  assert.doesNotMatch(page, /完整章节目录/)
  assert.doesNotMatch(page, /查看完整目录/)
  assert.match(config, /\/resources\/cz-memoirs\/00-recommendations/)
})
