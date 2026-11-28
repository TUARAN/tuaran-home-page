/** 分发任务正文文首作者介绍（三行 blockquote，段间空行便于掘金等编辑器换行）。 */

export const AUTHOR_SITE_URL = 'https://2aran.com'
export const AUTHOR_LIBRARY_URL = 'https://2aran.com/resources/books'
export const AUTHOR_ALLIANCE_URL = 'https://blogger-alliance.cn/'

export const AUTHOR_LINE_1 =
  '涂阿燃 · 前端与智能体工程师 · 技术作者 · 社区 KOL，粉丝 5 万+'

export const AUTHOR_LINE_2_TAIL =
  '，深度参与开源社区与智能体工程实践，全面拥抱 AI 与去中心化。'

export const AUTHOR_LINE_2 = `持续出版多部技术作品${AUTHOR_LINE_2_TAIL}`

export const AUTHOR_LINE_2_MARKDOWN =
  `持续出版多部[技术作品](${AUTHOR_LIBRARY_URL})${AUTHOR_LINE_2_TAIL}`

export const AUTHOR_LINE_3 =
  `更多请关注个人网络日志 ${AUTHOR_SITE_URL}；推广合作在博主联盟。`

export const AUTHOR_LINE_3_MARKDOWN =
  `更多请关注个人[网络日志](${AUTHOR_SITE_URL})；推广合作在[博主联盟](${AUTHOR_ALLIANCE_URL})。`

export const AUTHOR_INTRO_MARKDOWN = [
  `> ${AUTHOR_LINE_1}`,
  `> ${AUTHOR_LINE_2_MARKDOWN}`,
  `> ${AUTHOR_LINE_3_MARKDOWN}`,
].join('\n\n')

export const AUTHOR_INTRO_LEAD_RE = /^>\s*涂阿燃\s*·/

export function headSectionLacksAuthorIntro(markdown) {
  const head = String(markdown || '').split(/^##\s+/m)[0] || ''
  return !AUTHOR_INTRO_LEAD_RE.test(head)
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 富文本平台粘贴用 HTML（三行 blockquote，与 AUTHOR_INTRO_MARKDOWN 一致）。 */
export const AUTHOR_INTRO_HTML = [
  `<blockquote><p>${escapeHtml(AUTHOR_LINE_1)}</p></blockquote>`,
  `<blockquote><p>持续出版多部<a href="${AUTHOR_LIBRARY_URL}" target="_blank" rel="noopener noreferrer">技术作品</a>${escapeHtml(AUTHOR_LINE_2_TAIL)}</p></blockquote>`,
  `<blockquote><p>更多请关注个人<a href="${AUTHOR_SITE_URL}" target="_blank" rel="noopener noreferrer">网络日志</a>；推广合作在<a href="${AUTHOR_ALLIANCE_URL}" target="_blank" rel="noopener noreferrer">博主联盟</a>。</p></blockquote>`,
].join('\n')

export function getAuthorIntroHtml() {
  return AUTHOR_INTRO_HTML
}