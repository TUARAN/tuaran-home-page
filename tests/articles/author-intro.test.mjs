import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(
  new URL('../../app/(site)/components/ArticleAuthorIntro.jsx', import.meta.url),
  'utf8',
)

test('author intro is three lines: role, practice, follow and alliance', () => {
  assert.match(source, /前端与智能体工程师 · 技术作者 · 社区 KOL，粉丝 5 万\+/)
  assert.doesNotMatch(source, /AI 前沿部署工程师/)
  assert.match(source, /持续出版多部\[技术作品\]\(\$\{AUTHOR_LIBRARY_URL\}\)/)
  assert.match(source, /持续出版多部[\s\S]*<AuthorOutboundLink href=\{AUTHOR_LIBRARY_URL\}>技术作品<\/AuthorOutboundLink>/)
  assert.match(source, /更多请关注个人\[网络日志\]\(\$\{AUTHOR_SITE_URL\}\)/)
  assert.match(source, /推广合作在\[博主联盟\]\(\$\{AUTHOR_ALLIANCE_URL\}\)/)
  assert.match(source, /target="_blank" rel="noopener noreferrer"[\s\S]*网络日志/)
  assert.doesNotMatch(source, /AUTHOR_LIBRARY_HREF/)
  assert.match(source, /深度参与开源社区与智能体工程实践，全面拥抱 AI 与去中心化/)
  assert.doesNotMatch(source, /持续参与开源社区/)
  assert.match(source, /更多请关注个人网络日志 \$\{AUTHOR_SITE_URL\}/)
  assert.match(source, /推广合作在博主联盟/)
  assert.doesNotMatch(source, /2aran\.com\/about/)
  assert.doesNotMatch(source, /推广与商业合作/)
  assert.doesNotMatch(source, /马斯克/)
  assert.doesNotMatch(source, /早安、午安、晚安/)
  assert.doesNotMatch(source, /x\.2aran\.com/)
})