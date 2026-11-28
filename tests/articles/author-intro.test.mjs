import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(
  new URL('../../app/(site)/components/ArticleAuthorIntro.jsx', import.meta.url),
  'utf8',
)
const markdownSource = await readFile(
  new URL('../../lib/site/authorIntroMarkdown.js', import.meta.url),
  'utf8',
)

test('author intro: site byline is two lines; distribution markdown keeps third引流 line', () => {
  const bylineSource = source.match(/export function AuthorByline\(\)[\s\S]*?\n\}/)?.[0] ?? ''
  assert.doesNotMatch(bylineSource, /网络日志/)
  assert.doesNotMatch(bylineSource, /博主联盟/)
  assert.match(markdownSource, /AUTHOR_INTRO_MARKDOWN[\s\S]*AUTHOR_LINE_3_MARKDOWN/)
  assert.match(markdownSource, /join\('\\n\\n'\)/)
  assert.match(markdownSource, /前端与智能体工程师 · 技术作者 · 社区 KOL，粉丝 5 万\+/)
  assert.doesNotMatch(source, /AI 前沿部署工程师/)
  assert.match(markdownSource, /持续出版多部\[技术作品\]\(\$\{AUTHOR_LIBRARY_URL\}\)/)
  assert.match(source, /持续出版多部[\s\S]*<AuthorOutboundLink href=\{AUTHOR_LIBRARY_URL\}>技术作品<\/AuthorOutboundLink>/)
  assert.match(markdownSource, /更多请关注个人\[网络日志\]\(\$\{AUTHOR_SITE_URL\}\)/)
  assert.match(markdownSource, /推广合作在\[博主联盟\]\(\$\{AUTHOR_ALLIANCE_URL\}\)/)
  assert.doesNotMatch(markdownSource, /AUTHOR_LIBRARY_HREF/)
  assert.match(markdownSource, /深度参与开源社区与智能体工程实践，全面拥抱 AI 与去中心化/)
  assert.doesNotMatch(markdownSource, /持续参与开源社区/)
  assert.match(markdownSource, /更多请关注个人网络日志 \$\{AUTHOR_SITE_URL\}/)
  assert.match(markdownSource, /推广合作在博主联盟/)
  assert.doesNotMatch(source, /2aran\.com\/about/)
  assert.doesNotMatch(source, /推广与商业合作/)
  assert.doesNotMatch(source, /马斯克/)
  assert.doesNotMatch(source, /早安、午安、晚安/)
  assert.doesNotMatch(source, /x\.2aran\.com/)
})