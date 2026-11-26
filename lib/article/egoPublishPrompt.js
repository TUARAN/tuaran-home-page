// 生成「ego」按钮复制给智能体的发布指令。
// 智能体（首选 Claude Desktop）用 ego lite 浏览器的 Aran 账号，把站内文章发布到外部平台。
// 平台操作要点来自 2026-11-26 一次完整发布的实测记录（掘金 + CSDN），平台改版后在这里更新。

import { ARTICLE_DISTRIBUTION_PLATFORMS } from './articleDistribution.js'

const SITE_ORIGIN = 'https://2aran.com'

export const EGO_BROWSER_PROFILE = {
  name: 'Aran',
  profileId: 'Profile 1',
}

const PLATFORM_GUIDES = {
  juejin: [
    '编辑器是 bytemd（CodeMirror）。正文用 `document.querySelector(\'.CodeMirror\').CodeMirror.setValue(markdown)` 一次性写入，标题填入顶部标题输入框。',
    '写入后检查预览：外链图片可能显示「转存失败」。失败的图片先下载到本地，再用工具栏的图片上传按钮逐张上传，替换为掘金图床地址。',
    '点「发布」打开弹窗：分类按内容选（技术文章一般选「人工智能」或「前端」）；标签要先聚焦 `.publish-popup input.byte-select__input` 再输入，然后点击匹配的 `.byte-select-option`，最多 3 个；封面选正文第一张图；摘要 50–100 字。',
    '发布后用 `https://api.juejin.cn/content_api/v1/article/list_by_user`（带 credentials）核对文章状态，拿到文章 ID 和链接；新文章通常先进入审核。',
  ],
  csdn: [
    '用 Markdown 编辑器 `https://editor.csdn.net/md/`。先点「【无标题】」，再填 `input.article-bar__title`。',
    '正文区是 contenteditable 的 `pre.editor__inner`：聚焦后全选，用键盘粘贴整篇 Markdown。CSDN 会自动把外链图片转存到 i-blog.csdnimg.cn，等预览里的图片全部加载后再继续。',
    '点顶部「发布文章」打开弹窗：添加最多 4 个标签；封面选推荐缩略图后要在「图片编辑」里点「确认上传」；摘要写进摘要文本框（≤256 字）。',
    '文章类型：原创文章选「原创」。翻译或转载要填写原文链接；「翻译」还要求勾选「原文允许翻译或者本次翻译已经获得原文作者授权」。这是权利声明，必须先问我，不能自行勾选。',
    '最后点弹窗底部的红色按钮 `button.btn-b-red`（不是顶部工具栏的 `.btn-publish`）。成功后会跳到 `mp.csdn.net/mp_blog/creation/success/<文章ID>`，文章地址在页面的「查看文章」链接里。',
  ],
}

export const EGO_PUBLISH_PLATFORM_IDS = Object.keys(PLATFORM_GUIDES)

function absolutizeMarkdownUrls(markdown) {
  return String(markdown || '').replace(/(\]\()(\/[^)\s]*)/g, (_, open, path) => `${open}${SITE_ORIGIN}${path}`)
}

function longestBacktickRun(text) {
  let longest = 0
  for (const match of String(text || '').matchAll(/`+/g)) longest = Math.max(longest, match[0].length)
  return longest
}

function cleanLine(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

export function buildEgoPublishPrompt({
  title,
  url,
  summary = '',
  tags = [],
  markdown = '',
  platformIds = EGO_PUBLISH_PLATFORM_IDS,
} = {}) {
  const platforms = ARTICLE_DISTRIBUTION_PLATFORMS.filter(
    (platform) => platformIds.includes(platform.id) && PLATFORM_GUIDES[platform.id],
  )
  const body = absolutizeMarkdownUrls(markdown).trim()
  const fence = '`'.repeat(Math.max(3, longestBacktickRun(body) + 1))
  const tagList = (Array.isArray(tags) ? tags : []).map(cleanLine).filter(Boolean)
  const platformNames = platforms.map((platform) => platform.shortLabel).join('、')

  const lines = [
    `请用 ego lite 浏览器把下面这篇文章发布到${platformNames}。`,
    '',
    '## 浏览器与账号',
    '- 先运行 `ego-browser skill`，按输出的使用指南操作。',
    `- 只用 ego lite 的「${EGO_BROWSER_PROFILE.name}」账号：创建任务空间时传 \`{ profileId: "${EGO_BROWSER_PROFILE.profileId}" }\`。不要用其他 profile，也不要改用别的浏览器。`,
    '- 每个平台先确认已登录；未登录就把任务空间交给我登录（handOff），我回复后再继续。',
    '- 全部完成后关闭任务空间（`finish({ keep: [] })`）。',
    '',
    '## 文章信息',
    `- 标题：${cleanLine(title)}`,
    `- 站内原文：${url}`,
    summary ? `- 摘要：${cleanLine(summary)}` : null,
    tagList.length ? `- 站内标签：${tagList.join('、')}（按各平台可选标签就近匹配）` : null,
    '- 文章类型：正文开头注明转译 / 转载外部原文时，按「翻译」或「转载」发布并填写那个原文链接；否则选「原创」。',
    '',
    '## 通用要求',
    '- 正文使用下方 Markdown 原文，保留图片、代码块、引用和标题层级；开头的作者署名行保留。',
    '- 正文里指代站点的「本站」改成「我的个人站」，其他内容不改写。',
    '- 摘要按平台字数限制从上面的摘要压缩，不编造正文没有的信息。',
    '- 每个平台发布前在预览里核对：标题、图片全部加载、代码块数量、章节标题。',
    '- 涉及权利声明（翻译授权、原创声明、转载许可）的勾选项，先停下来问我。',
    '- 完成后汇报每个平台的文章链接（或文章 ID）和审核状态。',
    '',
  ]

  for (const platform of platforms) {
    lines.push(`## ${platform.shortLabel}（${platform.home}）`)
    for (const step of PLATFORM_GUIDES[platform.id]) lines.push(`- ${step}`)
    lines.push('')
  }

  lines.push('## Markdown 原文', '', `${fence}markdown`, body, fence, '')

  return lines.filter((line) => line !== null).join('\n')
}
